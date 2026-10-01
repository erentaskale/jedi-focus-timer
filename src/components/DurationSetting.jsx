import { useState } from 'react';

// Süre ayarı (dakika): +/- butonları, klavyeyle yazma ve ok tuşları.
// Değer saniye olarak gelir/gider. Yazarken "draft"ta tutulur;
// kutudan çıkınca ya da Enter'da uygulanır, Esc geri alır.
const DurationSetting = ({ id, label, value, min, max, disabled, onChange }) => {
  const [draft, setDraft] = useState(null); // null = düzenlenmiyor
  const minutes = Math.round(value / 60);

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (!Number.isNaN(parsed)) onChange(parsed * 60);
    setDraft(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setDraft(null);
      e.currentTarget.blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 5 : 1);
      setDraft(null);
      onChange((minutes + step) * 60);
    }
  };

  return (
    <div className="setting-group">
      <label className="setting-label" htmlFor={id}>{label}</label>
      <div className="setting-controls">
        <button
          type="button"
          onClick={() => onChange((minutes - 1) * 60)}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          -
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft ?? String(minutes)}
          disabled={disabled}
          onFocus={(e) => {
            setDraft(String(minutes));
            e.target.select();
          }}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          title={`${min / 60}–${max / 60} min · ↑/↓ to adjust (Shift = 5)`}
        />
        <button
          type="button"
          onClick={() => onChange((minutes + 1) * 60)}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default DurationSetting;
