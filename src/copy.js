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
    returnCamp: "返回营地",
    hubDepartHint: "请走到营地传送门再出发",
    hubDepartReady: "Enter 踏入遗迹",
    hubAdventureSign: "冒险传送门",
    hubTownSign: "→ 余烬镇",
    hubCampSign: "← 初始营地",
    hubTownArrive: "余烬镇",
    hubCampArrive: "初始营地",
    pausedPrompt: "点此继续 · P/ESC · C 回营地 · R 重开",
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
    ap: "行动",
    apLow: "行动力不足",
    stashGain: (name) => `获得 ${name}`,
    embers: "余烬",
    continueSave: "继续存档",
    toCamp: "回营地",
    autoBattle: "自动战斗",
    autoLoot: "自动拾取",
    autoBattleHud: "战斗",
    autoLootHud: "拾取",
    autoOn: "自动",
    autoBattleHint: "自动寻敌、普攻与技能轮转。",
    autoLootHint: "靠近掉落物并拾取生命/法力/经验。",
    guardianFallen: "守卫陨落",
    wardenAsh: "守门人成灰",
    lootHp: "生命 +18",
    lootMp: "法力 +24",
    lootXp: "经验 +8",
    equipped: (name) => `${name} 已装备`,
    skillReady: (name) => `${name} 就位`,
    weapons: "武器",
    meleeWeapons: "近战",
    thrownWeapons: "投掷",
    inventoryHint: "1–3 近战 · 4–6 投掷 · 方向键选槽",
    inventoryReturn: "配好后返回战斗",
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
    returnCamp: "BACK TO CAMP",
    hubDepartHint: "Walk to the camp portal first",
    hubDepartReady: "Enter · depart",
    hubAdventureSign: "Adventure gate",
    hubTownSign: "→ Hearth Town",
    hubCampSign: "← Starter Camp",
    hubTownArrive: "Hearth Town",
    hubCampArrive: "Starter Camp",
    pausedPrompt: "P/ESC RESUME · C CAMP · R RESTART",
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
    ap: "AP",
    apLow: "NOT ENOUGH AP",
    stashGain: (name) => `+ ${name}`,
    embers: "EMBER",
    continueSave: "CONTINUE SAVE",
    toCamp: "ENTER CAMP",
    autoBattle: "Auto battle",
    autoLoot: "Auto loot",
    autoBattleHud: "FIGHT",
    autoLootHud: "LOOT",
    autoOn: "AUTO",
    autoBattleHint: "Chase foes and rotate skills.",
    autoLootHint: "Run to pickups when useful.",
    lootHp: "HP +18",
    lootMp: "MP +24",
    lootXp: "XP +8",
    equipped: (name) => `${name} EQUIPPED`,
    skillReady: (name) => `${name} READY`,
    weapons: "WEAPONS",
    meleeWeapons: "MELEE",
    thrownWeapons: "THROWN",
    inventoryHint: "1–3 MELEE · 4–6 THROWN · ARROWS SLOT",
    inventoryReturn: "RETURN TO FIGHT",
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
    returnCamp: "キャンプへ",
    hubDepartHint: "キャンプの転送門まで進んでください",
    hubDepartReady: "Enter で出発",
    hubAdventureSign: "冒険の門",
    hubTownSign: "→ ハース町",
    hubCampSign: "← 始まりのキャンプ",
    hubTownArrive: "ハース町",
    hubCampArrive: "始まりのキャンプ",
    pausedPrompt: "P/ESC 再開 · C キャンプ · R リトライ",
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
    ap: "AP",
    apLow: "行動力不足",
    stashGain: (name) => `${name} 獲得`,
    embers: "EMBER",
    continueSave: "セーブ続行",
    toCamp: "キャンプへ",
    autoBattle: "自動戦闘",
    autoLoot: "自動拾得",
    autoBattleHud: "戦闘",
    autoLootHud: "拾得",
    autoOn: "AUTO",
    autoBattleHint: "敵を追尾しスキルを使用します。",
    autoLootHint: "ドロップに近づいて取得します。",
    lootHp: "HP +18",
    lootMp: "MP +24",
    lootXp: "XP +8",
    equipped: (name) => `${name} EQUIPPED`,
    skillReady: (name) => `${name} READY`,
    weapons: "武器",
    meleeWeapons: "近接",
    thrownWeapons: "投擲",
    inventoryHint: "1–3 近接 · 4–6 投擲 · 矢印でスロット",
    inventoryReturn: "戦闘に戻る",
  },
};

export function weaponLabel(g, weapon) {
  if (!weapon) return "";
  return pick(g, weapon.nameEn, weapon.name, weapon.nameJa ?? weapon.nameEn);
}

export function weaponDesc(g, weapon) {
  if (!weapon) return "";
  return pick(g, weapon.descEn ?? weapon.nameEn, weapon.desc ?? weapon.name, weapon.descJa ?? weapon.nameJa ?? weapon.nameEn);
}

export function skillLabel(g, skill) {
  if (!skill) return "";
  return pick(g, skill.nameEn, skill.name, skill.nameJa ?? skill.nameEn);
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
