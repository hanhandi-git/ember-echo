import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { STAGES } from "../src/data.js";
import { GATE_PALETTES } from "../src/fx/stage-portal.js";

function game() {
  const g = new Game({
    getContext: () => ({
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
    }),
  });
  g.startRun();
  return g;
}

test("openPortal picks palette and labels for normal, final and exit gates", () => {
  const g = game();
  g.stageIndex = 0;
  g.openPortal();
  assert.equal(g.portal.finalGate, false);
  assert.equal(g.portal.exit, false);
  assert.deepEqual(g.portal.fx.options.palette, GATE_PALETTES.normal);

  g.portal = null;
  g.stageIndex = STAGES.length - 2;
  g.openPortal();
  assert.equal(g.portal.finalGate, true);
  assert.deepEqual(g.portal.fx.options.palette, GATE_PALETTES.final);

  g.portal = null;
  g.stageIndex = STAGES.length - 1;
  g.openPortal();
  assert.equal(g.portal.exit, true);
  assert.deepEqual(g.portal.fx.options.palette, GATE_PALETTES.exit);
});

test("portal entry requires arming, depth overlap and reveal time", () => {
  const g = game();
  g.phase = "clear";
  g.hero.x = g.worldW - 70;
  g.hero.y = 152;
  g.openPortal();
  assert.equal(g.portal.armed, false, "starts disarmed when the hero stands on the gate");
  g.hero.x = g.portal.x - 60;
  g.updatePortal(0.05);
  assert.equal(g.portal.armed, true);
  g.hero.x = g.portal.x;
  g.hero.y = g.portal.y;
  g.portal.t = 0.5;
  g.updatePortal(0.05);
  assert.equal(g.phase, "clear", "needs reveal time before travel");
  g.portal.t = 1;
  g.updatePortal(0.05);
  assert.equal(g.phase, "travel");
  g.enterPortal();
  assert.equal(g.phase, "travel", "enterPortal is idempotent once travelling");
});
