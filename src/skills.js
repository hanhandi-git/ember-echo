// Class-specific combat: blade strings and sword arts for swordsmen, bolts and spells for mages.
// pixelfx supplies the effects; these adapters own targeting, resource costs, and contact timing.

import { createFx } from "../../pixelfx/src/core/index.js";
import { FX, SKILL_META } from "./data.js";
import { HERO_TRACKS } from "./hero.js";
import { COMBAT_SCALE, combatDistance as size } from "./combat-scale.js";
import { castActSpell, interruptSpellActs } from "./spell-act.js";
import { ATTACK_BUFFER, meleeBeat } from "./combat-feel.js";
import { meleeArt, meleePoseTrack } from "./melee-arts.js";
import { canUseSkill } from "./classes.js";
import * as heroProjectile from "./fx/hero-projectile.js";
import { clampDepth } from "./game/depth.js";

export const SKILLS = SKILL_META.map((s) => ({ ...s, cast: null }));

function afterHero(g, time, fn) {
  const revision = g.hero.classRevision;
  g.after(time, () => {
    if (g.hero.alive && g.hero.classRevision === revision) fn();
  });
}

function castMageBolt(g) {
  const h = g.hero, c = h.comboIndex;
  castNativeProjectile(g, c, 0.44, 14);
  h.comboIndex = (c + 1) % 3;
  h.comboTimer = 0.95;
}

function nativeAnim(h, kind, duration, contact) {
  h.startAnim(kind, [[0, {}], [duration, {}]], false);
  h.anim.dur = duration;
  h.anim.contact = contact;
}

function castNativeProjectile(g, combo, duration, damage, enhanced = false) {
  const h = g.hero, aim = aimPoint(g, 260), contact = duration * 0.4;
  enhanced ||= h.dashAttackT > 0;
  faceTo(h, aim.x);
  nativeAnim(h, enhanced ? "enhanced" : "attack" + (combo + 1), duration, contact);
  h.dashAttackT = 0;
  const attack = { cancelled: false };
  h.melee = attack;
  afterHero(g, contact, () => {
    if (attack.cancelled || h.melee !== attack) return;
    // Pick the target's horizontal lane once, then travel across it. This keeps
    // the release straight even when the target is standing at another depth.
    const x = h.x + h.facing * size(16), y = aim.target?.y ?? h.y;
    // Basic bow and magic releases travel on the combat lane. The old target-height
    // aim made the projectile line visibly slope whenever a foe stood above/below us.
    const dx = aim.x - x, direction = Math.sign(dx) || h.facing;
    g.projectiles.push({ x, y, prevX: x, prevY: y, vx: direction * 230, vy: 0,
      r: size(enhanced ? 7 : 4), dmg: damage * h.dmgMul * (enhanced ? 1.15 : 1), team: "hero", life: 1.4,
      kind: "hero-weapon", color: "#e6daff", knock: enhanced ? 44 : 15,
      pierce: enhanced, maxHits: enhanced ? 3 : 1,
      visualOffsetY: -size(14),
      fx: createFx(heroProjectile, { x, y: y - size(14), flip: direction < 0, angle: 0, look: h.look, appearance: h.appearance }) });
  });
  g.audio.play("slash", { gain: 0.5, pitch: 1.2 });
}

