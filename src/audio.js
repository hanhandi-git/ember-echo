import { MusicSequencer, STAGE_TRANSPOSE } from "./music.js";

// Procedural WebAudio sound design: every sound is synthesised at runtime, so the demo ships
// without audio files. Sounds are layered (transient / body / tail), routed through a small
// mixer with a generated convolution reverb and a limiter, and gently randomised so repeated
// hits never sound identical. The context only starts after a real gesture, as browsers require.

const PREFS_KEY = "ember-echo-audio";
const VOLUME_KEYS = ["master", "sfx", "music", "ambience"];
const DEFAULT_VOLUMES = { master: 0.8, sfx: 0.9, music: 0.6, ambience: 0.5 };
const SCENE_ROOTS = [55, 61.74, 73.42, 65.41, 82.41, 49, 92.5]; // A1, B1, D2, C2, E2, G1, F#2

// Minimum gap between two plays of the same cue. Prevents machine-gun stacking when several
// enemies are hit in one frame, which used to clip the master bus.
const COOLDOWN = {
  hit: 0.035, crit: 0.06, slash: 0.04, slash2: 0.04, cleave: 0.09, quick: 0.05,
  cast: 0.05, fire: 0.08, ice: 0.08, thunder: 0.11, meteor: 0.13, heal: 0.2, shield: 0.16,
  pickup: 0.05, level: 0.25, death: 0.05, hurt: 0.12, dash: 0.06, ui: 0.03, deny: 0.08,
  portal: 0.35, spawn: 0.07, boss: 0.5, phase: 0.6,
};

// Per-cue pitch spread (fraction of the base frequency) so a busy fight stays lively.
const VARIATION = {
  hit: 0.09, crit: 0.06, slash: 0.07, slash2: 0.07, cleave: 0.05, quick: 0.05,
  cast: 0.03, fire: 0.04, ice: 0.03, thunder: 0.02, meteor: 0.02, pickup: 0.015,
  death: 0.05, hurt: 0.04, dash: 0.05, ui: 0.012, spawn: 0.05,
};

const DUCK = { boss: 0.4, meteor: 0.5, phase: 0.45, thunder: 0.35 };

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function clamp01(v) { return clamp(Number(v) || 0, 0, 1); }

function loadPrefs() {
  const out = { ...DEFAULT_VOLUMES, muted: false };
  try {
    if (typeof localStorage === "undefined") return out;
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return out;
    const data = JSON.parse(raw);
    for (const key of VOLUME_KEYS) if (Number.isFinite(data?.[key])) out[key] = clamp01(data[key]);
    out.muted = !!data?.muted;
  } catch {
    /* private mode or corrupt payload: keep defaults */
  }
  return out;
}

function savePrefs(volume, muted) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      master: volume.master, sfx: volume.sfx, music: volume.music, ambience: volume.ambience, muted,
    }));
  } catch {
    /* quota or private mode */
  }
}

export class AudioEngine {
  /** `options.ambience === false` skips the drone (offline render tests, SFX-only screens). */
  constructor(options = {}) {
    this.options = options;
    this.ctx = null;
    this.master = null;
    this.comp = null;
    this.sfxBus = null;
    this.ambBus = null;
    this.ambDuck = null;
    this.sfxSend = null;
    this.musicSend = null;
    this.ambSend = null;
    this.musicBus = null;
    this.musicFade = null;
    this.music = null;
    this.isOffline = false;
    this.reverb = null;
    this.reverbReturn = null;
    this.noiseBuf = null;
    this.pad = null;

    const prefs = loadPrefs();
    this.volume = { master: prefs.master, sfx: prefs.sfx, music: prefs.music, ambience: prefs.ambience };
    this.muted = prefs.muted;
    this.scene = { camp: false, stageIndex: 0, boss: false };
    this._lastPlay = new Map();
  }

  get settings() {
    return { ...this.volume, muted: this.muted };
  }

