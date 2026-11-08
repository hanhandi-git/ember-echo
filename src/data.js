// Game content barrel: stages, enemies, loot, weapons and the skill catalog.

import { effects as PIXELFX_EFFECTS } from "../../pixelfx/src/fx/index.js";
import { ARMORY as PIXELFX_ARMORY } from "../../pixelfx/src/core/weapons.js";
import { CHARACTERS } from "../../pixelfx/src/core/characters.js";
import { FX, MAPS, CRITTER_MODS, PICKUP_MODS } from "./content/fx-registry.js";
import { buildGoblinEnemyTypes } from "./content/mob-catalog.js";
import { ATTR_FROM_CATEGORY, buildFxSpellMeta, iconOf } from "./content/spell-catalog.js";
import { localizeArmoryWeapon } from "./weapon-i18n.js";
export { STASH_ITEMS, STASH_FX, stashItem, stashLabel } from "./content/stash-catalog.js";

export { FX };

const {
  mapMossy, mapMarsh, mapEmber, mapAurora, mapCrystal, mapInkbound, mapSunscar,
} = MAPS;
const {
  slime, snake, frog, bat, wisp, ghost, eyeball, flyingSkull,
} = CRITTER_MODS;
const { heartPickup, potionPickup, xpOrb, poof, shatterDeath } = PICKUP_MODS;

export const HERO_LOOK_DEFAULT = "ember-duelist";
export const HERO_LOOK = HERO_LOOK_DEFAULT;
export const BOSS_LOOK = "styx-warden";

const HERO_LOOK_BLOCK = new Set(["dummy", "styx-warden"]);
const HERO_LOOK_PRIORITY = ["ember-duelist", "naruto", "sasuke", "moon-oracle", "laurel-ranger"];
export const HERO_LOOKS = [...CHARACTERS.filter((c) => !HERO_LOOK_BLOCK.has(c.id))].sort((a, b) => {
  const pa = HERO_LOOK_PRIORITY.indexOf(a.id), pb = HERO_LOOK_PRIORITY.indexOf(b.id);
  const ra = pa === -1 ? 99 : pa, rb = pb === -1 ? 99 : pb;
  return ra - rb || a.label.localeCompare(b.label, "zh");
});

export function loadHeroLook() {
  if (typeof localStorage === "undefined") return HERO_LOOK_DEFAULT;
  const saved = localStorage.getItem("ember-echo-look");
  return HERO_LOOKS.some((c) => c.id === saved) ? saved : HERO_LOOK_DEFAULT;
}

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
        { type: "goblin-warrior", x: 118, y: 158 },
        { type: "goblin-agile", x: 192, y: 150 },
        { type: "slime", x: 262, y: 158 },
        { type: "goblin-warrior", x: 332, y: 146 },
      ],
      [
        { type: "goblin-agile", x: 126, y: 160 },
        { type: "goblin-warrior", x: 214, y: 146 },
        { type: "goblin-giant", x: 302, y: 158 },
        { type: "snake", x: 402, y: 150 },
        { type: "goblin-agile", x: 462, y: 156 },
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
        { type: "goblin-archer", x: 118, y: 150 },
        { type: "bat", x: 208, y: 142 },
        { type: "goblin-mage", x: 278, y: 156 },
      ],
      [
        { type: "ghost", x: 122, y: 154 },
        { type: "goblin-archer", x: 198, y: 140 },
        { type: "goblin-mage", x: 268, y: 160 },
        { type: "wisp", x: 348, y: 150 },
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
  ...buildGoblinEnemyTypes({ poof, goblinHit: FX.goblinHit, goblinDeath: FX.goblinDeath }),
  boss: {
    mod: null, name: "冥河守卫", nameEn: "THE WARDEN", hp: 360, speed: 23, dmg: 15, reach: 40, want: 27, windup: 0.8, cd: 2.1,
    xp: 120, barH: 0, w: 30, fly: false, boss: true, deathFx: shatterDeath, look: "styx-warden",
  },
};

