/**
 * Loads stage waves and enemy tuning from JSON config, then wires pixelfx modules.
 * Edit `stages.config.json` (关卡 / 波次 / 刷怪坐标) and `enemies.config.json` (数值).
 */

import stagesConfig from "./stages.config.json" with { type: "json" };
import enemiesConfig from "./enemies.config.json" with { type: "json" };
import pickupsConfig from "./pickups.config.json" with { type: "json" };
import { FX, MAPS, CRITTER_MODS, PICKUP_MODS } from "./fx-registry.js";
import { buildGoblinEnemyTypes } from "./mob-catalog.js";

const MAP_BY_KEY = {
  mossy: MAPS.mapMossy,
  marsh: MAPS.mapMarsh,
  ember: MAPS.mapEmber,
  aurora: MAPS.mapAurora,
  crystal: MAPS.mapCrystal,
  inkbound: MAPS.mapInkbound,
  sunscar: MAPS.mapSunscar,
};

const DEATH_FX = {
  poof: PICKUP_MODS.poof,
  shatterDeath: PICKUP_MODS.shatterDeath,
};

const PICKUP_BY_KEY = {
  heart: PICKUP_MODS.heartPickup,
  potion: PICKUP_MODS.potionPickup,
  xp: PICKUP_MODS.xpOrb,
};

const MOB_STAT_KEYS = new Set(["hp", "attack", "defense", "speed", "reach", "want", "windup", "cd", "xp", "dmg"]);

/** Config uses `attack`; runtime enemy code reads `dmg`. */
function finalizeCombatStats(entry) {
  const attack = entry.attack ?? entry.dmg ?? 0;
  const defense = entry.defense ?? 0;
  const { attack: _a, ...rest } = entry;
  return { ...rest, dmg: attack, defense };
}

function mobStatPatch(def) {
  const patch = {};
  for (const [key, value] of Object.entries(def)) {
    if (!MOB_STAT_KEYS.has(key) || value == null) continue;
    patch[key === "attack" ? "dmg" : key] = value;
  }
  return patch;
}

function resolveStage(raw) {
  const map = MAP_BY_KEY[raw.map];
  if (!map) throw new Error(`stages.config: unknown map key "${raw.map}" in ${raw.id ?? raw.name}`);
  const { map: _mapKey, id: _id, ...rest } = raw;
  return { ...rest, map, mapKey: raw.map };
}

export const STAGES = stagesConfig.stages.map(resolveStage);

function buildCritterType(id, def) {
  const mod = CRITTER_MODS[def.critter];
  if (!mod) throw new Error(`enemies.config: unknown critter "${def.critter}" for ${id}`);
  const deathFx = DEATH_FX[def.deathFx] ?? PICKUP_MODS.poof;
  const {
    critter: _critter,
    deathFx: _df,
    mob: _mob,
    boss: _boss,
    look: _look,
    overrides: _overrides,
    ...stats
  } = def;
  return finalizeCombatStats({ mod, deathFx, ...stats });
}

function buildBossType(def) {
  const deathFx = DEATH_FX[def.deathFx] ?? PICKUP_MODS.shatterDeath;
  const {
    critter: _critter,
    deathFx: _df,
    mob: _mob,
    boss: _boss,
    look: _look,
    overrides: _overrides,
    ...stats
  } = def;
  return finalizeCombatStats({ mod: null, deathFx, boss: true, look: def.look, ...stats });
}

function applyOverrides(base, def) {
  if (!def.overrides || typeof def.overrides !== "object") return base;
  return { ...base, ...def.overrides };
}

export function buildEnemyTypes() {
  const goblins = buildGoblinEnemyTypes({
    poof: PICKUP_MODS.poof,
    goblinHit: FX.goblinHit,
    goblinDeath: FX.goblinDeath,
  });
  const out = {};

  for (const [id, def] of Object.entries(enemiesConfig.types)) {
    if (def.mob) {
      const base = goblins[id];
      if (!base) throw new Error(`enemies.config: unknown mob id "${def.mob}"`);
      const { mob: _m, overrides: _overrides, name, nameEn, scale } = def;
      const merged = applyOverrides(
        {
          ...base,
          ...(name != null ? { name } : {}),
          ...(nameEn != null ? { nameEn } : {}),
          ...(scale != null ? { scale } : {}),
        },
        { overrides: { ...def.overrides, ...mobStatPatch(def) } },
      );
      out[id] = finalizeCombatStats(merged);
      continue;
    }
    if (def.boss) {
      out[id] = buildBossType(def);
      continue;
    }
    if (def.critter) {
      out[id] = finalizeCombatStats(applyOverrides(buildCritterType(id, def), def));
      continue;
    }
    throw new Error(`enemies.config: type "${id}" needs critter, mob, or boss`);
  }
  return out;
}

export const ENEMY_TYPES = buildEnemyTypes();

function buildLootTable() {
  const rows = [];
  for (const raw of pickupsConfig.drops ?? []) {
    const mod = PICKUP_BY_KEY[raw.pickup];
    if (!mod) throw new Error(`pickups.config: unknown pickup "${raw.pickup}"`);
    rows.push({
      p: raw.p,
      kind: raw.kind,
      mod,
      label: raw.label,
      color: raw.color,
      heal: raw.heal,
      mp: raw.mp,
      xp: raw.xp,
    });
  }
  return rows;
}

export const LOOT = buildLootTable();
