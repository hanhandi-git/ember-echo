// The loop: a 480×180 scrolling world shown through a 320×180 viewport, a duelist, critters, six spells and three acts. The map, every
// creature and every spell is a pixelfx module; this file is the game around them.

import { createFrame, clearFrame, createFx, painterFor, composite, hex, clamp, TAU } from "../../pixelfx/src/core/index.js";
import { STAGES, FX, LOOT } from "./data.js";
import { Hero } from "./hero.js";
import { Boss } from "./enemies.js";
import { castSkill, explodeFireball } from "./skills.js";
import { UI } from "./ui.js";
import { AudioEngine } from "./audio.js";
import { spawnEnemy } from "./enemies.js";
import { drawMovementTrail } from "./movement-fx.js";
import { SKILL_RECTS, RESUME_BUTTON, contains } from "./controls.js";
import { GATE_PALETTES } from "./fx/stage-portal.js";
import { projectileSweep } from "./collision.js";
import { COMBAT_SCALE, PICKUP_RENDER_SCALE } from "./combat-scale.js";
import { stageAct, stageName, stageSub, uiCopy, lootLabel } from "./copy.js";

const SW = 320, SH = 180, BH = 180, WORLD_W = 480;
const C = {
  ink: hex("#07060d"), white: 0xffffffff, bg: hex("#05060c"),
  warn: hex("#ff8a5a"), warnLit: hex("#ffd36a"), gold: hex("#ffd36a"), green: hex("#a8ff9a"),
};
/** Floating hit numbers: normal 1×, crit 1.5× (milestone combo UI is separate). */
const NUM_FONT_SCALE = { normal: 1, crit: 1.5 };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.frame = createFrame(SW, SH);
    this.uiFrame = createFrame(SW, SH);
    this.img = this.ctx.createImageData(SW, SH);
    this.audio = new AudioEngine();
    this.fx = FX;
    this.ui = new UI(this);
    this.hero = new Hero();
    this.keys = new Set();
    this.touchMove = { x: 0, y: 0 };
    this.state = "title";
    this.time = 0;
    this.runTime = 0;
    this.hitStop = 0;
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.dashTrails = [];
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
    this.kills = 0;
    this.combo = { count: 0, timer: 0 };
    this.shakeState = { amp: 0, t: 0, dur: 0 };
    this.flashState = { color: C.white, a: 0, max: 0.3 };
    this.fade = 0;
    this.stageIndex = 0;
    this.waveIndex = 0;
    this.phase = "title";
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
    this.worldW = WORLD_W;
    this.cameraX = 0;
    this.spawnQueue = [];
    // the title idles on the volcanic act: lava light is a better first impression than a night sky
    this.loadStage(2, true);
  }

  // ------------------------------------------------------------------ setup
  loadStage(index, title = false) {
    this.stageIndex = index;
    this.stage = STAGES[index];
    this.mapFxTiles = [0, 320].map((x) => createFx(this.stage.map, { x, y: 0, seed: 3 + index + x / 320 }));
    this.mapFx = this.mapFxTiles[0];
    this.mapTileFrames = this.mapFxTiles.map(() => createFrame(320, 180));
    this.ui.reset();
    this.hero.spawn(this.stage.map.map.spawns.hero[0], this.stage.map.map.spawns.hero[1]);
    this.cameraX = 0;
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
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
    this.phase = title ? "title" : "intro";
    this.state = title ? "title" : "playing";
    this.fade = title ? 0 : 1;
    if (!title) {
      this.banner(stageAct(this, this.stage), stageName(this, this.stage), stageSub(this, this.stage));
      this.audio.play("ui");
    }
  }

  startRun() {
    this.audio.unlock();
    this.hero.reset();
    this.kills = 0;
    this.runTime = 0;
    this.loadStage(0, false);
  }

  restart() {
    this.startRun();
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.keys.clear();
      this.shakeState = { amp: 0, t: 0, dur: 0 };
    } else if (this.state === "paused") {
      this.state = "playing";
    }
  }

  addDashTrail(trail) {
    this.dashTrails.push(trail);
  }

  updateDashTrails(dt) {
    for (const t of this.dashTrails) {
      t.t += dt;
      // Dodge echoes follow the path only during its short movement window.
      if (t.kind === "dodge" && t.t <= 0.22) t.to = { x: this.hero.x, y: this.hero.y };
    }
    this.dashTrails = this.dashTrails.filter((t) => t.t < t.life);
  }

  openPortal() {
    const targetStage = this.stageIndex + 1;
    const exit = targetStage >= STAGES.length;
    const finalGate = targetStage === STAGES.length - 1;
    const palette = exit ? GATE_PALETTES.exit : finalGate ? GATE_PALETTES.final : GATE_PALETTES.normal;
    const x = this.worldW - 70, y = 152;
    const distance = Math.hypot(this.hero.x - x, (this.hero.y - y) * 1.4);
    this.portal = {
      x, y, finalGate, exit, targetStage, t: 0, armed: distance > 20,
      label: exit ? "ESCAPE" : finalGate ? "FINAL STAGE" : "NEXT STAGE",
      color: hex(palette[5]),
      fx: createFx(this.fx.stagePortal, { x, y, palette, reveal: 0, seed: 910 + this.stageIndex }),
    };
    const c = uiCopy(this);
    this.ui.toast(exit ? c.portalEscape : finalGate ? c.portalFinal : c.portalOpen);
    this.audio.play("portal");
  }

  updatePortal(dt) {
    if (!this.portal) return;
    this.portal.t += dt;
    this.portal.fx.update(dt);
    this.portal.fx.options.reveal = Math.min(1, this.portal.t / 0.65);
    const distance = Math.hypot(this.hero.x - this.portal.x, (this.hero.y - this.portal.y) * 1.4);
    if (distance > 22) this.portal.armed = true;
    if (this.phase === "clear" && this.portal.t > 0.8 && this.portal.armed && this.hero.alive && distance < 14) this.enterPortal();
  }

  enterPortal() {
    if (!this.portal || this.phase !== "clear" || !this.hero.alive) return;
    this.phase = "travel";
    this.phaseT = 0;
    this.keys.clear();
    this.hero.vx = this.hero.vy = this.hero.dashT = 0;
    this.audio.play("portal");
    this.shake(2, 0.25);
  }

  toggleInventory() {
    if (this.state === "playing" && this.phase !== "travel" && this.hero.alive) {
      this.state = "inventory";
      this.keys.clear();
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
    if (this.state === "paused" && contains(RESUME_BUTTON, x, y)) {
      this.togglePause(); this.audio.play("ui"); return "resume";
    }
    if (this.state !== "playing") return null;
    const slot = this.touchUi ? -1 : SKILL_RECTS.findIndex((rect) => contains(rect, x, y));
    if (slot >= 0) { this.cast(this.hero.skillSlots[slot]); return "skill"; }
    return null;
  }

  clampX(x, pad = 18) {
    return clamp(x, pad, this.worldW - pad);
  }

  updateCamera() {
    const target = clamp(this.hero.x - SW * 0.5, 0, this.worldW - SW);
    this.cameraX += (target - this.cameraX) * 0.12;
  }

  drawMapTiles(frame) {
    for (let i = 0; i < this.mapFxTiles.length; i++) {
      const fx = this.mapFxTiles[i], tile = this.mapTileFrames[i];
      clearFrame(tile);
      tile.ox = 0;
      tile.oy = 0;
      fx.options.x = 0;
      fx.options.y = 0;
      fx.draw(tile);
      const worldX = i * 320;
      const screenX = Math.round(worldX - frame.ox);
      const screenY = -frame.oy;
      const x0 = Math.max(0, -screenX), x1 = Math.min(tile.w, frame.w - screenX);
      const y0 = Math.max(0, -screenY), y1 = Math.min(tile.h, frame.h - screenY);
      for (let y = y0; y < y1; y++) {
        const dstRow = (screenY + y) * frame.w + screenX;
        const srcRow = y * tile.w;
        for (let x = x0; x < x1; x++) {
          const c = tile.color[srcRow + x];
          if (c) frame.color[dstRow + x] = c;
          const l = tile.light[srcRow + x];
          if (l) frame.light[dstRow + x] = l;
        }
      }
    }
  }

  drawScaledFx(fx, x, y, scale = 1) {
    if (scale >= 0.999) {
      fx.options.x = x;
      fx.options.y = y;
      fx.draw(this.frame);
      return;
    }
    // Use the module's bounds, including both directions when flipped. Large spells must not
    // be cropped to the small critter scratch frame when sharing the combat scale.
    const [w, h] = fx.meta.size ?? [160, 140];
    const [anchorX, anchorY] = fx.meta.origin ?? [w / 2, h * 0.75];
    const ox = Math.ceil(Math.max(anchorX, w - anchorX)) + 8;
    const oy = Math.ceil(Math.max(anchorY, h - anchorY)) + 8;
    const cache = this.fxScratchFrames ??= new Map();
    const key = `${ox}:${oy}`;
    if (!cache.has(key)) cache.set(key, createFrame(ox * 2, oy * 2));
    const scratch = cache.get(key);
    clearFrame(scratch);
    const oldX = fx.options.x, oldY = fx.options.y;
    fx.options.x = ox;
    fx.options.y = oy;
    fx.draw(scratch);
    fx.options.x = oldX;
    fx.options.y = oldY;
    const dst = this.frame, offsetX = dst.ox, offsetY = dst.oy;
    const p = painterFor(dst);
    const x0 = Math.max(0, Math.floor(x - ox * scale - offsetX));
    const y0 = Math.max(0, Math.floor(y - oy * scale - offsetY));
    const x1 = Math.min(dst.w, Math.ceil(x + ox * scale - offsetX));
    const y1 = Math.min(dst.h, Math.ceil(y + oy * scale - offsetY));
    for (let dy = y0; dy < y1; dy++) {
      const sy = Math.floor((dy + offsetY + 0.5 - y) / scale + oy);
      if (sy < 0 || sy >= scratch.h) continue;
      for (let dx = x0; dx < x1; dx++) {
        const sx = Math.floor((dx + offsetX + 0.5 - x) / scale + ox);
        if (sx < 0 || sx >= scratch.w) continue;
        const si = sy * scratch.w + sx;
        const di = dy * dst.w + dx;
        const color = scratch.color[si], alpha = color >>> 24;
        if (alpha === 255) dst.color[di] = color;
        else if (alpha) p.blendPx(dx + offsetX, dy + offsetY, color, alpha / 255);
        const light = scratch.light[si];
        if (light) p.add(dx + offsetX, dy + offsetY, light);
      }
    }
  }

  // ------------------------------------------------------------------ tick
  tick(dt) {
    this.time += dt;
    if (this.state === "paused" || this.state === "inventory") return;

    if (this.state === "title") {
      for (const map of this.mapFxTiles) map.update(dt * 0.8);
      this.hero.update(this, dt, this.keys);
      this.updateEffects(dt);
      this.updateDashTrails(dt);
      return;
    }

    if (this.state === "gameover" || this.state === "victory") {
      for (const map of this.mapFxTiles) map.update(dt * 0.5);
      this.updateMotes(dt);
      this.updateNumbers(dt);
      this.updateDashTrails(dt);
      return;
    }

    this.runTime += dt;

    if (this.phase === "travel") {
      for (const map of this.mapFxTiles) map.update(dt);
      this.updatePortal(dt);
      this.updateEffects(dt);
      this.updateDashTrails(dt);
      this.updateShake(dt);
      this.updateFlow(dt);
      return;
    }

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      for (const map of this.mapFxTiles) map.update(dt);
      this.updateShake(dt);
      this.updateFlash(dt);
      this.updateDashTrails(dt);
      return;
    }

    // timers first: they are how casts stage their hits
    if (this.timers.length) {
      const due = [];
      for (const t of this.timers) {
        t.t -= dt;
        if (t.t <= 0) due.push(t);
      }
      this.timers = this.timers.filter((t) => t.t > 0);
      for (const t of due) t.fn();
    }

    for (const map of this.mapFxTiles) map.update(dt);
    this.hero.update(this, dt, this.keys);
    this.updateCamera();
    for (const e of this.enemies) e.update(this, dt);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.updateEffects(dt);
    this.updateDashTrails(dt);
    this.updatePortal(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateMotes(dt);
    this.updateNumbers(dt);
    this.updateTelegraphs(dt);
    this.updateShake(dt);
    this.updateFlash(dt);
    this.updateSpawns(dt);
    this.updateFlow(dt);

    if (this.combo.timer > 0) {
      this.combo.timer -= dt;
      if (this.combo.timer <= 0) this.combo.count = 0;
    }
    this.combo.count = Math.min(999, this.combo.count);

    if (!this.hero.alive) {
      this.deathT += dt;
      if (this.deathT > 2.2 && this.state === "playing") {
        this.state = "gameover";
      }
    }
  }

  updateFlow(dt) {
    if (!this.hero.alive) return;
    if (this.hold > 0) {
      this.hold -= dt;
      return;
    }
    this.phaseT += dt;
    if (this.phase === "intro") {
      if (this.phaseT > 1.45) this.startWave(0);
    } else if (this.phase === "fight") {
      const busy = this.enemies.length > 0 || this.spawnQueue.length > 0;
      if (!busy) {
        this.clearT += dt;
        if (this.clearT > 0.85) {
          if (this.waveIndex + 1 < this.stage.waves.length) this.startWave(this.waveIndex + 1);
          else this.stageClear();
        }
      } else this.clearT = 0;
    } else if (this.phase === "clear") {
      if (!this.portal) this.openPortal();
    } else if (this.phase === "travel") {
      if (this.phaseT > 0.65) {
        const next = this.portal?.targetStage ?? this.stageIndex + 1;
        if (next < STAGES.length) {
          this.fade = 1;
          this.loadStage(next, false);
        } else {
          this.portal = null;
          this.victory();
        }
      }
    }
  }

  startWave(i) {
    this.waveIndex = i;
    this.phase = "fight";
    this.phaseT = 0;
    this.clearT = 0;
    const wave = this.stage.waves[i] ?? [];
    wave.forEach((spec, n) => this.spawnQueue.push({ ...spec, delay: n * 0.28 }));
    if (i > 0) {
      const boss = wave.some((s) => s.type === "boss");
      const c = uiCopy(this);
      if (boss) this.banner(c.boss, c.bossWarden, c.bossSub);
      else this.banner(c.wave(i + 1, this.stage.waves.length), stageName(this, this.stage), c.waveGather);
    }
  }

  updateSpawns(dt) {
    if (!this.spawnQueue.length) return;
    for (const q of this.spawnQueue) q.delay -= dt;
    const ready = this.spawnQueue.filter((q) => q.delay <= 0);
    this.spawnQueue = this.spawnQueue.filter((q) => q.delay > 0);
    for (const q of ready) this.spawnEnemy(q.type, q.x, q.y, { seed: 100 + this.kills * 13 + Math.floor(this.time * 9) });
  }

  spawnEnemy(type, x, y, opts = {}) {
    const e = spawnEnemy(this, type, x, y, opts);
    if (e instanceof Boss) {
      this.bossRef = e;
      this.audio.play("boss");
    }
    return e;
  }

  stageClear() {
    if (!this.hero.alive || this.phase === "clear" || this.phase === "travel") return;
    this.phase = "clear";
    this.phaseT = 0;
    this.ui.stageClear();
    this.audio.play("level");
    this.hero.heal(this, Math.round(this.hero.maxHp * 0.22));
    this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 24);
    this.projectiles = [];
    this.spawnQueue = [];
    this.timers = [];
    this.telegraphs = [];
    this.portal = null;
    this.openPortal();
  }

  victory() {
    if (this.state === "victory") return;
    this.state = "victory";
    this.audio.play("level");
  }

  stats() {
    return {
      kills: this.kills,
      level: this.hero.level,
      time: this.runTime,
      stage: this.stageIndex + 1,
    };
  }

  // ------------------------------------------------------------------ fx / entities
  addFx(mod, opts = {}, cfg = {}) {
    const inst = createFx(mod, opts);
    this.effects.push({
      inst, layer: cfg.layer ?? "front", age: 0, life: cfg.life ?? 0,
      follow: cfg.follow ?? null, offsetY: cfg.offsetY ?? 0,
      scale: cfg.scale ?? COMBAT_SCALE,
    });
    return inst;
  }

  updateEffects(dt) {
    for (const ef of this.effects) {
      ef.age += dt;
      if (ef.follow) {
        const p = ef.follow();
        ef.inst.options.x = p.x;
        ef.inst.options.y = p.y + ef.offsetY;
      }
      if (ef.life && ef.age >= ef.life) ef.inst.stop();
      ef.inst.update(dt);
    }
    this.effects = this.effects.filter((ef) => !ef.inst.done());
  }

  updateProjectiles(dt) {
    const hero = this.hero;
    for (const p of this.projectiles) {
      p.life -= dt;
      const prev = { x: p.x, y: p.y };
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.fx.options.x = p.x;
      p.fx.options.y = p.y;
      p.fx.options.flip = p.vx < 0;
      p.fx.update(dt);
      if (p.team === "hero") {
        let hit = null, hitInfo = null;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (p.hitIds?.has(e)) continue;
          const info = projectileSweep(prev, p, e, p.r ?? 5);
          if (info && (!hitInfo || info.t < hitInfo.t)) { hit = e; hitInfo = info; }
        }
        if (hit) {
          p.x = hitInfo.point.x; p.y = hitInfo.point.y;
          if (p.kind === "fireball") explodeFireball(this, p);
          else this.resolveWeaponProjectileHit(p, hit);
        }
      } else if (hero.alive && Math.hypot(hero.x - p.x, (hero.y - 22 * COMBAT_SCALE - p.y) * 0.8) < 11 * COMBAT_SCALE) {
        if (hero.hurt(this, p.dmg, { fromX: p.x })) {
          this.addFx(FX.hitSpark, { x: p.x, y: p.y, flip: p.vx < 0, light: 0.9 });
          this.audio.play("hit");
          this.hitStop = Math.max(this.hitStop, 0.04);
        }
        p.fx.stop();
        p.dead = true;
      }
      if (p.x < 4 || p.x > this.worldW - 4 || p.y < 0 || p.y > BH || p.life <= 0) { p.fx.stop(); p.dead = true; }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  resolveWeaponProjectileHit(p, first) {
    const hitEnemies = [first];
    p.hitIds ??= new Set();
    p.hitIds.add(first);
    const blast = p.blastRadius ?? 0;
    if (blast) {
      for (const e of this.enemies) {
        if (!e.alive || p.hitIds.has(e)) continue;
        if (Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) <= blast) {
          e.hurt(this, p.dmg, { knock: p.knock ?? 28, status: p.status, statusTime: p.statusTime, crit: p.crit });
          p.hitIds.add(e); hitEnemies.push(e);
        }
      }
    } else {
      first.hurt(this, p.dmg, { knock: p.knock ?? 28, status: p.status, statusTime: p.statusTime, crit: p.crit });
    }
    this.addFx(FX.hitSpark, { x: p.x, y: p.y - 4, light: 1, seed: 730 + this.kills });
    this.number(p.x, p.y - 16, String(Math.round(p.dmg)), { color: "#fff0d0" });
    this.hitStop = Math.max(this.hitStop, p.pierce ? 0.045 : 0.07);
    this.shake(p.pierce ? 2.2 : 3.4, p.pierce ? 0.16 : 0.25);
    this.audio.play(p.pierce ? "hit" : "crit");
    if (p.response === "return" && !p.returning) {
      p.returning = true;
      p.vx = -Math.sign(p.vx || 1) * (p.returnSpeed ?? 220);
      p.vy = -p.vy * 0.25;
      p.life = Math.max(p.life, 0.7);
      return;
    }
    if (p.pierce && (!p.maxHits || p.hitIds.size < p.maxHits)) return;
    p.fx.stop(); p.dead = true;
  }

  enemyShot(enemy, hero) {
    const sx = enemy.x + enemy.facing * 10 * COMBAT_SCALE, sy = enemy.y - 20 * COMBAT_SCALE;
    const tx = hero.x, ty = hero.y - 22 * COMBAT_SCALE;
    const dx = tx - sx, dy = ty - sy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = enemy.type.shot?.speed ?? 85;
    const inst = createFx(FX.plasmaShot, {
      x: sx, y: sy, flip: dx < 0, seed: enemy.seed + 7,
      palette: enemy.type.shot?.palette, size: enemy.type.shot?.r ?? 5,
    });
    this.projectiles.push({
      x: sx, y: sy, vx: (dx / len) * speed, vy: (dy / len) * speed, r: (enemy.type.shot?.r ?? 5) * COMBAT_SCALE,
      dmg: enemy.dmg, team: "enemy", fx: inst, life: 2.6 * COMBAT_SCALE, color: enemy.type.shot?.color ?? "#ff7a6a",
    });
  }

  hitEnemies(pred, opts = {}) {
    let hits = 0;
    for (const e of this.enemies) {
      if (!e.alive || !pred(e)) continue;
      e.hurt(this, opts.dmg, { knock: opts.knock ?? 22, status: opts.status, statusTime: opts.statusTime, crit: opts.crit });
      hits++;
      if (opts.maxHits && hits >= opts.maxHits) break;
    }
    return hits;
  }

  enemyPathHit(e, shape, opts = {}) {
    const x0 = e.prevX ?? e.x, y0 = e.prevY ?? e.y, x1 = e.x, y1 = e.y;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
      if (shape(x, y, e)) return true;
    }
    return false;
  }

  weaponHitTest(e, attack, hero = this.hero) {
    const raw = attack ?? { kind: "line", range: 60, radius: 12, pierce: false, maxHits: 1 };
    const cfg = { ...raw, range: (raw.range ?? 60) * COMBAT_SCALE, radius: (raw.radius ?? 10) * COMBAT_SCALE };
    const dx = e.x - hero.x, dy = (e.y - hero.y) * 1.2;
    const facingDx = dx * hero.facing;
    const radius = cfg.radius;
    if (cfg.kind === "arc") {
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, facingDx);
      return dist <= (cfg.range ?? 70) && angle > -0.95 && angle < 0.95 && this.enemyPathHit(e, (x, y) => Math.hypot(x - hero.x, (y - hero.y) * 1.2) <= radius);
    }
    if (cfg.kind === "projectile") {
      return facingDx > -4 && facingDx <= (cfg.range ?? 100) && Math.abs(dy) <= radius * 1.4 && this.enemyPathHit(e, (x, y) => {
        const pdx = (x - hero.x) * hero.facing, pdy = (y - hero.y) * 1.2;
        return pdx > -4 && pdx <= (cfg.range ?? 100) && Math.abs(pdy) <= radius;
      });
    }
    return facingDx > -8 && facingDx <= (cfg.range ?? 60) && Math.abs(dy) <= radius && this.enemyPathHit(e, (x, y) => {
      const pdx = (x - hero.x) * hero.facing, pdy = (y - hero.y) * 1.2;
      return pdx > -8 && pdx <= (cfg.range ?? 60) && Math.abs(pdy) <= radius;
    });
  }

  weaponAttackPath(profile, hero = this.hero) {
    const facing = hero.facing || 1, range = (profile?.range ?? 60) * COMBAT_SCALE;
    if (profile?.kind === "arc") {
      const points = [];
      for (let i = 0; i <= 10; i++) {
        const u = i / 10, a = -1.25 + u * 2.5;
        points.push({ x: hero.x + facing * (10 * COMBAT_SCALE + Math.cos(a) * range * 0.72), y: hero.y - 5 * COMBAT_SCALE + Math.sin(a) * range * 0.28 });
      }
      return points;
    }
    // Grounded enemies' hurt centers sit on the same floor line as the hero's feet.
    // A small weapon-height offset keeps thrusts aligned while preserving the drawn arc.
    const pathY = hero.y - (profile?.kind === "thrust" ? 1 : 3) * COMBAT_SCALE;
    return [{ x: hero.x + facing * 3 * COMBAT_SCALE, y: pathY }, { x: hero.x + facing * range, y: pathY }];
  }

  weaponStrike(profile, opts = {}) {
    const hero = this.hero, points = this.weaponAttackPath(profile, hero), hits = [];
    const radius = (profile?.radius ?? 10) * COMBAT_SCALE;
    const pointSegmentDistance = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const u = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
      return Math.hypot(px - (ax + dx * u), (py - (ay + dy * u)) * 1.2);
    };
    const pathDistance = (x, y) => {
      let best = Infinity, along = 0;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], len = Math.hypot(b.x - a.x, b.y - a.y);
        best = Math.min(best, pointSegmentDistance(x, y, a.x, a.y, b.x, b.y));
        along += len;
      }
      return best;
    };
    const candidates = [];
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const samples = [];
      const ex0 = e.prevX ?? e.x, ey0 = e.prevY ?? e.y, ex1 = e.x, ey1 = e.y;
      for (let i = 0; i <= 5; i++) {
        const u = i / 5;
        samples.push({ x: ex0 + (ex1 - ex0) * u, y: ey0 + (ey1 - ey0) * u });
      }
      const d = Math.min(...samples.map((s) => pathDistance(s.x, s.y)));
      if (d <= radius + Math.max(5 * COMBAT_SCALE, e.w * (e.renderScale ?? COMBAT_SCALE) * 0.55)) candidates.push({ e, d });
    }
    candidates.sort((a, b) => a.d - b.d);
    const limit = profile?.pierce ? (profile.maxHits ?? 99) : 1;
    for (const { e } of candidates.slice(0, limit)) {
      e.hurt(this, opts.dmg, { knock: opts.knock ?? 22, status: opts.status, statusTime: opts.statusTime, crit: opts.crit });
      hits.push(e);
    }
    return { hits, points, end: hits.length ? { x: hits[0].x, y: hits[0].y } : points.at(-1) };
  }

  number(x, y, text, opts = {}) {
    const tier = opts.crit ? "crit" : "normal";
    this.numbers.push({
      x: x + (Math.random() * 8 - 4), y, text,
      t: 0, life: tier === "crit" ? 1.05 : 0.8,
      color: hex(opts.color ?? "#fff0d0"), tier, small: !!opts.small,
      vy: tier === "crit" ? -34 : -24,
    });
  }

  updateNumbers(dt) {
    for (const n of this.numbers) {
      n.t += dt;
      n.y += n.vy * dt;
      n.vy += 26 * dt;
    }
    this.numbers = this.numbers.filter((n) => n.t < n.life);
  }

  dust(x, y, count = 2, dir = 0, color = "#b8a890") {
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x, y, vx: (Math.random() * 2 - 1) * 20 + dir * 12, vy: -Math.random() * 16 - 4,
        t: 0, life: 0.3 + Math.random() * 0.35, color: hex(color),
      });
    }
  }

  updateMotes(dt) {
    for (const m of this.motes) {
      m.t += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vy += 18 * dt;
    }
    this.motes = this.motes.filter((m) => m.t < m.life);
  }

  telegraph(x, y, r, dur, color) {
    this.telegraphs.push({ x, y, r: r * COMBAT_SCALE, t: 0, dur, color: hex(color) });
  }

  updateTelegraphs(dt) {
    for (const t of this.telegraphs) t.t += dt;
    this.telegraphs = this.telegraphs.filter((t) => t.t < t.dur + 0.15);
  }

  shake(amp, dur) {
    if (amp >= this.shakeState.amp * (1 - this.shakeState.t / Math.max(0.01, this.shakeState.dur))) {
      this.shakeState = { amp, t: 0, dur };
    }
  }

  updateShake(dt) {
    this.shakeState.t += dt;
    if (this.shakeState.t > this.shakeState.dur) this.shakeState.amp = 0;
  }

  flashScreen(color, a) {
    if (a >= this.flashState.a) this.flashState = { color: hex(color), a, max: a };
  }

  updateFlash(dt) {
    if (this.flashState.a > 0) this.flashState.a = Math.max(0, this.flashState.a - dt * 2.2);
  }

  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }

  banner(kicker, title, sub, kind) { this.ui.banner(kicker, title, sub, kind); }

  toggleMute() {
    this.audio.unlock();
    this.audio.setMuted(!this.audio.muted);
  }

  /** Test/debug: run a skill by id without the keyboard. */
  cast(id) { return castSkill(this, id); }

  comboAdd() {
    this.combo.count++;
    this.combo.timer = 2.4;
    if (this.combo.count > 0 && this.combo.count % 10 === 0) this.ui.comboMilestone(this.combo.count);
  }

  dropLoot(x, y, typeId) {
    if (typeId === "boss") return;
    const r = Math.random();
    let loot = null, acc = 0;
    for (const l of LOOT) { acc += l.p; if (r < acc) { loot = l; break; } }
    if (!loot) return;
    const fx = createFx(loot.mod, { x, y, seed: 200 + Math.floor(Math.random() * 400) });
    this.pickups.push({ x, y, kind: loot.kind, mod: loot.mod, label: loot.label, color: loot.color, fx, age: 0, dead: false });
  }

  updatePickups(dt) {
    const hero = this.hero;
    for (const p of this.pickups) {
      p.age += dt;
      p.fx.options.x = p.x;
      p.fx.options.y = p.y - Math.sin(p.age * 3) * 1.5;
      p.fx.update(dt);
      const dx = hero.x - p.x, dy = hero.y - 8 - p.y;
      const d = Math.hypot(dx, dy);
      const magnet = p.kind === "xp" ? 62 : 34;
      if (d < magnet && hero.alive) {
        const sp = p.kind === "xp" ? 150 : 90;
        p.x += (dx / (d || 1)) * sp * dt;
        p.y += (dy / (d || 1)) * sp * 0.7 * dt;
      }
      if (d < 10 && hero.alive) {
        this.collect(p);
        p.dead = true;
      }
      if (p.age > 26) p.dead = true;
    }
    this.pickups = this.pickups.filter((p) => !p.dead);
  }

  collect(p) {
    this.addFx(FX.collectBurst, { x: p.x, y: p.y, light: 0.9, seed: 90 + Math.floor(Math.random() * 20) });
    this.audio.play("pickup");
    if (p.kind === "heart") {
      this.hero.heal(this, 18);
    } else if (p.kind === "potion") {
      const n = Math.min(24, this.hero.maxMp - this.hero.mp);
      this.hero.mp += n;
      this.number(p.x, p.y - 20, "+" + Math.round(n) + " MP", { color: "#8fd0ff", small: true });
      this.ui.toast(lootLabel(this, "potion"));
    } else {
      this.hero.gainXp(this, 8);
      this.ui.toast(lootLabel(this, "xp"));
    }
  }

  // ------------------------------------------------------------------ render
  render() {
    const f = this.frame;
    const sh = this.shakeState;
    let sx = 0, sy = 0;
    if (sh.amp > 0 && sh.t < sh.dur) {
      const k = 1 - sh.t / sh.dur;
      sx = Math.sin(sh.t * 93) * sh.amp * k;
      sy = Math.cos(sh.t * 71) * sh.amp * 0.55 * k;
    }
    this.updateCamera();
    f.ox = Math.round(this.cameraX - sx);
    f.oy = -Math.round(sy);
    clearFrame(f);

    // the stage itself
    this.drawMapTiles(f);

    let p = painterFor(f);
    // floor marks are under everyone
    for (const t of this.telegraphs) this.drawTelegraph(p, t);
    for (const ef of this.effects) if (ef.layer === "ground") {
      this.drawScaledFx(ef.inst, ef.inst.options.x ?? 0, ef.inst.options.y ?? 0, ef.scale);
      p = painterFor(f);
    }
    if (this.portal) { this.portal.fx.draw(f, "back"); p = painterFor(f); }
    for (const trail of this.dashTrails) drawMovementTrail(p, trail);

    // pickups sit on the floor, sorted with the bodies so depth reads
    const actors = [...this.pickups.filter((q) => !q.dead).map((q) => ({ y: q.y, kind: "pickup", ref: q }))];
    for (const e of this.enemies) if (!e.dead) actors.push({ y: e.y, kind: "enemy", ref: e });
    actors.push({ y: this.hero.y, kind: "hero", ref: this.hero });
    actors.sort((a, b) => a.y - b.y || (a.kind === "hero" ? 1 : -1));
    for (const a of actors) {
      if (a.kind === "pickup") {
        this.drawScaledFx(a.ref.fx, a.ref.x, a.ref.y, PICKUP_RENDER_SCALE);
        p = painterFor(f);
      } else if (a.kind === "enemy") {
        a.ref.draw(this, painterFor(f));
      } else {
        this.hero.draw(this, painterFor(f));
      }
    }

    // spells over the bodies
    for (const ef of this.effects) if (ef.layer !== "ground") {
      this.drawScaledFx(ef.inst, ef.inst.options.x ?? 0, ef.inst.options.y ?? 0, ef.scale);
      p = painterFor(f);
    }
    for (const pr of this.projectiles) { this.drawScaledFx(pr.fx, pr.x, pr.y, COMBAT_SCALE); p = painterFor(f); }

    // short-lived movement streaks sit above the floor and below the HUD
    // so a dash reads as a deliberate burst rather than a teleport.
    if (this.portal) {
      this.portal.fx.options.x = this.portal.x;
      this.portal.fx.options.y = this.portal.y;
      this.portal.fx.draw(f, "front");
      p = painterFor(f);
      p.text(this.portal.label, this.portal.x, this.portal.y - 56, this.portal.color, { align: "center", outline: C.ink, font: "mini" });
    }

    // grit and footstep dust
    for (const m of this.motes) {
      const a = 1 - m.t / m.life;
      p.dot(m.x, m.y, m.color, a * 0.9);
    }
    // numbers are world-space, so they shake with the stage
    for (const n of this.numbers) {
      const a = 1 - n.t / n.life;
      const tier = n.tier ?? (n.crit ? "crit" : "normal");
      const scale = (NUM_FONT_SCALE[tier] ?? 1) * (n.small ? 0.92 : 1);
      p.text(n.text, n.x, n.y, n.color, {
        font: "mini", scale, align: "center",
        outline: C.ink, a: Math.min(1, a * 1.6),
      });
    }

    // The UI is screen-space, so drop the world shake and draw it into its own clean frame. It is
    // merged back afterwards: opaque UI pixels replace the world color and its light, while UI glow
    // adds to the world and the battle keeps its firelight everywhere the HUD does not cover.
    f.ox = 0;
    f.oy = 0;
    const uf = this.uiFrame;
    uf.ox = 0;
    uf.oy = 0;
    clearFrame(uf);
    let up = painterFor(uf);
    this.ui.draw(this, up, uf);
    mergeUI(f, uf);
    p = painterFor(f);
    if (this.flashState.a > 0) {
      p.rect(0, 0, SW, SH, this.flashState.color, Math.min(1, this.flashState.a / Math.max(0.001, this.flashState.max)));
    }
    if (this.phase === "travel") {
      p.rect(0, 0, SW, SH, hex("#050409"), Math.min(1, this.phaseT / 0.5));
    }
    if (this.fade > 0.001) {
      p.rect(0, 0, SW, SH, hex("#050409"), this.fade);
      this.fade = Math.max(0, this.fade - 0.035);
    }
    // a thin vignette line at the very bottom keeps the HUD from floating in void
    composite(f, this.img.data, C.bg);
    this.ctx.putImageData(this.img, 0, 0);
  }

  drawTelegraph(p, t) {
    const left = t.dur - t.t;
    const k = clamp(t.t / t.dur, 0, 1);
    const pulse = 0.35 + 0.3 * Math.sin(t.t * (left < 0.35 ? 34 : 12));
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      p.dot(t.x + Math.cos(a) * t.r, t.y + Math.sin(a) * t.r * 0.3, t.color, Math.max(0.15, pulse));
    }
    // four corner ticks closing in as the blow lands
    const q = t.r * (1 - k * 0.25);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      p.dot(t.x + ax * q, t.y + ay * q * 0.3, t.color, 0.8);
      p.dot(t.x + ax * (q - 2), t.y + ay * (q - 2) * 0.3, t.color, 0.5);
    }
    p.dot(t.x, t.y, C.warnLit, left < 0.3 ? 0.9 : 0.5);
  }
}

