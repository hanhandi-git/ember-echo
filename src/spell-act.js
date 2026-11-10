// Spells that ship pixelfx `act` data: sync rig poses, displacement, hit timing and VFX.

import { createAct, characterOf } from "../../pixelfx/src/core/index.js";
import { COMBAT_SCALE, combatDistance as size } from "./combat-scale.js";
import { clampDepth } from "./game/depth.js";
import { groundBox, pointFootprintDistance } from "./collision.js";

export const ACT_POS_SCALE = COMBAT_SCALE;
const ACT_POSE_Y_SCALE = 0.52;

function heroCharacter(look) {
  try {
    return characterOf(look).id;
  } catch {
    return "ember-duelist";
  }
}

function statusForCategory(cat) {
  if (cat === "fire") return ["burn", 2.4];
  if (cat === "ice") return ["freeze", 2.1];
  if (cat === "lightning" || cat === "ninjutsu") return ["stun", 1.4];
  if (cat === "shadow") return ["slow", 2.2];
  return [undefined, 0];
}

/** Horizontal travel in effect-local pose units; long dashes need path sweeps, not a single end hit. */
function actPoseTravel(act) {
  const poses = act?.poses;
  if (!poses?.length) return 0;
  let min = Infinity, max = -Infinity;
  for (const [, pose] of poses) {
    const x = pose?.x ?? 0;
    min = Math.min(min, x);
    max = Math.max(max, x);
  }
  return min === Infinity ? 0 : max - min;
}

const PATH_SWEEP_TRAVEL = 100;

function actHitOpts(ef, h, hit = {}) {
  const sk = ef.sk;
  const [status, statusTime] = statusForCategory(sk.category);
  return {
    dmg: sk.power * h.dmgMul,
    knock: (hit.push ?? 24) * (sk.category === "moves" ? 1.15 : 0.85),
    status,
    statusTime,
    crit: Math.random() < 0.12 + (sk.category === "lightning" || sk.category === "ninjutsu" ? 0.05 : 0),
  };
}

function sweepAlongActPath(g, ef, x0, x1) {
  if (!ef.pathSweep) return;
  const h = g.hero;
  if ((x1 - x0) * ef.facing < size(0.5)) return;
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const aimY = h.y + size(-6);
  const margin = size(22);
  const struck = ef.struck;
  g.hitEnemies((e) => {
    if (struck.has(e)) return false;
    const fp = groundBox(e);
    if (Math.abs(e.y - aimY) - fp.hy > size(36)) return false;
    if (e.x - fp.hx < lo - margin || e.x + fp.hx > hi + margin) return false;
    struck.add(e);
    return true;
  }, { ...actHitOpts(ef, h, { push: 18 }), maxHits: 99 });
}

export function spellActBusy(g) {
  return g.effects.some((ef) => ef.act && !ef.dead);
}

export function interruptSpellActs(g) {
  let cut = false;
  for (const ef of g.effects) {
    if (!ef.act) continue;
    ef.act.stop();
    ef.dead = true;
    cut = true;
  }
  if (cut) {
    g.hero.actPose = null;
    g.effects = g.effects.filter((ef) => !ef.dead);
  }
  return cut;
}

function aimFacing(g) {
  const h = g.hero;
  const t = g.enemies.find((e) => e.alive && Math.hypot(e.x - h.x, (e.y - h.y) * 1.25) < size(240));
  if (t) h.facing = t.x >= h.x ? 1 : -1;
}

function syncActAnchor(ef, h) {
  ef.opts.x = h.x;
  ef.opts.y = h.y;
  ef.opts.flip = h.facing < 0;
  ef.act.fx.options.x = h.x;
  ef.act.fx.options.y = h.y;
  ef.act.fx.options.flip = h.facing < 0;
}

export function syncHeroSpellAct(g, ef) {
  const h = g.hero;
  const pose = ef.act.pose;
  if (!pose) return;
  h.actPose = pose;
  h.x = g.clampX(ef.anchorX + ef.facing * (pose.x ?? 0) * ef.posScale);
  h.y = clampDepth(g, ef.anchorY + (pose.y ?? 0) * ef.posScale * ACT_POSE_Y_SCALE);
  syncActAnchor(ef, h);
  const sh = ef.act.shake;
  if (sh[0] || sh[1]) g.shake(Math.hypot(sh[0], sh[1]) * 0.55, 0.12);
}

function resolveActHit(g, ef, hit) {
  const h = g.hero;
  const sk = ef.sk;
  if (hit.stop) g.hitStop = Math.max(g.hitStop, Math.min(hit.stop, 0.22));
  if (hit.shake) g.shake((hit.amp ?? 2) * 1.1, hit.shake);
  const reach = size(hit.straw ? Math.min(120, hit.straw) : sk.category === "moves" ? 92 : 76);
  const aimY = h.y + (hit.y ? hit.y * 0.04 : -6);
  const struck = ef.struck;
  const hits = g.hitEnemies((e) => {
    if (struck?.has(e)) return false;
    const along = (e.x - h.x) * h.facing;
    if (along < -size(24)) return false;
    if (Math.abs(e.y - aimY) - groundBox(e).hy > size(34)) return false;
    if (pointFootprintDistance(h.x, aimY, e, 1.35) >= reach) return false;
    struck?.add(e);
    return true;
  }, actHitOpts(ef, h, hit));
  if (hits && hit.stop) g.audio.play(sk.category === "melee" || sk.category === "moves" ? "cleave" : "hit");
}

export function updateSpellActs(g, dt) {
  for (const ef of g.effects) {
    if (!ef.act) continue;
    const prevX = g.hero.x;
    ef.act.update(dt);
    syncHeroSpellAct(g, ef);
    sweepAlongActPath(g, ef, prevX, g.hero.x);
    if (ef.act.done()) {
      g.hero.actPose = null;
      ef.dead = true;
    }
  }
  g.effects = g.effects.filter((ef) => !ef.dead);
}

export function castActSpell(g, sk, mod) {
  const h = g.hero;
  aimFacing(g);
  const opts = {
    x: h.x,
    y: h.y,
    flip: h.facing < 0,
    seed: 1000 + Math.floor(g.time * 17),
    character: heroCharacter(h.look),
  };
  const act = createAct(mod, opts);
  h.actPose = act.pose;
  h.vx = h.vy = 0;
  h.startAnim(`act:${sk.id}`, [[0, h.actPose]], false);
  const pathSweep = actPoseTravel(mod.act) >= PATH_SWEEP_TRAVEL;
  const ef = {
    act,
    opts,
    sk,
    layer: mod.meta.bg === "ground" ? "ground" : "front",
    anchorX: h.x,
    anchorY: h.y,
    facing: h.facing,
    posScale: ACT_POS_SCALE,
    dead: false,
    pathSweep,
    struck: pathSweep ? new WeakSet() : null,
  };
  act.onHit = (hit) => resolveActHit(g, ef, hit);
  g.effects.push(ef);
  const cat = sk.category;
  g.audio.play(cat === "fire" ? "fire" : cat === "ice" ? "ice" : cat === "lightning" || cat === "ninjutsu" ? "thunder" : cat === "melee" || cat === "moves" ? "slash" : "cast");
}

export function drawSpellActFx(g, ef, part) {
  if (!ef?.act || ef.act.t < 0) return;
  syncActAnchor(ef, g.hero);
  ef.act.fx.draw(g.frame, part);
}
