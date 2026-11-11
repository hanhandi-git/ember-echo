import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { STAGES, SKILL_META, WEAPONS, HERO_LOOKS } from "../src/data.js";
import { RESUME_BUTTON, CAMP_BUTTON, SKILL_RECTS } from "../src/controls.js";
import { GATE_PALETTES } from "../src/fx/stage-portal.js";
import { WEAPON_PROFILES } from "../src/weapon-profiles.js";
import { projectileSweep, hurtbox } from "../src/collision.js";
import { COMBAT_SCALE, HERO_RENDER_SCALE, BOSS_RENDER_SCALE } from "../src/combat-scale.js";
import { ENEMY_TYPES } from "../src/data.js";
import { loadSave } from "../src/save.js";
import * as stagePortal from "../src/fx/stage-portal.js";
import { createFrame, clearFrame, createFx } from "../../pixelfx/src/core/index.js";
import { joystickVector } from "../src/touch-controls.js";
import { quickSkills } from "../src/quick-bar.js";
function game() {
  const g = new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
  }) });
  g.startRun();
  return g;
}
function advance(g, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) g.tick(1 / 60);
}
function click(g, r) { return g.handlePointer(r.x + r.w / 2, r.y + r.h / 2); }
function clearStage(g) {
  g.phase = "fight";
  g.waveIndex = g.stage.waves.length - 1;
  g.stageClear();
}

test("small enemies animate without summoning circles; the boss keeps its entrance", () => {
  const g = game();
  const slime = g.spawnEnemy("slime", 200, 150);
  assert.equal(g.effects.length, 0);
  slime.update(g, 0.25);
  assert.ok(slime.fx.t > 0);
  const boss = g.spawnEnemy("boss", 400, 150);
  assert.ok(boss.portal);
  assert.ok(g.effects.some((e) => e.inst.meta.name === "Spawn portal"));
});

test("elite wave specs spawn tougher, bigger marked variants", () => {
  const g = game();
  const plain = g.spawnEnemy("slime", 200, 150);
  const elite = g.spawnEnemy("slime", 220, 150, { elite: true });
  assert.equal(elite.elite, true);
  assert.ok(elite.maxHp > plain.maxHp * 2);
  assert.ok(elite.dmg > plain.dmg);
  assert.ok(elite.xp > plain.xp);
  assert.ok(elite.renderScale > plain.renderScale);
  // the flag survives the wave queue into the spawned enemy
  g.spawnQueue = [{ type: "snake", x: 240, y: 150, elite: true, delay: 0 }];
  g.updateSpawns(0.01);
  const queued = g.enemies.at(-1);
  assert.equal(queued.typeId, "snake");
  assert.equal(queued.elite, true);
});

test("count packs scatter over the spawn band and only the first member is elite", () => {
  const g = game();
  g.stage = { ...g.stage, waves: [[{ type: "slime", x: 200, y: 150, count: 3, elite: true }]] };
  g.startWave(0);
  assert.equal(g.spawnQueue.length, 3);
  assert.equal(g.spawnQueue.filter((q) => q.elite === true).length, 1);
  for (const q of g.spawnQueue) {
    assert.ok(q.x >= 30 && q.x <= g.worldW - 30, `spawn x ${q.x} stays in bounds`);
    assert.ok(q.y >= g.walkBand[0] && q.y <= g.walkBand[1]);
  }
  // entrances run left to right: delay order follows the x sort
  const sorted = [...g.spawnQueue].sort((a, b) => a.delay - b.delay);
  for (let k = 1; k < sorted.length; k++) assert.ok(sorted[k].x >= sorted[k - 1].x, "entrance sweeps left to right");
});

test("every combat stage uses its own configured backdrop map", () => {
  assert.equal(STAGES.length, 5);
  const expectedKeys = ["mossy", "marsh", "ember", "aurora", "sunscar"];
  STAGES.forEach((stage, i) => {
    assert.equal(stage.mapKey, expectedKeys[i], `${stage.id ?? stage.name} keeps its configured map`);
    assert.ok(stage.map?.map?.groundY > 0, `${stage.mapKey} exports a playable map layout`);
  });
  assert.equal(new Set(STAGES.map((s) => s.mapKey)).size, STAGES.length, "each stage has a distinct backdrop");
});

