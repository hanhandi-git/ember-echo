import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";

function arena() {
  const g = new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {},
  }) });
  g.startRun({ fresh: true });
  g.phase = "fight";
  g.hold = 999;
  g.spawnQueue = [];
  g.mapFxTiles = [];
  return g;
}

function target(g, type = "slime", dx = 30) {
  const e = g.spawnEnemy(type, g.hero.x + dx, g.hero.y);
  e.state = "chase";
  e.hp = e.maxHp = e.damageHp = 1000;
  e.speed = 0;
  e.atkCd = 999;
  return e;
}

function advance(g, seconds) {
  for (let t = 0; t < seconds - 1e-8; t += 1 / 120) g.tick(1 / 120);
}

test("the finisher deals damage at the release, not during its windup", () => {
  const g = arena(), e = target(g);
  g.hero.comboIndex = 2;
  g.hero.comboTimer = 1;
  assert.ok(g.cast("j"));
  advance(g, 0.12);
  assert.equal(e.hp, e.maxHp);
  advance(g, 0.08);
  assert.ok(e.hp < e.maxHp);
  assert.equal(g.combo.count, 1);
});

test("a queued attack survives hit-stop and executes once when recovery ends", () => {
  const g = arena(), e = target(g);
  g.hero.cd.j = 0.08;
  g.hitStop = 0.06;
  assert.equal(g.cast("j"), false);
  const buffer = g.hero.attackBuffer;
  advance(g, 0.05);
  assert.equal(g.hero.attackBuffer, buffer);
  assert.equal(e.hp, e.maxHp);
  advance(g, 0.5);
  assert.ok(e.hp < e.maxHp);
  assert.equal(g.combo.count, 1);
});

test("holding the mapped slash key chains attacks and releasing ends the string", () => {
  const g = arena();
  target(g);
  g.keys.add("j");
  advance(g, 1.25);
  assert.ok(g.combo.count >= 3);
  g.keys.clear();
  advance(g, 0.5);
  const count = g.combo.count;
  advance(g, 0.5);
  assert.equal(g.combo.count, count);
});

test("dodge cancels a pending melee hit and clears hit-stop immediately", () => {
  const g = arena(), e = target(g);
  g.cast("j");
  g.hitStop = 0.04;
  assert.ok(g.hero.tryDash(g, { x: -1, y: 0 }));
  assert.equal(g.hitStop, 0);
  advance(g, 0.3);
  assert.equal(e.hp, e.maxHp, "the cancelled attack cannot hit from its timer");
  assert.equal(g.hero.melee, null);
});

test("a tap during the start of a dodge buffers into a dash attack", () => {
  const g = arena();
  target(g, "slime", 45);
  g.hero.tryDash(g, { x: 1, y: 0 });
  assert.equal(g.cast("j"), false);
  advance(g, 0.23);
  assert.ok(g.hero.anim.kind.startsWith("attack"));
  assert.equal(g.hero.comboIndex, 1);
  advance(g, 0.12);
  assert.ok(g.combo.count > 0);
});

test("a hit interrupts a mob windup, removes its attack cue and prevents a delayed counterhit", () => {
  const g = arena(), e = target(g, "goblin-warrior", 15);
  e.setState(g, "windup");
  const cue = e.attackFx;
  assert.ok(g.effects.some((ef) => ef.inst === cue));
  e.hurt(g, 1, { crit: false, impact: "heavy" });
  assert.equal(e.state, "chase");
  assert.ok(e.hitStun > 0);
  assert.ok(!g.effects.some((ef) => ef.inst === cue));
  const hp = g.hero.hp;
  advance(g, 0.2);
  assert.equal(g.hero.hp, hp);

  const slime = target(g, "slime", 12);
  slime.strike(g);
  slime.hurt(g, 1, { crit: false, impact: "heavy" });
  advance(g, 0.2);
  assert.equal(g.hero.hp, hp, "an already scheduled strike is invalidated by the hit");
});

test("damage over time does not knock enemies back or interrupt their windup", () => {
  const g = arena(), e = target(g);
  e.setState(g, "windup");
  e.vx = 0;
  e.hurt(g, 2, { crit: false, dot: true, silent: true });
  assert.equal(e.state, "windup");
  assert.equal(e.vx, 0);
  assert.equal(e.hitStun, 0);
  assert.equal(g.hitStop, 0);
});

