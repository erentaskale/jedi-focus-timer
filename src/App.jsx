import { useState, useEffect, useRef } from 'react';
import { useWakeLock } from './utils/useWakeLock';
import MainPanel from './components/MainPanel';
import Toolbar from './components/Toolbar';
import { formatTime } from './utils/time';
import {
  hasAudio,
  unlockAudio,
  scheduleAlarm,
  cancelPendingAlarm,
  ringNow,
  stopAlarm,
  stopAlarmOnInteraction,
} from './utils/alarm';
import {
  LIMITS,
  MODE_LABELS,
  clampDuration,
  loadDurations,
  saveDurations,
  loadSession,
  saveSession,
} from './utils/settings';

const secondsLeftUntil = (endTime) => Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

// Bitiş efekti: kılıç parlar (CSS bladeFlash ile aynı süre), sonra eski renginde geri çekilir.
const FLASH_MS = 1200;
const RETRACT_MS = 1000; // CSS'teki width geçişiyle aynı

function App() {
  const [durations, setDurations] = useState(loadDurations); // saniye
  // Yenilemeden önce süren bir seans varsa oradan devam edilir.
  const [initial] = useState(() => loadSession(durations));
  const [mode, setMode] = useState(initial.mode); // 'focus' | 'break'
  const [timeLeft, setTimeLeft] = useState(initial.timeLeft);
  const [isActive, setIsActive] = useState(initial.isActive);
  // Ses izni: tarayıcı, sayfaya ilk tıklama/tuştan önce ses çaldırmaz (yenilemeden sonra da).
  const [audioReady, setAudioReady] = useState(hasAudio);
  // Bitiş efekti: { mode, phase: 'flash' | 'retract' } ya da null
  const [finishFx, setFinishFx] = useState(null);

  // Bitiş anı (ms). Saniye saymak yerine saate bakıyoruz:
  // sekme arka planda kalsa ya da bilgisayar uyusa bile kalan süre doğru çıkar.
  const endTimeRef = useRef(initial.endTime);

  useWakeLock(isActive);

  const totalSeconds = durations[mode];

  // Sayaç: sadece çalışırken kurulur.
  useEffect(() => {
    if (!isActive) return;

    const tick = () => {
      const remaining = secondsLeftUntil(endTimeRef.current);
      if (remaining > 0) {
        setTimeLeft(remaining);
        return;
      }

      // Süre bitti: alarm (zaten kuruluydu; geç kaldıysa hemen çalar), diğer moda geç ve dur.
      const nextMode = mode === 'focus' ? 'break' : 'focus';
      ringNow();
      stopAlarmOnInteraction();

      setFinishFx({ mode, phase: 'flash' });
      setIsActive(false);
      setMode(nextMode);
      setTimeLeft(durations[nextMode]);
    };

    // Saniyede birkaç kez bakmak, ekrandaki saniyenin gerçek saate yakın kalmasını sağlar.
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isActive, mode, durations]);

  // Alarm, sayaç çalıştığı sürece bitiş anına kurulu durur; duraklat/sıfırla/mod değiştir
  // deyince (henüz çalmadıysa) iptal edilir. Yenilemeden sonra devam eden seansta ses
  // ancak ilk tıklama/tuşla açılabildiği için kurma o ana bırakılır.
  useEffect(() => {
    if (!isActive) return;
    const schedule = () => scheduleAlarm(endTimeRef.current);
    const onFirstInteraction = () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      unlockAudio();
      setAudioReady(true);
      schedule();
    };

    if (hasAudio()) {
      schedule();
    } else {
      window.addEventListener('pointerdown', onFirstInteraction);
      window.addEventListener('keydown', onFirstInteraction);
    }
    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      cancelPendingAlarm();
    };
  }, [isActive]);

  // Sekme başlığında kalan süre.
  useEffect(() => {
    const inSession = isActive || timeLeft < totalSeconds;
    document.title = inSession
      ? `${formatTime(timeLeft)} · ${MODE_LABELS[mode]}`
      : 'Jedi Focus Timer';
  }, [isActive, timeLeft, totalSeconds, mode]);

  useEffect(() => saveDurations(durations), [durations]);
  useEffect(() => {
    saveSession({ mode, timeLeft, isActive, endTime: isActive ? endTimeRef.current : null });
  }, [mode, timeLeft, isActive]);

  // Parlama → geri çekilme → efekt biter, kılıç yeni modun rengini alır.
  useEffect(() => {
    if (!finishFx) return;
    const timeout = setTimeout(
      () => setFinishFx(finishFx.phase === 'flash' ? { ...finishFx, phase: 'retract' } : null),
      finishFx.phase === 'flash' ? FLASH_MS : RETRACT_MS
    );
    return () => clearTimeout(timeout);
  }, [finishFx]);

  const handleToggleActive = () => {
    if (isActive) {
      // Duraklat: kalan süreyi saatten hesaplayıp sabitle.
      setTimeLeft(secondsLeftUntil(endTimeRef.current));
      setIsActive(false);
    } else {
      // Başlat: çalan alarm varsa sustur, sesi hazırla, bitiş anını bir kez not al.
      stopAlarm();
      unlockAudio();
      setAudioReady(true);
      endTimeRef.current = Date.now() + timeLeft * 1000;
      setFinishFx(null);
      setIsActive(true);
    }
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setFinishFx(null);
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(durations[newMode]);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(totalSeconds);
  };

  // Süreler sadece sayaç dururken değişir; çalışırken değişirse kılıç zıplıyordu.
  const handleSetDuration = (type, seconds) => {
    if (isActive) return;
    const value = clampDuration(type, seconds);
    setDurations((prev) => ({ ...prev, [type]: value }));
    if (type === mode) setTimeLeft(value);
  };

  // Klavye kısayolları (Toolbar'daki listeyle aynı tutulmalı).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      // Süre alanlarını düzenlerken kısayollar devre dışı.
      if (e.target.closest('input, textarea, select, [role="spinbutton"]')) return;

      const key = e.key.toLowerCase();
      if (key === ' ') {
        // Odak bir butondaysa Space zaten o butona basar; ikinci kez tetikleme.
        if (e.target.closest('button')) return;
        e.preventDefault();
        handleToggleActive();
      } else if (key === 'r') {
        handleReset();
      } else if (key === 'f') {
        handleModeSwitch('focus');
      } else if (key === 'b') {
        handleModeSwitch('break');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // İlerleme (0 → 100): süre azaldıkça kılıç uzar. Bitiş efektinde önce tam boy, sonra 0.
  const progressPercent = finishFx
    ? finishFx.phase === 'flash' ? 100 : 0
    : ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const bladeMode = finishFx?.mode ?? mode;
  const isFlashing = finishFx?.phase === 'flash';


  return (
    <div className="scene-container">
      <div className="scene-wrapper">
        <img
          src={`${import.meta.env.BASE_URL}assets/jedi.webp`}
          alt=""
          width="1942"
          height="809"
          className="scene-image"
        />

        {/* Işın Kılıcı Barı */}
        <div className="lightsaber-container">
          <div
            className={`lightsaber-blade ${bladeMode} ${isActive ? 'active' : ''} ${isFlashing ? 'flash' : ''}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <MainPanel
        mode={mode}
        timeLeft={timeLeft}
        isActive={isActive}
        durations={durations}
        limits={LIMITS}
        onModeSwitch={handleModeSwitch}
        onToggleActive={handleToggleActive}
        onReset={handleReset}
        onSetDuration={handleSetDuration}
      />

      {/* Yenilemeden sonra sayaç çalışıyor ama ses henüz izinli değilse uyarı ikonu */}
      <Toolbar showAudioHint={isActive && !audioReady} />
    </div>
  );
}

export default App;
