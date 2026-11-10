/* ---------- audio: everything is synthesised, zero bytes of assets ---------- */
const AU = {
  ctx: null, on: !store.get('mute', false), haptic: store.get('haptic', true), master: null, mus: null, sfxG: null, nbuf: null,
  level: -1, timer: 0, next: 0, step: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      const c = this.ctx = new C();
      const comp = c.createDynamicsCompressor(); comp.connect(c.destination);
      this.master = c.createGain(); this.master.gain.value = this.on ? 0.9 : 0; this.master.connect(comp);
      this.mus = c.createGain(); this.mus.gain.value = 0.0; this.mus.connect(this.master);
      this.sfxG = c.createGain(); this.sfxG.gain.value = 0.5; this.sfxG.connect(this.master);
      const b = this.nbuf = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setOn(v) { this.on = v; store.set('mute', !v); if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.03); },
  buzz(p) { if (this.haptic && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } },
  tone(f, dur, type, vol, to, when, dest) {
    const c = this.ctx; if (!c || !this.on) return;
    const t = when || c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, freq, type, when, dest) {
    const c = this.ctx; if (!c || !this.on) return;
    const t = when || c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.nbuf; f.type = type || 'lowpass'; f.frequency.value = freq || 1200;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfxG); s.start(t); s.stop(t + dur + 0.02);
  },
  sfx(n, a) {
    if (!this.ctx || !this.on) return;
    switch (n) {
      case 'shot': this.tone(880, 0.06, 'square', 0.035, 330); break;
      case 'cry': this.tone(660 * Math.pow(1.06, Math.min(a || 0, 12)), 0.11, 'triangle', 0.22, 1320 * Math.pow(1.06, Math.min(a || 0, 12))); break;
      case 'kill': this.noise(0.18, 0.4, 1800); this.tone(220, 0.16, 'sawtooth', 0.16, 60); break;
      case 'near': this.tone(1200, 0.14, 'sine', 0.2, 2400); break;
      case 'hit': this.noise(0.35, 0.7, 700); this.tone(140, 0.3, 'sawtooth', 0.4, 40); break;
      case 'pu': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.2, 0, this.ctx.currentTime + i * 0.05)); break;
      case 'boost': this.noise(1.2, 0.5, 2600, 'bandpass'); this.tone(110, 1.1, 'sawtooth', 0.25, 880); break;
      case 'full': this.tone(784, 0.1, 'square', 0.1); this.tone(1175, 0.16, 'square', 0.1, 0, this.ctx.currentTime + 0.09); break;
      case 'portal': this.tone(220, 0.7, 'sine', 0.35, 1760); this.noise(0.7, 0.3, 3000, 'highpass'); break;
      case 'warn': [0, 0.28, 0.56].forEach(d => this.tone(520, 0.2, 'square', 0.14, 390, this.ctx.currentTime + d)); break;
      case 'beam': this.noise(0.5, 0.5, 900, 'bandpass'); this.tone(90, 0.5, 'sawtooth', 0.3, 60); break;
      case 'boom': this.noise(1.1, 0.9, 500); this.tone(90, 1, 'sine', 0.6, 25); break;
      case 'mult': this.tone(990, 0.09, 'triangle', 0.18, 1480); break;
      case 'end': [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.22, 0, this.ctx.currentTime + i * 0.09)); break;
      case 'tick': this.tone(1500, 0.04, 'square', 0.06); break;
    }
  },
  /* 16-step sequencer, layers switch on with the run's intensity level 0..4 */
  music(level) {
    if (!this.ctx) return;
    if (level < 0) { clearInterval(this.timer); this.timer = 0; this.level = -1; this.mus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); return; }
    this.level = level; this.mus.gain.setTargetAtTime(0.42, this.ctx.currentTime, 0.3);
    if (this.timer) return;
    this.next = this.ctx.currentTime + 0.05; this.step = 0;
    this.timer = setInterval(() => this.sched(), 30);
  },
  sched() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const L = this.level, bpm = L >= 4 ? 148 : L >= 3 ? 140 : 132, sl = 60 / bpm / 4;
    if (this.next < c.currentTime - 0.3) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.12) {
      const s = this.step % 16, bar = (this.step >> 4) % 4, t = this.next;
      const roots = L >= 4 ? [58.27, 58.27, 69.3, 65.41] : [55, 55, 43.65, 49];
      const root = roots[bar];
      if (this.on) {
        if (s % 2 === 0 || L >= 3) this.tone(root * (s % 8 === 6 ? 2 : 1), sl * 0.9, 'sawtooth', L >= 3 ? 0.2 : 0.26, 0, t, this.mus);
        if (L >= 1 && s % 4 === 0) { this.tone(150, 0.14, 'sine', 0.7, 42, t, this.mus); }
        if (L >= 2 && s % 4 === 2) this.noise(0.04, 0.16, 7000, 'highpass', t, this.mus);
        if (L >= 3 && (s === 4 || s === 12)) this.noise(0.12, 0.3, 1800, 'bandpass', t, this.mus);
        if (L >= 2) { const arp = [4, 6, 8, 12, 8, 6][this.step % 6]; if (L >= 3 || s % 2 === 0) this.tone(root * arp, sl * 0.8, 'square', 0.035, 0, t, this.mus); }
      }
      this.next += sl; this.step++;
    }
  }
};
