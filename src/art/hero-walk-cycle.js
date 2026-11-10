// Native-resolution cutout animation. Source costume pixels are retained, while
// independently articulated legs, shoes, arms, hair and cloth create new poses.
import { createFrame, painterFor } from "../../../pixelfx/src/core/index.js";

const TAU = Math.PI * 2;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const length = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function inPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function decodeWalkSource(source, frameId) {
  const frame = source.frames[frameId], bytes = atob(frame.pixels);
  const palette = frame.palette.map((id) => {
    const c = source.colors[id].slice(1);
    return (0xff000000 | parseInt(c.slice(4, 6), 16) << 16 | parseInt(c.slice(2, 4), 16) << 8 | parseInt(c.slice(0, 2), 16)) >>> 0;
  });
  const pixels = Uint32Array.from(bytes, (n) => n.charCodeAt(0) === 255 ? 0 : palette[n.charCodeAt(0)]);
  const seen = new Uint8Array(pixels.length);
  for (let start = 0; start < pixels.length; start++) {
    if (!pixels[start] || seen[start]) continue;
    const stack = [start], part = []; seen[start] = 1;
    while (stack.length) {
      const at = stack.pop(), x = at % frame.width;
      part.push(at);
      for (const next of [x ? at - 1 : -1, x < frame.width - 1 ? at + 1 : -1, at - frame.width, at + frame.width]) {
        if (next >= 0 && next < pixels.length && pixels[next] && !seen[next]) { seen[next] = 1; stack.push(next); }
      }
    }
    if (part.length < 32 && part.every((at) => Math.floor(at / frame.width) > frame.height * 0.75 || at % frame.width > frame.width * 0.9)) {
      for (const at of part) pixels[at] = 0;
    }
  }
  return { width: frame.width, height: frame.height, root: frame.offset.map((n) => -n), pixels, palette, shadeCache: new Map() };
}

/** Two planted contacts and two lifted passing poses per full stride. */
export function footPath(phase, stride, lift) {
  const u = (phase % 1 + 1) % 1;
  if (u < 0.5) return { x: stride * (1 - u * 4), y: 0, roll: 0.1 * (u * 4 - 1), planted: true };
  const swing = (u - 0.5) * 2, eased = swing * swing * (3 - 2 * swing);
  return { x: stride * (eased * 2 - 1), y: -lift * Math.sin(Math.PI * swing),
    roll: -0.23 * Math.sin(Math.PI * swing), planted: false };
}

function kneeFor(hip, ankle, upper, lower) {
  const d = Math.max(0.1, length(hip, ankle));
  // Small source foreshortening is recovered when the leg extends in the stride.
  const stretch = Math.max(1, d / (upper + lower) * 1.015);
  upper *= stretch; lower *= stretch;
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const bend = Math.sqrt(Math.max(0, upper * upper - along * along));
  const ux = (ankle[0] - hip[0]) / d, uy = (ankle[1] - hip[1]) / d;
  return [hip[0] + ux * along + uy * bend, hip[1] + uy * along - ux * bend];
}

function tinted(color, factor, source) {
  if (factor === 1) return color;
  if (source.shadeCache.has(color)) return source.shadeCache.get(color);
  const r = (color & 255) * factor, g = (color >>> 8 & 255) * factor, b = (color >>> 16 & 255) * factor;
  let best = color, distance = Infinity;
  for (const candidate of source.palette) {
    const d = (r - (candidate & 255)) ** 2 + (g - (candidate >>> 8 & 255)) ** 2 + (b - (candidate >>> 16 & 255)) ** 2;
    if (d < distance) { best = candidate; distance = d; }
  }
  source.shadeCache.set(color, best);
  return best;
}

function sample(source, x, y) {
  x = Math.round(x); y = Math.round(y);
  return x < 0 || y < 0 || x >= source.width || y >= source.height ? 0 : source.pixels[y * source.width + x];
}

function masked(source, part, x, y) {
  return inPolygon(x + 0.5, y + 0.5, part.mask) ? sample(source, x, y) : 0;
}

function bone(p, source, part, from, to, targetFrom, targetTo, shade) {
  const dx = targetTo[0] - targetFrom[0], dy = targetTo[1] - targetFrom[1];
  const size = Math.max(0.01, Math.hypot(dx, dy));
  const sx = to[0] - from[0], sy = to[1] - from[1], sourceSize = Math.max(0.01, Math.hypot(sx, sy));
  const x0 = Math.floor(Math.min(...[targetFrom[0], targetTo[0]]) - 15);
  const x1 = Math.ceil(Math.max(...[targetFrom[0], targetTo[0]]) + 15);
  const y0 = Math.floor(Math.min(...[targetFrom[1], targetTo[1]]) - 15);
  const y1 = Math.ceil(Math.max(...[targetFrom[1], targetTo[1]]) + 15);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const u = ((x - targetFrom[0]) * dx + (y - targetFrom[1]) * dy) / (size * size);
    if (u < -0.045 || u > 1.045) continue;
    const across = ((x - targetFrom[0]) * -dy + (y - targetFrom[1]) * dx) / size;
    const sourceX = from[0] + sx * clamp(u, 0, 1) - sy / sourceSize * across;
    const sourceY = from[1] + sy * clamp(u, 0, 1) + sx / sourceSize * across;
    if (sourceY >= part.ankle[1] - 3) continue;
    const color = masked(source, part, sourceX, sourceY);
    if (color) p.px(x, y, tinted(color, shade, source));
  }
}

