import { test } from "node:test";
import assert from "node:assert/strict";
import { AudioEngine } from "../src/audio.js";
import { MUSIC_THEMES } from "../src/music.js";
import { Game } from "../src/game.js";

const CUES = [
  "slash", "slash2", "cleave", "quick", "dash", "hit", "impactHeavy", "crit", "hurt", "death", "deny",
  "cast", "fire", "ice", "thunder", "meteor", "heal", "shield", "portal", "spawn", "phase",
  "boss", "pickup", "level", "ui",
];

function param(value = 0) {
  const p = {
    value,
    events: [],
    setValueAtTime(v) { p.value = v; return p; },
    linearRampToValueAtTime(v) { p.value = v; return p; },
    exponentialRampToValueAtTime(v) { p.value = v; return p; },
    setTargetAtTime(v, time) { p.value = v; p.events.push({ value: v, time }); return p; },
    cancelScheduledValues() { return p; },
  };
  return p;
}

function fakeContext() {
  const created = { oscillators: 0, noise: 0, gains: 0, filters: 0, panners: 0, compressors: 0, convolvers: 0 };
  class FakeContext {
    constructor() {
      this.currentTime = 1;
      this.sampleRate = 8000;
      this.state = "running";
      this.destination = { connect() {} };
    }
    resume() { this.state = "running"; return Promise.resolve(); }
    createGain() { created.gains++; return { gain: param(1), connect(n) { return n; } }; }
    createDynamicsCompressor() {
      created.compressors++;
      return { threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect(n) { return n; } };
    }
    createConvolver() { created.convolvers++; return { buffer: null, connect(n) { return n; } }; }
    createBuffer(channels, len) {
      const data = Array.from({ length: channels }, () => new Float32Array(len));
      return { getChannelData: (ch) => data[ch] };
    }
    createOscillator() {
      created.oscillators++;
      return { type: "sine", frequency: param(), detune: param(), connect(n) { return n; }, start() {}, stop() {} };
    }
    createBiquadFilter() { created.filters++; return { type: "lowpass", frequency: param(), Q: param(), connect(n) { return n; } }; }
    createBufferSource() {
      created.noise++;
      return { buffer: null, loop: false, playbackRate: param(), connect(n) { return n; }, start() {}, stop() {} };
    }
    createStereoPanner() { created.panners++; return { pan: param(), connect(n) { return n; } }; }
  }
  const ctx = new FakeContext();
  return { ctx, created };
}

function withStorage() {
  const map = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
  return { map, restore: () => { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; } };
}

function bootAudio() {
  const { ctx, created } = fakeContext();
  const previous = globalThis.AudioContext;
  globalThis.AudioContext = function AudioContext() { return ctx; };
  const engine = new AudioEngine({ music: false });
  engine.unlock();
  return { engine, ctx, created, restore: () => { if (previous === undefined) delete globalThis.AudioContext; else globalThis.AudioContext = previous; } };
}

test("every cue schedules a layered voice without throwing", () => {
  const store = withStorage();
  const audio = bootAudio();
  try {
    for (const name of CUES) {
      audio.engine._lastPlay.clear();
      assert.equal(audio.engine.play(name), true, `cue ${name} should play`);
    }
    assert.ok(audio.created.oscillators > CUES.length, "cues use multiple oscillators");
    assert.ok(audio.created.noise > CUES.length, "cues use noise layers");
    assert.ok(audio.created.compressors === 1, "one limiter on the master chain");
    assert.ok(audio.created.convolvers === 1, "one shared reverb");
    assert.ok(audio.created.panners > 0, "stereo spread is used");
  } finally {
    audio.restore();
    store.restore();
  }
});

test("heavy impacts duck the music separately from its volume setting and recover", () => {
  const store = withStorage(), audio = bootAudio();
  try {
    const { engine, ctx } = audio;
    engine.setVolume("music", 0.25);
    engine.play("impactHeavy");
    const events = engine.musicDuck.gain.events;
    assert.ok(events.some((event) => event.value < 0.7 && event.time === ctx.currentTime));
    assert.ok(events.some((event) => event.value === 1 && event.time > ctx.currentTime));
    assert.equal(engine.musicBus.gain.value, 0.25);
    ctx.currentTime += 0.02;
    engine.play("hit");
    assert.ok(engine._duckDepth < 0.7, "a light hit cannot release the heavy hit's duck early");
    assert.equal(engine.settings.music, 0.25);
  } finally { audio.restore(); store.restore(); }
});

test("unknown cues are ignored and same-cue hits are rate limited", () => {
  const store = withStorage();
  const audio = bootAudio();
  try {
    assert.equal(audio.engine.play("not-a-cue"), false);
    assert.equal(audio.engine.play("hit"), true);
    assert.equal(audio.engine.play("hit"), false, "second hit inside the cooldown window is dropped");
    audio.engine.ctx.currentTime += 0.2;
    assert.equal(audio.engine.play("hit"), true);
  } finally {
    audio.restore();
    store.restore();
  }
});

