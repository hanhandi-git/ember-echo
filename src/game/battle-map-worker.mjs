/* global self */
// Battle map raster worker — one slot per 320×180 map tile (stage backgrounds).

import { BattleMapTileSim } from "./battle-map-sim.js";
import { MAP_MODULES } from "./map-worker-registry.js";

const slots = new Map();
let chain = Promise.resolve();

function emit(type, msg, buffers) {
  const transfer = buffers ? [buffers.color, buffers.light] : [];
  self.postMessage({ type, ...msg, ...buffers }, transfer);
}

self.onmessage = (event) => {
  const msg = event.data;
  chain = chain.then(() => handle(msg)).catch((err) => {
    self.postMessage({ type: "error", slot: msg.slot, gen: msg.gen, message: String(err?.message ?? err) });
  });
};

function slotOrThrow(slot) {
  const sim = slots.get(slot);
  if (!sim) throw new Error(`battle map worker: unknown slot ${slot}`);
  return sim;
}

function handle(msg) {
  if (msg.type === "dispose") {
    slots.delete(msg.slot);
    self.postMessage({ type: "disposed", slot: msg.slot, gen: msg.gen });
    return;
  }
  if (msg.type === "init") {
    const mod = MAP_MODULES[msg.mapKey];
    if (!mod) throw new Error(`unknown map key ${msg.mapKey}`);
    slots.set(
      msg.slot,
      new BattleMapTileSim(mod, { x: msg.x ?? 0, y: msg.y ?? 0, seed: msg.seed }),
    );
    const out = slotOrThrow(msg.slot).raster(0);
    emit("ready", { slot: msg.slot, gen: msg.gen }, out);
    return;
  }
  if (msg.type === "rewind") {
    const sim = slots.get(msg.slot);
    if (!sim) {
      self.postMessage({ type: "idle", slot: msg.slot, gen: msg.gen });
      return;
    }
    sim.rewind();
    emit("frame", { slot: msg.slot, gen: msg.gen }, sim.raster(0));
    return;
  }
  if (msg.type === "tick") {
    const sim = slots.get(msg.slot);
    if (!sim) {
      self.postMessage({ type: "idle", slot: msg.slot, gen: msg.gen });
      return;
    }
    emit("frame", { slot: msg.slot, gen: msg.gen }, sim.raster(msg.dt ?? 0));
    return;
  }
}
