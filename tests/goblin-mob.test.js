import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { ENEMY_TYPES } from "../src/data.js";
import { createFrame, createFx } from "../../pixelfx/src/core/index.js";

const goblins = Object.keys(ENEMY_TYPES).filter((id) => id.startsWith("goblin-"));

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

test("all five goblins step only during voluntary movement and retain their gait phase", () => {
  for (const id of goblins) {
    const g = mockGame(); g.hero.x = 400; g.hero.y = 150;
    const e = g.spawnEnemy(id, 100, 150, { seed: 1 });
    e.setState(g, "chase"); e.atkCd = 999;
    e.update(g, 0.1);
    assert.equal(e.poseState, "walk", id);
    assert.equal(e.fx.options.pose, "walk", id);
    assert.ok(e.walkDistance > 0);
    const phase = e.walkDistance;
    g.hero.x = e.x + 15;
    e.update(g, 0.1);
    assert.equal(e.poseState, "idle", id);
    assert.equal(e.fx.options.walkDistance, undefined);
    assert.equal(e.walkDistance, phase);
    g.hero.x = 400;
    e.update(g, 0.1);
    assert.ok(e.walkDistance > phase);
  }
});

test("slow changes foot travel while freeze, hit reactions and attack windups stop stepping", () => {
  const g = mockGame(); g.hero.x = 400; g.hero.y = 150;
  const a = g.spawnEnemy("goblin-warrior", 100, 150), b = g.spawnEnemy("goblin-warrior", 200, 150);
  for (const e of [a, b]) { e.setState(g, "chase"); e.atkCd = 999; }
  b.slow = 1;
  a.update(g, 0.1); b.update(g, 0.1);
  assert.ok(Math.abs(b.walkDistance * 2 - a.walkDistance) < 1e-8);
  for (const key of ["freeze", "stun", "hitStun"]) {
    const distance = a.walkDistance;
    a[key] = 1; a.update(g, 0.1);
    assert.notEqual(a.fx.options.pose, "walk", key);
    assert.equal(a.walkDistance, distance);
    a[key] = 0;
  }
  a.update(g, 0.1);
  assert.equal(a.fx.options.pose, "walk");
  a.setState(g, "windup"); a.update(g, 0.01);
  assert.equal(a.fx.options.pose, "cast");
  assert.equal(a.fx.options.walkDistance, undefined);
});

test("moving the walk clock changes actual foot pixels for every goblin class", () => {
  const footPixels = (id, pose, distance) => {
    const frame = createFrame(96, 108, 0, 0, 2);
    createFx(ENEMY_TYPES[id].mod, { x: 48, y: 92, seed: 1, pose, walkDistance: distance }).draw(frame, "front");
    return frame.color.slice(84 * 2 * frame.w, 96 * 2 * frame.w);
  };
  for (const id of goblins) {
    assert.deepEqual(footPixels(id, "idle", 2), footPixels(id, "idle", 7), `${id}: idle ignores distance`);
    assert.notDeepEqual(footPixels(id, "walk", 2), footPixels(id, "walk", 7), `${id}: toes and knees move`);
  }
});
