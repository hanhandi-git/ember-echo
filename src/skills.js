// Six verbs for the duelist. J is a three-stroke blade string; the other five are spells with a cost,
// a cooldown and a deliberate cast. Every visual is a pixelfx effect module; this file only decides where
// it goes and when it hurts.

import { createFx, clamp } from "../../pixelfx/src/core/index.js";
import { FX, SKILL_META } from "./data.js";
import { HERO_TRACKS } from "./hero.js";

export const SKILLS = SKILL_META.map((s) => ({ ...s, cast: null }));

function faceTo(hero, x) {
  if (Math.abs(x - hero.x) > 2) hero.facing = x > hero.x ? 1 : -1;
}

function nearest(g, maxDist = 220) {
  const h = g.hero;
  let best = null, bd = maxDist;
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
  return { x: clamp(h.x + h.facing * 66, 24, 296), y: h.y, target: null };
}

function inFront(g, e, range, dy = 20) {
  const h = g.hero;
  const dx = (e.x - h.x) * h.facing;
  return dx > -8 && dx < range && Math.abs(e.y - h.y) < dy;
}

function rollCrit(extra = 0) {
  return Math.random() < 0.1 + extra;
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
  const dmg = [11, 14, 24][c];
  const range = [60, 68, 80][c];
  const knock = [18, 28, 52][c];
  h.startAnim("attack" + (c + 1), tracks[c], false);
  h.comboIndex = (c + 1) % 3;
  h.comboTimer = 0.95;
  h.vx += h.facing * [18, 26, 44][c];
  g.addFx(mods[c], { x: h.x, y: h.y, flip: h.facing < 0, light: c === 2 ? 1.15 : 0.95 });
  g.audio.play(c === 2 ? "cleave" : c === 1 ? "slash2" : "slash");
  g.after(0.06 + c * 0.02, () => {
    const hit = g.hitEnemies((e) => inFront(g, e, range, 21), { dmg: dmg * h.dmgMul, knock, crit: rollCrit(c === 2 ? 0.05 : 0) });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, [0.045, 0.06, 0.11][c]);
      g.shake([1.8, 2.4, 4.6][c], [0.16, 0.2, 0.32][c]);
      if (c === 2) {
        g.flashScreen("#ffd36a", 0.1);
        g.addFx(FX.smallExplosion, { x: h.x + h.facing * 40, y: h.y, size: 0.42, light: 0.8 });
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
    const sx = h.x + h.facing * 12, sy = h.y - 24;
    const dx = aim.x - sx, dy = aim.y - sy;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 178;
    const inst = createFx(FX.fireball, { x: sx, y: sy, flip: dx < 0, seed: 31 + Math.floor(Math.random() * 9) });
    g.projectiles.push({
      x: sx, y: sy, vx: (dx / len) * speed, vy: (dy / len) * speed, r: 8, dmg: 19 * h.dmgMul,
      team: "hero", fx: inst, life: 1.5, kind: "fireball", color: "#ff9a4a",
    });
    g.audio.play("fire");
  });
}

export function explodeFireball(g, p) {
  g.addFx(FX.smallExplosion, { x: p.x, y: p.y + 8, size: 0.6, light: 1.1, seed: 12 });
  g.addFx(FX.hitSpark, { x: p.x, y: p.y, light: 1 });
  const hit = g.hitEnemies((e) => Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) < 30, {
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
    const hit = g.hitEnemies((e) => Math.hypot(e.x - h.x, (e.y - h.y) * 1.4) < 74, {
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
  const tx = clamp(aim.x, 26, 294), ty = clamp(aim.y, 138, 168);
  g.telegraph(tx, ty, 40, 0.95, "#c9a8ff");
  g.after(0.18, () => {
    g.addFx(FX.lightningStrike, { x: tx, y: ty, light: 1.25, seed: 51 + Math.floor(Math.random() * 11) });
    g.audio.play("thunder");
  });
  g.after(0.18 + 0.76, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - tx, (e.y - ty) * 1.4) < 43, {
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
  g.addFx(FX.blessing, { x: h.x, y: h.y - 12, seed: 62, light: 0.8 }, { life: 3.4, follow: () => h });
  g.audio.play("heal");
  g.after(0.18, () => {
    h.heal(g, Math.min(48, h.maxHp * 0.32), { big: true, linger: 4 });
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
  const tx = clamp(aim.x, 40, 280), ty = clamp(aim.y, 140, 166);
  const spots = [
    [tx, ty],
    [clamp(tx - 46, 35, 285), clamp(ty + 5, 142, 166)],
    [clamp(tx + 46, 35, 285), clamp(ty - 5, 142, 166)],
  ];
  spots.forEach(([x, y], i) => {
    g.telegraph(x, y, 38, 1.15 + i * 0.16, "#ffa050");
    g.after(0.22 + i * 0.15, () => {
      g.addFx(FX.meteor, { x, y, light: 1.35, seed: 70 + i });
      g.audio.play("meteor");
      g.after(0.62, () => {
        const hit = g.hitEnemies((e) => Math.hypot(e.x - x, (e.y - y) * 1.3) < 52, {
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

const CASTS = { j: castJ, k: castK, l: castL, u: castU, i: castI, o: castO };
for (const s of SKILLS) s.cast = CASTS[s.id];

/** Try to cast. Returns true when the skill actually fired. */
export function castSkill(g, id) {
  const sk = SKILLS.find((s) => s.id === id);
  if (!sk || g.state !== "playing" || !g.hero.alive || g.hero.dead) return false;
  const h = g.hero;
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
