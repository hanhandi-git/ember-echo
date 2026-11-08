import { test } from "node:test";
import assert from "node:assert/strict";
import { createFx, createFrame, clearFrame, posed } from "../../pixelfx/src/core/index.js";
import { WEAPONS } from "../src/data.js";
import { Hero } from "../src/hero.js";
import { Game } from "../src/game.js";
import { meleeBeat } from "../src/combat-feel.js";
import { meleeArt, meleeFamily, meleePoseTrack, meleeSourceTime, drawPhaseBounds } from "../src/melee-arts.js";
import * as swing from "../src/fx/melee-swing.js";

const weapons = WEAPONS.filter((w) => w.class !== "thrown");
const count = (frame) => frame.color.reduce((n, c, i) => n + (c !== 0 || frame.light[i] !== 0 ? 1 : 0), 0);

test("every equipped melee weapon has drawable, deterministic art that finishes empty in both directions", () => {
  const h = new Hero(), f = createFrame(240, 160);
  for (const weapon of weapons) {
    h.equipWeapon(weapon.id);
    for (let combo = 0; combo < 3; combo++) for (const flip of [false, true]) {
      const art = meleeArt(weapon, combo), beat = meleeBeat(h, combo);
      const opts = { x: 120, y: 120, art, beat, combo, seed: 17, flip, range: weapon.attack.range };
      const a = createFx(swing, opts), b = createFx(swing, opts);
      a.update(beat.hit + 0.025); b.update(beat.hit + 0.025);
      a.draw(f);
      assert.ok(count(f) > 0, `${weapon.id} stroke ${combo + 1} has visible art`);
      const picture = f.color.slice(), light = f.light.slice();
      clearFrame(f); b.draw(f);
      assert.deepEqual(f.color, picture);
      assert.deepEqual(f.light, light);
      a.update(0.7);
      clearFrame(f); a.draw(f);
      assert.equal(count(f), 0, `${weapon.id} leaves no permanent trail`);
    }
  }
});

test("pose and effect clocks reach the authored contact together while preserving the equipped rig", () => {
  const h = new Hero();
  for (const weapon of weapons) {
    h.equipWeapon(weapon.id);
    for (let combo = 0; combo < 3; combo++) {
      const art = meleeArt(weapon, combo), beat = meleeBeat(h, combo);
      assert.ok(Math.abs(meleeSourceTime(art, beat, beat.hit, weapon, combo) - art.contact) < 1e-8);
      const track = meleePoseTrack(art, beat, weapon, combo);
      for (const [t, pose] of track) {
        assert.equal(pose.weapon, weapon.rigWeapon);
        assert.ok(Number.isFinite(t));
        for (const value of Object.values(pose)) if (typeof value === "number") assert.ok(Number.isFinite(value));
      }
      assert.ok(posed(track.find(([time]) => time === beat.hit)[1], h.look).n > 0);
    }
  }
});

test("sword strings begin behind the shoulder and draw forward before contact", () => {
  const h = new Hero();
  const weapon = WEAPONS.find((w) => w.id === "ember-blade");
  h.equipWeapon(weapon.id);
  const beat = meleeBeat(h, 0), art = meleeArt(weapon, 0);
  const track = meleePoseTrack(art, beat, weapon, 0);
  const first = track[0][1];
  const phases = drawPhaseBounds(beat, 0);
  const draw = track.find(([time]) => time > phases.sheathEnd && time < phases.drawEnd)[1];
  const contact = track.find(([time]) => time === beat.hit)[1];
  assert.equal(first.two, false);
  assert.ok(first.sa > 1.5 && first.fx < -6, "the opening pose keeps the hilt behind the shoulder");
  assert.ok(draw.fy < -28 && draw.sa < -1.5, "the draw pose brings the hilt over the shoulder");
  assert.ok(contact.fx > 10 && contact.sa > -0.4, "the contact pose has released the blade into the swing");
});

test("the blade finisher turns the whole body and the thrust keeps a distinct forward lunge", () => {
  const h = new Hero(), weapon = h.meleeWeapon, beat = meleeBeat(h, 2);
  const spin = meleePoseTrack(meleeArt(weapon, 2), beat, weapon, 2);
  assert.ok(spin.some(([, pose]) => pose.yaw < -3));
  assert.ok(spin.some(([, pose]) => pose.yaw > 1));
  h.equipWeapon("armory:rapier");
  assert.equal(meleeFamily(h.meleeWeapon), "thrust");
  const thrust = meleePoseTrack(meleeArt(h.meleeWeapon, 0), meleeBeat(h, 0), h.meleeWeapon, 0);
  assert.ok(thrust.some(([, pose]) => pose.lean >= 8));
  assert.ok(thrust.every(([, pose]) => Math.abs(pose.yaw ?? 0) < 1));
});

test("a cancelled attack removes both halves of its VFX immediately", () => {
  const h = new Hero(), beat = meleeBeat(h, 2), art = meleeArt(h.meleeWeapon, 2);
  const fx = createFx(swing, { art, beat, combo: 2, x: 120, y: 110 });
  const f = createFrame(240, 160);
  fx.update(beat.hit + 0.02);
  fx.draw(f, "back"); fx.draw(f, "front");
  assert.ok(count(f) > 0);
  fx.options.cancelled = true;
  clearFrame(f); fx.draw(f, "back"); fx.draw(f, "front");
  assert.equal(count(f), 0);
});

test("normal attacks create short body echoes without taking over movement or spell-act state", () => {
  const g = new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {},
  }) });
  g.startRun({ fresh: true }); g.phase = "fight"; g.hold = 999; g.spawnQueue = []; g.mapFxTiles = [];
  const x = g.hero.x;
  g.cast("j"); g.keys.add("d");
  for (let i = 0; i < 12; i++) g.tick(1 / 120);
  assert.ok(g.hero.x > x);
  assert.equal(g.hero.actPose, null);
  assert.ok(g.effects.some((ef) => ef.melee && ef.split && !ef.act));
  assert.ok(g.hero.meleeEchoes.length > 0 && g.hero.meleeEchoes.length <= 3);
  g.hero.tryDash(g);
  assert.equal(g.hero.meleeEchoes.length, 0);
});