function castSwordArt(g, sk) {
  const h = g.hero;
  if (sk.art === "guard") {
    nativeAnim(h, "guard", 0.6, 0.15);
    h.addShield(g, 36, 6);
    g.audio.play("shield");
    return;
  }
  const aim = nearest(g, 170);
  if (aim) faceTo(h, aim.x);
  const rush = sk.art === "rush", awakening = sk.art === "awakening";
  const range = sk.art === "rise" ? 74 : awakening ? 108 : rush ? 84 : 92;
  const origin = { x: h.x, y: h.y, facing: h.facing };
  const combo = sk.art === "rise" ? 1 : 2;
  const beat = { ...meleeBeat(h, combo), hit: rush ? 0.13 : 0.2, duration: awakening ? 0.8 : 0.5 };
  nativeAnim(h, sk.art ?? "cleave", beat.duration, beat.hit);
  if (awakening) h.anim.hits = [beat.hit, 0.4, 0.62];
  const attack = { cancelled: false };
  h.melee = attack;
  if (rush) h.vx = h.facing * size(330);
  const strike = (index) => {
    if (attack.cancelled || h.melee !== attack) return;
    const at = origin;
    const reach = range + (rush ? Math.abs(h.x - origin.x) / COMBAT_SCALE : 0);
    const hit = g.weaponStrike({ kind: rush ? "line" : "arc", range: reach, radius: awakening ? 26 : 20, pierce: true, maxHits: 8 }, {
      origin: { x: at.x, y: at.y, facing: origin.facing }, dmg: sk.power * h.dmgMul, knock: rush ? 28 : 50,
      impact: "heavy", status: sk.art === "rise" ? "stun" : undefined, statusTime: 0.9,
    });
    if (hit.hits.length > 0) { g.shake(2.4, 0.18); g.hitStop = Math.max(g.hitStop, 0.055); }
    g.audio.play("slash2", { pitch: awakening ? 0.8 + index * 0.15 : 0.85 });
  };
  afterHero(g, beat.hit, () => strike(0));
  if (awakening) {
    afterHero(g, 0.4, () => strike(1));
    afterHero(g, 0.62, () => strike(2));
  }
}

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

// ------------------------------------------------------------------------------------------------
// T — 强化普攻: uses the character's fixed weapon and authored action frames.
// ------------------------------------------------------------------------------------------------
function castT(g) {
  if (g.hero.meleeWeapon.attack.kind === "projectile") castNativeProjectile(g, 2, 0.6, 30, true);
  else castSwordArt(g, { art: "enhanced", power: 30 });
}

// ------------------------------------------------------------------------------------------------
// J — 星刃斩 / Star Slash: three strokes, each heavier, the last one shakes the ground.
// ------------------------------------------------------------------------------------------------
function castJ(g) {
  const h = g.hero;
  const c = h.comboIndex;
  const beat = meleeBeat(h, c);
  const t = nearest(g, Math.max(70, h.meleeWeapon?.attack?.range ?? 58));
  if (t) faceTo(h, t.x);
  const profile = h.meleeWeapon?.attack ?? { kind: "line", range: [60, 68, 80][c], radius: 11, pierce: false };
  // Weapon geometry is scaled once by Game.weaponStrike; keep these combo modifiers in art units.
  const scaledProfile = { ...profile, range: (profile.range ?? 60) * [1, 1.04, 1.12][c], radius: (profile.radius ?? 11) + c * 1.5 };
  const dashAttack = h.dashAttackT > 0;
  const dmg = beat.damage * (dashAttack ? 1.15 : 1);
  h.cd.j = beat.duration;
  h.meleeCooldownMax = beat.duration;
  h.attackBuffer = 0;
  if (scaledProfile.kind === "projectile") {
    h.comboIndex = (c + 1) % 3;
    h.comboTimer = 0.95;
    castNativeProjectile(g, c, beat.duration, dmg);
    return;
  }
  h.cancelMelee(true);
  const art = meleeArt(h.meleeWeapon, c, dashAttack);
  const track = meleePoseTrack(art, beat, h.meleeWeapon, c);
  h.startAnim(dashAttack ? "enhanced" : "attack" + (c + 1), track, false);
  h.anim.contact = beat.hit;
  h.anim.dur = beat.duration;
  h.comboIndex = (c + 1) % 3;
  h.comboTimer = 0.9;
  h.vx = h.facing * size(beat.lunge * (dashAttack ? 1.45 : 1));
  h.dashAttackT = 0;
  const attack = { x: h.x, y: h.y, facing: h.facing, hitTime: beat.hit, landed: false, cancelled: false, art, echoT: 0 };
  h.melee = attack;
  g.audio.play(c === 1 ? "slash2" : "slash", { pitch: c === 2 ? 0.72 : 1, gain: c === 2 ? 0.85 : 0.7 });
  afterHero(g, beat.hit, () => {
    if (!h.alive || attack.cancelled || h.melee !== attack) return;
    attack.x = h.x; attack.y = h.y; attack.landed = true;
    const finisher = c === 2 || dashAttack;
    // Finishers sweep a small group; light cuts retain the weapon's contact policy.
    const contact = finisher ? { ...scaledProfile, pierce: true, maxHits: Math.max(3, scaledProfile.maxHits ?? 1) } : scaledProfile;
    g.weaponStrike(contact, {
      origin: attack, dmg: dmg * h.dmgMul, knock: beat.knock, impact: finisher ? "heavy" : beat.tier,
      crit: rollCrit(c === 2 ? 0.05 : 0), fromX: attack.x, fromY: attack.y,
    });
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
  afterHero(g, 0.18, () => {
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
    g.hitStop = Math.max(g.hitStop, 0.04);
    g.shake(1.8, 0.18);
  }
}

// ------------------------------------------------------------------------------------------------
// L — 霜环 / Frost Ring: a ring of ice around the duelist, freezing whatever it catches.
// ------------------------------------------------------------------------------------------------
function castL(g) {
  const h = g.hero;
  h.startAnim("castL", HERO_TRACKS.castL, false);
  g.addFx(FX.frostNova, { x: h.x, y: h.y, light: 1, seed: 44 + Math.floor(Math.random() * 7) }, { layer: "ground" });
  g.audio.play("ice");
  afterHero(g, 0.45, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - h.x, (e.y - h.y) * 1.4) < size(74), {
      dmg: 20 * h.dmgMul, knock: 10, status: "freeze", statusTime: 2.1, crit: rollCrit(),
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.045);
      g.shake(2, 0.19);
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
  const tx = g.clampX(aim.x, 26), ty = clampDepth(g, aim.y, 4, 2);
  g.telegraph(tx, ty, 40, 0.95, "#c9a8ff");
  afterHero(g, 0.18, () => {
    g.addFx(FX.lightningStrike, { x: tx, y: ty, light: 1.25, seed: 51 + Math.floor(Math.random() * 11) });
    g.audio.play("thunder");
  });
  afterHero(g, 0.18 + 0.76, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - tx, (e.y - ty) * 1.4) < size(43), {
      dmg: 34 * h.dmgMul, knock: 30, status: "stun", statusTime: 1.6, crit: rollCrit(0.08),
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.065);
      g.shake(3.1, 0.23);
      g.flashScreen("#d8c8ff", 0.08);
    }
  });
}

