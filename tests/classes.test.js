import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Game } from "../src/game.js";
import { Hero } from "../src/hero.js";
import { SKILL_META, HERO_LOOKS } from "../src/data.js";
import { heroProfile, applyHeroProfile } from "../src/save.js";
import { HERO_PIXEL_DATA } from "../src/hero-pixel-data.js";
import { appearanceFrame, composePixelFrame, heroSprite } from "../src/hero-sprites.js";

const game = () => {
  const g = new Game({ getContext: () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} }) });
  g.startRun({ fresh: true }); g.phase = "fight";
  return g;
};
const advance = (g, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) g.tick(1 / 60); };

test("all DNF hero looks show equipped weapons in combat, portraits, and the throw override", () => {
  const h = new Hero();
  for (const look of HERO_LOOKS.filter((look) => look.sprite)) {
    h.equipLook(look.id);
    const pictures = [];
    for (const weapon of ["ember-blade", "moon-scythe", "armory:staff"]) {
      h.equipWeapon(weapon);
      const body = h.pixelBody();
      assert.equal(body.weapon, h.activeRigWeapon());
      pictures.push(createHash("sha256").update(new Uint8Array(body.color.buffer)).digest("hex"));
      const portrait = heroSprite(look.id, {}, false, h.appearance, { weapon: h.activeRigWeapon() });
      assert.equal(portrait.weapon, h.activeRigWeapon());
    }
    assert.equal(new Set(pictures).size, 3, look.id);
    h.setThrowRig("kunai");
    assert.equal(h.pixelBody().weapon, "kunai");
    h.clearThrowRig();
    assert.equal(h.pixelBody().weapon, "staff");
  }
  assert.equal(new Set(HERO_LOOKS.map((look) => look.id)).size, HERO_LOOKS.length);
});

test("each class has an exclusive usable default kit and rejects foreign skills at equip and cast", () => {
  const g = game();
  for (const classId of ["swordsman", "mage"]) {
    g.hero.setClass(classId);
    assert.ok(g.hero.skillSlots.every((id) => SKILL_META.find((skill) => skill.id === id)?.classId === classId));
    const forbidden = classId === "mage" ? "j" : "k";
    const before = { slots: [...g.hero.skillSlots], mp: g.hero.mp, effects: g.effects.length };
    assert.equal(g.hero.swapSkill(0, forbidden), false);
    assert.equal(g.cast(forbidden), false);
    assert.deepEqual(g.hero.skillSlots, before.slots);
    assert.equal(g.hero.mp, before.mp);
    assert.equal(g.effects.length, before.effects);
  }
  assert.equal(g.hero.swapSkill(0, "unknown"), false);
  assert.equal(g.hero.swapSkill(0.5, "k"), false);
});

test("both job loadouts and looks survive switching and a save round trip", () => {
  const h = new Hero();
  h.equipLook("dnf-berserker");
  assert.ok(h.swapSkill(1, "fx:dnf/chain-cut"));
  h.setClass("mage");
  h.equipLook("dnf-elemental-bomber");
  h.setAppearance({ preset: "frost", palette: { "14": "#5fdcff" } });
  assert.ok(h.swapSkill(2, "fx:fire/fire-ring"));
  const restored = new Hero();
  applyHeroProfile(restored, JSON.parse(JSON.stringify(heroProfile(h))));
  assert.equal(restored.classId, "mage");
  assert.equal(restored.look, "dnf-elemental-bomber");
  assert.equal(restored.appearance.preset, "frost");
  assert.equal(restored.appearance.palette["14"], "#5fdcff");
  assert.equal(restored.skillSlots[2], "fx:fire/fire-ring");
  restored.setClass("swordsman");
  assert.equal(restored.look, "dnf-berserker");
  assert.equal(restored.skillSlots[1], "fx:dnf/chain-cut");
  restored.setClass("mage");
  assert.equal(restored.skillSlots[2], "fx:fire/fire-ring");
});

test("legacy mixed and malformed saved skills are replaced with valid class defaults", () => {
  const h = new Hero();
  applyHeroProfile(h, { look: "ember-duelist", skillSlots: ["j", "k", "l", "u", "i", "o", "t"] });
  assert.equal(h.look, "ember-duelist");
  assert.ok(h.skillSlots.every((id) => h.canUseSkill(id)));
  applyHeroProfile(h, { classId: "mage", skillSlots: ["j", null, "invalid", "u", "i", "o", "t"] });
  assert.ok(h.skillSlots.every((id) => h.canUseSkill(id)));
});