test("mute gates playback and volume changes clamp and persist", () => {
  const store = withStorage();
  const audio = bootAudio();
  try {
    assert.equal(audio.engine.settings.music, 0.6);
    audio.engine.setVolume("sfx", 0.35);
    assert.equal(audio.engine.sfxBus.gain.value, 0.35);
    assert.equal(audio.engine.setVolume("sfx", 4).sfx, 1);
    assert.equal(audio.engine.setVolume("bogus", 0.5).bogus, undefined);

    audio.engine.setMuted(true);
    assert.equal(audio.engine.play("hit"), false);
    assert.equal(audio.engine.master.gain.value, 0);

    audio.engine.setMuted(false);
    audio.engine._lastPlay.clear();
    assert.equal(audio.engine.play("hit"), true);

    const saved = JSON.parse(store.map.get("ember-echo-audio"));
    assert.equal(saved.sfx, 1);
    assert.equal(saved.master, 0.8);
    assert.equal(saved.muted, false);

    audio.engine.setVolume("ambience", 0.25);
    const restored = new AudioEngine();
    assert.equal(restored.settings.ambience, 0.25);
    assert.equal(restored.settings.sfx, 1);
  } finally {
    audio.restore();
    store.restore();
  }
});

test("scene changes retune the drone and gate the boss pulse", () => {
  const store = withStorage();
  const audio = bootAudio();
  try {
    const { engine } = audio;
    engine.setScene({ camp: true, stageIndex: 0, boss: false });
    assert.equal(Math.round(engine.pad.oscs[0].o.frequency.value), 55);
    assert.equal(engine.pad.pulseGain.gain.value, 0.0001);

    engine.setScene({ camp: false, stageIndex: 2, boss: true });
    assert.equal(Math.round(engine.pad.oscs[0].o.frequency.value), 73);
    assert.equal(engine.pad.oscs[1].o.frequency.value, 73.42 * 1.5);
    assert.equal(engine.pad.pulseGain.gain.value, 0.015);
  } finally {
    audio.restore();
    store.restore();
  }
});

test("music themes are eight complete bars written for this game", () => {
  for (const [name, def] of Object.entries(MUSIC_THEMES)) {
    assert.equal(def.bars, 8, `${name} has eight bars`);
    assert.equal(def.chords.length, 8, `${name} has one chord per bar`);
    assert.equal(def.melody.length, 8, `${name} has one melody phrase per bar`);
    assert.ok(def.bpm >= 80 && def.bpm <= 180, `${name} tempo is playable`);
    assert.ok(def.base > 30 && def.base < 80, `${name} sits in a sane register`);
    for (const bar of def.melody) {
      for (const note of bar) {
        assert.ok(note.step >= 0 && note.step < 16, `${name} note starts inside the bar`);
        assert.ok(note.dur > 0, `${name} note has length`);
        assert.ok(note.note >= 0 && note.note <= 48, `${name} melody stays in range`);
      }
    }
  }
});

test("the sequencer schedules music and swaps camp, battle and boss loops", () => {
  const store = withStorage();
  const { ctx, created } = fakeContext();
  const engine = new AudioEngine({ ambience: false, music: true });
  try {
    engine.unlock(ctx);
    assert.ok(engine.music, "music sequencer exists");
    assert.equal(engine.music.name, "battle", "defaults to the stage loop");
    const before = created.oscillators;
    engine.music.tick(2);
    assert.ok(created.oscillators > before + 10, "ahead scheduling creates notes");

    engine.setScene({ camp: true, stageIndex: 0, boss: false });
    assert.equal(engine.music.name, "camp");
    engine.setScene({ camp: false, stageIndex: 2, boss: true });
    assert.equal(engine.music.name, "boss");
    engine.setScene({ camp: false, stageIndex: 2, boss: false });
    assert.equal(engine.music.name, "battle");
    assert.equal(engine.music.transpose, -2, "stage 2 transposes the battle loop");

    engine.setVolume("music", 0.25);
    assert.equal(engine.musicBus.gain.value, 0.25);
    assert.equal(engine.musicSend.gain.value, 0.25);
    assert.equal(JSON.parse(store.map.get("ember-echo-audio")).music, 0.25);
  } finally {
    store.restore();
  }
});

test("sfxAt pans and attenuates cues away from the hero", () => {
  const calls = [];
  const fakeGame = {
    hero: { x: 100 },
    audio: { play: (name, opts) => { calls.push({ name, opts }); return true; } },
  };
  assert.equal(Game.prototype.sfxAt.call(fakeGame, "hit", 300), true);
  assert.equal(calls[0].opts.pan, 0.85);
  assert.ok(calls[0].opts.gain < 1);

  Game.prototype.sfxAt.call(fakeGame, "hit", 100);
  assert.equal(calls[1].opts.pan, 0);
  assert.equal(calls[1].opts.gain, 1);

  Game.prototype.sfxAt.call(fakeGame, "hit", Number.NaN);
  assert.deepEqual(calls[2].opts, {});
});
