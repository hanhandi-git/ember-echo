// Relative to the existing combat art and distances. World coordinates and UI keep their size.
export const COMBAT_SCALE = 0.82;
export const HERO_RENDER_SCALE = 0.78 * COMBAT_SCALE;
export const BOSS_RENDER_SCALE = 1.35 * COMBAT_SCALE;
/** World loot FX — keep pickups visibly smaller than the duelist silhouette. */
export const PICKUP_RENDER_SCALE = COMBAT_SCALE * 0.54;
export const combatDistance = (value) => value * COMBAT_SCALE;
