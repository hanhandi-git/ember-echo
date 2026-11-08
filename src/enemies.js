// The things that want the duelist dead: pixelfx critter loops with a small chase / wind-up / strike brain,
// and the warden waiting at the bottom of the mountain.

import { createFx, painterFor, posed, poseAt, STAND, hex, clamp, TAU } from "../../pixelfx/src/core/index.js";
import { ENEMY_TYPES, BOSS_LOOK } from "./data.js";
import { COMBAT_SCALE, BOSS_RENDER_SCALE, combatDistance as size } from "./combat-scale.js";
import { uiCopy } from "./copy.js";
import { emberForXp } from "./upgrades.js";
import { clearMobPoseOptions, mobCastEndAt, mobCastHitAt, syncMobPoseOptions } from "./content/mob-reactions.js";
import { IMPACTS } from "./combat-feel.js";

const C = {
  ink: hex("#07060d"), white: 0xffffffff, barBack: hex("#1a0d18"), bar: hex("#d8422f"),
  barLit: hex("#ff9a6a"), warn: hex("#ff5a3c"), warnLit: hex("#ffd36a"), shadow: hex("#05040a"),
  boss: hex("#c39bff"), bossLit: hex("#f0d4ff"),
};
const rnd = (a, b) => a + Math.random() * (b - a);

/** Flat armor: final damage = max(1, raw − defense), before crit multipliers. */
function damageAfterDefense(amount, defense = 0) {
  return Math.max(1, Math.round(amount) - Math.max(0, defense));
}

function dotRing(p, x, y, r, color, a, count = 18) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * TAU;
    p.dot(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.3, color, a);
  }
}

export class Enemy {
  constructor(g, typeId, x, y, opts = {}) {
    this.typeId = typeId;
    this.type = ENEMY_TYPES[typeId];
    const t = this.type;
    this.name = t.name;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.maxHp = Math.round(t.hp * (opts.hpScale ?? 1));
    this.hp = this.maxHp;
    this.speed = t.speed;
    this.combatScale = COMBAT_SCALE;
    this.reach = size(t.reach);
    this.dmg = Math.round(t.dmg * (opts.dmgScale ?? 1));
    this.defense = Math.max(0, Math.round(t.defense ?? 0));
    this.xp = t.xp;
    this.w = t.w;
    this.baseBarH = t.barH;
    this.renderScale = (t.scale ?? 0.58) * COMBAT_SCALE;
    this.barH = t.barH * this.renderScale;
    this.facing = -1;
    this.vx = 0;
    this.vy = 0;
    this.state = "spawn";
    this.timer = 0.45;
    this.atkCd = rnd(0.5, 1.2);
    this.stun = 0;
    this.freeze = 0;
    this.burn = 0;
    this.burnTick = 0;
    this.burnDmg = 0;
    this.slow = 0;
    this.hitFlash = 0;
    this.hitStun = 0;
    this.damageHp = this.hp;
    this.attackSerial = 0;
    this.attackFx = null;
    this.dead = false;
    this.spawnT = 0.45;
    this.auras = {};
    this.seed = opts.seed ?? Math.floor(Math.random() * 9999);
    this.fx = createFx(t.mod, { x, y, flip: true, seed: this.seed, ...(opts.fxOptions ?? {}) });
    this.poseState = "idle";
    this.poseT = 0;
    this.castHit = false;
    this.hurtDir = -1;
    this.dying = false;
    g.sfxAt("spawn", x);
  }

  get alive() {
    return !this.dead && !this.dying && this.state !== "spawn" && this.hp > 0;
  }
  get boss() { return false; }

  addStatus(g, key, time) {
    if (key === "freeze") {
      this.freeze = Math.max(this.freeze, time);
      this.state = "chase";
      this.timer = 0;
    } else if (key === "stun") {
      this.stun = Math.max(this.stun, time);
      this.state = "chase";
      this.timer = 0;
    } else if (key === "burn") {
      this.burn = Math.max(this.burn, time);
      this.burnDmg = Math.max(this.burnDmg, 3);
    } else if (key === "slow") this.slow = Math.max(this.slow, time);
    if (!this.auras[key]) {
      const mod = key === "freeze" ? g.fx.frozen : key === "stun" ? g.fx.stunned : key === "burn" ? g.fx.burning : null;
      if (mod) {
        const inst = createFx(mod, { x: this.x, y: this.y, seed: this.seed + 11 });
        inst.stopT = 0;
        this.auras[key] = inst;
      }
    }
  }

  updateAuras(g, dt) {
    for (const [key, inst] of Object.entries(this.auras)) {
      const live = key === "freeze" ? this.freeze > 0 : key === "stun" ? this.stun > 0 : key === "burn" ? this.burn > 0 : this.slow > 0;
      inst.options.x = this.x;
      inst.options.y = this.y;
      if (!live) inst.stop();
      inst.update(dt);
      if (inst.done()) delete this.auras[key];
    }
  }

