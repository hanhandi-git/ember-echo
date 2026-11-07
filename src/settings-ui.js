import { SKILL_META, WEAPONS } from "./data.js";
import { artUrl, weaponArtUrl, installUiFrames } from "./ui-art.js";
import { drawHeroPortrait } from "./hero.js";

const LANG = {
  zh: {
    "menu.kicker": "余烬回响", "menu.title": "背包与设置", "menu.subtitle": "选择武器、技能与语言。",
    "tabs.loadout": "装备", "tabs.profile": "人物", "tabs.settings": "设置", "loadout.weapons": "武器", "loadout.skills": "技能槽",
    "loadout.weaponHint": "点击卡片立即装备", "loadout.skillHint": "先选择槽位，再选择技能", "loadout.slot": "槽位",
    "loadout.equipped": "已装备", "loadout.ready": "可用", "loadout.replace": "替换", "settings.language": "语言",
    "settings.languageHint": "语言会保存在本机，下次打开仍会保留。", "footer.hint": "选择后立即生效", "footer.return": "返回战斗",
    "close": "关闭", "stats.damage": "伤害", "stats.speed": "移速", "stats.cost": "消耗", "stats.cooldown": "冷却", "profile.level": "等级", "profile.hp": "生命值", "profile.mp": "法力值", "profile.attack": "攻击力", "profile.defense": "防御力", "profile.speed": "速度", "profile.crit": "暴击率", "profile.weapon": "武器", "profile.skill": "技能", "profile.title": "人物信息",
  },
  en: {
    "menu.kicker": "EMBER ECHO / LOADOUT", "menu.title": "Loadout & Settings", "menu.subtitle": "Choose a weapon, skill kit and language.",
    "tabs.loadout": "Loadout", "tabs.profile": "Hero", "tabs.settings": "Settings", "loadout.weapons": "Weapons", "loadout.skills": "Skill slots",
    "loadout.weaponHint": "Click a card to equip", "loadout.skillHint": "Pick a slot, then choose a skill", "loadout.slot": "Slot",
    "loadout.equipped": "Equipped", "loadout.ready": "Ready", "loadout.replace": "Replace", "settings.language": "Language",
    "settings.languageHint": "Your language is saved on this device.", "footer.hint": "Changes apply immediately", "footer.return": "Return to fight",
    "close": "Close", "stats.damage": "Damage", "stats.speed": "Speed", "stats.cost": "Cost", "stats.cooldown": "Cooldown", "profile.level": "Level", "profile.hp": "Health", "profile.mp": "Mana", "profile.attack": "Attack", "profile.defense": "Defense", "profile.speed": "Speed", "profile.crit": "Crit chance", "profile.weapon": "Weapon", "profile.skill": "Skill", "profile.title": "Hero details",
  },
  ja: {
    "menu.kicker": "EMBER ECHO / LOADOUT", "menu.title": "装備と設定", "menu.subtitle": "武器、スキル、言語を選択します。",
    "tabs.loadout": "装備", "tabs.profile": "人物", "tabs.settings": "設定", "loadout.weapons": "武器", "loadout.skills": "スキルスロット",
    "loadout.weaponHint": "カードをクリックして装備", "loadout.skillHint": "スロットを選んでスキルを選択", "loadout.slot": "スロット",
    "loadout.equipped": "装備中", "loadout.ready": "使用可能", "loadout.replace": "変更", "settings.language": "言語",
    "settings.languageHint": "言語はこの端末に保存されます。", "footer.hint": "変更はすぐ反映されます", "footer.return": "戦闘に戻る",
    "close": "閉じる", "stats.damage": "攻撃", "stats.speed": "速度", "stats.cost": "消費", "stats.cooldown": "再使用", "profile.level": "レベル", "profile.hp": "体力", "profile.mp": "マナ", "profile.attack": "攻撃", "profile.defense": "防御", "profile.speed": "速度", "profile.crit": "クリティカル", "profile.weapon": "武器", "profile.skill": "スキル", "profile.title": "人物情報",
  },
};

const LANGUAGES = [
  ["zh", "🇨🇳", "中文", "简体中文"], ["en", "🇬🇧", "English", "English"], ["ja", "🇯🇵", "日本語", "日本語"],
];

function skillIcon(icon, selected = false) {
  return `<img src="${artUrl("skill", { icon, selected, hud: true })}" alt="" aria-hidden="true" draggable="false">`;
}

function t(code, key) { return LANG[code]?.[key] ?? LANG.zh[key] ?? key; }

