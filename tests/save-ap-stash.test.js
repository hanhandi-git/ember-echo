import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import {
  SAVE_KEY,
  SAVE_VERSION,
  QUICK_MOVE_AP_COST,
  persistSave,
  loadSave,
  canContinue,
  applyHeroProfile,
} from "../src/save.js";

function mockGame() {
  return new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
  }) });
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

test("quick move spends AP and blocks when empty", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  g.state = "playing";
  g.phase = "fight";
  g.keys.add("d");
  const before = g.hero.ap;
  assert.ok(g.hero.tryQuickMove(g));
  assert.equal(g.hero.ap, before - QUICK_MOVE_AP_COST);
  g.hero.ap = 0;
  assert.equal(g.hero.tryQuickMove(g), false);
});

test("stash and profile persist in localStorage", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  g.hero.addStash("spirit-stone", 2);
  g.hero.equipWeapon(g.hero.meleeWeaponId);
  persistSave(g);
  const data = loadSave();
  assert.equal(data.v, SAVE_VERSION);
  assert.equal(data.profile.stash["spirit-stone"], 2);

  const g2 = mockGame();
  applyHeroProfile(g2.hero, data.profile);
  assert.equal(g2.hero.stashCount("spirit-stone"), 2);
});

test("active run can be resumed from save", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  g.phase = "fight";
  g.waveIndex = 1;
  g.hero.hp = 77;
  persistSave(g);
  assert.ok(canContinue(loadSave()));

  const g2 = mockGame();
  g2.startRun();
  assert.equal(g2.hero.hp, 77);
  assert.equal(g2.waveIndex, 1);
  assert.equal(g2.phase, "fight");
});

test("save uses ember-echo-save key", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  persistSave(g);
  assert.ok(store.has(SAVE_KEY));
});