  update(g, dt) {
    if (this.dead) return;
    this.prevX = this.x;
    this.prevY = this.y;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.hitStun = Math.max(0, this.hitStun - dt);
    if (this.hitFlash <= 0) this.damageHp = Math.max(this.hp, this.damageHp - this.maxHp * dt * 2.5);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.updateAuras(g, dt);
    // Critter modules are live simulations (not static sprites). Advancing the instance here
    // keeps hops, wings, eyes and wisps animating while the combat brain runs.
    this.fx.update(dt);

    if (this.burn > 0) {
      this.burn -= dt;
      this.burnTick -= dt;
      if (this.burnTick <= 0) {
        this.burnTick = 0.5;
        this.hurt(g, this.burnDmg, { silent: true, dot: true, crit: false });
        if (this.dead) return;
      }
    }

    if (this.state === "spawn") {
      this.timer -= dt;
      this.spawnT -= dt;
      if (this.timer <= 0) this.setState(g, "chase");
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= Math.max(0, 1 - 8 * dt);
      this.vy *= Math.max(0, 1 - 8 * dt);
      return;
    }

    if (this.state === "dying") {
      this.x = g.clampX(this.x + this.vx * dt, 20);
      this.vx *= Math.exp(-9 * dt);
      this.poseT += dt;
      syncMobPoseOptions(this);
      if (this.poseT >= (this.type.mobReact?.dieFor ?? 0.9)) this.die(g);
      return;
    }

    if (this.poseState === "hurt") {
      this.poseT += dt;
      syncMobPoseOptions(this);
      if (this.poseT >= (this.type.mobReact?.hurtFor ?? 0.34)) {
        this.poseState = "idle";
        clearMobPoseOptions(this.fx.options);
      }
    }

    // knockback carries through every state
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - 7 * dt);
    this.vy *= Math.max(0, 1 - 7 * dt);

    const hero = g.hero;
    // don't stand inside the duelist
    if (hero.alive) {
      const hx = this.x - hero.x, hy = this.y - hero.y;
      if (Math.abs(hx) < size(12) && Math.abs(hy) < size(10)) {
        this.x += Math.sign(hx || 1) * 24 * dt;
        this.y += Math.sign(hy || 1) * 14 * dt;
      }
    }
    if (!hero.alive) {
      this.setState(g, "chase");
      return;
    }
    const dx = hero.x - this.x, dy = hero.y - this.y;
    const dist = Math.hypot(dx, dy * 1.3);
    if (dx) this.facing = dx > 0 ? 1 : -1;

    if (this.freeze > 0 || this.stun > 0 || this.hitStun > 0) { this.clampPos(g); return; }

    if (this.state === "windup" && this.type.mobReact) {
      const react = this.type.mobReact;
      this.poseState = "cast";
      this.poseT += dt;
      syncMobPoseOptions(this);
      if (!this.castHit && this.poseT >= mobCastHitAt(react)) {
        this.castHit = true;
        this.strike(g, dx, dy, dist);
      }
      if (this.poseT >= mobCastEndAt(react)) {
        this.poseState = "idle";
        clearMobPoseOptions(this.fx.options);
        this.setState(g, "chase");
      }
      this.clampPos(g);
      return;
    }

    if (this.state === "windup") {
      this.timer -= dt;
      if (this.timer <= 0) this.strike(g, dx, dy, dist);
      this.clampPos(g);
      return;
    }
    if (this.state === "recover") {
      this.timer -= dt;
      if (this.timer <= 0) this.setState(g, "chase");
      this.clampPos(g);
      return;
    }

    this.atkCd -= dt * (this.slow > 0 ? 0.55 : 1);
    const slowK = this.slow > 0 ? 0.5 : 1;
    const canHit = this.type.ranged
      ? dist < this.reach && Math.abs(dy) < size(26)
      : Math.abs(dx) < this.reach && Math.abs(dy) < size(17);
    if (this.atkCd <= 0 && canHit) {
      this.setState(g, "windup");
      this.timer = this.type.windup;
      this.atkCd = this.type.cd + rnd(0, 0.35);
      return;
    }

