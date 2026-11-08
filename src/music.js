// Original 16-bit RPG-style background music. The melodies and progressions here are written
// for this game (not transcriptions of commercial tracks) and are synthesised on the fly, so
// the demo still ships without audio files. Each theme is an eight-bar loop; a look-ahead
// sequencer schedules 16th-note steps a fraction of a second early to stay glitch-free.

const CHORD_TYPES = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
};

const chord = (root, type = "maj") => ({ root, notes: CHORD_TYPES[type] });
const ev = (step, note, dur, vel = 1) => ({ step, note, dur, vel });
const mtof = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/** Key offset per stage so each ruin speaks in a different mode. */
export const STAGE_TRANSPOSE = [0, 2, -2, 3, -3, 5, -5];

// ---------------------------------------------------------------------------------------------
// Camp: slow harp arpeggios, warm pad and a pentatonic lullaby.
// ---------------------------------------------------------------------------------------------
const CAMP = {
  bpm: 84,
  base: 60,
  bars: 8,
  chords: [
    chord(0, "maj7"), chord(9, "min7"), chord(5, "maj7"), chord(7, "dom7"),
    chord(0, "maj7"), chord(9, "min7"), chord(5, "maj7"), chord(7, "dom7"),
  ],
  melody: [
    [ev(0, 16, 6, 0.9), ev(8, 19, 6, 0.75)],
    [ev(0, 21, 8, 0.85), ev(12, 19, 4, 0.6)],
    [ev(0, 17, 6, 0.8), ev(8, 16, 8, 0.7)],
    [ev(0, 14, 12, 0.7), ev(12, 12, 4, 0.5)],
    [ev(0, 16, 6, 0.9), ev(8, 19, 6, 0.75)],
    [ev(0, 24, 8, 0.8), ev(12, 23, 4, 0.6)],
    [ev(0, 21, 6, 0.85), ev(8, 19, 6, 0.7)],
    [ev(0, 16, 14, 0.75)],
  ],
  lead: { type: "triangle", vol: 0.028, filter: 3200, send: 0.32 },
  arp: { type: "triangle", vol: 0.013, filter: 4200, send: 0.28 },
  bass: { type: "sine", vol: 0.07, filter: 700, send: 0.06 },
  pad: { vol: 0.006, cutoff: 1300, send: 0.34 },
  bassLine(bar, s, ch) {
    if (s === 0) return { note: ch.root - 12, dur: 8, vel: 0.9 };
    if (s === 8) return { note: ch.root - 5, dur: 5, vel: 0.6 };
    if (s === 14) return { note: ch.root - 12, dur: 2, vel: 0.45 };
    return null;
  },
  arpLine(bar, s, ch) {
    if (s % 2) return null;
    const order = [0, 1, 2, 3, 2, 1, 2, 3];
    const idx = order[(s / 2) % order.length] % ch.notes.length;
    return {
      note: ch.root + 12 + ch.notes[idx], dur: 2,
      vel: s === 0 ? 0.8 : 0.55, pan: (s / 2) % 2 ? 0.28 : -0.28,
    };
  },
  drumLine(bar, s) {
    return s % 4 === 2 ? ["shaker"] : null;
  },
};

