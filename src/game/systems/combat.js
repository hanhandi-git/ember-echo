import { createFx, clamp } from "../../../../pixelfx/src/core/index.js";
import { FX } from "../../data.js";
import { explodeFireball } from "../../skills.js";
import { projectileSweep } from "../../collision.js";
import { COMBAT_SCALE } from "../../combat-scale.js";
import { BH } from "../constants.js";
import { SKILL_SLOT_KEYS } from "../../input/bindings.js";

export const combatSystem = {
  updateCombatInput(dt) {
    const h = this.hero;
    if (!h.alive) { h.attackBuffer = 0; return; }
    const primary = h.classId === "mage" ? "mage:bolt" : "j";
    const held = this.touchAttackHeld || Object.entries(SKILL_SLOT_KEYS).some(([key, slot]) => this.keys.has(key) && h.skillSlots[slot] === primary);
    if ((held || h.attackBuffer > 0) && (h.cd[primary] ?? 0) <= 0 && h.dashT <= 0.1 && !h.actPose) this.cast(primary);
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
    const inst = createFx(FX.plasmaShot, {
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

  enemyPathHit(e, shape) {
    const x0 = e.prevX ?? e.x, y0 = e.prevY ?? e.y, x1 = e.x, y1 = e.y;
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u;
      if (shape(x, y, e)) return true;
    }
    return false;
  },

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
    const radius = (profile?.radius ?? 10) * COMBAT_SCALE;
    const pointSegmentDistance = (px, py, ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const u = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
      return Math.hypot(px - (ax + dx * u), (py - (ay + dy * u)) * 1.2);
    };
    const pathDistance = (x, y) => {
      let best = Infinity;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        best = Math.min(best, pointSegmentDistance(x, y, a.x, a.y, b.x, b.y));
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
      const forward = (e.x - hero.x) * hero.facing;
      if (forward >= -4 * COMBAT_SCALE && d <= radius + Math.max(5 * COMBAT_SCALE, e.w * (e.renderScale ?? COMBAT_SCALE) * 0.55)) candidates.push({ e, d, distance: Math.hypot(e.x - hero.x, (e.y - hero.y) * 1.2) });
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
