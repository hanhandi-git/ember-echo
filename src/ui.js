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
import { SKILL_META } from "./data.js";

const SW = 320, SH = 240;
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
  }

  reset() {
    this.t = 0;
    this.fx = [];
    this.pulse = {};
    this.deny = {};
  }

  update(dt) {
    this.t += dt;
    for (const k in this.pulse) this.pulse[k] = Math.max(0, this.pulse[k] - dt);
    for (const k in this.deny) this.deny[k] = Math.max(0, this.deny[k] - dt);
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
    this.drawHud(g, p, t);
    this.drawCommand(g, p, t);
    for (const inst of this.fx) inst.draw(frame);
    p = painterFor(frame);
    if (g.state === "paused") this.drawMenu(g, p, 0.62);
    else if (g.state === "gameover") this.drawMenu(g, p, 0.7);
    else if (g.state === "victory") this.drawMenu(g, p, 0.7);
  }

  drawHud(g, p, t) {
    const h = g.hero;
    // hero card
    plate(p, t, 62, 24, 116, 40);
    p.text("DUELIST", 8, 8, C.gold, { outline: C.ink });
    p.text("LV " + h.level, 116, 8, C.gold2, { align: "right", outline: C.ink });
    meter(p, t, 64, 21, { label: "HP", value: h.hp / h.maxHp, text: `${Math.ceil(h.hp)}/${h.maxHp}`, tone: "hp", width: 108, height: 9, cells: 10 });
    meter(p, t, 64, 32, { label: "MP", value: h.mp / h.maxMp, text: `${Math.floor(h.mp)}/${h.maxMp}`, tone: "mp", width: 108, height: 8, cells: 10 });
    meter(p, t, 64, 41, { label: "", value: h.xp / h.xpNext, text: "", tone: "xp", width: 108, height: 3, cells: 10 });

    // stage card
    plate(p, t, 186, 24, 120, 40);
    p.text(g.stage.actEn, 186, 8, C.gold, { align: "center", outline: C.ink });
    p.text(g.stage.nameEn, 186, 15, C.gold2, { align: "center", font: "big", outline: C.ink });
    const boss = g.bossRef && !g.bossRef.dead;
    p.text(boss ? "BOSS" : `WAVE ${g.waveIndex + 1}/${g.stage.waves.length}`, 186, 27, C.muted, { align: "center", outline: C.ink });
    for (let i = 0; i < 3; i++) {
      const x = 178 + i * 8, y = 36, on = i === g.stageIndex;
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
    plate(p, t, 160, 210, 320, 60, { ornament: true });
    p.rect(0, 181, 320, 1, C.gold, 0.5);
    const h = g.hero;
    SKILL_META.forEach((s, i) => {
      const left = h.cd[s.id] ?? 0, cd = left / s.cd;
      slot(p, t, 52 + i * 44, 204, {
        key: s.key, name: s.nameEn, icon: s.icon, cooldown: cd,
        cdText: left > 0.001 ? (left >= 1 ? String(Math.ceil(left)) : left.toFixed(1)) : "",
        mana: h.mp >= s.cost, width: 40, height: 46,
        flash: (this.pulse[s.id] ?? 0) > 0, deny: (this.deny[s.id] ?? 0) > 0,
      });
    });
    if (g.combo.count >= 2 && g.combo.timer > 0) {
      p.text("x" + g.combo.count, 16, 192, C.gold2, { align: "center", font: "big", outline: C.ink });
      p.text("COMBO", 16, 204, C.muted, { align: "center", outline: C.ink });
    }
    p.text(`WASD MOVE   ESC PAUSE   M SOUND ${g.audio.muted ? "OFF" : "ON"}`, 160, 233, C.muted, { align: "center", outline: C.ink });
  }

  drawMenu(g, p, dim) {
    p.rect(0, 0, SW, SH, C.ink, dim);
    const s = g.stats();
    if (g.state === "title") {
      card(p, this.t, 160, 120, {
        kicker: "A PIXEL ACTION RPG", title: "EMBER ECHO", subtitle: "THE EMBERS NEVER DIE",
        lines: [
          "WASD MOVE",
          "J SLASH   K FIRE   L FROST",
          "U BOLT    I MEND   O METEOR",
          `ESC PAUSE   ${g.audio.muted ? "M SOUND OFF" : "M SOUND ON"}`,
        ],
        prompt: "PRESS ENTER", width: 272, height: 140, tone: "gold",
      });
    } else if (g.state === "paused") {
      card(p, this.t, 160, 120, {
        kicker: "PAUSED", title: "PAUSED", subtitle: "THE EMBERS REST",
        lines: [`KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ESC RESUME   R RESTART", width: 240, height: 130,
      });
    } else if (g.state === "gameover") {
      card(p, this.t, 160, 120, {
        kicker: "DEFEAT", title: "YOU FELL", subtitle: "THE EMBER WENT OUT",
        lines: [`STAGE ${s.stage}`, `KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ENTER TRY AGAIN", width: 240, height: 140, tone: "blood",
      });
    } else if (g.state === "victory") {
      card(p, this.t, 160, 120, {
        kicker: "VICTORY", title: "EMBER STILL BURNS", subtitle: "THE WARDEN IS ASH",
        lines: [`KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ENTER AGAIN", width: 260, height: 130,
      });
    }
  }
}