  /** `context` is an optional OfflineAudioContext hook used by the render test harness. */
  unlock(context = null) {
    if (this.ctx) {
      if (!context && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!context && !AC) return;
    const c = context ?? new AC();
    this.ctx = c;

    // master → destination; the limiter keeps layered hits from clipping
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume.master;
    this.master.connect(c.destination);

    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -15;
    this.comp.knee.value = 12;
    this.comp.ratio.value = 7;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.16;
    this.comp.connect(this.master);

    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = this.volume.sfx;
    this.sfxBus.connect(this.comp);

    this.ambBus = c.createGain();
    this.ambBus.gain.value = this.volume.ambience;
    this.ambDuck = c.createGain();
    this.ambDuck.gain.value = 1;
    this.ambBus.connect(this.ambDuck).connect(this.comp);

    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.volume.music;
    this.musicFade = c.createGain();
    this.musicFade.gain.value = 1;
    this.musicBus.connect(this.musicFade).connect(this.comp);

    // one generated plate-ish impulse shared by every send
    this.reverb = c.createConvolver();
    this.reverb.buffer = this.makeImpulse(1.8, 2.6);
    this.reverbReturn = c.createGain();
    this.reverbReturn.gain.value = 0.42;
    this.reverb.connect(this.reverbReturn).connect(this.comp);

    // reverb sends sit behind their bus volume, so a fader at 0 really is silent
    this.sfxSend = c.createGain();
    this.sfxSend.gain.value = this.volume.sfx;
    this.sfxSend.connect(this.reverb);
    this.musicSend = c.createGain();
    this.musicSend.gain.value = this.volume.music;
    this.musicSend.connect(this.reverb);
    this.ambSend = c.createGain();
    this.ambSend.gain.value = this.volume.ambience;
    this.ambSend.connect(this.reverb);

    this.noiseBuf = this.makeNoise(2);
    this.isOffline = !!context;
    if (this.options.ambience !== false) this.startAmbience();
    if (this.options.music !== false) {
      this.music = new MusicSequencer(this);
      const scene = this.musicScene();
      this.music.setTheme(scene.name, scene.transpose, true);
      this.music.startClock();
    }
    if (!context && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!this.music) return;
        if (document.hidden) this.music.stopClock();
        else this.music.resumeClock();
      });
    }
    if (!context && c.state === "suspended") c.resume().catch(() => {});
  }

  /** Smooth, dark stereo impulse: early reflections plus a long diffuse tail. */
  makeImpulse(seconds = 1.8, decay = 2.6) {
    const c = this.ctx;
    const rate = c.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const buf = c.createBuffer(2, len, rate);
    const taps = [0.011, 0.023, 0.041, 0.067];
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const n = Math.random() * 2 - 1;
        lp += (n - lp) * 0.34;
        d[i] = (lp * 0.85 + n * 0.3) * Math.pow(1 - t, decay);
      }
      taps.forEach((sec, k) => {
        const i = Math.floor((sec + (ch ? 0.004 : 0)) * rate);
        if (i < len) d[i] += (k % 2 ? -1 : 1) * (0.21 / (k + 1));
      });
    }
    return buf;
  }

  /** Loop-friendly noise bed, used for wind and every noisy transient. */
  makeNoise(seconds = 2) {
    const c = this.ctx;
    const len = Math.max(1, Math.floor(c.sampleRate * seconds));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const fade = Math.min(Math.floor(c.sampleRate * 0.012), len >> 2);
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] *= k;
      d[len - 1 - i] *= k;
    }
    return buf;
  }

  setMuted(m) {
    this.muted = !!m;
    savePrefs(this.volume, this.muted);
    if (this.master && this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume.master, t, 0.02);
    }
    return this.muted;
  }

  toggleMuted() {
    return this.setMuted(!this.muted);
  }

  setVolume(kind, value, { persist = true } = {}) {
    if (!VOLUME_KEYS.includes(kind)) return this.volume;
    const v = clamp01(value);
    this.volume[kind] = v;
    if (persist) this.persistPrefs();
    if (!this.ctx) return this.volume;
    const t = this.ctx.currentTime;
    if (kind === "master" && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : v, t, 0.03);
    } else if (kind === "sfx" && this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(v, t, 0.03);
      this.sfxSend?.gain.setTargetAtTime(v, t, 0.03);
    } else if (kind === "music" && this.musicBus) {
      this.musicBus.gain.setTargetAtTime(v, t, 0.04);
      this.musicSend?.gain.setTargetAtTime(v, t, 0.04);
    } else if (kind === "ambience" && this.ambBus) {
      this.ambBus.gain.setTargetAtTime(v, t, 0.05);
      this.ambSend?.gain.setTargetAtTime(v, t, 0.05);
    }
    return this.volume;
  }

  persistPrefs() {
    savePrefs(this.volume, this.muted);
  }

  /** Which loop fits the current place: camp, a stage fight, or the warden's duel. */
  musicScene() {
    const s = this.scene;
    const name = s.camp ? "camp" : s.boss ? "boss" : "battle";
    const stage = Math.max(0, Math.floor(s.stageIndex ?? 0));
    const transpose = name === "battle" ? STAGE_TRANSPOSE[stage % STAGE_TRANSPOSE.length] : 0;
    return { name, transpose };
  }

  /** Stage-aware ambient bed and music. Patches merge, so `setScene({ boss: true })` is enough. */
  setScene(patch = {}) {
    this.scene = { ...this.scene, ...patch };
    this.applyScene();
    if (this.music) {
      const scene = this.musicScene();
      this.music.setTheme(scene.name, scene.transpose);
    }
  }

  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  applyScene() {
    if (!this.pad || !this.ctx) return;
    const { lp, bus, windGain, pulseGain } = this.pad;
    const s = this.scene;
    // Boss music is in D minor: keep the drone on D instead of the stage's F# root.
    const root = s.camp ? 55 : s.boss ? 73.42 : SCENE_ROOTS[Math.max(0, Math.floor(s.stageIndex ?? 0)) % SCENE_ROOTS.length];
    const t = this.ctx.currentTime;
    for (const { o, ratio } of this.pad.oscs) o.frequency.setTargetAtTime(root * ratio, t, 0.9);
    lp.frequency.setTargetAtTime(s.camp ? 380 : s.boss ? 620 : 300, t, 1.2);
    bus.gain.setTargetAtTime(s.camp ? 0.04 : s.boss ? 0.07 : 0.055, t, 1.0);
    windGain.gain.setTargetAtTime(s.camp ? 0.012 : 0.02, t, 1.0);
    pulseGain.gain.setTargetAtTime(s.boss ? 0.015 : 0.0001, t, 0.9);
  }

  // ---------------------------------------------------------------------------------------
  // Ambience: a slow drone tuned per stage, a breathing wind layer and a boss pulse.
  // ---------------------------------------------------------------------------------------
  startAmbience() {
    const c = this.ctx;
    const bus = c.createGain();
    bus.gain.value = 0.0001;
    bus.connect(this.ambBus);
    const send = c.createGain();
    send.gain.value = 0.3;
    bus.connect(send).connect(this.ambSend);

    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    lp.Q.value = 0.6;
    lp.connect(bus);

    const oscs = [1, 1.5, 2].map((ratio, i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = 55 * ratio;
      o.detune.value = [-5, 6, 0][i];
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.09 : 0.28;
      o.connect(g).connect(lp);
      o.start();
      return { o, ratio };
    });

    // filtered air: gives the ruins a sense of space
    const wind = c.createBufferSource();
    wind.buffer = this.noiseBuf;
    wind.loop = true;
    wind.playbackRate.value = 0.8;
    const windFilter = c.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 520;
    windFilter.Q.value = 0.45;
    const windGain = c.createGain();
    windGain.gain.value = 0.03;
    wind.connect(windFilter).connect(windGain).connect(bus);
    wind.start();

    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 80;
    lfo.connect(lfoDepth).connect(lp.frequency);
    lfo.start();

    // very slow swell so the drone never sits perfectly still
    const swellLfo = c.createOscillator();
    swellLfo.type = "sine";
    swellLfo.frequency.value = 0.037;
    const swellDepth = c.createGain();
    swellDepth.gain.value = 0.018;
    swellLfo.connect(swellDepth).connect(bus.gain);
    swellLfo.start();

    const windLfo = c.createOscillator();
    windLfo.type = "sine";
    windLfo.frequency.value = 0.067;
    const windDepth = c.createGain();
    windDepth.gain.value = 0.018;
    windLfo.connect(windDepth).connect(windGain.gain);
    windLfo.start();

    // a soft heartbeat, gated in only during boss fights
    const pulse = c.createOscillator();
    pulse.type = "sine";
    pulse.frequency.value = 41;
    const trem = c.createGain();
    trem.gain.value = 0.45;
    const pulseGain = c.createGain();
    pulseGain.gain.value = 0.0001;
    pulse.connect(trem).connect(pulseGain).connect(bus);
    pulse.start();
    const pulseLfo = c.createOscillator();
    pulseLfo.type = "sine";
    pulseLfo.frequency.value = 1.45;
    const pulseDepth = c.createGain();
    pulseDepth.gain.value = 0.4;
    pulseLfo.connect(pulseDepth).connect(trem.gain);
    pulseLfo.start();

    this.pad = { bus, lp, oscs, windGain, pulseGain };
    this.applyScene();
  }

  // ---------------------------------------------------------------------------------------
  // Synth primitives
  // ---------------------------------------------------------------------------------------

  /** Route a finished voice to the SFX bus and optionally into the reverb. */
  route(node, { pan = 0, send = 0, bus = null } = {}) {
    const c = this.ctx;
    let out = node;
    if (pan && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      out.connect(p);
      out = p;
    }
    out.connect(bus ?? this.sfxBus);
    if (send > 0) {
      const s = c.createGain();
      s.gain.value = clamp(send, 0, 1);
      const sendBus = bus === this.musicBus ? this.musicSend : bus === this.ambBus ? this.ambSend : this.sfxSend;
      out.connect(s).connect(sendBus);
    }
  }

  osc(opts = {}) {
    const c = this.ctx;
    const {
      f = 440, f2 = null, dur = 0.2, type = "sine", vol = 0.1, attack = 0.004,
      delay = 0, at = null, bus = null, pan = 0, send = 0, pitch = 1, gain = 1, detune = 0,
      filter = null, sweep = "exp",
    } = opts;
    const t0 = at ?? c.currentTime + Math.max(0, delay);
    const end = t0 + Math.max(0.03, dur);
    const peak = Math.max(0.0002, vol * gain);
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f * pitch), t0);
    if (f2) {
      const target = Math.max(20, f2 * pitch);
      if (sweep === "linear") o.frequency.linearRampToValueAtTime(target, end);
      else o.frequency.exponentialRampToValueAtTime(target, end);
    }
    if (detune) o.detune.setValueAtTime(detune, t0);
    let node = o;
    if (filter) {
      const bq = c.createBiquadFilter();
      bq.type = filter.type ?? "lowpass";
      const ff = Math.max(40, (filter.f ?? 800) * pitch);
      bq.frequency.setValueAtTime(ff, t0);
      if (filter.f2) bq.frequency.exponentialRampToValueAtTime(Math.max(40, filter.f2 * pitch), end);
      bq.Q.value = filter.q ?? 0.8;
      node.connect(bq);
      node = bq;
    }
    const g = c.createGain();
    const atk = Math.min(Math.max(0.001, attack), Math.max(0.002, dur * 0.6));
    // Start silent so a future-scheduled note cannot leak its first sample at unity gain.
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    node.connect(g);
    this.route(g, { pan, send, bus });
    o.start(t0);
    o.stop(end + 0.05);
  }

  noise(opts = {}) {
    const c = this.ctx;
    const {
      dur = 0.2, vol = 0.12, type = "bandpass", f = 1200, f2 = null, q = 0.8,
      attack = 0.003, delay = 0, at = null, bus = null, pan = 0, send = 0, pitch = 1, gain = 1,
      rate = 1, offset = null,
    } = opts;
    const t0 = at ?? c.currentTime + Math.max(0, delay);
    const end = t0 + Math.max(0.03, dur);
    const peak = Math.max(0.0002, vol * gain);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    src.playbackRate.value = Math.max(0.25, rate * pitch);
    const bq = c.createBiquadFilter();
    bq.type = type;
    bq.frequency.setValueAtTime(Math.max(40, f), t0);
    if (f2) bq.frequency.exponentialRampToValueAtTime(Math.max(40, f2), end);
    bq.Q.value = q;
    const g = c.createGain();
    const atk = Math.min(Math.max(0.001, attack), Math.max(0.002, dur * 0.6));
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(bq).connect(g);
    this.route(g, { pan, send, bus });
    src.start(t0, offset ?? Math.random() * 1.4);
    src.stop(end + 0.05);
  }

  /** A short sub-bass thump shared by impacts and explosions. */
  thump({ f = 110, f2 = 42, dur = 0.16, vol = 0.13, delay = 0, pan = 0, send = 0, pitch = 1, gain = 1 }) {
    this.osc({ f, f2, dur, vol, type: "sine", attack: 0.004, delay, pan, send, pitch, gain });
  }

  /** Metallic ring used by blades, crits and the boss. */
  ring({ f = 2200, f2 = 900, dur = 0.18, vol = 0.03, delay = 0, pan = 0, send = 0.2, pitch = 1, gain = 1 }) {
    this.osc({ f, f2, dur, vol, type: "sine", attack: 0.002, delay, pan, send, pitch, gain });
    this.osc({ f: f * 1.51, f2: f2 * 1.47, dur: dur * 0.8, vol: vol * 0.5, type: "triangle", delay: delay + 0.004, pan, send, pitch, gain });
  }

  duck(now) {
    if (!this.ambDuck) return;
    const g = this.ambDuck.gain;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(0.45, now, 0.02);
    g.setTargetAtTime(1, now + 0.3, 0.25);
  }

  // ---------------------------------------------------------------------------------------
  // Cue sheet
  // ---------------------------------------------------------------------------------------

  play(name, opts = {}) {
    if (!this.ctx || this.muted) return false;
    const now = this.ctx.currentTime;
    const gap = COOLDOWN[name] ?? 0.02;
    const last = this._lastPlay.get(name) ?? -Infinity;
    if (now - last < gap) return false;
    this._lastPlay.set(name, now);

    const basePitch = Number.isFinite(opts.pitch) ? opts.pitch : 1;
    const spread = VARIATION[name] ?? 0.02;
    const p = basePitch * (1 + (Math.random() * 2 - 1) * spread);
    const gain = Number.isFinite(opts.gain) ? clamp(opts.gain, 0.05, 2) : 1;
    const panBase = Number.isFinite(opts.pan) ? clamp(opts.pan, -1, 1) : 0;
    const pan = clamp(panBase + (Math.random() * 2 - 1) * (name === "ui" ? 0 : 0.025), -1, 1);
    const mix = { pitch: p, gain, pan };

    if (DUCK[name]) this.duck(now);

    switch (name) {
      // --- weapons -----------------------------------------------------------------------
      case "slash":
        this.noise({ ...mix, dur: 0.17, vol: 0.145, type: "bandpass", f: 520, f2: 2600, q: 1.5, attack: 0.022 });
        this.noise({ ...mix, dur: 0.11, vol: 0.05, type: "highpass", f: 2800, f2: 1200, q: 0.8, delay: 0.03 });
        this.ring({ ...mix, f: 2100, f2: 1050, dur: 0.15, vol: 0.032, send: 0.22 });
        this.thump({ ...mix, f: 170, f2: 92, dur: 0.09, vol: 0.04 });
        break;
      case "slash2":
        this.noise({ ...mix, dur: 0.14, vol: 0.16, type: "bandpass", f: 720, f2: 3400, q: 1.7, attack: 0.018 });
        this.noise({ ...mix, dur: 0.09, vol: 0.045, type: "highpass", f: 3600, f2: 1600, q: 0.9, delay: 0.025 });
        this.ring({ ...mix, f: 2700, f2: 1300, dur: 0.12, vol: 0.032, send: 0.2 });
        break;
      case "cleave":
        this.noise({ ...mix, dur: 0.22, vol: 0.14, type: "bandpass", f: 340, f2: 1500, q: 1.2, attack: 0.05 });
        this.noise({ ...mix, dur: 0.34, vol: 0.16, type: "lowpass", f: 1900, f2: 190, q: 0.9, delay: 0.12 });
        this.thump({ ...mix, f: 120, f2: 38, dur: 0.32, vol: 0.14, delay: 0.1, send: 0.1 });
        this.ring({ ...mix, f: 1600, f2: 620, dur: 0.3, vol: 0.022, delay: 0.1, send: 0.3 });
        break;
      case "quick":
        this.noise({ ...mix, dur: 0.1, vol: 0.15, type: "bandpass", f: 900, f2: 2800, q: 1.4, attack: 0.012 });
        this.osc({ ...mix, f: 460, f2: 780, dur: 0.09, type: "triangle", vol: 0.06, send: 0.1 });
        break;
      case "dash":
        this.noise({ ...mix, dur: 0.22, vol: 0.12, type: "bandpass", f: 420, f2: 2400, q: 1.2, attack: 0.03 });
        this.noise({ ...mix, dur: 0.12, vol: 0.04, type: "highpass", f: 3200, f2: 5400, q: 0.7, delay: 0.05 });
        this.osc({ ...mix, f: 150, f2: 520, dur: 0.18, type: "triangle", vol: 0.05 });
        break;

      // --- impacts -----------------------------------------------------------------------
      case "hit":
        this.noise({ ...mix, dur: 0.075, vol: 0.22, type: "lowpass", f: 3200, f2: 420, q: 0.7 });
        this.osc({ ...mix, f: 178, f2: 58, dur: 0.12, type: "triangle", vol: 0.15, send: 0.06 });
        this.thump({ ...mix, f: 92, f2: 40, dur: 0.17, vol: 0.15 });
        break;
      case "crit":
        this.noise({ ...mix, dur: 0.09, vol: 0.16, type: "highpass", f: 3000, f2: 900, q: 0.8 });
        this.noise({ ...mix, dur: 0.18, vol: 0.1, type: "bandpass", f: 1800, f2: 520, q: 0.7, delay: 0.01 });
        this.osc({ ...mix, f: 1500, f2: 430, dur: 0.22, type: "square", vol: 0.05, filter: { type: "lowpass", f: 5200 }, send: 0.2 });
        this.ring({ ...mix, f: 2500, f2: 1200, dur: 0.24, vol: 0.025, delay: 0.02, send: 0.3 });
        this.thump({ ...mix, f: 104, f2: 36, dur: 0.24, vol: 0.15, delay: 0.01, send: 0.1 });
        break;
      case "hurt":
        this.osc({ ...mix, f: 250, f2: 82, dur: 0.24, type: "square", vol: 0.075, filter: { f: 1200, f2: 300 }, send: 0.08 });
        this.noise({ ...mix, dur: 0.18, vol: 0.13, type: "lowpass", f: 1100, f2: 320, q: 0.8 });
        this.thump({ ...mix, f: 86, f2: 40, dur: 0.2, vol: 0.12 });
        break;
      case "death":
        this.osc({ ...mix, f: 320, f2: 52, dur: 0.5, type: "sawtooth", vol: 0.06, filter: { f: 2000, f2: 220 }, send: 0.2 });
        this.noise({ ...mix, dur: 0.42, vol: 0.13, type: "lowpass", f: 2600, f2: 180, q: 0.7 });
        this.thump({ ...mix, f: 76, f2: 34, dur: 0.36, vol: 0.12, delay: 0.02, send: 0.15 });
        break;
      case "deny":
        this.osc({ ...mix, f: 190, f2: 130, dur: 0.07, type: "square", vol: 0.045, filter: { f: 700 } });
        this.osc({ ...mix, f: 150, f2: 105, dur: 0.08, type: "square", vol: 0.04, filter: { f: 600 }, delay: 0.085 });
        break;

      // --- magic -------------------------------------------------------------------------
      case "cast":
        this.osc({ ...mix, f: 240, f2: 660, dur: 0.24, type: "sine", vol: 0.06, send: 0.25 });
        this.osc({ ...mix, f: 362, f2: 995, dur: 0.22, type: "triangle", vol: 0.025, delay: 0.01, send: 0.25 });
        this.noise({ ...mix, dur: 0.28, vol: 0.05, type: "bandpass", f: 700, f2: 2500, q: 0.6, attack: 0.06, send: 0.2 });
        break;
      case "fire":
        this.noise({ ...mix, dur: 0.6, vol: 0.2, type: "lowpass", f: 1200, f2: 170, q: 0.8, attack: 0.006, send: 0.12 });
        this.osc({ ...mix, f: 118, f2: 38, dur: 0.55, type: "sawtooth", vol: 0.13, filter: { type: "lowpass", f: 520, f2: 110 }, send: 0.1 });
        this.thump({ ...mix, f: 76, f2: 32, dur: 0.45, vol: 0.12 });
        for (let i = 0; i < 6; i++) {
          this.noise({
            ...mix, dur: 0.02 + Math.random() * 0.035, vol: 0.035 + Math.random() * 0.025,
            type: "highpass", f: 1800 + Math.random() * 2200, q: 1.1,
            delay: 0.03 + Math.random() * 0.38, pan: pan + (Math.random() * 2 - 1) * 0.2,
          });
        }
        break;
      case "ice":
        [1568, 2093, 2637].forEach((f, i) => {
          this.osc({ ...mix, f, f2: f * 0.985, dur: 0.34 + i * 0.05, type: "sine", vol: 0.028, attack: 0.004, delay: i * 0.028, send: 0.35, pan: pan + (i - 1) * 0.18 });
        });
        this.noise({ ...mix, dur: 0.16, vol: 0.1, type: "highpass", f: 2400, f2: 6200, q: 1.4, send: 0.2 });
        this.osc({ ...mix, f: 118, f2: 54, dur: 0.4, type: "triangle", vol: 0.085, delay: 0.03, send: 0.12 });
        for (let i = 0; i < 3; i++) {
          this.noise({ ...mix, dur: 0.03, vol: 0.05, type: "bandpass", f: 3200 + Math.random() * 2000, q: 2.4, delay: 0.08 + i * 0.07, pan: pan + (i - 1) * 0.25 });
        }
        break;
      case "thunder":
        this.noise({ ...mix, dur: 0.09, vol: 0.26, type: "highpass", f: 2800, q: 0.6, send: 0.15 });
        this.osc({ ...mix, f: 170, f2: 42, dur: 0.32, type: "sawtooth", vol: 0.11, filter: { f: 1600, f2: 120 }, send: 0.2 });
        this.noise({ ...mix, dur: 1.0, vol: 0.19, type: "lowpass", f: 520, f2: 70, q: 0.6, delay: 0.03, send: 0.3 });
        this.thump({ ...mix, f: 58, f2: 29, dur: 1.0, vol: 0.13, delay: 0.02, send: 0.15 });
        break;
      case "meteor":
        this.noise({ ...mix, dur: 0.55, vol: 0.19, type: "lowpass", f: 2400, f2: 130, q: 0.8, attack: 0.005, send: 0.2 });
        this.osc({ ...mix, f: 88, f2: 28, dur: 0.8, type: "sawtooth", vol: 0.16, filter: { type: "lowpass", f: 420, f2: 80 }, send: 0.15 });
        this.thump({ ...mix, f: 68, f2: 26, dur: 0.9, vol: 0.18, send: 0.2 });
        for (let i = 0; i < 5; i++) {
          this.noise({ ...mix, dur: 0.05, vol: 0.05, type: "bandpass", f: 900 + Math.random() * 1800, q: 1.0, delay: 0.1 + Math.random() * 0.5, pan: pan + (Math.random() * 2 - 1) * 0.3, send: 0.2 });
        }
        break;
      case "heal":
        [261.63, 329.63, 392, 523.25].forEach((f, i) => {
          this.osc({ ...mix, f, dur: 1.0, type: "sine", vol: 0.033, attack: i === 0 ? 0.12 : 0.08, delay: i * 0.02, send: 0.4, pan: pan + (i - 1.5) * 0.12 });
        });
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          this.osc({ ...mix, f, dur: 0.5, type: "triangle", vol: 0.022, attack: 0.01, delay: 0.1 + i * 0.085, send: 0.4 });
        });
        this.noise({ ...mix, dur: 0.8, vol: 0.012, type: "highpass", f: 4200, attack: 0.2, send: 0.3 });
        break;
      case "shield":
        this.osc({ ...mix, f: 330, f2: 660, dur: 0.55, type: "triangle", vol: 0.05, attack: 0.03, send: 0.3 });
        this.osc({ ...mix, f: 494, f2: 988, dur: 0.5, type: "sine", vol: 0.032, attack: 0.05, delay: 0.03, send: 0.35 });
        this.osc({ ...mix, f: 1320, f2: 1180, dur: 0.4, type: "sine", vol: 0.014, delay: 0.08, send: 0.4 });
        this.noise({ ...mix, dur: 0.3, vol: 0.02, type: "bandpass", f: 1800, q: 1.2, attack: 0.08, send: 0.3 });
        break;
      case "portal":
        this.osc({ ...mix, f: 160, f2: 620, dur: 0.65, type: "sine", vol: 0.055, attack: 0.03, send: 0.4 });
        this.osc({ ...mix, f: 320, f2: 1240, dur: 0.6, type: "triangle", vol: 0.03, attack: 0.05, delay: 0.06, send: 0.45 });
        this.noise({ ...mix, dur: 0.55, vol: 0.05, type: "bandpass", f: 700, f2: 3200, q: 0.8, attack: 0.1, send: 0.4 });
        [1046.5, 1568].forEach((f, i) => this.osc({ ...mix, f, dur: 0.6, type: "sine", vol: 0.02, delay: 0.22 + i * 0.09, send: 0.5 }));
        break;
      case "spawn":
        this.noise({ ...mix, dur: 0.36, vol: 0.15, type: "lowpass", f: 900, f2: 140, q: 0.9, attack: 0.01, send: 0.2 });
        this.osc({ ...mix, f: 175, f2: 58, dur: 0.34, type: "triangle", vol: 0.055, send: 0.2 });
        break;
      case "phase":
        this.osc({ ...mix, f: 62, f2: 124, dur: 1.3, type: "sawtooth", vol: 0.1, filter: { f: 300, f2: 1600 }, attack: 0.15, send: 0.4 });
        this.osc({ ...mix, f: 93, f2: 186, dur: 1.2, type: "sawtooth", vol: 0.06, detune: 8, filter: { f: 400, f2: 1900 }, attack: 0.2, send: 0.4 });
        this.noise({ ...mix, dur: 1.1, vol: 0.09, type: "highpass", f: 260, f2: 3400, q: 0.7, attack: 0.3, send: 0.35 });
        this.thump({ ...mix, f: 48, f2: 32, dur: 1.2, vol: 0.08, attack: 0.2, send: 0.2 });
        break;
      case "boss":
        [55, 55.4, 41.2].forEach((f, i) => {
          this.osc({ ...mix, f, dur: 1.7, type: "sawtooth", vol: i === 2 ? 0.09 : 0.07, attack: 0.12, send: 0.35, pan: pan + (i - 1) * 0.2 });
        });
        this.osc({ ...mix, f: 110, f2: 82, dur: 1.6, type: "triangle", vol: 0.05, attack: 0.1, filter: { f: 220 }, send: 0.3 });
        this.noise({ ...mix, dur: 1.2, vol: 0.05, type: "lowpass", f: 260, f2: 90, attack: 0.25, send: 0.3 });
        break;

      // --- feedback ----------------------------------------------------------------------
      case "pickup":
        this.osc({ ...mix, f: 1046.5, dur: 0.12, type: "sine", vol: 0.045, send: 0.25 });
        this.osc({ ...mix, f: 1568, dur: 0.2, type: "triangle", vol: 0.038, delay: 0.055, send: 0.3 });
        this.noise({ ...mix, dur: 0.06, vol: 0.012, type: "highpass", f: 5200, delay: 0.055 });
        break;
      case "level":
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
          this.osc({ ...mix, f, dur: 0.55, type: "triangle", vol: 0.032, attack: 0.01, delay: i * 0.085, send: 0.45 });
          this.osc({ ...mix, f: f * 2, dur: 0.3, type: "sine", vol: 0.012, delay: i * 0.085, send: 0.4 });
        });
        this.noise({ ...mix, dur: 0.5, vol: 0.018, type: "highpass", f: 3800, attack: 0.1, send: 0.35 });
        break;
      case "ui":
        this.osc({ ...mix, f: 780, f2: 640, dur: 0.055, type: "square", vol: 0.04, attack: 0.001, filter: { type: "lowpass", f: 2400 } });
        this.noise({ ...mix, dur: 0.025, vol: 0.02, type: "highpass", f: 4000, q: 0.7 });
        break;
      default:
        return false;
    }
    return true;
  }
}