    const want = size(this.type.want ?? 18);
    const wantDx = this.type.ranged ? want : want - size(2);
    if (Math.abs(dx) > wantDx) this.x += Math.sign(dx) * this.speed * slowK * dt;
    if (Math.abs(dy) > 7) this.y += Math.sign(dy) * this.speed * slowK * 0.55 * dt;
    this.clampSeparation(g);
    this.clampPos(g);
  }

  clampPos(g) {
    this.x = g.clampX(this.x, 20);
    this.y = clamp(this.y, 136, 169);
  }

  clampSeparation(g) {
    for (const o of g.enemies) {
      if (o === this || !o.alive) continue;
      const dx = this.x - o.x, dy = this.y - o.y;
      if (Math.abs(dx) < size(13) && Math.abs(dy) < size(9)) {
        this.x += Math.sign(dx || 1) * 8 * (1 / 60);
        this.y += Math.sign(dy || 1) * 4 * (1 / 60);
      }
    }
  }

  setState(g, s) {
    this.state = s;
    if (s === "chase") {
      this.timer = 0;
      this.castHit = false;
      if (this.type.mobReact) {
        this.poseState = "idle";
        clearMobPoseOptions(this.fx.options);
      }
    }
    if (s === "windup" && this.type.mobReact) {
      const react = this.type.mobReact;
      this.poseState = "cast";
      this.poseT = 0;
      this.castHit = false;
      this.attackFx = g.addFx(react.attackFx, {
        x: this.x,
        y: this.y,
        flip: this.facing < 0,
        seed: this.seed + 17,
      }, {
        life: react.attackDuration,
        follow: () => ({ x: this.x, y: this.y }),
        scale: this.renderScale,
      });
    }
  }

  strike(g, _dx, _dy, _dist) {
    const hero = g.hero;
    if (this.type.mobReact) {
      if (this.type.ranged) {
        g.enemyShot(this, hero);
        g.sfxAt("cast", this.x);
      } else {
        const ddx = hero.x - this.x, ddy = hero.y - this.y;
        if (Math.abs(ddx) < this.reach + size(12) && Math.abs(ddy) < size(19)) {
          if (hero.hurt(g, this.dmg, { fromX: this.x })) {
            g.addFx(g.fx.hitSpark, { x: hero.x, y: hero.y - size(20), flip: ddx < 0, light: 0.9 });
            g.hitStop = Math.max(g.hitStop, 0.045);
            g.shake(2.4, 0.2);
            g.audio.play("hit");
          }
        }
        this.vx = this.facing * 85;
      }
      return;
    }
    if (this.type.ranged) {
      this.setState(g, "recover");
      this.timer = 0.45;
      this.y = clamp(this.y, 136, 169);
      g.enemyShot(this, hero);
      g.sfxAt("cast", this.x);
      return;
    }
    this.setState(g, "recover");
    this.timer = 0.42;
    this.vx = this.facing * 85;
    const serial = this.attackSerial;
    g.after(0.07, () => {
      if (!this.alive || this.hitStun > 0 || this.attackSerial !== serial) return;
      const ddx = hero.x - this.x, ddy = hero.y - this.y;
      if (Math.abs(ddx) < this.reach + size(12) && Math.abs(ddy) < size(19)) {
        if (hero.hurt(g, this.dmg, { fromX: this.x })) {
          g.addFx(g.fx.hitSpark, { x: hero.x, y: hero.y - size(20), flip: ddx < 0, light: 0.9 });
          g.hitStop = Math.max(g.hitStop, 0.045);
          g.shake(2.4, 0.2);
          g.audio.play("hit");
        }
      }
    });
  }

  hurt(g, amount, opts = {}) {
    if (!this.alive) return 0;
    let dmg = damageAfterDefense(amount, this.defense);
    const crit = opts.crit ?? Math.random() < 0.12;
    if (crit) dmg = Math.round(dmg * 1.65);
    this.hp -= dmg;
    const dir = Math.sign(this.x - (opts.fromX ?? g.hero.x)) || g.hero.facing;
    this.hurtDir = dir;
    if (!opts.dot) {
      this.hitFlash = 0.085;
      this.vx = clamp(this.vx + (opts.knock ?? 26) * dir, -160, 160);
      const dy = this.y - (opts.fromY ?? g.hero.y);
      this.vy = clamp(dy * 1.8, -26, 26);
      this.hitStun = Math.max(this.hitStun, (IMPACTS[opts.impact ?? "spell"] ?? IMPACTS.spell).stagger);
      this.attackSerial++;
      if (this.attackFx) {
        this.attackFx.stop();
        g.effects = g.effects.filter((ef) => ef.inst !== this.attackFx);
        this.attackFx = null;
      }
      this.setState(g, "chase");
      this.atkCd = Math.max(this.atkCd, this.hitStun + 0.12);
    }
    if (opts.status) this.addStatus(g, opts.status, opts.statusTime ?? 2);
    if (!opts.silent) {
      g.comboAdd();
      g.number(this.x, this.y - this.barH - 6, String(dmg), {
        color: opts.dot ? "#ff9a6a" : crit ? "#ffd36a" : "#fff0d0",
        crit,
      });
      if (opts.dot) {
        // a tiny ember instead of a full impact for damage over time
        g.dust(this.x, this.y - 8, 2, 0, "#ff8a3a");
      } else if (this.type.mobReact && this.type.hitFx) {
        this.poseState = "hurt";
        this.poseT = 0;
        this.hurtDir = dir;
        syncMobPoseOptions(this);
        g.addFx(this.type.hitFx, {
          x: this.x - dir * size(8),
          y: this.y - size(8),
          flip: dir < 0,
          seed: this.seed + 31,
          light: crit ? 1.05 : 0.9,
        }, { scale: this.renderScale });
      } else {
        g.addFx(crit ? g.fx.critHit : g.fx.hitSpark, {
          x: this.x, y: this.y - size(18), flip: g.hero.x > this.x, light: crit ? 1.2 : 0.9,
        });
      }
      if (!opts.dot) g.impactFeedback(this, { ...opts, crit, killed: this.hp <= 0 });
    }
    if (this.hp <= 0) {
      if (this.type.mobReact) this.beginDie(g);
      else this.die(g);
    }
    return dmg;
  }

  beginDie(_g) {
    if (this.dying || this.dead) return;
    this.dying = true;
    this.state = "dying";
    this.poseState = "die";
    this.poseT = 0;
    this.vx *= 0.35;
    this.vy *= 0.35;
    syncMobPoseOptions(this);
  }

  die(g) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    clearMobPoseOptions(this.fx.options);
    const frozen = this.freeze > 0;
    const fx = frozen ? g.fx.shatterDeath : this.type.deathFx;
    if (fx) {
      g.addFx(fx, {
        x: this.x, y: this.y, light: 0.8, seed: this.seed,
      }, this.type.mobReact ? { scale: this.renderScale } : undefined);
    }
    if (!this.type.mobReact) {
      g.addFx(g.fx.poof, { x: this.x, y: this.y - 8, seed: this.seed + 3, light: 0.5 });
    }
    g.kills++;
    g.hero.gainXp(g, this.xp);
    g.hero.earnEmbers(emberForXp(this.xp));
    g.dropLoot(this.x, this.y, this.typeId);
    g.tryStashDrop?.(this.x, this.y);
    g.sfxAt("death", this.x);
    g.shake(1.6, 0.12);
  }

  draw(g, p) {
    if (this.dead) return;
    const x = Math.round(this.x), y = Math.round(this.y);
    this.fx.options.x = this.x;
    this.fx.options.y = this.y;
    this.fx.options.flip = g.hero.x < this.x;
    syncMobPoseOptions(this);
    if (this.state !== "spawn" || this.spawnT < 0.32) {
      const recoil = this.hitFlash / 0.085;
      g.drawScaledFx(this.fx, this.x + this.hurtDir * recoil * 1.3, this.y, this.renderScale * (1 + recoil * 0.055));
      p = painterFor(g.frame);
    }
    // hit flash: a white die-cut around the body
    if (this.hitFlash > 0) {
      p.glow(x, y - this.barH * 0.45, this.barH * 0.45, C.white, 0.28);
    }

    // wind-up telegraph: a dotted floor ring, brighter as the blow approaches
    if (this.state === "windup" && !this.type.mobReact) {
      const k = 1 - this.timer / this.type.windup;
      const r = this.type.ranged ? size(16 + k * 8) : this.reach * 0.9;
      dotRing(p, x, y - 1, r, k > 0.55 ? C.warnLit : C.warn, 0.55 + 0.35 * k, this.type.ranged ? 14 : 16);
      if (this.type.ranged) {
        const hy = g.hero.y - size(22);
        for (let i = 1; i < 9; i++) {
          const u = i / 9;
          p.dot(x + (g.hero.x - x) * u, (y - size(22)) + (hy - (y - size(22))) * u, C.warn, 0.22 + 0.4 * k * (1 - u));
        }
      }
    }

    // the little health bar only appears once it has been scratched
    if (this.hp < this.maxHp) {
      const top = y - this.barH - 2, w = Math.max(size(12), this.type.w * this.renderScale);
      p.rect(x - w / 2 - 1, top - 1, w + 2, 3, C.ink, 0.85);
      p.rect(x - w / 2, top, Math.max(0, Math.round(w * (this.damageHp / this.maxHp))), 1, C.warnLit);
      p.rect(x - w / 2, top, Math.max(1, Math.round(w * (this.hp / this.maxHp))), 1, this.hp / this.maxHp > 0.4 ? C.bar : C.barLit);
    }

    for (const inst of Object.values(this.auras)) g.drawScaledFx(inst, this.x, this.y, COMBAT_SCALE);
    painterFor(g.frame);
  }
}

