// Long-term collectibles (pixelfx eastern pickups) — inventory only, not combat consumables.

import * as spiritStone from "../../../pixelfx/src/fx/pickups/spirit-stone.js";
import * as jadeSlip from "../../../pixelfx/src/fx/pickups/jade-slip.js";
import * as goldIngot from "../../../pixelfx/src/fx/pickups/gold-ingot.js";
import * as cashCoin from "../../../pixelfx/src/fx/pickups/cash-coin.js";
import * as gemSpin from "../../../pixelfx/src/fx/pickups/gem-spin.js";
import * as crystalShard from "../../../pixelfx/src/fx/pickups/crystal-shard.js";
import * as dragonPearl from "../../../pixelfx/src/fx/pickups/dragon-pearl.js";
import * as jadePendant from "../../../pixelfx/src/fx/pickups/jade-pendant.js";
import * as paperTalisman from "../../../pixelfx/src/fx/pickups/paper-talisman.js";
import * as elixirGourd from "../../../pixelfx/src/fx/pickups/elixir-gourd.js";
import * as powerStar from "../../../pixelfx/src/fx/pickups/power-star.js";
import * as keyGlint from "../../../pixelfx/src/fx/pickups/key-glint.js";
import * as lotusLamp from "../../../pixelfx/src/fx/pickups/lotus-lamp.js";
import * as flyingSword from "../../../pixelfx/src/fx/pickups/flying-sword.js";
import * as spiritButterfly from "../../../pixelfx/src/fx/pickups/spirit-butterfly.js";
import * as immortalFan from "../../../pixelfx/src/fx/pickups/immortal-fan.js";
import * as paperLantern from "../../../pixelfx/src/fx/pickups/paper-lantern.js";

export const STASH_FX = {
  "spirit-stone": spiritStone,
  "jade-slip": jadeSlip,
  "gold-ingot": goldIngot,
  "cash-coin": cashCoin,
  "gem-spin": gemSpin,
  "crystal-shard": crystalShard,
  "dragon-pearl": dragonPearl,
  "jade-pendant": jadePendant,
  "paper-talisman": paperTalisman,
  "elixir-gourd": elixirGourd,
  "power-star": powerStar,
  "key-glint": keyGlint,
  "lotus-lamp": lotusLamp,
  "flying-sword": flyingSword,
  "spirit-butterfly": spiritButterfly,
  "immortal-fan": immortalFan,
  "paper-lantern": paperLantern,
};

/** @type {{ id: string, nameEn: string, name: string, nameJa: string }[]} */
export const STASH_ITEMS = [
  { id: "spirit-stone", nameEn: "Spirit stone", name: "灵石", nameJa: "霊石" },
  { id: "jade-slip", nameEn: "Jade slip", name: "玉简", nameJa: "玉簡" },
  { id: "gold-ingot", nameEn: "Gold ingot", name: "金锭", nameJa: "金塊" },
  { id: "cash-coin", nameEn: "Cash coin", name: "铜钱", nameJa: "銅銭" },
  { id: "gem-spin", nameEn: "Gem", name: "宝石", nameJa: "宝石" },
  { id: "crystal-shard", nameEn: "Crystal shard", name: "水晶碎片", nameJa: "水晶の欠片" },
  { id: "dragon-pearl", nameEn: "Dragon pearl", name: "龙珠", nameJa: "龍珠" },
  { id: "jade-pendant", nameEn: "Jade pendant", name: "玉佩", nameJa: "玉佩" },
  { id: "paper-talisman", nameEn: "Paper talisman", name: "符纸", nameJa: "護符" },
  { id: "elixir-gourd", nameEn: "Elixir gourd", name: "葫芦", nameJa: "瓠" },
  { id: "power-star", nameEn: "Power star", name: "星芒", nameJa: "星芒" },
  { id: "key-glint", nameEn: "Ancient key", name: "古钥", nameJa: "古い鍵" },
  { id: "lotus-lamp", nameEn: "Lotus lamp", name: "莲灯", nameJa: "蓮灯" },
  { id: "flying-sword", nameEn: "Flying sword", name: "飞剑", nameJa: "飛剣" },
  { id: "spirit-butterfly", nameEn: "Spirit butterfly", name: "灵蝶", nameJa: "霊蝶" },
  { id: "immortal-fan", nameEn: "Immortal fan", name: "仙扇", nameJa: "仙扇" },
  { id: "paper-lantern", nameEn: "Paper lantern", name: "纸灯笼", nameJa: "提灯" },
];

export function stashItem(id) {
  return STASH_ITEMS.find((item) => item.id === id);
}

export function stashLabel(g, item) {
  if (!item) return "";
  const lang = g?.language ?? "zh";
  if (lang === "zh") return item.name;
  if (lang === "ja") return item.nameJa;
  return item.nameEn;
}