test("movement echoes follow actual paths in both directions, expire and reset on restart", () => {
  const g = game();
  const x = g.hero.x;
  g.keys.add("a");
  assert.ok(g.hero.tryQuickMove(g));
  let trail = g.dashTrails.at(-1);
  assert.equal(trail.kind, "quick");
  assert.equal(trail.from.x, x);
  assert.ok(trail.to.x < x);
  assert.ok(trail.body.n > 0);
  g.keys.clear();
  g.keys.add("d");
  assert.ok(g.hero.tryDash(g));
  trail = g.dashTrails.at(-1);
  advance(g, 0.16);
  assert.ok(trail.to.x > trail.from.x);
  assert.ok(g.hero.invuln > 0);
  g.render();
  advance(g, 0.7);
  assert.equal(g.dashTrails.length, 0);
  g.hero.tryQuickMove(g);
  g.startRun();
  assert.equal(g.dashTrails.length, 0);
  assert.equal(g.hero.dashT, 0);
});

test("the shared move/dodge input quick-steps normally and dodges under attack", () => {
  const g = game();
  const ap = g.hero.ap;
  assert.ok(g.hero.tryMoveDodge(g));
  assert.equal(g.dashTrails.at(-1)?.kind, "quick", "no attack incoming means quick move");
  assert.ok(g.hero.ap < ap, "combat quick move still spends AP");
  advance(g, 1.3);
  const foe = g.spawnEnemy("bat", 250, 150);
  foe.state = "windup";
  foe.timer = 1;
  g.hero.dashCd = 0;
  g.hero.ap = g.hero.maxAp;
  assert.ok(g.hero.tryMoveDodge(g));
  assert.ok(g.hero.dashT > 0, "an incoming attack triggers the i-frame dodge");
  advance(g, 0.4);
  g.enterCamp();
  assert.ok(g.hero.tryMoveDodge(g));
  assert.equal(g.dashTrails.at(-1)?.kind, "quick");
});

test("pause button freezes enemies, timers, projectiles, movement and gates; continue resumes", () => {
  const g = game();
  g.spawnEnemy("bat", 250, 150);
  clearStage(g);
  g.hero.tryQuickMove(g);
  let called = false;
  g.after(0.1, () => { called = true; });
  g.togglePause();
  const snapshot = JSON.stringify({ hero: g.hero.x, gate: g.portal.t, mob: g.enemies[0].fx.t, run: g.runTime, trail: g.dashTrails[0].t });
  advance(g, 2);
  assert.equal(g.state, "paused");
  assert.equal(called, false);
  assert.equal(snapshot, JSON.stringify({ hero: g.hero.x, gate: g.portal.t, mob: g.enemies[0].fx.t, run: g.runTime, trail: g.dashTrails[0].t }));
  assert.equal(g.hero.tryDash(g), false);
  g.render();
  click(g, RESUME_BUTTON);
  advance(g, 0.2);
  assert.equal(g.state, "playing");
  assert.equal(called, true);
});

test("paused retreat saves the run and returns to camp", () => {
  const store = new Map();
  const previous = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  };
  try {
    const g = game();
    g.spawnEnemy("bat", 250, 150);
    g.kills = 3;
    g.waveIndex = 1;
    g.phase = "fight";
    g.togglePause();
    click(g, CAMP_BUTTON);
    assert.equal(g.state, "camp");
    assert.equal(g.canContinueSave?.(), true);
    const data = loadSave();
    assert.equal(data?.run?.active, true);
    assert.equal(data?.run?.kills, 3);
    assert.equal(data?.run?.waveIndex, 1);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
});

test("clearing stays in the current stage until the hero enters the portal", () => {
  const g = game();
  clearStage(g);
  advance(g, 8);
  assert.equal(g.stageIndex, 0);
  assert.equal(g.phase, "clear");
  assert.ok(g.portal);
  g.hero.x = g.portal.x;
  g.hero.y = g.walkBand[0];
  g.updatePortal(0.05);
  assert.equal(g.phase, "clear", "must overlap in depth too");
  g.hero.y = g.portal.y;
  g.updatePortal(0.05);
  assert.equal(g.phase, "travel");
  assert.equal(g.hero.tryQuickMove(g), false);
  advance(g, 0.7);
  assert.equal(g.stageIndex, 1);
  assert.equal(g.phase, "intro");
  assert.equal(g.portal, null);
  assert.equal(g.dashTrails.length, 0);
  assert.equal(g.hero.x, 54);
});

test("portal appearing beneath the player requires stepping out and entering again", () => {
  const g = game();
  g.hero.x = g.worldW - 70;
  g.hero.y = g.depthY(152);
  clearStage(g);
  advance(g, 2);
  assert.equal(g.phase, "clear");
  g.hero.x -= 40;
  g.updatePortal(0.1);
  g.hero.x = g.portal.x;
  g.updatePortal(0.1);
  assert.equal(g.phase, "travel");
});

