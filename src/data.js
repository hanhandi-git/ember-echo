// Every art asset the demo uses comes from the pixelfx library next door — maps, critters, spell
// effects, impacts and pickups. This file is the one place that knows where they live.

import * as mapMossy from "../../pixelfx/src/fx/world/mossy-ruins.js";
import * as mapMarsh from "../../pixelfx/src/fx/world/wisp-marsh.js";
import * as mapEmber from "../../pixelfx/src/fx/world/ember-depths.js";

import * as slime from "../../pixelfx/src/fx/critters/slime.js";
import * as snake from "../../pixelfx/src/fx/critters/snake.js";
import * as frog from "../../pixelfx/src/fx/critters/frog.js";
import * as bat from "../../pixelfx/src/fx/critters/bat.js";
import * as wisp from "../../pixelfx/src/fx/critters/wisp.js";
import * as ghost from "../../pixelfx/src/fx/critters/ghost.js";
import * as eyeball from "../../pixelfx/src/fx/critters/eyeball.js";
import * as flyingSkull from "../../pixelfx/src/fx/critters/flying-skull.js";

import * as swordSlash from "../../pixelfx/src/fx/melee/sword-slash.js";
import * as doubleSlash from "../../pixelfx/src/fx/melee/double-slash.js";
import * as heavyCleave from "../../pixelfx/src/fx/melee/heavy-cleave.js";
import * as scytheReap from "../../pixelfx/src/fx/melee/scythe-reap.js";
import * as fireball from "../../pixelfx/src/fx/fire/fireball.js";
import * as meteor from "../../pixelfx/src/fx/fire/meteor.js";
import * as frostNova from "../../pixelfx/src/fx/ice/frost-nova.js";
import * as lightningStrike from "../../pixelfx/src/fx/lightning/lightning-strike.js";
import * as thunderclap from "../../pixelfx/src/fx/lightning/thunderclap.js";
import * as healAoe from "../../pixelfx/src/fx/holy/heal-aoe.js";
import * as blessing from "../../pixelfx/src/fx/holy/blessing.js";
import * as divineShield from "../../pixelfx/src/fx/holy/divine-shield.js";
import * as hitSpark from "../../pixelfx/src/fx/impacts/hit-spark.js";
import * as critHit from "../../pixelfx/src/fx/impacts/crit-hit.js";
import * as smallExplosion from "../../pixelfx/src/fx/explosions/small-explosion.js";
import * as poof from "../../pixelfx/src/fx/spawn/poof.js";
import * as shatterDeath from "../../pixelfx/src/fx/spawn/shatter-death.js";
import * as spawnPortal from "../../pixelfx/src/fx/spawn/spawn-portal.js";
import * as levelUp from "../../pixelfx/src/fx/ui/level-up.js";
import * as comboCounter from "../../pixelfx/src/fx/ui/combo-counter.js";
import * as runeCircle from "../../pixelfx/src/fx/arcane/rune-circle.js";
import * as manaBurst from "../../pixelfx/src/fx/arcane/mana-burst.js";
import * as frozen from "../../pixelfx/src/fx/status/frozen.js";
import * as burning from "../../pixelfx/src/fx/status/burning.js";
import * as stunned from "../../pixelfx/src/fx/status/stunned.js";
import * as plasmaShot from "../../pixelfx/src/fx/projectiles/plasma-shot.js";
import * as heartPickup from "../../pixelfx/src/fx/pickups/heart-pickup.js";
import * as potionPickup from "../../pixelfx/src/fx/pickups/potion.js";
import * as xpOrb from "../../pixelfx/src/fx/pickups/xp-orb.js";
import * as collectBurst from "../../pixelfx/src/fx/pickups/collect-burst.js";

export const FX = {
  swordSlash, doubleSlash, heavyCleave, scytheReap, fireball, meteor, frostNova,
  lightningStrike, thunderclap, healAoe, blessing, divineShield,
  hitSpark, critHit, smallExplosion, poof, shatterDeath, spawnPortal, levelUp, comboCounter,
  runeCircle, manaBurst, frozen, burning, stunned, plasmaShot,
  heartPickup, potionPickup, xpOrb, collectBurst,
};

export const HERO_LOOK = "ember-duelist";
export const BOSS_LOOK = "styx-warden";

/** Three acts: a moonlit ruin, a drowned marsh, and the volcano under it. */
export const STAGES = [
  {
    act: "第一幕", name: "苔痕遗迹", sub: "月下的旧圣所", chapter: "I",
    map: mapMossy,
    palette: "#8fd88a",
    waves: [
      [
        { type: "slime", x: 126, y: 150 },
        { type: "slime", x: 218, y: 158 },
        { type: "snake", x: 268, y: 146 },
      ],
      [
        { type: "frog", x: 116, y: 160 },
        { type: "slime", x: 178, y: 144 },
        { type: "snake", x: 236, y: 160 },
        { type: "slime", x: 288, y: 150 },
      ],
    ],
  },
  {
    act: "第二幕", name: "幽火沼泽", sub: "亡者的灯", chapter: "II",
    map: mapMarsh,
    palette: "#8ed7bf",
    waves: [
      [
        { type: "bat", x: 116, y: 142 },
        { type: "wisp", x: 214, y: 148 },
        { type: "bat", x: 272, y: 158 },
      ],
      [
        { type: "ghost", x: 122, y: 154 },
        { type: "wisp", x: 184, y: 140 },
        { type: "ghost", x: 236, y: 160 },
        { type: "wisp", x: 288, y: 150 },
      ],
    ],
  },
  {
    act: "第三幕", name: "熔岩深窟", sub: "余烬的源头", chapter: "III",
    map: mapEmber,
    palette: "#ff9a5c",
    waves: [
      [
        { type: "bat", x: 118, y: 144 },
        { type: "eyeball", x: 206, y: 150 },
        { type: "flying-skull", x: 268, y: 158 },
        { type: "bat", x: 298, y: 148 },
      ],
      [
        { type: "boss", x: 258, y: 152 },
      ],
    ],
  },
];