test("a finisher sweeps a group while a light cut stops at the nearest target", () => {
  const g = arena();
  const targets = [24, 33, 42].map((dx) => target(g, "slime", dx));
  g.cast("j");
  advance(g, 0.1);
  assert.equal(targets.filter((e) => e.hp < e.maxHp).length, 1);
  advance(g, 0.3);
  for (let i = 0; i < targets.length; i++) { targets[i].x = g.hero.x + 20 + i * 9; targets[i].prevX = targets[i].x; targets[i].hp = targets[i].maxHp; }
  g.hero.comboIndex = 2;
  g.hero.comboTimer = 1;
  g.cast("j");
  advance(g, 0.2);
  assert.equal(targets.filter((e) => e.hp < e.maxHp).length, 3);
  assert.ok(g.hitStop < 0.1, "crowd hits share a bounded pause");
});

test("fireballs explode once and blast weapons damage their direct target once", () => {
  const g = arena(), e = target(g);
  const fx = { options: {}, update() {}, stop() {} };
  const fireball = { x: e.x, y: e.y - 10, vx: 0, vy: 0, r: 8, life: 1, fx, team: "hero", kind: "fireball", dmg: 5 };
  g.projectiles.push(fireball);
  g.updateProjectiles(1 / 60);
  const hp = e.hp;
  assert.ok(hp < e.maxHp);
  assert.equal(g.projectiles.length, 0);
  g.updateProjectiles(1 / 60);
  assert.equal(e.hp, hp);
  g.resolveWeaponProjectileHit({ x: e.x, y: e.y, vx: 100, vy: 0, blastRadius: 25, dmg: 7, crit: false, fx }, e);
  assert.equal(e.hp, hp - 7);
});

test("dying mobs cannot be hit again and stage changes discard combat feedback", () => {
  const g = arena(), e = target(g, "goblin-warrior");
  e.hp = 1;
  e.hurt(g, 5, { crit: false });
  assert.equal(e.state, "dying");
  assert.equal(e.alive, false);
  const combo = g.combo.count;
  assert.equal(e.hurt(g, 5), 0);
  assert.equal(g.combo.count, combo);
  assert.ok(g.impacts.length);
  g.loadStage(0);
  assert.equal(g.impacts.length, 0);
  assert.equal(g.hitStop, 0);
  assert.equal(g.hero.attackBuffer, 0);
});

test("a rejected skill does not interrupt the current act or pending melee", () => {
  const g = arena();
  target(g);
  g.cast("j");
  const melee = g.hero.melee;
  g.hero.mp = 0;
  assert.equal(g.cast("o"), false);
  assert.equal(g.hero.melee, melee);
  assert.equal(melee.cancelled, false);
});

test("boss hits retain the current attack and protected phases do not report false contacts", () => {
  const g = arena(), boss = g.spawnEnemy("boss", g.hero.x + 35, g.hero.y);
  boss.state = "windup";
  boss.phaseLock = 0;
  boss.hurt(g, 2, { crit: false, impact: "heavy", knock: 100 });
  assert.equal(boss.state, "windup");
  assert.ok(Math.abs(boss.vx) <= 12);
  assert.ok(g.impacts.length > 0);
  assert.ok(g.impacts.every((impact) => Number.isFinite(impact.x) && Number.isFinite(impact.y)), "boss and mob geometry both yield drawable impact coordinates");
  boss.phaseLock = 1;
  const combo = g.combo.count;
  const contacts = g.impacts.length;
  assert.equal(g.hitEnemies(() => true, { dmg: 10, crit: false }), 0);
  assert.equal(g.combo.count, combo);
  assert.equal(g.impacts.length, contacts);
});

test("pause discards queued and held attacks without advancing recovery", () => {
  const g = arena();
  target(g);
  g.hero.cd.j = 0.08;
  g.cast("j");
  g.keys.add("j");
  g.togglePause();
  advance(g, 0.3);
  assert.equal(g.hero.cd.j, 0.08);
  assert.equal(g.hero.attackBuffer, 0);
  assert.equal(g.keys.size, 0);
  g.togglePause();
  advance(g, 0.3);
  assert.equal(g.combo.count, 0);
});