// ---------------------------------------------------------------------------------------------
// Battle: driving eighth-note bass, a restless square lead and a 16-bit backbeat.
// ---------------------------------------------------------------------------------------------
const BATTLE = {
  bpm: 132,
  base: 57,
  bars: 8,
  chords: [
    chord(0, "min"), chord(8, "maj"), chord(3, "maj"), chord(10, "maj"),
    chord(0, "min"), chord(8, "maj"), chord(3, "maj"), chord(10, "maj"),
  ],
  melody: [
    [ev(0, 12, 4, 0.9), ev(4, 15, 4, 0.8), ev(8, 19, 4, 0.9), ev(12, 17, 4, 0.7)],
    [ev(0, 15, 6, 0.8), ev(6, 14, 2, 0.6), ev(8, 12, 8, 0.75)],
    [ev(0, 20, 4, 0.9), ev(4, 19, 4, 0.8), ev(8, 15, 4, 0.75), ev(12, 12, 4, 0.65)],
    [ev(0, 10, 8, 0.8), ev(8, 14, 8, 0.75)],
    [ev(0, 24, 4, 0.95), ev(4, 22, 4, 0.8), ev(8, 19, 4, 0.85), ev(12, 17, 4, 0.75)],
    [ev(0, 15, 4, 0.8), ev(4, 17, 4, 0.8), ev(8, 19, 8, 0.85)],
    [ev(0, 20, 4, 0.9), ev(4, 19, 4, 0.8), ev(8, 17, 4, 0.75), ev(12, 15, 4, 0.7)],
    [ev(0, 14, 8, 0.8), ev(8, 12, 6, 0.7)],
  ],
  lead: { type: "square", vol: 0.019, filter: 3800, send: 0.24, double: "square" },
  arp: { type: "triangle", vol: 0.009, filter: 3600, send: 0.18 },
  bass: { type: "triangle", vol: 0.085, filter: 900, send: 0.05 },
  pad: { vol: 0.0042, cutoff: 1100, send: 0.28 },
  bassLine(bar, s, ch) {
    if (s % 2) return null;
    const pattern = [0, 0, 7, 0, 0, 12, 7, 0];
    const i = s / 2;
    return { note: ch.root - 12 + pattern[i], dur: 1.7, vel: i === 0 ? 0.95 : i === 3 ? 0.6 : 0.72 };
  },
  arpLine(bar, s, ch) {
    if (s % 2) return null;
    const order = [0, 1, 2, 1];
    const idx = order[(s / 2) % order.length] % ch.notes.length;
    return {
      note: ch.root + 12 + ch.notes[idx], dur: 1.5,
      vel: 0.5, pan: s % 4 ? 0.32 : -0.32,
    };
  },
  drumLine(bar, s) {
    const hits = [];
    if (s === 0 || s === 8) hits.push("kick");
    if (s === 6 || s === 14) hits.push("ghostKick");
    if (s === 4 || s === 12) hits.push("snare");
    if (s % 2 === 0) hits.push(s === 14 ? "openhat" : "hat");
    if (bar % 4 === 0 && s === 0) hits.push("crash");
    return hits.length ? hits : null;
  },
};

// ---------------------------------------------------------------------------------------------
// Boss: faster, heavier, with a sixteenth-note bass and a harmonic-minor lead.
// ---------------------------------------------------------------------------------------------
const BOSS = {
  bpm: 150,
  base: 50,
  bars: 8,
  chords: [
    chord(0, "min"), chord(8, "maj"), chord(5, "min"), chord(7, "maj"),
    chord(0, "min"), chord(8, "maj"), chord(5, "min"), chord(7, "maj"),
  ],
  melody: [
    [ev(0, 24, 4, 0.95), ev(4, 27, 4, 0.85), ev(8, 31, 4, 0.9), ev(12, 29, 4, 0.8)],
    [ev(0, 27, 6, 0.85), ev(6, 26, 2, 0.65), ev(8, 24, 8, 0.8)],
    [ev(0, 32, 4, 0.9), ev(4, 31, 4, 0.85), ev(8, 27, 4, 0.8), ev(12, 24, 4, 0.75)],
    [ev(0, 19, 8, 0.8), ev(8, 23, 8, 0.85)],
    [ev(0, 31, 4, 0.95), ev(4, 29, 4, 0.85), ev(8, 27, 4, 0.85), ev(12, 26, 4, 0.8)],
    [ev(0, 27, 4, 0.85), ev(4, 29, 4, 0.85), ev(8, 31, 8, 0.9)],
    [ev(0, 32, 4, 0.9), ev(4, 31, 4, 0.85), ev(8, 29, 4, 0.8), ev(12, 27, 4, 0.75)],
    [ev(0, 26, 4, 0.85), ev(4, 23, 4, 0.8), ev(8, 24, 8, 0.9)],
  ],
  lead: { type: "sawtooth", vol: 0.016, filter: 3000, send: 0.22, double: "square" },
  arp: { type: "triangle", vol: 0.008, filter: 3200, send: 0.16 },
  bass: { type: "sawtooth", vol: 0.075, filter: 620, send: 0.05 },
  pad: { vol: 0.005, cutoff: 900, send: 0.3 },
  bassLine(bar, s, ch) {
    const pattern = [0, 0, 12, 0, 7, 0, 12, 7, 0, 0, 12, 0, 7, 10, 12, 7];
    return { note: ch.root - 12 + pattern[s], dur: 0.9, vel: s % 4 === 0 ? 1 : 0.64 };
  },
  arpLine(bar, s, ch) {
    if (s % 2) return null;
    const order = [0, 2, 1, 3, 2, 1, 0, 2];
    const idx = order[(s / 2) % order.length] % ch.notes.length;
    return {
      note: ch.root + 12 + ch.notes[idx], dur: 1.2,
      vel: 0.48, pan: s % 4 ? 0.35 : -0.35,
    };
  },
  drumLine(bar, s) {
    const hits = [];
    if (s === 0 || s === 6 || s === 8 || s === 14) hits.push("kick");
    if (s === 4 || s === 12) hits.push("snare");
    if (s % 2 === 0) hits.push(s === 14 ? "openhat" : "hat");
    if (bar % 4 === 0 && s === 0) hits.push("crash");
    return hits.length ? hits : null;
  },
};

