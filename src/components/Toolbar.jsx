import { useEffect, useState } from 'react';
import './Toolbar.css';

const SHORTCUTS = [
  ['Space', 'Start / pause'],
  ['R', 'Reset'],
  ['F / B', 'Focus / break'],
  ['Click minutes', 'Type a new duration'],
  ['↑ / ↓', 'Adjust minutes (Shift = 5)'],
];

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="tool-icon" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

// Ekranın köşesindeki küçük ikonlar: (gerekirse) ses uyarısı, tam ekran, kısayollar.
const Toolbar = ({ showAudioHint }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Yardım kutusu açıkken Esc ya da dışarı tıklama kapatır.
  useEffect(() => {
    if (!showHelp) return;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest('.toolbar')) {
        setShowHelp(false);
      }
    };
    window.addEventListener('keydown', close);
    window.addEventListener('pointerdown', close);
    return () => {
      window.removeEventListener('keydown', close);
      window.removeEventListener('pointerdown', close);
    };
  }, [showHelp]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const canFullscreen = Boolean(document.documentElement.requestFullscreen);

  return (
    <div className="toolbar">
      {/* Herhangi bir tıklama sesi açar; ikon sadece bunu haber verir ve tıklanınca kaybolur. */}
      {showAudioHint && (
        <button className="tool-btn audio-hint" title="Alarm sound is off — click anywhere to enable">
          <Icon>
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            <path d="m16 9 6 6m0-6-6 6" />
          </Icon>
        </button>
      )}

      {canFullscreen && (
        <button
          className="tool-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Icon>
            {isFullscreen ? (
              <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
            ) : (
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
            )}
          </Icon>
        </button>
      )}

      <button
        className={`tool-btn ${showHelp ? 'on' : ''}`}
        onClick={() => setShowHelp((v) => !v)}
        aria-expanded={showHelp}
        title="Keyboard shortcuts"
      >
        <Icon>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </Icon>
      </button>

      {showHelp && (
        <div className="shortcut-help" role="dialog" aria-label="Keyboard shortcuts">
          {SHORTCUTS.map(([keys, action]) => (
            <div key={keys} className="shortcut-row">
              <kbd>{keys}</kbd>
              <span>{action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
