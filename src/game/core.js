// Game facade: session state, stage bootstrap, and pointer routing. Systems live under ./systems/.

import { createFrame } from "../../../pixelfx/src/core/index.js";
import { acquireStageMapTiles } from "./map-tile-pool.js";
import { STAGES, FX } from "../data.js";
import { Hero } from "../hero.js";
import { castSkill } from "../skills.js";
import { UI } from "../ui.js";
import { AudioEngine } from "../audio.js";
import { SKILL_RECTS, RESUME_BUTTON, CAMP_BUTTON, contains } from "../controls.js";
import { stageAct, stageName, stageSub } from "../copy.js";
import { SW, SH, WORLD_W, PALETTE, RENDER_DENSITY } from "./constants.js";
import { createBattleMapWorkers } from "./battle-map-workers.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.canvas.width = SW * RENDER_DENSITY;
    this.canvas.height = SH * RENDER_DENSITY;
    this.ctx.imageSmoothingEnabled = false;
    this.frame = createFrame(SW, SH, 0, 0, RENDER_DENSITY);
    this.uiFrame = createFrame(SW, SH, 0, 0, RENDER_DENSITY);
    this.img = this.ctx.createImageData(this.frame.w, this.frame.h);
    this.audio = new AudioEngine();
    this.fx = FX;
    this.ui = new UI(this);
    this.hero = new Hero();
    this.keys = new Set();
    this.touchMove = { x: 0, y: 0 };
    this.state = "camp";
    this.time = 0;
    this.runTime = 0;
    this.hitStop = 0;
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.impacts = [];
    this.dashTrails = [];
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
    this.kills = 0;
    this.combo = { count: 0, timer: 0 };
    this.shakeState = { amp: 0, t: 0, dur: 0 };
    this.flashState = { color: PALETTE.white, a: 0, max: 0.3 };
    this.fade = 0;
    this.stageIndex = 0;
    this.waveIndex = 0;
    this.phase = "camp";
    this.phaseT = 0;
    this.clearT = 0;
    this.hold = 0;
    this.bossRef = null;
    this.bossDefeated = false;
    this.portal = null;
    this.deathT = 0;
    this.stage = STAGES[0];
    this.language = typeof localStorage !== "undefined" ? (localStorage.getItem("ember-echo-language") || "zh") : "zh";
    this.mapFx = null;
    this.mapFxTiles = [];
    this.mapTileFrames = [];
    this.mapStageIndex = null;
    this.worldW = WORLD_W;
    this.cameraX = 0;
    this.hubActive = false;
    // Hub loading is synchronous only for a lightweight fallback; authored map art
    // is decoded asynchronously by the hub tile pool.
    this.battleMapWorkers = createBattleMapWorkers(this);
    this.loadHub?.();
    this.loadPersistedProfile?.();
  }

  loadStage(index, camp = false) {
    if (camp) {
      this.battleMapWorkers?.unmount();
      this.loadHub?.();
      return;
    }
    const previousHub = this.hubActive;
    this.hubActive = false;
    this.stageIndex = index;
    this.stage = STAGES[index];
    // Start the worker before touching the synchronous fallback map bake. A stage transition
    // is already covered by the travel fade, so keeping the previous map until the worker's
    // first raster arrives avoids blocking the main thread or exposing a blank frame.
    const workerMounted = this.battleMapWorkers?.mountStage(index, this.stage.mapKey) === true;
    if (workerMounted && previousHub) {
      // Do not let the hub PNG remain as the stage's temporary fallback while the
      // worker produces its first raster. Keep the canvas dark until the right map
      // arrives; consecutive battle stages may retain their previous battle map.
      this.mapFx = null;
      this.mapFxTiles = [];
      this.mapTileFrames = [];
      this.mapStageIndex = null;
    } else if (!workerMounted && !this.adoptStagePrewarm?.(index)) {
      const baked = acquireStageMapTiles(index, this.hubActive ? null : this.mapFxTiles);
      this.mapFxTiles = baked?.mapFxTiles ?? [];
      this.mapFx = this.mapFxTiles[0] ?? null;
      this.mapTileFrames = baked?.mapTileFrames ?? [];
      this.mapStageIndex = baked?.index ?? index;
    } else if (!workerMounted) {
      this.mapStageIndex = index;
    }
    this.ui.reset();
    this.hero.spawn(this.stage.map.map.spawns.hero[0], this.stage.map.map.spawns.hero[1]);
    this.cameraX = 0;
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.impacts = [];
    this.hitStop = 0;
    this.shakeState = { amp: 0, t: 0, dur: 0 };
    this.flashState.a = 0;
    this.keys.clear();
    this.touchAttackHeld = false;
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
    this.dashTrails = [];
    this.portal = null;
    this.bossRef = null;
    this.bossDefeated = false;
    this.waveIndex = 0;
    this.phaseT = 0;
    this.clearT = 0;
    this.hold = 0;
    this.deathT = 0;
    this.combo = { count: 0, timer: 0 };
    this.phase = "intro";
    this.state = "playing";
    this.fade = 1;
    this.audio.setScene({ camp: false, stageIndex: index, boss: false });
    {
      this.banner(stageAct(this, this.stage), stageName(this, this.stage), stageSub(this, this.stage));
      this.audio.play("ui");
    }
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.keys.clear();
      this.hero.attackBuffer = 0;
      this.shakeState = { amp: 0, t: 0, dur: 0 };
    } else if (this.state === "paused") {
      this.state = "playing";
    }
  }

  toggleInventory() {
    if (this.state === "playing" && this.phase !== "travel" && this.hero.alive) {
      this.state = "inventory";
      this.keys.clear();
      this.hero.attackBuffer = 0;
      this.ui.inventorySkillPick = null;
      this.domUi?.open("loadout");
      this.audio.play("ui");
    } else if (this.state === "inventory") {
      this.state = "playing";
      this.ui.inventorySkillPick = null;
      this.domUi?.close();
      this.audio.play("ui");
    }
  }

  handlePointer(x, y) {
    if (this.state === "inventory") return this.ui.handlePointer(x, y);
    if (this.state === "paused" && contains(CAMP_BUTTON, x, y)) {
      this.retreatToCamp?.();
      return "camp";
    }
    if (this.state === "paused" && contains(RESUME_BUTTON, x, y)) {
      this.togglePause();
      this.audio.play("ui");
      return "resume";
    }
    if (this.ui.handleAutoPointer(x, y)) return "auto";
    if (this.state !== "playing") return null;
    const slot = this.touchUi ? -1 : SKILL_RECTS.findIndex((rect) => contains(rect, x, y));
    if (slot >= 0) {
      this.cast(this.hero.skillSlots[slot]);
      return "skill";
    }
    return null;
  }

  banner(kicker, title, sub, kind) {
    this.ui.banner(kicker, title, sub, kind);
  }

  toggleMute() {
    this.audio.unlock();
    this.audio.setMuted(!this.audio.muted);
  }

  /** Play a cue anchored at a world x. Keeps off-screen action audible but panned away. */
  sfxAt(name, x, opts = {}) {
    if (!Number.isFinite(x)) return this.audio.play(name, opts);
    const dx = x - (this.hero?.x ?? x);
    const pan = Math.max(-0.85, Math.min(0.85, dx / 210));
    const gain = Math.max(0.42, 1 - Math.abs(dx) / 820);
    return this.audio.play(name, { pan, gain, ...opts });
  }

  /** Test/debug: run a skill by id without the keyboard. */
  cast(id) {
    return castSkill(this, id);
  }
}

export function boot() {
  const canvas = document.querySelector("#game");
  const game = new Game(canvas);
  window.__EMBER__ = game;
  Hero.prepare();
  return game;
}
