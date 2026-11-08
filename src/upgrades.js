/** Permanent camp upgrades bought with Embers (余烬). Strictly data + pure helpers. */

export const UPGRADE_STATS = [
  {
    id: "vitality", icon: "♥", max: 5, base: 30, step: 20, per: 14,
    name: { zh: "体魄", en: "Vitality", ja: "体魄" },
    desc: { zh: "每级 +14 最大生命", en: "+14 max HP per rank", ja: "1段階ごとに最大HP +14" },
  },
  {
    id: "spirit", icon: "✧", max: 5, base: 30, step: 20, per: 10,
    name: { zh: "灵脉", en: "Spirit", ja: "霊脈" },
    desc: { zh: "每级 +10 最大法力", en: "+10 max MP per rank", ja: "1段階ごとに最大MP +10" },
  },
  {
    id: "might", icon: "⚔", max: 5, base: 40, step: 25, per: 6,
    name: { zh: "锋锐", en: "Might", ja: "鋭鋒" },
    desc: { zh: "每级 +6% 伤害", en: "+6% damage per rank", ja: "1段階ごとに与ダメージ +6%" },
  },
  {
    id: "haste", icon: "➶", max: 4, base: 35, step: 22, per: 2,
    name: { zh: "疾行", en: "Haste", ja: "疾走" },
    desc: { zh: "每级 +2 移速", en: "+2 move speed per rank", ja: "1段階ごとに移動速度 +2" },
  },
];

export const emberForXp = (xp) => Math.max(1, Math.round((xp ?? 0) / 3));

export function upgradeById(id) {
  return UPGRADE_STATS.find((upgrade) => upgrade.id === id) ?? null;
}

/** Cost of the next rank when the hero already owns `rank` ranks. */
export function upgradeCost(def, rank) {
  return def.base + def.step * rank;
}

export function emptyUpgrades() {
  return Object.fromEntries(UPGRADE_STATS.map((def) => [def.id, 0]));
}

/** Total embers already sunk into the current ranks (used by the respec button). */
export function spentUpgrades(upgrades = {}) {
  let total = 0;
  for (const def of UPGRADE_STATS) {
    const rank = Math.max(0, Math.min(def.max, upgrades[def.id] ?? 0));
    for (let i = 0; i < rank; i++) total += upgradeCost(def, i);
  }
  return total;
}