function mergeUI(f, u) {
  const n = f.w * f.h, C = f.color, L = f.light, UC = u.color, UL = u.light;
  for (let i = 0; i < n; i++) {
    const c = UC[i], a = c >>> 24;
    if (a === 255) {
      C[i] = c;
      L[i] = UL[i];
    } else if (a) {
      const d = C[i], k = a / 255;
      const ch = (s) => ((((c >>> s) & 255) * k + ((d >>> s) & 255) * (1 - k)) | 0);
      C[i] = (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
      const dl = L[i], ul = UL[i];
      if (ul) {
        const lr = Math.min(255, (dl & 255) + (ul & 255));
        const lg = Math.min(255, ((dl >>> 8) & 255) + ((ul >>> 8) & 255));
        const lb = Math.min(255, ((dl >>> 16) & 255) + ((ul >>> 16) & 255));
        L[i] = (255 << 24) | (lb << 16) | (lg << 8) | lr;
      }
    } else if (UL[i]) {
      const dl = L[i], ul = UL[i];
      const lr = Math.min(255, (dl & 255) + (ul & 255));
      const lg = Math.min(255, ((dl >>> 8) & 255) + ((ul >>> 8) & 255));
      const lb = Math.min(255, ((dl >>> 16) & 255) + ((ul >>> 16) & 255));
      L[i] = (255 << 24) | (lb << 16) | (lg << 8) | lr;
    }
  }
}

export function boot() {
  const canvas = document.querySelector("#game");
  const game = new Game(canvas);
  window.__EMBER__ = game;
  Hero.prepare();
  return game;
}
