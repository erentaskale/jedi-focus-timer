import './MainPanel.css';
import DurationSetting from './DurationSetting';
import TimeDisplay from './TimeDisplay';
import { MODES, MODE_LABELS } from '../utils/settings';

const MODE_BUTTONS = {
  focus: { text: 'FOCUS', key: 'F' },
  break: { text: 'BREAK', key: 'B' },
};

const SETTING_LABELS = {
  focus: 'FOCUS (MIN)',
  break: 'BREAK (MIN)',
};

const MainPanel = ({
  mode,
  timeLeft,
  isActive,
  durations,
  limits,
  onModeSwitch,
  onToggleActive,
  onReset,
  onSetDuration
}) => {
  return (
    <div className="main-panel-wrapper">
      <div className="main-panel-border"></div>
      <div className="main-panel-content">
        <div className="panel-header">
          <h1 className="panel-title">JEDI FOCUS TIMER</h1>
          <p className="panel-subtitle">"MAY FOCUS BE WITH YOU"</p>
        </div>

        <div className="mode-selector">
          {MODES.map((m) => (
            <button
              key={m}
              className={`mode-btn ${m} ${mode === m ? 'active' : ''}`}
              onClick={() => onModeSwitch(m)}
              aria-pressed={mode === m}
              title={`${MODE_LABELS[m]} (${MODE_BUTTONS[m].key})`}
            >
              {MODE_BUTTONS[m].text}
            </button>
          ))}
        </div>

        <TimeDisplay
          seconds={timeLeft}
          mode={mode}
          editable={!isActive}
          label={MODE_LABELS[mode]}
          onChange={(s) => onSetDuration(mode, s)}
        />

        <div className="main-controls">
          <button
            className={`control-btn start-btn ${isActive ? 'pause' : ''}`}
            onClick={onToggleActive}
            title="Start / Pause (Space)"
          >
            {isActive ? 'PAUSE' : 'START'}
          </button>
          <button className="control-btn reset-btn" onClick={onReset} title="Reset (R)">
            RESET
          </button>
        </div>

        <div className={`settings-panel ${isActive ? 'locked' : ''}`}>
          {MODES.map((m) => (
            <DurationSetting
              key={m}
              id={`${m}-duration`}
              label={SETTING_LABELS[m]}
              value={durations[m]}
              min={limits[m].min}
              max={limits[m].max}
              disabled={isActive}
              onChange={(v) => onSetDuration(m, v)}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default MainPanel;