test("the gate INTO the final stage uses crimson/gold; the last exit ends the run", () => {
  const g = game();
  g.loadStage(STAGES.length - 2);
  clearStage(g);
  assert.equal(g.portal.finalGate, true);
  assert.deepEqual(g.portal.fx.options.palette, GATE_PALETTES.final);
  advance(g, 1);
  g.hero.x = g.portal.x; g.hero.y = g.portal.y;
  advance(g, 1);
  assert.equal(g.stageIndex, STAGES.length - 1);
  assert.equal(g.portal, null);
  clearStage(g);
  assert.equal(g.portal.exit, true);
  advance(g, 1);
  g.hero.x = g.portal.x; g.hero.y = g.portal.y;
  advance(g, 1);
  assert.equal(g.state, "victory");
  g.startRun();
  assert.equal(g.portal, null);
  assert.equal(g.state, "playing");
});

test("all action buttons and skill slots have disjoint pointer regions", () => {
  const rects = [RESUME_BUTTON, ...SKILL_RECTS];
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }
  const g = game();
  click(g, SKILL_RECTS[2]);
  const rush = quickSkills(g.hero.classId)[2];
  assert.ok(g.hero.cd[rush] > 0, "quick-bar dash stays clickable");
});

test("the quick bar casts guard and the Chidori rush across classes", () => {
  const g = game();
  g.hero.setClass("swordsman");
  g.hero.mp = g.hero.maxMp;
  assert.equal(g.castQuick("fx:ninjutsu/chidori-rush"), true);
  g.hero.setClass("mage");
  g.hero.mp = g.hero.maxMp;
  assert.equal(g.castQuick("sword:guard"), true);
});

test("the quick bar picks class-appropriate action clips for guard and the Chidori rush", () => {
  const swordsman = game();
  swordsman.hero.setClass("swordsman");
  swordsman.hero.mp = swordsman.hero.maxMp;
  assert.equal(swordsman.castQuick("fx:ninjutsu/chidori-rush"), true);
  assert.equal(swordsman.hero.actClip, "rush", "swordsmen dash-slash through the Chidori");
  const swordsmanGuard = game();
  swordsmanGuard.hero.setClass("swordsman");
  swordsmanGuard.hero.mp = swordsmanGuard.hero.maxMp;
  assert.equal(swordsmanGuard.castQuick("sword:guard"), true);
  assert.equal(swordsmanGuard.hero.anim.kind, "guard");

  const mage = game();
  mage.hero.setClass("mage");
  mage.hero.mp = mage.hero.maxMp;
  assert.equal(mage.castQuick("fx:ninjutsu/chidori-rush"), true);
  assert.equal(mage.hero.actClip, "cast", "mages cast through the Chidori glide");
  const mageGuard = game();
  mageGuard.hero.setClass("mage");
  mageGuard.hero.mp = mageGuard.hero.maxMp;
  assert.equal(mageGuard.castQuick("sword:guard"), true);
  assert.equal(mageGuard.hero.anim.kind, "cast", "mages answer guard with a casting barrier");
});

test("guard raises a barrier bubble and absorbed hits play the pixelfx shield dome", () => {
  const g = game();
  g.hero.setClass("swordsman");
  g.hero.mp = g.hero.maxMp;
  assert.equal(g.castQuick("sword:guard"), true);
  assert.ok(g.effects.some((ef) => ef.inst?.meta?.name === "Divine shield"), "guard raises the barrier bubble");
  const hp = g.hero.hp;
  g.hero.hurt(g, 50);
  assert.ok(g.hero.hp === hp - 14, "the shield absorbed 36 of the hit");
  assert.ok(g.effects.some((ef) => ef.inst?.meta?.name === "Shield block"), "the absorbed hit plays the block dome");
});

test("standing portal is animated, deterministic and seamless in every palette", () => {
  for (const palette of Object.values(GATE_PALETTES)) {
    const f = createFrame(100, 96);
    const fx = createFx(stagePortal, { x: 50, y: 74, palette });
    fx.draw(f);
    const start = [...f.color, ...f.light];
    clearFrame(f); fx.update(1); fx.draw(f);
    assert.notDeepEqual([...f.color, ...f.light], start);
    clearFrame(f); fx.update(3); fx.draw(f);
    assert.deepEqual([...f.color, ...f.light], start);
  }
});

