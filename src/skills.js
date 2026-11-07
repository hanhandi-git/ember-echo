// Six verbs for the duelist. J is a three-stroke blade string; the other five are spells with a cost,
// a cooldown and a deliberate cast. Every visual is a pixelfx effect module; this file only decides where
// it goes and when it hurts.

import { createFx, clamp } from "../../pixelfx/src/core/index.js";
import { FX, SKILL_META } from "./data.js";
import { HERO_TRACKS } from "./hero.js";
import { COMBAT_SCALE, combatDistance as size } from "./combat-scale.js";
import { castActSpell, interruptSpellActs } from "./spell-act.js";

export const SKILLS = SKILL_META.map((s) => ({ ...s, cast: null }));

function faceTo(hero, x) {
  if (Math.abs(x - hero.x) > 2) hero.facing = x > hero.x ? 1 : -1;
}

function nearest(g, maxDist = 220) {
  const h = g.hero;
  let best = null, bd = size(maxDist);
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - h.x, (e.y - h.y) * 1.25);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function aimPoint(g, maxDist = 220) {
  const h = g.hero;
  const t = nearest(g, maxDist);
  if (t) return { x: t.x, y: t.y, target: t };
  return { x: g.clampX(h.x + h.facing * size(66), 24), y: h.y, target: null };
}

function inFront(g, e, range, dy = 20) {
  const h = g.hero;
  const dx = (e.x - h.x) * h.facing;
  return dx > -size(8) && dx < range && Math.abs(e.y - h.y) < size(dy);
}

function rollCrit(extra = 0) {
  return Math.random() < 0.1 + extra;
}

function castWeaponProjectile(g, combo, profile, weapon = null) {
  const h = g.hero, aim = aimPoint(g, profile.range ?? 240);
  const w = weapon ?? h.meleeWeapon ?? h.weapon;
  faceTo(h, aim.x);
  h.startAnim("castK", HERO_TRACKS.castK, false);
  const sx = h.x + h.facing * 12 * COMBAT_SCALE, sy = h.y - 22 * COMBAT_SCALE;
  const dx = aim.x - sx, dy = aim.y - sy, len = Math.hypot(dx, dy) || 1;
  const speed = profile.speed ?? 220;
  const module = w?.module;
  const fx = module ? createFx(module, { x: sx, y: sy, flip: dx < 0, seed: 800 + combo, light: 1 }) : createFx(FX.plasmaShot, { x: sx, y: sy, flip: dx < 0, seed: 800 + combo });
  const base = profile.dmg ?? [12, 16, 25][combo] ?? 14;
  g.projectiles.push({
    x: sx, y: sy, vx: dx / len * speed, vy: dy / len * speed, prevX: sx, prevY: sy,
    r: size(profile.radius ?? 4), dmg: base * h.dmgMul, team: "hero", fx,
    life: ((profile.range ?? 240) / speed + 0.45) * COMBAT_SCALE, kind: "weapon", color: "#fff0c0",
    pierce: !!profile.pierce, maxHits: profile.maxHits ?? 1, response: profile.response ?? (w?.id === "armory:boomerang" ? "return" : undefined),
    returnSpeed: profile.returnSpeed, blastRadius: size(profile.blastRadius ?? 0), status: profile.status, statusTime: profile.statusTime,
    knock: profile.knock ?? 22, crit: profile.crit ?? false,
  });
  g.audio.play(w?.class === "thrown" ? "quick" : "slash");
}

// ------------------------------------------------------------------------------------------------
// T — 投掷: fires the equipped thrown weapon.
// ------------------------------------------------------------------------------------------------
function castT(g) {
  const h = g.hero;
  const w = h.thrownWeapon;
  if (!w) return;
  const t = nearest(g, 120);
  if (t) faceTo(h, t.x);
  const attack = w.attack ?? { kind: "projectile", range: 70, radius: 8 };
  const profile = {
    ...attack,
    kind: "projectile",
    range: attack.range ?? 70,
    speed: w.class === "thrown" ? 210 : 200,
    dmg: 15 * (w.dmgMul ?? 1),
    pierce: attack.pierce,
    maxHits: attack.maxHits,
    knock: 26,
  };
  h.setThrowRig(w.rigWeapon);
  castWeaponProjectile(g, 0, profile, w);
}

