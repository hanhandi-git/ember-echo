// Spells that ship pixelfx `act` data: sync rig poses, displacement, hit timing and VFX.

import { createAct, characterOf, clamp } from "../../pixelfx/src/core/index.js";
import { COMBAT_SCALE, combatDistance as size } from "./combat-scale.js";

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
  h.y = clamp(ef.anchorY + (pose.y ?? 0) * ef.posScale * ACT_POSE_Y_SCALE, 134, 170);
  syncActAnchor(ef, h);
  const sh = ef.act.shake;
  if (sh[0] || sh[1]) g.shake(Math.hypot(sh[0], sh[1]) * 0.55, 0.12);
}

function resolveActHit(g, ef, hit) {
  const h = g.hero;
  const sk = ef.sk;
  if (hit.stop) g.hitStop = Math.max(g.hitStop, Math.min(hit.stop, 0.22));
  if (hit.shake) g.shake((hit.amp ?? 2) * 1.1, hit.shake);
  const [status, statusTime] = statusForCategory(sk.category);
  const reach = size(hit.straw ? Math.min(120, hit.straw) : sk.category === "moves" ? 92 : 76);
  const aimY = h.y + (hit.y ? hit.y * 0.04 : -6);
  const struck = g.hitEnemies((e) => {
    const along = (e.x - h.x) * h.facing;
    if (along < -size(24)) return false;
    if (Math.abs(e.y - aimY) > size(34)) return false;
    return Math.hypot(e.x - h.x, (e.y - aimY) * 1.35) < reach;
  }, {
    dmg: sk.power * h.dmgMul,
    knock: (hit.push ?? 24) * (sk.category === "moves" ? 1.15 : 0.85),
    status,
    statusTime,
    crit: Math.random() < 0.12 + (sk.category === "lightning" ? 0.05 : 0),
  });
  if (struck && hit.stop) g.audio.play(sk.category === "melee" || sk.category === "moves" ? "cleave" : "hit");
}

export function updateSpellActs(g, dt) {
  for (const ef of g.effects) {
    if (!ef.act) continue;
    ef.act.update(dt);
    syncHeroSpellAct(g, ef);
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