test("bound hero weapons and the spell catalog are playable through the adapter", () => {
  assert.equal(WEAPONS.length, 13);
  assert.ok(SKILL_META.length >= 190);
  assert.equal(STAGES.length, 5);
  const g = game();
  const enemy = g.spawnEnemy("slime", g.hero.x + 45, g.hero.y);
  enemy.speed = 0; // pinned in reach: the test checks casts, not the chase
  const weapon = g.hero.weapon;
  assert.ok(g.hero.equipWeapon(weapon.id, g));
  assert.ok(g.cast("j"));
  const samples = ["moves/sword-combo", "fire/fire-ring", "ice/ice-spikes", "lightning/chain-lightning", "arcane/arcane-missiles", "ninjutsu/great-fireball", "senjutsu/wind-shuriken", "dragonball/ki-wave", "fanren/xuantian-sword", "kami/ame-no-murakumo", "thrown/boomerang-throw"];
  for (const path of samples) {
    const skill = SKILL_META.find((s) => s.fxPath === path);
    assert.ok(skill, `catalog includes ${path}`);
    g.hero.setClass(skill.classId);
    g.hero.cd[skill.id] = 0;
    g.hero.mp = g.hero.maxMp;
    g.hero.hp = g.hero.maxHp;
    g.enemies = [enemy]; // faster wave mobs must not pile in between sample casts
    g.spawnQueue.length = 0;
    g.hero.dead = false;
    assert.equal(g.cast(skill.id), true, `casts ${path}`);
    const mod = skill.module;
    advance(g, mod?.act ? (mod.meta?.duration ?? 2.2) + 0.15 : 0.12);
  }
  g.render();
  assert.ok(enemy.hp < enemy.maxHp || g.effects.length > 0);
});

test("character selection binds its weapon and the enhanced attack never swaps the rig", () => {
  const g = game();
  for (const look of HERO_LOOKS) {
    g.hero.equipLook(look.id, g);
    assert.equal(g.hero.weaponId, look.weapon.id);
    assert.equal(g.hero.equipWeapon("armory:kunai", g), false);
    assert.equal(g.hero.thrownWeapon, null);
  }
  g.hero.equipLook("erii", g);
  assert.ok(g.cast("t"));
  assert.equal(g.hero.anim.kind, "enhanced");
  assert.equal(g.hero.weaponId, "hero:erii");
  advance(g, 0.7);
  assert.equal(g.hero.weaponId, "hero:erii");
});

test("weapon paths use moving enemy sweeps and stop or pierce according to the profile", () => {
  const g = game();
  g.hero.x = 100; g.hero.y = 150; g.hero.facing = 1;
  const first = g.spawnEnemy("slime", 132, 150); first.state = "chase"; first.prevX = 124; first.prevY = 150;
  const second = g.spawnEnemy("snake", 148, 150); second.state = "chase"; second.prevX = 142; second.prevY = 150;
  const before = [first.hp, second.hp];
  const stop = g.weaponStrike(WEAPON_PROFILES.sword, { dmg: 10, knock: 0, crit: false });
  assert.equal(stop.hits.length, 1);
  assert.notDeepEqual([first.hp, second.hp], before);
  assert.equal(first.hp < first.maxHp || second.hp < second.maxHp, true);

  const pierce = g.weaponStrike({ ...WEAPON_PROFILES.spear, range: 80, pierce: true, maxHits: 2 }, { dmg: 10, knock: 0, crit: false });
  assert.equal(pierce.hits.length, 2);
  assert.ok(first.hp < first.maxHp && second.hp < second.maxHp);
  const crossing = projectileSweep({ x: 100, y: 150 }, { x: 170, y: 150 }, second, 2);
  assert.ok(crossing && crossing.t > 0 && crossing.t < 1);
});

test("actor visuals, hurtboxes and enemy reach use the same smaller combat scale", () => {
  const g = game();
  assert.equal(g.hero.renderScale, HERO_RENDER_SCALE);
  const enemy = g.spawnEnemy("slime", g.hero.x + 45, g.hero.y);
  enemy.speed = 0; // pinned in reach: the test checks casts, not the chase
  assert.equal(enemy.renderScale, ENEMY_TYPES.slime.scale * COMBAT_SCALE);
  assert.equal(enemy.reach, ENEMY_TYPES.slime.reach * COMBAT_SCALE);
  const original = hurtbox({ ...enemy, renderScale: 1, combatScale: 1, barH: ENEMY_TYPES.slime.barH });
  const smaller = hurtbox(enemy);
  assert.ok(Math.abs(smaller.hx / original.hx - COMBAT_SCALE) < 1e-8);
  assert.ok(Math.abs(smaller.hy / original.hy - COMBAT_SCALE) < 1e-8);
  const boss = g.spawnEnemy("boss", 400, 150);
  assert.equal(boss.renderScale, BOSS_RENDER_SCALE);
  assert.equal(hurtbox(boss).hx, 14 * COMBAT_SCALE);
  g.render();
});

