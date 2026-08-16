import { useEffect } from 'react';
import {
  useMediaQuery,
  SETTINGS_SHEET_QUERY,
  SETTINGS_SIDEBAR_QUERY,
} from '../hooks/useMediaQuery';
import './MoreSettings.css';

const SOUND_OPTIONS = [
  { id: 'wood', label: '木質' },
  { id: 'electronic', label: '電子' },
  { id: 'bell', label: '清脆' },
  { id: 'laser', label: '雷射' },
  { id: 'frog', label: '蛙鳴' },
  { id: 'goose', label: '鵝叫' },
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

function SettingsBody({
  accentEnabled,
  onAccentChange,
  flashEnabled,
  onFlashChange,
  volumePercent,
  onVolumeChange,
  sound,
  onSoundChange,
  themeMode,
  onThemeChange,
  onShowTutorial,
}) {
  const handleVolumeChange = (e) => {
    onVolumeChange(Number(e.target.value) / 100);
  };

  return (
    <>
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
              className={`seg-btn ${
                sound === id ? (id === 'goose' ? 'active-goose' : 'active') : ''
              }`}
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
    </>
  );
}

function getSettingsBodyProps({
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
  return {
    accentEnabled,
    onAccentChange,
    flashEnabled,
    onFlashChange,
    volumePercent: Math.round(volume * 100),
    onVolumeChange,
    sound,
    onSoundChange,
    themeMode,
    onThemeChange,
    onShowTutorial,
  };
}

export function MoreSettingsSidebar(props) {
  const useSheet = useMediaQuery(SETTINGS_SHEET_QUERY);
  const useSidebar = useMediaQuery(SETTINGS_SIDEBAR_QUERY);
  const showSidebar = props.open && useSidebar && !useSheet;

  if (!showSidebar) return null;

  return (
    <aside className="more-sidebar" aria-label="更多設定">
      <h2 className="more-sidebar-title">更多設定</h2>
      <SettingsBody {...getSettingsBodyProps(props)} />
    </aside>
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
  const useSheet = useMediaQuery(SETTINGS_SHEET_QUERY);
  const useSidebar = useMediaQuery(SETTINGS_SIDEBAR_QUERY);
  const showSheet = open && useSheet;
  const showInline = open && !useSheet && !useSidebar;
  const bodyProps = getSettingsBodyProps({
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
  });

  useEffect(() => {
    if (!showSheet) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onToggleOpen();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showSheet, onToggleOpen]);

  return (
    <>
      {showSheet && (
        <button
          type="button"
          className="more-sheet-backdrop"
          aria-label="關閉更多設定"
          onClick={onToggleOpen}
        />
      )}

      <section className="more-settings" aria-label="更多設定">
        <button
          type="button"
          className="more-toggle"
          onClick={onToggleOpen}
          aria-expanded={open}
        >
          {open ? '▲ 收合更多設定' : '▼ 更多設定'}
        </button>

        {showInline && (
          <div className="more-body">
            <SettingsBody {...bodyProps} />
          </div>
        )}
      </section>

      {showSheet && (
        <div
          className="more-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-sheet-title"
        >
          <div className="more-sheet-handle" aria-hidden="true" />
          <h2 id="more-sheet-title" className="more-sheet-title">更多設定</h2>
          <div className="more-sheet-body">
            <SettingsBody {...bodyProps} />
          </div>
        </div>
      )}
    </>
  );
}
