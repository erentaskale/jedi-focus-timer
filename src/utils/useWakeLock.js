import { useEffect } from 'react';

// Sayaç çalışırken ekranın uykuya geçmesini engeller (destekleyen tarayıcılarda).
// Sekmeden çıkınca tarayıcı kilidi bırakır; geri dönünce yeniden istenir.
export const useWakeLock = (enabled) => {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) next.release();
        else lock = next;
      } catch {
        // Pil tasarrufu modu vb. yüzünden reddedilebilir; sayaç yine çalışır.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release();
    };
  }, [enabled]);
};
