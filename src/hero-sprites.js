// Native pixel data ships as per-hero chunks fetched on demand; no PNG decode is required.
import manifest from "../assets/heroes/manifest.json" with { type: "json" };
import { HERO_PIXEL_LOADERS } from "./hero-data/index.js";
import { HERO_PIXEL_EDITS, normalizeAppearance, presetColor } from "./hero-wardrobe.js";

export const SPRITE_HERO_LOOKS = manifest;
export const spriteLook = (id) => manifest.find((look) => look.id === id);
// Populated by loadHeroPixelData(); synchronous readers return null/{} until a hero's chunk lands.
export const HERO_PIXEL_DATA = {};
const pending = new Map();
const failed = new Set();
const cache = new Map();
const paletteCache = new Map();
const revision = new Map();
const packed = (value) => {
  const rgb = value.slice(1, 7), a = value.length === 9 ? parseInt(value.slice(7), 16) : 255;
  return ((a << 24) | (parseInt(rgb.slice(4), 16) << 16) | (parseInt(rgb.slice(2, 4), 16) << 8) | parseInt(rgb.slice(0, 2), 16)) >>> 0;
};

export function heroPalette(id, appearance) {
  const source = HERO_PIXEL_DATA[id];
  if (!source) {
    if (spriteLook(id)) loadHeroPixelData(id);
    return {};
  }
  const style = normalizeAppearance(appearance);
  return Object.fromEntries(source.editable.map((index, i) => {
    const key = i.toString(16).padStart(2, "0");
    const color = HERO_PIXEL_EDITS[id]?.palette?.[key] ?? source.colors[index];
    return [key, style.palette[key] ?? presetColor(color, style.preset)];
  }));
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
  const look = spriteLook(id);
  if (!look) return null;
  const source = HERO_PIXEL_DATA[id];
  if (!source) {
    loadHeroPixelData(id);
    return null;
  }
  const style = normalizeAppearance(appearance);
  const key = `${id}:${revision.get(id) ?? 0}:${JSON.stringify(style)}:${frameId}`;
  if (cache.has(key)) return cache.get(key);
  const frame = source.frames[frameId];
  if (!frame) return null;
  const paletteKey = `${id}:${revision.get(id) ?? 0}:${JSON.stringify(style)}`;
  let palette = paletteCache.get(paletteKey);
  if (!palette) {
    palette = source.colors.map((color) => packed(presetColor(color, style.preset)));
    const edits = heroPalette(id, style);
    source.editable.forEach((index, i) => { palette[index] = packed(edits[i.toString(16).padStart(2, "0")]); });
    paletteCache.set(paletteKey, palette);
    if (paletteCache.size > 32) paletteCache.delete(paletteCache.keys().next().value);
  }
  const data = atob(frame.pixels), xs = [], ys = [], colors = [];
  for (let pixel = 0; pixel < data.length; pixel++) {
    const index = data.charCodeAt(pixel);
    if (index === 255) continue;
    xs.push((pixel % frame.width + frame.offset[0]) / look.density);
    ys.push((Math.floor(pixel / frame.width) + frame.offset[1]) / look.density);
    colors.push(palette[frame.palette[index]]);
  }
  const body = { xs: Float32Array.from(xs), ys: Float32Array.from(ys), color: Uint32Array.from(colors),
    n: xs.length, density: look.density, frameId: Number(frameId), weapon: look.weapon.id };
  cache.set(key, body);
  // Palette dragging and long editing sessions must not accumulate old frames forever.
  if (cache.size > 256) cache.delete(cache.keys().next().value);
  return body;
}

