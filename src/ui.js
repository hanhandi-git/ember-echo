// The entire game UI is pixel art drawn into the same 320×240 canvas as the fight. The frames, bars,
// slots, dialog, banners and toasts are reusable UI effects from pixelfx/src/fx/ui; this file only
// places them and feeds them the current game state. There is no DOM HUD.

import { createFx, painterFor, hex } from "../../pixelfx/src/core/index.js";
import { UI_GOLD } from "../../pixelfx/src/fx/ui/_lib.js";
import * as panelFx from "../../pixelfx/src/fx/ui/panel.js";
import * as statusFx from "../../pixelfx/src/fx/ui/status-bar.js";
import * as slotFx from "../../pixelfx/src/fx/ui/skill-slot.js";
import * as dialogFx from "../../pixelfx/src/fx/ui/dialog.js";
import * as bannerFx from "../../pixelfx/src/fx/ui/banner.js";
import * as toastFx from "../../pixelfx/src/fx/ui/toast.js";
import * as questFx from "../../pixelfx/src/fx/ui/quest-complete.js";
import * as comboFx from "../../pixelfx/src/fx/ui/combo-counter.js";
import * as hudToggleFx from "../../pixelfx/src/fx/ui/hud-toggle.js";
import { SKILL_META, STAGES, MELEE_WEAPONS, THROWN_WEAPONS } from "./data.js";
import { gameLang, skillLabel, stageAct, stageName, uiCopy, weaponLabel } from "./copy.js";
import {
  RESUME_BUTTON, SKILL_RECTS, SKILL_KEYS, AUTO_TOGGLE_RECTS, AUTO_TOGGLE_SIZE, AUTO_TOGGLE_X, contains,
} from "./controls.js";

const SW = 320, SH = 180;
/** Milestone = normal floater × 1.5³ (crit is ×1.5 on floats). */
const HIT_NUMBER_STEP = 1.5;
const COMBO_MILESTONE_TEXT_SCALE = HIT_NUMBER_STEP ** 3;
const C = {
  ink: hex("#07060d"), gold: hex("#ffd36a"), gold2: hex("#fff2b8"),
  text: hex("#efe6d4"), muted: hex("#9a8fae"), boss: hex("#d9a6ff"), red: hex("#ff6a5a"),
};
const fmtTime = (t) => {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};
const withPlace = (p, x, y, fn) => {
  p.place(x, y, false, 0);
  fn();
  p.place(0, 0, false, 0);
};

function plate(p, t, x, y, w, h, opts = {}) {
  withPlace(p, x, y, () => panelFx.draw(p, t, {
    width: w, height: h, title: "", ornament: false, shine: false, ...opts,
  }));
}
function meter(p, t, x, y, opts) {
  withPlace(p, x, y, () => statusFx.draw(p, t, opts));
}
function slot(p, t, x, y, opts) {
  withPlace(p, x, y, () => slotFx.draw(p, t, opts));
}
function card(p, t, x, y, opts) {
  withPlace(p, x, y, () => dialogFx.draw(p, t, opts));
}
function hudToggle(p, t, x, y, opts) {
  withPlace(p, x, y, () => hudToggleFx.draw(p, t, opts));
}

