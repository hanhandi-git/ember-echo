/** Browser persistence for loadout, stash, and in-progress runs. */

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
  };
}

export function collectSave(game) {
  const playing = game.state === "playing" && game.hero.alive
    && game.phase !== "title" && game.phase !== "travel";
  return {
    v: SAVE_VERSION,
    profile: { ...heroProfile(game.hero), ...gameProfile(game) },
    run: playing ? {
      active: true,
      stageIndex: game.stageIndex,
      waveIndex: game.waveIndex,
      phase: game.phase,
      kills: game.kills,
      runTime: game.runTime,
      hero: heroRunStats(game.hero),
    } : { active: false },
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
  if (profile.stash && typeof profile.stash === "object") hero.stash = { ...profile.stash };
  if (profile.look) hero.equipLook(profile.look);
  if (profile.meleeWeaponId) hero.equipWeapon(profile.meleeWeaponId);
  if (profile.thrownWeaponId) hero.equipWeapon(profile.thrownWeaponId);
  if (Array.isArray(profile.skillSlots) && profile.skillSlots.length === hero.skillSlots.length) {
    hero.skillSlots = [...profile.skillSlots];
  }
}

export function applyHeroRunStats(hero, stats) {
  if (!stats) return;
  Object.assign(hero, {
    level: stats.level ?? hero.level,
    hp: stats.hp ?? hero.hp,
    maxHp: stats.maxHp ?? hero.maxHp,
    mp: stats.mp ?? hero.mp,
    maxMp: stats.maxMp ?? hero.maxMp,
    ap: stats.ap ?? hero.ap,
    maxAp: stats.maxAp ?? hero.maxAp,
    xp: stats.xp ?? hero.xp,
    xpNext: stats.xpNext ?? hero.xpNext,
    dmgMul: stats.dmgMul ?? hero.dmgMul,
    speed: stats.speed ?? hero.speed,
  });
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
