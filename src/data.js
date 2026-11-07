// Every art asset the demo uses comes from the pixelfx library next door — maps, critters, spell
// effects, impacts and pickups. This file is the one place that knows where they live.

import * as mapMossy from "../../pixelfx/src/fx/world/mossy-ruins.js";
import * as mapMarsh from "../../pixelfx/src/fx/world/wisp-marsh.js";
import * as mapEmber from "../../pixelfx/src/fx/world/ember-depths.js";
import * as mapAurora from "../../pixelfx/src/fx/world/aurora-pass.js";
import * as mapCrystal from "../../pixelfx/src/fx/world/crystal-hollow.js";
import * as mapInkbound from "../../pixelfx/src/fx/world/inkbound-shrine.js";
import * as mapSunscar from "../../pixelfx/src/fx/world/sunscar-temple.js";

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
import * as stagePortal from "./fx/stage-portal.js";
import { effects as PIXELFX_EFFECTS } from "../../pixelfx/src/fx/index.js";
import { ARMORY as PIXELFX_ARMORY } from "../../pixelfx/src/core/weapons.js";

export const FX = {
  swordSlash, doubleSlash, heavyCleave, scytheReap, fireball, meteor, frostNova,
  lightningStrike, thunderclap, healAoe, blessing, divineShield,
  hitSpark, critHit, smallExplosion, poof, shatterDeath, spawnPortal, levelUp,
  runeCircle, manaBurst, frozen, burning, stunned, plasmaShot,
  heartPickup, potionPickup, xpOrb, collectBurst,
  stagePortal,
};

const SPELL_CATEGORIES = new Set(["moves", "melee", "thrown", "projectiles", "fire", "water", "ice", "lightning", "arcane", "holy", "shadow", "nature", "ninjutsu", "senjutsu", "dragonball", "fanren", "kami", "konosuba", "miku"]);
const SPELL_SKIP = new Set(["fire/brazier", "fire/campfire", "fire/candle", "fire/torch"]);
const categoryOf = (id) => id.split("/")[0];
const iconOf = (cat) => ({ fire: "fire", water: "frost", ice: "frost", lightning: "bolt", arcane: "burst", holy: "mend", shadow: "burst", nature: "frost", ninjutsu: "bolt", senjutsu: "mend", dragonball: "burst", fanren: "bolt", kami: "bolt", konosuba: "meteor", miku: "burst", melee: "slash", thrown: "meteor", projectiles: "bolt", moves: "slash" }[cat] ?? "burst");
const spellMeta = Object.entries(PIXELFX_EFFECTS)
  .filter(([id, mod]) => SPELL_CATEGORIES.has(categoryOf(id)) && !SPELL_SKIP.has(id) && (mod?.draw || mod?.create))
  .map(([fxPath, mod], i) => {
    const cat = categoryOf(fxPath), duration = Number(mod.meta.duration ?? 1), loop = !!mod.meta.loop;
    const power = Math.round(14 + Math.min(46, duration * 8) + (mod.meta.actor ? 6 : 0));
    return {
      id: `fx:${fxPath}`, key: `F${i + 1}`, name: mod.meta.name, nameEn: mod.meta.name, nameJa: mod.meta.name,
      icon: iconOf(cat), glyph: cat === "fire" ? "火" : cat === "ice" ? "霜" : cat === "lightning" ? "雷" : "✦",
      cost: loop ? 8 : Math.min(48, Math.round(6 + duration * 4)), cd: loop ? 4.5 : Math.min(18, Math.max(1.4, Number((duration * 1.25).toFixed(1)))), tint: cat === "fire" ? "#ff9a4a" : cat === "ice" ? "#9fe8ff" : cat === "lightning" ? "#c8a8ff" : "#f0cfff",
      glow: "rgba(180, 140, 255, .55)", note: `${cat} · ${fxPath}`, fxPath, module: mod, category: cat, power,
    };
  });

export const HERO_LOOK = "ember-duelist";
export const BOSS_LOOK = "styx-warden";

