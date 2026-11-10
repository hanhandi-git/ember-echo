/**
 * Map tile storage.
 *
 * The authored hub maps are beautiful, but their procedural bake takes several
 * seconds on a mid-range browser. Hub tiles therefore start with a tiny static
 * fallback and swap to pre-rendered PNGs as soon as the browser has decoded
 * them. Battle maps keep the procedural path and remain cached per stage.
 */

import { createFx, createFrame, painterFor, hex } from "../../../pixelfx/src/core/index.js";
import { HUB_MAPS } from "../content/hub-worlds.js";
import { STAGES } from "../data.js";
import { RENDER_DENSITY } from "./constants.js";

const MAP_TILE_W = 320;
const MAP_TILE_H = 180;
const MAP_TILE_DENSITY = RENDER_DENSITY;
const HUB_STATIC_ASSETS = [
  new URL("./assets/hub/starter-camp.png", import.meta.url).href,
  new URL("./assets/hub/hearth-town.png", import.meta.url).href,
];

function hubArenaMapFx() {
  return createFx(HUB_MAPS[2].module, { x: 0, y: 0, seed: 3 });
}

/**
 * Hub tiles pair an effect with the frame it draws into. Static PNG tiles draw
 * straight from their decoded layer; the procedural training-yard tile needs a
 * scratch frame of its own. Returning both together keeps them in lockstep —
 * an async artwork swap must never leave a frame slot undefined.
 */
function hubTiles(staticLayers) {
  const mapTileFrames = [staticLayers[0], staticLayers[1], newMapTileFrame()];
  const mapFxTiles = [
    staticFx(staticLayers[0], HUB_MAPS[0].id),
    staticFx(staticLayers[1], HUB_MAPS[1].id),
    hubArenaMapFx(),
  ];
  return { mapFxTiles, mapTileFrames };
}

function newMapTileFrame() {
  return createFrame(MAP_TILE_W, MAP_TILE_H, 0, 0, MAP_TILE_DENSITY);
}

function rewindMaps(maps) {
  for (const fx of maps) fx.rewind?.();
}

function staticFx(layer, name) {
  let t = 0;
  return {
    meta: { name, kind: "map", size: [MAP_TILE_W, MAP_TILE_H], loop: true, duration: 12 },
    options: { x: 0, y: 0 },
    staticLayer: layer,
    get t() { return t; },
    update(dt) { t += dt; },
    draw(frame) {
      const p = painterFor(frame);
      p.image(layer.color, layer.w, layer.h, 0, 0, layer.density);
    },
    rewind() { t = 0; },
  };
}

function fallbackTile(index) {
  const frame = newMapTileFrame();
  const mossy = index === 2;
  const sky = hex(mossy ? "#08140f" : index === 0 ? "#203b3a" : "#353948");
  const low = hex(mossy ? "#0e2218" : index === 0 ? "#0d1a20" : "#171b28");
  const floor = hex(mossy ? "#173522" : index === 0 ? "#1d3030" : "#282b38");
  for (let y = 0; y < frame.h; y++) {
    const c = y < frame.h * 0.78 ? sky : y < frame.h * 0.84 ? low : floor;
    frame.color.fill(c, y * frame.w, (y + 1) * frame.w);
  }
  return frame;
}

let hubFallback = null;
let hubAssetCache = null;
let hubAssetPromise = null;

function fallbackHubTiles() {
  if (!hubFallback) {
    hubFallback = hubTiles([fallbackTile(0), fallbackTile(1)]);
  }
  return hubFallback;
}

async function decodeHubAsset(url) {
  if (typeof fetch !== "function" || typeof document === "undefined") return null;
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`hub tile ${response.status}: ${url}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  // Hub PNGs were authored at x2 (640×360). Upscale them into the active frame
  // density so a x4 canvas receives a full 1280×720 tile instead of a quarter
  // sized image in the upper-left corner.
  canvas.width = MAP_TILE_W * MAP_TILE_DENSITY;
  canvas.height = MAP_TILE_H * MAP_TILE_DENSITY;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const bytes = image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength);
  return {
    w: canvas.width,
    h: canvas.height,
    density: MAP_TILE_DENSITY,
    color: new Uint32Array(bytes),
    light: new Uint32Array(canvas.width * canvas.height),
  };
}

function loadHubAssets() {
  if (hubAssetCache) return Promise.resolve(hubAssetCache);
  if (hubAssetPromise) return hubAssetPromise;
  if (typeof document === "undefined" || typeof fetch !== "function") return null;
  hubAssetPromise = Promise.all(HUB_STATIC_ASSETS.map(decodeHubAsset))
    .then((layers) => {
      if (layers.some((layer) => !layer)) return null;
      hubAssetCache = hubTiles(layers);
      return hubAssetCache;
    })
    .catch((error) => {
      console.warn("Ember Echo: hub artwork could not be loaded", error);
      return null;
    });
  return hubAssetPromise;
}

/** Hub strip: return immediately, then replace the fallback with decoded art. */
export function acquireHubMapTiles(currentTiles = null) {
  const cached = hubAssetCache;
  if (cached) {
    if (currentTiles !== cached.mapFxTiles) rewindMaps(cached.mapFxTiles);
    return { ...cached, ready: null };
  }
  const fallback = fallbackHubTiles();
  if (currentTiles !== fallback.mapFxTiles) rewindMaps(fallback.mapFxTiles);
  return { ...fallback, ready: loadHubAssets() };
}

// Every combat stage shares the mossy-ruins backdrop, so they can share one
// baked pair of tiles. Re-baking per stage cost ~2MB and a hitch on each load.
let stageTiles = null;

function stageMapTiles(stage) {
  if (!stageTiles) {
    // A layered map is one continuous scene: both tiles share a seed and each draws
    // the whole window that starts at its world x. Older maps are two seeded scenes.
    const layered = Array.isArray(stage.map.map?.layers);
    const mapFxTiles = [0, MAP_TILE_W].map((x, i) => createFx(stage.map, layered
      ? { x, y: 0, seed: 1, view: { layer: "all", x } }
      : { x, y: 0, seed: 3 + i }));
    stageTiles = { mapFxTiles, mapTileFrames: mapFxTiles.map(() => newMapTileFrame()) };
  }
  return stageTiles;
}

/** Battle stage tiles for `index`; same caching semantics as the hub. */
export function acquireStageMapTiles(index, currentTiles = null) {
  const stage = STAGES[index];
  if (!stage) return null;
  const tiles = stageMapTiles(stage);
  if (currentTiles !== tiles.mapFxTiles) rewindMaps(tiles.mapFxTiles);
  return { index, ...tiles };
}
