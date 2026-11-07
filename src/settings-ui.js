import { HERO_LOOKS, SKILL_META, SKILL_ATTR_ORDER, SKILL_ATTR_LABELS, skillAttr, MELEE_WEAPONS, THROWN_WEAPONS, STASH_ITEMS } from "./data.js";
import { stashLabel } from "./content/stash-catalog.js";
import { skillLabel, weaponLabel } from "./copy.js";
import { SKILL_KEYS } from "./controls.js";
import { weaponEquipKind } from "./weapons-util.js";
import { artUrl, weaponArtUrl, stashPickupArtUrl, installUiFrames } from "./ui-art.js";
import { drawHeroPortrait } from "./hero.js";

const LANG = {
  zh: {
    "menu.kicker": "余烬回响", "menu.title": "背包与设置", "menu.subtitle": "选择武器、技能与语言。",
    "tabs.loadout": "装备", "tabs.stash": "收藏", "tabs.skills": "技能", "tabs.appearance": "造型", "tabs.profile": "人物", "tabs.settings": "设置", "stash.title": "长期收藏", "stash.hint": "战斗中有几率掉落，会永久保存在浏览器。", "stash.empty": "还没有收藏品，去狩猎吧。", "stash.count": "数量", "loadout.weapons": "武器", "loadout.melee": "近战武器", "loadout.thrown": "投掷武器", "loadout.skills": "技能槽",
    "loadout.weaponHint": "点击卡片立即装备", "loadout.skillHint": "先选择槽位，再选择技能", "loadout.skillPick": "按属性筛选技能", "loadout.skillEmpty": "该属性暂无可用技能", "loadout.slot": "槽位",
    "loadout.equipped": "已装备", "loadout.ready": "可用", "loadout.replace": "替换", "settings.language": "语言",
    "settings.languageHint": "语言会保存在本机，下次打开仍会保留。", "settings.auto": "自动化", "settings.autoHint": "自动战斗/拾取开关在战斗画面左侧血条下方，点击切换；状态会写入存档。", "settings.autoBattle": "自动战斗", "settings.autoLoot": "自动拾取", "settings.autoBattleHint": "自动寻敌、普攻与技能轮转。", "settings.autoLootHint": "靠近掉落物并拾取生命/法力/经验。", "footer.hint": "选择后立即生效", "footer.return": "返回战斗",
    "close": "关闭", "stats.damage": "伤害", "stats.speed": "移速", "stats.cost": "消耗", "stats.cooldown": "冷却", "profile.level": "等级", "profile.hp": "生命值", "profile.mp": "法力值", "profile.ap": "行动力", "profile.attack": "攻击力", "profile.defense": "防御力", "profile.speed": "速度", "profile.crit": "暴击率", "profile.weapon": "武器", "profile.skill": "技能", "profile.title": "人物信息", "profile.appearance": "主角造型", "profile.appearanceHint": "点击立绘切换战斗外观",
  },
  en: {
    "menu.kicker": "EMBER ECHO / LOADOUT", "menu.title": "Loadout & Settings", "menu.subtitle": "Choose a weapon, skill kit and language.",
    "tabs.loadout": "Loadout", "tabs.stash": "Stash", "tabs.skills": "Skills", "tabs.appearance": "Looks", "tabs.profile": "Hero", "tabs.settings": "Settings", "stash.title": "Collectibles", "stash.hint": "Drops in combat are saved in this browser.", "stash.empty": "No collectibles yet.", "stash.count": "Qty", "loadout.weapons": "Weapons", "loadout.melee": "Melee", "loadout.thrown": "Thrown", "loadout.skills": "Skill slots",
    "loadout.weaponHint": "Click a card to equip", "loadout.skillHint": "Pick a slot, then choose a skill", "loadout.skillPick": "Filter by element", "loadout.skillEmpty": "No skills in this element", "loadout.slot": "Slot",
    "loadout.equipped": "Equipped", "loadout.ready": "Ready", "loadout.replace": "Replace", "settings.language": "Language",
    "settings.languageHint": "Your language is saved on this device.", "settings.auto": "Automation", "settings.autoHint": "Auto battle and loot toggles are below the HP bars on the left HUD.", "settings.autoBattle": "Auto battle", "settings.autoLoot": "Auto loot", "settings.autoBattleHint": "Chase foes and rotate skills.", "settings.autoLootHint": "Run to useful pickups.", "footer.hint": "Changes apply immediately", "footer.return": "Return to fight",
    "close": "Close", "stats.damage": "Damage", "stats.speed": "Speed", "stats.cost": "Cost", "stats.cooldown": "Cooldown", "profile.level": "Level", "profile.hp": "Health", "profile.mp": "Mana", "profile.ap": "Action", "profile.attack": "Attack", "profile.defense": "Defense", "profile.speed": "Speed", "profile.crit": "Crit chance", "profile.weapon": "Weapon", "profile.skill": "Skill", "profile.title": "Hero details", "profile.appearance": "Hero look", "profile.appearanceHint": "Click a portrait to use in combat",
  },
  ja: {
    "menu.kicker": "EMBER ECHO / LOADOUT", "menu.title": "装備と設定", "menu.subtitle": "武器、スキル、言語を選択します。",
    "tabs.loadout": "装備", "tabs.stash": "収藏", "tabs.skills": "スキル", "tabs.appearance": "スタイル", "tabs.profile": "人物", "tabs.settings": "設定", "stash.title": "コレクション", "stash.hint": "戦闘ドロップはブラウザに保存されます。", "stash.empty": "まだ収集品がありません。", "stash.count": "数", "loadout.weapons": "武器", "loadout.melee": "近接武器", "loadout.thrown": "投擲武器", "loadout.skills": "スキルスロット",
    "loadout.weaponHint": "カードをクリックして装備", "loadout.skillHint": "スロットを選んでスキルを選択", "loadout.skillPick": "属性で絞り込み", "loadout.skillEmpty": "この属性のスキルはありません", "loadout.slot": "スロット",
    "loadout.equipped": "装備中", "loadout.ready": "使用可能", "loadout.replace": "変更", "settings.language": "言語",
    "settings.languageHint": "言語はこの端末に保存されます。", "settings.auto": "自動化", "settings.autoHint": "自動戦闘/拾得は画面左・体力バーの下で切り替えます。", "settings.autoBattle": "自動戦闘", "settings.autoLoot": "自動拾得", "settings.autoBattleHint": "敵を追尾しスキルを使用。", "settings.autoLootHint": "ドロップに近づいて取得。", "footer.hint": "変更はすぐ反映されます", "footer.return": "戦闘に戻る",
    "close": "閉じる", "stats.damage": "攻撃", "stats.speed": "速度", "stats.cost": "消費", "stats.cooldown": "再使用", "profile.level": "レベル", "profile.hp": "体力", "profile.mp": "マナ", "profile.ap": "行動力", "profile.attack": "攻撃", "profile.defense": "防御", "profile.speed": "速度", "profile.crit": "クリティカル", "profile.weapon": "武器", "profile.skill": "スキル", "profile.title": "人物情報", "profile.appearance": "主人公スタイル", "profile.appearanceHint": "立ち絵をクリックして装備",
  },
};