// ------------------------------------------------------------------------------------------------
// J — 星刃斩 / Star Slash: three strokes, each heavier, the last one shakes the ground.
// ------------------------------------------------------------------------------------------------
function castJ(g) {
  const h = g.hero;
  const c = h.comboIndex;
  const t = nearest(g, 70);
  if (t) faceTo(h, t.x);
  const mods = [FX.swordSlash, FX.doubleSlash, FX.heavyCleave];
  const tracks = [HERO_TRACKS.attack1, HERO_TRACKS.attack2, HERO_TRACKS.attack3];
  const profile = h.meleeWeapon?.attack ?? { kind: "line", range: [60, 68, 80][c], radius: 11, pierce: false };
  // Weapon geometry is scaled once by Game.weaponStrike; keep these combo modifiers in art units.
  const scaledProfile = { ...profile, range: (profile.range ?? 60) * [1, 1.04, 1.12][c], radius: (profile.radius ?? 11) + c * 1.5 };
  const dmg = [11, 14, 24][c];
  if (scaledProfile.kind === "projectile") {
    h.comboIndex = (c + 1) % 3;
    h.comboTimer = 0.95;
    castWeaponProjectile(g, c, scaledProfile);
    return;
  }
  const knock = [18, 28, 52][c];
  h.startAnim("attack" + (c + 1), tracks[c], false);
  h.comboIndex = (c + 1) % 3;
  h.comboTimer = 0.95;
  h.vx += h.facing * size([18, 26, 44][c]);
  const weaponFx = h.meleeWeapon?.module;
  const attackFx = weaponFx
    ? g.addFx(weaponFx, { x: h.x, y: h.y, flip: h.facing < 0, seed: 200 + c, light: c === 2 ? 1.15 : 0.95 }, { life: weaponFx.meta?.loop ? 0.9 : 0 })
    : g.addFx(mods[c], { x: h.x, y: h.y, flip: h.facing < 0, light: c === 2 ? 1.15 : 0.95 });
  h.attackFx = attackFx;
  g.audio.play(c === 2 ? "cleave" : c === 1 ? "slash2" : "slash");
  g.after(0.06 + c * 0.02, () => {
    const result = g.weaponStrike(scaledProfile, { dmg: dmg * h.dmgMul, knock, crit: rollCrit(c === 2 ? 0.05 : 0), maxHits: scaledProfile.maxHits });
    const hit = result.hits.length;
    if (hit && !scaledProfile.pierce) {
      attackFx.stop();
      // Dynamic move effects use their own local target, so terminating the instance at the hit
      // frame keeps its visible travel from continuing through the enemy.
      attackFx.options.x = result.end.x;
      attackFx.options.y = result.end.y;
    }
    if (hit) {
      g.hitStop = Math.max(g.hitStop, [0.045, 0.06, 0.11][c]);
      g.shake([1.8, 2.4, 4.6][c], [0.16, 0.2, 0.32][c]);
      if (c === 2) {
        g.flashScreen("#ffd36a", 0.1);
        g.addFx(FX.smallExplosion, { x: result.end.x, y: result.end.y, size: 0.42, light: 0.8 });
      }
    }
  });
}

// ------------------------------------------------------------------------------------------------
// K — 烈焰术 / Ember Bolt: a real travelling fireball, exploding into a small burning patch.
// ------------------------------------------------------------------------------------------------
function castK(g) {
  const h = g.hero;
  const aim = aimPoint(g, 210);
  faceTo(h, aim.x);
  h.startAnim("castK", HERO_TRACKS.castK, false);
  g.audio.play("cast");
  g.after(0.18, () => {
    if (!h.alive) return;
    const sx = h.x + h.facing * size(12), sy = h.y - size(24);
    const dx = aim.x - sx, dy = aim.y - sy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 178;
    const inst = createFx(FX.fireball, { x: sx, y: sy, flip: dx < 0, seed: 31 + Math.floor(Math.random() * 9) });
    g.projectiles.push({
      x: sx, y: sy, vx: (dx / len) * speed, vy: (dy / len) * speed, r: size(8), dmg: 19 * h.dmgMul,
      team: "hero", fx: inst, life: 1.5 * COMBAT_SCALE, kind: "fireball", color: "#ff9a4a",
    });
    g.audio.play("fire");
  });
}

export function explodeFireball(g, p) {
  g.addFx(FX.smallExplosion, { x: p.x, y: p.y + size(8), size: 0.6, light: 1.1, seed: 12 });
  g.addFx(FX.hitSpark, { x: p.x, y: p.y, light: 1 });
  const hit = g.hitEnemies((e) => Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) < size(30), {
    dmg: p.dmg, knock: 34, status: "burn", statusTime: 3.2, crit: rollCrit(),
  });
  if (hit) {
    g.hitStop = Math.max(g.hitStop, 0.06);
    g.shake(3.2, 0.28);
  }
  g.flashScreen("#ff9a4a", 0.09);
}

