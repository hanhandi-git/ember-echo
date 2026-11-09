import { test } from "node:test";
import assert from "node:assert/strict";
import { Game } from "../src/game.js";
import { HUB_ADVENTURE_GATE, HUB_SPAWNS } from "../src/content/hub-worlds.js";
import { persistSave, loadSave, canContinue, applyHeroProfile } from "../src/save.js";
import { UPGRADE_STATS, upgradeCost, spentUpgrades, emberForXp } from "../src/upgrades.js";

function mockGame() {
  return new Game({ getContext: () => ({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData() {},
  }) });
}

function reachGate(g) {
  g.hero.spawn(HUB_ADVENTURE_GATE.x, HUB_ADVENTURE_GATE.y);
  g.tick(1 / 60);
}

const store = new Map();
test.beforeEach(() => {
  store.clear();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
});

test("a fresh boot starts in the walkable camp and departure requires portal preparation", () => {
  const g = mockGame();
  assert.equal(g.state, "camp");
  assert.equal(g.phase, "camp");
  assert.equal(g.hubActive, true);
  assert.equal(g.worldW, 640);
  assert.ok(g.mapFxTiles.length === 2);
  assert.equal(g.hero.hp, g.hero.maxHp);
  assert.equal(g.campMenuOpen, false);
  assert.equal(g.hero.x, HUB_SPAWNS.camp[0]);
  g.tryHubDepart();
  assert.equal(g.state, "camp", "the camp action waits at the gate");
  g.enterBattle();
  assert.equal(g.state, "camp", "departure cannot bypass the portal");
  reachGate(g);
  assert.equal(g.campMenuOpen, true);
  assert.equal(g.state, "camp", "entering the portal opens preparation, not battle");
  g.enterBattle();
  assert.equal(g.state, "playing");
  assert.equal(g.phase, "intro");
  assert.equal(g.stageIndex, 0);
});

test("portal preparation freezes movement, can be cancelled and reopens after leaving the gate", () => {
  const g = mockGame();
  let opened = 0;
  g.domUi = {
    openCamp() { opened++; },
    close() { g.campMenuOpen = false; },
  };
  g.keys.add("d");
  g.tick(0.25);
  assert.ok(g.hero.x > HUB_SPAWNS.camp[0], "the initial camp accepts movement");
  reachGate(g);
  assert.equal(opened, 1);
  const x = g.hero.x;
  g.keys.add("d");
  g.touchMove = { x: 1, y: 0 };
  g.tick(0.25);
  assert.equal(g.hero.x, x, "world input cannot move the hero behind the modal");

  g.domUi.close();
  g.keys.clear();
  g.touchMove = { x: 0, y: 0 };
  g.tick(0.1);
  assert.equal(opened, 1, "cancelling does not immediately reopen preparation");
  g.hero.x = HUB_ADVENTURE_GATE.x - HUB_ADVENTURE_GATE.r - 10;
  g.tick(0.1);
  reachGate(g);
  assert.equal(opened, 2);
  g.enterBattle();
  assert.equal(g.state, "playing");
});

test("kills and stage clears award embers", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  const slime = g.spawnEnemy("slime", 200, 150);
  slime.state = "chase";
  const before = g.hero.embers;
  slime.hurt(g, 9999, { crit: false });
  assert.equal(g.hero.embers, before + emberForXp(slime.xp));
  assert.ok(g.hero.embers > 0);

  g.phase = "fight";
  g.waveIndex = g.stage.waves.length - 1;
  const afterKill = g.hero.embers;
  g.stageClear();
  assert.equal(g.hero.embers, afterKill + 20);
});

test("camp upgrades spend embers, raise real stats and cap out", () => {
  const g = mockGame();
  g.hero.embers = 10000;
  const baseHp = g.hero.maxHp, baseMp = g.hero.maxMp, baseSpeed = g.hero.speed;
  const vitality = UPGRADE_STATS.find((u) => u.id === "vitality");
  assert.ok(g.hero.buyUpgrade("vitality"));
  assert.equal(g.hero.maxHp, baseHp + vitality.per);
  assert.equal(g.hero.embers, 10000 - upgradeCost(vitality, 0));

  assert.ok(g.hero.buyUpgrade("spirit"));
  assert.equal(g.hero.maxMp, baseMp + UPGRADE_STATS.find((u) => u.id === "spirit").per);
  assert.ok(g.hero.buyUpgrade("haste"));
  assert.equal(g.hero.speed, baseSpeed + 2);
  const before = g.hero.dmgMul;
  assert.ok(g.hero.buyUpgrade("might"));
  assert.ok(g.hero.dmgMul > before);

  for (let i = g.hero.upgradeRank("vitality"); i < vitality.max; i++) assert.ok(g.hero.buyUpgrade("vitality"));
  assert.equal(g.hero.upgradeRank("vitality"), vitality.max);
  assert.equal(g.hero.buyUpgrade("vitality"), false, "max rank cannot be bought again");
  assert.equal(g.hero.buyUpgrade("unknown"), false);
});

