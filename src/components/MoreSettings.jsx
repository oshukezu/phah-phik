import './MoreSettings.css';

const SOUND_OPTIONS = [
  { id: 'wood', label: '木質' },
  { id: 'electronic', label: '電子' },
  { id: 'bell', label: '清脆' },
  { id: 'goose', label: '鵝叫' },
  { id: 'boing', label: '彈簧' },
  { id: 'frog', label: '蛙鳴' },
];

function Toggle({ label, pressed, onClick }) {
  return (
    <button
      type="button"
      className={`toggle-btn ${pressed ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={pressed}
    >
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-text">{label}</span>
    </button>
  );
}

export default function MoreSettings({
  open,
  onToggleOpen,
  accentEnabled,
  onAccentChange,
  flashEnabled,
  onFlashChange,
  volume,
  onVolumeChange,
  sound,
  onSoundChange,
  themeMode,
  onThemeChange,
  onShowTutorial,
}) {
  const volumePercent = Math.round(volume * 100);

  const handleVolumeChange = (e) => {
    onVolumeChange(Number(e.target.value) / 100);
  };

  return (
    <section className="more-settings" aria-label="更多設定">
      <button
        type="button"
        className="more-toggle"
        onClick={onToggleOpen}
        aria-expanded={open}
      >
        {open ? '▲ 收合更多設定' : '▼ 更多設定'}
      </button>

      {open && (
        <div className="more-body">
          <div className="more-row">
            <Toggle
              label="重拍"
              pressed={accentEnabled}
              onClick={() => onAccentChange(!accentEnabled)}
            />
            <Toggle
              label="節奏閃爍"
              pressed={flashEnabled}
              onClick={() => onFlashChange(!flashEnabled)}
            />
          </div>

          <div className="more-group volume-group">
            <div className="volume-header">
              <span className="more-label">音量</span>
              <span className="volume-value" aria-live="polite">{volumePercent}%</span>
            </div>
            <input
              type="range"
              className="volume-slider"
              min={0}
              max={100}
              step={1}
              value={volumePercent}
              onChange={handleVolumeChange}
              aria-label="音量"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volumePercent}
            />
          </div>

          <div className="more-group">
            <span className="more-label">音色</span>
            <div className="seg-group seg-sounds">
              {SOUND_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`seg-btn ${sound === id ? 'active' : ''}`}
                  onClick={() => onSoundChange(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="more-group">
            <span className="more-label">外觀</span>
            <div className="seg-group seg-theme">
              <button
                type="button"
                className={`seg-btn ${themeMode === 'system' ? 'active' : ''}`}
                onClick={() => onThemeChange('system')}
              >
                跟隨系統
              </button>
              <button
                type="button"
                className={`seg-btn ${themeMode === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                日間
              </button>
              <button
                type="button"
                className={`seg-btn ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                夜間
              </button>
            </div>
          </div>

          <button type="button" className="text-btn" onClick={onShowTutorial}>
            再看使用教學
          </button>
        </div>
      )}
    </section>
  );
}
