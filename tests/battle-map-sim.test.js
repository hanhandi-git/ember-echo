import { test } from "node:test";
import assert from "node:assert/strict";
import { BattleMapTileSim } from "../src/game/battle-map-sim.js";
import { RENDER_DENSITY } from "../src/game/constants.js";

test("worker map tiles render in local coordinates regardless of world placement", () => {
  const map = {
    meta: { size: [320, 180], duration: 1, loop: true, options: {} },
    create() {
      return { draw(p) { p.dot(1, 1, 0xffffffff); } };
    },
  };
  const sim = new BattleMapTileSim(map, { x: 320, seed: 1 });
  const raster = sim.raster(0);
  assert.ok(new Uint32Array(raster.color).some(Boolean));
  assert.equal(raster.w, 320 * RENDER_DENSITY);
  assert.equal(raster.h, 180 * RENDER_DENSITY);
});
