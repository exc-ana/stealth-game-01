// Lanternlight — every sound is synthesized with WebAudio: no audio
// files, no network, nothing to load. Footsteps, a coin's ring, the
// rising sting when a guard spots you, and a soft chime for a relic.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.35;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', volume = 0.5, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  footstep(sneaking) {
    this.tone(sneaking ? 140 : 95, 0.07, 'triangle', sneaking ? 0.05 : 0.14);
  }

  coin() {
    this.tone(2093, 0.5, 'sine', 0.22);
    this.tone(2637, 0.4, 'sine', 0.14, 0.05);
  }

  pickup() {
    this.tone(880, 0.14, 'sine', 0.3);
    this.tone(1318, 0.22, 'sine', 0.26, 0.09);
  }

  suspicious() {
    this.tone(330, 0.25, 'square', 0.12, 0, 392);
  }

  spotted() {
    this.tone(220, 0.5, 'sawtooth', 0.22, 0, 110);
    this.tone(440, 0.4, 'square', 0.12, 0.08, 220);
  }

  caught() {
    this.tone(196, 0.7, 'sawtooth', 0.25, 0, 65);
  }

  win() {
    [523, 659, 784, 1046].forEach((freq, i) => this.tone(freq, 0.3, 'sine', 0.25, i * 0.11));
  }

  exitOpen() {
    this.tone(660, 0.2, 'sine', 0.2);
    this.tone(990, 0.3, 'sine', 0.18, 0.1);
  }
}
