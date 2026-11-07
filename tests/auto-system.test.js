import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { persistSave, loadSave } from "../src/save.js";
import { AUTO_TOGGLE_RECTS } from "../src/controls.js";

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

const store = new Map();
test.beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
});

test("auto battle steers toward the nearest enemy", () => {
  const g = mockGame();
  g.setAutoBattle(true);
  g.spawnEnemy("slime", g.hero.x + 90, g.hero.y);
  for (let i = 0; i < 30; i++) g.tick(1 / 60);
  assert.ok(g.autoMove.x > 0.2);
});

test("auto loot chases pickups when enabled", () => {
  const g = mockGame();
  g.setAutoLoot(true);
  g.pickups.push({ x: g.hero.x + 60, y: g.hero.y, kind: "xp", dead: false, age: 0, fx: { options: {}, update() {} } });
  g.tick(1 / 60);
  assert.ok(g.autoMove.x > 0.2);
});

test("hud auto toggles respond to pointer hits", () => {
  const g = mockGame();
  const r = AUTO_TOGGLE_RECTS.battle;
  assert.ok(g.handlePointer(r.x + 4, r.y + 4));
  assert.equal(g.autoBattle, true);
});

test("auto toggles persist in save profile", () => {
  const g = mockGame();
  g.setAutoBattle(true);
  g.setAutoLoot(true);
  persistSave(g);
  const data = loadSave();
  assert.equal(data.profile.autoBattle, true);
  assert.equal(data.profile.autoLoot, true);
});
