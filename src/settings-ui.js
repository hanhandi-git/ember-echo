import { HERO_LOOKS, SKILL_META, SKILL_ATTR_ORDER, SKILL_ATTR_LABELS, skillAttr, MELEE_WEAPONS, THROWN_WEAPONS, STASH_ITEMS } from "./data.js";
import { stashLabel } from "./content/stash-catalog.js";
import { skillLabel, weaponLabel } from "./copy.js";
import { SKILL_KEYS } from "./controls.js";
import { weaponEquipKind } from "./weapons-util.js";
import { artUrl, weaponArtUrl, stashPickupArtUrl, installUiFrames } from "./ui-art.js";
import { drawHeroPortrait } from "./hero.js";
import { UPGRADE_STATS, upgradeCost } from "./upgrades.js";

const LANG = {
  zh: {
    "menu.kicker": "余烬回响", "menu.title": "背包与设置", "menu.subtitle": "选择武器、技能与语言。",
    "camp.kicker": "余烬回响 / CAMP", "camp.title": "营地", "camp.subtitle": "整备你的决斗者，然后踏入遗迹。",
    "tabs.loadout": "装备", "tabs.stash": "收藏", "tabs.skills": "技能", "tabs.upgrade": "升级", "tabs.appearance": "造型", "tabs.profile": "人物", "tabs.settings": "设置",
    "stash.title": "长期收藏", "stash.hint": "战斗中有几率掉落，会永久保存在浏览器。", "stash.empty": "还没有收藏品，去狩猎吧。", "stash.count": "数量",
    "loadout.weapons": "武器", "loadout.melee": "近战武器", "loadout.thrown": "投掷武器", "loadout.skills": "技能槽",
    "loadout.weaponHint": "点击卡片立即装备", "loadout.skillHint": "先选择槽位，再选择技能", "loadout.skillPick": "按属性筛选技能", "loadout.skillEmpty": "该属性暂无可用技能", "loadout.slot": "槽位",
    "loadout.equipped": "已装备", "loadout.ready": "可用", "loadout.replace": "替换", "settings.language": "语言",
    "settings.languageHint": "语言会保存在本机，下次打开仍会保留。", "settings.audio": "声音", "settings.audioHint": "所有音效均由 WebAudio 实时合成，音量与静音会保存在本机。", "settings.master": "总音量", "settings.sfx": "音效", "settings.music": "背景音乐", "settings.ambience": "环境音", "settings.musicHint": "原创芯片音乐会在营地、关卡和 Boss 战之间切换。", "settings.soundOn": "声音开启", "settings.soundOff": "已静音", "settings.mute": "静音", "settings.audioKeyHint": "战斗中按 M 也能快速静音；拖动音效滑杆会试听 UI 音效。", "settings.auto": "自动化", "settings.autoHint": "自动战斗/拾取开关在战斗画面左侧血条下方，点击切换；状态会写入存档。", "settings.autoBattle": "自动战斗", "settings.autoLoot": "自动拾取", "settings.autoBattleHint": "自动寻敌、普攻与技能轮转。", "settings.autoLootHint": "靠近掉落物并拾取生命/法力/经验。",
    "footer.hint": "选择后立即生效", "footer.return": "返回战斗", "footer.campHint": "整备完成后即可出发 · Enter 出发", "footer.enterBattle": "进入战斗", "footer.continue": "继续冒险", "footer.newRun": "新的征程", "footer.retreatCamp": "返回营地",
    "camp.hp": "生命", "camp.mp": "法力", "camp.attack": "攻击", "camp.speed": "移速", "camp.ranked": "强化", "camp.embers": "余烬", "camp.hint": "击败敌人与通关都会获得余烬，可在「升级」中永久强化。",
    "upgrade.title": "余烬强化", "upgrade.hint": "用余烬永久提升属性，死亡后依然保留。", "upgrade.invested": "已投入", "upgrade.max": "已满级", "upgrade.respec": "重置投入", "upgrade.note": "余烬由击败敌人和通关获得；重置投入会返还全部已使用的余烬。",
    "close": "关闭", "stats.damage": "伤害", "stats.speed": "移速", "stats.cost": "消耗", "stats.cooldown": "冷却", "profile.level": "等级", "profile.hp": "生命值", "profile.mp": "法力值", "profile.ap": "行动力", "profile.attack": "攻击力", "profile.defense": "防御力", "profile.speed": "速度", "profile.crit": "暴击率", "profile.embers": "余烬", "profile.xp": "经验", "profile.weapon": "武器", "profile.skill": "技能", "profile.title": "人物信息", "profile.appearance": "主角造型", "profile.appearanceHint": "点击立绘切换战斗外观",
  },
  en: {
    "menu.kicker": "EMBER ECHO / LOADOUT", "menu.title": "Loadout & Settings", "menu.subtitle": "Choose a weapon, skill kit and language.",
    "camp.kicker": "EMBER ECHO / CAMP", "camp.title": "Camp", "camp.subtitle": "Prepare your duelist, then step into the ruins.",
    "tabs.loadout": "Loadout", "tabs.stash": "Stash", "tabs.skills": "Skills", "tabs.upgrade": "Upgrade", "tabs.appearance": "Looks", "tabs.profile": "Hero", "tabs.settings": "Settings",
    "stash.title": "Collectibles", "stash.hint": "Drops in combat are saved in this browser.", "stash.empty": "No collectibles yet.", "stash.count": "Qty",
    "loadout.weapons": "Weapons", "loadout.melee": "Melee", "loadout.thrown": "Thrown", "loadout.skills": "Skill slots",
    "loadout.weaponHint": "Click a card to equip", "loadout.skillHint": "Pick a slot, then choose a skill", "loadout.skillPick": "Filter by element", "loadout.skillEmpty": "No skills in this element", "loadout.slot": "Slot",
    "loadout.equipped": "Equipped", "loadout.ready": "Ready", "loadout.replace": "Replace", "settings.language": "Language",
    "settings.languageHint": "Your language is saved on this device.", "settings.audio": "Audio", "settings.audioHint": "Every sound is synthesised live with WebAudio. Volumes and mute are saved on this device.", "settings.master": "Master", "settings.sfx": "Effects", "settings.music": "Music", "settings.ambience": "Ambience", "settings.musicHint": "Original chiptune loops switch between camp, stages and boss fights.", "settings.soundOn": "Sound on", "settings.soundOff": "Muted", "settings.mute": "Mute", "settings.audioKeyHint": "Press M in battle to mute instantly; dragging the effects slider previews the UI cue.", "settings.auto": "Automation", "settings.autoHint": "Auto battle and loot toggles are below the HP bars on the left HUD.", "settings.autoBattle": "Auto battle", "settings.autoLoot": "Auto loot", "settings.autoBattleHint": "Chase foes and rotate skills.", "settings.autoLootHint": "Run to useful pickups.",
    "footer.hint": "Changes apply immediately", "footer.return": "Return to fight", "footer.campHint": "All set · press Enter to depart", "footer.enterBattle": "Enter battle", "footer.continue": "Continue run", "footer.newRun": "New expedition", "footer.retreatCamp": "Back to camp",
    "camp.hp": "Health", "camp.mp": "Mana", "camp.attack": "Attack", "camp.speed": "Speed", "camp.ranked": "Ranks", "camp.embers": "Embers", "camp.hint": "Embers drop from foes and stage clears. Spend them on permanent upgrades in Upgrade.",
    "upgrade.title": "Ember upgrades", "upgrade.hint": "Permanent stat boosts that survive death.", "upgrade.invested": "Invested", "upgrade.max": "Maxed", "upgrade.respec": "Reset ranks", "upgrade.note": "Embers come from kills and stage clears. Resetting refunds every ember spent.",
    "close": "Close", "stats.damage": "Damage", "stats.speed": "Speed", "stats.cost": "Cost", "stats.cooldown": "Cooldown", "profile.level": "Level", "profile.hp": "Health", "profile.mp": "Mana", "profile.ap": "Action", "profile.attack": "Attack", "profile.defense": "Defense", "profile.speed": "Speed", "profile.crit": "Crit chance", "profile.embers": "Embers", "profile.xp": "XP", "profile.weapon": "Weapon", "profile.skill": "Skill", "profile.title": "Hero details", "profile.appearance": "Hero look", "profile.appearanceHint": "Click a portrait to use in combat",
  },
  ja: {
    "menu.kicker": "EMBER ECHO / LOADOUT", "menu.title": "装備と設定", "menu.subtitle": "武器、スキル、言語を選択します。",
    "camp.kicker": "EMBER ECHO / CAMP", "camp.title": "キャンプ", "camp.subtitle": "決闘者を整えて、遺跡へ踏み出そう。",
    "tabs.loadout": "装備", "tabs.stash": "収藏", "tabs.skills": "スキル", "tabs.upgrade": "強化", "tabs.appearance": "スタイル", "tabs.profile": "人物", "tabs.settings": "設定",
    "stash.title": "コレクション", "stash.hint": "戦闘ドロップはブラウザに保存されます。", "stash.empty": "まだ収集品がありません。", "stash.count": "数",
    "loadout.weapons": "武器", "loadout.melee": "近接武器", "loadout.thrown": "投擲武器", "loadout.skills": "スキルスロット",
    "loadout.weaponHint": "カードをクリックして装備", "loadout.skillHint": "スロットを選んでスキルを選択", "loadout.skillPick": "属性で絞り込み", "loadout.skillEmpty": "この属性のスキルはありません", "loadout.slot": "スロット",
    "loadout.equipped": "装備中", "loadout.ready": "使用可能", "loadout.replace": "変更", "settings.language": "言語",
    "settings.languageHint": "言語はこの端末に保存されます。", "settings.audio": "サウンド", "settings.audioHint": "効果音はすべて WebAudio でリアルタイム合成。音量とミュートは端末に保存されます。", "settings.master": "全体音量", "settings.sfx": "効果音", "settings.music": "BGM", "settings.ambience": "環境音", "settings.musicHint": "オリジナルのチップチューンがキャンプ・ステージ・ボス戦で切り替わります。", "settings.soundOn": "サウンド ON", "settings.soundOff": "ミュート中", "settings.mute": "ミュート", "settings.audioKeyHint": "戦闘中は M キーでもミュートできます。効果音スライダーを動かすと UI 音が試聴できます。", "settings.auto": "自動化", "settings.autoHint": "自動戦闘/拾得は画面左・体力バーの下で切り替えます。", "settings.autoBattle": "自動戦闘", "settings.autoLoot": "自動拾得", "settings.autoBattleHint": "敵を追尾しスキルを使用。", "settings.autoLootHint": "ドロップに近づいて取得。",
    "footer.hint": "変更はすぐ反映されます", "footer.return": "戦闘に戻る", "footer.campHint": "準備完了 · Enter で出発", "footer.enterBattle": "戦闘へ", "footer.continue": "冒険を続ける", "footer.newRun": "新しい冒険", "footer.retreatCamp": "キャンプへ戻る",
    "camp.hp": "体力", "camp.mp": "マナ", "camp.attack": "攻撃", "camp.speed": "速度", "camp.ranked": "強化", "camp.embers": "余燼", "camp.hint": "敵撃破とステージクリアで余燼を獲得。「強化」で永続的に鍛えられます。",
    "upgrade.title": "余燼強化", "upgrade.hint": "死んでも失われない永続強化。", "upgrade.invested": "投入済み", "upgrade.max": "最大", "upgrade.respec": "投入をリセット", "upgrade.note": "余燼は撃破とクリアで獲得。リセットすると使用した余燼が全て戻ります。",
    "close": "閉じる", "stats.damage": "攻撃", "stats.speed": "速度", "stats.cost": "消費", "stats.cooldown": "再使用", "profile.level": "レベル", "profile.hp": "体力", "profile.mp": "マナ", "profile.ap": "行動力", "profile.attack": "攻撃", "profile.defense": "防御", "profile.speed": "速度", "profile.crit": "クリティカル", "profile.embers": "余燼", "profile.xp": "経験値", "profile.weapon": "武器", "profile.skill": "スキル", "profile.title": "人物情報", "profile.appearance": "主人公スタイル", "profile.appearanceHint": "立ち絵をクリックして装備",
  },
};

