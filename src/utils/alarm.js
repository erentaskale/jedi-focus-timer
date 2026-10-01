// Süre bitince çalan alarm (public/assets/alarm.mp3).
//
// Alarm START anında tarayıcının ses saatine "tam bitiş anında çal" diye kurulur.
// Normal zamanlayıcılar arka plandaki sekmede yavaşlatılabilir (Chrome'da dakikada bire
// kadar); ses saati yavaşlatılmaz, böylece alarm sekme arka plandayken de zamanında çalar.
//
// Tarayıcılar sesi ancak bir tıklama/tuştan sonra açar; unlockAudio bu yüzden
// kullanıcı etkileşiminde çağrılır.

const ALARM_URL = `${import.meta.env.BASE_URL}assets/alarm.mp3`;
const VOLUME = 0.6;
const FADE_IN = 0.3; // sn
const FADE_OUT = 2; // sn, parça kendiliğinden biterken
const STOP_FADE = 0.4; // sn, kullanıcı susturunca

let ctx = null;
let buffer = null;
let loading = null;
let current = null; // { source, gain, startAt }
let requestId = 0; // eski (iptal edilmiş) kurma isteklerini ayırt etmek için

const loadBuffer = () => {
  loading ??= fetch(ALARM_URL)
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data))
    .then((decoded) => (buffer = decoded))
    .catch(() => (loading = null));
  return loading;
};

// START'a basılınca (bir tıklama içinde) ses hazırlanmış mı? Yenilemeden sonra henüz değildir.
export const hasAudio = () => ctx !== null;

export const unlockAudio = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  loadBuffer();
};

const play = (startAt) => {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  const end = startAt + buffer.duration;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(VOLUME, startAt + FADE_IN);
  gain.gain.setValueAtTime(VOLUME, end - FADE_OUT);
  gain.gain.linearRampToValueAtTime(0, end);
  source.connect(gain).connect(ctx.destination);
  source.start(startAt);
  source.onended = () => {
    if (current?.source === source) current = null;
  };
  current = { source, gain, startAt };
};

// Alarmı endTime (ms, Date.now cinsinden) anına kurar.
export const scheduleAlarm = async (endTime) => {
  stopAlarm();
  if (!ctx) return;
  const id = ++requestId;
  await loadBuffer();
  if (id !== requestId || !buffer) return; // bu arada iptal edildi
  const delay = Math.max(0, (endTime - Date.now()) / 1000);
  play(ctx.currentTime + delay);
};

// Henüz çalmaya başlamamış alarmı iptal eder (duraklat, sıfırla, mod değiştir).
// Çalmaya başlamış alarma dokunmaz.
export const cancelPendingAlarm = () => {
  requestId++;
  if (current && ctx && current.startAt > ctx.currentTime) {
    current.source.stop();
    current = null;
  }
};

// Süre bittiğinde çağrılır: bilgisayar uyuyup uyandıysa ses saati geride kalmış olabilir;
// alarm hâlâ ileri bir ana kuruluysa hemen çalar.
export const ringNow = () => {
  if (!ctx || !buffer) return;
  if (current && current.startAt <= ctx.currentTime + 0.1) return; // zaten çalıyor
  stopAlarm();
  play(ctx.currentTime);
};

// Çalan alarmı yumuşakça susturur.
export const stopAlarm = () => {
  requestId++;
  if (!current || !ctx) return;
  const { source, gain } = current;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + STOP_FADE);
  source.stop(now + STOP_FADE);
  current = null;
};

// Alarm çalmaya başlayınca herhangi bir tıklama ya da tuş onu susturur.
export const stopAlarmOnInteraction = () => {
  const stop = () => {
    window.removeEventListener('pointerdown', stop);
    window.removeEventListener('keydown', stop);
    stopAlarm();
  };
  window.addEventListener('pointerdown', stop);
  window.addEventListener('keydown', stop);
};
