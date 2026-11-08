import { test } from "node:test";
import assert from "node:assert/strict";
import { createFrame, clearFrame, createFx } from "../../pixelfx/src/core/index.js";
import { CUSTOM_MELEE_FX } from "../src/fx/custom-melee-arts.js";
import { MELEE_WEAPONS } from "../src/data.js";
import { meleeArt } from "../src/melee-arts.js";

const IDS = ["ember-greatsword", "frost-lightsword", "shadow-katana", "thunder-claymore", "starlight-rapier"];

test("new sword archetypes expose authored pose and effect modules", () => {
  const frame = createFrame(320, 180);
  for (const id of IDS) {
    const weapon = MELEE_WEAPONS.find((w) => w.id === id);
    assert.ok(weapon, `${id} is in the melee catalogue`);
    assert.equal(weapon.fxPath, `custom/${id}`);
    assert.equal(weapon.module, CUSTOM_MELEE_FX[id]);
    assert.ok(weapon.module.act?.poses?.length, `${id} has a synchronized attack pose`);

    const art = meleeArt(weapon, 0);
    assert.equal(art.module, weapon.module);
    const fx = createFx(art.module, { x: 150, y: 100, seed: 17 });
    clearFrame(frame);
    fx.update(0.12);
    fx.draw(frame, "back");
    fx.draw(frame, "front");
    const pixels = frame.color.reduce((n, c) => n + (c ? 1 : 0), 0);
    const light = frame.light.reduce((n, c) => n + (c ? 1 : 0), 0);
    assert.ok(pixels + light > 8, `${id} renders visible pixels`);
  }
});
