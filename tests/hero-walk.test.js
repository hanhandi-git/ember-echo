import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { HERO_LOOKS } from "../src/data.js";
import { HERO_PIXEL_DATA, heroSprite, loadHeroPixelData } from "../src/hero-sprites.js";
import { HERO_PIXEL_LOADERS } from "../src/hero-data/index.js";

for (const id of Object.keys(HERO_PIXEL_LOADERS)) await loadHeroPixelData(id);
import { decodeWalkSource, footPath, renderWalkCycleFrame } from "../src/art/hero-walk-cycle.js";
import { Hero, HERO_TRACKS } from "../src/hero.js";

const config = JSON.parse(readFileSync(new URL("../assets/heroes/walk/rigs.json", import.meta.url)));
const originals = JSON.parse(readFileSync(new URL("../assets/heroes/dnf-manifest.json", import.meta.url)));
const hash = (data) => createHash("sha256").update(new Uint8Array(data.buffer)).digest("hex");

test("all nine new heroes use twelve distinct generated walk frames", () => {
  for (const look of HERO_LOOKS.filter((look) => look.theme === "heroes")) {
    assert.equal(look.clips.walk.length, 12, look.id);
    assert.deepEqual(look.clips.walk, look.walkSource.frames);
    const pictures = look.clips.walk.map((id) => HERO_PIXEL_DATA[look.id].frames[id].pixels);
    assert.equal(new Set(pictures).size, 12, `${look.id} has twelve newly posed frames`);
    for (let i = 0; i < 12; i++) {
      const body = heroSprite(look.id, { kind: "walk", t: look.motion.walk * (i + 0.2) / 12 });
      assert.equal(body.frameId, look.clips.walk[i]);
      assert.ok(body.n > 2500 && body.n < 16000, `${look.id}: readable body, no empty frames`);
      assert.equal(body.weapon, look.weapon.id);
    }
  }
});

test("walk generator loops exactly and retains stable native canvas bounds", () => {
  for (const [id, rig] of Object.entries(config.heroes)) {
    if (id === "hatsune-miku") rig.hairColor = "cyan";
    const source = decodeWalkSource(HERO_PIXEL_DATA[id], rig.baseFrame);
    const first = renderWalkCycleFrame(source, rig, 0, config.canvas, config.origin);
    const seam = renderWalkCycleFrame(source, rig, 1, config.canvas, config.origin);
    assert.equal(hash(first.frame.color), hash(seam.frame.color), id);
    for (const phase of [0, 0.25, 0.5, 0.75]) {
      const { frame } = renderWalkCycleFrame(source, rig, phase, config.canvas, config.origin);
      for (let x = 0; x < frame.w; x++) {
        assert.equal(frame.color[x], 0, `${id}: clear top edge`);
        assert.equal(frame.color[(frame.h - 1) * frame.w + x], 0, `${id}: clear bottom edge`);
      }
    }
  }
});

test("planted feet move at the hero's world speed and swing feet lift", () => {
  for (const look of HERO_LOOKS.filter((look) => look.walkSource)) {
    const rig = config.heroes[look.id];
    const a = footPath(0.1, rig.stride, rig.lift), b = footPath(0.3, rig.stride, rig.lift);
    assert.equal(a.y, 0);
    assert.equal(b.y, 0);
    const plantedSpeed = (a.x - b.x) / (0.2 * look.motion.walk * look.density);
    assert.ok(Math.abs(plantedSpeed - look.weapon.speed) < 1e-6, look.id);
    assert.ok(footPath(0.75, rig.stride, rig.lift).y < -4);
  }
});

test("new walk clocks follow speed upgrades while DNF source walk clips stay intact", () => {
  const h = new Hero();
  const g = { state: "camp", phase: "idle", keys: new Set(["d"]), clampX: (x) => x, dust() {} };
  h.equipLook("lu-mingfei");
  h.startAnim("walk", HERO_TRACKS.walk, true); h.anim.t = 0;
  h.speed = h.meleeWeapon.speed * 1.5;
  h.update(g, 0.1, g.keys);
  assert.ok(Math.abs(h.anim.t - 0.15) < 1e-8);
  for (const original of originals) {
    const look = HERO_LOOKS.find((look) => look.id === original.id);
    assert.deepEqual(look.clips.walk, original.clips.walk);
    assert.equal(look.walkSource, undefined);
  }
  h.equipLook("dnf-blade-master");
  h.startAnim("walk", HERO_TRACKS.walk, true); h.anim.t = 0;
  h.speed = h.meleeWeapon.speed * 1.5;
  h.update(g, 0.1, g.keys);
  assert.ok(Math.abs(h.anim.t - 0.1) < 1e-8);
});

test("Blade Master and Berserker start with their own swords in hand", () => {
  for (const id of ["dnf-blade-master", "dnf-berserker"]) {
    const look = HERO_LOOKS.find((entry) => entry.id === id);
    assert.deepEqual(look.clips.idle, [2, 2, 2, 2]);
    assert.equal(look.clips.recover[0], 2);
    const body = heroSprite(id, { kind: "idle", t: 0 });
    assert.equal(body.frameId, 2);
    assert.equal(body.weapon, look.weapon.id);
  }
  const swordMaster = HERO_LOOKS.find((entry) => entry.id === "dnf-sword-master");
  assert.equal(swordMaster.clips.idle[0], 0, "Sword Master's original hand-held idle remains unchanged");
});
