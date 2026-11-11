import { createFx } from "../../../../pixelfx/src/core/index.js";
import { FX } from "../../data.js";
import { explodeFireball } from "../../skills.js";
import { projectileSweep, groundBox, pathFootprintDistance } from "../../collision.js";
import { COMBAT_SCALE } from "../../combat-scale.js";
import { BH } from "../constants.js";
import { QUICK_KEYS, quickAttackId } from "../../quick-bar.js";

export const combatSystem = {
  updateCombatInput(dt) {
    const h = this.hero;
    if (!h.alive) { h.attackBuffer = 0; return; }
    const primary = quickAttackId(h.classId);
    const held = this.touchAttackHeld || this.keys.has(QUICK_KEYS[0]);
    if ((held || h.attackBuffer > 0) && (h.cd[primary] ?? 0) <= 0 && h.dashT <= 0.1 && !h.actPose && !h.actionBusy) this.cast(primary);
    if (h.dashT <= 0.1) h.attackBuffer = Math.max(0, h.attackBuffer - dt);
  },

  updateProjectiles(dt) {
    const hero = this.hero;
    for (const p of this.projectiles) {
      p.life -= dt;
      const prev = { x: p.x, y: p.y };
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.fx.options.x = p.x;
      p.fx.options.y = p.y + (p.visualOffsetY ?? 0);
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
          if (p.kind === "fireball") { explodeFireball(this, p); p.fx.stop(); p.dead = true; }
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
  },

  resolveWeaponProjectileHit(p, first) {
    p.hitIds ??= new Set();
    p.hitIds.add(first);
    const blast = p.blastRadius ?? 0;
    // The direct target belongs to the blast too. Registering it first used to skip its damage.
    const hitOpts = { knock: p.knock ?? 28, status: p.status, statusTime: p.statusTime, crit: p.crit, impact: "projectile", fromX: p.x - p.vx * 0.01, fromY: p.y - p.vy * 0.01 };
    first.hurt(this, p.dmg, hitOpts);
    if (blast) {
      for (const e of this.enemies) {
        if (!e.alive || p.hitIds.has(e)) continue;
        if (Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) <= blast) {
          e.hurt(this, p.dmg, hitOpts);
          p.hitIds.add(e);
        }
      }
    }
    if (p.response === "return" && !p.returning) {
      p.returning = true;
      p.vx = -Math.sign(p.vx || 1) * (p.returnSpeed ?? 220);
      p.vy = -p.vy * 0.25;
      p.life = Math.max(p.life, 0.7);
      return;
    }
    if (p.pierce && (!p.maxHits || p.hitIds.size < p.maxHits)) return;
    p.fx.stop(); p.dead = true;
  },

  enemyShot(enemy, hero) {
    const sx = enemy.x + enemy.facing * 10 * COMBAT_SCALE, sy = enemy.y - 20 * COMBAT_SCALE;
    const tx = hero.x, ty = hero.y - 22 * COMBAT_SCALE;
    const dx = tx - sx, dy = ty - sy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = enemy.type.shot?.speed ?? 85;
    const inst = createFx(enemy.type.shot?.fxMod ?? FX.plasmaShot, {
      x: sx, y: sy, flip: dx < 0, seed: enemy.seed + 7,
      palette: enemy.type.shot?.palette, size: enemy.type.shot?.r ?? 5,
    });
    this.projectiles.push({
      x: sx, y: sy, vx: (dx / len) * speed, vy: (dy / len) * speed, r: (enemy.type.shot?.r ?? 5) * COMBAT_SCALE,
      dmg: enemy.dmg, team: "enemy", fx: inst, life: 2.6 * COMBAT_SCALE, color: enemy.type.shot?.color ?? "#ff7a6a",
    });
  },

  hitEnemies(pred, opts = {}) {
    let hits = 0;
    for (const e of this.enemies) {
      if (!e.alive || !pred(e)) continue;
      const damage = e.hurt(this, opts.dmg, { ...opts, knock: opts.knock ?? 22 });
      if (damage > 0) hits++;
      if (opts.maxHits && hits >= opts.maxHits) break;
    }
    return hits;
  },

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
    const pathY = hero.y - (profile?.kind === "thrust" ? 1 : 3) * COMBAT_SCALE;
    return [{ x: hero.x + facing * 3 * COMBAT_SCALE, y: pathY }, { x: hero.x + facing * range, y: pathY }];
  },

  weaponStrike(profile, opts = {}) {
    const hero = opts.origin ?? this.hero, points = this.weaponAttackPath(profile, hero), hits = [];
    // The blade's half-width plus a small forgiveness pad; enemy size comes from the
    // hurtbox footprint, not a separate radius estimate.
    const radius = (profile?.radius ?? 10) * COMBAT_SCALE + 2 * COMBAT_SCALE;
    const candidates = [];
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if ((e.x - hero.x) * hero.facing < -4 * COMBAT_SCALE) continue;
      let d = Infinity;
      for (let i = 0; i <= 5; i++) {
        d = Math.min(d, pathFootprintDistance(points, groundBox(e, i / 5)));
      }
      if (d <= radius) candidates.push({ e, d, distance: Math.hypot(e.x - hero.x, (e.y - hero.y) * 1.2) });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    const limit = profile?.pierce ? (profile.maxHits ?? 99) : 1;
    for (const { e } of candidates.slice(0, limit)) {
      const damage = e.hurt(this, opts.dmg, { ...opts, knock: opts.knock ?? 22 });
      if (damage > 0) hits.push(e);
    }
    return { hits, points, end: hits.length ? { x: hits[0].x, y: hits[0].y } : points.at(-1) };
  },
};