// ------------------------------------------------------------------------------------------------
// L — 霜环 / Frost Ring: a ring of ice around the duelist, freezing whatever it catches.
// ------------------------------------------------------------------------------------------------
function castL(g) {
  const h = g.hero;
  h.startAnim("castL", HERO_TRACKS.castL, false);
  g.addFx(FX.frostNova, { x: h.x, y: h.y, light: 1, seed: 44 + Math.floor(Math.random() * 7) }, { layer: "ground" });
  g.audio.play("ice");
  g.after(0.45, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - h.x, (e.y - h.y) * 1.4) < size(74), {
      dmg: 20 * h.dmgMul, knock: 10, status: "freeze", statusTime: 2.1, crit: rollCrit(),
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.055);
      g.shake(3.8, 0.35);
      g.flashScreen("#9ee6ff", 0.12);
    }
  });
}

// ------------------------------------------------------------------------------------------------
// U — 雷罚 / Judgement: a target sigil, then a real bolt from the sky. Late damage on purpose:
// the player has half a second to see it and move.
// ------------------------------------------------------------------------------------------------
function castU(g) {
  const h = g.hero;
  const aim = aimPoint(g, 230);
  faceTo(h, aim.x);
  h.startAnim("castU", HERO_TRACKS.castU, false);
  g.audio.play("cast");
  const tx = g.clampX(aim.x, 26), ty = clamp(aim.y, 138, 168);
  g.telegraph(tx, ty, 40, 0.95, "#c9a8ff");
  g.after(0.18, () => {
    g.addFx(FX.lightningStrike, { x: tx, y: ty, light: 1.25, seed: 51 + Math.floor(Math.random() * 11) });
    g.audio.play("thunder");
  });
  g.after(0.18 + 0.76, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - tx, (e.y - ty) * 1.4) < size(43), {
      dmg: 34 * h.dmgMul, knock: 30, status: "stun", statusTime: 1.6, crit: rollCrit(0.08),
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.08);
      g.shake(6.5, 0.45);
      g.flashScreen("#d8c8ff", 0.2);
    }
  });
}

// ------------------------------------------------------------------------------------------------
// I — 圣愈 / Grace: a heal with a lingering mend and a shield that eats one or two hits.
// ------------------------------------------------------------------------------------------------
function castI(g) {
  const h = g.hero;
  h.startAnim("castI", HERO_TRACKS.castI, false);
  g.addFx(FX.healAoe, { x: h.x, y: h.y, light: 0.9, seed: 61 }, { layer: "ground" });
  g.addFx(FX.blessing, { x: h.x, y: h.y - size(12), seed: 62, light: 0.8 }, { life: 3.4, follow: () => h });
  g.audio.play("heal");
  g.after(0.18, () => {
    h.heal(g, Math.min(48, h.maxHp * 0.32), { linger: 4 });
    h.addShield(g, 30, 6.5);
    g.addFx(FX.divineShield, { x: h.x, y: h.y, light: 1, seed: 63 }, { life: 6.5, follow: () => h });
    g.audio.play("shield");
    g.flashScreen("#c8ffb0", 0.1);
  });
}

// ------------------------------------------------------------------------------------------------
// O — 陨星 / Starfall: three burning rocks, a lot of floor, a brief window of mercy.
// ------------------------------------------------------------------------------------------------
function castO(g) {
  const h = g.hero;
  const aim = aimPoint(g, 240);
  faceTo(h, aim.x);
  h.startAnim("castO", HERO_TRACKS.castO, false);
  h.invuln = Math.max(h.invuln, 0.9);
  const tx = g.clampX(aim.x, 40), ty = clamp(aim.y, 140, 166);
  const spots = [
    [tx, ty],
    [g.clampX(tx - size(46), 35), clamp(ty + size(5), 142, 166)],
    [g.clampX(tx + size(46), 35), clamp(ty - size(5), 142, 166)],
  ];
  spots.forEach(([x, y], i) => {
    g.telegraph(x, y, 38, 1.15 + i * 0.16, "#ffa050");
    g.after(0.22 + i * 0.15, () => {
      g.addFx(FX.meteor, { x, y, light: 1.35, seed: 70 + i });
      g.audio.play("meteor");
      g.after(0.62, () => {
        const hit = g.hitEnemies((e) => Math.hypot(e.x - x, (e.y - y) * 1.3) < size(52), {
          dmg: (i === 0 ? 46 : 30) * h.dmgMul, knock: 60, status: "burn", statusTime: 4, crit: rollCrit(0.06),
        });
        if (hit) {
          g.hitStop = Math.max(g.hitStop, 0.1);
          g.shake(8, 0.55);
          g.flashScreen("#ffb060", 0.2);
        }
      });
    });
  });
}