/** Three acts: a moonlit ruin, a drowned marsh, and the volcano under it. */
const BASE_STAGES = [
  {
    act: "第一幕", name: "苔痕遗迹", sub: "月下的旧圣所", chapter: "I",
    actEn: "STAGE I", nameEn: "MOSSY RUINS", subEn: "THE OLD SANCTUM",
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
      [
        { type: "snake", x: 338, y: 146 },
        { type: "frog", x: 374, y: 160 },
        { type: "slime", x: 416, y: 146 },
        { type: "snake", x: 452, y: 158 },
      ],
    ],
  },
  {
    act: "第二幕", name: "幽火沼泽", sub: "亡者的灯", chapter: "II",
    actEn: "STAGE II", nameEn: "WISP MARSH", subEn: "LANTERNS OF THE DEAD",
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
      [
        { type: "bat", x: 338, y: 142 },
        { type: "ghost", x: 372, y: 158 },
        { type: "wisp", x: 416, y: 146 },
        { type: "bat", x: 454, y: 160 },
      ],
    ],
  },
  {
    act: "第三幕", name: "熔岩深窟", sub: "余烬的源头", chapter: "III",
    actEn: "STAGE III", nameEn: "EMBER DEPTHS", subEn: "THE SOURCE OF ASH",
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
        { type: "eyeball", x: 344, y: 146 },
        { type: "flying-skull", x: 384, y: 158 },
        { type: "bat", x: 426, y: 142 },
        { type: "eyeball", x: 460, y: 154 },
      ],
      [
        { type: "boss", x: 410, y: 152 },
      ],
    ],
  },
];

export const STAGES = [
  ...BASE_STAGES,
  {
    act: "第四幕", name: "极光隘口", sub: "风雪中的回响", chapter: "IV", actEn: "STAGE IV", nameEn: "AURORA PASS", subEn: "THE SKY ROAD", map: mapAurora,
    palette: "#9be8e8", waves: [
      [{ type: "ghost", x: 126, y: 150 }, { type: "bat", x: 224, y: 144 }, { type: "wisp", x: 292, y: 156 }],
      [{ type: "eyeball", x: 152, y: 146 }, { type: "ghost", x: 264, y: 158 }, { type: "bat", x: 344, y: 144 }, { type: "wisp", x: 430, y: 150 }],
      [{ type: "flying-skull", x: 356, y: 148 }, { type: "eyeball", x: 414, y: 154 }, { type: "ghost", x: 458, y: 146 }],
    ],
  },
  {
    act: "第五幕", name: "晶脉空洞", sub: "沉睡的矿脉", chapter: "V", actEn: "STAGE V", nameEn: "CRYSTAL HOLLOW", subEn: "THE SLEEPING VEIN", map: mapCrystal,
    palette: "#9ac8ff", waves: [
      [{ type: "slime", x: 132, y: 150 }, { type: "frog", x: 218, y: 158 }, { type: "snake", x: 286, y: 146 }],
      [{ type: "wisp", x: 168, y: 144 }, { type: "eyeball", x: 274, y: 152 }, { type: "slime", x: 386, y: 158 }, { type: "ghost", x: 448, y: 148 }],
      [{ type: "flying-skull", x: 362, y: 148 }, { type: "eyeball", x: 424, y: 154 }, { type: "wisp", x: 466, y: 146 }],
    ],
  },
  {
    act: "第六幕", name: "墨影神龛", sub: "无名的誓约", chapter: "VI", actEn: "STAGE VI", nameEn: "INKBOUND SHRINE", subEn: "THE UNNAMED OATH", map: mapInkbound,
    palette: "#c5a5ff", waves: [
      [{ type: "snake", x: 118, y: 154 }, { type: "ghost", x: 204, y: 146 }, { type: "wisp", x: 292, y: 158 }],
      [{ type: "bat", x: 150, y: 142 }, { type: "eyeball", x: 246, y: 150 }, { type: "ghost", x: 354, y: 158 }, { type: "wisp", x: 446, y: 148 }],
      [{ type: "flying-skull", x: 352, y: 148 }, { type: "eyeball", x: 418, y: 154 }, { type: "ghost", x: 462, y: 146 }],
    ],
  },
  {
    act: "第七幕", name: "日灼圣殿", sub: "最后的守门人", chapter: "VII", actEn: "STAGE VII", nameEn: "SUNSCAR TEMPLE", subEn: "THE LAST WARDEN", map: mapSunscar,
    palette: "#ffba6a", waves: [
      [{ type: "bat", x: 124, y: 144 }, { type: "eyeball", x: 218, y: 150 }, { type: "flying-skull", x: 298, y: 158 }],
      [{ type: "ghost", x: 168, y: 154 }, { type: "wisp", x: 276, y: 144 }, { type: "eyeball", x: 382, y: 150 }, { type: "bat", x: 458, y: 158 }],
      [{ type: "boss", x: 418, y: 152 }],
    ],
  },
];

