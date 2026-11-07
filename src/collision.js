// Continuous collision in projected x/y plus ground depth. Relative motion gives the earliest
// time of impact, even when projectile and enemy cross between two render frames.
import { COMBAT_SCALE } from "./combat-scale.js";
export const lerp = (a, b, u) => a + (b - a) * u;
export const mixPoint = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), depth: lerp(a.depth, b.depth, u) });

export function hurtbox(entity, u = 1) {
  const x = lerp(entity.prevX ?? entity.x, entity.x, u);
  const foot = lerp(entity.prevY ?? entity.y, entity.y, u);
  // Hurtboxes follow the shared combat scale, not the effect's source scale. The latter may
  // already include a critter-specific art reduction and would double-shrink collisions.
  const scale = entity.combatScale ?? COMBAT_SCALE;
  const baseBarH = entity.baseBarH ?? entity.barH;
  const height = entity.boss ? 58 * scale : baseBarH ? Math.max(14, baseBarH * 0.7) * scale : 29 * scale;
  return { x, y: foot - height / 2, depth: foot,
    hx: (entity.boss ? 14 : Math.max(5, (entity.w ?? 12) * 0.55)) * scale,
    hy: height / 2, hd: (entity.boss ? 10 : 6) * scale };
}

// A swept sphere versus a linearly moving box (Minkowski expansion + slab intersection).
// null is a miss; zero is a legitimate initial overlap.
export function sweepBox(from, to, box0, box1, radius = 0) {
  let enter = 0, exit = 1;
  for (const [axis, half] of [["x", "hx"], ["y", "hy"], ["depth", "hd"]]) {
    if (axis === "depth" && (!Number.isFinite(from.depth) || !Number.isFinite(to.depth))) continue;
    const start = from[axis] - box0[axis];
    const delta = to[axis] - box1[axis] - start;
    const size = Math.max(box0[half], box1[half]) + radius;
    if (Math.abs(delta) < 1e-9) { if (Math.abs(start) > size) return null; continue; }
    const a = (-size - start) / delta, b = (size - start) / delta;
    enter = Math.max(enter, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
    if (enter > exit) return null;
  }
  return enter;
}

export function sweepEntity(from, to, entity, radius, u0 = 0, u1 = 1) {
  const t = sweepBox(from, to, hurtbox(entity, u0), hurtbox(entity, u1), radius);
  return t == null ? null : { t, point: mixPoint(from, to, t), entity };
}

export function projectileSweep(p0, p1, entity, radius) {
  const from = { x: p0.x, y: p0.y, depth: p0.y };
  const to = { x: p1.x, y: p1.y, depth: p1.y };
  return sweepEntity(from, to, entity, radius);
}

// Approximate a blade capsule with overlapping spheres, each swept continuously. The spacing
// is smaller than their diameter; time subdivision handles curved swings, not fast enemies.
export function sweepBlade(blade0, blade1, entity, radius, u0, u1) {
  const length = Math.max(Math.hypot(blade0.tip.x - blade0.root.x, blade0.tip.y - blade0.root.y),
    Math.hypot(blade1.tip.x - blade1.root.x, blade1.tip.y - blade1.root.y));
  const n = Math.max(1, Math.ceil(length / Math.max(1, radius)));
  let best = null;
  for (let i = 0; i <= n; i++) {
    const along = i / n;
    const hit = sweepEntity(mixPoint(blade0.root, blade0.tip, along), mixPoint(blade1.root, blade1.tip, along), entity, radius, u0, u1);
    if (hit && (!best || hit.t < best.t - 1e-7 || Math.abs(hit.t - best.t) < 1e-7 && along < best.along)) best = { ...hit, along };
  }
  return best;
}
