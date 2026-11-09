import { effects as PIXELFX_EFFECTS } from "../../../pixelfx/src/fx/index.js";
import { localizeFxSkill } from "../skill-i18n.js";

const SPELL_CATEGORIES = new Set(["moves", "melee", "thrown", "projectiles", "fire", "water", "ice", "lightning", "arcane", "holy", "shadow", "nature", "ninjutsu", "senjutsu", "dragonball", "fanren", "kami", "konosuba", "miku", "dnf"]);
const SPELL_SKIP = new Set(["fire/brazier", "fire/campfire", "fire/candle", "fire/torch"]);
const categoryOf = (id) => id.split("/")[0];

export const iconOf = (cat) => ({
  fire: "fire", water: "frost", ice: "frost", lightning: "bolt", arcane: "burst", holy: "mend", shadow: "burst", nature: "frost",
  ninjutsu: "bolt", senjutsu: "mend", dragonball: "burst", fanren: "bolt", kami: "bolt", konosuba: "meteor", miku: "burst", dnf: "slash",
  melee: "slash", thrown: "meteor", projectiles: "bolt", moves: "slash",
}[cat] ?? "burst");

export const ATTR_FROM_CATEGORY = {
  fire: "fire", water: "frost", ice: "frost", nature: "frost",
  lightning: "bolt", ninjutsu: "bolt", fanren: "bolt", kami: "bolt", projectiles: "bolt",
  holy: "mend", senjutsu: "mend",
  konosuba: "meteor", thrown: "meteor",
  melee: "slash", moves: "slash",
  arcane: "burst", shadow: "burst", dragonball: "burst", miku: "burst", dnf: "slash",
};

export function buildFxSpellMeta() {
  return Object.entries(PIXELFX_EFFECTS)
    .filter(([id, mod]) => SPELL_CATEGORIES.has(categoryOf(id)) && !SPELL_SKIP.has(id) && (mod?.draw || mod?.create)
      && !(categoryOf(id) === "dnf" && mod.meta.tags.some(tag => ["weapon", "character"].includes(tag))))
    .map(([fxPath, mod], i) => {
      const cat = categoryOf(fxPath), duration = Number(mod.meta.duration ?? 1), loop = !!mod.meta.loop;
      const power = Math.round(14 + Math.min(46, duration * 8) + (mod.meta.actor ? 6 : 0));
      const labels = localizeFxSkill(fxPath, mod.meta.name);
      return {
        id: `fx:${fxPath}`, key: `F${i + 1}`, ...labels,
        icon: iconOf(cat), glyph: cat === "fire" ? "火" : cat === "ice" ? "霜" : cat === "lightning" ? "雷" : "✦",
        cost: loop ? 8 : Math.min(48, Math.round(6 + duration * 4)), cd: loop ? 4.5 : Math.min(18, Math.max(1.4, Number((duration * 1.25).toFixed(1)))), tint: cat === "fire" ? "#ff9a4a" : cat === "ice" ? "#9fe8ff" : cat === "lightning" ? "#c8a8ff" : "#f0cfff",
        glow: "rgba(180, 140, 255, .55)", note: `${cat} · ${fxPath}`, fxPath, module: mod, category: cat, power,
        ...(cat === "dnf" ? { theme: "dnf", tags: ["dnf"] } : {}),
      };
    });
}
