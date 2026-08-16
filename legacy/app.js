import { MetronomeEngine } from './metronome.js';
import { PendulumView } from './pendulum.js';
import {
  loadSettings,
  saveSettings,
  applyTheme,
  clampBpm,
  clampTimer,
  clampBeats,
  clampNoteValue,
  isStandalone,
} from './storage.js';
import {
  requestWakeLock,
  releaseWakeLock,
  hasWakeLockSupport,
} from './wake-lock.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const engine = new MetronomeEngine();
const pendulum = new PendulumView($('#pendulum-mount'));

let settings = loadSettings();
let timerEndAt = null;
let timerRafId = null;

const els = {
  bpmInput: $('#bpm-input'),
  beatDots: $('#beat-dots'),
  playBtn: $('#play-btn'),
  timerInput: $('#timer-input'),
  timerCountdown: $('#timer-countdown'),
  wakeHint: $('#wake-hint'),
  settingsOpen: $('#settings-open'),
  settingsClose: $('#settings-close'),
  settingsDrawer: $('#settings-drawer'),
  settingsBackdrop: $('#settings-backdrop'),
  tutorialOverlay: $('#tutorial-overlay'),
  tutorialDismiss: $('#tutorial-dismiss'),
  showTutorial: $('#show-tutorial'),
  practiceEnd: $('#practice-end'),
  timesigCustom: $('#timesig-custom'),
  beatsInput: $('#beats-input'),
  noteInput: $('#note-input'),
};

function init() {
  applySettingsToEngine();
  applyTheme(settings);
  syncHomeUI();
  renderBeatDots();
  syncTimeSigUI();
  syncSettingsUI();
  bindEvents();
  initTutorial();
  initServiceWorker();
  initPendulum();

  if (!hasWakeLockSupport()) {
    els.wakeHint.classList.remove('hidden');
  }
}

function initPendulum() {
  pendulum.bind({
    getAudioTime: () => engine.getCurrentAudioTime(),
    getBeatInterval: () => engine.getBeatInterval(),
    getIsPlaying: () => engine.isPlaying,
    getStartEpoch: () => engine.startEpoch,
  });
}

function applySettingsToEngine() {
  engine.setBpm(settings.bpm);
  engine.setTimeSignature(settings.beats);
  engine.setSound(settings.sound);
}

function syncHomeUI() {
  els.bpmInput.value = String(settings.bpm);
  els.timerInput.value = settings.timerMinutes > 0 ? String(settings.timerMinutes) : '';
  els.beatsInput.value = String(settings.beats);
  els.noteInput.value = String(settings.noteValue);
}

function renderBeatDots() {
  els.beatDots.innerHTML = '';
  els.beatDots.classList.toggle('beat-dots-many', settings.beats > 8);
  for (let i = 0; i < settings.beats; i++) {
    const dot = document.createElement('span');
    dot.className = 'beat-dot';
    els.beatDots.appendChild(dot);
  }
}

function setActiveBeat(beat, isAccent) {
  $$('.beat-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === beat);
    dot.classList.toggle('accent', i === beat && isAccent);
  });
}

function syncTimeSigUI() {
  $$('[data-timesig-preset]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.timesigPreset === settings.timeSigMode);
  });
  const isCustom = settings.timeSigMode === 'custom';
  els.timesigCustom.classList.toggle('hidden', !isCustom);
}

function syncSettingsUI() {
  $$('[data-sound]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sound === settings.sound);
  });
  $$('[data-theme]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === settings.theme);
  });
}

function setPlayingUI(playing) {
  els.playBtn.textContent = playing ? '停止' : '開始';
  els.playBtn.classList.toggle('playing', playing);
  els.playBtn.setAttribute('aria-label', playing ? '停止' : '開始');

  els.bpmInput.disabled = playing;
  els.timerInput.disabled = playing;
  $$('[data-timesig-preset]').forEach((btn) => {
    btn.disabled = playing;
  });
  els.beatsInput.disabled = playing;
  els.noteInput.disabled = playing;
}

function applyPresetTimeSig(preset) {
  const beats = Number(preset);
  settings = saveSettings({
    beats,
    noteValue: 4,
    timeSigMode: preset,
  });
  engine.setTimeSignature(settings.beats);
  renderBeatDots();
  syncTimeSigUI();
}

function applyCustomTimeSig() {
  const beats = clampBeats(Number(els.beatsInput.value));
  const noteValue = clampNoteValue(Number(els.noteInput.value));
  settings = saveSettings({
    beats,
    noteValue,
    timeSigMode: 'custom',
  });
  els.beatsInput.value = String(beats);
  els.noteInput.value = String(noteValue);
  engine.setTimeSignature(settings.beats);
  renderBeatDots();
  syncTimeSigUI();
}

