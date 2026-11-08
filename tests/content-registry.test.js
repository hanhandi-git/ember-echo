import { test } from "node:test";
import assert from "node:assert/strict";
import { FX, MAPS, CRITTER_MODS, MOB_MODS } from "../src/content/fx-registry.js";
import { STAGES, SKILL_META, ENEMY_TYPES } from "../src/data.js";
import {
  iconOf,
  ATTR_FROM_CATEGORY,
  buildFxSpellMeta,
} from "../src/content/spell-catalog.js";

test("fx registry exposes draw/create modules for combat, maps and critters", () => {
  assert.ok(FX.stagePortal?.draw || FX.stagePortal?.create);
  assert.equal(Object.keys(MAPS).length, 7);
  for (const key of Object.keys(CRITTER_MODS)) {
    const mod = CRITTER_MODS[key];
    assert.ok(mod?.draw || mod?.create, `critter module ${key} is playable`);
  }
  for (const key of Object.keys(MOB_MODS)) {
    const mod = MOB_MODS[key];
    assert.ok(mod?.draw, `mob module ${key} draws`);
    assert.ok(mod?.mob?.attacks?.[0], `mob module ${key} has combat data`);
    assert.ok(mod.mob.hurtFor > 0 && mod.mob.dieFor > 0, `${key} exports hurt/die timing`);
    assert.ok(mod.mob.attacks[0].fx?.attack?.pose, `${key} attack has body pose`);
  }
  for (const stage of STAGES) {
    assert.ok(stage.map, `stage map module exists for ${stage.id ?? stage.name}`);
  }
});

test("stage waves only reference registered enemy types", () => {
  for (const stage of STAGES) {
    for (const wave of stage.waves) {
      for (const spawn of wave) {
        assert.ok(ENEMY_TYPES[spawn.type], `${stage.name}: unknown enemy ${spawn.type}`);
        assert.ok(ENEMY_TYPES[spawn.type].mod || ENEMY_TYPES[spawn.type].boss, `${spawn.type} has visuals`);
      }
    }
  }
});

test("spell catalog assigns icons and attributes per category", () => {
  assert.equal(iconOf("fire"), "fire");
  assert.equal(iconOf("ninjutsu"), "bolt");
  assert.equal(iconOf("unknown-cat"), "burst");
  assert.equal(ATTR_FROM_CATEGORY.lightning, "bolt");
  assert.equal(ATTR_FROM_CATEGORY.melee, "slash");
});

test("built fx spell meta aligns with SKILL_META and sane tuning bounds", () => {
  const built = buildFxSpellMeta();
  assert.ok(built.length >= 150);
  for (const s of built) {
    assert.match(s.id, /^fx:/);
    assert.ok(s.cost >= 6 && s.cost <= 48);
    assert.ok(s.cd >= 1.4 && s.cd <= 18);
    assert.ok(s.power >= 14 && s.power <= 70);
    assert.ok(s.name && s.nameEn);
  }
  const catalogFx = SKILL_META.filter((s) => s.id.startsWith("fx:"));
  assert.ok(
    catalogFx.length >= built.length * 0.95,
    "data.js catalog stays in sync with spell-catalog builder",
  );
});
