/* ============================================================
   SoundManager — procedurally synthesized audio via WebAudio.
   No external sound files needed; every effect and the ambient
   music are generated at runtime.
   ============================================================ */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this._musicStep = 0;
    this._footstepToggle = 0;
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
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 1;
  }

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

  _noiseBurst({ duration = 0.3, gain = 0.3, delay = 0, filterFreq = 1200, filterType = 'lowpass' }) {
    if (this.muted) return;
    this._ensureContext();
    const t0 = this.ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    src.connect(filter).connect(g).connect(this.masterGain);
    src.start(t0);
  }

  playFootstep() {
    this._footstepToggle = 1 - this._footstepToggle;
    const base = this._footstepToggle ? 140 : 120;
    this._noiseBurst({ duration: 0.06, gain: 0.09, filterFreq: base * 3, filterType: 'lowpass' });
  }

  playJump() {
    this._tone({ freq: 340, type: 'triangle', duration: 0.22, gain: 0.18, glideTo: 620 });
  }

  playSlide() {
    this._noiseBurst({ duration: 0.25, gain: 0.14, filterFreq: 1800 });
  }

  playCoin() {
    this._tone({ freq: 990, type: 'square', duration: 0.06, gain: 0.12 });
    this._tone({ freq: 1320, type: 'square', duration: 0.08, gain: 0.1, delay: 0.05 });
  }

  playCrystal() {
    [660, 880, 1180].forEach((f, i) => {
      this._tone({ freq: f, type: 'sine', duration: 0.16, gain: 0.18, delay: i * 0.05 });
    });
  }

  playGem() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      this._tone({ freq: f, type: 'triangle', duration: 0.18, gain: 0.2, delay: i * 0.06 });
    });
  }

  playShieldActivate() {
    this._tone({ freq: 220, type: 'sawtooth', duration: 0.3, gain: 0.16, glideTo: 700 });
    this._noiseBurst({ duration: 0.2, gain: 0.1, filterFreq: 3000 });
  }

  playSpeedBoost() {
    this._tone({ freq: 200, type: 'sawtooth', duration: 0.35, gain: 0.18, glideTo: 900 });
  }

  playCollision() {
    this._noiseBurst({ duration: 0.4, gain: 0.32, filterFreq: 600 });
    this._tone({ freq: 140, type: 'sawtooth', duration: 0.35, gain: 0.26, glideTo: 40 });
  }

  playShieldHit() {
    this._tone({ freq: 240, type: 'square', duration: 0.15, gain: 0.2 });
    this._noiseBurst({ duration: 0.15, gain: 0.15, filterFreq: 2200 });
  }

  playGameOver() {
    [392, 330, 262, 196].forEach((f, i) => {
      this._tone({ freq: f, type: 'sawtooth', duration: 0.26, gain: 0.18, delay: i * 0.16 });
    });
  }

  playClick() {
    this._tone({ freq: 720, type: 'square', duration: 0.05, gain: 0.1 });
  }

  /* ---- Epic adventure ambient loop: driving bass pulse + rising arpeggio ---- */
  startMusic() {
    if (this.musicPlaying) return;
    this._ensureContext();
    this.musicPlaying = true;
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.055;
    this.musicGain.connect(this.masterGain);

    const bassNotes = [98, 98, 130.8, 110];
    const leadNotes = [392, 466, 523, 587, 523, 466, 392, 349];
    let step = 0;

    this._musicInterval = setInterval(() => {
      if (this.muted) { step++; return; }
      const t0 = this.ctx.currentTime;

      // bass pulse every beat
      const bassFreq = bassNotes[step % bassNotes.length];
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = bassFreq;
      bassGain.gain.setValueAtTime(0.0001, t0);
      bassGain.gain.linearRampToValueAtTime(0.09, t0 + 0.04);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      bassOsc.connect(bassGain).connect(this.musicGain);
      bassOsc.start(t0);
      bassOsc.stop(t0 + 0.42);

      // lead arpeggio every other beat, adds "epic adventure" motion
      if (step % 2 === 0) {
        const leadFreq = leadNotes[(step / 2) % leadNotes.length];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.value = leadFreq;
        leadGain.gain.setValueAtTime(0.0001, t0);
        leadGain.gain.linearRampToValueAtTime(0.05, t0 + 0.03);
        leadGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        leadOsc.connect(leadGain).connect(this.musicGain);
        leadOsc.start(t0);
        leadOsc.stop(t0 + 0.55);
      }
      step++;
    }, 260);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this._musicInterval) clearInterval(this._musicInterval);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundManager };
}
