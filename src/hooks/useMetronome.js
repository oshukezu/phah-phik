import { useState, useRef, useCallback, useEffect } from 'react';

export const SOUND_TYPES = {
  wood: { name: '木質' },
  electronic: { name: '電子' },
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
  onBpmChange,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatTick, setBeatTick] = useState(0);

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
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beats);
  const playSoundRef = useRef(() => {});
  const scheduleAudioRef = useRef(() => {});
  const syncUIRef = useRef(() => {});

  useEffect(() => { accentEnabledRef.current = accentEnabled; }, [accentEnabled]);
  useEffect(() => { soundTypeRef.current = sound; }, [sound]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsRef.current = beats; }, [beats]);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const createMasterGain = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return null;
    if (masterGainRef.current) masterGainRef.current.disconnect();
    const gain = ctx.createGain();
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

  const playSound = useCallback((time, isAccent) => {
    const ctx = audioContextRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    if (soundTypeRef.current === 'electronic') {
      playElectronic(ctx, master, time, isAccent);
    } else {
      playWood(ctx, master, time, isAccent);
    }
  }, [playElectronic, playWood]);

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
      for (let i = beatTimesRef.current.length - 1; i >= 0; i--) {
        if (beatTimesRef.current[i].time <= currentTime) {
          beatToShow = beatTimesRef.current[i].beat;
          break;
        }
      }

      if (beatToShow !== -1 && beatToShow !== displayedBeatRef.current) {
        displayedBeatRef.current = beatToShow;
        setCurrentBeat(beatToShow);
        setBeatTick((t) => t + 1);
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
  }, [startInternal]);

  const stop = useCallback(() => {
    stopSchedulers();
    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  }, [stopSchedulers]);

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

  useEffect(() => () => {
    stopSchedulers();
    if (masterGainRef.current) masterGainRef.current.disconnect();
  }, [stopSchedulers]);

  return {
    isPlaying,
    currentBeat,
    beatTick,
    toggle,
    start,
    stop,
    setBpm,
    clampBpm,
  };
}