// ---------------------------------------------------------------------------------------------------------
// The warden. Twice the height of a critter, a whole pose rig, a rune seal and three phases of bad news.
// ---------------------------------------------------------------------------------------------------------

const B_IDLE = { ...STAND, weapon: "staff", sa: 0.18, fx: 10, fy: -21, bx: 6, by: -20, crouch: 1 };
const B_RAISE = { ...B_IDLE, crouch: 0, lean: -3, fx: -4, fy: -43, bx: 9, by: -41, sa: -2.2, ffx: -3, fbx: 4 };
const B_SWEEP = { ...B_IDLE, crouch: 4, lean: 5, fx: 21, fy: -26, sa: 0.85, bx: -8, by: -22, ffx: 12, fbx: -10, toeB: true };
const B_WIDE = { turn: 1.15, crouch: 4, fx: -14, fy: -33, bx: 15, by: -33, sa: -1.3, ffx: -6, fbx: 7 };
const B_SLAM = { ...B_IDLE, crouch: 8, lean: 4, fx: -8, fy: -9, bx: 10, by: -9, sa: 0.4, ffx: -8, fbx: 9 };
const B_WALK = [
  [0, { ...B_IDLE, ffx: 9, fbx: -8, crouch: 2, lean: 1 }],
  [0.3, { ...B_IDLE, ffx: 2, ffy: -7, fbx: -2, crouch: 3 }],
  [0.6, { ...B_IDLE, ffx: -8, fbx: 9, crouch: 2, lean: 1 }],
  [0.9, { ...B_IDLE, ffx: 2, ffy: -7, fbx: -2, crouch: 3 }],
  [1.2, { ...B_IDLE, ffx: 9, fbx: -8, crouch: 2, lean: 1 }],
];
const B_TRACKS = {
  idle: [[0, B_IDLE], [1.6, { ...B_IDLE, crouch: 2, fx: 9, fy: -20 }], [3.2, B_IDLE]],
  walk: B_WALK,
  sweep: [[0, B_IDLE], [0.3, { ...B_SWEEP, x: -5, fx: -4, fy: -40, sa: -1.6 }], [0.55, B_SWEEP, "snap"], [1.0, B_SWEEP], [1.25, B_IDLE]],
  cast: [[0, B_IDLE], [0.24, B_RAISE], [0.7, B_RAISE], [0.95, { ...B_SLAM, sa: 0.4 }], [1.3, B_IDLE]],
  wide: [[0, B_IDLE], [0.3, B_RAISE], [0.6, B_WIDE, "snap"], [1.0, B_WIDE], [1.3, B_IDLE]],
  summon: [[0, B_IDLE], [0.35, B_RAISE], [0.8, { ...B_RAISE, x: -2, fx: -10, fy: -38 }], [1.2, B_RAISE], [1.5, B_IDLE]],
};

