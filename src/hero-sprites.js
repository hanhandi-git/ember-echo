// Native pixel data is bundled as code. No Image, Canvas decode, fetch, or PNG is required.
import manifest from "../assets/heroes/manifest.json" with { type: "json" };
import { HERO_PIXEL_DATA } from "../../pixelfx/src/core/dnf-pixel-data.js";
import { equipDnfFrame } from "../../pixelfx/src/core/dnf-characters.js";
import { HERO_PIXEL_EDITS, normalizeAppearance, presetColor } from "./hero-wardrobe.js";

export const DNF_HERO_LOOKS = manifest;
export const spriteLook = (id) => manifest.find((look) => look.id === id);
const cache = new Map();
const revision = new Map();
const packed = (value) => {
  const rgb = value.slice(1, 7), a = value.length === 9 ? parseInt(value.slice(7), 16) : 255;
  return ((a << 24) | (parseInt(rgb.slice(4), 16) << 16) | (parseInt(rgb.slice(2, 4), 16) << 8) | parseInt(rgb.slice(0, 2), 16)) >>> 0;
};

export function heroPalette(id, appearance) {
  const source = HERO_PIXEL_DATA[id];
  if (!source) return {};
  const style = normalizeAppearance(appearance);
  return Object.fromEntries(Object.entries({ ...source.palette, ...HERO_PIXEL_EDITS[id]?.palette }).map(([key, color]) => [key, style.palette[key] ?? presetColor(color, style.preset)]));
}

export function appearanceFrame(id, frameId, appearance) {
  const look = spriteLook(id);
  return look ? frameFor(id, frameId, appearance) : null;
}

/** Compose editable layers; .. is transparent and !! clears any layer below. */
export function composePixelFrame(frame, palette, extraLayers = [], density = 2) {
  const pixels = new Map(), offset = frame.offset ?? [0, 0];
  for (const layer of [...frame.layers, ...extraLayers]) {
    if (layer.visible === false) continue;
    layer.rows.forEach((row, y) => {
      for (let x = 0; x < row.length / 2; x++) {
        const key = row.slice(x * 2, x * 2 + 2);
        if (key === "..") continue;
        const px = x + (layer.x ?? 0), py = y + (layer.y ?? 0), position = `${px},${py}`;
        if (key === "!!") { pixels.delete(position); continue; }
        const value = layer.palette?.[key] ?? palette[key];
        if (!value) throw new Error(`Unknown pixel palette entry ${key} in ${layer.id}`);
        pixels.set(position, [px, py, packed(value)]);
      }
    });
  }
  const xs = [], ys = [], color = [];
  for (const [x, y, value] of pixels.values()) {
    if (!(value >>> 24)) continue;
    xs.push((x + offset[0]) / density); ys.push((y + offset[1]) / density); color.push(value);
  }
  return { xs: Float32Array.from(xs), ys: Float32Array.from(ys), color: Uint32Array.from(color), n: xs.length, density };
}

function frameFor(id, frameId, appearance) {
  const source = HERO_PIXEL_DATA[id], look = spriteLook(id);
  if (!source || !look) return null;
  const style = normalizeAppearance(appearance);
  const key = `${id}:${revision.get(id) ?? 0}:${JSON.stringify(style)}:${frameId}`;
  if (cache.has(key)) return cache.get(key);
  const frame = source.frames[frameId];
  if (!frame) return null;
  const body = composePixelFrame(frame, heroPalette(id, style), HERO_PIXEL_EDITS[id]?.frames?.[frameId]?.layers ?? [], look.density);
  cache.set(key, body);
  // Palette dragging and long editing sessions must not accumulate old frames forever.
  if (cache.size > 256) cache.delete(cache.keys().next().value);
  return body;
}

/** Synchronous warm-up from code; retained as a Promise for existing portrait call sites. */
export function loadHeroSprite(id, appearance) {
  return Promise.resolve(frameFor(id, spriteLook(id)?.clips.idle[0], appearance));
}

export function invalidateHeroSprite(id) {
  revision.set(id, (revision.get(id) ?? 0) + 1);
  for (const key of cache.keys()) if (key.startsWith(`${id}:`)) cache.delete(key);
}

export function heroSprite(id, anim = {}, casting = false, appearance, weaponPose = {}) {
  const look = spriteLook(id);
  if (!look) return null;
  let kind = casting ? "cast" : anim.kind ?? "idle";
  if (kind.startsWith("cast")) kind = "cast";
  const clip = look.clips[kind] ?? look.clips.idle;
  const t = Math.max(0, anim.t ?? 0);
  const progress = ["idle", "walk"].includes(kind) ? t / Math.max(0.05, anim.dur ?? 0.9) % 1 : Math.min(0.9999, t / Math.max(0.05, anim.dur ?? 0.55));
  const frameId = clip[Math.floor(progress * clip.length)];
  const equipmentPose = { ...weaponPose };
  if (["idle", "walk"].includes(kind)) delete equipmentPose.sa;
  return equipDnfFrame(frameFor(id, frameId, appearance), id, frameId, equipmentPose);
}
