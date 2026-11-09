// One battle map tile: 320×180 world units at the configured render density.

import { createFrame, clearFrame, createFx } from "../../../pixelfx/src/core/index.js";
import { RENDER_DENSITY } from "./constants.js";

const MAP_TILE_W = 320;
const MAP_TILE_H = 180;

export class BattleMapTileSim {
  constructor(fxMod, { x = 0, y = 0, seed } = {}) {
    this.opts = { x, y, seed };
    this.frame = createFrame(MAP_TILE_W, MAP_TILE_H, 0, 0, RENDER_DENSITY);
    this.inst = createFx(fxMod, this.opts);
    this.renderInterval = 1 / Math.max(1, fxMod.meta?.fps ?? 30);
    this.renderClock = this.renderInterval;
  }

  rewind() {
    this.inst.rewind?.();
    this.renderClock = this.renderInterval;
  }

  advance(dt) {
    if (dt > 0) this.inst.update(dt);
  }

  tick(dt) {
    this.advance(dt);
    this.renderClock += dt;
    if (this.renderClock < this.renderInterval) return null;
    this.renderClock %= this.renderInterval;
    return this.raster(0);
  }

  raster(dt) {
    this.advance(dt);
    clearFrame(this.frame);
    // Each worker owns a local 320×180 tile. Its world position is applied by the
    // main thread when the tile is blitted into the camera frame; drawing at x=320
    // here would place the second tile entirely outside its own buffer.
    this.inst.options.x = 0;
    this.inst.options.y = 0;
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