/** Enemy archetypes. `mod` is the looping pixel critter; the rest is game design. */
export const ENEMY_TYPES = {
  slime: {
    mod: slime, name: "苔泥", hp: 34, speed: 15, dmg: 8, reach: 30, want: 17, windup: 0.55, cd: 1.9,
    xp: 10, barH: 44, w: 14, scale: 0.58, fly: false, deathFx: poof,
  },
  snake: {
    mod: snake, name: "草蛇", hp: 24, speed: 35, dmg: 7, reach: 32, want: 18, windup: 0.32, cd: 1.35,
    xp: 9, barH: 34, w: 16, scale: 0.58, fly: false, deathFx: poof,
  },
  frog: {
    mod: frog, name: "沼蛙", hp: 32, speed: 22, dmg: 9, reach: 32, want: 18, windup: 0.46, cd: 1.7,
    xp: 12, barH: 36, w: 14, scale: 0.58, fly: false, deathFx: poof,
  },
  bat: {
    mod: bat, name: "夜蝠", hp: 19, speed: 48, dmg: 6, reach: 28, want: 16, windup: 0.26, cd: 1.15,
    xp: 8, barH: 44, w: 12, scale: 0.5, fly: true, deathFx: poof,
  },
  wisp: {
    mod: wisp, name: "鬼火", hp: 23, speed: 20, dmg: 7, reach: 105, want: 78, windup: 0.68, cd: 2.4,
    xp: 12, barH: 58, w: 13, scale: 0.5, fly: true, ranged: true, shot: { speed: 82, r: 5, color: "#7cf0d8", palette: ["#061a1f", "#0d3b3f", "#14707e", "#1fa8a8", "#4fe0c8", "#a8fff0", "#ffffff"] }, deathFx: poof,
  },
  ghost: {
    mod: ghost, name: "游魂", hp: 40, speed: 18, dmg: 10, reach: 34, want: 20, windup: 0.5, cd: 2.1,
    xp: 15, barH: 52, w: 15, scale: 0.5, fly: true, deathFx: poof,
  },
  eyeball: {
    mod: eyeball, name: "窥视者", hp: 27, speed: 14, dmg: 8, reach: 125, want: 92, windup: 0.82, cd: 2.9,
    xp: 14, barH: 64, w: 14, scale: 0.5, fly: true, ranged: true, shot: { speed: 92, r: 5, color: "#ff6a7a", palette: ["#1a0410", "#4a1020", "#8a1830", "#c9264a", "#f2526a", "#ff9aa2", "#ffe0e2"] }, deathFx: poof,
  },
  "flying-skull": {
    mod: flyingSkull, name: "焚颅", hp: 46, speed: 27, dmg: 11, reach: 34, want: 21, windup: 0.54, cd: 1.85,
    xp: 18, barH: 70, w: 17, scale: 0.5, fly: true, deathFx: poof,
  },
  boss: {
    mod: null, name: "冥河守卫", nameEn: "THE WARDEN", hp: 360, speed: 23, dmg: 15, reach: 40, want: 27, windup: 0.8, cd: 2.1,
    xp: 120, barH: 0, w: 30, fly: false, boss: true, deathFx: shatterDeath, look: "styx-warden",
  },
};

/** loot table: chance, kind, effect */
export const LOOT = [
  { p: 0.12, kind: "heart", mod: heartPickup, label: "HP +18", color: "#ff7a8a" },
  { p: 0.13, kind: "potion", mod: potionPickup, label: "MP +24", color: "#ff86e6" },
  { p: 0.5, kind: "xp", mod: xpOrb, label: "XP +8", color: "#c4f060" },
];

// The run starts with three weapons in the satchel. Weapons are deliberately small,
// readable modifiers so swapping gear changes the way the same combat kit feels.
const STARTER_WEAPONS = [
  {
    id: "ember-blade", name: "余烬星刃", nameEn: "EMBER BLADE", nameJa: "エンバーブレード", glyph: "刃",
    dmgMul: 1, speed: 64, dashCdMul: 1, rigWeapon: "sword", attack: { kind: "line", range: 58, radius: 11, pierce: false },
    desc: "均衡的连斩与法术。",
  },
  {
    id: "moon-scythe", name: "月蚀镰", nameEn: "MOON SCYTHE", nameJa: "ムーンサイズ", glyph: "镰",
    dmgMul: 1.18, speed: 55, dashCdMul: 1.12, rigWeapon: "scythe", attack: { kind: "arc", range: 72, radius: 15, pierce: false },
    desc: "重击更痛，脚步更沉。",
  },
  {
    id: "storm-fang", name: "风暴牙", nameEn: "STORM FANG", nameJa: "ストームファング", glyph: "牙",
    dmgMul: 0.9, speed: 78, dashCdMul: 0.78, rigWeapon: "claw", attack: { kind: "line", range: 42, radius: 9, pierce: false },
    desc: "快速位移，轻盈连段。",
  },
];

