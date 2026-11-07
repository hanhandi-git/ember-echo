// Relative to the existing combat art and distances. World coordinates and UI keep their size.
export const COMBAT_SCALE = 0.82;
export const HERO_RENDER_SCALE = 0.78 * COMBAT_SCALE;
export const BOSS_RENDER_SCALE = 1.35 * COMBAT_SCALE;
export const combatDistance = (value) => value * COMBAT_SCALE;
