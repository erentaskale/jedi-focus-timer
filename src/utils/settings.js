// Modlar ve süre sınırları (saniye cinsinden tutulur, ama hep tam dakika)
export const MODES = ['focus', 'break'];

export const MODE_LABELS = {
  focus: 'Focus',
  break: 'Break',
};

export const LIMITS = {
  focus: { min: 60, max: 90 * 60 },
  break: { min: 60, max: 30 * 60 },
};

const DEFAULT_DURATIONS = { focus: 25 * 60, break: 5 * 60 };

const KEYS = {
  durations: 'jedi-timer-durations-v2',
  session: 'jedi-timer-session',
};

export const clampDuration = (mode, seconds) => {
  const { min, max } = LIMITS[mode];
  const minutes = Math.round(seconds / 60) * 60;
  return Math.min(max, Math.max(min, minutes));
};

// localStorage gizli pencerede ya da kapalıyken hata verebilir; o zaman varsayılanlar kullanılır.
const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Kaydedilemezse ayarlar sadece bu oturumda kalır.
  }
};

export const loadDurations = () => {
  const saved = read(KEYS.durations);
  return Object.fromEntries(
    MODES.map((m) => [m, clampDuration(m, Number(saved?.[m]) || DEFAULT_DURATIONS[m])])
  );
};
export const saveDurations = (durations) => write(KEYS.durations, durations);


// Süren seans: sayfa yenilenir ya da sekme kapanıp açılırsa kaldığı yerden devam eder.
// Çalışıyorsa bitiş anı (endTime), duraklatılmışsa kalan süre (timeLeft) saklanır.
export const saveSession = (session) => write(KEYS.session, session);

export const loadSession = (durations) => {
  const saved = read(KEYS.session);
  const fresh = { mode: 'focus', timeLeft: durations.focus, isActive: false, endTime: null };
  if (!saved || !MODES.includes(saved.mode)) return fresh;

  const full = durations[saved.mode];
  if (saved.isActive) {
    const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
    if (remaining > 0 && remaining <= full) {
      return { mode: saved.mode, timeLeft: remaining, isActive: true, endTime: saved.endTime };
    }
    // Biz yokken süre dolmuş: sıradaki moda geç, başlamayı bekle.
    const next = saved.mode === 'focus' ? 'break' : 'focus';
    return { mode: next, timeLeft: durations[next], isActive: false, endTime: null };
  }

  const timeLeft = Number(saved.timeLeft);
  return {
    mode: saved.mode,
    timeLeft: timeLeft > 0 && timeLeft <= full ? timeLeft : full,
    isActive: false,
    endTime: null,
  };
};
