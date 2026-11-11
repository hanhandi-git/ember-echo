import { createFx, hex } from "../../../../pixelfx/src/core/index.js";
import { FX, LOOT } from "../../data.js";
import { COMBAT_SCALE } from "../../combat-scale.js";
import { lootLabel } from "../../copy.js";

import { updateSpellActs } from "../../spell-act.js";
import { IMPACTS } from "../../combat-feel.js";

export const fxEntitySystem = {
  impactFeedback(enemy, opts = {}) {
    const tier = opts.impact ?? "spell", preset = IMPACTS[tier] ?? IMPACTS.spell;
    const major = opts.crit || opts.killed;
    const dir = Math.sign(enemy.x - (opts.fromX ?? this.hero.x)) || this.hero.facing;
    const y = enemy.y - (enemy.boss ? 40 * COMBAT_SCALE : Math.min(32, (enemy.barH ?? 24) * 0.55));
    this.hitStop = Math.max(this.hitStop, preset.stop + (major ? 0.012 : 0));
    this.shake(preset.shake + (major ? 0.45 : 0), preset.duration, dir);
    this.impacts.push({ x: enemy.x, y, dir, t: 0, life: major ? 0.23 : 0.17, radius: preset.radius * (major ? 1.2 : 1), major, heavy: tier === "heavy" });
    // A few directional chips communicate force better than a cloud covering the target.
    for (let i = 0; i < preset.sparks + (opts.killed ? 3 : 0); i++) {
      const angle = -1.05 + Math.random() * 2.1, speed = 35 + Math.random() * (tier === "heavy" ? 100 : 65);
      this.motes.push({ x: enemy.x, y, vx: Math.cos(angle) * speed * dir, vy: Math.sin(angle) * speed - 12,
        t: 0, life: 0.16 + Math.random() * 0.16, color: hex(i % 3 === 0 ? "#fff5d5" : opts.crit ? "#ffc65c" : "#e5ac72") });
    }
    if (this.impacts.length > 32) this.impacts.splice(0, this.impacts.length - 32);
    this.sfxAt(tier === "heavy" ? "impactHeavy" : opts.crit ? "crit" : "hit", enemy.x,
      { pitch: opts.killed ? 0.86 : tier === "medium" ? 0.94 : 1, gain: major ? 1 : 0.85 });
  },

  updateImpacts(dt) {
    for (const impact of this.impacts) impact.t += dt;
    this.impacts = this.impacts.filter((impact) => impact.t < impact.life);
  },

  drawImpacts(p) {
    for (const impact of this.impacts) {
      const u = impact.t / impact.life, a = (1 - u) ** 2;
      const r = impact.radius * (0.35 + Math.sqrt(u) * 1.1);
      const color = hex(impact.major || impact.heavy ? "#ffd17e" : "#e0edff");
      // A very short contact cross, then broken expanding arcs. No fullscreen flash.
      if (u < 0.32) {
        p.line(impact.x - r, impact.y - r * 0.45, impact.x + r, impact.y + r * 0.45, 0xffffffff, a);
        p.line(impact.x - r * 0.4, impact.y + r * 0.7, impact.x + r * 0.4, impact.y - r * 0.7, color, a);
        p.glow(impact.x, impact.y, r * 1.1, color, a * 0.32);
      }
      for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) continue;
        const angle = i * Math.PI / 8;
        p.dot(impact.x + Math.cos(angle) * r, impact.y + Math.sin(angle) * r * 0.6, color, a * 0.8);
      }
    }
  },

  updateSpellActs(dt) {
    updateSpellActs(this, dt);
  },
  addFx(mod, opts = {}, cfg = {}) {
    const inst = createFx(mod, opts);
    this.effects.push({
      inst, layer: cfg.layer ?? "front", age: 0, life: cfg.life ?? 0,
      follow: cfg.follow ?? null, offsetY: cfg.offsetY ?? 0,
      scale: cfg.scale ?? COMBAT_SCALE,
      split: !!cfg.split, melee: !!cfg.melee,
    });
    if (cfg.cache === false) inst.__emberNoCache = true;
    return inst;
  },

  updateEffects(dt) {
    for (const ef of this.effects) {
      if (ef.act) continue;
      ef.age += dt;
      if (ef.follow) {
        const p = ef.follow();
        ef.inst.options.x = p.x;
        ef.inst.options.y = p.y + ef.offsetY;
      }
      if (ef.life && ef.age >= ef.life) ef.inst.stop();
      ef.inst.update(dt);
    }
    this.effects = this.effects.filter((ef) => ef.act ? !ef.dead : !ef.inst.done());
  },

  number(x, y, text, opts = {}) {
    const tier = opts.crit ? "crit" : "normal";
    this.numbers.push({
      x: x + (Math.random() * 8 - 4), y, text,
      t: 0, life: tier === "crit" ? 1.05 : 0.8,
      color: hex(opts.color ?? "#fff0d0"), tier, small: !!opts.small,
      vx: (Math.random() * 2 - 1) * (opts.crit ? 9 : 5),
      vy: tier === "crit" ? -34 : -24,
    });
  },

  updateNumbers(dt) {
    for (const n of this.numbers) {
      n.t += dt;
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      n.vy += 26 * dt;
    }
    this.numbers = this.numbers.filter((n) => n.t < n.life);
  },

  dust(x, y, count = 2, dir = 0, color = "#b8a890") {
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x, y, vx: (Math.random() * 2 - 1) * 20 + dir * 12, vy: -Math.random() * 16 - 4,
        t: 0, life: 0.3 + Math.random() * 0.35, color: hex(color),
      });
    }
  },

  updateMotes(dt) {
    for (const m of this.motes) {
      m.t += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vy += 18 * dt;
    }
    this.motes = this.motes.filter((m) => m.t < m.life);
  },

  telegraph(x, y, r, dur, color) {
    this.telegraphs.push({ x, y, r: r * COMBAT_SCALE, t: 0, dur, color: hex(color) });
  },

  updateTelegraphs(dt) {
    for (const t of this.telegraphs) t.t += dt;
    this.telegraphs = this.telegraphs.filter((t) => t.t < t.dur + 0.15);
  },

  shake(amp, dur, dir = 0) {
    if (amp >= this.shakeState.amp * (1 - this.shakeState.t / Math.max(0.01, this.shakeState.dur))) {
      this.shakeState = { amp: Math.min(amp, 6), t: 0, dur, dir };
    }
  },

  updateShake(dt) {
    this.shakeState.t += dt;
    if (this.shakeState.t > this.shakeState.dur) this.shakeState.amp = 0;
  },

  flashScreen(color, a) {
    if (a >= this.flashState.a) this.flashState = { color: hex(color), a, max: a };
  },

  updateFlash(dt) {
    if (this.flashState.a > 0) this.flashState.a = Math.max(0, this.flashState.a - dt * 2.2);
  },

  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  },

  comboAdd() {
    this.combo.count++;
    this.combo.timer = 2.4;
    if (this.combo.count > 0 && this.combo.count % 10 === 0) this.ui.comboMilestone(this.combo.count);
  },

  dropLoot(x, y, typeId) {
    if (typeId === "boss") return;
    const r = Math.random();
    let loot = null, acc = 0;
    for (const l of LOOT) { acc += l.p; if (r < acc) { loot = l; break; } }
    if (!loot) return;
    const fx = createFx(loot.mod, { x, y, seed: 200 + Math.floor(Math.random() * 400) });
    this.pickups.push({
      x, y, kind: loot.kind, mod: loot.mod, label: loot.label, color: loot.color,
      heal: loot.heal, mp: loot.mp, xp: loot.xp, embers: loot.embers,
      fx, age: 0, dead: false,
    });
  },

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
  },

  collect(p) {
    this.addFx(FX.collectBurst, { x: p.x, y: p.y, light: 0.9, seed: 90 + Math.floor(Math.random() * 20) });
    this.audio.play("pickup");
    if (p.kind === "heart") {
      this.hero.heal(this, p.heal ?? 18);
    } else if (p.kind === "potion") {
      const grant = p.mp ?? 24;
      const n = Math.min(grant, this.hero.maxMp - this.hero.mp);
      this.hero.mp += n;
      this.number(p.x, p.y - 20, "+" + Math.round(n) + " MP", { color: "#8fd0ff", small: true });
      this.ui.toast(lootLabel(this, "potion"));
    } else if (p.kind === "gem") {
      this.hero.gainXp(this, p.xp ?? 30);
      this.ui.toast(lootLabel(this, "gem"));
    } else if (p.kind === "elixir") {
      this.hero.heal(this, p.heal ?? 10);
      this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + (p.mp ?? 12));
      this.ui.toast(lootLabel(this, "elixir"));
    } else if (p.kind === "ember") {
      this.hero.earnEmbers(p.embers ?? 6);
      this.ui.toast(lootLabel(this, "ember"));
    } else {
      this.hero.gainXp(this, p.xp ?? 8);
      this.ui.toast(lootLabel(this, "xp"));
    }
  },
};