const LANGUAGES = [
  ["zh", "🇨🇳", "中文", "简体中文"], ["en", "🇬🇧", "English", "English"], ["ja", "🇯🇵", "日本語", "日本語"],
];

function skillIcon(icon, selected = false) {
  return `<img src="${artUrl("skill", { icon, selected, hud: true })}" alt="" aria-hidden="true" draggable="false">`;
}

function t(code, key) { return LANG[code]?.[key] ?? LANG.zh[key] ?? key; }

/** Keep panel markup in sync when index.html and game.js were updated at different times. */
function ensureSettingsDom(panel, language) {
  const shell = panel.querySelector(".settings-shell");
  if (!shell) return;
  const footer = shell.querySelector(".settings-footer");
  for (const id of ["loadout", "stash", "skills", "appearance", "profile", "settings"]) {
    if (shell.querySelector(`[data-content="${id}"]`)) continue;
    const pane = document.createElement("div");
    pane.className = "settings-content";
    pane.dataset.content = id;
    pane.hidden = id !== "loadout";
    if (footer) shell.insertBefore(pane, footer);
    else shell.appendChild(pane);
  }
  const tablist = shell.querySelector(".settings-tabs");
  if (!tablist) return;
  const tabDefs = [
    ["loadout", "tabs.loadout"],
    ["stash", "tabs.stash"],
    ["skills", "tabs.skills"],
    ["appearance", "tabs.appearance"],
    ["profile", "tabs.profile"],
    ["settings", "tabs.settings"],
  ];
  for (const [id, i18n] of tabDefs) {
    if (tablist.querySelector(`[data-tab="${id}"]`)) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "settings-tab";
    btn.dataset.tab = id;
    btn.dataset.i18n = i18n;
    btn.textContent = t(language, i18n);
    const anchor = tablist.querySelector(`[data-tab="${id === "skills" ? "loadout" : id === "appearance" ? "skills" : id === "profile" ? "appearance" : "profile"}"]`);
    if (anchor?.nextSibling) tablist.insertBefore(btn, anchor.nextSibling);
    else tablist.appendChild(btn);
  }
}