export const WEAPONS = [
  ...STARTER_WEAPONS,
  ...PIXELFX_ARMORY.map((w, i) => ({
    id: `armory:${w.id}`, name: w.label, nameEn: w.name, nameJa: w.name, glyph: w.class === "melee" ? "⚔" : "✦",
    dmgMul: 0.88 + Math.min(0.34, (w.tip ?? 20) / 180), speed: w.family === "thrust" ? 72 : w.family === "slam" ? 48 : 62,
    dashCdMul: w.family === "thrust" ? 0.82 : w.family === "slam" ? 1.24 : 1,
    rigWeapon: w.id === "sword" ? "sword" : w.id === "dagger" ? "dagger" : w.id === "staff" ? "staff" : w.id === "spear" ? "spear" : w.id === "lance" ? "lance" : w.id === "holy-sword" ? "holy-sword" : w.id === "katana" ? "katana" : w.id === "kusanagi" ? "kusanagi" : w.id === "totsuka" ? "totsuka" : w.id === "war-mace" ? "war-mace" : w.id === "rapier" ? "rapier" : w.id === "kunai" ? "kunai" : w.id === "powder-bomb" ? "powder-bomb" : w.id === "boomerang" ? "boomerang" : w.id === "talisman" ? "talisman" : w.id === "flying-sword" ? "flying-sword" : w.id === "binding-silk" ? "binding-silk" : w.id === "soul-bell" ? "soul-bell" : w.id === "pear-needles" ? "pear-needles" : "handle",
    attack: { kind: w.family === "thrust" ? "line" : w.family === "sweep" ? "arc" : w.family === "slam" ? "line" : "projectile", range: w.tip > 45 ? 86 : w.tip > 32 ? 70 : 54, radius: w.family === "slam" ? 18 : w.family === "thrust" ? 7 : 11, pierce: ["spear", "lance", "totsuka", "flying-sword", "pear-needles"].includes(w.id), maxHits: ["spear", "lance", "totsuka", "flying-sword", "pear-needles"].includes(w.id) ? 4 : 1 },
    fxPath: w.fx, module: PIXELFX_EFFECTS[w.fx], class: w.class, family: w.family, desc: w.label,
  })),
];

const BASE_SKILL_META = [
  { id: "j", key: "J", name: "星刃斩", nameEn: "SLASH", nameJa: "スラッシュ", icon: "slash", glyph: "斩", cost: 0, cd: 0.26, tint: "#ffe0a0", glow: "rgba(255, 190, 90, .55)", note: "三段连斩 · 无消耗" },
  { id: "k", key: "K", name: "烈焰术", nameEn: "FIRE", nameJa: "ファイア", icon: "fire", glyph: "火", cost: 10, cd: 1.1, tint: "#ffb05a", glow: "rgba(255, 120, 40, .6)", note: "火球 · 爆炸灼烧" },
  { id: "l", key: "L", name: "霜环", nameEn: "FROST", nameJa: "フロスト", icon: "frost", glyph: "霜", cost: 18, cd: 5.0, tint: "#b8ecff", glow: "rgba(120, 210, 255, .6)", note: "身周冰环 · 冻结" },
  { id: "u", key: "U", name: "雷罚", nameEn: "BOLT", nameJa: "ボルト", icon: "bolt", glyph: "雷", cost: 22, cd: 6.0, tint: "#d8c8ff", glow: "rgba(170, 140, 255, .65)", note: "落雷 · 眩晕" },
  { id: "i", key: "I", name: "圣愈", nameEn: "MEND", nameJa: "メンド", icon: "mend", glyph: "愈", cost: 26, cd: 11.0, tint: "#c8ffb0", glow: "rgba(150, 240, 120, .55)", note: "治疗 · 护盾" },
  { id: "o", key: "O", name: "陨星", nameEn: "METEOR", nameJa: "メテオ", icon: "meteor", glyph: "陨", cost: 40, cd: 15.0, tint: "#ffcf6a", glow: "rgba(255, 160, 50, .8)", note: "三重陨石 · 大范围" },
  { id: "e", key: "E", name: "魂爆", nameEn: "SOUL BURST", nameJa: "ソウルバースト", icon: "burst", glyph: "爆", cost: 16, cd: 4.5, tint: "#f0a8ff", glow: "rgba(220, 130, 255, .65)", note: "近身爆裂 · 击退" },
];

export const SKILL_META = [...BASE_SKILL_META, ...spellMeta];

export const DEFAULT_SKILL_SLOTS = ["j", "k", "l", "u", "i", "o"];
