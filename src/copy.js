/** In-canvas pixel UI strings (Latin / 中文 / 日本語). */

export function gameLang(g) {
  return g?.language ?? (typeof localStorage !== "undefined" ? localStorage.getItem("ember-echo-language") : null) ?? "zh";
}

export function pick(g, en, zh, ja) {
  const lang = gameLang(g);
  if (lang === "zh") return zh ?? en;
  if (lang === "ja") return ja ?? en;
  return en;
}

export function stageAct(g, stage) {
  return pick(g, stage.actEn, stage.act, stage.actEn);
}

export function stageName(g, stage) {
  return pick(g, stage.nameEn, stage.name, stage.nameEn);
}

export function stageSub(g, stage) {
  return pick(g, stage.subEn, stage.sub, stage.subEn);
}

export const CANVAS = {
  zh: {
    duelist: "决斗者",
    level: "等级",
    kills: "击杀",
    combo: "连击",
    gate: "传送门 >",
    enterGate: "进入传送门",
    travelling: "穿越中",
    boss: "首领",
    wave: (i, n) => `第 ${i} / ${n} 波`,
    stageClear: "关卡通过",
    pausedKicker: "余烬回响",
    pausedTitle: "暂停",
    pausedSub: "火焰暂歇",
    continue: "继续  [P]",
    portalOpen: "传送门已开启",
    portalFinal: "终局之门已开启",
    portalEscape: "逃离之门已开启",
    waveGather: "暗影渐浓",
    levelUp: "升级",
    levelUpSub: "生命与法力提升",
    bossWarden: "冥河守卫",
    bossSub: "冥河深处",
    phase2: "阶段 II",
    phase3: "阶段 III",
    bossPhase2: "冥河封印解除",
    bossPhase3: "灰烬吞噬",
    hp: "生命",
    mp: "法力",
    guardianFallen: "守卫陨落",
    wardenAsh: "守门人成灰",
    lootHp: "生命 +18",
    lootMp: "法力 +24",
    lootXp: "经验 +8",
    equipped: (name) => `${name} 已装备`,
    skillReady: (name) => `${name} 就位`,
  },
  en: {
    duelist: "DUELIST",
    level: "LV",
    kills: "KILLS",
    combo: "COMBO",
    gate: "GATE >",
    enterGate: "ENTER THE GATE",
    travelling: "TRAVELLING",
    boss: "BOSS",
    wave: (i, n) => `WAVE ${i}/${n}`,
    stageClear: "STAGE CLEAR",
    pausedKicker: "EMBER ECHO",
    pausedTitle: "PAUSED",
    pausedSub: "THE EMBERS REST",
    continue: "CONTINUE  [P]",
    portalOpen: "PORTAL OPEN - MOVE RIGHT",
    portalFinal: "FINAL STAGE GATE OPEN",
    portalEscape: "ESCAPE GATE OPEN",
    waveGather: "MORE SHADOWS GATHER",
    levelUp: "LEVEL UP",
    levelUpSub: "LEVEL",
    bossWarden: "THE WARDEN",
    bossSub: "ACHERON",
    phase2: "PHASE II",
    phase3: "PHASE III",
    bossPhase2: "THE RIVER SEAL OPENS",
    bossPhase3: "ASH CONSUMES HIM",
    guardianFallen: "GUARDIAN FALLEN",
    wardenAsh: "THE WARDEN IS ASH",
    hp: "HP",
    mp: "MP",
    lootHp: "HP +18",
    lootMp: "MP +24",
    lootXp: "XP +8",
    equipped: (name) => `${name} EQUIPPED`,
    skillReady: (name) => `${name} READY`,
  },
  ja: {
    duelist: "DUELIST",
    level: "LV",
    kills: "KILLS",
    combo: "COMBO",
    gate: "GATE >",
    enterGate: "ENTER THE GATE",
    travelling: "TRAVELLING",
    boss: "BOSS",
    wave: (i, n) => `WAVE ${i}/${n}`,
    stageClear: "STAGE CLEAR",
    pausedKicker: "EMBER ECHO",
    pausedTitle: "PAUSED",
    pausedSub: "THE EMBERS REST",
    continue: "CONTINUE  [P]",
    portalOpen: "PORTAL OPEN - MOVE RIGHT",
    portalFinal: "FINAL STAGE GATE OPEN",
    portalEscape: "ESCAPE GATE OPEN",
    waveGather: "MORE SHADOWS GATHER",
    levelUp: "LEVEL UP",
    levelUpSub: "LEVEL",
    bossWarden: "THE WARDEN",
    bossSub: "ACHERON",
    phase2: "PHASE II",
    phase3: "PHASE III",
    bossPhase2: "THE RIVER SEAL OPENS",
    bossPhase3: "ASH CONSUMES HIM",
    guardianFallen: "GUARDIAN FALLEN",
    wardenAsh: "THE WARDEN IS ASH",
    hp: "HP",
    mp: "MP",
    lootHp: "HP +18",
    lootMp: "MP +24",
    lootXp: "XP +8",
    equipped: (name) => `${name} EQUIPPED`,
    skillReady: (name) => `${name} READY`,
  },
};

export function weaponLabel(g, weapon) {
  return pick(g, weapon.nameEn, weapon.name, weapon.nameJa ?? weapon.nameEn);
}

export function uiCopy(g) {
  const lang = gameLang(g);
  return CANVAS[lang] ?? CANVAS.zh;
}

export function lootLabel(g, kind) {
  const c = uiCopy(g);
  if (kind === "heart") return c.lootHp;
  if (kind === "potion") return c.lootMp;
  return c.lootXp;
}
