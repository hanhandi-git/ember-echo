import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lerp,
  mixPoint,
  hurtbox,
  sweepBox,
  sweepEntity,
  projectileSweep,
  sweepBlade,
} from "../src/collision.js";
import { COMBAT_SCALE } from "../src/combat-scale.js";

test("lerp and mixPoint interpolate every axis", () => {
  assert.equal(lerp(10, 30, 0.25), 15);
  assert.deepEqual(mixPoint({ x: 0, y: 0, depth: 0 }, { x: 4, y: 8, depth: 2 }, 0.5), {
    x: 2,
    y: 4,
    depth: 1,
  });
});

test("sweepBox returns null when the segment never enters the expanded box", () => {
  const box = { x: 50, y: 50, depth: 50, hx: 5, hy: 5, hd: 5 };
  const hit = sweepBox({ x: 0, y: 50, depth: 50 }, { x: 40, y: 50, depth: 50 }, box, box, 0);
  assert.equal(hit, null);
});

test("sweepBox reports zero for a segment that starts inside the target", () => {
  const box = { x: 50, y: 50, depth: 50, hx: 10, hy: 10, hd: 10 };
  const hit = sweepBox({ x: 50, y: 50, depth: 50 }, { x: 80, y: 50, depth: 50 }, box, box, 2);
  assert.equal(hit, 0);
});

test("hurtbox scales critters with combatScale but keeps boss proportions separate", () => {
  const mob = {
    x: 100,
    y: 120,
    prevX: 96,
    prevY: 120,
    w: 12,
    barH: 20,
    combatScale: COMBAT_SCALE,
    baseBarH: 20,
  };
  const box = hurtbox(mob, 1);
  assert.ok(box.hx > 0 && box.hx < 12);
  const boss = {
    x: 100,
    y: 120,
    prevX: 100,
    prevY: 120,
    boss: true,
    combatScale: COMBAT_SCALE,
  };
  const bossBox = hurtbox(boss);
  assert.equal(bossBox.hx, 14 * COMBAT_SCALE);
});

test("projectileSweep hits a crossing enemy between two sample points", () => {
  const enemy = {
    x: 130,
    y: 100,
    prevX: 126,
    prevY: 100,
    w: 12,
    barH: 20,
    combatScale: COMBAT_SCALE,
  };
  const hit = projectileSweep({ x: 100, y: 100 }, { x: 160, y: 100 }, enemy, 3);
  assert.ok(hit);
  assert.ok(hit.t > 0 && hit.t < 1);
  assert.equal(hit.entity, enemy);
});

test("sweepBlade chooses the earliest contact along the blade capsule", () => {
  const enemy = {
    x: 118,
    y: 100,
    prevX: 118,
    prevY: 100,
    w: 10,
    barH: 18,
    combatScale: COMBAT_SCALE,
  };
  const blade0 = { root: { x: 90, y: 100, depth: 100 }, tip: { x: 140, y: 100, depth: 100 } };
  const blade1 = { root: { x: 92, y: 100, depth: 100 }, tip: { x: 142, y: 100, depth: 100 } };
  const hit = sweepBlade(blade0, blade1, enemy, 4, 0, 1);
  assert.ok(hit);
  assert.ok(typeof hit.along === "number");
  const lateEnemy = { ...enemy, x: 200, prevX: 200 };
  assert.equal(sweepEntity(blade0.root, blade1.tip, lateEnemy, 4), null);
});