// E — 魂爆 / Soul Burst: a compact Hades-style panic button that creates space.
function castE(g) {
  const h = g.hero;
  h.startAnim("castL", HERO_TRACKS.castL, false);
  g.addFx(FX.manaBurst, { x: h.x, y: h.y - size(12), light: 1.2, seed: 88 });
  g.addFx(FX.thunderclap, { x: h.x, y: h.y, light: 0.85, seed: 89 }, { layer: "ground" });
  g.audio.play("thunder");
  g.after(0.16, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - h.x, (e.y - h.y) * 1.35) < size(62), {
      dmg: 28 * h.dmgMul, knock: 92, status: "stun", statusTime: 0.8, crit: rollCrit(0.06),
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.07);
      g.shake(5.2, 0.35);
      g.flashScreen("#e7b7ff", 0.15);
    }
  });
}

// Every combat-capable pixelfx module can be used as a skill. The catalog entry supplies the
// effect and the small combat adapter supplies a readable target, damage window and status.
// This keeps the library's own choreography intact instead of duplicating 100+ spell files here.
function castGeneric(g, sk) {
  const h = g.hero, mod = sk.module;
  if (mod?.act) {
    castActSpell(g, sk, mod);
    return;
  }
  const target = nearest(g, 240);
  const x = target ? target.x : g.clampX(h.x + h.facing * size(72), 26);
  const y = target ? target.y : h.y;
  faceTo(h, x);
  const options = {
    x: h.x + h.facing * size(8), y: h.y, flip: h.facing < 0,
    angle: sk.category === "projectiles" || sk.category === "thrown" ? 0 : undefined,
    seed: 1000 + Math.floor(g.time * 17), light: sk.category === "fire" || sk.category === "lightning" ? 1.2 : 0.95,
  };
  // Ground effects anchor at the target; actor/move effects anchor at the caster.
  if (mod.meta.bg === "ground" || sk.category === "nature" || sk.category === "ice" && !mod.meta.actor) {
    options.x = x; options.y = y;
  }
  const cfg = { layer: mod.meta.bg === "ground" ? "ground" : "front" };
  if (mod.meta.loop) cfg.life = Math.min(2.1, Math.max(0.85, Number(mod.meta.duration ?? 1)));
  try {
    g.addFx(mod, options, cfg);
  } catch (err) {
    // A catalog effect with a specialized optional parameter still gets a fallback burst,
    // so browsing the full library never breaks the run.
    g.addFx(FX.manaBurst, { x: options.x, y: options.y - size(12), light: 1, seed: options.seed });
  }
  h.startAnim("castK", HERO_TRACKS.castK, false);
  g.audio.play(sk.category === "fire" ? "fire" : sk.category === "ice" ? "ice" : sk.category === "lightning" ? "thunder" : "cast");
  const hitTime = Math.max(0.06, Math.min(1.6, Number(sk.module.act?.hits?.[0]?.t ?? (mod.meta.loop ? 0.42 : (mod.meta.duration ?? 1) * 0.5))));
  g.after(hitTime, () => {
    if (!h.alive) return;
    const range = size(sk.category === "melee" || sk.category === "thrown" || sk.category === "moves" ? 76 : 66);
    const status = sk.category === "fire" ? "burn" : sk.category === "ice" ? "freeze" : sk.category === "lightning" ? "stun" : sk.category === "nature" ? "slow" : undefined;
    const hit = g.hitEnemies((e) => target ? Math.hypot(e.x - x, (e.y - y) * 1.35) < range : inFront(g, e, range, 24), {
      dmg: sk.power * h.dmgMul, knock: sk.category === "melee" ? 42 : 24, status, statusTime: 2.2, crit: rollCrit(sk.category === "lightning" ? 0.08 : 0),
    });
    if (hit) { g.hitStop = Math.max(g.hitStop, sk.category === "melee" ? 0.07 : 0.04); g.shake(sk.category === "moves" ? 4 : 2.4, 0.22); }
  });
}

const CASTS = { j: castJ, k: castK, l: castL, u: castU, i: castI, o: castO, e: castE, t: castT };
for (const s of SKILLS) s.cast = CASTS[s.id] ?? ((g) => castGeneric(g, s));

/** Try to cast. Returns true when the skill actually fired. */
export function castSkill(g, id) {
  const sk = SKILLS.find((s) => s.id === id);
  if (!sk || g.state !== "playing" || g.phase === "travel" || !g.hero.alive || g.hero.dead) return false;
  const h = g.hero;
  interruptSpellActs(g);
  if (h.cd[id] > 0) {
    g.audio.play("deny");
    return false;
  }
  if (h.mp < sk.cost) {
    g.audio.play("deny");
    g.ui.deny(id);
    return false;
  }
  h.mp -= sk.cost;
  h.cd[id] = sk.cd;
  sk.cast(g);
  g.ui.pulseSkill(id);
  return true;
}
