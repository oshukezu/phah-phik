import { useState, useCallback, useRef, useEffect } from 'react';
import { useMetronome } from '../hooks/useMetronome';
import {
  useSettingsState,
  clampTimer,
  clampTimerSeconds,
  clampBeats,
  clampNoteValue,
  clampVolume,
  isStandalone,
  loadRaw,
} from '../hooks/useSettings';
import { useWakeLock } from '../hooks/useWakeLock';
import { usePracticeTimer } from '../hooks/usePracticeTimer';
import { useTheme } from '../hooks/useTheme';
import { isIOS } from '../utils/platform';
import MoreSettings from './MoreSettings';
import TutorialOverlay from './TutorialOverlay';
import IosSoundHint from './IosSoundHint';
import BeatArc from './BeatArc';
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
  const [iosHintVariant, setIosHintVariant] = useState(null);
  const pendingStartRef = useRef(false);
  const previewFeedbackTimerRef = useRef(null);
  const [bpmInput, setBpmInput] = useState(String(settings.bpm));
  const [timerMinInput, setTimerMinInput] = useState(
    settings.timerMinutes > 0 ? String(settings.timerMinutes) : ''
  );
  const [timerSecInput, setTimerSecInput] = useState(
    settings.timerSeconds > 0 ? String(settings.timerSeconds) : ''
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
    beatProgress,
    start,
    stop,
    previewSound,
    clampBpm: clampBpmEngine,
  } = useMetronome({
    bpm: settings.bpm,
    beats: settings.beats,
    sound: settings.sound,
    accentEnabled: settings.accentEnabled,
    volume: settings.volume,
    onBpmChange,
  });

  const { hasSupport: hasWakeLock } = useWakeLock(isPlaying);
  const showIosIdleBanner = isIOS() && !isPlaying;
  const showIosSoundHint = isIOS() && isPlaying;
  const showWakeHint = !hasWakeLock && isPlaying;

  const onTimerComplete = useCallback(() => {
    stop();
    setPracticeEnd(true);
    if (navigator.vibrate) navigator.vibrate(200);
  }, [stop]);

  const { hasTimer, display: timerDisplay } = usePracticeTimer(
    isPlaying,
    settings.timerMinutes,
    settings.timerSeconds,
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
    const rawMin = timerMinInput === '' ? 0 : parseInt(timerMinInput, 10);
    const rawSec = timerSecInput === '' ? 0 : parseInt(timerSecInput, 10);
    const minutes = Number.isFinite(rawMin) ? clampTimer(rawMin) : 0;
    const seconds = Number.isFinite(rawSec) ? clampTimerSeconds(rawSec) : 0;
    save({ timerMinutes: minutes, timerSeconds: seconds });
    setTimerMinInput(minutes > 0 ? String(minutes) : '');
    setTimerSecInput(seconds > 0 ? String(seconds) : '');
  };

  const handleClearTimer = () => {
    save({ timerMinutes: 0, timerSeconds: 0 });
    setTimerMinInput('');
    setTimerSecInput('');
  };

  const isUnlimited =
    settings.timerMinutes === 0 && settings.timerSeconds === 0;

  const applyPreset = (preset) => {
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

  const clearPreviewFeedbackTimer = useCallback(() => {
    if (previewFeedbackTimerRef.current) {
      clearTimeout(previewFeedbackTimerRef.current);
      previewFeedbackTimerRef.current = null;
    }
  }, []);

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    if (isIOS() && !settings.iosMuteHintSeen) {
      pendingStartRef.current = true;
      setIosHintVariant('preStart');
      return;
    }
    start();
  }, [isPlaying, settings.iosMuteHintSeen, start, stop]);

  const handlePreStartConfirm = useCallback(() => {
    save({ iosMuteHintSeen: true });
    setIosHintVariant(null);
    if (pendingStartRef.current) {
      pendingStartRef.current = false;
      start();
    }
  }, [save, start]);

  const handlePreviewSound = useCallback(async () => {
    clearPreviewFeedbackTimer();
    await previewSound();
    if (!isIOS()) return;
    previewFeedbackTimerRef.current = setTimeout(() => {
      setIosHintVariant('previewAsk');
      previewFeedbackTimerRef.current = null;
    }, 500);
  }, [clearPreviewFeedbackTimer, previewSound]);

  const handlePreviewHeard = useCallback(() => {
    clearPreviewFeedbackTimer();
    setIosHintVariant(null);
  }, [clearPreviewFeedbackTimer]);

  const handlePreviewNoSound = useCallback(() => {
    clearPreviewFeedbackTimer();
    setIosHintVariant('previewGuide');
  }, [clearPreviewFeedbackTimer]);

  const handleShowSoundHint = useCallback(() => {
    clearPreviewFeedbackTimer();
    setIosHintVariant('previewGuide');
  }, [clearPreviewFeedbackTimer]);

  const handleIosHintDismiss = useCallback(() => {
    setIosHintVariant(null);
  }, []);

  useEffect(() => () => clearPreviewFeedbackTimer(), [clearPreviewFeedbackTimer]);

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
        <div className="bpm-arc-stage">
          <BeatArc
            beats={settings.beats}
            currentBeat={currentBeat}
            beatProgress={beatProgress}
            isPlaying={isPlaying}
          />
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
            aria-label="每分鐘拍數"
          />
          <span className="bpm-label">每分鐘拍數</span>
        </label>
        </div>

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

      {showIosIdleBanner && (
        <p className="ios-idle-sound-banner" role="note">
          請確認已關閉靜音鍵，或接上耳機；開始後可調媒體音量
        </p>
      )}

      <section className="home-panel" aria-label="拍號與練習時間">
        <div className="timesig-block">
          <div className="panel-block panel-block-row">
            <span className="panel-label">拍號</span>
            <div className="seg-group seg-compact panel-controls" role="group" aria-label="拍號">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`seg-btn ${settings.timeSigMode === p ? 'active' : ''}`}
                  onClick={() => applyPreset(p)}
                >
                  {p}/4
                </button>
              ))}
              <button
                type="button"
                className={`seg-btn ${settings.timeSigMode === 'custom' ? 'active' : ''}`}
                onClick={() => applyPreset('custom')}
              >
                自訂
              </button>
            </div>
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
          <span className="panel-label" id="timer-label">練習時間</span>
          <div className="timer-row" aria-labelledby="timer-label">
            <input
              id="timer-min-input"
              type="number"
              className="timer-input timer-input-sm"
              min={0}
              max={180}
              value={timerMinInput}
              placeholder="0"
              inputMode="numeric"
              aria-label="練習分鐘，0 為不限時"
              onChange={(e) => setTimerMinInput(e.target.value)}
              onBlur={handleTimerBlur}
            />
            <span className="timer-unit">分</span>
            <input
              id="timer-sec-input"
              type="number"
              className="timer-input timer-input-sm"
              min={0}
              max={59}
              value={timerSecInput}
              placeholder="0"
              inputMode="numeric"
              aria-label="練習秒數，0 為不限時"
              onChange={(e) => setTimerSecInput(e.target.value)}
              onBlur={handleTimerBlur}
            />
            <span className="timer-unit">秒</span>
            <button
              type="button"
              className={`timer-unlimited-btn ${isUnlimited ? 'active' : ''}`}
              onClick={handleClearTimer}
              aria-pressed={isUnlimited}
            >
              不限時
            </button>
            {hasTimer && (
              <span className="timer-countdown" aria-live="polite">{timerDisplay}</span>
            )}
          </div>
        </div>
      </section>

      <div className="metronome-footer">
        <footer className="controls">
          <button
            type="button"
            className={`ctrl-play ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayToggle}
            aria-label={isPlaying ? '停止' : '開始'}
          >
            {isPlaying ? '停止' : '開始'}
          </button>
        </footer>

        <MoreSettings
          open={moreOpen}
          onToggleOpen={() => setMoreOpen((o) => !o)}
          accentEnabled={settings.accentEnabled}
          onAccentChange={(v) => save({ accentEnabled: v })}
          flashEnabled={settings.flashEnabled}
          onFlashChange={(v) => save({ flashEnabled: v })}
          volume={settings.volume}
          onVolumeChange={(v) => save({ volume: clampVolume(v) })}
          sound={settings.sound}
          onSoundChange={(v) => save({ sound: v })}
          themeMode={themeMode}
          onThemeChange={setTheme}
          onShowTutorial={() => setShowTutorial(true)}
          onShowSoundHint={isIOS() ? handleShowSoundHint : undefined}
          onPreviewSound={handlePreviewSound}
        />

        <p className="app-credit">拍魄仔 Developed by J.J. Wang</p>
      </div>

      {(showIosSoundHint || showWakeHint) && (
        <div className="playback-hints">
          {showIosSoundHint && (
            <p className="playback-hint">聽不到聲音？請關閉靜音鍵或接耳機</p>
          )}
          {showWakeHint && (
            <p className="playback-hint">請保持螢幕亮著練習</p>
          )}
        </div>
      )}

      {practiceEnd && (
        <div
          className="practice-end"
          role="alertdialog"
          aria-labelledby="practice-end-title"
          onClick={() => setPracticeEnd(false)}
        >
          <div className="practice-end-card">
            <p id="practice-end-title" className="practice-end-title">練習結束</p>
            <p className="practice-end-hint">點選任意處關閉</p>
          </div>
        </div>
      )}

      <TutorialOverlay open={showTutorial} onDismiss={dismissTutorial} />

      {isIOS() && (
        <IosSoundHint
          open={Boolean(iosHintVariant)}
          variant={iosHintVariant}
          onConfirm={iosHintVariant === 'preStart' ? handlePreStartConfirm : handlePreviewHeard}
          onDismiss={handleIosHintDismiss}
          onNoSound={handlePreviewNoSound}
        />
      )}
    </div>
  );
}
