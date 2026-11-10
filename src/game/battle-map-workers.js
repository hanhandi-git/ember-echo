// Offloads procedural battle map tiles to Web Workers (pixelfx gallery pattern).
// Layered maps get one slot per layer tile: static layers are rasterized once, animated
// ones at their own rate, and each is scrolled at its own parallax when drawn.

import { createFx } from "../../../pixelfx/src/core/index.js";
import { planMapSlots } from "./depth.js";

const MAP_TILE_W = 320;
const SLOTS_PER_STAGE = 16;

function workerPoolSize() {
  if (typeof navigator === "undefined") return 0;
  const hw = navigator.hardwareConcurrency || 4;
  return Math.min(4, Math.max(2, hw - 1));
}

class BattleMapWorkerPool {
  constructor(workerUrl) {
    const n = workerPoolSize();
    this.n = n;
    this.workers = [];
    this.pending = new Map();
    this.gen = 0;
    this.tails = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      const w = new Worker(workerUrl, { type: "module" });
      w.onmessage = (e) => this._onMessage(e.data);
      w.onerror = (e) => console.warn("battle-map-worker", e.message ?? e);
      this.workers.push(w);
    }
  }

  workerFor(slot) {
    return this.workers[((slot % this.n) + this.n) % this.n];
  }

  _onMessage(data) {
    if (data.type === "disposed") return;
    const job = this.pending.get(`${data.slot}:${data.gen}`);
    if (!job) return;
    this.pending.delete(`${data.slot}:${data.gen}`);
    if (data.type === "error") job.reject(new Error(data.message ?? "worker error"));
    else job.resolve(data);
  }

  _send(worker, payload) {
    const gen = ++this.gen;
    return new Promise((resolve, reject) => {
      this.pending.set(`${payload.slot}:${gen}`, { resolve, reject });
      worker.postMessage({ ...payload, gen });
    });
  }

  _enqueue(slot, task) {
    const w = this.workerFor(slot);
    const i = this.workers.indexOf(w);
    const run = () => task(w).catch((err) => {
      console.warn("battle-map-worker task", err);
      throw err;
    });
    const prev = this.tails[i] ?? Promise.resolve();
    const next = prev.then(run, run);
    this.tails[i] = next.catch(() => {});
    return next;
  }

  init(slot, mapKey, seed, x, extra = {}) {
    return this._enqueue(slot, (w) => this._send(w, { type: "init", slot, mapKey, seed, x, y: 0, ...extra }));
  }

  tick(slot, dt) {
    return this._enqueue(slot, (w) => this._send(w, { type: "tick", slot, dt }));
  }

  rewind(slot) {
    return this._enqueue(slot, (w) => this._send(w, { type: "rewind", slot }));
  }

  dispose(slot) {
    return this._enqueue(slot, (w) => this._send(w, { type: "dispose", slot }));
  }
}

function workerUrl() {
  if (typeof import.meta === "undefined" || !import.meta.url) return null;
  return new URL("./battle-map-worker.js", import.meta.url);
}

function applyRaster(slot, data) {
  if (!data?.color || !data?.light) return;
  slot.tile = {
    w: data.w,
    h: data.h,
    density: data.density,
    color: new Uint32Array(data.color),
    light: new Uint32Array(data.light),
  };
  if (slot.static) {
    // Remember which rows hold pixels so a sparse layer skips its empty rows when drawn.
    const { w, h, color, light } = slot.tile, rows = new Uint8Array(h);
    for (let y = 0; y < h; y++) {
      for (let i = y * w, end = i + w; i < end; i++) if (color[i] || (light[i] & 0xffffff)) { rows[y] = 1; break; }
    }
    slot.tile.rows = rows;
  }
  slot.ready = true;
}

