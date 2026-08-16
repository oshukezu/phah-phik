import { useState, useRef, useCallback, useEffect } from 'react';
import { requestPlaybackAudioSession } from '../utils/audioSession';

export const SOUND_TYPES = {
  wood: { name: '木質' },
  electronic: { name: '電子' },
  goose: { name: '鵝叫' },
  boing: { name: '彈簧' },
  bell: { name: '清脆' },
  frog: { name: '蛙鳴' },
};

const GAIN_ACCENT = 1.0;
const GAIN_WEAK = 0.82;

function clampBpm(bpm) {
  return Math.min(208, Math.max(40, Math.round(bpm)));
}

export function useMetronome({
  bpm,
  beats,
  sound,
  accentEnabled,
  volume,
  onBpmChange,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatTick, setBeatTick] = useState(0);
  const [beatProgress, setBeatProgress] = useState(0);

  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const audioSchedulerIdRef = useRef(null);
  const uiSyncerIdRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const schedulerBeatRef = useRef(0);
  const beatTimesRef = useRef([]);
  const displayedBeatRef = useRef(-1);
  const isRunningRef = useRef(false);

  const accentEnabledRef = useRef(accentEnabled);
  const soundTypeRef = useRef(sound);
  const volumeRef = useRef(volume);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beats);
  const playSoundRef = useRef(() => {});
  const scheduleAudioRef = useRef(() => {});
  const syncUIRef = useRef(() => {});

  useEffect(() => { accentEnabledRef.current = accentEnabled; }, [accentEnabled]);
  useEffect(() => { soundTypeRef.current = sound; }, [sound]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = beats; }, [beats]);

  const applyMasterVolume = useCallback((value) => {
    const ctx = audioContextRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    master.gain.setValueAtTime(value, ctx.currentTime);
  }, []);

  useEffect(() => {
    applyMasterVolume(volume);
  }, [volume, applyMasterVolume]);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      requestPlaybackAudioSession();
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const createMasterGain = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return null;
    if (masterGainRef.current) masterGainRef.current.disconnect();
    const gain = ctx.createGain();
    gain.gain.value = volumeRef.current;
    gain.connect(ctx.destination);
    masterGainRef.current = gain;
    return gain;
  }, []);

  const playWood = useCallback((ctx, master, time, isAccent) => {
    const gain = ctx.createGain();
    gain.connect(master);
    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;

    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.12));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isAccent ? 1800 : 1400, time);
    filter.Q.setValueAtTime(0.8, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak * 1.15, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    source.connect(filter);
    filter.connect(gain);
    source.start(time);
    source.stop(time + 0.08);
  }, []);

  const playElectronic = useCallback((ctx, master, time, isAccent) => {
    const gain = ctx.createGain();
    gain.connect(master);
    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 1000 : 750, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.09);
  }, []);

  const playGoose = useCallback((ctx, master, time, isAccent) => {
    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;
    const dur = isAccent ? 0.12 : 0.11;
    const f0Start = isAccent ? 240 : 220;
    const f0Mid = isAccent ? 300 : 275;
    const f0End = isAccent ? 400 : 360;
    const midAt = time + dur * 0.42;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f0Start, time);
    osc.frequency.exponentialRampToValueAtTime(f0Mid, midAt);
    osc.frequency.exponentialRampToValueAtTime(f0End, time + dur);

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(480, time);
    f1.Q.setValueAtTime(4, time);

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1750, time);
    f2.Q.setValueAtTime(6, time);

    const env = ctx.createGain();
    env.connect(master);
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(1, time + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, time + dur);

    const gainF1 = ctx.createGain();
    gainF1.gain.setValueAtTime(peak * 0.72, time);
    const gainF2 = ctx.createGain();
    gainF2.gain.setValueAtTime(peak * 0.28, time);

    osc.connect(f1);
    f1.connect(gainF1);
    gainF1.connect(env);
    osc.connect(f2);
    f2.connect(gainF2);
    gainF2.connect(env);

    const noiseLen = Math.floor(ctx.sampleRate * 0.012);
    const buffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseLen * 0.18));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, time);
    noiseFilter.Q.setValueAtTime(1.2, time);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(peak * 0.07, time + 0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.022);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(env);

    osc.start(time);
    osc.stop(time + dur + 0.02);
    noise.start(time);
    noise.stop(time + 0.025);
  }, []);

  const playBoing = useCallback((ctx, master, time, isAccent) => {
    const gain = ctx.createGain();
    gain.connect(master);
    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 400 : 320, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.15);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.21);
  }, []);

  const playBell = useCallback((ctx, master, time, isAccent) => {
    const gain = ctx.createGain();
    gain.connect(master);
    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1400 : 1100, time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak * 0.9, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.26);
  }, []);

  const playFrog = useCallback((ctx, master, time, isAccent) => {
    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;
    const chirpCount = isAccent ? 4 : 3;
    const spacing = 0.022;
    const chirpDur = 0.018;
    const baseFreq = isAccent ? 5200 : 4600;

    for (let i = 0; i < chirpCount; i++) {
      const t = time + i * spacing;
      const gain = ctx.createGain();
      gain.connect(master);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.88, t + chirpDur);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak * 0.45, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + chirpDur);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + chirpDur + 0.005);
    }
  }, []);

  const playSound = useCallback((time, isAccent) => {
    const ctx = audioContextRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    switch (soundTypeRef.current) {
      case 'electronic':
        playElectronic(ctx, master, time, isAccent);
        break;
      case 'goose':
        playGoose(ctx, master, time, isAccent);
        break;
      case 'boing':
        playBoing(ctx, master, time, isAccent);
        break;
      case 'bell':
        playBell(ctx, master, time, isAccent);
        break;
      case 'frog':
        playFrog(ctx, master, time, isAccent);
        break;
      default:
        playWood(ctx, master, time, isAccent);
    }
  }, [playElectronic, playGoose, playBoing, playBell, playFrog, playWood]);

  useEffect(() => {
    playSoundRef.current = playSound;

    scheduleAudioRef.current = () => {
      const ctx = audioContextRef.current;
      if (!ctx || !isRunningRef.current) return;

      const scheduleAheadTime = 0.1;
      const lookahead = 25;

      while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
        const beatIndex = schedulerBeatRef.current;
        const isAccent = accentEnabledRef.current && beatIndex === 0;
        const noteTime = nextNoteTimeRef.current;

        playSoundRef.current(noteTime, isAccent);
        beatTimesRef.current.push({ time: noteTime, beat: beatIndex });
        if (beatTimesRef.current.length > 10) beatTimesRef.current.shift();

        nextNoteTimeRef.current += 60.0 / bpmRef.current;
        schedulerBeatRef.current = (beatIndex + 1) % beatsRef.current;
      }

      audioSchedulerIdRef.current = setTimeout(() => scheduleAudioRef.current(), lookahead);
    };

    syncUIRef.current = () => {
      if (!isRunningRef.current) return;
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const currentTime = ctx.currentTime;
      let beatToShow = -1;
      let beatStartTime = 0;
      for (let i = beatTimesRef.current.length - 1; i >= 0; i--) {
        if (beatTimesRef.current[i].time <= currentTime) {
          beatToShow = beatTimesRef.current[i].beat;
          beatStartTime = beatTimesRef.current[i].time;
          break;
        }
      }

      if (beatToShow !== -1) {
        const beatDuration = 60.0 / bpmRef.current;
        const progress = Math.min(
          1,
          Math.max(0, (currentTime - beatStartTime) / beatDuration)
        );
        setBeatProgress(progress);

        if (beatToShow !== displayedBeatRef.current) {
          displayedBeatRef.current = beatToShow;
          setCurrentBeat(beatToShow);
          setBeatTick((t) => t + 1);
        }
      }

      uiSyncerIdRef.current = setTimeout(() => syncUIRef.current(), 4);
    };
  }, [playSound]);

  const stopSchedulers = useCallback(() => {
    isRunningRef.current = false;
    if (audioSchedulerIdRef.current) {
      clearTimeout(audioSchedulerIdRef.current);
      audioSchedulerIdRef.current = null;
    }
    if (uiSyncerIdRef.current) {
      clearTimeout(uiSyncerIdRef.current);
      uiSyncerIdRef.current = null;
    }
    beatTimesRef.current = [];
    displayedBeatRef.current = -1;
  }, []);

  const setMediaSessionPlaying = useCallback(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: '拍魄仔',
      artist: '練習中',
    });
    navigator.mediaSession.playbackState = 'playing';
  }, []);

  const setMediaSessionPaused = useCallback(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = 'paused';
  }, []);

  const startInternal = useCallback(async () => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    stopSchedulers();
    createMasterGain();

    isRunningRef.current = true;
    schedulerBeatRef.current = 0;
    displayedBeatRef.current = 0;

    const now = ctx.currentTime;
    const isAccent = accentEnabledRef.current;
    playSoundRef.current(now, isAccent);
    setCurrentBeat(0);
    setBeatTick((t) => t + 1);

    nextNoteTimeRef.current = now + 60.0 / bpmRef.current;
    schedulerBeatRef.current = 1 % beatsRef.current;
    beatTimesRef.current = [{ time: now, beat: 0 }];

    scheduleAudioRef.current();
    syncUIRef.current();
  }, [initAudioContext, stopSchedulers, createMasterGain]);

  const start = useCallback(() => {
    setIsPlaying(true);
    startInternal();
    setMediaSessionPlaying();
  }, [startInternal, setMediaSessionPlaying]);

  const stop = useCallback(() => {
    stopSchedulers();
    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    setBeatProgress(0);
    setMediaSessionPaused();
  }, [stopSchedulers, setMediaSessionPaused]);

  const previewSound = useCallback(async () => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const hadMaster = Boolean(masterGainRef.current);
    if (!hadMaster) createMasterGain();

    playSoundRef.current(ctx.currentTime, true);

    if (!hadMaster && !isRunningRef.current) {
      setTimeout(() => {
        if (!isRunningRef.current && masterGainRef.current) {
          masterGainRef.current.disconnect();
          masterGainRef.current = null;
        }
      }, 500);
    }
  }, [initAudioContext, createMasterGain]);

  useEffect(() => {
    if (isRunningRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resync audio when tempo/config changes during play
      startInternal();
    }
  }, [bpm, beats, sound, accentEnabled, startInternal]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else start();
  }, [isPlaying, start, stop]);

  const setBpm = useCallback((value) => {
    onBpmChange(clampBpm(value));
  }, [onBpmChange]);

  useEffect(() => {
    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || !isRunningRef.current) return;
      const ctx = audioContextRef.current;
      if (ctx?.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          // ignore resume failures
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => () => {
    stopSchedulers();
    if (masterGainRef.current) masterGainRef.current.disconnect();
    setMediaSessionPaused();
  }, [stopSchedulers, setMediaSessionPaused]);

  return {
    isPlaying,
    currentBeat,
    beatTick,
    beatProgress,
    toggle,
    start,
    stop,
    setBpm,
    clampBpm,
    previewSound,
  };
}