function hairPixel(rig, x, y, color) {
  if (!rig.hair?.some((poly) => inPolygon(x, y, poly))) return false;
  const r = color & 255, g = color >>> 8 & 255, b = color >>> 16 & 255;
  return rig.hairColor === "cyan" ? g > r * 1.2 && b > r * 1.2
    : y < 103 && r > g * 1.4 && r > b * 1.1;
}

function renderLeg(p, source, rig, part, phase, side, origin, bob) {
  const path = footPath(phase + side * 0.5, rig.stride, rig.lift);
  const baseY = side === 0 ? source.root[1] : source.root[1] - 2;
  const soleY = Math.max(...part.mask.map((point) => point[1]));
  const heelHeight = soleY - part.ankle[1];
  const hip = [origin[0] + (side ? 6 : -6), origin[1] - source.root[1] + part.hip[1] + bob];
  const ankle = [origin[0] + (side ? 5 : -5) + path.x,
    origin[1] - source.root[1] + baseY - heelHeight + path.y];
  const knee = kneeFor(hip, ankle, length(part.hip, part.knee), length(part.knee, part.ankle));
  const shade = side ? 0.83 : 1;
  bone(p, source, part, part.hip, part.knee, hip, knee, shade);
  bone(p, source, part, part.knee, part.ankle, knee, ankle, shade);
  const c = Math.cos(path.roll), s = Math.sin(path.roll);
  // Shoe stays a separate rigid piece, so planted soles never stretch with a calf.
  for (let y = Math.floor(part.ankle[1] - 4); y < source.height; y++) for (let x = 0; x < source.width; x++) {
    const color = masked(source, part, x, y);
    if (!color) continue;
    const px = x - part.ankle[0], py = y - part.ankle[1];
    p.px(Math.round(ankle[0] + px * c - py * s), Math.round(ankle[1] + px * s + py * c), tinted(color, shade, source));
  }
  return { ...path, ankle, knee, hip };
}

export function renderWalkCycleFrame(source, rig, phase, canvas = [192, 192], origin = [96, 180]) {
  phase = (phase % 1 + 1) % 1;
  const frame = createFrame(...canvas), p = painterFor(frame);
  const angle = phase * TAU;
  const bob = -rig.bob * (1 - Math.cos(angle * 2)) * 0.5;
  const feet = [null, null];
  feet[1] = renderLeg(p, source, rig, rig.legs[1], phase, 1, origin, bob);
  feet[0] = renderLeg(p, source, rig, rig.legs[0], phase, 0, origin, bob);
  const clothStart = Math.min(...rig.legs.map((leg) => leg.hip[1])) * 0.78;
  const shiftX = origin[0] - source.root[0], shiftY = origin[1] - source.root[1];
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    const color = source.pixels[y * source.width + x];
    if (!color) continue;
    const hair = hairPixel(rig, x, y, color);
    if (!hair && (rig.legs.some((leg) => inPolygon(x + 0.5, y + 0.5, leg.mask))
      || rig.erase?.some((poly) => inPolygon(x + 0.5, y + 0.5, poly))
      || rig.arm && inPolygon(x + 0.5, y + 0.5, rig.arm.mask))) continue;
    const fixed = rig.rigid.some((poly) => inPolygon(x + 0.5, y + 0.5, poly));
    const clothWeight = clamp((y - clothStart) / Math.max(1, source.root[1] - clothStart), 0, 1);
    const flutter = fixed ? 0 : hair ? Math.sin(angle - y * 0.025) * 2.6
      : Math.sin(angle - clothWeight * 1.8) * rig.cloth * clothWeight * clothWeight;
    p.px(x + shiftX + Math.round(flutter), y + shiftY + Math.round(bob), color);
  }
  if (rig.arm) {
    const swing = Math.sin(angle + Math.PI) * rig.arm.swing * Math.PI / 180;
    const c = Math.cos(swing), s = Math.sin(swing), pivot = rig.arm.pivot;
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
      const color = masked(source, rig.arm, x, y);
      if (!color || hairPixel(rig, x, y, color)) continue;
      const dx = x - pivot[0], dy = y - pivot[1];
      p.px(Math.round(pivot[0] + dx * c - dy * s + shiftX), Math.round(pivot[1] + dx * s + dy * c + shiftY + bob), color);
    }
  }
  // One-pixel holes from integer rotations are closed only inside solid clusters.
  const copy = frame.color.slice();
  for (let y = 1; y < frame.h - 1; y++) for (let x = 1; x < frame.w - 1; x++) {
    const at = y * frame.w + x;
    if (copy[at]) continue;
    const neighbors = [copy[at - 1], copy[at + 1], copy[at - frame.w], copy[at + frame.w]].filter(Boolean);
    if (neighbors.length >= 3) p.px(x, y, neighbors[0]);
  }
  return { frame, feet };
}
