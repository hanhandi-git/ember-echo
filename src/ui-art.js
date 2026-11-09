// Render the sibling pixelfx UI sources directly. DOM owns text and input; cached art
// stays local to the bundle, so neither a gallery server nor downloaded atlases are needed.
import { createFrame, painterFor, composite } from "../../pixelfx/src/core/index.js";
import * as action from "../../pixelfx/src/fx/ui/touch-action-button.js";
import * as skill from "../../pixelfx/src/fx/ui/skill-node.js";
import * as card from "../../pixelfx/src/fx/ui/loadout-card.js";
import * as panel from "../../pixelfx/src/fx/ui/loadout-panel.js";
import { cutPlate, tone, GOLD, SILVER } from "../../pixelfx/src/fx/ui/_ember.js";
import { MELEE_SHAPES, THROWN_SHAPES } from "../../pixelfx/src/core/weapons.js";
import { STASH_FX } from "./content/stash-catalog.js";

const modules = { action, skill, card, panel }, sprites = new Map(), images = new Map();
const views = new WeakMap();
const CROPS = { action: [8, 8, 80, 83], skill: [7, 7, 78, 78], card: [10, 10, 220, 92], panel: [12, 7, 334, 231] };
export function artSprite(kind, options = {}, time = 0) {
  const step = Math.floor(((time % 2.4 + 2.4) % 2.4) * 10);
  const key = JSON.stringify([kind, options, step]);
  if (sprites.has(key)) return sprites.get(key);
  const mod = modules[kind], frame = createFrame(...mod.meta.size);
  mod.draw(painterFor(frame).place(...mod.meta.origin), step / 10, { ...mod.meta.options, ...options });
  const canvas = document.createElement("canvas");
  [canvas.width, canvas.height] = mod.meta.size;
  const ctx = canvas.getContext("2d"), img = ctx.createImageData(canvas.width, canvas.height);
  composite(frame, img.data, null); ctx.putImageData(img, 0, 0);
  // A small shared cache serves all visible controls and never grows with elapsed play time.
  if (sprites.size >= 160) sprites.delete(sprites.keys().next().value);
  sprites.set(key, canvas);
  return canvas;
}
export function paintUiArt(canvas, kind, options = {}, time = 0) {
  const key = JSON.stringify([kind, options, Math.floor(time * 10)]);
  if (views.get(canvas) === key) return;
  views.set(canvas, key);
  const sprite = artSprite(kind, options, time), [x, y, w, h] = CROPS[kind];
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h); ctx.drawImage(sprite, x, y, w, h, 0, 0, w, h);
}
export function artUrl(kind, options = {}) {
  const key = JSON.stringify([kind, options]);
  if (!images.has(key)) {
    const canvas = document.createElement("canvas");
    paintUiArt(canvas, kind, options);
    images.set(key, canvas.toDataURL());
  }
  return images.get(key);
}
export function installUiFrames(stage) {
  for (const selected of [false, true]) {
    if (!selected) {
      const source = artSprite("panel", { frameOnly: true });
      const canvas = document.createElement("canvas"); canvas.width = 328; canvas.height = 224;
      canvas.getContext("2d").drawImage(source, 12, 14, 328, 224, 0, 0, 328, 224);
      stage.style.setProperty("--frame-steel", `url("${canvas.toDataURL()}")`);
      continue;
    }
    const f = createFrame(80, 80);
    cutPlate(painterFor(f), 0, 0, 80, 80, tone("bag"), selected);
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 80;
    const ctx = canvas.getContext("2d"), img = ctx.createImageData(80, 80);
    composite(f, img.data, null); ctx.putImageData(img, 0, 0);
    stage.style.setProperty("--frame-selected", `url("${canvas.toDataURL()}")`);
  }
}