export class UI {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.fx = [];
    this.pulse = {};
    this.deny = {};
    this.inventorySkillPick = null;
    this.actionPulse = { id: "", t: 0 };
  }

  reset() {
    this.t = 0;
    this.fx = [];
    this.pulse = {};
    this.deny = {};
    this.inventorySkillPick = null;
    this.actionPulse = { id: "", t: 0 };
  }

  update(dt) {
    this.t += dt;
    for (const k in this.pulse) this.pulse[k] = Math.max(0, this.pulse[k] - dt);
    for (const k in this.deny) this.deny[k] = Math.max(0, this.deny[k] - dt);
    this.actionPulse.t = Math.max(0, this.actionPulse.t - dt);
    for (const inst of this.fx) inst.update(dt);
    this.fx = this.fx.filter((inst) => !inst.done());
  }

  // screen-space pixelfx UI effects
  play(mod, opts) { this.fx.push(createFx(mod, opts)); }
  banner(kicker, text, sub = "") {
    this.play(bannerFx, { x: 160, y: 86, kicker, text, sub, plate: false });
  }
  toast(text, tone = "gold") { this.play(toastFx, { x: 160, y: 154, text, tone, plate: false }); }
  stageClear() {
    const c = uiCopy(this.g);
    this.play(questFx, { x: 160, y: 96, text: c.stageClear, palette: UI_GOLD });
  }
  comboMilestone(n) {
    const c = uiCopy(this.g);
    this.play(comboFx, {
      x: 214, y: 104, count: n, label: c.combo, palette: UI_GOLD,
      textScale: COMBO_MILESTONE_TEXT_SCALE,
    });
  }

  pulseSkill(id) { this.pulse[id] = 0.26; }
  deny(id) { this.deny[id] = 0.22; }

  draw(g, p, frame) {
    const t = this.t;
    if (g.state === "title") {
      this.drawMenu(g, p, 0.58);
      return;
    }
    if (g.state === "inventory") {
      this.drawHud(g, p, t);
      return;
    }
    this.drawHud(g, p, t);
    this.drawCommand(g, p, t);
    for (const inst of this.fx) inst.draw(frame);
    p = painterFor(frame);
    if (g.state === "paused") {
      this.drawMenu(g, p, 0.62);
      const r = RESUME_BUTTON;
      plate(p, t, r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
      p.text(uiCopy(g).continue, r.x + r.w / 2, r.y + 7, C.gold2, { align: "center", outline: C.ink });
    }
    else if (g.state === "gameover") this.drawMenu(g, p, 0.7);
    else if (g.state === "victory") this.drawMenu(g, p, 0.7);
  }

  drawHud(g, p, t) {
    const h = g.hero;
    // hero card (no HUD plate — text and bars float over the scene)
    p.ellipse(23, 25, 18, 18, C.ink, 0.55);
    p.ring(23, 25, 17, 2, C.gold, 0.9);
    p.ellipse(23, 23, 8, 9, hex("#b47650"), 1);
    p.arc(23, 21, 10, 3, Math.PI, Math.PI * 2, hex("#302235"), 1);
    p.dot(20, 23, C.gold2); p.dot(26, 23, C.gold2); p.dot(23, 19, hex("#6ce1c8"));
    const c = uiCopy(g);
    p.text(c.duelist, 47, 8, C.gold, { outline: C.ink });
    p.text(c.level + " " + h.level, 116, 8, C.gold2, { align: "right", outline: C.ink });
    meter(p, t, 64, 21, { label: c.hp, value: h.hp / h.maxHp, text: `${Math.ceil(h.hp)}/${h.maxHp}`, tone: "hp", width: 108, height: 9, cells: 10 });
    meter(p, t, 64, 32, { label: c.mp, value: h.mp / h.maxMp, text: `${Math.floor(h.mp)}/${h.maxMp}`, tone: "mp", width: 108, height: 8, cells: 10 });
    meter(p, t, 64, 41, { label: c.ap, value: h.ap / h.maxAp, text: `${Math.floor(h.ap)}/${h.maxAp}`, tone: "gold", width: 108, height: 8, cells: 10 });
    meter(p, t, 64, 50, { label: "", value: h.xp / h.xpNext, text: "", tone: "xp", width: 108, height: 3, cells: 10 });
    this.drawAutoToggles(g, p, t, c);

    // stage card
    p.text(stageAct(g, g.stage), 186, 8, C.gold, { align: "center", outline: C.ink });
    p.text(stageName(g, g.stage), 186, 15, C.gold2, { align: "center", font: "big", outline: C.ink });
    const boss = g.bossRef && !g.bossRef.dead;
    const phaseLine = g.phase === "clear" ? c.enterGate : g.phase === "travel" ? c.travelling : boss ? c.boss : c.wave(g.waveIndex + 1, g.stage.waves.length);
    p.text(phaseLine, 186, 27, C.muted, { align: "center", outline: C.ink, font: "mini" });
    for (let i = 0; i < STAGES.length; i++) {
      const x = 160 + i * 8, y = 36, on = i === g.stageIndex;
      p.px(x, y - 1, on ? C.gold2 : C.muted); p.px(x, y + 1, on ? C.gold2 : C.muted);
      p.px(x - 1, y, on ? C.gold : C.muted); p.px(x + 1, y, on ? C.gold : C.muted);
      p.px(x, y, on ? C.gold2 : C.muted);
    }

    // kills
    p.text(c.kills, 290, 9, C.gold, { align: "center", outline: C.ink });
    p.text(String(g.kills), 290, 18, C.gold2, { align: "center", font: "big", outline: C.ink });
    // boss bar
    if (boss) {
      p.text(uiCopy(g).bossWarden, 160, 46, C.boss, { align: "center", outline: C.ink });
      p.text(["PHASE I", "PHASE II", "PHASE III"][g.bossRef.phase - 1] ?? "", 312, 46, C.boss, { align: "right", outline: C.ink });
      meter(p, t, 160, 57, { label: "", value: g.bossRef.hp / g.bossRef.maxHp, text: "", tone: "boss", width: 200, height: 9, cells: 20 });
    }
  }

  drawAutoToggles(g, p, t, c = uiCopy(g)) {
    const r = AUTO_TOGGLE_RECTS;
    const half = Math.floor(AUTO_TOGGLE_SIZE / 2);
    const rows = [
      { key: "battle", icon: "battle", label: c.autoBattleHud, on: g.autoBattle, y: r.battle.y + half },
      { key: "loot", icon: "loot", label: c.autoLootHud, on: g.autoLoot, y: r.loot.y + half },
    ];
    for (const row of rows) {
      const cx = AUTO_TOGGLE_X + half;
      hudToggle(p, t, cx, row.y, { on: row.on, icon: row.icon, size: AUTO_TOGGLE_SIZE });
      p.text(row.label, AUTO_TOGGLE_X + AUTO_TOGGLE_SIZE + 4, row.y - 2, row.on ? C.gold2 : C.muted, { outline: C.ink });
      p.text(row.on ? "ON" : "OFF", AUTO_TOGGLE_X + AUTO_TOGGLE_SIZE + 34, row.y - 2, row.on ? C.gold : C.muted, { outline: C.ink });
    }
  }

  handleAutoPointer(x, y) {
    const g = this.g;
    if (g.state !== "playing" && g.state !== "paused") return false;
    for (const [key, rect] of Object.entries(AUTO_TOGGLE_RECTS)) {
      if (!contains(rect, x, y)) continue;
      if (key === "battle") g.setAutoBattle?.(!g.autoBattle);
      else g.setAutoLoot?.(!g.autoLoot);
      g.persistSave?.();
      g.audio.play("ui");
      return true;
    }
    return false;
  }

  drawCommand(g, p, t) {
    const h = g.hero;
    // A vertical right-hand skill rail follows the reference layout: each skill is a compact
    // round node with a colored school, key label and cooldown veil.
    h.skillSlots.forEach((id, i) => {
      if (g.touchUi) return;
      const s = SKILL_META.find((skill) => skill.id === id) ?? SKILL_META[0];
      const left = h.cd[s.id] ?? 0, cd = left / s.cd;
      const r = SKILL_RECTS[i];
      const y = r.y + 10, color = s.tint ? hex(s.tint) : C.gold2;
      p.ellipse(294, y, 9, 9, C.ink, 0.92);
      p.ring(294, y, 9, 2, color, 0.9);
      p.text(s.glyph, 294, y - 4, color, { align: "center", font: "big", outline: C.ink });
      p.text(SKILL_KEYS[i] ?? String(i + 1), 307, y - 3, C.gold2, { align: "center", font: "mini", outline: C.ink });
      if (cd > 0.001) {
        p.ellipse(294, y, 8, 8, C.ink, Math.min(0.8, cd * 0.75));
        p.text(left >= 1 ? String(Math.ceil(left)) : left.toFixed(1), 294, y - 2, C.gold2, { align: "center", font: "mini", outline: C.ink });
      }
    });
    const hud = uiCopy(g);
    if (g.combo.count >= 2 && g.combo.timer > 0) p.text(hud.combo + " x" + g.combo.count, 8, 172, C.gold2, { outline: C.ink });
    if (g.portal) p.text(hud.gate, 282, 172, g.portal.color, { align: "center", outline: C.ink });
  }

  drawInventory(g, p, t) {
    const h = g.hero;
    const hud = uiCopy(g);
    p.rect(0, 0, SW, SH, C.ink, 0.76);
    plate(p, t, 160, 120, 304, 208, { ornament: true });
    p.text("SATCHEL", 16, 22, C.gold, { outline: C.ink, font: "big" });
    p.text("TAB / ESC CLOSE", 304, 22, C.muted, { align: "right", outline: C.ink });
    p.text(hud.meleeWeapons, 18, 38, C.gold2, { outline: C.ink });
    MELEE_WEAPONS.slice(0, 3).forEach((w, i) => {
      const x = 58 + i * 96, active = h.meleeWeaponId === w.id;
      p.rect(x - 42, 44, 84, 30, active ? C.gold : C.muted, active ? 0.28 : 0.12);
      p.rect(x - 40, 46, 80, 26, C.ink, 0.88);
      p.text(w.glyph, x - 30, 56, active ? C.gold2 : C.text, { font: "big", outline: C.ink });
      p.text(weaponLabel(g, w).slice(0, 8), x + 2, 54, active ? C.gold2 : C.text, { align: "center", outline: C.ink, font: "mini" });
      p.text(String(i + 1), x - 36, 48, C.muted, { outline: C.ink, font: "mini" });
    });
    p.text(hud.thrownWeapons, 18, 78, C.gold2, { outline: C.ink });
    THROWN_WEAPONS.slice(0, 3).forEach((w, i) => {
      const x = 58 + i * 96, active = h.thrownWeaponId === w.id;
      p.rect(x - 42, 84, 84, 30, active ? C.gold : C.muted, active ? 0.28 : 0.12);
      p.rect(x - 40, 86, 80, 26, C.ink, 0.88);
      p.text(w.glyph, x - 30, 96, active ? C.gold2 : C.text, { font: "big", outline: C.ink });
      p.text(weaponLabel(g, w).slice(0, 8), x + 2, 94, active ? C.gold2 : C.text, { align: "center", outline: C.ink, font: "mini" });
      p.text(String(i + 4), x - 36, 88, C.muted, { outline: C.ink, font: "mini" });
    });
    p.text("LOADOUT", 18, 120, C.gold2, { outline: C.ink });
    p.text(this.inventorySkillPick == null ? "CLICK A SLOT, THEN PICK A SKILL" : "PICK A SKILL", 302, 96, C.muted, { align: "right", outline: C.ink, font: "mini" });
    h.skillSlots.forEach((id, i) => {
      const s = SKILL_META.find((x) => x.id === id) ?? SKILL_META[0];
      const active = this.inventorySkillPick === i;
      const x = 14 + i * 41;
      p.rect(x - 18, 126, 38, 28, active ? C.gold2 : C.muted, active ? 0.36 : 0.16);
      p.rect(x - 16, 128, 34, 24, C.ink, 0.9);
      p.text(SKILL_KEYS[i] ?? String(i + 1), x - 12, 130, C.muted, { outline: C.ink, font: "mini" });
      p.text(s.glyph, x + 2, 130, s.tint ? hex(s.tint) : C.gold2, { align: "center", font: "big", outline: C.ink });
      p.text(skillLabel(g, s).slice(0, 6), x + 2, 143, C.text, { align: "center", outline: C.ink, font: "mini" });
    });
    p.text("SKILLS", 18, 160, C.gold2, { outline: C.ink });
    SKILL_META.forEach((s, i) => {
      const x = 10 + i * 42;
      const selected = this.inventorySkillPick != null && h.skillSlots[this.inventorySkillPick] === s.id;
      p.rect(x, 166, 36, 26, selected ? C.gold : C.muted, selected ? 0.3 : 0.1);
      p.rect(x + 2, 168, 32, 22, C.ink, 0.9);
      p.text(s.key, x + 6, 170, C.muted, { outline: C.ink, font: "mini" });
      p.text(s.glyph, x + 18, 170, s.tint ? hex(s.tint) : C.gold2, { align: "center", font: "big", outline: C.ink });
      p.text(skillLabel(g, s).slice(0, 6), x + 18, 181, C.text, { align: "center", outline: C.ink, font: "mini" });
    });
    p.text(hud.inventoryHint, 160, 194, C.muted, { align: "center", outline: C.ink, font: "mini" });
    p.text(hud.inventoryReturn, 160, 205, C.gold, { align: "center", outline: C.ink, font: "mini" });
  }

  handlePointer(x, y) {
    const g = this.g, h = g.hero;
    if (g.state !== "inventory") return false;
    if (y < 34) { g.toggleInventory(); return true; }
    if (y >= 42 && y <= 76) {
      const i = Math.floor((x + 38) / 96);
      const w = MELEE_WEAPONS[i];
      if (w) { h.equipWeapon(w.id, g); return true; }
    }
    if (y >= 82 && y <= 116) {
      const i = Math.floor((x + 38) / 96);
      const w = THROWN_WEAPONS[i];
      if (w) { h.equipWeapon(w.id, g); return true; }
    }
    if (y >= 124 && y <= 156) {
      const i = Math.floor((x + 4) / 41);
      if (i >= 0 && i < h.skillSlots.length) { this.inventorySkillPick = i; g.audio.play("ui"); return true; }
    }
    if (y >= 162 && y <= 192 && this.inventorySkillPick != null) {
      const i = Math.floor((x - 10) / 42);
      const s = SKILL_META[i];
      if (s) {
        h.swapSkill(this.inventorySkillPick, s.id);
        this.toast(uiCopy(g).skillReady(skillLabel(g, s)), "gold");
        this.inventorySkillPick = null;
        return true;
      }
    }
    return false;
  }

  handleInventoryKey(key) {
    const g = this.g, h = g.hero;
    if (g.state !== "inventory") return false;
    if (key === "escape" || key === "tab") { g.toggleInventory(); return true; }
    if (["1", "2", "3"].includes(key)) {
      const w = MELEE_WEAPONS[Number(key) - 1];
      if (w) { h.equipWeapon(w.id, g); return true; }
    }
    if (["4", "5", "6"].includes(key)) {
      const w = THROWN_WEAPONS[Number(key) - 4];
      if (w) { h.equipWeapon(w.id, g); return true; }
    }
    if (key === "arrowleft" || key === "arrowright") {
      const d = key === "arrowright" ? 1 : -1;
      this.inventorySkillPick = (this.inventorySkillPick == null ? 0 : (this.inventorySkillPick + d + h.skillSlots.length) % h.skillSlots.length);
      g.audio.play("ui");
      return true;
    }
    if ((key === "z" || key === "x") && this.inventorySkillPick != null) {
      const d = key === "x" ? 1 : -1;
      const ids = SKILL_META.map((s) => s.id);
      const at = Math.max(0, ids.indexOf(h.skillSlots[this.inventorySkillPick]));
      h.swapSkill(this.inventorySkillPick, ids[(at + d + ids.length) % ids.length]);
      g.audio.play("ui");
      return true;
    }
    return false;
  }

  drawMenu(g, p, dim) {
    p.rect(0, 0, SW, SH, C.ink, dim);
    const s = g.stats();
    if (g.state === "title") {
      card(p, this.t, 160, 90, {
        kicker: "A PIXEL ACTION RPG", title: "EMBER ECHO", subtitle: "THE EMBERS NEVER DIE",
        lines: [
          "WASD MOVE",
          "J SLASH   K FIRE   L FROST",
          "U BOLT    I MEND   O METEOR",
          "TAB BAG   Q/SHIFT DODGE   SPACE QUICK",
          `ESC PAUSE   ${g.audio.muted ? "M SOUND OFF" : "M SOUND ON"}`,
        ],
        prompt: g.canContinueSave?.() ? uiCopy(g).continueSave : "PRESS ENTER",
        width: 272, height: 140, tone: "gold",
      });
    } else if (g.state === "paused") {
      card(p, this.t, 160, 90, {
        kicker: uiCopy(g).pausedKicker, title: uiCopy(g).pausedTitle, subtitle: uiCopy(g).pausedSub,
        lines: [`KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ESC RESUME   R RESTART", width: 240, height: 150,
      });
    } else if (g.state === "gameover") {
      card(p, this.t, 160, 90, {
        kicker: "DEFEAT", title: "YOU FELL", subtitle: "THE EMBER WENT OUT",
        lines: [`STAGE ${s.stage}`, `KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ENTER TRY AGAIN", width: 240, height: 140, tone: "blood",
      });
    } else if (g.state === "victory") {
      card(p, this.t, 160, 90, {
        kicker: "VICTORY", title: "EMBER STILL BURNS", subtitle: "THE WARDEN IS ASH",
        lines: [`KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ENTER AGAIN", width: 260, height: 130,
      });
    }
  }
}