export function createSettingsUI(game) {
  const panel = document.querySelector("#settings-panel");
  if (!panel) return { open() {}, close() {}, handleKey() { return false; } };
  const loadout = panel.querySelector('[data-content="loadout"]');
  const profile = panel.querySelector('[data-content="profile"]');
  const settings = panel.querySelector('[data-content="settings"]');
  const lang = localStorage.getItem("ember-echo-language") || "zh";
  game.language = LANG[lang] ? lang : "zh";
  let tab = "loadout", returnFocus = null;
  installUiFrames(panel.parentElement);
  document.documentElement.lang = game.language === "zh" ? "zh-CN" : game.language;

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const skillName = (skill) => game.language === "zh" ? skill.name : game.language === "ja" ? (skill.nameJa ?? skill.nameEn) : skill.nameEn;
  const weaponName = (weapon) => game.language === "zh" ? weapon.name : game.language === "ja" ? (weapon.nameJa ?? weapon.nameEn) : weapon.nameEn;

  function renderLoadout() {
    const h = game.hero;
    const weapons = WEAPONS.map((w) => {
      const equipped = h.weaponId === w.id;
      return `<button class="item-card ${equipped ? "is-equipped" : ""}" data-weapon="${w.id}" data-kind="weapon-${w.id}" aria-pressed="${equipped}" aria-label="${escapeHtml(weaponName(w))}">
        <span class="item-icon"><img src="${weaponArtUrl(w)}" alt="" aria-hidden="true" draggable="false"></span><span class="item-name">${escapeHtml(weaponName(w))}</span>
        <span class="item-meta">${t(game.language, "stats.damage")} ${w.dmgMul > 1 ? "+" : ""}${Math.round((w.dmgMul - 1) * 100)}% · ${t(game.language, "stats.speed")} ${w.speed}</span>
        ${equipped ? `<span class="item-badge">${t(game.language, "loadout.equipped")}</span>` : ""}</button>`;
    }).join("");
    const activeSlot = game.ui.inventorySkillPick;
    const skills = SKILL_META.map((s) => {
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
        <span class="item-icon">${skillIcon(s.icon, selected)}</span><span class="item-name">${i + 1}. ${escapeHtml(skillName(s))}</span><span class="item-meta">${["J", "K", "L", "U", "I", "O"][i]}</span></button>`;
    }).join("");
    const equippedArt = artUrl("card", { title: "", type: "", level: "", detail: "", glyph: "none", rarity: "legendary", equipped: false, selected: true });
    loadout.innerHTML = `<div class="loadout-overview"><img class="overview-art" src="${equippedArt}" alt="" aria-hidden="true"><img class="overview-icon" src="${weaponArtUrl(h.weapon)}" alt="" aria-hidden="true"><div class="overview-copy"><span>${t(game.language, "loadout.equipped")}</span><strong>${escapeHtml(weaponName(h.weapon))}</strong><small>${t(game.language, "stats.damage")} ${Math.round(h.dmgMul * 100)}% · ${t(game.language, "stats.speed")} ${h.speed}</small></div></div><section class="loadout-section"><h2 class="section-title">${t(game.language, "loadout.weapons")} <span class="section-caption">${t(game.language, "loadout.weaponHint")}</span></h2><div class="item-grid">${weapons}</div></section>
      <section class="loadout-section"><h2 class="section-title">${t(game.language, "loadout.skills")} <span class="section-caption">${t(game.language, "loadout.skillHint")}</span></h2><div class="skill-grid">${slots}</div><div class="skill-grid" style="margin-top:12px">${skills}</div></section>`;
  }

  function renderSettings() {
    settings.innerHTML = `<section class="loadout-section"><h2 class="section-title">${t(game.language, "settings.language")}</h2><p class="settings-note">${t(game.language, "settings.languageHint")}</p><div class="language-grid" style="margin-top:16px">${LANGUAGES.map(([id, flag, name, native]) => `<button class="language-card ${game.language === id ? "is-active" : ""}" data-language="${id}"><span class="language-flag">${flag}</span><span><span class="language-name">${name}</span><span class="language-native">${native}</span></span></button>`).join("")}</div></section>`;
  }

  function renderProfile() {
    const h = game.hero;
    const weapon = h.weapon;
    const active = SKILL_META.find((s) => s.id === h.skillSlots[0]) ?? SKILL_META[0];
    const stat = (icon, key, value, accent = "") => `<div class="profile-stat"><span class="profile-stat-icon ${accent}">${icon}</span><span class="profile-stat-label">${t(game.language, key)}</span><strong>${value}</strong></div>`;
    profile.innerHTML = `<section class="profile-panel">
      <div class="profile-heading"><span class="profile-kicker">${t(game.language, "profile.title")}</span><span class="profile-level">${t(game.language, "profile.level")} ${h.level}</span></div>
      <div class="profile-body">
        <div class="profile-portrait"><canvas data-hero-portrait role="img" aria-label="${t(game.language, "profile.title")}"></canvas></div>
        <div class="profile-stats">
          ${stat("♥", "profile.hp", `${Math.ceil(h.hp)} / ${h.maxHp}`, "hp")}
          ${stat(skillIcon("burst"), "profile.mp", `${Math.floor(h.mp)} / ${h.maxMp}`, "mp")}
          ${stat(skillIcon("slash"), "profile.attack", `${Math.round(24 * h.dmgMul)}`, "attack")}
          ${stat(skillIcon("mend"), "profile.defense", `${Math.round(8 + h.shield)}`, "defense")}
          ${stat(`<img src="${artUrl("action", { icon: "quick" })}" alt="">`, "profile.speed", `${h.speed}`, "speed")}
          ${stat(skillIcon("bolt"), "profile.crit", "10%", "crit")}
          ${stat(`<img src="${weaponArtUrl(weapon)}" alt="">`, "profile.weapon", escapeHtml(weaponName(weapon)), "weapon")}
          ${stat(skillIcon(active.icon), "profile.skill", escapeHtml(skillName(active)), "skill")}
        </div>
      </div>
    </section>`;
    drawHeroPortrait(profile.querySelector("[data-hero-portrait]"), weapon.rigWeapon);
  }

  function applyText() { panel.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(game.language, el.dataset.i18n); }); panel.querySelector(".close-settings")?.setAttribute("aria-label", t(game.language, "close")); }
  function render() {
    const scroller = panel.querySelector(".settings-content:not([hidden])");
    const scrollTop = scroller?.scrollTop ?? 0;
    const focused = document.activeElement;
    const focusId = focused?.closest("button")?.getAttributeNames().find(name => ["data-weapon", "data-skill", "data-slot", "data-language"].includes(name));
    const focusValue = focusId ? focused.getAttribute(focusId) : null;
    applyText(); renderLoadout(); renderProfile(); renderSettings();
    panel.querySelectorAll(".settings-content").forEach(el => { el.hidden = el.dataset.content !== tab; });
    panel.querySelectorAll(".settings-tab").forEach(el => {
      const selected = el.dataset.tab === tab;
      el.classList.toggle("is-active", selected); el.setAttribute("role", "tab"); el.setAttribute("aria-selected", selected);
    });
    const current = panel.querySelector(".settings-content:not([hidden])");
    if (current === scroller) current.scrollTop = scrollTop;
    if (focusId) [...panel.querySelectorAll(`[${focusId}]`)].find(el => el.getAttribute(focusId) === focusValue)?.focus({ preventScroll: true });
  }
  function setLanguage(code) { if (!LANG[code]) return; game.language = code; localStorage.setItem("ember-echo-language", code); document.documentElement.lang = code === "zh" ? "zh-CN" : code; render(); }
  function open(nextTab = tab) {
    returnFocus = document.activeElement;
    tab = nextTab; render(); panel.hidden = false; panel.parentElement.classList.add("menu-open");
    panel.querySelector(".close-settings").focus({ preventScroll: true });
  }
  function close() {
    panel.hidden = true; panel.parentElement.classList.remove("menu-open");
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  function handleKey(key) { if (game.state !== "inventory") return false; if (key === "escape" || key === "tab") { game.toggleInventory(); return true; } if (key === "1") { tab = "loadout"; render(); return true; } if (key === "2") { tab = "profile"; render(); return true; } if (key === "3") { tab = "settings"; render(); return true; } return false; }

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
    const languageButton = event.target.closest("[data-language]");
    if (languageButton) { setLanguage(languageButton.dataset.language); return; }
    const weaponButton = event.target.closest("[data-weapon]");
    if (weaponButton) { game.hero.equipWeapon(weaponButton.dataset.weapon, game); render(); return; }
    const slotButton = event.target.closest("[data-slot]");
    if (slotButton) { game.ui.inventorySkillPick = Number(slotButton.dataset.slot); render(); return; }
    const skillButton = event.target.closest("[data-skill]");
    if (skillButton && game.ui.inventorySkillPick != null) { game.hero.swapSkill(game.ui.inventorySkillPick, skillButton.dataset.skill); game.ui.inventorySkillPick = null; render(); }
  });
  return { open, close, render, handleKey, setLanguage };
}