// Registered weapon shapes are the very same geometry held by the hero. Fit each
// silhouette into a skill socket instead of showing every weapon as the same sword.
export function weaponArtUrl(weapon) {
  const key = `weapon:${weapon.rigWeapon}`;
  if (images.has(key)) return images.get(key);
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 78;
  const ctx = canvas.getContext("2d");
  const base = artSprite("skill", { icon: "none", mana: 1, hud: true });
  ctx.drawImage(base, 7, 7, 78, 78, 0, 0, 78, 78);
  const shape = MELEE_SHAPES[weapon.rigWeapon] ?? THROWN_SHAPES[weapon.rigWeapon];
  if (shape?.pixels) {
    // Sample the composed engraving directly at two output pixels per UI unit.
    // Painting one rectangle per source texel would cover neighboring inlay pixels.
    const density = 2, size = 78 * density, root = Math.SQRT1_2;
    canvas.width = canvas.height = size;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 7, 7, 78, 78, 0, 0, size, size);
    const points = shape.pixels.map(({ x, y }) => [(x + y) * root, (y - x) * root]);
    const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
    const scale = 58 / Math.max(maxX - minX, maxY - minY), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const source = new Map(shape.pixels.map(({x,y,c}) => [`${Math.round(x * shape.density)},${Math.round(y * shape.density)}`, c]));
    const layer = document.createElement("canvas"); layer.width = layer.height = size;
    const lctx = layer.getContext("2d"), img = lctx.createImageData(size, size), pixels = new Uint32Array(img.data.buffer);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const tx = (x / density - 39) / scale + cx, ty = (y / density - 36) / scale + cy;
      const sx = Math.round((tx - ty) * root * shape.density), sy = Math.round((tx + ty) * root * shape.density);
      pixels[y * size + x] = source.get(`${sx},${sy}`) ?? 0;
    }
    lctx.putImageData(img, 0, 0); ctx.drawImage(layer, 0, 0);
  } else if (shape) {
    const points = [];
    shape.draw((x, y, c) => points.push([x * 0.71 + y * 0.71, -x * 0.71 + y * 0.71, c]));
    const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
    const scale = Math.min(1.8, 46 / Math.max(maxX - minX, maxY - minY));
    const frame = createFrame(78, 78), p = painterFor(frame);
    for (const [x, y, c] of points) p.rect(Math.round(39 + (x - (minX + maxX) / 2) * scale), Math.round(35 + (y - (minY + maxY) / 2) * scale), Math.max(1, Math.ceil(scale * 0.6)), Math.max(1, Math.ceil(scale * 0.6)), c);
    const img = ctx.createImageData(78, 78); composite(frame, img.data, null);
    const layer = document.createElement("canvas"); layer.width = layer.height = 78;
    layer.getContext("2d").putImageData(img, 0, 0); ctx.drawImage(layer, 0, 0);
  } else {
    // Legacy stock weapons live in the actor rig. Their portrait preserves that geometry too.
    const points = legacyWeapon(weapon.rigWeapon);
    const f = createFrame(78, 78), p = painterFor(f);
    p.poly(points, SILVER[3]); p.poly(points.map(([x, y]) => [x - 1, y - 1]), SILVER[4]);
    p.line(20, 56, 33, 43, GOLD[2]); p.line(24, 41, 37, 54, GOLD[3]);
    const img = ctx.createImageData(78, 78); composite(f, img.data, null);
    const layer = document.createElement("canvas"); layer.width = layer.height = 78;
    layer.getContext("2d").putImageData(img, 0, 0); ctx.drawImage(layer, 0, 0);
  }
  const url = canvas.toDataURL(); images.set(key, url); return url;
}
/** Renders a stash pickup loop frame into a square HUD icon (settings → 收藏). */
export function stashPickupArtUrl(id) {
  const key = `stash:${id}`;
  if (images.has(key)) return images.get(key);
  const mod = STASH_FX[id];
  if (!mod?.draw || !mod.meta) return artUrl("skill", { icon: "none", hud: true });
  const [w, h] = mod.meta.size;
  const frame = createFrame(w, h);
  const opts = { ...mod.meta.options };
  const t = (mod.meta.duration ?? 2.4) * 0.38;
  const p = painterFor(frame).place(...mod.meta.origin);
  if (mod.drawBack) mod.drawBack(p, t, opts);
  mod.draw(p, t, opts);
  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const lctx = layer.getContext("2d");
  const img = lctx.createImageData(w, h);
  composite(frame, img.data, null);
  lctx.putImageData(img, 0, 0);
  const out = document.createElement("canvas");
  const size = 72;
  out.width = out.height = size;
  const ctx = out.getContext("2d");
  const scale = Math.min(size / w, size / h) * 0.9;
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(layer, (size - dw) / 2, (size - dh) / 2, dw, dh);
  const url = out.toDataURL();
  images.set(key, url);
  return url;
}

function legacyWeapon(id) {
  if (id === "scythe") return [[30, 45], [40, 15], [50, 14], [62, 22], [62, 40], [55, 27], [45, 23], [34, 48]];
  if (id === "claw") return [[25, 51], [39, 19], [37, 42], [48, 17], [45, 43], [58, 21], [50, 49], [31, 57]];
  if (id === "spear") return [[30, 47], [49, 21], [58, 15], [53, 29], [34, 49]];
  return [[29, 46], [51, 18], [60, 14], [56, 25], [34, 50]];
}