export function createSettingsUI(game) {
  const panel = document.querySelector("#settings-panel");
  if (!panel) return { open() {}, close() {}, handleKey() { return false; } };
  const lang = localStorage.getItem("ember-echo-language") || "zh";
  game.language = LANG[lang] ? lang : "zh";
  ensureSettingsDom(panel, game.language);
  const loadout = panel.querySelector('[data-content="loadout"]');
  const stashPanel = panel.querySelector('[data-content="stash"]');
  const skillsPanel = panel.querySelector('[data-content="skills"]');
  const appearance = panel.querySelector('[data-content="appearance"]');
  const profile = panel.querySelector('[data-content="profile"]');
  const settings = panel.querySelector('[data-content="settings"]');
  let tab = "loadout", skillAttrTab = "slash", returnFocus = null;
  const attrLabel = (id) => {
    const labels = SKILL_ATTR_LABELS[id];
    if (!labels) return id;
    return game.language === "zh" ? labels.zh : game.language === "ja" ? labels.ja : labels.en;
  };
  const attrsWithSkills = () => SKILL_ATTR_ORDER.filter((id) => SKILL_META.some((s) => skillAttr(s) === id));
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

  function renderSettings() {
    settings.innerHTML = `<section class="loadout-section"><h2 class="section-title">${t(game.language, "settings.language")}</h2><p class="settings-note">${t(game.language, "settings.languageHint")}</p><p class="settings-note">${t(game.language, "settings.autoHint")}</p><div class="language-grid" style="margin-top:16px">${LANGUAGES.map(([id, flag, name, native]) => `<button class="language-card ${game.language === id ? "is-active" : ""}" data-language="${id}"><span class="language-flag">${flag}</span><span><span class="language-name">${name}</span><span class="language-native">${native}</span></span></button>`).join("")}</div></section>`;
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
          ${stat(`<img src="${weaponArtUrl(h.meleeWeapon)}" alt="">`, "profile.weapon", escapeHtml(weaponName(h.meleeWeapon)), "weapon")}
          ${stat(`<img src="${weaponArtUrl(h.thrownWeapon)}" alt="">`, "loadout.thrown", escapeHtml(weaponName(h.thrownWeapon)), "weapon")}
          ${stat(skillIcon(active.icon), "profile.skill", escapeHtml(skillName(active)), "skill")}
        </div>
      </div>
    </section>`;
    drawHeroPortrait(profile.querySelector("[data-hero-portrait]"), weapon.rigWeapon, h.look);
  }

  function applyText() { panel.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(game.language, el.dataset.i18n); }); panel.querySelector(".close-settings")?.setAttribute("aria-label", t(game.language, "close")); }
  function render() {
    const scroller = panel.querySelector(".settings-content:not([hidden])");
    const scrollTop = scroller?.scrollTop ?? 0;
    const focused = document.activeElement;
    const focusId = focused?.closest("button")?.getAttributeNames().find(name => ["data-weapon", "data-skill", "data-slot", "data-language", "data-skill-attr", "data-hero-look"].includes(name));
    const focusValue = focusId ? focused.getAttribute(focusId) : null;
    applyText(); renderLoadout(); renderStash(); renderSkills(); renderAppearance(); renderProfile(); renderSettings();
    panel.querySelectorAll(".settings-content").forEach(el => { el.hidden = el.dataset.content !== tab; });
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
  function open(nextTab = tab) {
    returnFocus = document.activeElement;
    tab = nextTab; render(); panel.hidden = false; panel.parentElement.classList.add("menu-open");
    panel.querySelector(".close-settings").focus({ preventScroll: true });
  }
  function close() {
    panel.hidden = true; panel.parentElement.classList.remove("menu-open");
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function handleKey(key) {
    if (game.state !== "inventory") return false;
    if (key === "escape" || key === "tab") { game.toggleInventory(); return true; }
    if (key === "1") { tab = "loadout"; render(); return true; }
    if (key === "2") { tab = "stash"; render(); return true; }
    if (key === "3") { tab = "skills"; render(); return true; }
    if (key === "4") { tab = "appearance"; render(); return true; }
    if (key === "5") { tab = "profile"; render(); return true; }
    if (key === "6") { tab = "settings"; render(); return true; }
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
    const closeButton = event.target.closest('[data-action="close"]');
    if (closeButton) { game.toggleInventory(); return; }
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
  return { open, close, render, handleKey, setLanguage };
}