/** Fetch a hero's pixel payload on demand; resolves null when unavailable or failed. */
export function loadHeroPixelData(id) {
  if (HERO_PIXEL_DATA[id] || failed.has(id)) return Promise.resolve(HERO_PIXEL_DATA[id] ?? null);
  if (!pending.has(id)) {
    const loader = HERO_PIXEL_LOADERS[id];
    const job = Promise.resolve()
      .then(() => loader?.())
      .then((mod) => {
        if (mod) HERO_PIXEL_DATA[id] = mod.default ?? mod;
        return HERO_PIXEL_DATA[id] ?? null;
      })
      .catch(() => { failed.add(id); return null; });
    pending.set(id, job.finally(() => pending.delete(id)));
  }
  return pending.get(id);
}

export const heroPixelDataLoaded = (id) => !!HERO_PIXEL_DATA[id];
export const heroPixelDataFailed = (id) => failed.has(id);

/** Decode the selected source frames before the next render. */
export async function loadHeroSprite(id, appearance) {
  await loadHeroPixelData(id);
  const look = spriteLook(id);
  const idle = frameFor(id, look?.clips.idle[0], appearance);
  for (const frame of look?.walkSource?.frames ?? []) frameFor(id, frame, appearance);
  return idle;
}

export function invalidateHeroSprite(id) {
  revision.set(id, (revision.get(id) ?? 0) + 1);
  for (const key of cache.keys()) if (key.startsWith(`${id}:`)) cache.delete(key);
  for (const key of paletteCache.keys()) if (key.startsWith(`${id}:`)) paletteCache.delete(key);
}

export const isHeroAction = (kind) => /^(attack[123]|enhanced|cleave|rush|rise|guard|awakening)$/.test(kind);

function weightedIndex(weights, progress) {
  const target = Math.min(0.999999, Math.max(0, progress)) * weights.reduce((sum, n) => sum + n, 0);
  let elapsed = 0;
  for (let i = 0; i < weights.length; i++) {
    elapsed += weights[i];
    if (target < elapsed) return i;
  }
  return weights.length - 1;
}

/** Weighted source-frame timing; contact always starts exactly on the hit clock. */
export function heroFrameId(look, anim = {}, casting = false) {
  let kind = typeof casting === "string" ? casting : casting ? "cast" : anim.kind ?? "idle";
  if (kind.startsWith("cast")) kind = "cast";
  const clip = look.clips[kind] ?? look.clips.idle;
  const t = Math.max(0, anim.t ?? 0);
  const motion = look.motion ?? {};
  const duration = kind === "idle" ? motion.idle ?? 1.6 : kind === "walk" ? motion.walk ?? 0.7 : anim.dur ?? 0.55;
  const looping = kind === "idle" || kind === "walk";
  const weights = motion.weights?.[kind] ?? clip.map((_, i) => looping ? 1 : i === 0 ? 0.65 : i === clip.length - 1 ? 1.2 : 1);
  let index;
  const contact = look.contacts[kind];
  const strikes = motion.strikes?.[kind];
  if (!casting && strikes && anim.hits?.length === strikes.length) {
    const times = [0, ...anim.hits, duration], indices = [0, ...strikes, clip.length];
    const segment = times.slice(1).findIndex((end) => t < end);
    const at = segment < 0 ? times.length - 2 : segment;
    index = indices[at] + weightedIndex(weights.slice(indices[at], indices[at + 1]),
      (t - times[at]) / Math.max(0.01, times[at + 1] - times[at]));
  } else if (!casting && isHeroAction(kind) && anim.contact > 0 && contact > 0 && contact < clip.length) {
    index = t < anim.contact
      ? weightedIndex(weights.slice(0, contact), t / anim.contact)
      : contact + weightedIndex(weights.slice(contact), (t - anim.contact) / Math.max(0.01, duration - anim.contact));
  } else {
    index = weightedIndex(weights, looping ? t / duration % 1 : t / duration);
  }
  return index === 0 && anim.entryFrame != null && look.frames[anim.entryFrame] ? anim.entryFrame : clip[index];
}

export function heroSprite(id, anim = {}, casting = false, appearance) {
  const look = spriteLook(id);
  return look ? frameFor(id, heroFrameId(look, anim, casting), appearance) : null;
}
