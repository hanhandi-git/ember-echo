// Game content barrel: stages, enemies, loot, weapons and the skill catalog.

import { effects as PIXELFX_EFFECTS } from "../../pixelfx/src/fx/index.js";
import { ARMORY as PIXELFX_ARMORY } from "../../pixelfx/src/core/weapons.js";
import { CHARACTERS } from "../../pixelfx/src/core/characters.js";
import { FX } from "./content/fx-registry.js";
import { STAGES, ENEMY_TYPES, LOOT } from "./content/compose-content.js";
import { ATTR_FROM_CATEGORY, buildFxSpellMeta, iconOf } from "./content/spell-catalog.js";
import { CUSTOM_MELEE_FX } from "./fx/custom-melee-arts.js";

import { localizeArmoryWeapon } from "./weapon-i18n.js";

export { STAGES, ENEMY_TYPES, LOOT };
export { STASH_ITEMS, STASH_FX, stashItem, stashLabel } from "./content/stash-catalog.js";

export { FX };

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

export const DEFAULT_MELEE_WEAPON_ID = "ember-blade";
export const DEFAULT_THROWN_WEAPON_ID = "armory:kunai";

const STARTER_WEAPONS = [
  {
    id: "ember-blade", class: "melee", name: "余烬星刃", nameEn: "EMBER BLADE", nameJa: "エンバーブレード", glyph: "刃",
    dmgMul: 1, speed: 64, dashCdMul: 1, rigWeapon: "sword", attack: { kind: "line", range: 58, radius: 11, pierce: false },
    desc: "均衡连斩，第三段扫开身前敌人。", descEn: "Balanced cuts; the finisher sweeps foes.", descJa: "連撃の締めで前方の敵を薙ぎ払う。",
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

// Original DNF-inspired sword archetypes. They share the existing character rig silhouettes,
// while their timing, reach and authored accent FX make them play as separate weapons.
const CUSTOM_MELEE_WEAPONS = [
  {
    id: "ember-greatsword", class: "melee", name: "炎狱巨剑", nameEn: "INFERNO GREATSWORD", nameJa: "インフェルノ大剣", glyph: "巨",
    dmgMul: 1.32, speed: 48, dashCdMul: 1.24, rigWeapon: "totsuka", family: "slam", meleeArtKey: "ember-greatsword",
    attack: { kind: "arc", range: 84, radius: 19, pierce: false }, fxPath: "custom/ember-greatsword", module: CUSTOM_MELEE_FX["ember-greatsword"],
    desc: "蓄力后斩出燃烧巨弧，第三段会把敌人扫开。", descEn: "A charged ember crescent with a sweeping finisher.", descJa: "溜めた炎の大弧で薙ぎ払い、最後は敵を吹き飛ばす。",
  },
  {
    id: "frost-lightsword", class: "melee", name: "冰魄光剑", nameEn: "FROST LIGHTSWORD", nameJa: "フロスト光剣", glyph: "霜",
    dmgMul: 1.06, speed: 78, dashCdMul: 0.9, rigWeapon: "holy-sword", family: "sweep", meleeArtKey: "frost-lightsword",
    attack: { kind: "arc", range: 70, radius: 11, pierce: false }, fxPath: "custom/frost-lightsword", module: CUSTOM_MELEE_FX["frost-lightsword"],
    desc: "轻快的冰蓝连斩，命中后留下碎晶轨迹。", descEn: "Fast ice-blue cuts that shed crystal shards.", descJa: "軽快な氷青の連斬で、命中後に結晶を散らす。",
  },
  {
    id: "shadow-katana", class: "melee", name: "幽影太刀", nameEn: "UMBRAL KATANA", nameJa: "アンブラル太刀", glyph: "影",
    dmgMul: 1.02, speed: 86, dashCdMul: 0.82, rigWeapon: "katana", family: "sweep", meleeArtKey: "shadow-katana",
    attack: { kind: "arc", range: 64, radius: 9, pierce: true, maxHits: 2 }, fxPath: "custom/shadow-katana", module: CUSTOM_MELEE_FX["shadow-katana"],
    desc: "极快的拔刀斩，残影会延迟划过敌阵。", descEn: "A lightning draw cut with delayed shadow afterimages.", descJa: "稲妻の抜刀斬りと、遅れて走る影の残像。",
  },
  {
    id: "thunder-claymore", class: "melee", name: "雷鸣钝剑", nameEn: "THUNDER CLAYMORE", nameJa: "サンダークレイモア", glyph: "雷",
    dmgMul: 1.2, speed: 58, dashCdMul: 1.1, rigWeapon: "sword", family: "sweep", meleeArtKey: "thunder-claymore",
    attack: { kind: "arc", range: 78, radius: 16, pierce: true, maxHits: 2 }, fxPath: "custom/thunder-claymore", module: CUSTOM_MELEE_FX["thunder-claymore"],
    desc: "厚重剑身卷起电弧，命中多个目标时更有压迫感。", descEn: "A broad storm blade that chains through nearby foes.", descJa: "厚い刃が電弧をまとい、近くの敵を巻き込む。",
  },
  {
    id: "starlight-rapier", class: "melee", name: "星辉短剑", nameEn: "STARLIGHT RAPIER", nameJa: "スターライトレイピア", glyph: "星",
    dmgMul: 0.98, speed: 84, dashCdMul: 0.78, rigWeapon: "rapier", family: "thrust", meleeArtKey: "starlight-rapier",
    attack: { kind: "thrust", range: 76, radius: 7, pierce: true, maxHits: 3 }, fxPath: "custom/starlight-rapier", module: CUSTOM_MELEE_FX["starlight-rapier"],
    desc: "精准突刺贯穿一列敌人，收招化作星芒。", descEn: "A precise piercing thrust that blooms into a star point.", descJa: "一列を貫く精密な突きが、星の閃光に弾ける。",
  },
];

export const WEAPONS = [
  ...STARTER_WEAPONS,
  ...CUSTOM_MELEE_WEAPONS,
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
  { id: "j", key: "J", name: "星刃斩", nameEn: "Slash", nameJa: "星刃斬", icon: "slash", glyph: "斩", cost: 0, cd: 0.26, tint: "#ffe0a0", glow: "rgba(255, 190, 90, .55)", note: "按住三连斩 · 闪避接重斩", noteEn: "Hold to combo · slash after dodge", noteJa: "長押しで三連斬・回避から強斬撃" },
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
