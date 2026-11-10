// A travelling fragment of the hero's own release frame (arrow, crescent, or sound wave).
// No procedural weapon or replacement attack effect is composited over the sprite.
import { appearanceFrame, spriteLook } from "../hero-sprites.js";

export const meta = { name: "Hero release", size: [64, 48], origin: [32, 24], duration: 2, loop: true, options: {} };

export function create(options) {
  const look = spriteLook(options.look);
  const clip = look.clips.enhanced;
  const body = appearanceFrame(look.id, clip[look.contacts.enhanced], options.appearance);
  let right = -Infinity, top = Infinity, bottom = -Infinity;
  for (let i = 0; i < body.n; i++) right = Math.max(right, body.xs[i]);
  const edge = Math.max(2, right - 20);
  for (let i = 0; i < body.n; i++) if (body.xs[i] >= edge) {
    top = Math.min(top, body.ys[i]); bottom = Math.max(bottom, body.ys[i]);
  }
  return { draw(p) {
    const cell = 0.42 / body.density;
    for (let i = 0; i < body.n; i++) if (body.xs[i] >= edge) {
      p.rect((body.xs[i] - (edge + right) / 2) * 0.42,
        (body.ys[i] - (top + bottom) / 2) * 0.42, cell, cell, body.color[i]);
    }
  } };
}