export class Boss {
  constructor(g, x, y) {
    const t = ENEMY_TYPES.boss;
    this.typeId = "boss";
    this.type = t;
    this.name = "冥河守卫 · 阿刻戎";
    this.nameEn = "THE WARDEN";
    this.x = x;
    this.y = y;
    this.maxHp = t.hp;
    this.hp = t.hp;
    this.speed = t.speed;
    this.combatScale = COMBAT_SCALE;
    this.renderScale = BOSS_RENDER_SCALE;
    this.reach = size(t.reach);
    this.dmg = t.dmg;
    this.defense = Math.max(0, Math.round(t.defense ?? 0));
    this.xp = t.xp;
    this.w = 34;
    this.facing = -1;
    this.vx = 0;
    this.vy = 0;
    this.state = "spawn";
    this.timer = 1.3;
    this.atkCd = 1.4;
    this.phase = 1;
    this.phaseLock = 1.4;
    this.stun = 0;
    this.freeze = 0;
    this.burn = 0;
    this.burnTick = 0;
    this.burnDmg = 4;
    this.slow = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.auras = {};
    this.anim = { t: 0, track: B_TRACKS.idle, loop: true, dur: 3.2 };
    this.seal = createFx(g.fx.runeCircle, { x, y, seed: 9, light: 0.7 });
    this.portal = g.addFx(g.fx.spawnPortal, { x, y, seed: 7, light: 1 }, { layer: "ground", life: 1.4 });
  }

  get alive() { return !this.dead && this.hp > 0 && this.state !== "spawn"; }
  get boss() { return true; }

  startAnim(track, loop = false) {
    this.anim = { t: 0, track, loop, dur: track[track.length - 1][0] };
  }

  addStatus(g, key, time) {
    // the warden shrugs off hard control, but still feels the frost and the fire
    if (key === "freeze") {
      this.freeze = Math.max(this.freeze, time * 0.45);
      this.slow = Math.max(this.slow, time);
    } else if (key === "stun") this.stun = Math.max(this.stun, time * 0.3);
    else if (key === "burn") {
      this.burn = Math.max(this.burn, time);
      this.burnDmg = Math.max(this.burnDmg, 5);
    } else if (key === "slow") this.slow = Math.max(this.slow, time);
    if (!this.auras[key]) {
      const mod = key === "freeze" ? g.fx.frozen : key === "stun" ? g.fx.stunned : key === "burn" ? g.fx.burning : null;
      if (mod) this.auras[key] = createFx(mod, { x: this.x, y: this.y, seed: 19 });
    }
  }

