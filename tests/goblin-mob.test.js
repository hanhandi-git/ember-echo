import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { ENEMY_TYPES } from "../src/data.js";

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

test("goblin mob windup spawns attack fx without throwing", () => {
  const g = mockGame();
  const e = g.spawnEnemy("goblin-warrior", g.hero.x + 40, g.hero.y);
  let threw = false;
  try {
    e.setState(g, "windup");
    for (let i = 0; i < 90; i++) e.update(g, 1 / 60);
  } catch (err) {
    threw = err;
  }
  assert.equal(threw, false);
  assert.ok(g.effects.length > 0, "attack effect should spawn on windup");
  assert.ok(ENEMY_TYPES["goblin-warrior"].mobReact, "goblin has mob react data");
});