function bindEvents() {
  els.playBtn.addEventListener('click', togglePlay);

  els.bpmInput.addEventListener('focus', (e) => e.target.select());
  els.bpmInput.addEventListener('change', onBpmChange);
  els.bpmInput.addEventListener('blur', onBpmChange);

  els.timerInput.addEventListener('change', onTimerChange);
  els.timerInput.addEventListener('blur', onTimerChange);

  $$('[data-timesig-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (engine.isPlaying) return;
      const preset = btn.dataset.timesigPreset;
      if (preset === 'custom') {
        settings = saveSettings({ timeSigMode: 'custom' });
        syncTimeSigUI();
        els.beatsInput.focus();
      } else {
        applyPresetTimeSig(preset);
      }
    });
  });

  els.beatsInput.addEventListener('change', () => {
    if (engine.isPlaying) return;
    applyCustomTimeSig();
  });
  els.beatsInput.addEventListener('blur', () => {
    if (engine.isPlaying) return;
    applyCustomTimeSig();
  });
  els.noteInput.addEventListener('change', () => {
    if (engine.isPlaying) return;
    applyCustomTimeSig();
  });

  els.settingsOpen.addEventListener('click', openSettings);
  els.settingsClose.addEventListener('click', closeSettings);
  els.settingsBackdrop.addEventListener('click', closeSettings);

  $$('[data-sound]').forEach((btn) => {
    btn.addEventListener('click', () => {
      settings = saveSettings({ sound: btn.dataset.sound });
      engine.setSound(settings.sound);
      syncSettingsUI();
    });
  });

  $$('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      settings = saveSettings({ theme: btn.dataset.theme });
      applyTheme(settings);
      syncSettingsUI();
    });
  });

  els.tutorialDismiss.addEventListener('click', dismissTutorial);
  els.showTutorial.addEventListener('click', () => {
    closeSettings();
    showTutorial();
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && engine.isPlaying) {
      await engine.resync();
      if (hasWakeLockSupport()) await requestWakeLock();
    }
  });

  window.addEventListener('wake-lock-reacquire', async () => {
    if (engine.isPlaying && hasWakeLockSupport()) {
      await requestWakeLock();
    }
  });

  engine.onBeat = ({ beat, isAccent }) => {
    setActiveBeat(beat, isAccent);
    if (isAccent) pendulum.flashAccent();
  };
}

function onBpmChange() {
  if (engine.isPlaying) return;
  const raw = Number(els.bpmInput.value);
  const bpm = clampBpm(Number.isFinite(raw) ? raw : settings.bpm);
  settings = saveSettings({ bpm });
  engine.setBpm(bpm);
  els.bpmInput.value = String(bpm);
}

function onTimerChange() {
  if (engine.isPlaying) return;
  const raw = els.timerInput.value === '' ? 0 : Number(els.timerInput.value);
  const timerMinutes = clampTimer(Number.isFinite(raw) ? raw : 0);
  settings = saveSettings({ timerMinutes });
  els.timerInput.value = timerMinutes > 0 ? String(timerMinutes) : '';
}

async function togglePlay() {
  if (engine.isPlaying) {
    stop();
  } else {
    onBpmChange();
    onTimerChange();
    if (settings.timeSigMode === 'custom') applyCustomTimeSig();
    await start();
  }
}

async function start() {
  await engine.ensureContext();
  engine.setBpm(settings.bpm);
  engine.setTimeSignature(settings.beats);
  engine.setSound(settings.sound);

  await engine.start();
  pendulum.startLoop();
  setPlayingUI(true);

  const gotLock = await requestWakeLock();
  if (!gotLock && !hasWakeLockSupport()) {
    els.wakeHint.classList.remove('hidden');
  }

  if (settings.timerMinutes > 0) {
    timerEndAt = Date.now() + settings.timerMinutes * 60 * 1000;
    els.timerCountdown.classList.remove('hidden');
    updateTimerDisplay();
    timerRafId = requestAnimationFrame(timerLoop);
  }
}

function stop() {
  engine.stop();
  pendulum.stopLoop();
  releaseWakeLock();
  setPlayingUI(false);

  $$('.beat-dot').forEach((d) => d.classList.remove('active', 'accent'));

  if (timerRafId) {
    cancelAnimationFrame(timerRafId);
    timerRafId = null;
  }
  timerEndAt = null;
  els.timerCountdown.classList.add('hidden');
  els.timerCountdown.textContent = '';
}

function timerLoop() {
  if (!timerEndAt || !engine.isPlaying) return;
  updateTimerDisplay();
  if (Date.now() >= timerEndAt) {
    stop();
    showPracticeEnd();
    return;
  }
  timerRafId = requestAnimationFrame(timerLoop);
}

function updateTimerDisplay() {
  if (!timerEndAt) return;
  const remaining = Math.max(0, timerEndAt - Date.now());
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  els.timerCountdown.textContent = `剩 ${mins}:${String(secs).padStart(2, '0')}`;
}

function showPracticeEnd() {
  els.practiceEnd.classList.remove('hidden');
  if (navigator.vibrate) navigator.vibrate(200);
  setTimeout(() => els.practiceEnd.classList.add('hidden'), 2500);
}

function openSettings() {
  els.settingsDrawer.classList.add('open');
  els.settingsDrawer.setAttribute('aria-hidden', 'false');
  els.settingsBackdrop.classList.remove('hidden');
  els.settingsBackdrop.setAttribute('aria-hidden', 'false');
}

function closeSettings() {
  els.settingsDrawer.classList.remove('open');
  els.settingsDrawer.setAttribute('aria-hidden', 'true');
  els.settingsBackdrop.classList.add('hidden');
  els.settingsBackdrop.setAttribute('aria-hidden', 'true');
}

function initTutorial() {
  if (isStandalone() || settings.tutorialDismissed) return;
  showTutorial();
}

function showTutorial() {
  els.tutorialOverlay.classList.remove('hidden');
}

function dismissTutorial() {
  settings = saveSettings({ tutorialDismissed: true });
  els.tutorialOverlay.classList.add('hidden');
}

async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch {
      /* optional */
    }
  }
}

init();
