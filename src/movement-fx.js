// Motion echoes use the player's actual posed pixels, at the same scale as Hero.draw().
import { posed, hex } from "../../pixelfx/src/core/index.js";
import { HERO_RENDER_SCALE, combatDistance as size } from "./combat-scale.js";

export function createMovementTrail(hero, from, kind) {
  return {
    kind, t: 0, life: kind === "dodge" ? 0.52 : 0.44,
    body: hero.pixelBody?.() ?? posed(hero.pose(), hero.look), facing: hero.facing, scale: hero.bodyScale ?? HERO_RENDER_SCALE,
    from: { ...from }, to: { x: hero.x, y: hero.y },
    color: hex(kind === "dodge" ? "#ffc36c" : "#87dfff"),
    rim: hex(kind === "dodge" ? "#fff1c1" : "#dcfaff"),
  };
}

export function drawMovementTrail(p, trail) {
  const k = Math.max(0, 1 - trail.t / trail.life);
  if (!k) return;
  const { from, to, body: b, color, rim, facing, scale = HERO_RENDER_SCALE } = trail;
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  // The closest echo is brightest; rows erode into stripes as the older echoes dissolve.
  for (let j = 0; j < 3; j++) {
    const u = j / 3, x = from.x + (to.x - from.x) * u, y = from.y + (to.y - from.y) * u;
    const alpha = k * (0.28 + j * 0.17);
    for (let i = 0; i < b.n; i++) {
      const py = Math.round(b.ys[i] * scale);
      if (j === 0 && (py + Math.floor(trail.t * 20)) % 3 === 0) continue;
      const cell = scale / b.density;
      p.rect(x + (facing < 0 ? -b.xs[i] - 1 / b.density : b.xs[i]) * scale, y + b.ys[i] * scale, cell, cell, j === 2 ? rim : color, alpha);
    }
    p.glow(x, y - size(11), size(14), color, k * 0.1);
  }
  if (length > 1) {
    for (let i = 0; i < 3; i++) {
      const h = size(5 + i * 7);
      p.line(from.x, from.y - h, to.x, to.y - h, i === 1 ? rim : color, k * (0.65 - i * 0.1));
    }
    p.glowLine(from.x, from.y - size(10), to.x, to.y - size(10), size(5), color, 0.2 * k);
  }
  // Kickoff and arrival arcs widen and fade without resembling a summoning circle.
  const r = size(3 + trail.t * 24);
  for (const point of [from, to]) {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      p.dot(point.x + Math.cos(a) * r, point.y + Math.sin(a) * r * 0.25, rim, k * 0.7);
    }
  }
}
