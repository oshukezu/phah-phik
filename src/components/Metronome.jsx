import { useState, useCallback } from 'react';
import { useMetronome } from '../hooks/useMetronome';
import {
  useSettingsState,
  clampTimer,
  clampBeats,
  clampNoteValue,
  isStandalone,
  loadRaw,
} from '../hooks/useSettings';
import { useWakeLock } from '../hooks/useWakeLock';
import { usePracticeTimer } from '../hooks/usePracticeTimer';
import { useTheme } from '../hooks/useTheme';
import MoreSettings from './MoreSettings';
import TutorialOverlay from './TutorialOverlay';
import './Metronome.css';

const PRESETS = ['2', '3', '4'];

export default function Metronome() {
  const { settings, save, clampBpm } = useSettingsState();
  const { themeMode, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(
    () => !isStandalone() && !loadRaw().tutorialDismissed
  );
  const [practiceEnd, setPracticeEnd] = useState(false);
  const [bpmInput, setBpmInput] = useState(String(settings.bpm));
  const [timerInput, setTimerInput] = useState(
    settings.timerMinutes > 0 ? String(settings.timerMinutes) : ''
  );

  const onBpmChange = useCallback((bpm) => {
    const v = clampBpm(bpm);
    save({ bpm: v });
    setBpmInput(String(v));
  }, [save, clampBpm]);

  const {
    isPlaying,
    currentBeat,
    beatTick,
    toggle,
    stop,
    clampBpm: clampBpmEngine,
  } = useMetronome({
    bpm: settings.bpm,
    beats: settings.beats,
    sound: settings.sound,
    accentEnabled: settings.accentEnabled,
    onBpmChange,
  });

  const { hasSupport: hasWakeLock } = useWakeLock(isPlaying);

  const onTimerComplete = useCallback(() => {
    stop();
    setPracticeEnd(true);
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => setPracticeEnd(false), 2500);
  }, [stop]);

  const { hasTimer, display: timerDisplay } = usePracticeTimer(
    isPlaying,
    settings.timerMinutes,
    onTimerComplete
  );

  const isBeatFlash = isPlaying && settings.flashEnabled;

  const handleBpmFocus = (e) => {
    setBpmInput(String(settings.bpm));
    e.target.select();
  };

  const handleBpmBlur = () => {
    const raw = parseInt(bpmInput, 10);
    const v = Number.isFinite(raw) ? clampBpmEngine(raw) : settings.bpm;
    onBpmChange(v);
  };

  const handleTimerBlur = () => {
    const raw = timerInput === '' ? 0 : parseInt(timerInput, 10);
    const v = Number.isFinite(raw) ? clampTimer(raw) : 0;
    save({ timerMinutes: v });
    setTimerInput(v > 0 ? String(v) : '');
  };

  const applyPreset = (preset) => {
    if (isPlaying) return;
    if (preset === 'custom') {
      save({ timeSigMode: 'custom' });
      return;
    }
    const beats = Number(preset);
    save({ beats, noteValue: 4, timeSigMode: preset });
  };

  const dismissTutorial = () => {
    save({ tutorialDismissed: true });
    setShowTutorial(false);
  };

  const manyDots = settings.beats > 8;

  return (
    <div className="metronome">
      {isBeatFlash && (
        <div
          key={beatTick}
          className={`edge-glow active ${
            currentBeat === 0 && settings.accentEnabled ? 'accent' : ''
          }`}
        >
          <div className="edge-glow-top" />
          <div className="edge-glow-bottom" />
          <div className="edge-glow-left" />
          <div className="edge-glow-right" />
        </div>
      )}

      <div className="bpm-block">
        <label className="bpm-input-wrap" htmlFor="bpm-input">
          <input
            id="bpm-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="bpm-input"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            onFocus={handleBpmFocus}
            onBlur={handleBpmBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            disabled={isPlaying}
            aria-label="每分鐘拍數"
          />
          <span className="bpm-label">每分鐘拍數</span>
        </label>

        <div
          className={`beat-dots ${manyDots ? 'beat-dots-many' : ''}`}
          aria-label="拍點指示"
        >
          {Array.from({ length: settings.beats }, (_, i) => (
            <span
              key={i}
              className={[
                'beat-dot',
                isPlaying && currentBeat === i ? 'active' : '',
                i === 0 && settings.accentEnabled ? 'accent-marker' : '',
              ].filter(Boolean).join(' ')}
            />
          ))}
        </div>
      </div>

      <section className="home-panel" aria-label="拍號與練習時間">
        <div className="panel-block">
          <span className="panel-label">拍號</span>
          <div className="seg-group seg-compact" role="group" aria-label="拍號">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`seg-btn ${settings.timeSigMode === p ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
                disabled={isPlaying}
              >
                {p}/4
              </button>
            ))}
            <button
              type="button"
              className={`seg-btn ${settings.timeSigMode === 'custom' ? 'active' : ''}`}
              onClick={() => applyPreset('custom')}
              disabled={isPlaying}
            >
              自訂
            </button>
          </div>
          {settings.timeSigMode === 'custom' && (
            <div className="timesig-custom">
              <input
                id="beats-input"
                type="number"
                className="timesig-num"
                min={1}
                max={16}
                value={settings.beats}
                inputMode="numeric"
                aria-label="拍號分子"
                disabled={isPlaying}
                onChange={(e) => {
                  const beats = clampBeats(Number(e.target.value));
                  save({ beats, timeSigMode: 'custom' });
                }}
              />
              <span className="timesig-slash">/</span>
              <select
                id="note-input"
                className="timesig-select"
                value={settings.noteValue}
                aria-label="拍號分母"
                disabled={isPlaying}
                onChange={(e) => {
                  const noteValue = clampNoteValue(Number(e.target.value));
                  save({ noteValue, timeSigMode: 'custom' });
                }}
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={8}>8</option>
              </select>
            </div>
          )}
        </div>

        <div className="panel-block panel-block-row">
          <label className="panel-label" htmlFor="timer-input">練習分鐘</label>
          <div className="timer-row">
            <input
              id="timer-input"
              type="number"
              className="timer-input"
              min={0}
              max={180}
              value={timerInput}
              placeholder="0"
              inputMode="numeric"
              aria-label="練習分鐘，0 為不限時"
              disabled={isPlaying}
              onChange={(e) => setTimerInput(e.target.value)}
              onBlur={handleTimerBlur}
            />
            <span className="timer-unit">分鐘</span>
            {hasTimer && (
              <span className="timer-countdown" aria-live="polite">{timerDisplay}</span>
            )}
          </div>
        </div>
      </section>

      <MoreSettings
        open={moreOpen}
        onToggleOpen={() => setMoreOpen((o) => !o)}
        accentEnabled={settings.accentEnabled}
        onAccentChange={(v) => save({ accentEnabled: v })}
        flashEnabled={settings.flashEnabled}
        onFlashChange={(v) => save({ flashEnabled: v })}
        sound={settings.sound}
        onSoundChange={(v) => save({ sound: v })}
        themeMode={themeMode}
        onThemeChange={setTheme}
        onShowTutorial={() => setShowTutorial(true)}
        disabled={isPlaying}
      />

      <footer className="controls">
        <button
          type="button"
          className={`ctrl-play ${isPlaying ? 'playing' : ''}`}
          onClick={toggle}
          aria-label={isPlaying ? '停止' : '開始'}
        >
          {isPlaying ? '停止' : '開始'}
        </button>
      </footer>

      {!hasWakeLock && isPlaying && (
        <p className="wake-hint">請保持螢幕亮著練習</p>
      )}

      {practiceEnd && (
        <div className="practice-end" role="alert">
          <p>練習結束</p>
        </div>
      )}

      <TutorialOverlay open={showTutorial} onDismiss={dismissTutorial} />
    </div>
  );
}