export const MUSIC_THEMES = { camp: CAMP, battle: BATTLE, boss: BOSS };

export class MusicSequencer {
  constructor(engine) {
    this.engine = engine;
    this.name = null;
    this.transpose = 0;
    this.step = 0;
    this.nextTime = 0;
    this.pending = null;
    this.switchAt = 0;
    this.timer = null;
    this.level = 1.35;
  }

  get ctx() { return this.engine.ctx; }
  get bus() { return this.engine.musicBus; }
  get def() { return this.name ? MUSIC_THEMES[this.name] : null; }
  get stepDur() { return this.def ? 60 / this.def.bpm / 4 : 0.125; }

  setTheme(name, transpose = 0, immediate = false) {
    if (!MUSIC_THEMES[name]) return;
    const nextTranspose = transpose | 0;
    if (this.pending) {
      if (this.pending.name === name && this.pending.transpose === nextTranspose) return;
    } else if (this.name === name && this.transpose === nextTranspose) {
      return;
    }
    const ctx = this.ctx;
    if (!ctx || immediate || this.engine.isOffline) {
      this.name = name;
      this.transpose = nextTranspose;
      this.step = 0;
      this.pending = null;
      this.nextTime = ctx ? ctx.currentTime + 0.04 : 0;
      return;
    }
    const now = ctx.currentTime;
    this.pending = { name, transpose: nextTranspose };
    this.switchAt = Math.max(now + 0.45, this.nextTime + 0.08);
    const g = this.engine.musicFade.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.18, this.switchAt - 0.06);
    g.linearRampToValueAtTime(1, this.switchAt + 0.45);
  }

  startClock() {
    if (this.timer || this.engine.isOffline || typeof setInterval !== "function") return;
    this.timer = setInterval(() => this.tick(0.45), 120);
    this.timer.unref?.();
    this.tick(0.45);
  }

  stopClock() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  resumeClock() {
    if (!this.ctx) return;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.step = 0;
    this.startClock();
  }

  /** Schedule every step that starts before `now + ahead`. Also used by offline render tests. */
  tick(ahead = 0.45) {
    const ctx = this.ctx;
    if (!ctx || !this.name) return;
    if (this.nextTime < ctx.currentTime - 0.1) this.nextTime = ctx.currentTime + 0.03;
    const until = ctx.currentTime + ahead;
    let guard = 0;
    while (this.nextTime < until && guard++ < 512) {
      if (this.pending && this.nextTime >= this.switchAt) {
        this.name = this.pending.name;
        this.transpose = this.pending.transpose;
        this.pending = null;
        this.step = 0;
      }
      this.scheduleStep(this.step, this.nextTime);
      this.step = (this.step + 1) % (this.def.bars * 16);
      this.nextTime += this.stepDur;
    }
  }

  scheduleStep(step, time) {
    const def = this.def;
    const bar = Math.floor(step / 16) % def.bars;
    const s = step % 16;
    const ch = def.chords[bar];
    const base = def.base + this.transpose;
    if (s === 0) this.pad(time, base, ch, def);
    const bass = def.bassLine?.(bar, s, ch);
    if (bass) this.bassNote(time, base + bass.note, bass, def);
    const arp = def.arpLine?.(bar, s, ch);
    if (arp) this.arpNote(time, base + arp.note, arp, def);
    for (const note of def.melody[bar]) {
      if (note.step === s) this.leadNote(time, base + note.note, note, def);
    }
    const hits = def.drumLine?.(bar, s);
    if (hits) for (const hit of hits) this.drum(time, hit);
  }

  pad(time, base, ch, def) {
    const cfg = def.pad;
    const dur = this.stepDur * 16;
    const notes = ch.notes;
    notes.forEach((interval, i) => {
      const midi = base + ch.root + interval;
      const pan = (i - (notes.length - 1) / 2) * 0.18;
      for (const detune of [-7, 7]) {
        this.engine.osc({
          at: time, bus: this.bus, f: mtof(midi), dur, type: "sawtooth",
          vol: cfg.vol * 0.6 * this.level, attack: 0.3, detune, send: cfg.send, pan,
          filter: { type: "lowpass", f: cfg.cutoff, q: 0.5 },
        });
      }
      this.engine.osc({
        at: time, bus: this.bus, f: mtof(midi - 12), dur, type: "sine",
        vol: cfg.vol * 0.9 * this.level, attack: 0.25, send: cfg.send * 0.7, pan,
      });
    });
  }

  leadNote(time, midi, evt, def) {
    const cfg = def.lead;
    const dur = Math.max(0.07, evt.dur * this.stepDur * 0.92);
    const vol = cfg.vol * (evt.vel ?? 1) * this.level;
    this.engine.osc({
      at: time, bus: this.bus, f: mtof(midi), dur, type: cfg.type, vol,
      attack: cfg.attack ?? 0.006, send: cfg.send, pan: cfg.pan ?? 0,
      filter: { type: "lowpass", f: cfg.filter, q: 0.6 },
    });
    if (cfg.double) {
      this.engine.osc({
        at: time, bus: this.bus, f: mtof(midi), dur, type: cfg.double, vol: vol * 0.35,
        attack: cfg.attack ?? 0.006, detune: 7, send: cfg.send, pan: (cfg.pan ?? 0) + 0.12,
        filter: { type: "lowpass", f: cfg.filter, q: 0.6 },
      });
    }
  }

  arpNote(time, midi, evt, def) {
    const cfg = def.arp;
    const dur = Math.max(0.05, evt.dur * this.stepDur * 0.8);
    this.engine.osc({
      at: time, bus: this.bus, f: mtof(midi), dur, type: cfg.type ?? "triangle",
      vol: cfg.vol * (evt.vel ?? 1) * this.level, attack: 0.004, send: cfg.send, pan: evt.pan ?? 0,
      filter: { type: "lowpass", f: cfg.filter ?? 4000, q: 0.5 },
    });
  }

  bassNote(time, midi, evt, def) {
    const cfg = def.bass;
    const dur = Math.max(0.07, evt.dur * this.stepDur * 0.95);
    const vol = cfg.vol * (evt.vel ?? 1) * this.level;
    this.engine.osc({
      at: time, bus: this.bus, f: mtof(midi), dur, type: cfg.type, vol,
      attack: 0.006, send: cfg.send, filter: { type: "lowpass", f: cfg.filter, q: 0.8 },
    });
    this.engine.osc({
      at: time, bus: this.bus, f: mtof(midi - 12), dur, type: "sine",
      vol: vol * 0.45, attack: 0.01, send: cfg.send,
    });
  }

  drum(time, kind) {
    const engine = this.engine;
    const bus = this.bus;
    if (kind === "kick") {
      engine.osc({ at: time, bus, f: 150, f2: 42, dur: 0.14, type: "sine", vol: 0.09 * this.level, attack: 0.002, send: 0.06 });
      engine.noise({ at: time, bus, dur: 0.018, vol: 0.022 * this.level, type: "highpass", f: 2600 });
    } else if (kind === "ghostKick") {
      engine.osc({ at: time, bus, f: 118, f2: 48, dur: 0.09, type: "sine", vol: 0.04 * this.level, attack: 0.002, send: 0.04 });
    } else if (kind === "snare") {
      engine.noise({ at: time, bus, dur: 0.13, vol: 0.05 * this.level, type: "highpass", f: 1700, q: 0.7, send: 0.16 });
      engine.osc({ at: time, bus, f: 195, f2: 118, dur: 0.07, type: "triangle", vol: 0.028 * this.level, attack: 0.002, send: 0.08 });
    } else if (kind === "hat") {
      engine.noise({ at: time, bus, dur: 0.035, vol: 0.008 * this.level, type: "highpass", f: 7200, q: 0.6, send: 0.04 });
    } else if (kind === "openhat") {
      engine.noise({ at: time, bus, dur: 0.2, vol: 0.01 * this.level, type: "highpass", f: 6500, q: 0.6, send: 0.1 });
    } else if (kind === "shaker") {
      engine.noise({ at: time, bus, dur: 0.05, vol: 0.007 * this.level, type: "highpass", f: 6000, q: 0.5, send: 0.08 });
    } else if (kind === "crash") {
      engine.noise({ at: time, bus, dur: 0.8, vol: 0.03 * this.level, type: "highpass", f: 3800, q: 0.4, send: 0.3 });
    }
  }
}