// ------------------------------------------------------------------------------------------------
// I — 圣愈 / Grace: a heal with a lingering mend and a shield that eats one or two hits.
// ------------------------------------------------------------------------------------------------
function castI(g) {
  const h = g.hero;
  h.startAnim("castI", HERO_TRACKS.castI, false);
  g.addFx(FX.healAoe, { x: h.x, y: h.y, light: 0.9, seed: 61 }, { layer: "ground", cache: false });
  g.addFx(FX.blessing, { x: h.x, y: h.y - size(12), seed: 62, light: 0.8 }, { life: 3.4, follow: () => h, cache: false });
  g.audio.play("heal");
  afterHero(g, 0.18, () => {
    h.heal(g, Math.min(48, h.maxHp * 0.32), { linger: 4 });
    h.addShield(g, 30, 6.5);
    g.addFx(FX.divineShield, { x: h.x, y: h.y, light: 1, seed: 63 }, { life: 6.5, follow: () => h, cache: false });
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
  const tx = g.clampX(aim.x, 40), ty = clampDepth(g, aim.y, 6, 4);
  const spots = [
    [tx, ty],
    [g.clampX(tx - size(46), 35), clampDepth(g, ty + size(5), 8, 4)],
    [g.clampX(tx + size(46), 35), clampDepth(g, ty - size(5), 8, 4)],
  ];
  spots.forEach(([x, y], i) => {
    g.telegraph(x, y, 38, 1.15 + i * 0.16, "#ffa050");
    afterHero(g, 0.22 + i * 0.15, () => {
      g.addFx(FX.meteor, { x, y, light: 1.35, seed: 70 + i });
      g.audio.play("meteor");
      afterHero(g, 0.62, () => {
        const hit = g.hitEnemies((e) => Math.hypot(e.x - x, (e.y - y) * 1.3) < size(52), {
          dmg: (i === 0 ? 46 : 30) * h.dmgMul, knock: 60, status: "burn", statusTime: 4, crit: rollCrit(0.06),
        });
        if (hit) {
          g.hitStop = Math.max(g.hitStop, 0.075);
          g.shake(3.8, 0.28);
          g.flashScreen("#ffb060", 0.08);
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
  afterHero(g, 0.16, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - h.x, (e.y - h.y) * 1.35) < size(62), {
      dmg: 28 * h.dmgMul, knock: 92, status: "stun", statusTime: 0.8, crit: rollCrit(0.06),
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.055);
      g.shake(2.8, 0.22);
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
  } catch (_err) {
    // A catalog effect with a specialized optional parameter still gets a fallback burst,
    // so browsing the full library never breaks the run.
    g.addFx(FX.manaBurst, { x: options.x, y: options.y - size(12), light: 1, seed: options.seed });
  }
  h.startAnim("castK", HERO_TRACKS.castK, false);
  g.audio.play(sk.category === "fire" ? "fire" : sk.category === "ice" ? "ice" : sk.category === "lightning" ? "thunder" : "cast");
  const hitTime = Math.max(0.06, Math.min(1.6, Number(sk.module.act?.hits?.[0]?.t ?? (mod.meta.loop ? 0.42 : (mod.meta.duration ?? 1) * 0.5))));
  afterHero(g, hitTime, () => {
    if (!h.alive) return;
    const range = size(sk.category === "melee" || sk.category === "thrown" || sk.category === "moves" ? 76 : 66);
    const status = sk.category === "fire" ? "burn" : sk.category === "ice" ? "freeze" : sk.category === "lightning" ? "stun" : sk.category === "nature" ? "slow" : undefined;
    const hit = g.hitEnemies((e) => target ? Math.hypot(e.x - x, (e.y - y) * 1.35) < range : inFront(g, e, range, 24), {
      dmg: sk.power * h.dmgMul, knock: sk.category === "melee" ? 42 : 24, status, statusTime: 2.2, crit: rollCrit(sk.category === "lightning" ? 0.08 : 0),
    });
    if (hit) { g.hitStop = Math.max(g.hitStop, sk.category === "melee" ? 0.055 : 0.032); g.shake(sk.category === "moves" ? 2.8 : 1.6, 0.18); }
  });
}

const CASTS = { j: castJ, k: castK, l: castL, u: castU, i: castI, o: castO, e: castE, t: castT, "mage:bolt": castMageBolt };
for (const s of SKILLS) s.cast = CASTS[s.id] ?? (s.classId === "swordsman" ? (g) => castSwordArt(g, s) : (g) => castGeneric(g, s));

/** Try to cast. Returns true when the skill actually fired. */
export function castSkill(g, id) {
  const sk = SKILLS.find((s) => s.id === id);
  const training = g.state === "camp" && g.hubZone === "arena" && !g.campMenuOpen;
  if (!sk || !canUseSkill(g.hero.classId, sk) || (g.state !== "playing" && !training) || g.phase === "travel" || !g.hero.alive || g.hero.dead) return false;
  const h = g.hero;
  if (["j", "mage:bolt"].includes(id) && (h.cd[id] > 0 || g.hitStop > 0 || h.dashT > 0.1 || h.actionBusy)) {
    // One queued press, never a backlog of attacks. Hit-stop does not age this buffer.
    if (Math.max(h.cd[id] ?? 0, h.actionBusy ? h.anim.dur - h.anim.t : 0) <= ATTACK_BUFFER || g.hitStop > 0 || h.dashT > 0) h.attackBuffer = ATTACK_BUFFER;
    return false;
  }
  if (h.cd[id] > 0) {
    g.audio.play("deny");
    return false;
  }
  if (h.mp < sk.cost) {
    g.audio.play("deny");
    g.ui.denySkill(id);
    return false;
  }
  // Rejected input must not cancel the action already being performed.
  interruptSpellActs(g);
  if (id !== "j") { h.cancelMelee(); h.attackBuffer = 0; }
  h.mp -= sk.cost;
  h.cd[id] = sk.cd;
  sk.cast(g);
  g.ui.pulseSkill(id);
  return true;
}
