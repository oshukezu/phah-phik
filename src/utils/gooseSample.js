const GOOSE_OFFSET_SEC = 0.05;
const GOOSE_ACCENT_DURATION = 0.18;
const GOOSE_WEAK_DURATION = 0.12;
const GOOSE_ACCENT_RATE = 1.15;
const GOOSE_WEAK_RATE = 1.1;

let gooseBufferPromise = null;

export function getGooseSampleUrl() {
  return `${import.meta.env.BASE_URL}sounds/goose-zh-tw.mp3`;
}

export function loadGooseSample(audioContext) {
  if (!gooseBufferPromise) {
    gooseBufferPromise = fetch(getGooseSampleUrl())
      .then((response) => {
        if (!response.ok) throw new Error('goose sample fetch failed');
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .catch(() => null);
  }
  return gooseBufferPromise;
}

export function playGooseFromSample(ctx, master, buffer, time, isAccent, peak) {
  const offset = GOOSE_OFFSET_SEC;
  const duration = isAccent ? GOOSE_ACCENT_DURATION : GOOSE_WEAK_DURATION;
  const playbackRate = isAccent ? GOOSE_ACCENT_RATE : GOOSE_WEAK_RATE;
  const maxDuration = Math.max(0, buffer.duration - offset);
  const playDuration = Math.min(duration, maxDuration);
  if (playDuration <= 0) return false;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(playbackRate, time);

  const gain = ctx.createGain();
  gain.connect(master);
  const audibleDuration = playDuration / playbackRate;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, time + audibleDuration);

  source.connect(gain);
  source.start(time, offset, playDuration);
  return true;
}

export function playGooseSynthetic(ctx, master, time, isAccent, peak) {
  const dur = isAccent ? 0.16 : 0.12;
  const f0Start = isAccent ? 320 : 300;
  const f0End = isAccent ? 540 : 500;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0Start, time);
  osc.frequency.exponentialRampToValueAtTime(f0End, time + dur * 0.85);

  const formant = ctx.createBiquadFilter();
  formant.type = 'bandpass';
  formant.frequency.setValueAtTime(650, time);
  formant.Q.setValueAtTime(2.5, time);

  const gain = ctx.createGain();
  gain.connect(master);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

  osc.connect(formant);
  formant.connect(gain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}
