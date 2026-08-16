const LASER_OFFSET_SEC = 0;
const LASER_ACCENT_DURATION = 0.15;
const LASER_WEAK_DURATION = 0.12;
const LASER_ACCENT_RATE = 1.0;
const LASER_WEAK_RATE = 0.98;
const LASER_GAIN_BOOST = 1.5;

let laserBufferPromise = null;

function boostedPeak(peak) {
  return Math.min(peak * LASER_GAIN_BOOST, 1.5);
}

export function getLaserSampleUrl() {
  return `${import.meta.env.BASE_URL}sounds/laser2.mp3`;
}

export function loadLaserSample(audioContext) {
  if (!laserBufferPromise) {
    laserBufferPromise = fetch(getLaserSampleUrl())
      .then((response) => {
        if (!response.ok) throw new Error('laser sample fetch failed');
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .catch(() => null);
  }
  return laserBufferPromise;
}

export function playLaserFromSample(ctx, master, buffer, time, isAccent, peak) {
  const offset = LASER_OFFSET_SEC;
  const duration = isAccent ? LASER_ACCENT_DURATION : LASER_WEAK_DURATION;
  const playbackRate = isAccent ? LASER_ACCENT_RATE : LASER_WEAK_RATE;
  const maxDuration = Math.max(0, buffer.duration - offset);
  const playDuration = Math.min(duration, maxDuration);
  if (playDuration <= 0) return false;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(playbackRate, time);

  const gain = ctx.createGain();
  gain.connect(master);
  const audibleDuration = playDuration / playbackRate;
  const level = boostedPeak(peak);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(level, time + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.001, time + audibleDuration);

  source.connect(gain);
  source.start(time, offset, playDuration);
  return true;
}

export function playLaserSynthetic(ctx, master, time, isAccent, peak) {
  const dur = isAccent ? 0.12 : 0.1;
  const level = boostedPeak(peak);

  const gain = ctx.createGain();
  gain.connect(master);
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(isAccent ? 1200 : 1000, time);
  osc.frequency.exponentialRampToValueAtTime(200, time + dur);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(level, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.connect(gain);
  osc.start(time);
  osc.stop(time + dur + 0.01);
}