export const LOOT = [
  { p: 0.12, kind: "heart", mod: heartPickup, label: "HP +18", color: "#ff7a8a" },
  { p: 0.13, kind: "potion", mod: potionPickup, label: "MP +24", color: "#ff86e6" },
  { p: 0.5, kind: "xp", mod: xpOrb, label: "XP +8", color: "#c4f060" },
];

export const DEFAULT_MELEE_WEAPON_ID = "ember-blade";
export const DEFAULT_THROWN_WEAPON_ID = "armory:kunai";

const STARTER_WEAPONS = [
  {
    id: "ember-blade", class: "melee", name: "余烬星刃", nameEn: "EMBER BLADE", nameJa: "エンバーブレード", glyph: "刃",
    dmgMul: 1, speed: 64, dashCdMul: 1, rigWeapon: "sword", attack: { kind: "line", range: 58, radius: 11, pierce: false },
    desc: "均衡的连斩与法术。", descEn: "Balanced slashes and spells.", descJa: "斬撃と術のバランス型。",
  },
  {
    id: "moon-scythe", class: "melee", name: "月蚀镰", nameEn: "MOON SCYTHE", nameJa: "ムーンサイズ", glyph: "镰",
    dmgMul: 1.18, speed: 55, dashCdMul: 1.12, rigWeapon: "scythe", attack: { kind: "arc", range: 72, radius: 15, pierce: false },
    desc: "重击更痛，脚步更沉。", descEn: "Heavy hits, slower footwork.", descJa: "重い一撃、足は少し遅い。",
  },
  {
    id: "storm-fang", class: "melee", name: "风暴牙", nameEn: "STORM FANG", nameJa: "ストームファング", glyph: "牙",
    dmgMul: 0.9, speed: 78, dashCdMul: 0.78, rigWeapon: "claw", attack: { kind: "line", range: 42, radius: 9, pierce: false },
    desc: "快速位移，轻盈连段。", descEn: "Fast repositioning, light combos.", descJa: "素早い位移と軽い連撃。",
  },
];

export const WEAPONS = [
  ...STARTER_WEAPONS,
  ...PIXELFX_ARMORY.map((w) => {
    const labels = localizeArmoryWeapon(w);
    return {
      id: `armory:${w.id}`, ...labels, glyph: w.class === "melee" ? "⚔" : "✦",
      dmgMul: 0.88 + Math.min(0.34, (w.tip ?? 20) / 180), speed: w.family === "thrust" ? 72 : w.family === "slam" ? 48 : 62,
      dashCdMul: w.family === "thrust" ? 0.82 : w.family === "slam" ? 1.24 : 1,
      rigWeapon: w.id,
      attack: { kind: w.family === "thrust" ? "line" : w.family === "sweep" ? "arc" : w.family === "slam" ? "line" : "projectile", range: w.tip > 45 ? 86 : w.tip > 32 ? 70 : 54, radius: w.family === "slam" ? 18 : w.family === "thrust" ? 7 : 11, pierce: ["spear", "lance", "totsuka", "flying-sword", "pear-needles"].includes(w.id), maxHits: ["spear", "lance", "totsuka", "flying-sword", "pear-needles"].includes(w.id) ? 4 : 1 },
      fxPath: w.fx, module: PIXELFX_EFFECTS[w.fx], class: w.class, family: w.family,
      desc: labels.name, descEn: labels.nameEn, descJa: labels.nameJa,
    };
  }),
];

export const SKILL_ATTR_ORDER = ["slash", "fire", "frost", "bolt", "mend", "meteor", "burst"];

export const SKILL_ATTR_LABELS = {
  slash: { zh: "斩击", en: "Slash", ja: "斬撃" },
  fire: { zh: "烈焰", en: "Fire", ja: "炎" },
  frost: { zh: "冰霜", en: "Frost", ja: "氷" },
  bolt: { zh: "雷霆", en: "Lightning", ja: "雷" },
  mend: { zh: "治愈", en: "Holy", ja: "癒" },
  meteor: { zh: "陨落", en: "Meteor", ja: "隕" },
  burst: { zh: "奥术", en: "Arcane", ja: "術" },
};

