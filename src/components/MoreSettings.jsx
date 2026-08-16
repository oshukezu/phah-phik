import './MoreSettings.css';

function Toggle({ label, pressed, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`toggle-btn ${pressed ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
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
  sound,
  onSoundChange,
  themeMode,
  onThemeChange,
  onShowTutorial,
  disabled,
}) {
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
              disabled={disabled}
            />
            <Toggle
              label="節奏閃爍"
              pressed={flashEnabled}
              onClick={() => onFlashChange(!flashEnabled)}
              disabled={disabled}
            />
          </div>

          <div className="more-group">
            <span className="more-label">音色</span>
            <div className="seg-group">
              <button
                type="button"
                className={`seg-btn ${sound === 'wood' ? 'active' : ''}`}
                onClick={() => onSoundChange('wood')}
                disabled={disabled}
              >
                木質
              </button>
              <button
                type="button"
                className={`seg-btn ${sound === 'electronic' ? 'active' : ''}`}
                onClick={() => onSoundChange('electronic')}
                disabled={disabled}
              >
                電子
              </button>
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
            再看安裝教學
          </button>
        </div>
      )}
    </section>
  );
}
