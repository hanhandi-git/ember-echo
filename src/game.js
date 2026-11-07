// The loop: one 320×180 pixel stage, a duelist, critters, six spells and three acts. The map, every
// creature and every spell is a pixelfx module; this file is the game around them.

import { createFrame, clearFrame, createFx, painterFor, composite, hex, clamp, TAU } from "../../pixelfx/src/core/index.js";
import { STAGES, FX, LOOT } from "./data.js";
import { Hero } from "./hero.js";
import { Boss } from "./enemies.js";
import { castSkill, explodeFireball } from "./skills.js";
import { UI } from "./ui.js";
import { AudioEngine } from "./audio.js";
import { spawnEnemy } from "./enemies.js";

const W = 320, H = 180;
const C = {
  ink: hex("#07060d"), white: 0xffffffff, bg: hex("#05060c"),
  warn: hex("#ff8a5a"), warnLit: hex("#ffd36a"), gold: hex("#ffd36a"), green: hex("#a8ff9a"),
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.frame = createFrame(W, H);
    this.img = this.ctx.createImageData(W, H);
    this.audio = new AudioEngine();
    this.fx = FX;
    this.ui = new UI(this);
    this.hero = new Hero();
    this.keys = new Set();
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
    this.deathT = 0;
    this.stage = STAGES[0];
    this.mapFx = null;
    this.spawnQueue = [];
    this.ui.init();
    // the title idles on the volcanic act: lava light is a better first impression than a night sky
    this.loadStage(2, true);
  }

  // ------------------------------------------------------------------ setup
  loadStage(index, title = false) {
    this.stageIndex = index;
    this.stage = STAGES[index];
    this.mapFx = createFx(this.stage.map, { x: 0, y: 0, seed: 3 + index });
    this.hero.spawn(this.stage.map.map.spawns.hero[0], this.stage.map.map.spawns.hero[1]);
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
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
    this.ui.setStage(this.stage);
    if (!title) {
      this.banner(this.stage.act, this.stage.name, this.stage.sub, "STAGE");
      this.audio.play("ui");
    }
  }

  startRun() {
    this.audio.unlock();
    this.hero.reset();
    this.kills = 0;
    this.runTime = 0;
    this.loadStage(0, false);
    this.ui.hideOverlay();
    this.ui.start();
  }

  restart() {
    this.startRun();
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.shakeState = { amp: 0, t: 0, dur: 0 };
      this.ui.pause();
    } else if (this.state === "paused") {
      this.state = "playing";
      this.ui.hideOverlay();
    }
  }

  // ------------------------------------------------------------------ tick
  tick(dt) {
    this.time += dt;
    if (this.state === "paused") return;

    if (this.state === "title") {
      this.mapFx.update(dt * 0.8);
      this.hero.update(this, dt, this.keys);
      this.updateEffects(dt);
      return;
    }

    if (this.state === "gameover" || this.state === "victory") {
      this.mapFx.update(dt * 0.5);
      this.updateMotes(dt);
      this.updateNumbers(dt);
      return;
    }

    this.runTime += dt;

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      this.mapFx.update(dt);
      this.updateShake(dt);
      this.updateFlash(dt);
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

    this.mapFx.update(dt);
    this.hero.update(this, dt, this.keys);
    for (const e of this.enemies) e.update(this, dt);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.updateEffects(dt);
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
        this.ui.gameover(this.stats());
      }
    }
  }

  updateFlow(dt) {
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
      if (this.phaseT > 2.8) {
        if (this.stageIndex + 1 < STAGES.length) {
          this.fade = 1;
          this.loadStage(this.stageIndex + 1, false);
          this.ui.hideBoss();
        } else this.victory();
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
      if (boss) this.banner("THE WARDEN", "冥河守卫 · 阿刻戎", "BOSS");
      else this.banner("WAVE " + (i + 1), `第 ${i + 1} 波`, "WAVE");
    }
    this.ui.setWave(i, wave.length);
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
    this.phase = "clear";
    this.phaseT = 0;
    const boss = this.bossDefeated;
    this.banner(boss ? "GUARDIAN FALLEN" : "STAGE CLEAR", boss ? "守卫者化作了灰烬" : `${this.stage.name} 暂时沉寂`, "CLEAR");
    this.audio.play("level");
    this.hero.heal(this, Math.round(this.hero.maxHp * 0.22), { big: true });
    this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 24);
    this.projectiles = [];
    this.spawnQueue = [];
    this.ui.hideBoss();
  }

  victory() {
    if (this.state === "victory") return;
    this.state = "victory";
    this.ui.victory(this.stats());
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
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.fx.options.x = p.x;
      p.fx.options.y = p.y;
      p.fx.options.flip = p.vx < 0;
      p.fx.update(dt);
      if (p.team === "hero") {
        let hit = null;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - p.x, (e.y - 16 - p.y) * 0.75) < 10 + e.w * 0.4) { hit = e; break; }
        }
        if (hit) {
          explodeFireball(this, p);
          p.fx.stop();
          p.dead = true;
        }
      } else if (hero.alive && Math.hypot(hero.x - p.x, (hero.y - 22 - p.y) * 0.8) < 11) {
        if (hero.hurt(this, p.dmg, { fromX: p.x })) {
          this.addFx(FX.hitSpark, { x: p.x, y: p.y, flip: p.vx < 0, light: 0.9 });
          this.audio.play("hit");
          this.hitStop = Math.max(this.hitStop, 0.04);
        }
        p.fx.stop();
        p.dead = true;
      }
      if (p.x < 4 || p.x > W - 4 || p.y < 0 || p.y > H || p.life <= 0) { p.fx.stop(); p.dead = true; }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  enemyShot(enemy, hero) {
    const sx = enemy.x + enemy.facing * 10, sy = enemy.y - 20;
    const tx = hero.x, ty = hero.y - 22;
    const dx = tx - sx, dy = ty - sy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = enemy.type.shot?.speed ?? 85;
    const inst = createFx(FX.plasmaShot, {
      x: sx, y: sy, flip: dx < 0, seed: enemy.seed + 7,
      palette: enemy.type.shot?.palette, size: enemy.type.shot?.r ?? 5,
    });
    this.projectiles.push({
      x: sx, y: sy, vx: (dx / len) * speed, vy: (dy / len) * speed, r: enemy.type.shot?.r ?? 5,
      dmg: enemy.dmg, team: "enemy", fx: inst, life: 2.6, color: enemy.type.shot?.color ?? "#ff7a6a",
    });
  }

  hitEnemies(pred, opts = {}) {
    let hits = 0;
    for (const e of this.enemies) {
      if (!e.alive || !pred(e)) continue;
      e.hurt(this, opts.dmg, { knock: opts.knock ?? 22, status: opts.status, statusTime: opts.statusTime, crit: opts.crit });
      hits++;
    }
    return hits;
  }

  number(x, y, text, opts = {}) {
    this.numbers.push({
      x: x + (Math.random() * 8 - 4), y, text,
      t: 0, life: opts.crit ? 1.05 : 0.8,
      color: hex(opts.color ?? "#fff0d0"), crit: !!opts.crit, small: !!opts.small,
      vy: opts.crit ? -34 : -24,
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
    this.telegraphs.push({ x, y, r, t: 0, dur, color: hex(color) });
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

  /** Test/debug: run a skill by id without the keyboard. */
  cast(id) { return castSkill(this, id); }

  comboAdd() {
    this.combo.count++;
    this.combo.timer = 2.4;
    this.ui.combo(this.combo.count, this.combo.timer);
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
    if (p.kind === "heart") this.hero.heal(this, 18, { big: true });
    else if (p.kind === "potion") {
      const n = Math.min(24, this.hero.maxMp - this.hero.mp);
      this.hero.mp += n;
      this.number(p.x, p.y - 20, "+" + Math.round(n) + " MP", { color: "#8fd0ff", small: true });
    } else this.hero.gainXp(this, 8);
    this.ui.toast(p.label);
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
    f.ox = -Math.round(sx);
    f.oy = -Math.round(sy);
    clearFrame(f);

    // the stage itself
    if (this.mapFx) { this.mapFx.options.x = 0; this.mapFx.options.y = 0; this.mapFx.draw(f); }

    let p = painterFor(f);
    // floor marks are under everyone
    for (const t of this.telegraphs) this.drawTelegraph(p, t);
    for (const ef of this.effects) if (ef.layer === "ground") { ef.inst.draw(f); p = painterFor(f); }

    // pickups sit on the floor, sorted with the bodies so depth reads
    const actors = [...this.pickups.filter((q) => !q.dead).map((q) => ({ y: q.y, kind: "pickup", ref: q }))];
    for (const e of this.enemies) if (!e.dead) actors.push({ y: e.y, kind: "enemy", ref: e });
    actors.push({ y: this.hero.y, kind: "hero", ref: this.hero });
    actors.sort((a, b) => a.y - b.y || (a.kind === "hero" ? 1 : -1));
    for (const a of actors) {
      if (a.kind === "pickup") {
        a.ref.fx.draw(f);
        p = painterFor(f);
      } else if (a.kind === "enemy") {
        a.ref.draw(this, painterFor(f));
      } else {
        this.hero.draw(this, painterFor(f));
      }
    }

    // spells over the bodies
    for (const ef of this.effects) if (ef.layer !== "ground") { ef.inst.draw(f); p = painterFor(f); }
    for (const pr of this.projectiles) { pr.fx.draw(f); p = painterFor(f); }

    // grit and footstep dust
    for (const m of this.motes) {
      const a = 1 - m.t / m.life;
      p.dot(m.x, m.y, m.color, a * 0.9);
    }
    // numbers are world-space, so they shake with the stage
    for (const n of this.numbers) {
      const a = 1 - n.t / n.life;
      p.text(n.text, n.x, n.y, n.color, {
        font: n.crit ? "big" : "mini", scale: n.crit ? 1 : 1, align: "center",
        outline: C.ink, a: Math.min(1, a * 1.6),
      });
    }

    // screen-space overlays
    f.ox = 0;
    f.oy = 0;
    p = painterFor(f);
    if (this.flashState.a > 0) {
      p.rect(0, 0, W, H, this.flashState.color, Math.min(1, this.flashState.a / Math.max(0.001, this.flashState.max)));
    }
    if (this.fade > 0.001) {
      p.rect(0, 0, W, H, hex("#050409"), this.fade);
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

export function boot() {
  const canvas = document.querySelector("#game");
  const game = new Game(canvas);
  window.__EMBER__ = game;
  Hero.prepare();
  return game;
}
