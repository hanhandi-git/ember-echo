/** Browser persistence for loadout, stash, permanent upgrades, and in-progress runs. */

import { emptyUpgrades } from "./upgrades.js";

export const SAVE_KEY = "ember-echo-save";
export const SAVE_VERSION = 1;

export const QUICK_MOVE_AP_COST = 28;

function storage() {
  return typeof localStorage !== "undefined" ? localStorage : null;
}

export function loadSave() {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveToStorage(data) {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(SAVE_KEY, JSON.stringify({ ...data, v: SAVE_VERSION, updatedAt: Date.now() }));
  } catch {
    /* quota or private mode */
  }
}

export function heroProfile(hero) {
  return {
    look: hero.look,
    meleeWeaponId: hero.meleeWeaponId,
    thrownWeaponId: hero.thrownWeaponId,
    skillSlots: [...hero.skillSlots],
    stash: { ...hero.stash },
    upgrades: { ...emptyUpgrades(), ...(hero.upgrades ?? {}) },
    embers: Math.max(0, Math.round(hero.embers ?? 0)),
  };
}

export function gameProfile(game) {
  return {
    autoBattle: !!game.autoBattle,
    autoLoot: !!game.autoLoot,
  };
}

export function heroRunStats(hero) {
  return {
    level: hero.level,
    hp: hero.hp,
    maxHp: hero.maxHp,
    mp: hero.mp,
    maxMp: hero.maxMp,
    ap: hero.ap,
    maxAp: hero.maxAp,
    xp: hero.xp,
    xpNext: hero.xpNext,
    dmgMul: hero.dmgMul,
    speed: hero.speed,
    upgradeHp: hero._upgradeHp ?? 0,
    upgradeMp: hero._upgradeMp ?? 0,
  };
}

export function collectSave(game) {
  const playing = ["playing", "paused", "inventory"].includes(game.state) && game.hero.alive
    && game.phase !== "camp" && game.phase !== "travel";
  let run = { active: false };
  if (playing) {
    run = {
      active: true,
      stageIndex: game.stageIndex,
      waveIndex: game.waveIndex,
      phase: game.phase,
      kills: game.kills,
      runTime: game.runTime,
      hero: heroRunStats(game.hero),
    };
  } else if (game.state === "camp") {
    // Equipping gear at camp must not erase an expedition that can still be resumed.
    const previous = loadSave()?.run;
    if (previous?.active) run = previous;
  }
  return {
    v: SAVE_VERSION,
    profile: { ...heroProfile(game.hero), ...gameProfile(game) },
    run,
  };
}

export function persistSave(game) {
  saveToStorage(collectSave(game));
}

export function canContinue(data = loadSave()) {
  return !!data?.run?.active && typeof data.run.stageIndex === "number";
}

export function applyGameProfile(game, profile) {
  if (!profile) return;
  game.autoBattle = !!profile.autoBattle;
  game.autoLoot = !!profile.autoLoot;
}

export function applyHeroProfile(hero, profile) {
  if (!profile) return;
  if (profile.upgrades && typeof profile.upgrades === "object") {
    hero.upgrades = { ...emptyUpgrades(), ...profile.upgrades };
  }
  if (Number.isFinite(profile.embers)) hero.embers = Math.max(0, Math.round(profile.embers));
  if (profile.stash && typeof profile.stash === "object") hero.stash = { ...profile.stash };
  if (profile.look) hero.equipLook(profile.look);
  if (profile.meleeWeaponId) hero.equipWeapon(profile.meleeWeaponId);
  if (profile.thrownWeaponId) hero.equipWeapon(profile.thrownWeaponId);
  if (Array.isArray(profile.skillSlots) && profile.skillSlots.length === hero.skillSlots.length) {
    hero.skillSlots = [...profile.skillSlots];
  }
  hero.applyUpgrades();
}

export function applyHeroRunStats(hero, stats) {
  if (!stats) return;
  // Upgrades bought at camp after this run was saved must carry into the resumed run.
  const upgradeHp = hero._upgradeHp ?? 0;
  const upgradeMp = hero._upgradeMp ?? 0;
  const dHp = upgradeHp - (stats.upgradeHp ?? 0);
  const dMp = upgradeMp - (stats.upgradeMp ?? 0);
  Object.assign(hero, {
    level: stats.level ?? hero.level,
    ap: stats.ap ?? hero.ap,
    maxAp: stats.maxAp ?? hero.maxAp,
    xp: stats.xp ?? hero.xp,
    xpNext: stats.xpNext ?? hero.xpNext,
    dmgMul: stats.dmgMul ?? hero.dmgMul,
    speed: stats.speed ?? hero.speed,
  });
  hero.maxHp = (stats.maxHp ?? hero.maxHp) + dHp;
  hero.maxMp = (stats.maxMp ?? hero.maxMp) + dMp;
  hero.hp = Math.min(hero.maxHp, (stats.hp ?? hero.hp) + Math.max(0, dHp));
  hero.mp = Math.min(hero.maxMp, (stats.mp ?? hero.mp) + Math.max(0, dMp));
  hero.applyMeleeStats();
}

export function resumeRun(game, data) {
  const run = data?.run;
  if (!run?.active) return false;
  game.audio.unlock();
  const profile = data.profile ?? heroProfile(game.hero);
  game.hero.reset();
  applyHeroProfile(game.hero, profile);
  applyHeroRunStats(game.hero, run.hero);
  game.kills = run.kills ?? 0;
  game.runTime = run.runTime ?? 0;
  game.loadStage(run.stageIndex ?? 0, false);
  if (run.phase === "fight") game.startWave(run.waveIndex ?? 0);
  else if (run.phase === "clear") {
    game.phase = "clear";
    game.phaseT = 0;
    game.openPortal();
  }
  return true;
}

export function clearRunSave(game) {
  const data = loadSave();
  const profile = heroProfile(game.hero);
  saveToStorage({ v: SAVE_VERSION, profile, run: { active: false } });
}
