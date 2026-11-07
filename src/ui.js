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
import { SKILL_META, WEAPONS, STAGES } from "./data.js";
import { RESUME_BUTTON, SKILL_RECTS } from "./controls.js";

const SW = 320, SH = 180;
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
  banner(kicker, text, sub = "") { this.play(bannerFx, { x: 160, y: 86, kicker, text, sub }); }
  toast(text, tone = "gold") { this.play(toastFx, { x: 160, y: 154, text, tone }); }
  stageClear() { this.play(questFx, { x: 160, y: 96, text: "STAGE CLEAR", palette: UI_GOLD }); }
  comboMilestone(n) { this.play(comboFx, { x: 214, y: 104, count: n, label: "COMBO", palette: UI_GOLD }); }

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
      p.text("CONTINUE  [P]", r.x + r.w / 2, r.y + 7, C.gold2, { align: "center", outline: C.ink });
    }
    else if (g.state === "gameover") this.drawMenu(g, p, 0.7);
    else if (g.state === "victory") this.drawMenu(g, p, 0.7);
  }

  drawHud(g, p, t) {
    const h = g.hero;
    // hero card
    plate(p, t, 62, 24, 116, 40);
    p.ellipse(23, 25, 18, 18, C.ink, 0.9);
    p.ring(23, 25, 17, 2, C.gold, 0.9);
    p.ellipse(23, 23, 8, 9, hex("#b47650"), 1);
    p.arc(23, 21, 10, 3, Math.PI, Math.PI * 2, hex("#302235"), 1);
    p.dot(20, 23, C.gold2); p.dot(26, 23, C.gold2); p.dot(23, 19, hex("#6ce1c8"));
    p.text("DUELIST", 47, 8, C.gold, { outline: C.ink });
    p.text("LV " + h.level, 116, 8, C.gold2, { align: "right", outline: C.ink });
    meter(p, t, 64, 21, { label: "HP", value: h.hp / h.maxHp, text: `${Math.ceil(h.hp)}/${h.maxHp}`, tone: "hp", width: 108, height: 9, cells: 10 });
    meter(p, t, 64, 32, { label: "MP", value: h.mp / h.maxMp, text: `${Math.floor(h.mp)}/${h.maxMp}`, tone: "mp", width: 108, height: 8, cells: 10 });
    meter(p, t, 64, 41, { label: "", value: h.xp / h.xpNext, text: "", tone: "xp", width: 108, height: 3, cells: 10 });

    // stage card
    plate(p, t, 186, 24, 120, 40);
    p.text(g.stage.actEn, 186, 8, C.gold, { align: "center", outline: C.ink });
    p.text(g.stage.nameEn, 186, 15, C.gold2, { align: "center", font: "big", outline: C.ink });
    const boss = g.bossRef && !g.bossRef.dead;
    p.text(g.phase === "clear" ? "ENTER THE GATE" : g.phase === "travel" ? "TRAVELLING" : boss ? "BOSS" : `WAVE ${g.waveIndex + 1}/${g.stage.waves.length}`, 186, 27, C.muted, { align: "center", outline: C.ink });
    for (let i = 0; i < STAGES.length; i++) {
      const x = 160 + i * 8, y = 36, on = i === g.stageIndex;
      p.px(x, y - 1, on ? C.gold2 : C.muted); p.px(x, y + 1, on ? C.gold2 : C.muted);
      p.px(x - 1, y, on ? C.gold : C.muted); p.px(x + 1, y, on ? C.gold : C.muted);
      p.px(x, y, on ? C.gold2 : C.muted);
    }

    // kills
    plate(p, t, 290, 24, 44, 40);
    p.text("KILLS", 290, 9, C.gold, { align: "center", outline: C.ink });
    p.text(String(g.kills), 290, 18, C.gold2, { align: "center", font: "big", outline: C.ink });

    // boss bar
    if (boss) {
      p.text(g.bossRef.nameEn ?? "THE WARDEN", 160, 46, C.boss, { align: "center", outline: C.ink });
      p.text(["PHASE I", "PHASE II", "PHASE III"][g.bossRef.phase - 1] ?? "", 312, 46, C.boss, { align: "right", outline: C.ink });
      meter(p, t, 160, 57, { label: "", value: g.bossRef.hp / g.bossRef.maxHp, text: "", tone: "boss", width: 200, height: 9, cells: 20 });
    }
  }

  drawCommand(g, p, t) {
    const h = g.hero;
    // A vertical right-hand skill rail follows the reference layout: each skill is a compact
    // round node with a colored school, key label and cooldown veil.
    h.skillSlots.forEach((id, i) => {
      if (g.touchUi?.active) return;
      const s = SKILL_META.find((skill) => skill.id === id) ?? SKILL_META[0];
      const left = h.cd[s.id] ?? 0, cd = left / s.cd;
      const r = SKILL_RECTS[i];
      const y = r.y + 10, color = s.tint ? hex(s.tint) : C.gold2;
      p.ellipse(294, y, 9, 9, C.ink, 0.92);
      p.ring(294, y, 9, 2, color, 0.9);
      p.text(s.glyph, 294, y - 4, color, { align: "center", font: "big", outline: C.ink });
      p.text(["J", "K", "L", "U", "I", "O"][i], 307, y - 3, C.gold2, { align: "center", font: "mini", outline: C.ink });
      if (cd > 0.001) {
        p.ellipse(294, y, 8, 8, C.ink, Math.min(0.8, cd * 0.75));
        p.text(left >= 1 ? String(Math.ceil(left)) : left.toFixed(1), 294, y - 2, C.gold2, { align: "center", font: "mini", outline: C.ink });
      }
    });
    if (g.combo.count >= 2 && g.combo.timer > 0) p.text("COMBO x" + g.combo.count, 8, 172, C.gold2, { outline: C.ink });
    if (g.portal) p.text("GATE >", 282, 172, g.portal.color, { align: "center", outline: C.ink });
  }

  drawInventory(g, p, t) {
    const h = g.hero;
    p.rect(0, 0, SW, SH, C.ink, 0.76);
    plate(p, t, 160, 120, 304, 208, { ornament: true });
    p.text("SATCHEL", 16, 22, C.gold, { outline: C.ink, font: "big" });
    p.text("TAB / ESC CLOSE", 304, 22, C.muted, { align: "right", outline: C.ink });
    p.text("WEAPONS", 18, 43, C.gold2, { outline: C.ink });
    WEAPONS.forEach((w, i) => {
      const x = 58 + i * 101, active = h.weaponId === w.id;
      p.rect(x - 45, 50, 90, 34, active ? C.gold : C.muted, active ? 0.28 : 0.12);
      p.rect(x - 43, 52, 86, 30, C.ink, 0.88);
      p.text(w.glyph, x - 32, 62, active ? C.gold2 : C.text, { font: "big", outline: C.ink });
      p.text(w.nameEn, x + 3, 59, active ? C.gold2 : C.text, { align: "center", outline: C.ink, font: "mini" });
      p.text(`${w.dmgMul > 1 ? "+" : ""}${Math.round((w.dmgMul - 1) * 100)}% DMG`, x + 3, 68, C.muted, { align: "center", outline: C.ink, font: "mini" });
      p.text(`${w.speed} SPD`, x + 3, 76, C.muted, { align: "center", outline: C.ink, font: "mini" });
    });
    p.text("LOADOUT", 18, 96, C.gold2, { outline: C.ink });
    p.text(this.inventorySkillPick == null ? "CLICK A SLOT, THEN PICK A SKILL" : "PICK A SKILL", 302, 96, C.muted, { align: "right", outline: C.ink, font: "mini" });
    h.skillSlots.forEach((id, i) => {
      const s = SKILL_META.find((x) => x.id === id) ?? SKILL_META[0];
      const active = this.inventorySkillPick === i;
      const x = 38 + i * 47;
      p.rect(x - 21, 103, 42, 31, active ? C.gold2 : C.muted, active ? 0.36 : 0.16);
      p.rect(x - 19, 105, 38, 27, C.ink, 0.9);
      p.text(String(i + 1), x - 14, 109, C.muted, { outline: C.ink, font: "mini" });
      p.text(s.glyph, x + 3, 108, s.tint ? hex(s.tint) : C.gold2, { align: "center", font: "big", outline: C.ink });
      p.text(s.nameEn, x + 3, 123, C.text, { align: "center", outline: C.ink, font: "mini" });
    });
    p.text("SKILLS", 18, 147, C.gold2, { outline: C.ink });
    SKILL_META.forEach((s, i) => {
      const x = 18 + i * 42;
      const selected = this.inventorySkillPick != null && h.skillSlots[this.inventorySkillPick] === s.id;
      p.rect(x, 153, 36, 29, selected ? C.gold : C.muted, selected ? 0.3 : 0.1);
      p.rect(x + 2, 155, 32, 25, C.ink, 0.9);
      p.text(s.key, x + 6, 158, C.muted, { outline: C.ink, font: "mini" });
      p.text(s.glyph, x + 18, 158, s.tint ? hex(s.tint) : C.gold2, { align: "center", font: "big", outline: C.ink });
      p.text(s.nameEn.slice(0, 7), x + 18, 172, C.text, { align: "center", outline: C.ink, font: "mini" });
    });
    p.text("1–3 EQUIP WEAPON   ARROWS PICK SLOT   Z/X CHANGE SKILL", 160, 194, C.muted, { align: "center", outline: C.ink, font: "mini" });
    p.text("EQUIP A BUILD, THEN RETURN TO THE FIGHT", 160, 207, C.gold, { align: "center", outline: C.ink, font: "mini" });
  }

  handlePointer(x, y) {
    const g = this.g, h = g.hero;
    if (g.state !== "inventory") return false;
    if (y < 34) { g.toggleInventory(); return true; }
    if (y >= 48 && y <= 88) {
      const i = Math.floor((x + 43) / 101);
      const w = WEAPONS[i];
      if (w) { h.equipWeapon(w.id, g); return true; }
    }
    if (y >= 100 && y <= 137) {
      const i = Math.floor((x + 9) / 47);
      if (i >= 0 && i < h.skillSlots.length) { this.inventorySkillPick = i; g.audio.play("ui"); return true; }
    }
    if (y >= 150 && y <= 184 && this.inventorySkillPick != null) {
      const i = Math.floor((x - 18) / 42);
      const s = SKILL_META[i];
      if (s) { h.swapSkill(this.inventorySkillPick, s.id); this.toast(`${s.nameEn} READY`, "gold"); this.inventorySkillPick = null; return true; }
    }
    return false;
  }

  handleInventoryKey(key) {
    const g = this.g, h = g.hero;
    if (g.state !== "inventory") return false;
    if (key === "escape" || key === "tab") { g.toggleInventory(); return true; }
    if (["1", "2", "3"].includes(key)) { h.equipWeapon(WEAPONS[Number(key) - 1].id, g); return true; }
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
        prompt: "PRESS ENTER", width: 272, height: 140, tone: "gold",
      });
    } else if (g.state === "paused") {
      card(p, this.t, 160, 90, {
        kicker: "PAUSED", title: "PAUSED", subtitle: "THE EMBERS REST",
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