  updateAuras(g, dt) {
    for (const [key, inst] of Object.entries(this.auras)) {
      const live = key === "freeze" ? this.freeze > 0 : key === "stun" ? this.stun > 0 : key === "burn" ? this.burn > 0 : this.slow > 0;
      inst.options.x = this.x;
      inst.options.y = this.y;
      if (!live) inst.stop();
      inst.update(dt);
      if (inst.done()) delete this.auras[key];
    }
  }

  update(g, dt) {
    if (this.dead) return;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.phaseLock = Math.max(0, this.phaseLock - dt);
    this.updateAuras(g, dt);
    this.seal.options.x = this.x;
    this.seal.options.y = this.y - 1;
    this.seal.update(dt);
    this.anim.t += dt;

    if (this.burn > 0) {
      this.burn -= dt;
      this.burnTick -= dt;
      if (this.burnTick <= 0) {
        this.burnTick = 0.5;
        this.hurt(g, this.burnDmg, { silent: true, dot: true, crit: false });
        if (this.dead) return;
      }
    }

    if (this.state === "spawn") {
      this.timer -= dt;
      if (this.timer <= 0) this.state = "chase";
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - 6 * dt);
    this.vy *= Math.max(0, 1 - 6 * dt);

    const hero = g.hero;
    if (!hero.alive) return;
    const dx = hero.x - this.x;
    if (dx) this.facing = dx > 0 ? 1 : -1;
    if (this.freeze > 0 || this.stun > 0) return;
    if (this.phaseLock > 0) return;

    if (this.state === "windup") {
      this.timer -= dt;
      if (this.timer <= 0) this.execute(g);
      this.clampPos(g);
      return;
    }
    if (this.state === "recover") {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = "chase";
        this.atkCd = Math.max(0.7, 2.3 - this.phase * 0.35) + rnd(0, 0.4);
      }
      this.clampPos(g);
      return;
    }

