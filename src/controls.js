// Canvas controls use the 320×180 viewport. Movement and touch actions are DOM controls.
export const SKILL_SLOT_COUNT = 3;
/** Top-centre console anchor; the slot geometry mirrors pixelfx ui/dnf-hud. */
export const HUD_CONSOLE = { x: 160, y: 36 };
export const SKILL_RECTS = Array.from({ length: SKILL_SLOT_COUNT }, (_, i) => ({
  x: HUD_CONSOLE.x - 24.5 + i * 17, y: HUD_CONSOLE.y - 23, w: 15, h: 15,
}));
export const RESUME_BUTTON = { x: 105, y: 88, w: 110, h: 14 };
export const CAMP_BUTTON = { x: 105, y: 106, w: 110, h: 14 };
/** Top-left hero card: a square portrait with the class, level and embers beside it. */
export const HERO_PANEL = { x: 4, y: 4, s: 22 };
/** Auto battle / auto loot toggles under the hero card. */
export const AUTO_TOGGLE_RECTS = {
  battle: { x: 4, y: 29, w: 30, h: 11 },
  loot: { x: 36, y: 29, w: 30, h: 11 },
};
export const contains = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