export function createBattleMapWorkers(game) {
  const idle = {
    mountStage() { return false; },
    prepareStage() {},
    unmount() {},
    tick() {},
    tickMap() { return false; },
    drawMap() { return false; },
    drawMapFront() { return false; },
    rewind() {},
    get active() { return false; },
    get available() { return false; },
    get ownsMapAnimation() { return false; },
  };

  if (typeof Worker === "undefined" || typeof window === "undefined") return idle;

  let pool = null;
  let slots = [];
  let activeStageIndex = -1;
  let activeMapKey = null;
  const prepared = new Map();
  let active = false;
  let disabled = false;
  let live = [];

  function ensurePool() {
    if (pool || disabled) return pool;
    const url = workerUrl();
    if (!url) {
      disabled = true;
      return null;
    }
    try {
      pool = new BattleMapWorkerPool(url);
    } catch (err) {
      console.warn("Ember Echo: battle map workers disabled", err);
      disabled = true;
    }
    return pool;
  }

  function disposeSlots(list) {
    if (!pool) return;
    for (const s of list) pool.dispose(s.id).catch(() => {});
  }

  function createSlots(stageIndex, mapModule) {
    return planMapSlots(mapModule?.map, game.worldW ?? 480, MAP_TILE_W).map((plan, n) => ({
      ...plan,
      id: stageIndex * SLOTS_PER_STAGE + n + 1,
      ready: false,
      started: false,
      busy: false,
      tile: null,
    }));
  }

  function initSlots(list, mapKey, stageIndex) {
    for (const slot of list) {
      if (slot.started) continue;
      slot.started = true;
      // Layers of one scene must agree across tiles; legacy tiles are separate seeded scenes.
      const seed = slot.layer ? 1 : 3 + stageIndex + slot.tileIndex;
      const extra = slot.layer ? { view: { layer: slot.layer, x: slot.x }, fps: slot.fps, still: slot.static } : {};
      pool.init(slot.id, mapKey, seed, slot.x, extra)
        .then((res) => applyRaster(slot, res))
        .catch(() => { slot.ready = false; slot.started = false; });
    }
  }

  /** Cheap layers (drifting motes, fireflies) are drawn here, on the host, every frame. */
  function createLive(mapModule) {
    return (mapModule?.map?.layers ?? []).filter((layer) => layer.live).map((layer) => ({
      parallax: layer.parallax ?? 1,
      front: !!layer.front,
      fx: createFx(mapModule, { x: 0, y: 0, seed: 1, view: { layer: layer.id, x: 0 } }),
    }));
  }

  function drawLayers(frame, front) {
    let drew = false;
    for (const slot of slots) {
      if (slot.front !== front || !slot.tile) continue;
      // A layer that follows only part of the camera travel is shifted back by the rest.
      const worldX = slot.x + frame.ox * (1 - slot.parallax);
      if (slot.opaque) game.blitStaticMapTile(frame, slot.tile, worldX);
      else game.blitMapTile(frame, slot.tile, worldX);
      drew = true;
    }
    for (const layer of live) {
      if (layer.front !== front) continue;
      layer.fx.options.x = frame.ox * (1 - layer.parallax);
      layer.fx.draw(frame);
      drew = true;
    }
    return drew;
  }

  function unmount() {
    active = false;
    activeStageIndex = -1;
    activeMapKey = null;
    live = [];
    disposeSlots(slots);
    slots = [];
    for (const list of prepared.values()) disposeSlots(list);
    prepared.clear();
  }

  return {
    get active() { return active; },
    get available() { return !disabled; },
    get ownsMapAnimation() { return active && slots.length > 0 && slots.every((s) => s.ready && s.tile); },

    prepareStage(stageIndex, mapKey, mapModule) {
      if (stageIndex < 0 || !mapKey || disabled || activeStageIndex === stageIndex || prepared.has(stageIndex)) return;
      // Every combat stage uses the same backdrop, so an active raster for the
      // same map key can serve the next stage without a re-bake.
      if (active && activeMapKey === mapKey) return;
      const p = ensurePool();
      if (!p) return;
      for (const [index, list] of prepared) {
        if (index === stageIndex) continue;
        disposeSlots(list);
        prepared.delete(index);
      }
      const next = createSlots(stageIndex, mapModule);
      prepared.set(stageIndex, next);
      initSlots(next, mapKey, stageIndex);
    },

    mountStage(stageIndex, mapKey, mapModule) {
      if (stageIndex < 0 || !mapKey) return false;
      const p = ensurePool();
      if (!p) return false;

      if (activeStageIndex === stageIndex && active) return true;
      if (active && activeMapKey === mapKey) {
        activeStageIndex = stageIndex;
        return true;
      }
      disposeSlots(slots);
      slots = prepared.get(stageIndex) ?? createSlots(stageIndex, mapModule);
      live = createLive(mapModule);
      prepared.delete(stageIndex);
      activeStageIndex = stageIndex;
      activeMapKey = mapKey;
      active = true;
      if (!slots.every((slot) => slot.ready && slot.tile)) initSlots(slots, mapKey, stageIndex);
      return true;
    },

    unmount,

    rewind() {
      if (!active || !pool) return;
      for (const layer of live) layer.fx.rewind?.();
      for (const slot of slots) {
        if (slot.static) continue;
        pool.rewind(slot.id)
          .then((res) => { if (res?.type === "frame") applyRaster(slot, res); })
          .catch(() => {});
      }
    },

    tick(dt) {
      if (!active || !pool) return;
      for (const layer of live) layer.fx.update(dt);
      for (const slot of slots) {
        if (slot.busy || slot.static) continue;
        slot.busy = true;
        pool.tick(slot.id, dt)
          .then((res) => {
            if (res?.type === "frame") applyRaster(slot, res);
          })
          .catch(() => {})
          .finally(() => { slot.busy = false; });
      }
    },

    /** Returns true when workers consumed the map clock (skip main-thread mapFx update). */
    tickMap(dt, scale = 1) {
      if (!this.ownsMapAnimation) return false;
      this.tick(dt * scale);
      return true;
    },

    drawMap(frame) {
      if (!this.ownsMapAnimation) return false;
      drawLayers(frame, false);
      return true;
    },

    /** Layers that belong over the units; call after the fight has been drawn. */
    drawMapFront(frame) {
      if (!this.ownsMapAnimation) return false;
      return drawLayers(frame, true);
    },
  };
}