    this.atkCd -= dt * (this.slow > 0 ? 0.6 : 1);
    const dist = Math.abs(dx);
    if (this.atkCd <= 0 && dist < size(128)) {
      this.chooseAttack(g);
      return;
    }
    if (dist > size(46)) this.x += Math.sign(dx) * this.speed * (this.slow > 0 ? 0.5 : 1) * dt;
    if (Math.abs(hero.y - this.y) > size(10)) this.y += Math.sign(hero.y - this.y) * this.speed * 0.35 * dt;
    if (Math.abs(dx) > size(50)) {
      if (this.anim.track !== B_TRACKS.walk) this.startAnim(B_TRACKS.walk, true);
    } else if (this.anim.track !== B_TRACKS.idle) {
      this.startAnim(B_TRACKS.idle, true);
    }
    this.clampPos(g);
  }

  clampPos(g) {
    this.x = g.clampX(this.x, 44);
    this.y = clamp(this.y, 140, 166);
  }

  chooseAttack(g) {
    const pool = this.phase === 1
      ? ["sweep", "thunder", "sweep"]
      : this.phase === 2
        ? ["sweep", "thunder", "wide", "summon"]
        : ["sweep", "thunder", "wide", "meteor", "thunder"];
    this.pattern = pool[Math.floor(Math.random() * pool.length)];
    this.state = "windup";
    const windup = { sweep: 0.7, thunder: 1.05, wide: 1.15, summon: 0.85, meteor: 1.3 }[this.pattern];
    this.timer = windup;
    this.startAnim(this.pattern === "sweep" ? B_TRACKS.sweep : this.pattern === "wide" ? B_TRACKS.wide : this.pattern === "summon" ? B_TRACKS.summon : B_TRACKS.cast);
    g.sfxAt("cast", this.x);
    // the floor seal brightens as the blow charges
    this.seal.options.light = 1.4;
  }

  execute(g) {
    const hero = g.hero;
    this.state = "recover";
    this.timer = 0.7;
    this.seal.options.light = 0.7;
    if (this.pattern === "sweep") {
      g.addFx(g.fx.scytheReap, { x: this.x - this.facing * size(6), y: this.y, flip: this.facing < 0, light: 1.1 });
      g.sfxAt("cleave", this.x);
      g.after(0.16, () => {
        const dx = hero.x - this.x, dy = hero.y - this.y;
        if (dx * this.facing > -size(10) && Math.abs(dx) < size(74) && Math.abs(dy) < size(24)) {
          if (hero.hurt(g, this.dmg + (this.phase - 1) * 3, { fromX: this.x })) {
            g.addFx(g.fx.critHit, { x: hero.x, y: hero.y - size(24), flip: dx < 0, light: 1.1 });
            g.shake(5, 0.4);
            g.hitStop = Math.max(g.hitStop, 0.07);
          }
        }
      });
    } else if (this.pattern === "thunder") {
      const tx = hero.x, ty = clamp(hero.y, 138, 168);
      g.telegraph(tx, ty, 34, 0.9, "#c9a8ff");
      g.addFx(g.fx.lightningStrike, { x: tx, y: ty, light: 1.2 });
      g.sfxAt("thunder", tx);
      g.after(0.76, () => {
        const near = Math.hypot(hero.x - tx, (hero.y - ty) * 1.4);
        if (near < size(38)) hero.hurt(g, this.dmg + 4, { fromX: tx });
        g.shake(6, 0.45);
        g.flashScreen("#c9a8ff", 0.16);
      });
    } else if (this.pattern === "wide") {
      g.addFx(g.fx.thunderclap, { x: this.x, y: this.y, light: 1.2 });
      g.sfxAt("thunder", this.x);
      g.after(0.12, () => {
        const near = Math.hypot(hero.x - this.x, (hero.y - this.y) * 1.5);
        if (near < size(82)) {
          hero.hurt(g, this.dmg + 2, { fromX: this.x });
          hero.vx += Math.sign(hero.x - this.x) * 90;
        }
        g.shake(7, 0.5);
        g.flashScreen("#e8d8ff", 0.22);
      });
    } else if (this.pattern === "summon") {
      g.sfxAt("spawn", this.x);
      g.after(0.25, () => {
        const spots = [[g.clampX(this.x - 58, 30), 150], [g.clampX(this.x + 58, 30), 156]];
        for (const [x, y] of spots) if (g.enemies.filter((e) => e.alive && !e.boss).length < 5) g.spawnEnemy("wisp", x, y, { seed: 400 + Math.floor(Math.random() * 99) });
      });
    } else if (this.pattern === "meteor") {
      const tx = hero.x, ty = hero.y;
      const spots = [[g.clampX(tx, 28), ty], [g.clampX(tx - size(46), 28), clamp(ty + size(6), 140, 168)], [g.clampX(tx + size(46), 28), clamp(ty - size(6), 140, 168)]];
      spots.forEach(([x, y], i) => {
        g.telegraph(x, y, 34, 1.0 + i * 0.14, "#ff9a5c");
        g.after(0.18 + i * 0.16, () => {
          g.addFx(g.fx.meteor, { x, y, light: 1.3, seed: 20 + i });
          g.sfxAt("meteor", x);
          g.shake(5, 0.35);
          g.flashScreen("#ffb060", 0.18);
          g.after(0.62, () => {
            const near = Math.hypot(hero.x - x, (hero.y - y) * 1.3);
            if (near < size(48)) hero.hurt(g, this.dmg + 6, { fromX: x });
            g.shake(7, 0.5);
          });
        });
      });
    }
  }

  hurt(g, amount, opts = {}) {
    if (!this.alive || this.phaseLock > 0) return 0;
    let dmg = damageAfterDefense(amount, this.defense);
    const crit = opts.crit ?? Math.random() < 0.1;
    if (crit) dmg = Math.round(dmg * 1.6);
    this.hp -= dmg;
    if (!opts.dot) {
      this.hitFlash = 0.085;
      // The warden keeps his telegraphed attacks: weight is visible without a stun lock.
      this.vx += Math.min(12, (opts.knock ?? 8) * 0.15) * Math.sign(this.x - (opts.fromX ?? g.hero.x) || 1);
    }
    if (opts.status) this.addStatus(g, opts.status, opts.statusTime ?? 2);
    if (!opts.silent) {
      g.comboAdd();
      g.number(this.x, this.y - size(82), String(dmg), { color: crit ? "#ffd36a" : "#ffe8ff", crit });
      g.addFx(crit ? g.fx.critHit : g.fx.hitSpark, { x: this.x, y: this.y - size(40), flip: g.hero.x > this.x, light: 1 });
      if (!opts.dot) g.impactFeedback(this, { ...opts, crit, killed: this.hp <= 0 });
    }
    if (this.hp <= 0) {
      this.die(g);
      return dmg;
    }
    const pct = this.hp / this.maxHp;
    if (this.phase === 1 && pct < 0.66) this.transition(g, 2);
    else if (this.phase === 2 && pct < 0.33) this.transition(g, 3);
    return dmg;
  }

  transition(g, phase) {
    this.phase = phase;
    this.phaseLock = 1.25;
    const c = uiCopy(g);
    g.banner(phase === 2 ? c.phase2 : c.phase3, c.bossWarden, phase === 2 ? c.bossPhase2 : c.bossPhase3);
    g.flashScreen(phase === 2 ? "#c9a8ff" : "#ff9a5c", 0.3);
    g.shake(6, 0.6);
    g.sfxAt("phase", this.x);
    g.addFx(g.fx.manaBurst, { x: this.x, y: this.y - 30, light: 1.2 });
    g.after(0.35, () => {
      g.addFx(g.fx.thunderclap, { x: this.x, y: this.y, light: 1 });
      const hero = g.hero;
      if (Math.hypot(hero.x - this.x, (hero.y - this.y) * 1.5) < size(74)) hero.hurt(g, 12, { fromX: this.x });
    });
    if (phase === 2) {
      g.spawnEnemy("wisp", g.clampX(this.x - 62, 30), 150, { seed: 511 });
      g.spawnEnemy("wisp", g.clampX(this.x + 62, 30), 156, { seed: 512 });
    }
  }

  die(g) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    g.addFx(g.fx.shatterDeath, { x: this.x, y: this.y, light: 1.2 });
    g.addFx(g.fx.manaBurst, { x: this.x, y: this.y - 30, light: 1.4 });
    g.addFx(g.fx.poof, { x: this.x, y: this.y - 20, light: 1 });
    g.flashScreen("#fff2e0", 0.5);
    g.shake(9, 1.0);
    g.hitStop = Math.max(g.hitStop, 0.16);
    g.sfxAt("death", this.x);
    g.sfxAt("meteor", this.x);
    g.kills++;
    g.hero.gainXp(g, this.xp);
    g.hero.earnEmbers(emberForXp(this.xp));
    g.bossDefeated = true;
    g.bossRef = null;
    g.audio.setScene({ boss: false });
    g.hold = 2.4;
    const c = uiCopy(g);
    g.banner(c.guardianFallen, c.wardenAsh, "");
    // the warden's summons unmake themselves when he falls
    g.after(0.5, () => {
      for (const e of g.enemies) if (e !== this && !e.dead && !e.boss) e.hurt(g, 9999, { silent: true, crit: false });
    });
  }

  draw(g, p) {
    if (this.dead) return;
    const x = Math.round(this.x), y = Math.round(this.y);
    g.drawScaledFx(this.seal, this.x, this.y - 1, COMBAT_SCALE);
    p = painterFor(g.frame);
    p.ellipse(x, y - 1, size(20), size(5), C.shadow, 0.6);
    if (this.state === "spawn") {
      p.glow(x, y - size(40), size(44), C.boss, 0.35);
      return;
    }

    const r = posed(poseAt(this.anim.track, this.anim.loop ? this.anim.t % this.anim.dur : Math.min(this.anim.t, this.anim.dur)), BOSS_LOOK, { density: 2 });
    const flip = this.facing < 0;
    const tinted = this.hitFlash > 0;
    const scale = this.renderScale;
    for (let i = 0; i < r.n; i++) {
      const dx = r.xs[i] * scale;
      const sx = x + (flip ? -dx - scale / r.density : dx);
      const sy = y + r.ys[i] * scale;
      p.rect(sx, sy, scale / r.density, scale / r.density, tinted ? C.white : r.color[i]);
    }
    // a tall dark rim around the warden
    p.glow(x, y - size(40), size(34), this.phase === 3 ? hex("#ff7a3c") : C.boss, 0.22);
    if (this.phaseLock > 0) p.glow(x, y - size(40), size(42), C.white, 0.25);

    if (this.state === "windup") {
      const k = 1 - this.timer / { sweep: 0.7, thunder: 1.05, wide: 1.15, summon: 0.85, meteor: 1.3 }[this.pattern];
      const color = this.pattern === "meteor" || this.pattern === "sweep" ? C.warnLit : C.bossLit;
      dotRing(p, x, y - 1, size(this.pattern === "wide" ? 82 : 70), color, 0.35 + 0.4 * k, 26);
      if (this.pattern === "sweep") {
        for (let i = 1; i <= 8; i++) p.dot(x + this.facing * i * size(9), y - 2, C.warn, 0.5 * (1 - i / 10));
      }
      p.text(this.pattern === "sweep" ? "!" : this.pattern === "thunder" ? "!" : "!!", x, y - size(96), color, { font: "big", align: "center", outline: C.ink });
    }
    for (const inst of Object.values(this.auras)) g.drawScaledFx(inst, this.x, this.y, COMBAT_SCALE);
    painterFor(g.frame);
  }
}

export function spawnEnemy(g, typeId, x, y, opts = {}) {
  const e = typeId === "boss" ? new Boss(g, x, y) : new Enemy(g, typeId, x, y, opts);
  g.enemies.push(e);
  return e;
}
