// One battle map tile: 320×180 world units at 4× density (shared by main-thread fallback and workers).

import { createFrame, clearFrame, createFx } from "../../../pixelfx/src/core/index.js";
import { RENDER_DENSITY } from "./constants.js";

const MAP_TILE_W = 320;
const MAP_TILE_H = 180;

export class BattleMapTileSim {
  constructor(fxMod, { x = 0, y = 0, seed } = {}) {
    this.opts = { x, y, seed };
    this.frame = createFrame(MAP_TILE_W, MAP_TILE_H, 0, 0, RENDER_DENSITY);
    this.inst = createFx(fxMod, this.opts);
  }

  rewind() {
    this.inst.rewind?.();
  }

  raster(dt) {
    if (dt > 0) this.inst.update(dt);
    clearFrame(this.frame);
    this.inst.options.x = this.opts.x;
    this.inst.options.y = this.opts.y;
    this.inst.draw(this.frame, "back");
    this.inst.draw(this.frame, "front");
    return this.detachBuffers();
  }

  /** Swap frame buffers so the current color/light ArrayBuffers can be transferred off-thread. */
  detachBuffers() {
    const { w, h, density } = this.frame;
    const color = this.frame.color.buffer;
    const light = this.frame.light.buffer;
    this.frame.color = new Uint32Array(w * h);
    this.frame.light = new Uint32Array(w * h);
    return { w, h, density, color, light };
  }
}
