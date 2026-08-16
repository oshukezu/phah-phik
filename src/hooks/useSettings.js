import { useState, useCallback } from 'react';

const STORAGE_KEY = 'elder-metronome-settings';

const DEFAULTS = {
  bpm: 80,
  beats: 4,
  noteValue: 4,
  timeSigMode: '4',
  sound: 'wood',
  accentEnabled: true,
  flashEnabled: false,
  timerMinutes: 0,
  timerSeconds: 0,
  volume: 0.6,
  tutorialDismissed: false,
};

const VALID_SOUNDS = ['wood', 'electronic', 'kick', 'boing', 'bell', 'frog'];

const VALID_NOTE_VALUES = [2, 4, 8];

function clampBpm(bpm) {
  return Math.min(208, Math.max(40, Math.round(bpm)));
}

function clampTimer(minutes) {
  return Math.min(180, Math.max(0, Math.round(minutes)));
}

function clampTimerSeconds(seconds) {
  return Math.min(59, Math.max(0, Math.round(seconds)));
}

function clampVolume(volume) {
  const v = Number(volume);
  if (!Number.isFinite(v)) return 0.6;
  return Math.round(Math.min(1, Math.max(0, v)) * 100) / 100;
}

function clampBeats(beats) {
  return Math.min(16, Math.max(1, Math.round(beats)));
}

function clampNoteValue(note) {
  const n = Math.round(note);
  return VALID_NOTE_VALUES.includes(n) ? n : 4;
}

function normalizeTimeSigMode(parsed) {
  if (parsed.timeSigMode === 'custom') return 'custom';
  const preset = String(parsed.beats);
  if (['2', '3', '4'].includes(preset) && parsed.noteValue === 4) return preset;
  return 'custom';
}

export function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };

    const parsed = { ...DEFAULTS, ...JSON.parse(raw) };

    if (parsed.timeSignature != null && parsed.beats == null) {
      parsed.beats = parsed.timeSignature;
      parsed.noteValue = 4;
      parsed.timeSigMode = String(parsed.timeSignature);
    }

    delete parsed.customColors;
    delete parsed.timeSignature;
    delete parsed.theme;
    delete parsed.shakeEnabled;

    parsed.bpm = clampBpm(parsed.bpm);
    parsed.beats = clampBeats(parsed.beats);
    parsed.noteValue = clampNoteValue(parsed.noteValue);
    parsed.timeSigMode = normalizeTimeSigMode(parsed);
    parsed.timerMinutes = clampTimer(parsed.timerMinutes);
    parsed.timerSeconds = clampTimerSeconds(parsed.timerSeconds ?? 0);
    parsed.volume = clampVolume(parsed.volume ?? 0.6);
    if (parsed.sound === 'click') parsed.sound = 'boing';
    parsed.sound = VALID_SOUNDS.includes(parsed.sound) ? parsed.sound : 'wood';
    parsed.accentEnabled = parsed.accentEnabled !== false;
    parsed.flashEnabled = parsed.flashEnabled === true;

    return parsed;
  } catch {
    return { ...DEFAULTS };
  }
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export function useSettingsState() {
  const [settings, setSettingsState] = useState(loadRaw);

  const save = useCallback((partial) => {
    setSettingsState((current) => {
      const next = { ...current, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, save, clampBpm, clampTimer, clampTimerSeconds, clampVolume, clampBeats, clampNoteValue };
}

export { clampBpm, clampTimer, clampTimerSeconds, clampVolume, clampBeats, clampNoteValue, DEFAULTS, VALID_SOUNDS };