test("buying an upgrade fails when embers are short", () => {
  const g = mockGame();
  g.hero.embers = 0;
  assert.equal(g.hero.buyUpgrade("vitality"), false);
  const hp = g.hero.maxHp;
  assert.equal(g.hero.maxHp, hp);
});

test("respec refunds every spent ember and rolls stats back", () => {
  const g = mockGame();
  g.hero.embers = 500;
  const baseHp = g.hero.maxHp, baseDmg = g.hero.dmgMul;
  while (g.hero.buyUpgrade("vitality"));
  g.hero.buyUpgrade("might");
  assert.ok(spentUpgrades(g.hero.upgrades) > 0);
  const embersBefore = g.hero.embers;
  const spent = spentUpgrades(g.hero.upgrades);
  const refund = g.hero.respecUpgrades();
  assert.equal(refund, spent);
  assert.equal(g.hero.embers, embersBefore + refund);
  assert.equal(g.hero.maxHp, baseHp);
  assert.ok(Math.abs(g.hero.dmgMul - baseDmg) < 1e-9);
  assert.deepEqual(g.hero.upgrades, { vitality: 0, spirit: 0, might: 0, haste: 0 });
  assert.equal(g.hero.respecUpgrades(), 0, "nothing left to refund");
});

test("embers, ranks and their stat bonuses persist across reloads", () => {
  const g = mockGame();
  g.hero.embers = 260;
  g.hero.buyUpgrade("vitality");
  g.hero.buyUpgrade("might");
  const expected = {
    embers: g.hero.embers,
    maxHp: g.hero.maxHp,
    dmgMul: g.hero.dmgMul,
    upgrades: { ...g.hero.upgrades },
  };
  persistSave(g);
  const data = loadSave();
  assert.equal(data.profile.embers, expected.embers);
  assert.deepEqual(data.profile.upgrades, expected.upgrades);

  const g2 = mockGame();
  applyHeroProfile(g2.hero, data.profile);
  assert.equal(g2.hero.embers, expected.embers);
  assert.deepEqual(g2.hero.upgrades, expected.upgrades);
  assert.equal(g2.hero.maxHp, expected.maxHp);
  assert.ok(Math.abs(g2.hero.dmgMul - expected.dmgMul) < 1e-9);
});

test("equipping gear in camp keeps an expedition resumable", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  g.hero.hp = 73;
  g.kills = 9;
  persistSave(g);
  assert.ok(canContinue(loadSave()));

  g.enterCamp();
  assert.equal(g.state, "camp");
  assert.ok(canContinue(loadSave()), "entering camp does not erase the run");
  g.hero.equipWeapon("moon-scythe", g);
  assert.ok(canContinue(loadSave()), "gearing up at camp keeps the run");

  reachGate(g);
  g.enterBattle();
  assert.equal(g.state, "playing");
  assert.equal(g.hero.hp, 73);
  assert.equal(g.kills, 9);
});

test("defeat and victory can return to camp with progression intact", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  g.hero.embers = 44;
  g.state = "gameover";
  g.enterCamp();
  assert.equal(g.state, "camp");
  assert.equal(g.phase, "camp");
  assert.equal(g.campMenuOpen, false);
  assert.equal(g.hero.embers, 44);
  assert.equal(g.hero.alive, true);
  assert.equal(g.hero.hp, g.hero.maxHp);
});

test("upgrades bought before resuming a saved run carry into that run", () => {
  const g = mockGame();
  g.startRun({ fresh: true });
  g.hero.hp = 80;
  g.kills = 5;
  persistSave(g);
  g.enterCamp();
  g.hero.embers = 500;
  assert.ok(g.hero.buyUpgrade("vitality"));
  persistSave(g);

  const g2 = mockGame();
  reachGate(g2);
  g2.enterBattle();
  assert.equal(g2.state, "playing");
  assert.equal(g2.hero.maxHp, 124);
  assert.equal(g2.hero.hp, 94, "the new rank grants its HP immediately");
  assert.equal(g2.kills, 5);
});

test("the camp backdrop stage keeps its ambient scene ticking", () => {
  const g = mockGame();
  const t = g.mapFxTiles[0].t;
  g.tick(0.2);
  assert.ok(g.mapFxTiles[0].t > t);
  assert.equal(g.state, "camp");
});