test("a target outside the shortened sword range is missed while a closer one is hit", () => {
  const g = game();
  g.hero.x = 100; g.hero.y = 150; g.hero.facing = 1;
  const near = g.spawnEnemy("slime", 145, 150); near.state = "chase";
  const far = g.spawnEnemy("slime", 168, 150); far.state = "chase";
  const result = g.weaponStrike(g.hero.weapon.attack, { dmg: 10, knock: 0, crit: false });
  assert.deepEqual(result.hits, [near]);
  assert.equal(far.hp, far.maxHp);
  assert.deepEqual(result.points, g.weaponAttackPath(g.hero.weapon.attack));
});

test("melee strikes reach the enemy footprint edge, not just its centre point", () => {
  const g = game();
  g.hero.x = 100; g.hero.y = 150; g.hero.facing = 1;
  // Centre sits past the old centre-point reach, but the slime's body still overlaps the blade.
  const edge = g.spawnEnemy("slime", 163, 150); edge.state = "chase"; edge.prevX = 163; edge.prevY = 150;
  const result = g.weaponStrike(g.hero.weapon.attack, { dmg: 10, knock: 0, crit: false });
  assert.deepEqual(result.hits, [edge]);
  const g2 = game();
  g2.hero.x = 100; g2.hero.y = 150; g2.hero.facing = 1;
  const far = g2.spawnEnemy("slime", 176, 150); far.state = "chase"; far.prevX = 176; far.prevY = 150;
  assert.equal(g2.weaponStrike(g2.hero.weapon.attack, { dmg: 10, knock: 0, crit: false }).hits.length, 0);
  assert.equal(far.hp, far.maxHp);
});

test("frost damage radius and lightning telegraph shrink with their combat effects", () => {
  const g = game();
  g.hero.setClass("mage");
  g.hero.x = 100; g.hero.y = 150;
  const near = g.spawnEnemy("slime", 155, 150); near.state = "chase"; near.update = () => {};
  const far = g.spawnEnemy("slime", 169, 150); far.state = "chase"; far.update = () => {};
  assert.ok(g.cast("l"));
  advance(g, 0.55);
  assert.ok(near.hp < near.maxHp);
  assert.equal(far.hp, far.maxHp);
  assert.ok(g.effects.every((effect) => effect.scale === COMBAT_SCALE));
  g.hero.mp = g.hero.maxMp;
  assert.ok(g.cast("u"));
  assert.equal(g.telegraphs.at(-1).r, 40 * COMBAT_SCALE);
});

test("touch joystick applies a circular deadzone and normalized diagonal output", () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 };
  assert.deepEqual(joystickVector(50, 50, rect), { x: 0, y: 0 });
  const diagonal = joystickVector(92, 92, rect);
  assert.ok(diagonal.x > 0 && diagonal.y > 0);
  assert.ok(Math.hypot(diagonal.x, diagonal.y) <= 1.001);
  const horizontal = joystickVector(100, 50, rect);
  assert.ok(horizontal.x > 0.99 && Math.abs(horizontal.y) < 0.01);
});

test("dodge has a forgiving invulnerability window and buffers early input", () => {
  const g = game();
  const enemy = g.spawnEnemy("slime", 90, 150); enemy.state = "chase"; enemy.prevX = enemy.x; enemy.prevY = enemy.y;
  assert.ok(g.hero.tryDash(g));
  assert.ok(g.hero.dodgeWindow >= 0.4);
  const hp = g.hero.hp;
  assert.equal(g.hero.hurt(g, 30, { fromX: enemy.x }), false);
  assert.equal(g.hero.hp, hp);
  advance(g, 0.3);
  assert.ok(g.hero.invuln > 0, "the forgiveness tail lasts after the movement burst");
  assert.equal(g.hero.hurt(g, 30, { fromX: enemy.x }), false);
  advance(g, 0.9);
  g.hero.tryDash(g);
  advance(g, g.hero.dashCd - 0.05);
  assert.equal(g.hero.tryDash(g), false);
  assert.ok(g.hero.dodgeBuffer > 0, "a second press is buffered during cooldown");
  advance(g, 0.18);
  assert.ok(g.hero.dashT > 0 || g.hero.dodgeWindow > 0, "buffered dodge fires when ready");
});
