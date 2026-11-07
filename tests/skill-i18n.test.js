import assert from "node:assert/strict";
import test from "node:test";
import { SKILL_META } from "../src/data.js";
import { skillLabel } from "../src/copy.js";
import { localizeFxSkill } from "../src/skill-i18n.js";

test("franchise skills have distinct zh labels", () => {
  const spiral = localizeFxSkill("ninjutsu/spiral-orb", "Spiral orb");
  assert.equal(spiral.name, "螺旋丸");
  assert.equal(spiral.nameJa, "螺旋丸");
  const fireball = localizeFxSkill("ninjutsu/great-fireball", "Great fireball");
  assert.equal(fireball.name, "豪火球");
});

test("generic fx skills localize away from raw English when possible", () => {
  const fb = localizeFxSkill("fire/fireball", "Fireball");
  assert.match(fb.name, /火/);
  const ls = localizeFxSkill("lightning/lightning-strike", "Lightning strike");
  assert.match(ls.name, /雷/);
});

test("skillLabel follows game language", () => {
  const s = SKILL_META.find((x) => x.id === "fx:ninjutsu/spiral-orb");
  assert.ok(s);
  assert.equal(skillLabel({ language: "zh" }, s), "螺旋丸");
  assert.equal(skillLabel({ language: "en" }, s), s.nameEn);
  assert.equal(skillLabel({ language: "ja" }, s), "螺旋丸");
});

test("most catalog skills have non-English zh names", () => {
  const fx = SKILL_META.filter((s) => s.id.startsWith("fx:"));
  const localized = fx.filter((s) => s.name && s.name !== s.nameEn && !/^[A-Za-z\s\-:]+$/.test(s.name));
  assert.ok(localized.length / fx.length > 0.85, `only ${localized.length}/${fx.length} fx skills localized`);
});
