import test from "node:test";
import assert from "node:assert/strict";
import { HERO_LOOKS, WEAPONS, SKILL_META } from "../src/data.js";
import { meleeArt } from "../src/melee-arts.js";

test("DNF combat catalog excludes showcase characters and placed equipment", () => {
  const skills = SKILL_META.filter(s => s.theme === "dnf");
  assert.equal(skills.length, 6);
  for (const skill of skills) {
    assert.ok(!skill.module.meta.tags.some(tag => ["character", "weapon"].includes(tag)), skill.id);
    assert.notEqual(skill.name, skill.nameEn);
  }
  assert.equal(HERO_LOOKS.filter(look => look.theme === "dnf").length, 2);
});

test("DNF equipment resolves its own attack module for every combo beat", () => {
  const weapons = WEAPONS.filter(w => w.theme === "dnf");
  assert.equal(weapons.length, 2);
  for (const w of weapons) {
    assert.ok(w.module, w.id);
    if (w.class === "thrown") continue;
    for (let combo = 0; combo < 3; combo++) {
      const art = meleeArt(w, combo);
      assert.equal(art.module, w.module);
      assert.ok(art.module.act.hits.some(hit => hit.t === art.contact));
    }
  }
});
