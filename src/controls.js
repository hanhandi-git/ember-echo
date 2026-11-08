// The remaining canvas controls use the 320×180 viewport. Movement/actions are DOM controls.
export const SKILL_SLOT_COUNT = 7;
export const SKILL_KEYS = ["J", "K", "L", "U", "I", "O", "T"];
export const SKILL_RECTS = Array.from({ length: SKILL_SLOT_COUNT }, (_, i) => ({
  x: 274, y: 38 + i * 18, w: 42, h: 17,
}));
export const RESUME_BUTTON = { x: 105, y: 118, w: 110, h: 18 };
export const CAMP_BUTTON = { x: 105, y: 142, w: 110, h: 18 };
/** Left HUD auto toggles — square pixelfx tiles under the XP bar. */
export const AUTO_TOGGLE_SIZE = 15;
export const AUTO_TOGGLE_X = 10;
export const AUTO_TOGGLE_RECTS = {
  battle: { x: AUTO_TOGGLE_X, y: 54, w: 72, h: AUTO_TOGGLE_SIZE + 2 },
  loot: { x: AUTO_TOGGLE_X, y: 68, w: 72, h: AUTO_TOGGLE_SIZE + 2 },
};
export const contains = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
