import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";

function game() {
  const g = new Game({
    getContext: () => ({
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData() {},
    }),
  });
  g.startRun();
  g.state = "playing";
  g.phase = "fight";
  return g;
}

function tick(g, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) g.tick(1 / 60);
}

test("after() schedules callbacks that fire on later ticks", () => {
  const g = game();
  let n = 0;
  g.after(0.05, () => { n++; });
  tick(g, 0.03);
  assert.equal(n, 0);
  tick(g, 0.05);
  assert.equal(n, 1);
});

test("paused and inventory ticks do not advance run timers or scheduled callbacks", () => {
  const g = game();
  let fired = false;
  g.after(0.02, () => { fired = true; });
  const run0 = g.runTime;
  g.togglePause();
  tick(g, 0.5);
  assert.equal(fired, false);
  assert.equal(g.runTime, run0);
  g.togglePause();
  g.state = "inventory";
  tick(g, 0.5);
  assert.equal(fired, false);
});

test("combo count resets when the combo timer expires", () => {
  const g = game();
  g.combo = { count: 12, timer: 0.15 };
  tick(g, 0.2);
  assert.equal(g.combo.count, 0);
});

test("dash trails expire and dodge trails track the hero while moving", () => {
  const g = game();
  g.dashTrails.push({ kind: "quick", t: 0, life: 0.1, from: { x: 0, y: 0 }, to: { x: 10, y: 0 }, body: { n: 1 } });
  g.dashTrails.push({ kind: "dodge", t: 0, life: 0.5, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } });
  const x0 = g.hero.x;
  g.hero.x += 8;
  tick(g, 0.12);
  assert.equal(g.dashTrails.length, 1);
  assert.equal(g.dashTrails[0].kind, "dodge");
  assert.equal(g.dashTrails[0].to.x, x0 + 8);
});
