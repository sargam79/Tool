/* ============================================================
   SoundManager — procedurally synthesized audio via WebAudio API.
   No external sound files are required; every effect and the
   ambient background loop are generated at runtime.
   ============================================================ */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicGain = null;
    this.musicNodes = [];
    this.musicPlaying = false;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 1;
    }
  }

  /* ---- generic tone helper ---- */
  _tone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.2, glideTo = null, delay = 0 }) {
    if (this.muted) return;
    this._ensureContext();
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g).connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  _noiseBurst({ duration = 0.3, gain = 0.3, delay = 0, filterFreq = 1200 }) {
    if (this.muted) return;
    this._ensureContext();
    const t0 = this.ctx.currentTime + delay;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter).connect(g).connect(this.masterGain);
    src.start(t0);
  }

  /* ---- specific game sounds ---- */
  playEat() {
    this._tone({ freq: 520, type: 'triangle', duration: 0.09, gain: 0.22 });
    this._tone({ freq: 780, type: 'triangle', duration: 0.1, gain: 0.16, delay: 0.05 });
  }

  playGoldenEat() {
    [660, 880, 1100].forEach((f, i) => {
      this._tone({ freq: f, type: 'triangle', duration: 0.12, gain: 0.2, delay: i * 0.06 });
    });
  }

  playCoin() {
    this._tone({ freq: 990, type: 'square', duration: 0.06, gain: 0.12 });
    this._tone({ freq: 1320, type: 'square', duration: 0.08, gain: 0.1, delay: 0.05 });
  }

  playPowerup() {
    this._tone({ freq: 300, type: 'sawtooth', duration: 0.25, gain: 0.15, glideTo: 900 });
  }

  playShieldHit() {
    this._tone({ freq: 200, type: 'square', duration: 0.15, gain: 0.2 });
    this._noiseBurst({ duration: 0.15, gain: 0.15, filterFreq: 2000 });
  }

  playExplosion() {
    this._noiseBurst({ duration: 0.5, gain: 0.35, filterFreq: 700 });
    this._tone({ freq: 120, type: 'sawtooth', duration: 0.4, gain: 0.3, glideTo: 30 });
  }

  playGameOver() {
    [440, 370, 300, 220].forEach((f, i) => {
      this._tone({ freq: f, type: 'sawtooth', duration: 0.22, gain: 0.18, delay: i * 0.14 });
    });
  }

  playVictory() {
    [523, 659, 784, 1047].forEach((f, i) => {
      this._tone({ freq: f, type: 'triangle', duration: 0.2, gain: 0.2, delay: i * 0.12 });
    });
  }

  playClick() {
    this._tone({ freq: 700, type: 'square', duration: 0.05, gain: 0.1 });
  }

  playSlide() {
    this._tone({ freq: 900, type: 'sine', duration: 0.12, gain: 0.08, glideTo: 500 });
  }

  playPoison() {
    this._tone({ freq: 260, type: 'square', duration: 0.2, gain: 0.18, glideTo: 120 });
  }

  /* ---- ambient background music: a soft looping arpeggio ---- */
  startMusic() {
    if (this.musicPlaying) return;
    this._ensureContext();
    this.musicPlaying = true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.05;
    this.musicGain.connect(this.masterGain);

    const notes = [261.6, 329.6, 392.0, 329.6, 392.0, 440.0, 392.0, 329.6];
    let step = 0;
    this._musicInterval = setInterval(() => {
      if (this.muted) { step++; return; }
      const freq = notes[step % notes.length];
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.06, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(g).connect(this.musicGain);
      osc.start(t0);
      osc.stop(t0 + 0.55);
      step++;
    }, 420);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._musicInterval) clearInterval(this._musicInterval);
  }
}
