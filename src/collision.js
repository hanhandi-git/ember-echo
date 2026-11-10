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

// --- Ground-plane footprints -------------------------------------------------
// Melee and area attacks resolve on the floor plane (x = screen x, y = depth), so the
// 3-axis hurtbox collapses to a rectangle: the same half-width and depth extent the
// projectile sweep uses, centred on the interpolated foot position.

export function groundBox(entity, u = 1) {
  const box = hurtbox(entity, u);
  return { x: box.x, y: box.depth, hx: box.hx, hy: box.hd };
}

function pointRectDistance(px, py, cx, cy, hx, hy) {
  const dx = Math.max(0, Math.abs(px - cx) - hx);
  const dy = Math.max(0, Math.abs(py - cy) - hy);
  return Math.hypot(dx, dy);
}

function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const u = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + dx * u), py - (ay + dy * u));
}

function segmentMeetsRect(ax, ay, bx, by, cx, cy, hx, hy) {
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dy = by - ay;
  for (const [p, d, lo, hi] of [[ax, dx, cx - hx, cx + hx], [ay, dy, cy - hy, cy + hy]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; continue; }
    let ta = (lo - p) / d, tb = (hi - p) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

// Distance between a ground-plane segment and a footprint. `depthWeight` reproduces the
// side-view squash (≈1.2–1.4) the reach checks already used, applied to both sides.
export function segmentFootprintDistance(ax, ay, bx, by, fp, depthWeight = 1.2) {
  const say = ay * depthWeight, sby = by * depthWeight;
  const cy = fp.y * depthWeight, hy = fp.hy * depthWeight;
  if (segmentMeetsRect(ax, say, bx, sby, fp.x, cy, fp.hx, hy)) return 0;
  let best = Math.min(
    pointRectDistance(ax, say, fp.x, cy, fp.hx, hy),
    pointRectDistance(bx, sby, fp.x, cy, fp.hx, hy),
  );
  for (const [px, py] of [[fp.x - fp.hx, cy - hy], [fp.x + fp.hx, cy - hy], [fp.x - fp.hx, cy + hy], [fp.x + fp.hx, cy + hy]]) {
    best = Math.min(best, pointSegmentDistance(px, py, ax, say, bx, sby));
  }
  return best;
}

// Shortest distance from a polyline (a swing path or swept lane) to an entity footprint.
export function pathFootprintDistance(points, fp, depthWeight = 1.2) {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    best = Math.min(best, segmentFootprintDistance(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, fp, depthWeight));
  }
  return best;
}

// Distance from a world point to an entity's footprint — radius checks for blasts and
// rings should measure to the body, not just the centre pixel.
export function pointFootprintDistance(x, y, entity, depthWeight = 1.2) {
  const fp = groundBox(entity);
  return pointRectDistance(x, y * depthWeight, fp.x, fp.y * depthWeight, fp.hx, fp.hy * depthWeight);
}
