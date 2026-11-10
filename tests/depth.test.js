import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { STAGES } from "../src/data.js";
import { LEGACY_BAND, clampDepth, mapDepth, planMapSlots } from "../src/game/depth.js";
import { SKILL_RECTS, RESUME_BUTTON, CAMP_BUTTON, AUTO_TOGGLE_RECTS, HERO_PANEL } from "../src/controls.js";
import { slotRect } from "../../pixelfx/src/fx/ui/dnf-hud.js";
import { HUD_CONSOLE } from "../src/controls.js";

function game() {
  const g = new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
  }) });
  g.startRun({ fresh: true });
  return g;
}

test("depth helpers keep the legacy band unless a map exports its own", () => {
  assert.equal(clampDepth(null, 100), LEGACY_BAND[0]);
  assert.equal(clampDepth(null, 999), LEGACY_BAND[1]);
  assert.equal(mapDepth(null, 150), 150);
  const g = { walkBand: [114, 158] };
  assert.equal(mapDepth(g, 134), 114);
  assert.equal(mapDepth(g, 170), 158);
  assert.equal(mapDepth(g, 152), 136);
  assert.equal(clampDepth(g, 100, 6, 4), 120);
  assert.equal(clampDepth(g, 999, 6, 4), 154);
});

test("stages adopt the map's depth band; the hub keeps the legacy one", () => {
  const g = game();
  assert.deepEqual(g.walkBand, STAGES[0].map.map.depth);
  g.loadStage(0, true);
  assert.deepEqual(g.walkBand, LEGACY_BAND);
});

test("authored spawn rows and the portal land inside the walkable band", () => {
  const g = game();
  const [top, bottom] = g.walkBand;
  for (let i = 0; i < g.stage.waves.length; i++) {
    g.spawnQueue = [];
    g.startWave(i);
    for (const spec of g.spawnQueue) assert.ok(spec.y >= top && spec.y <= bottom, `wave ${i} spawn row ${spec.y}`);
  }
  g.openPortal();
  assert.ok(g.portal.y >= top && g.portal.y <= bottom);
  g.hero.y = -50; g.hero.update(g, 1 / 60, new Set());
  assert.equal(g.hero.y, top);
  g.hero.y = 500; g.hero.update(g, 1 / 60, new Set());
  assert.equal(g.hero.y, bottom);
});

test("layered maps plan one slot per layer tile and skip live layers", () => {
  const legacy = planMapSlots({ groundY: 150 }, 480);
  assert.deepEqual(legacy.map((s) => [s.layer, s.x, s.opaque]), [[null, 0, true], [null, 320, true]]);
  const slots = planMapSlots(STAGES[0].map.map, 480);
  const ids = slots.map((s) => `${s.layer}@${s.x}`);
  assert.deepEqual(ids, ["far@0", "far@320", "near@0", "near@320", "fore@0", "fore@320"]);
  assert.ok(slots.every((s) => s.layer !== "air"), "live layers are drawn by the host");
  assert.equal(slots.find((s) => s.layer === "far").static, false);
  assert.equal(slots.find((s) => s.layer === "near").static, true);
  assert.equal(slots.find((s) => s.layer === "fore").front, true);
  assert.equal(slots.filter((s) => s.opaque).every((s) => s.layer === "far"), true);
  // A slow layer covers less ground: one screen plus its share of the camera travel.
  assert.equal(planMapSlots({ layers: [{ id: "sky", parallax: 0 }] }, 960).length, 1);
});

test("the sample map draws every layer view without throwing", async () => {
  const { createFrame, createFx } = await import("../../pixelfx/src/core/index.js");
  const mod = STAGES[0].map;
  for (const layer of ["air", "fore"]) {
    const fx = createFx(mod, { x: 0, y: 0, seed: 1, view: { layer, x: 160 } });
    const frame = createFrame(320, 180, 0, 0, 2);
    fx.update(0.5); fx.draw(frame);
    assert.ok(frame.color.some((c) => c !== 0), `${layer} layer draws pixels`);
  }
});

test("HUD hit regions stay on screen, apart, and aligned with the console art", () => {
  const rects = [...SKILL_RECTS, RESUME_BUTTON, CAMP_BUTTON, ...Object.values(AUTO_TOGGLE_RECTS),
    { x: HERO_PANEL.x, y: HERO_PANEL.y, w: HERO_PANEL.s, h: HERO_PANEL.s }];
  for (const r of rects) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 320 && r.y + r.h <= 180, JSON.stringify(r));
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${i} overlaps ${j}`);
  }
  SKILL_RECTS.forEach((r, i) => {
    const art = slotRect(i);
    assert.deepEqual([r.x, r.y, r.w, r.h], [HUD_CONSOLE.x + art.x, HUD_CONSOLE.y + art.y, art.w, art.h]);
  });
});

test("clicking a console slot casts on desktop and is ignored while touch controls own the slots", () => {
  const g = game();
  g.phase = "fight";
  const r = SKILL_RECTS[1], id = g.hero.skillSlots[1];
  g.touchUi = { active: true };
  assert.equal(g.handlePointer(r.x + 4, r.y + 4), null);
  g.touchUi = { active: false };
  assert.equal(g.handlePointer(r.x + 4, r.y + 4), "skill");
  assert.ok(g.hero.cd[id] > 0);
});

test("the HUD renders every state without throwing, in each language and layout", () => {
  for (const language of ["zh", "en", "ja"]) for (const touch of [false, true]) {
    const g = game();
    g.language = language;
    g.touchUi = { active: touch, reset() {}, sync() {} };
    const e = g.spawnEnemy("slime", 200, 150);
    e.setState(g, "chase");
    e.hurt(g, 3);
    assert.equal(g.ui.target.ref, e);
    g.render();
    g.spawnEnemy("boss", 300, 150);
    g.render();
    g.togglePause(); g.render(); g.togglePause();
    g.state = "gameover"; g.render();
    g.state = "victory"; g.render();
    g.loadStage(0, true); g.render();
  }
});