const LANGUAGES = [
  ["zh", "🇨🇳", "中文", "简体中文"], ["en", "🇬🇧", "English", "English"], ["ja", "🇯🇵", "日本語", "日本語"],
];

const TAB_I18N = {
  loadout: "tabs.loadout", stash: "tabs.stash", skills: "tabs.skills", upgrade: "tabs.upgrade",
  appearance: "tabs.appearance", profile: "tabs.profile", settings: "tabs.settings",
};
const PANE_IDS = ["loadout", "stash", "skills", "appearance", "profile", "settings", "upgrade"];
const TAB_ORDER = {
  battle: ["loadout", "stash", "skills", "appearance", "profile", "settings"],
  camp: ["profile", "loadout", "skills", "upgrade", "stash", "appearance", "settings"],
};

function skillIcon(icon, selected = false) {
  return `<img src="${artUrl("skill", { icon, selected, hud: true })}" alt="" aria-hidden="true" draggable="false">`;
}

function t(code, key) { return LANG[code]?.[key] ?? LANG.zh[key] ?? key; }

/** Keep panel markup in sync when index.html and game.js were updated at different times. */
function ensureSettingsDom(panel, language) {
  const shell = panel.querySelector(".settings-shell");
  if (!shell) return;
  const footer = shell.querySelector(".settings-footer");
  const main = shell.querySelector(".settings-main") ?? shell;
  for (const id of PANE_IDS) {
    if (shell.querySelector(`[data-content="${id}"]`)) continue;
    const pane = document.createElement("div");
    pane.className = "settings-content";
    pane.dataset.content = id;
    pane.hidden = id !== "loadout";
    if (footer && footer.parentElement === main) main.insertBefore(pane, footer);
    else main.appendChild(pane);
  }
  const tablist = shell.querySelector(".settings-tabs");
  if (tablist) {
    for (const id of PANE_IDS) {
      if (tablist.querySelector(`[data-tab="${id}"]`)) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "settings-tab";
      btn.dataset.tab = id;
      btn.dataset.i18n = TAB_I18N[id];
      btn.textContent = t(language, TAB_I18N[id]);
      tablist.appendChild(btn);
    }
  }
  const actions = shell.querySelector(".settings-footer-actions") ?? footer;
  if (actions && !actions.querySelector('[data-action="enter-battle"]')) {
    const enter = document.createElement("button");
    enter.type = "button";
    enter.className = "primary-button camp-only";
    enter.dataset.action = "enter-battle";
    enter.dataset.i18n = "footer.enterBattle";
    enter.textContent = t(language, "footer.enterBattle");
    actions.appendChild(enter);
  }
  if (actions && !actions.querySelector('[data-action="new-run"]')) {
    const fresh = document.createElement("button");
    fresh.type = "button";
    fresh.className = "secondary-button camp-only";
    fresh.dataset.action = "new-run";
    fresh.dataset.i18n = "footer.newRun";
    fresh.textContent = t(language, "footer.newRun");
    actions.insertBefore(fresh, actions.querySelector('[data-action="close"]') ?? null);
  }
  if (actions && !actions.querySelector('[data-action="retreat-camp"]')) {
    const retreat = document.createElement("button");
    retreat.type = "button";
    retreat.className = "secondary-button battle-retreat";
    retreat.dataset.action = "retreat-camp";
    retreat.dataset.i18n = "footer.retreatCamp";
    retreat.hidden = true;
    retreat.textContent = t(language, "footer.retreatCamp");
    actions.insertBefore(retreat, actions.querySelector('[data-action="close"]') ?? null);
  }
}

