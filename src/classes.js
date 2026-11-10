// Stable job IDs and skill ownership are shared by UI, saves, and the cast boundary.
export const HERO_CLASSES = [
  { id: "swordsman", name: { zh: "剑士", en: "Swordsman", ja: "剣士" }, desc: { zh: "三段连斩 · 剑技 · 近身突进", en: "Blade combos · sword arts · close combat", ja: "三連斬・剣技・近接戦闘" }, look: "dnf-blade-master" },
  { id: "mage", name: { zh: "法师", en: "Mage", ja: "魔法使い" }, desc: { zh: "魔弹普攻 · 元素法术 · 远程控场", en: "Magic bolts · elements · ranged control", ja: "魔弾・元素魔法・遠距離制御" }, look: "dnf-elementalist" },
];
export const classOf = (id) => HERO_CLASSES.find((job) => job.id === id) ?? HERO_CLASSES[0];
export const classLabel = (id, language = "zh") => classOf(id).name[language] ?? classOf(id).name.en;
export const DEFAULT_CLASS_SLOTS = {
  swordsman: ["j", "sword:cleave", "sword:rush", "sword:rise", "sword:guard", "sword:awakening", "t"],
  mage: ["mage:bolt", "k", "l", "u", "i", "o", "e"],
};

export function skillClass(skill) {
  if (skill.classId) return skill.classId;
  if (["j", "t"].includes(skill.id)) return "swordsman";
  if (skill.id?.startsWith("sword:")) return "swordsman";
  if (!skill.category) return "mage";
  return ["melee", "moves", "thrown", "dnf"].includes(skill.category) ? "swordsman" : "mage";
}

export const canUseSkill = (classId, skill) => !!skill && skillClass(skill) === classOf(classId).id;

export function normalizeClassSlots(classId, slots, catalog) {
  const defaults = DEFAULT_CLASS_SLOTS[classOf(classId).id];
  return defaults.map((fallback, i) => {
    const id = slots?.[i];
    return canUseSkill(classId, catalog.find((skill) => skill.id === id)) ? id : fallback;
  });
}
