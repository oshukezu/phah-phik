const DOG_OFFSET_SEC = 0;
const DOG_ACCENT_DURATION = 0.22;
const DOG_WEAK_DURATION = 0.18;
const DOG_ACCENT_RATE = 1.0;
const DOG_WEAK_RATE = 0.95;

let dogBufferPromise = null;

export function getDogSampleUrl() {
  return `${import.meta.env.BASE_URL}sounds/dog-maltese.mp3`;
}

export function loadDogSample(audioContext) {
  if (!dogBufferPromise) {
    dogBufferPromise = fetch(getDogSampleUrl())
      .then((response) => {
        if (!response.ok) throw new Error('dog sample fetch failed');
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .catch(() => null);
  }
  return dogBufferPromise;
}

export function playDogFromSample(ctx, master, buffer, time, isAccent, peak) {
  const offset = DOG_OFFSET_SEC;
  const duration = isAccent ? DOG_ACCENT_DURATION : DOG_WEAK_DURATION;
  const playbackRate = isAccent ? DOG_ACCENT_RATE : DOG_WEAK_RATE;
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
  gain.gain.linearRampToValueAtTime(peak, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, time + audibleDuration);

  source.connect(gain);
  source.start(time, offset, playDuration);
  return true;
}

export function playDogSynthetic(ctx, master, time, isAccent, peak) {
  const dur = isAccent ? 0.11 : 0.09;

  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = Math.exp(-i / (bufferSize * 0.22));
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(isAccent ? 720 : 620, time);
  filter.Q.setValueAtTime(1.4, time);

  const noiseGain = ctx.createGain();
  noiseGain.connect(master);
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(peak * 0.85, time + 0.004);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  noise.connect(filter);
  filter.connect(noiseGain);
  noise.start(time);
  noise.stop(time + dur + 0.01);

  const toneGain = ctx.createGain();
  toneGain.connect(master);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(isAccent ? 280 : 240, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + dur * 0.85);
  toneGain.gain.setValueAtTime(0, time);
  toneGain.gain.linearRampToValueAtTime(peak * 0.35, time + 0.003);
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(toneGain);
  osc.start(time);
  osc.stop(time + dur + 0.01);
}
