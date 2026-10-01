import { useRef, useState } from 'react';

const pad = (n) => n.toString().padStart(2, '0');

// Büyük saat. Sayaç dururken dakikaya tıklanıp süre ayarlanabilir:
// rakam yaz, ↑/↓ ya da fare tekerleği ile artır/azalt (Shift ile 5'er), Enter onay, Esc vazgeç.
const TimeDisplay = ({ seconds, mode, editable, label, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [buffer, setBuffer] = useState('');
  // Blur, state güncellenmeden çalışabilir; yazılan rakamı ref'ten okuyoruz.
  const bufferRef = useRef('');

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  const setBuf = (value) => {
    bufferRef.current = value;
    setBuffer(value);
  };

  const commit = () => {
    const typed = bufferRef.current;
    setBuf('');
    if (typed) onChange(parseInt(typed, 10) * 60);
  };

  const step = (direction, big) => {
    setBuf('');
    onChange((m + direction * (big ? 5 : 1)) * 60);
  };

  const handleKeyDown = (e) => {
    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const next = bufferRef.current.length >= 2 ? e.key : bufferRef.current + e.key;
      setBuf(next);
      if (next.length === 2) commit();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setBuf(bufferRef.current.slice(0, -1));
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      step(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setBuf('');
      e.currentTarget.blur();
    }
  };

  const minutesText = editing && buffer ? buffer.padStart(2, '0') : pad(m);

  return (
    <div className={`timer-display ${mode}`} role="timer">
      {editable ? (
        <span
          tabIndex={0}
          role="spinbutton"
          aria-label={`${label} minutes`}
          aria-valuenow={m}
          title="Click to set minutes"
          className={`time-seg ${editing ? 'editing' : ''}`}
          onFocus={() => {
            setEditing(true);
            setBuf('');
          }}
          onBlur={() => {
            commit();
            setEditing(false);
          }}
          onKeyDown={handleKeyDown}
          onWheel={(e) => step(e.deltaY < 0 ? 1 : -1, e.shiftKey)}
        >
          {minutesText}
        </span>
      ) : (
        <span>{minutesText}</span>
      )}
      <span className="time-colon">:</span>
      <span>{pad(s)}</span>
    </div>
  );
};

export default TimeDisplay;