/** Enemy archetypes. `mod` is the looping pixel critter; the rest is game design. */
export const ENEMY_TYPES = {
  slime: {
    mod: slime, name: "苔泥", hp: 34, speed: 15, dmg: 8, reach: 30, want: 17, windup: 0.55, cd: 1.9,
    xp: 10, barH: 44, w: 14, fly: false, deathFx: poof,
  },
  snake: {
    mod: snake, name: "草蛇", hp: 24, speed: 35, dmg: 7, reach: 32, want: 18, windup: 0.32, cd: 1.35,
    xp: 9, barH: 34, w: 16, fly: false, deathFx: poof,
  },
  frog: {
    mod: frog, name: "沼蛙", hp: 32, speed: 22, dmg: 9, reach: 32, want: 18, windup: 0.46, cd: 1.7,
    xp: 12, barH: 36, w: 14, fly: false, deathFx: poof,
  },
  bat: {
    mod: bat, name: "夜蝠", hp: 19, speed: 48, dmg: 6, reach: 28, want: 16, windup: 0.26, cd: 1.15,
    xp: 8, barH: 44, w: 12, fly: true, deathFx: poof,
  },
  wisp: {
    mod: wisp, name: "鬼火", hp: 23, speed: 20, dmg: 7, reach: 105, want: 78, windup: 0.68, cd: 2.4,
    xp: 12, barH: 58, w: 13, fly: true, ranged: true, shot: { speed: 82, r: 5, color: "#7cf0d8", palette: ["#061a1f", "#0d3b3f", "#14707e", "#1fa8a8", "#4fe0c8", "#a8fff0", "#ffffff"] }, deathFx: poof,
  },
  ghost: {
    mod: ghost, name: "游魂", hp: 40, speed: 18, dmg: 10, reach: 34, want: 20, windup: 0.5, cd: 2.1,
    xp: 15, barH: 52, w: 15, fly: true, deathFx: poof,
  },
  eyeball: {
    mod: eyeball, name: "窥视者", hp: 27, speed: 14, dmg: 8, reach: 125, want: 92, windup: 0.82, cd: 2.9,
    xp: 14, barH: 64, w: 14, fly: true, ranged: true, shot: { speed: 92, r: 5, color: "#ff6a7a", palette: ["#1a0410", "#4a1020", "#8a1830", "#c9264a", "#f2526a", "#ff9aa2", "#ffe0e2"] }, deathFx: poof,
  },
  "flying-skull": {
    mod: flyingSkull, name: "焚颅", hp: 46, speed: 27, dmg: 11, reach: 34, want: 21, windup: 0.54, cd: 1.85,
    xp: 18, barH: 70, w: 17, fly: true, deathFx: poof,
  },
  boss: {
    mod: null, name: "冥河守卫", hp: 360, speed: 23, dmg: 15, reach: 40, want: 27, windup: 0.8, cd: 2.1,
    xp: 120, barH: 0, w: 30, fly: false, boss: true, deathFx: shatterDeath, look: "styx-warden",
  },
};

/** loot table: chance, kind, effect */
export const LOOT = [
  { p: 0.12, kind: "heart", mod: heartPickup, label: "生命 +18", color: "#ff7a8a" },
  { p: 0.13, kind: "potion", mod: potionPickup, label: "法力 +24", color: "#ff86e6" },
  { p: 0.5, kind: "xp", mod: xpOrb, label: "经验 +8", color: "#c4f060" },
];

export const SKILL_META = [
  { id: "j", key: "J", name: "星刃斩", glyph: "斩", cost: 0, cd: 0.26, tint: "#ffe0a0", glow: "rgba(255, 190, 90, .55)", note: "三段连斩 · 无消耗" },
  { id: "k", key: "K", name: "烈焰术", glyph: "火", cost: 10, cd: 1.1, tint: "#ffb05a", glow: "rgba(255, 120, 40, .6)", note: "火球 · 爆炸灼烧" },
  { id: "l", key: "L", name: "霜环", glyph: "霜", cost: 18, cd: 5.0, tint: "#b8ecff", glow: "rgba(120, 210, 255, .6)", note: "身周冰环 · 冻结" },
  { id: "u", key: "U", name: "雷罚", glyph: "雷", cost: 22, cd: 6.0, tint: "#d8c8ff", glow: "rgba(170, 140, 255, .65)", note: "落雷 · 眩晕" },
  { id: "i", key: "I", name: "圣愈", glyph: "愈", cost: 26, cd: 11.0, tint: "#c8ffb0", glow: "rgba(150, 240, 120, .55)", note: "治疗 · 护盾" },
  { id: "o", key: "O", name: "陨星", glyph: "陨", cost: 40, cd: 15.0, tint: "#ffcf6a", glow: "rgba(255, 160, 50, .8)", note: "三重陨石 · 大范围" },
];
