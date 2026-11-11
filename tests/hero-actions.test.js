import test from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { HERO_LOOKS } from "../src/data.js";
import { heroProfile, applyHeroProfile } from "../src/save.js";
import { heroFrameId, loadHeroPixelData } from "../src/hero-sprites.js";
import { HERO_PIXEL_LOADERS } from "../src/hero-data/index.js";

for (const id of Object.keys(HERO_PIXEL_LOADERS)) await loadHeroPixelData(id);

function arena() {
  const g = new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {},
  }) });
  g.startRun({ fresh: true });
  g.phase = "fight"; g.hold = 999; g.spawnQueue = [];
  return g;
}
const advance = (g, time) => { for (let i = 0; i < Math.ceil(time * 120); i++) g.tick(1 / 120); };

test("every hero's basic and empowered attacks use the source contact frame", () => {
  for (const look of HERO_LOOKS) {
    const g = arena(), h = g.hero;
    h.equipLook(look.id);
    const basic = h.classId === "mage" ? "mage:bolt" : "j";
    assert.ok(g.cast(basic), look.id);
    assert.equal(h.anim.kind, "attack1");
    h.anim.t = h.anim.contact;
    assert.equal(h.pixelBody().frameId, look.clips.attack1[look.contacts.attack1]);
    assert.ok(!g.effects.some((fx) => fx.melee || fx.act), "the source frame contains the attack art");
    h.cancelMelee(); h.anim.t = h.anim.dur; h.cd[basic] = 0; h.dashAttackT = 0.3;
    assert.ok(g.cast(basic));
    assert.equal(h.anim.kind, "enhanced");
    h.anim.t = h.anim.contact;
    assert.equal(h.pixelBody().frameId, look.clips.enhanced[look.contacts.enhanced]);
  }
});

test("all current hero atlases render at 0.65 scale and ranged basics stay horizontal", () => {
  for (const look of HERO_LOOKS) {
    const g = arena(), h = g.hero;
    h.equipLook(look.id);
    assert.equal(h.bodyScale, 0.65, look.id);
  }
  for (const [lookId, skill] of [["laurel-ranger", "j"], ["moon-priestess", "mage:bolt"]]) {
    const g = arena(), h = g.hero;
    h.equipLook(lookId);
    const enemy = g.spawnEnemy("slime", h.x + 120, h.y - 25);
    enemy.state = "chase"; enemy.update = () => {};
    assert.ok(g.cast(skill));
    advance(g, 0.3);
    assert.ok(g.projectiles.length > 0, `${lookId} creates a projectile`);
    assert.equal(g.projectiles[0].vy, 0, `${lookId} projectile has no vertical slope`);
  }
});

test("sword arts and T use native action frames and deal damage only on contact", () => {
  for (const id of ["t", "sword:cleave", "sword:rush", "sword:rise", "sword:awakening"]) {
    const g = arena(), h = g.hero;
    const e = g.spawnEnemy("slime", h.x + 25, h.y);
    e.state = "chase"; e.update = () => {};
    assert.ok(g.cast(id));
    assert.equal(e.hp, e.maxHp);
    const look = HERO_LOOKS.find((look) => look.id === h.look);
    h.anim.t = h.anim.contact;
    assert.equal(h.pixelBody().frameId, look.clips[h.anim.kind][look.contacts[h.anim.kind]]);
    h.anim.t = 0;
    advance(g, 0.3);
    assert.ok(e.hp < e.maxHp, id);
    assert.ok(!g.effects.some((fx) => fx.melee || fx.act));
  }
});

test("changing heroes cancels pending attacks even within the same class", () => {
  const g = arena(), h = g.hero;
  const e = g.spawnEnemy("slime", h.x + 25, h.y);
  e.state = "chase"; e.update = () => {};
  assert.ok(g.cast("sword:awakening"));
  h.equipLook("erii", g);
  advance(g, 0.85);
  assert.equal(e.hp, e.maxHp);
  assert.equal(h.weaponId, "hero:erii");
});

test("old weapon saves and inventory shortcuts cannot change a hero's weapon", () => {
  const g = arena(), h = g.hero;
  applyHeroProfile(h, { classId: "swordsman", look: "erii", meleeWeaponId: "armory:staff", thrownWeaponId: "armory:kunai" });
  assert.equal(h.weaponId, "hero:erii");
  g.state = "inventory";
  for (const key of ["1", "2", "3", "4", "5", "6"]) g.ui.handleInventoryKey(key);
  g.ui.handlePointer(60, 60); g.ui.handlePointer(60, 95);
  assert.equal(h.weaponId, "hero:erii");
  const saved = heroProfile(h);
  assert.equal(saved.meleeWeaponId, "hero:erii");
  assert.equal(saved.thrownWeaponId, null);
});

test("held combos carry the release pose into the next beat without idle or recovery flashes", () => {
  for (const look of HERO_LOOKS) {
    const g = arena(), h = g.hero;
    h.equipLook(look.id);
    g.keys.add("j");
    let beats = 0;
    for (let i = 0; i < 180; i++) {
      const before = h.anim, frame = h.pixelBody().frameId;
      g.tick(1 / 120);
      assert.ok(h.anim.kind.startsWith("attack"), `${look.id} ${i}: ${h.anim.kind}`);
      if (before !== h.anim && before.kind.startsWith("attack")) {
        assert.equal(h.anim.entryFrame, frame, `${look.id} retains the preceding release pose`);
        beats++;
      }
    }
    assert.ok(beats >= 2, `${look.id} chains all three beats`);
    g.keys.clear();
    let recovered = false;
    for (let i = 0; i < 120; i++) {
      g.tick(1 / 120);
      recovered ||= h.anim.kind === "recover";
    }
    assert.ok(recovered, `${look.id} has a visible recovery`);
    assert.equal(h.anim.kind, "idle");
  }
});

test("holding basic attack lets a sword art finish and queues the next attack", () => {
  const g = arena(), h = g.hero;
  assert.ok(g.cast("sword:awakening"));
  g.keys.add("j");
  advance(g, 0.7);
  assert.equal(h.anim.kind, "awakening");
  assert.equal(h.melee.cancelled, false);
  assert.equal(g.hitStop, 0, "an empty sword art must not freeze animation");
  advance(g, 0.15);
  assert.equal(h.anim.kind, "attack1");
  assert.ok(h.anim.entryFrame != null);
});

test("DNF looks and their fixed weapons survive save restoration", () => {
  for (const look of HERO_LOOKS.filter((look) => look.theme === "dnf")) {
    const g = arena();
    g.hero.equipLook(look.id);
    const saved = heroProfile(g.hero);
    saved.meleeWeaponId = "armory:staff";
    applyHeroProfile(g.hero, saved);
    assert.equal(g.hero.look, look.id);
    assert.equal(g.hero.pixelBody().weapon, look.weapon.id);
    assert.equal(g.hero.equipWeapon("hero:erii"), false);
  }
});

test("each awakening strike reaches its source release frame on the damage clock", () => {
  for (const look of HERO_LOOKS) {
    const hits = [0.2, 0.4, 0.62];
    hits.forEach((t, i) => {
      const frame = heroFrameId(look, { kind: "awakening", t, dur: 0.8, contact: 0.2, hits });
      assert.equal(frame, look.clips.awakening[look.motion.strikes.awakening[i]], `${look.id} strike ${i + 1}`);
    });
  }
});
