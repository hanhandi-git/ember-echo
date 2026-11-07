import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { STAGES } from "../src/data.js";

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

function tick(g, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) g.tick(1 / 60);
}

test("intro advances into the first fight wave after the banner delay", () => {
  const g = game();
  assert.equal(g.phase, "intro");
  tick(g, 1.2);
  assert.equal(g.phase, "intro");
  tick(g, 0.35);
  assert.equal(g.phase, "fight");
  assert.equal(g.waveIndex, 0);
  assert.ok(g.spawnQueue.length > 0 || g.enemies.length > 0);
});

test("stageClear heals, clears projectiles and opens a portal once", () => {
  const g = game();
  g.phase = "fight";
  g.waveIndex = g.stage.waves.length - 1;
  g.projectiles.push({ dead: false });
  g.spawnQueue.push({ type: "slime", x: 100, y: 120, delay: 1 });
  g.hero.hurt(g, 40);
  g.hero.mp = Math.max(0, g.hero.mp - 30);
  const hpBefore = g.hero.hp;
  const mpBefore = g.hero.mp;
  g.stageClear();
  assert.equal(g.phase, "clear");
  assert.equal(g.projectiles.length, 0);
  assert.equal(g.spawnQueue.length, 0);
  assert.ok(g.hero.hp > hpBefore);
  assert.ok(g.hero.mp > mpBefore);
  assert.ok(g.portal);
  const portalRef = g.portal;
  g.stageClear();
  assert.equal(g.portal, portalRef, "second clear while already in clear is ignored");
});

test("travel phase loads the next stage or ends the run at the exit gate", () => {
  const g = game();
  g.stageClear();
  g.hero.x = g.portal.x - 50;
  g.updatePortal(0.1);
  g.hero.x = g.portal.x;
  g.hero.y = g.portal.y;
  g.portal.t = 1;
  g.updatePortal(0.1);
  assert.equal(g.phase, "travel");
  tick(g, 0.7);
  assert.equal(g.stageIndex, 1);
  assert.equal(g.phase, "intro");

  g.loadStage(STAGES.length - 1);
  g.phase = "travel";
  g.phaseT = 0;
  g.portal = {
    x: 400,
    y: 152,
    exit: true,
    targetStage: STAGES.length,
    t: 1,
    armed: true,
    fx: { update() {} },
  };
  g.updateFlow(0.7);
  assert.equal(g.state, "victory");
});