export function createSettingsUI(game) {
  const panel = document.querySelector("#settings-panel");
  if (!panel) {
    return {
      open() {}, openCamp() {}, close() {}, render() {},
      handleKey() { return false; }, setLanguage() {},
    };
  }
  const lang = localStorage.getItem("ember-echo-language") || "zh";
  game.language = LANG[lang] ? lang : "zh";
  ensureSettingsDom(panel, game.language);
  const loadout = panel.querySelector('[data-content="loadout"]');
  const stashPanel = panel.querySelector('[data-content="stash"]');
  const skillsPanel = panel.querySelector('[data-content="skills"]');
  const upgradePanel = panel.querySelector('[data-content="upgrade"]');
  const appearance = panel.querySelector('[data-content="appearance"]');
  const profile = panel.querySelector('[data-content="profile"]');
  const settings = panel.querySelector('[data-content="settings"]');
  const tablist = panel.querySelector(".settings-tabs");
  const campHero = panel.querySelector(".camp-hero");
  let mode = "battle", tab = "loadout", skillAttrTab = "slash", returnFocus = null;
  const attrLabel = (id) => {
    const labels = SKILL_ATTR_LABELS[id];
    if (!labels) return id;
    return game.language === "zh" ? labels.zh : game.language === "ja" ? labels.ja : labels.en;
  };
  const attrsWithSkills = () => SKILL_ATTR_ORDER.filter((id) => SKILL_META.some((s) => skillAttr(s) === id));
  const localized = (value) => value?.[game.language] ?? value?.en ?? "";
  installUiFrames(panel.parentElement);
  document.documentElement.lang = game.language === "zh" ? "zh-CN" : game.language;

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const skillName = (skill) => skillLabel(game, skill);
  const weaponName = (weapon) => weaponLabel(game, weapon);
  const lookName = (look) => game.language === "zh" ? look.label : look.name;

  function weaponCard(w, h) {
    const equipped = h.isWeaponEquipped(w.id);
    return `<button class="item-card ${equipped ? "is-equipped" : ""}" data-weapon="${w.id}" data-weapon-kind="${weaponEquipKind(w)}" data-kind="weapon-${w.id}" aria-pressed="${equipped}" aria-label="${escapeHtml(weaponName(w))}">
        <span class="item-icon"><img src="${weaponArtUrl(w)}" alt="" aria-hidden="true" draggable="false"></span><span class="item-name">${escapeHtml(weaponName(w))}</span>
        <span class="item-meta">${t(game.language, "stats.damage")} ${w.dmgMul > 1 ? "+" : ""}${Math.round((w.dmgMul - 1) * 100)}% · ${t(game.language, "stats.speed")} ${w.speed}</span>
        ${equipped ? `<span class="item-badge">${t(game.language, "loadout.equipped")}</span>` : ""}</button>`;
  }

  function renderLoadout() {
    if (!loadout) return;
    const h = game.hero;
    const meleeGrid = MELEE_WEAPONS.map((w) => weaponCard(w, h)).join("");
    const thrownGrid = THROWN_WEAPONS.map((w) => weaponCard(w, h)).join("");
    const equippedArt = artUrl("card", { title: "", type: "", level: "", detail: "", glyph: "none", rarity: "legendary", equipped: false, selected: true });
    loadout.innerHTML = `<div class="loadout-overview loadout-overview--dual">
      <img class="overview-art" src="${equippedArt}" alt="" aria-hidden="true">
      <div class="overview-weapons">
        <div class="overview-weapon"><img src="${weaponArtUrl(h.meleeWeapon)}" alt="" aria-hidden="true" draggable="false"><span>${t(game.language, "loadout.melee")}</span><strong>${escapeHtml(weaponName(h.meleeWeapon))}</strong></div>
        <div class="overview-weapon"><img src="${weaponArtUrl(h.thrownWeapon)}" alt="" aria-hidden="true" draggable="false"><span>${t(game.language, "loadout.thrown")}</span><strong>${escapeHtml(weaponName(h.thrownWeapon))}</strong></div>
      </div>
      <div class="overview-copy"><small>${t(game.language, "stats.damage")} ${Math.round(h.dmgMul * 100)}% · ${t(game.language, "stats.speed")} ${h.speed}</small></div>
    </div>
    <section class="loadout-section"><h2 class="section-title">${t(game.language, "loadout.melee")}</h2><div class="item-grid">${meleeGrid}</div></section>
    <section class="loadout-section"><h2 class="section-title">${t(game.language, "loadout.thrown")}</h2><div class="item-grid">${thrownGrid}</div></section>`;
  }

  function renderStash() {
    if (!stashPanel) return;
    const h = game.hero;
    const cards = STASH_ITEMS.map((item) => {
      const count = h.stashCount(item.id);
      return `<div class="item-card stash-card ${count ? "has-count" : "is-muted"}" aria-label="${escapeHtml(stashLabel(game, item))}">
        <span class="item-icon"><img src="${stashPickupArtUrl(item.id)}" alt="" aria-hidden="true" draggable="false"></span>
        <span class="item-name">${escapeHtml(stashLabel(game, item))}</span>
        <span class="item-meta">${t(game.language, "stash.count")} ×${count}</span>
      </div>`;
    }).join("");
    const empty = STASH_ITEMS.every((item) => !h.stashCount(item.id));
    stashPanel.innerHTML = `<section class="loadout-section">
      <h2 class="section-title">${t(game.language, "stash.title")} <span class="section-caption">${t(game.language, "stash.hint")}</span></h2>
      ${empty ? `<p class="settings-note">${t(game.language, "stash.empty")}</p>` : ""}
      <div class="item-grid stash-grid">${cards}</div>
    </section>`;
  }

  function renderSkills() {
    if (!skillsPanel) return;
    const h = game.hero;
    const activeSlot = game.ui.inventorySkillPick;
    const present = attrsWithSkills();
    if (!present.includes(skillAttrTab)) skillAttrTab = present[0] ?? "slash";
    const attrTabs = present.map((id) => {
      const active = skillAttrTab === id;
      return `<button type="button" class="skill-attr-tab ${active ? "is-active" : ""}" data-skill-attr="${id}" role="tab" aria-selected="${active}">${escapeHtml(attrLabel(id))}</button>`;
    }).join("");
    const pool = SKILL_META.filter((s) => skillAttr(s) === skillAttrTab);
    const skills = pool.map((s) => {
      const selected = activeSlot != null && h.skillSlots[activeSlot] === s.id;
      const equipped = h.skillSlots.includes(s.id);
      return `<button class="item-card ${selected ? "is-selected" : ""}" data-skill="${s.id}" data-kind="${s.icon}" aria-pressed="${equipped}" aria-label="${escapeHtml(skillName(s))}">
        <span class="item-icon">${skillIcon(s.icon, selected)}</span><span class="item-name">${escapeHtml(skillName(s))}</span>
        <span class="item-meta">${t(game.language, "stats.cost")} ${s.cost} · ${t(game.language, "stats.cooldown")} ${s.cd}s</span>
        ${equipped ? `<span class="item-badge">${selected ? t(game.language, "loadout.replace") : t(game.language, "loadout.ready")}</span>` : ""}</button>`;
    }).join("");
    const slots = h.skillSlots.map((id, i) => {
      const s = SKILL_META.find((skill) => skill.id === id) ?? SKILL_META[0];
      const selected = activeSlot === i;
      return `<button class="item-card ${selected ? "is-selected" : ""}" data-slot="${i}" data-kind="${s.icon}" aria-pressed="${selected}" aria-label="${t(game.language, "loadout.slot")} ${i + 1}: ${escapeHtml(skillName(s))}">
        <span class="item-icon">${skillIcon(s.icon, selected)}</span><span class="item-name">${i + 1}. ${escapeHtml(skillName(s))}</span><span class="item-meta">${SKILL_KEYS[i] ?? i + 1}</span></button>`;
    }).join("");
    skillsPanel.innerHTML = `<section class="loadout-section"><h2 class="section-title">${t(game.language, "loadout.skills")} <span class="section-caption">${t(game.language, "loadout.skillHint")}</span></h2><div class="skill-grid">${slots}</div></section>
      <section class="loadout-section"><h2 class="section-title">${escapeHtml(attrLabel(skillAttrTab))} <span class="section-caption">${t(game.language, "loadout.skillPick")}</span></h2>
      <div class="skill-attr-tabs" role="tablist">${attrTabs}</div><div class="skill-grid">${skills || `<p class="settings-note">${t(game.language, "loadout.skillEmpty")}</p>`}</div></section>`;
  }

  function renderUpgrade() {
    if (!upgradePanel) return;
    const h = game.hero;
    const embers = h.embers ?? 0;
    const ranks = h.upgradeTotal();
    const cards = UPGRADE_STATS.map((def) => {
      const rank = h.upgradeRank(def.id);
      const maxed = rank >= def.max;
      const cost = upgradeCost(def, rank);
      const afford = !maxed && embers >= cost;
      const pips = Array.from({ length: def.max }, (_, i) => `<span class="upgrade-pip ${i < rank ? "is-on" : ""}"></span>`).join("");
      const state = maxed ? "is-maxed" : afford ? "is-ready" : "is-locked";
      return `<button class="upgrade-card ${state}" type="button" data-upgrade="${def.id}" aria-label="${escapeHtml(localized(def.name))} ${rank}/${def.max}">
        <span class="upgrade-icon" aria-hidden="true">${def.icon}</span>
        <span class="upgrade-name">${escapeHtml(localized(def.name))}</span>
        <span class="upgrade-desc">${escapeHtml(localized(def.desc))}</span>
        <span class="upgrade-pips" aria-hidden="true">${pips}</span>
        <span class="upgrade-cost">${maxed ? t(game.language, "upgrade.max") : `✦ ${cost}`}</span>
      </button>`;
    }).join("");
    upgradePanel.innerHTML = `<section class="loadout-section">
      <h2 class="section-title">${t(game.language, "upgrade.title")} <span class="section-caption">${t(game.language, "upgrade.hint")}</span></h2>
      <div class="upgrade-summary">
        <span class="upgrade-ember">✦ <strong>${embers}</strong> ${t(game.language, "camp.embers")}</span>
        <span class="upgrade-invested">${t(game.language, "upgrade.invested")} ${ranks}</span>
        <button class="secondary-button upgrade-respec" type="button" data-action="respec" ${ranks ? "" : "disabled"}>${t(game.language, "upgrade.respec")}</button>
      </div>
      <div class="upgrade-grid">${cards}</div>
      <p class="settings-note">${t(game.language, "upgrade.note")}</p>
    </section>`;
  }

  function renderCampHero() {
    if (!campHero) return;
    if (mode !== "camp") { campHero.hidden = true; return; }
    campHero.hidden = false;
    const h = game.hero;
    const look = HERO_LOOKS.find((item) => item.id === h.look) ?? HERO_LOOKS[0];
    const canResume = !!game.canContinueSave?.();
    const enterLabel = t(game.language, canResume ? "footer.continue" : "footer.enterBattle");
    const row = (key, value) => `<div class="camp-stat"><dt>${t(game.language, key)}</dt><dd>${value}</dd></div>`;
    campHero.innerHTML = `<div class="camp-hero-card">
      <div class="camp-portrait"><canvas data-camp-portrait width="112" height="88" aria-hidden="true"></canvas></div>
      <h2 class="camp-name">${escapeHtml(lookName(look))}</h2>
      <p class="camp-role">${escapeHtml(look.role ?? "")}</p>
      <div class="camp-meta">
        <span class="camp-ember">✦ ${h.embers ?? 0}</span>
        <span class="camp-ranks">${t(game.language, "camp.ranked")} ${h.upgradeTotal()}</span>
      </div>
      <dl class="camp-stats">
        ${row("camp.hp", `${Math.ceil(h.hp)} / ${h.maxHp}`)}
        ${row("camp.mp", `${Math.floor(h.mp)} / ${h.maxMp}`)}
        ${row("camp.attack", `${Math.round(h.dmgMul * 100)}%`)}
        ${row("camp.speed", String(h.speed))}
      </dl>
      <p class="camp-hint">${t(game.language, "camp.hint")}</p>
      <button class="primary-button camp-enter" type="button" data-action="enter-battle" data-i18n="${canResume ? "footer.continue" : "footer.enterBattle"}">${enterLabel}</button>
    </div>`;
    drawHeroPortrait(campHero.querySelector("[data-camp-portrait]"), h.meleeWeapon.rigWeapon, h.look);
  }

  function renderSettings() {
    if (!settings) return;
    const audio = game.audio.settings;
    const slider = (kind, labelKey) => {
      const pct = Math.round((audio[kind] ?? 0) * 100);
      const label = t(game.language, labelKey);
      return `<label class="audio-row">
        <span class="audio-label">${escapeHtml(label)}</span>
        <input type="range" min="0" max="100" step="1" value="${pct}" data-audio-volume="${kind}" style="--fill:${pct}%" aria-label="${escapeHtml(label)}">
        <output class="audio-value" data-audio-value="${kind}">${pct}%</output>
      </label>`;
    };
    const audioSection = `<section class="loadout-section">
      <h2 class="section-title">${t(game.language, "settings.audio")}</h2>
      <div class="audio-panel">
        ${slider("master", "settings.master")}
        ${slider("sfx", "settings.sfx")}
        ${slider("music", "settings.music")}
        ${slider("ambience", "settings.ambience")}
      </div>
      <button class="settings-toggle audio-mute ${audio.muted ? "" : "is-on"}" type="button" data-audio-mute aria-pressed="${audio.muted}" aria-label="${escapeHtml(t(game.language, audio.muted ? "settings.soundOn" : "settings.mute"))}">
        <span class="settings-toggle-label">${t(game.language, audio.muted ? "settings.soundOff" : "settings.soundOn")}</span>
        <span class="settings-toggle-state">${audio.muted ? "MUTE" : "ON"}</span>
      </button>
      <p class="settings-note">${t(game.language, "settings.audioHint")}<br>${t(game.language, "settings.musicHint")}<br>${t(game.language, "settings.audioKeyHint")}</p>
    </section>`;
    settings.innerHTML = `${audioSection}<section class="loadout-section"><h2 class="section-title">${t(game.language, "settings.language")}</h2><p class="settings-note">${t(game.language, "settings.languageHint")}</p><p class="settings-note">${t(game.language, "settings.autoHint")}</p><div class="language-grid" style="margin-top:16px">${LANGUAGES.map(([id, flag, name, native]) => `<button class="language-card ${game.language === id ? "is-active" : ""}" data-language="${id}"><span class="language-flag">${flag}</span><span><span class="language-name">${name}</span><span class="language-native">${native}</span></span></button>`).join("")}</div></section>`;
  }

  /** Keep the sliders and mute switch in sync when M is pressed from the HUD. */
  function refreshAudio() {
    if (!settings || panel.hidden) return;
    const audio = game.audio.settings;
    settings.querySelectorAll("[data-audio-volume]").forEach((slider) => {
      const pct = Math.round((audio[slider.dataset.audioVolume] ?? 0) * 100);
      slider.value = String(pct);
      slider.style.setProperty("--fill", `${pct}%`);
      const out = settings.querySelector(`[data-audio-value="${slider.dataset.audioVolume}"]`);
      if (out) out.textContent = `${pct}%`;
    });
    const mute = settings.querySelector("[data-audio-mute]");
    if (mute) {
      mute.classList.toggle("is-on", !audio.muted);
      mute.setAttribute("aria-pressed", String(audio.muted));
      mute.setAttribute("aria-label", t(game.language, audio.muted ? "settings.soundOn" : "settings.mute"));
      const label = mute.querySelector(".settings-toggle-label");
      if (label) label.textContent = t(game.language, audio.muted ? "settings.soundOff" : "settings.soundOn");
      const state = mute.querySelector(".settings-toggle-state");
      if (state) state.textContent = audio.muted ? "MUTE" : "ON";
    }
  }

  function renderAppearance() {
    if (!appearance) return;
    const h = game.hero;
    const weapon = h.meleeWeapon;
    const current = HERO_LOOKS.find((look) => look.id === h.look) ?? HERO_LOOKS[0];
    const looks = HERO_LOOKS.map((look) => {
      const equipped = h.look === look.id;
      return `<button type="button" class="item-card hero-look-card ${equipped ? "is-equipped" : ""}" data-hero-look="${look.id}" data-kind="look-${look.id}" aria-pressed="${equipped}" aria-label="${escapeHtml(lookName(look))}">
        <span class="item-icon"><canvas class="hero-look-preview" width="112" height="88" aria-hidden="true"></canvas></span>
        <span class="item-name">${escapeHtml(lookName(look))}</span>
        <span class="item-meta">${escapeHtml(look.role)}</span>
        ${equipped ? `<span class="item-badge">${t(game.language, "loadout.equipped")}</span>` : ""}</button>`;
    }).join("");
    appearance.innerHTML = `<section class="appearance-overview">
      <canvas class="appearance-portrait" data-hero-portrait role="img" aria-label="${escapeHtml(lookName(current))}"></canvas>
      <div class="appearance-copy"><span>${t(game.language, "loadout.equipped")}</span><strong>${escapeHtml(lookName(current))}</strong><small>${escapeHtml(current.role)}</small></div>
    </section>
    <section class="loadout-section"><h2 class="section-title">${t(game.language, "profile.appearance")} <span class="section-caption">${t(game.language, "profile.appearanceHint")}</span></h2><div class="item-grid hero-look-grid">${looks}</div></section>`;
    drawHeroPortrait(appearance.querySelector("[data-hero-portrait]"), weapon.rigWeapon, h.look);
    appearance.querySelectorAll(".hero-look-card").forEach((card) => {
      drawHeroPortrait(card.querySelector("canvas"), weapon.rigWeapon, card.dataset.heroLook);
    });
  }

  function renderProfile() {
    if (!profile) return;
    const h = game.hero;
    const weapon = h.meleeWeapon;
    const active = SKILL_META.find((s) => s.id === h.skillSlots[0]) ?? SKILL_META[0];
    const stat = (icon, key, value, accent = "") => `<div class="profile-stat"><span class="profile-stat-icon ${accent}">${icon}</span><span class="profile-stat-label">${t(game.language, key)}</span><strong>${value}</strong></div>`;
    profile.innerHTML = `<section class="profile-panel">
      <div class="profile-heading"><span class="profile-kicker">${t(game.language, "profile.title")}</span><span class="profile-level">${t(game.language, "profile.level")} ${h.level}</span></div>
      <div class="profile-body">
        <div class="profile-portrait"><canvas data-hero-portrait role="img" aria-label="${t(game.language, "profile.title")}"></canvas></div>
        <div class="profile-stats">
          ${stat("♥", "profile.hp", `${Math.ceil(h.hp)} / ${h.maxHp}`, "hp")}
          ${stat(skillIcon("burst"), "profile.mp", `${Math.floor(h.mp)} / ${h.maxMp}`, "mp")}
          ${stat(`<img src="${artUrl("action", { icon: "quick" })}" alt="">`, "profile.ap", `${Math.floor(h.ap)} / ${h.maxAp}`, "speed")}
          ${stat(skillIcon("slash"), "profile.attack", `${Math.round(24 * h.dmgMul)}`, "attack")}
          ${stat(skillIcon("mend"), "profile.defense", `${Math.round(8 + h.shield)}`, "defense")}
          ${stat(`<img src="${artUrl("action", { icon: "quick" })}" alt="">`, "profile.speed", `${h.speed}`, "speed")}
          ${stat(skillIcon("bolt"), "profile.crit", "10%", "crit")}
          ${stat("✦", "profile.embers", `${h.embers ?? 0}`, "gold")}
          ${stat(skillIcon("burst"), "profile.xp", `${Math.floor(h.xp)} / ${h.xpNext}`, "xp")}
          ${stat(`<img src="${weaponArtUrl(h.meleeWeapon)}" alt="">`, "profile.weapon", escapeHtml(weaponName(h.meleeWeapon)), "weapon")}
          ${stat(`<img src="${weaponArtUrl(h.thrownWeapon)}" alt="">`, "loadout.thrown", escapeHtml(weaponName(h.thrownWeapon)), "weapon")}
          ${stat(skillIcon(active.icon), "profile.skill", escapeHtml(skillName(active)), "skill")}
        </div>
      </div>
    </section>`;
    drawHeroPortrait(profile.querySelector("[data-hero-portrait]"), weapon.rigWeapon, h.look);
  }

  function visibleTabs() { return mode === "camp" ? TAB_ORDER.camp : TAB_ORDER.battle; }

  function layoutTabs() {
    if (!tablist) return;
    const order = visibleTabs();
    const buttons = new Map([...tablist.querySelectorAll("[data-tab]")].map((btn) => [btn.dataset.tab, btn]));
    for (const id of order) {
      const btn = buttons.get(id);
      if (!btn) continue;
      btn.hidden = false;
      tablist.appendChild(btn);
    }
    for (const [id, btn] of buttons) if (!order.includes(id)) btn.hidden = true;
  }

  function syncChrome() {
    const camp = mode === "camp";
    panel.classList.toggle("is-camp", camp);
    const keys = camp ? ["camp.kicker", "camp.title", "camp.subtitle"] : ["menu.kicker", "menu.title", "menu.subtitle"];
    const header = { kicker: keys[0], title: keys[1], subtitle: keys[2] };
    for (const [slot, key] of Object.entries(header)) {
      const el = panel.querySelector(`[data-header="${slot}"]`);
      if (el) el.dataset.i18n = key;
    }
    const hint = panel.querySelector("[data-footer-hint]");
    if (hint) hint.dataset.i18n = camp ? "footer.campHint" : "footer.hint";
    const badge = panel.querySelector("[data-camp-badge]");
    if (badge) badge.hidden = !camp;
    panel.querySelectorAll('[data-action="close"]').forEach((btn) => { btn.hidden = camp; });
    const canResume = !!game.canContinueSave?.();
    panel.querySelectorAll('[data-action="enter-battle"]').forEach((btn) => {
      btn.hidden = !camp;
      btn.dataset.i18n = canResume ? "footer.continue" : "footer.enterBattle";
    });
    const fresh = panel.querySelector('[data-action="new-run"]');
    if (fresh) fresh.hidden = !camp || !canResume;
    const canRetreat = !camp && ["playing", "paused", "inventory"].includes(game.state);
    const retreat = panel.querySelector('[data-action="retreat-camp"]');
    if (retreat) retreat.hidden = !canRetreat;
    if (campHero) campHero.hidden = !camp;
    layoutTabs();
  }

  function applyText() {
    panel.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(game.language, el.dataset.i18n); });
    panel.querySelector(".close-settings")?.setAttribute("aria-label", t(game.language, "close"));
  }
  function render() {
    syncChrome();
    applyText();
    const emberBadge = panel.querySelector("[data-camp-badge-embers]");
    if (emberBadge) emberBadge.textContent = String(game.hero.embers ?? 0);
    const scroller = panel.querySelector(".settings-content:not([hidden])");
    const scrollTop = scroller?.scrollTop ?? 0;
    const focused = document.activeElement;
    const focusId = focused?.closest("button, input")?.getAttributeNames().find(name => ["data-weapon", "data-skill", "data-slot", "data-language", "data-skill-attr", "data-hero-look", "data-upgrade", "data-audio-volume", "data-audio-mute"].includes(name));
    const focusValue = focusId ? focused.getAttribute(focusId) : null;
    renderCampHero();
    renderLoadout(); renderStash(); renderSkills();
    if (mode === "camp") renderUpgrade();
    renderAppearance(); renderProfile(); renderSettings();
    const order = visibleTabs();
    panel.querySelectorAll(".settings-content").forEach(el => {
      el.hidden = el.dataset.content !== tab || !order.includes(el.dataset.content);
    });
    panel.querySelectorAll(".settings-tab").forEach(el => {
      const selected = el.dataset.tab === tab;
      el.classList.toggle("is-active", selected); el.setAttribute("role", "tab"); el.setAttribute("aria-selected", selected);
    });
    const current = panel.querySelector(".settings-content:not([hidden])");
    if (current === scroller) current.scrollTop = scrollTop;
    if (focusId) [...panel.querySelectorAll(`[${focusId}]`)].find(el => el.getAttribute(focusId) === focusValue)?.focus({ preventScroll: true });
  }
  function setLanguage(code) {
    if (!LANG[code]) return;
    game.language = code;
    localStorage.setItem("ember-echo-language", code);
    document.documentElement.lang = code === "zh" ? "zh-CN" : code;
    game.persistSave?.();
    render();
  }
  function open(nextTab = "loadout", nextMode = "battle") {
    returnFocus = document.activeElement;
    mode = nextMode;
    const order = visibleTabs();
    tab = order.includes(nextTab) ? nextTab : order[0];
    render();
    panel.hidden = false;
    panel.parentElement.classList.add("menu-open");
    const target = mode === "camp"
      ? panel.querySelector('.settings-footer [data-action="enter-battle"]:not([hidden])')
      : panel.querySelector(".close-settings");
    target?.focus({ preventScroll: true });
  }
  function openCamp() { open("loadout", "camp"); }
  function close() {
    panel.hidden = true; panel.parentElement.classList.remove("menu-open");
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function handleKey(key) {
    const camp = mode === "camp" && game.state === "camp";
    const battle = mode === "battle" && game.state === "inventory";
    if (!camp && !battle) return false;
    if (key === "escape" || key === "tab") {
      if (battle) { game.toggleInventory(); return true; }
      return false;
    }
    const order = visibleTabs();
    const index = Number(key);
    if (Number.isInteger(index) && index >= 1 && index <= order.length) {
      tab = order[index - 1];
      render();
      return true;
    }
    return false;
  }

  panel.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    // Keep keyboard focus within the visible modal, including its scrollable item list.
    event.stopPropagation();
    const buttons = [...panel.querySelectorAll("button:not(:disabled)")].filter(el => el.getClientRects().length);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  panel.addEventListener("click", (event) => {
    const muteButton = event.target.closest("[data-audio-mute]");
    if (muteButton) {
      game.audio.unlock();
      const muted = game.audio.toggleMuted();
      if (!muted) game.audio.play("ui");
      refreshAudio();
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;
      if (action === "close") { if (mode === "battle") game.toggleInventory(); return; }
      if (action === "enter-battle") { game.enterBattle(); return; }
      if (action === "new-run") { game.startRun({ fresh: true }); return; }
      if (action === "retreat-camp") { game.retreatToCamp?.(); return; }
      if (action === "respec") {
        if (game.hero.respecUpgrades()) { game.persistSave?.(); game.audio.play("ui"); render(); }
        return;
      }
    }
    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) { tab = tabButton.dataset.tab; render(); return; }
    const attrButton = event.target.closest("[data-skill-attr]");
    if (attrButton) { skillAttrTab = attrButton.dataset.skillAttr; render(); return; }
    const languageButton = event.target.closest("[data-language]");
    if (languageButton) { setLanguage(languageButton.dataset.language); return; }
    const weaponButton = event.target.closest("[data-weapon]");
    if (weaponButton) { game.hero.equipWeapon(weaponButton.dataset.weapon, game); render(); return; }
    const lookButton = event.target.closest("[data-hero-look]");
    if (lookButton) { game.hero.equipLook(lookButton.dataset.heroLook, game); render(); return; }
    const upgradeButton = event.target.closest("[data-upgrade]");
    if (upgradeButton) {
      if (game.hero.buyUpgrade(upgradeButton.dataset.upgrade)) {
        game.persistSave?.();
        game.audio.play("level");
        render();
      } else {
        game.audio.play("ui");
        upgradeButton.classList.add("is-denied");
        setTimeout(() => upgradeButton.classList.remove("is-denied"), 280);
      }
      return;
    }
    const slotButton = event.target.closest("[data-slot]");
    if (slotButton) {
      game.ui.inventorySkillPick = Number(slotButton.dataset.slot);
      const id = game.hero.skillSlots[game.ui.inventorySkillPick];
      const current = SKILL_META.find((s) => s.id === id);
      if (current) skillAttrTab = skillAttr(current);
      render();
      return;
    }
    const skillButton = event.target.closest("[data-skill]");
    if (skillButton && game.ui.inventorySkillPick != null) {
      game.hero.swapSkill(game.ui.inventorySkillPick, skillButton.dataset.skill);
      game.ui.inventorySkillPick = null;
      game.persistSave?.();
      render();
    }
  });
  panel.addEventListener("input", (event) => {
    const slider = event.target.closest?.("[data-audio-volume]");
    if (!slider) return;
    game.audio.unlock();
    const kind = slider.dataset.audioVolume;
    const pct = Number(slider.value);
    game.audio.setVolume(kind, pct / 100, { persist: false });
    slider.style.setProperty("--fill", `${pct}%`);
    const out = panel.querySelector(`[data-audio-value="${kind}"]`);
    if (out) out.textContent = `${pct}%`;
  });
  panel.addEventListener("change", (event) => {
    const slider = event.target.closest?.("[data-audio-volume]");
    if (!slider) return;
    const kind = slider.dataset.audioVolume;
    game.audio.setVolume(kind, Number(slider.value) / 100);
    game.audio.play("ui");
  });
  return { open, openCamp, close, render, handleKey, setLanguage, refreshAudio };
}
