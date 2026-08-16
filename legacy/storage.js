const STORAGE_KEY = 'elder-metronome-settings';

const DEFAULTS = {
  bpm: 80,
  beats: 4,
  noteValue: 4,
  timeSigMode: '4',
  sound: 'wood',
  theme: 'day',
  timerMinutes: 0,
  tutorialDismissed: false,
};

const VALID_NOTE_VALUES = [2, 4, 8];

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const theme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'night'
        : 'day';
      return { ...DEFAULTS, theme };
    }
    const parsed = { ...DEFAULTS, ...JSON.parse(raw) };

    if (parsed.timeSignature != null && parsed.beats == null) {
      parsed.beats = parsed.timeSignature;
      parsed.noteValue = 4;
      parsed.timeSigMode = String(parsed.timeSignature);
    }

    delete parsed.volume;
    delete parsed.customColors;
    delete parsed.timeSignature;
    if (parsed.theme === 'custom') parsed.theme = 'day';

    parsed.beats = clampBeats(parsed.beats);
    parsed.noteValue = clampNoteValue(parsed.noteValue);
    parsed.timeSigMode = normalizeTimeSigMode(parsed);

    return parsed;
  } catch {
    return { ...DEFAULTS };
  }
}

function normalizeTimeSigMode(parsed) {
  if (parsed.timeSigMode === 'custom') return 'custom';
  const preset = String(parsed.beats);
  if (['2', '3', '4'].includes(preset) && parsed.noteValue === 4) return preset;
  return 'custom';
}

export function saveSettings(partial) {
  const current = loadSettings();
  const next = { ...current, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export const THEMES = {
  day: {
    bg: '#F7F5F2',
    text: '#1A1A1A',
    accent: '#9A6B3F',
  },
  night: {
    bg: '#1C1C1E',
    text: '#F5F5F5',
    accent: '#D4B896',
  },
};

export function applyTheme(settings) {
  const root = document.documentElement;
  const body = document.body;

  body.classList.remove('theme-night');

  let bg, text, accent;
  if (settings.theme === 'night') {
    body.classList.add('theme-night');
    ({ bg, text, accent } = THEMES.night);
  } else {
    ({ bg, text, accent } = THEMES.day);
  }

  root.style.setProperty('--bg', bg);
  root.style.setProperty('--text', text);
  root.style.setProperty('--accent', accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export function clampBpm(bpm) {
  return Math.min(208, Math.max(40, Math.round(bpm)));
}

export function clampTimer(minutes) {
  return Math.min(180, Math.max(0, Math.round(minutes)));
}

export function clampBeats(beats) {
  return Math.min(16, Math.max(1, Math.round(beats)));
}

export function clampNoteValue(note) {
  const n = Math.round(note);
  return VALID_NOTE_VALUES.includes(n) ? n : 4;
}

export function formatTimeSig(settings) {
  return `${settings.beats}/${settings.noteValue}`;
}
