import assert from "node:assert/strict";
import test from "node:test";
import { WEAPONS } from "../src/data.js";
import { weaponLabel } from "../src/copy.js";
import { localizeArmoryWeapon } from "../src/weapon-i18n.js";
import { ARMORY } from "../../pixelfx/src/core/weapons.js";

test("armory weapons expose zh, en and ja display names", () => {
  const katana = WEAPONS.find((w) => w.id === "armory:katana");
  assert.ok(katana);
  assert.equal(katana.name, "太刀");
  assert.equal(katana.nameEn, "Katana");
  assert.equal(katana.nameJa, "太刀");
  assert.equal(weaponLabel({ language: "en" }, katana), "Katana");
  assert.equal(weaponLabel({ language: "ja" }, katana), "太刀");
  assert.equal(weaponLabel({ language: "zh" }, katana), "太刀");
});

test("starter and armory labels follow game language", () => {
  const starter = WEAPONS.find((w) => w.id === "ember-blade");
  assert.equal(weaponLabel({ language: "zh" }, starter), "余烬星刃");
  assert.equal(weaponLabel({ language: "en" }, starter), "EMBER BLADE");
  assert.equal(weaponLabel({ language: "ja" }, starter), "エンバーブレード");

  const staff = localizeArmoryWeapon(ARMORY.find((w) => w.id === "staff"));
  assert.equal(staff.nameJa, "金箍棒");
  const armoryStaff = WEAPONS.find((w) => w.id === "armory:staff");
  assert.equal(weaponLabel({ language: "ja" }, armoryStaff), "金箍棒");
});

test("every armory weapon has a non-English ja name when en title is Latin", () => {
  for (const row of ARMORY) {
    const w = WEAPONS.find((item) => item.id === `armory:${row.id}`);
    assert.ok(w, `catalog includes armory:${row.id}`);
    if (/^[A-Za-z\s\-]+$/.test(w.nameEn)) {
      assert.notEqual(w.nameJa, w.nameEn, `${row.id} should localize ja`);
    }
  }
});
