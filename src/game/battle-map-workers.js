// Offloads procedural battle map tiles to Web Workers (pixelfx gallery pattern).

const MAP_TILE_W = 320;

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

  init(slot, mapKey, seed, x) {
    return this._enqueue(slot, (w) => this._send(w, { type: "init", slot, mapKey, seed, x, y: 0 }));
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
  slot.ready = true;
}

export function createBattleMapWorkers(game) {
  const idle = {
    mountStage() { return false; },
    unmount() {},
    tick() {},
    tickMap() { return false; },
    drawMap() { return false; },
    rewind() {},
    get active() { return false; },
    get ownsMapAnimation() { return false; },
  };

  if (typeof Worker === "undefined" || typeof window === "undefined") return idle;

  let pool = null;
  let slots = [];
  let active = false;
  let disabled = false;

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

  function unmount() {
    active = false;
    if (pool) {
      for (const s of slots) pool.dispose(s.id).catch(() => {});
    }
    slots = [];
  }

  return {
    get active() { return active; },
    get ownsMapAnimation() { return active && slots.length > 0 && slots.every((s) => s.ready && s.tile); },

    mountStage(stageIndex, mapKey) {
      unmount();
      if (stageIndex < 0 || !mapKey) return false;
      const p = ensurePool();
      if (!p) return false;

      const xs = [0, MAP_TILE_W];
      const seeds = xs.map((x) => 3 + stageIndex + x / MAP_TILE_W);
      slots = xs.map((x, tileIndex) => ({
        id: stageIndex * 2 + tileIndex + 1,
        tileIndex,
        ready: false,
        busy: false,
        tile: null,
      }));
      active = true;

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        p.init(slot.id, mapKey, seeds[i], xs[i])
          .then((res) => applyRaster(slot, res))
          .catch(() => { slot.ready = false; });
      }
      return true;
    },

    unmount,

    rewind() {
      if (!active || !pool) return;
      for (const slot of slots) {
        pool.rewind(slot.id)
          .then((res) => { if (res?.type === "frame") applyRaster(slot, res); })
          .catch(() => {});
      }
    },

    tick(dt) {
      if (!active || !pool) return;
      for (const slot of slots) {
        if (slot.busy) continue;
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
      for (const slot of slots) {
        if (!slot.tile) return false;
        game.blitStaticMapTile(frame, slot.tile, slot.tileIndex * MAP_TILE_W);
      }
      return true;
    },
  };
}
