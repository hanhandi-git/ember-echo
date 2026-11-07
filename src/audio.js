// A tiny WebAudio synth: every sound is generated, so the demo ships with no audio files.
// The context only starts after a real gesture (click / key press), as browsers require.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noiseBuf = null;
    this.pad = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.62;
    this.master.connect(this.ctx.destination);
    // one second of white noise, reused by every noisy sound
    const n = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, n, n);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.startPad();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.62, this.ctx.currentTime, 0.03);
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  // A soft, slow drone under the fight. Two detuned sines and a filtered breath of noise.
  startPad() {
    const c = this.ctx;
    const bus = c.createGain();
    bus.gain.value = 0.055;
    bus.connect(this.master);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    lp.Q.value = 0.6;
    lp.connect(bus);
    const notes = [55, 82.5, 110];
    const oscs = notes.map((f, i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = i === 1 ? 6 : -4;
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.12 : 0.3;
      o.connect(g).connect(lp);
      o.start();
      return { o, g };
    });
    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.055;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.028;
    lfo.connect(lfoGain).connect(bus.gain);
    lfo.start();
    this.pad = { bus, lp, oscs };
  }

  tone({ f = 440, f2 = null, dur = 0.15, type = "sine", vol = 0.1, attack = 0.005, delay = 0, filter = null }) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f), t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (filter) {
      const bq = c.createBiquadFilter();
      bq.type = filter.type ?? "lowpass";
      bq.frequency.setValueAtTime(filter.f ?? 800, t0);
      if (filter.f2) bq.frequency.exponentialRampToValueAtTime(filter.f2, t0 + dur);
      bq.Q.value = filter.q ?? 0.8;
      node.connect(bq);
      node = bq;
    }
    node.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.15, vol = 0.12, type = "highpass", f = 800, f2 = null, q = 0.7, delay = 0, attack = 0.004 }) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bq = c.createBiquadFilter();
    bq.type = type;
    bq.frequency.setValueAtTime(f, t0);
    if (f2) bq.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + dur);
    bq.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bq).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "slash":
        this.noise({ dur: 0.13, vol: 0.14, type: "highpass", f: 1800, f2: 320, q: 1.2 });
        this.tone({ f: 520, f2: 180, dur: 0.09, type: "square", vol: 0.035 });
        break;
      case "slash2":
        this.noise({ dur: 0.12, vol: 0.15, type: "highpass", f: 2400, f2: 500, q: 1.4 });
        this.tone({ f: 700, f2: 240, dur: 0.1, type: "square", vol: 0.03 });
        break;
      case "cleave":
        this.noise({ dur: 0.28, vol: 0.2, type: "lowpass", f: 1600, f2: 180, q: 0.9 });
        this.tone({ f: 120, f2: 46, dur: 0.3, type: "sawtooth", vol: 0.12 });
        break;
      case "hit":
        this.noise({ dur: 0.08, vol: 0.2, type: "lowpass", f: 1200, f2: 220, q: 0.7 });
        this.tone({ f: 150, f2: 80, dur: 0.08, type: "triangle", vol: 0.1 });
        break;
      case "crit":
        this.noise({ dur: 0.16, vol: 0.22, type: "bandpass", f: 2600, f2: 600, q: 0.9 });
        this.tone({ f: 880, f2: 220, dur: 0.18, type: "square", vol: 0.07 });
        break;
      case "fire":
        this.noise({ dur: 0.5, vol: 0.24, type: "lowpass", f: 900, f2: 120, q: 0.8 });
        this.tone({ f: 130, f2: 44, dur: 0.5, type: "sawtooth", vol: 0.16, filter: { type: "lowpass", f: 500, f2: 90 } });
        break;
      case "cast":
        this.tone({ f: 220, f2: 520, dur: 0.2, type: "sine", vol: 0.06 });
        this.noise({ dur: 0.18, vol: 0.05, type: "highpass", f: 1200 });
        break;
      case "ice":
        this.noise({ dur: 0.45, vol: 0.16, type: "highpass", f: 1600, f2: 3400, q: 1.5 });
        this.tone({ f: 1400, f2: 2200, dur: 0.3, type: "sine", vol: 0.05 });
        this.tone({ f: 90, f2: 50, dur: 0.4, type: "triangle", vol: 0.1, delay: 0.06 });
        break;
      case "thunder":
        this.noise({ dur: 0.12, vol: 0.3, type: "highpass", f: 2600, q: 0.6 });
        this.noise({ dur: 0.9, vol: 0.26, type: "lowpass", f: 700, f2: 80, q: 0.6, delay: 0.03 });
        this.tone({ f: 70, f2: 32, dur: 0.9, type: "sawtooth", vol: 0.12, delay: 0.03 });
        break;
      case "heal":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          this.tone({ f, dur: 0.55, type: "sine", vol: 0.055, delay: i * 0.075, attack: 0.02 }));
        this.noise({ dur: 0.6, vol: 0.03, type: "highpass", f: 3000 });
        break;
      case "shield":
        this.tone({ f: 330, f2: 660, dur: 0.5, type: "triangle", vol: 0.06 });
        this.tone({ f: 495, f2: 990, dur: 0.5, type: "sine", vol: 0.04, delay: 0.05 });
        break;
      case "meteor":
        this.noise({ dur: 1.2, vol: 0.32, type: "lowpass", f: 1400, f2: 90, q: 0.8 });
        this.tone({ f: 55, f2: 26, dur: 1.1, type: "sawtooth", vol: 0.2 });
        this.noise({ dur: 0.2, vol: 0.2, type: "highpass", f: 2200, delay: 0.08 });
        break;
      case "hurt":
        this.tone({ f: 240, f2: 90, dur: 0.2, type: "square", vol: 0.08, filter: { f: 900, f2: 300 } });
        this.noise({ dur: 0.14, vol: 0.12, type: "lowpass", f: 800 });
        break;
      case "pickup":
        this.tone({ f: 880, dur: 0.09, type: "square", vol: 0.045 });
        this.tone({ f: 1320, dur: 0.12, type: "square", vol: 0.04, delay: 0.06 });
        break;
      case "level":
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ f, dur: 0.4, type: "triangle", vol: 0.06, delay: i * 0.08 }));
        break;
      case "death":
        this.noise({ dur: 0.35, vol: 0.18, type: "lowpass", f: 1800, f2: 200 });
        this.tone({ f: 300, f2: 70, dur: 0.35, type: "sawtooth", vol: 0.05 });
        break;
      case "boss":
        this.tone({ f: 55, f2: 41, dur: 1.4, type: "sawtooth", vol: 0.12, filter: { f: 180 } });
        this.noise({ dur: 1.0, vol: 0.08, type: "lowpass", f: 300, f2: 100 });
        break;
      case "deny":
        this.tone({ f: 180, f2: 120, dur: 0.08, type: "square", vol: 0.04 });
        break;
      case "phase":
        this.tone({ f: 65, f2: 98, dur: 1.2, type: "sawtooth", vol: 0.12, filter: { f: 400, f2: 900 } });
        this.noise({ dur: 0.5, vol: 0.14, type: "highpass", f: 1200 });
        break;
      case "ui":
        this.tone({ f: 660, dur: 0.06, type: "square", vol: 0.035 });
        break;
      case "spawn":
        this.tone({ f: 160, f2: 380, dur: 0.3, type: "triangle", vol: 0.05 });
        this.noise({ dur: 0.3, vol: 0.05, type: "bandpass", f: 900 });
        break;
      default:
        break;
    }
  }
}
