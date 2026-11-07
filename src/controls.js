// The remaining canvas controls use the 320×180 viewport. Movement/actions are DOM controls.
export const SKILL_RECTS = Array.from({ length: 6 }, (_, i) => ({
  x: 274, y: 48 + i * 21, w: 42, h: 20,
}));
export const RESUME_BUTTON = { x: 105, y: 123, w: 110, h: 20 };
export const contains = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
