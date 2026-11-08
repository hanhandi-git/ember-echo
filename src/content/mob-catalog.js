// Pixelfx loop mobs → ember-echo enemy tuning (stats come from each module's `mob` export).

import * as goblinAgile from "../../../pixelfx/src/fx/mobs/goblin-agile.js";
import * as goblinArcher from "../../../pixelfx/src/fx/mobs/goblin-archer.js";
import * as goblinGiant from "../../../pixelfx/src/fx/mobs/goblin-giant.js";
import * as goblinMage from "../../../pixelfx/src/fx/mobs/goblin-mage.js";
import * as goblinWarrior from "../../../pixelfx/src/fx/mobs/goblin-warrior.js";

export const MOB_MODS = {
  goblinAgile,
  goblinArcher,
  goblinGiant,
  goblinMage,
  goblinWarrior,
};

function isRangedMob(mod, atk) {
  const tags = mod.meta?.tags ?? [];
  if (tags.includes("ranged") || tags.includes("caster")) return true;
  return (atk.fx?.meta?.tags ?? []).includes("projectile");
}

function shotFromAttack(atk) {
  const palette = atk.fx?.meta?.options?.palette;
  const atkTags = atk.fx?.meta?.tags ?? [];
  const color = palette?.[Math.min(4, (palette?.length ?? 1) - 1)] ?? "#c0a050";
  return {
    speed: atkTags.includes("caster") ? 78 : 88,
    r: 5,
    color,
    palette: palette ?? ["#161006", "#332310", "#5a421c", "#8a6a2e", "#c0a050", "#f0d888", "#fff8d0", "#ffffff"],
  };
}

function mobReactFromAttack(atk, mob) {
  const atkDef = atk.fx?.attack;
  const pose = atkDef?.pose;
  const telegraph = atkDef?.telegraph ?? atk.windup;
  const hit = atkDef?.hits?.[0];
  return {
    hurtFor: mob.hurtFor ?? 0.34,
    dieFor: mob.dieFor ?? 0.9,
    attackFx: atk.fx,
    cast: pose?.cast ?? "slash",
    poseWindup: pose?.windup ?? telegraph,
    poseHold: pose?.hold ?? 0.08,
    poseRecover: pose?.recover ?? 0.32,
    attackDuration: atk.fx?.meta?.duration ?? 0.85,
    hitRange: hit?.range ?? atk.range,
  };
}

/** Map one pixelfx mob module to an ENEMY_TYPES entry. */
export function enemyTypeFromMob(mod, { name, nameEn, scale }, fxPack) {
  const m = mod.mob;
  if (!m?.attacks?.[0]) throw new Error(`mob module missing mob.attacks: ${mod.meta?.name}`);
  const atk = m.attacks[0];
  const atkDef = atk.fx?.attack;
  const hit = atkDef?.hits?.[0];
  const ranged = isRangedMob(mod, atk);
  const rangeStat = hit?.range ?? atk.range;
  const reach = Math.round(rangeStat * (ranged ? 2.85 : 2.1));
  const tunedReach = ranged ? Math.max(92, reach) : reach;
  const elite = m.tier === "elite";
  const telegraph = atkDef?.telegraph ?? atk.windup;
  return {
    mod,
    name,
    nameEn,
    hp: m.hp,
    speed: m.speed,
    dmg: hit?.damage ?? atk.damage,
    reach: tunedReach,
    want: Math.round(tunedReach * (ranged ? 0.74 : 0.58)),
    windup: telegraph,
    cd: atk.cooldown,
    xp: m.xp,
    barH: m.height,
    w: m.radius * 2,
    scale: scale ?? (elite ? 0.72 : 0.62),
    fly: false,
    deathFx: fxPack.goblinDeath ?? fxPack.poof,
    hitFx: fxPack.goblinHit ?? null,
    mobReact: mobReactFromAttack(atk, m),
    ...(ranged ? { ranged: true, shot: shotFromAttack(atk) } : {}),
  };
}

const GOBLIN_DEFS = [
  { id: "goblin-warrior", mod: goblinWarrior, name: "哥布林战士", nameEn: "GOBLIN WARRIOR" },
  { id: "goblin-agile", mod: goblinAgile, name: "敏捷哥布林", nameEn: "GOBLIN AGILE" },
  { id: "goblin-archer", mod: goblinArcher, name: "哥布林弓手", nameEn: "GOBLIN ARCHER" },
  { id: "goblin-mage", mod: goblinMage, name: "哥布林法师", nameEn: "GOBLIN MAGE" },
  { id: "goblin-giant", mod: goblinGiant, name: "巨人哥布林", nameEn: "GOBLIN GIANT", scale: 0.74 },
];

export function buildGoblinEnemyTypes(fxPack) {
  return Object.fromEntries(GOBLIN_DEFS.map((g) => [g.id, enemyTypeFromMob(g.mod, g, fxPack)]));
}
