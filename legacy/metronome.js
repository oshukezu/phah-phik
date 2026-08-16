/** Fixed output level — user controls loudness via device volume */
const GAIN_ACCENT = 1.0;
const GAIN_WEAK = 0.82;

export class MetronomeEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.bpm = 80;
    this.timeSignature = 4;
    this.sound = 'wood';
    this.schedulerBeat = 0;
    this.nextNoteTime = 0;
    this.audioSchedulerId = null;
    this.uiSyncerId = null;
    this.beatTimes = [];
    this.displayedBeat = -1;
    this.startEpoch = 0;
    this.onBeat = null;
    this.lookahead = 25;
    this.scheduleAhead = 0.1;
    this.uiSyncInterval = 4;
  }

  async ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  setBpm(bpm) {
    this.bpm = bpm;
  }

  setTimeSignature(ts) {
    this.timeSignature = ts;
    this.schedulerBeat = 0;
  }

  setSound(sound) {
    this.sound = sound;
  }

  getBeatInterval() {
    return 60 / this.bpm;
  }

  getCurrentAudioTime() {
    return this.ctx?.currentTime ?? 0;
  }

  createMasterGain() {
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  playClick(time, isAccent) {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master) return;

    const gain = ctx.createGain();
    gain.connect(master);

    const peak = isAccent ? GAIN_ACCENT : GAIN_WEAK;

    if (this.sound === 'electronic') {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1000 : 750, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(peak, time + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(gain);
      osc.start(time);
      osc.stop(time + 0.09);
    } else {
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
    }
  }

  scheduleAudio() {
    const ctx = this.ctx;
    if (!ctx || !this.isPlaying) return;

    while (this.nextNoteTime < ctx.currentTime + this.scheduleAhead) {
      const beat = this.schedulerBeat % this.timeSignature;
      const isAccent = beat === 0;
      this.playClick(this.nextNoteTime, isAccent);

      this.beatTimes.push({
        time: this.nextNoteTime,
        beat,
        isAccent,
      });
      if (this.beatTimes.length > 10) {
        this.beatTimes.shift();
      }

      this.schedulerBeat++;
      this.nextNoteTime += this.getBeatInterval();
    }

    this.audioSchedulerId = setTimeout(() => this.scheduleAudio(), this.lookahead);
  }

  syncUI() {
    if (!this.isPlaying || !this.ctx) return;

    const currentTime = this.ctx.currentTime;
    let beatToShow = -1;
    let isAccent = false;

    for (let i = this.beatTimes.length - 1; i >= 0; i--) {
      if (this.beatTimes[i].time <= currentTime) {
        beatToShow = this.beatTimes[i].beat;
        isAccent = this.beatTimes[i].isAccent;
        break;
      }
    }

    if (beatToShow !== -1 && beatToShow !== this.displayedBeat) {
      this.displayedBeat = beatToShow;
      if (this.onBeat) {
        this.onBeat({ beat: beatToShow, isAccent, time: currentTime });
      }
    }

    this.uiSyncerId = setTimeout(() => this.syncUI(), this.uiSyncInterval);
  }

  clearSchedulers() {
    if (this.audioSchedulerId) {
      clearTimeout(this.audioSchedulerId);
      this.audioSchedulerId = null;
    }
    if (this.uiSyncerId) {
      clearTimeout(this.uiSyncerId);
      this.uiSyncerId = null;
    }
    this.beatTimes = [];
    this.displayedBeat = -1;
  }

  async startInternal() {
    await this.ensureContext();

    this.clearSchedulers();
    this.createMasterGain();

    this.isPlaying = true;
    this.schedulerBeat = 0;
    this.displayedBeat = 0;

    const now = this.ctx.currentTime;
    this.startEpoch = now;

    this.playClick(now, true);
    if (this.onBeat) {
      this.onBeat({ beat: 0, isAccent: true, time: now });
    }

    this.beatTimes = [{ time: now, beat: 0, isAccent: true }];
    this.nextNoteTime = now + this.getBeatInterval();
    this.schedulerBeat = 1;

    this.scheduleAudio();
    this.syncUI();
  }

  async start() {
    if (this.isPlaying) return;

    await this.startInternal();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: '節拍器',
        artist: '練習中',
      });
      navigator.mediaSession.playbackState = 'playing';
    }
  }

  stop() {
    this.isPlaying = false;
    this.clearSchedulers();
    this.schedulerBeat = 0;

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  async resync() {
    if (!this.isPlaying || !this.ctx) return;
    await this.startInternal();
  }
}
