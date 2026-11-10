import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { SKILL_META } from "../src/data.js";

function mockGame() {
  const g = new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
  }) });
  g.startRun({ fresh: true });
  g.phase = "fight";
  g.state = "playing";
  return g;
}

function advance(g, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) g.tick(1 / 60);
}

test("pixelfx act spells drive hero pose and forward movement", () => {
  const chidori = SKILL_META.find((s) => s.id === "fx:ninjutsu/chidori-rush");
  assert.ok(chidori?.module?.act, "chidori rush should export act data");
  const g = mockGame();
  g.hero.setClass("mage");
  g.hero.skillSlots[0] = chidori.id;
  g.hero.mp = 200;
  g.spawnEnemy("slime", g.hero.x + 140, g.hero.y);
  const x0 = g.hero.x;
  assert.ok(g.cast(chidori.id));
  advance(g, 0.12);
  assert.ok(g.hero.actPose, "charge pose should be active");
  advance(g, 1.05);
  assert.ok(g.hero.x > x0 + 24, "dash should displace the hero");
  advance(g, 2.5);
  assert.equal(g.hero.actPose, null, "pose override clears when the act ends");
});

test("chidori rush damages enemies along the dash path", () => {
  const chidori = SKILL_META.find((s) => s.id === "fx:ninjutsu/chidori-rush");
  const g = mockGame();
  g.hero.setClass("mage");
  g.hero.skillSlots[0] = chidori.id;
  g.hero.mp = 200;
  const hx = g.hero.x, hy = g.hero.y;
  const mid = g.spawnEnemy("slime", hx + 55, hy);
  const far = g.spawnEnemy("slime", hx + 120, hy);
  g.hero.facing = 1;
  advance(g, 0.5);
  assert.ok(g.cast(chidori.id));
  advance(g, 1.6);
  assert.ok(!mid.alive, "enemy on the dash lane should be hit while rushing");
  assert.ok(!far.alive, "enemy further along the path should be hit before the end frame");
});