export function skillAttr(skill) {
  return skill.attr ?? ATTR_FROM_CATEGORY[skill.category] ?? skill.icon ?? "burst";
}

const BASE_SKILL_META = [
  { id: "j", key: "J", name: "星刃斩", nameEn: "Slash", nameJa: "星刃斬", icon: "slash", glyph: "斩", cost: 0, cd: 0.26, tint: "#ffe0a0", glow: "rgba(255, 190, 90, .55)", note: "三段连斩 · 无消耗", noteEn: "Triple slash · free", noteJa: "三段斬り・無消費" },
  { id: "k", key: "K", name: "烈焰术", nameEn: "Fire", nameJa: "烈焰術", icon: "fire", glyph: "火", cost: 10, cd: 1.1, tint: "#ffb05a", glow: "rgba(255, 120, 40, .6)", note: "火球 · 爆炸灼烧", noteEn: "Fireball · burn", noteJa: "火球・燃焼" },
  { id: "l", key: "L", name: "霜环", nameEn: "Frost", nameJa: "霜環", icon: "frost", glyph: "霜", cost: 18, cd: 5.0, tint: "#b8ecff", glow: "rgba(120, 210, 255, .6)", note: "身周冰环 · 冻结", noteEn: "Frost ring · freeze", noteJa: "氷環・凍結" },
  { id: "u", key: "U", name: "雷罚", nameEn: "Bolt", nameJa: "雷罰", icon: "bolt", glyph: "雷", cost: 22, cd: 6.0, tint: "#d8c8ff", glow: "rgba(170, 140, 255, .65)", note: "落雷 · 眩晕", noteEn: "Lightning · stun", noteJa: "落雷・スタン" },
  { id: "i", key: "I", name: "圣愈", nameEn: "Mend", nameJa: "聖癒", icon: "mend", glyph: "愈", cost: 26, cd: 11.0, tint: "#c8ffb0", glow: "rgba(150, 240, 120, .55)", note: "治疗 · 护盾", noteEn: "Heal · shield", noteJa: "回復・盾" },
  { id: "o", key: "O", name: "陨星", nameEn: "Meteor", nameJa: "隕星", icon: "meteor", glyph: "陨", cost: 40, cd: 15.0, tint: "#ffcf6a", glow: "rgba(255, 160, 50, .8)", note: "三重陨石 · 大范围", noteEn: "Triple meteor · AoE", noteJa: "三連隕石・広範囲" },
  { id: "e", key: "E", name: "魂爆", nameEn: "Soul burst", nameJa: "魂爆", icon: "burst", glyph: "爆", cost: 16, cd: 4.5, tint: "#f0a8ff", glow: "rgba(220, 130, 255, .65)", note: "近身爆裂 · 击退", noteEn: "Point-blank burst", noteJa: "近距離爆発" },
  { id: "t", key: "T", name: "投掷", nameEn: "Throw", nameJa: "投擲", icon: "meteor", glyph: "投", cost: 4, cd: 0.95, tint: "#9fd4ff", glow: "rgba(120, 180, 255, .55)", note: "使用已装备的投掷武器", noteEn: "Uses equipped thrown weapon", noteJa: "装備した投擲武器を使う", attr: "meteor" },
];

const spellMeta = buildFxSpellMeta();

export const SKILL_META = [
  ...BASE_SKILL_META.map((s) => ({ ...s, attr: s.icon })),
  ...spellMeta.map((s) => ({ ...s, attr: ATTR_FROM_CATEGORY[s.category] ?? iconOf(s.category) })),
];

export const DEFAULT_SKILL_SLOTS = ["j", "k", "l", "u", "i", "o", "t"];

export const MELEE_WEAPONS = WEAPONS.filter((w) => w.class !== "thrown");
export const THROWN_WEAPONS = WEAPONS.filter((w) => w.class === "thrown");