test("mage basic attack is free, repeats when held, and hits at range", () => {
  const g = game();
  g.hero.setClass("mage");
  g.hero.mp = 0;
  const mob = g.spawnEnemy("slime", g.hero.x + 110, g.hero.y);
  mob.state = "chase"; mob.update = () => {};
  g.keys.add("j");
  advance(g, 1.1);
  assert.ok(mob.hp < mob.maxHp, "magic projectiles reach the distant enemy");
  assert.equal(g.hero.mp < 5, true, "attack does not consume mana");
  assert.ok(g.hero.cd["mage:bolt"] > 0);
  assert.equal(g.hero.melee, null);
});

test("switching class cancels delayed attacks without resetting their cooldowns", () => {
  const g = game();
  g.hero.setClass("mage");
  assert.ok(g.cast("k"));
  const cd = g.hero.cd.k;
  g.hero.setClass("swordsman", g);
  advance(g, 0.22);
  assert.equal(g.projectiles.length, 0);
  g.hero.setClass("mage", g);
  assert.ok(g.hero.cd.k > 0 && g.hero.cd.k < cd);
});

test("sword arts deal delayed damage with actual sword contact", () => {
  const g = game();
  const mob = g.spawnEnemy("slime", g.hero.x + 30, g.hero.y);
  mob.state = "chase"; mob.update = () => {};
  assert.ok(g.cast("sword:cleave"));
  assert.equal(mob.hp, mob.maxHp);
  advance(g, 0.25);
  assert.ok(mob.hp < mob.maxHp);
});

test("five native sprite atlases contain every referenced frame inside their image bounds", () => {
  const looks = HERO_LOOKS.filter((look) => look.sprite);
  assert.equal(looks.length, 5);
  for (const look of looks) {
    const png = readFileSync(new URL(`../${look.sprite}`, import.meta.url));
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    for (const clip of Object.values(look.clips)) for (const id of clip) {
      const [x, y, w, h] = look.frames[id];
      assert.ok(w > 0 && h > 0 && x >= 0 && y >= 0 && x + w <= width && y + h <= height, `${look.id}/${id}`);
    }
  }
});

test("code-owned pixel frames decode without browser image APIs and preserve geometry through recolor", () => {
  for (const [id, source] of Object.entries(HERO_PIXEL_DATA)) {
    for (const frameId of Object.keys(source.frames)) {
      const original = appearanceFrame(id, frameId, { preset: "original" });
      const frost = appearanceFrame(id, frameId, { preset: "frost" });
      assert.equal(original.n, frost.n, `${id}/${frameId} pixel count`);
      assert.deepEqual([...original.xs], [...frost.xs], `${id}/${frameId} x geometry`);
      assert.deepEqual([...original.ys], [...frost.ys], `${id}/${frameId} y geometry`);
    }
  }
});

test("all 201 original code pixel frames match the imported RGBA hashes", () => {
  let checked = 0;
  for (const look of HERO_LOOKS.filter((item) => item.sprite)) {
    for (const record of look.source.files) {
      const source = HERO_PIXEL_DATA[look.id].frames[record.frame];
      const body = composePixelFrame(source, HERO_PIXEL_DATA[look.id].palette);
      const bytes = Buffer.alloc(source.width * source.height * 4);
      for (let i = 0; i < body.n; i++) {
        const x = Math.round(body.xs[i] * body.density) - source.offset[0];
        const y = Math.round(body.ys[i] * body.density) - source.offset[1];
        bytes.writeUInt32LE(body.color[i], (y * source.width + x) * 4);
      }
      assert.equal(createHash("sha256").update(bytes).digest("hex"), record.pixelSha256, `${look.id}/${record.frame}`);
      checked++;
    }
  }
  assert.equal(checked, 201);
});

test("wardrobe layers can erase old pixels, add new silhouettes, and preserve the layer below", () => {
  const frame = { offset: [0, 0], layers: [{ id: "body", rows: ["0000", "0000"] }] };
  const body = composePixelFrame(frame, { "00": "#ff0000" }, [
    { id: "hair-cut", rows: ["!!.."] },
    { id: "new-hair", x: -1, y: -1, palette: { "01": "#00ff00" }, rows: ["0101"] },
  ]);
  assert.equal(body.n, 5);
  assert.ok([...body.xs].some((x) => x < 0));
  assert.equal([...body.color].filter((color) => color === 0xff00ff00).length, 2);
});
