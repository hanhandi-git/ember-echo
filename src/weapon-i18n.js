/** Localized display names for starter + pixelfx armory weapons (zh / en / ja). */

const ARMORY_JA = {
  sword: "長剣",
  dagger: "短剣",
  staff: "金箍棒",
  spear: "槍",
  lance: "騎士槍",
  "holy-sword": "聖剣",
  katana: "太刀",
  kusanagi: "草薙剣",
  totsuka: "十拳剣",
  "war-mace": "戦槌",
  rapier: "レイピア",
  kunai: "クナイ",
  "powder-bomb": "火薬弾",
  boomerang: "ブーメラン",
  talisman: "霊符",
  "flying-sword": "飛剣",
  "binding-silk": "縛仙綾",
  "soul-bell": "鎮魂鈴",
  "pear-needles": "梨花針",
  "blood-butterfly": "血蝶",
  "ghost-blade": "幽霊刃",
  "demon-eye-greatsword": "魔眼大剣",
  "skyvault-greatsword": "天穹大剣",
  "aurora-lightblade": "極光剣",
  "dragon-scale-sabre": "竜鱗刀",
};

const JA_WORDS = {
  banded: "金環", staff: "棍", holy: "聖", knight: "騎士", lance: "槍", war: "戦",
  mace: "槌", powder: "火薬", bomb: "弾", binding: "縛", silk: "綾", soul: "魂",
  bell: "鈴", pear: "梨", blossom: "花", needles: "針", flying: "飛", sword: "剣",
};

function tokenize(nameEn) {
  return String(nameEn)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean);
}

function jaFromEnglish(nameEn, weaponId) {
  if (ARMORY_JA[weaponId]) return ARMORY_JA[weaponId];
  const words = tokenize(nameEn);
  const parts = words.map((w) => JA_WORDS[w] ?? null);
  if (parts.every(Boolean)) return parts.join("");
  const hit = parts.filter(Boolean);
  if (hit.length >= Math.max(1, Math.ceil(words.length * 0.5))) return hit.join("·");
  return nameEn;
}

/** Names for one pixelfx ARMORY row (`label` = zh, `name` = en). */
export function localizeArmoryWeapon(entry) {
  const nameEn = String(entry.name ?? "").trim() || entry.id;
  const name = String(entry.label ?? nameEn).trim();
  return {
    name,
    nameEn,
    nameJa: jaFromEnglish(nameEn, entry.id),
  };
}
