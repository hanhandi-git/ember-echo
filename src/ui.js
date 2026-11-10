// The entire game UI is pixel art drawn into the same 320×180 canvas as the fight. The console, slots,
// orbs, target bars, dungeon card and windows are reusable UI effects from pixelfx/src/fx/ui (the
// arcade-dungeon pack); this file only places them and feeds them the current game state.

import { createFx, painterFor, hex, clamp } from "../../pixelfx/src/core/index.js";
import { UI_GOLD } from "../../pixelfx/src/fx/ui/_lib.js";
import { TONES } from "../../pixelfx/src/fx/ui/_ember.js";
import { DNF, veil, windowFrame, slotFrame, button, layeredBar, label, labelWidth, title, titleWidth } from "../../pixelfx/src/fx/ui/_dnf.js";
import * as hudFx from "../../pixelfx/src/fx/ui/dnf-hud.js";
import * as bossBarFx from "../../pixelfx/src/fx/ui/dnf-boss-bar.js";
import * as minimapFx from "../../pixelfx/src/fx/ui/dnf-minimap.js";
import * as comboFx from "../../pixelfx/src/fx/ui/combo-counter.js";
import { SKILL_META, STAGES } from "./data.js";
import { classLabel } from "./classes.js";
import { skillLabel, stageName, uiCopy, pick } from "./copy.js";
import { heroSprite } from "./hero-sprites.js";
import {
  RESUME_BUTTON, CAMP_BUTTON, SKILL_KEYS, AUTO_TOGGLE_RECTS, HUD_CONSOLE, HERO_PANEL, contains,
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
const BOSS_ROOMS = STAGES.map((stage, i) => (stage.waves.some((wave) => wave.some((spec) => spec.type === "boss")) ? i : -1)).filter((i) => i >= 0);
/** Sword arts share one school; each gets its own slot picture so the bar reads at a glance. */
const ART_ICON = { cleave: "cleave", rush: "rush", rise: "rise", guard: "guard", awakening: "awaken" };
export function slotIconOf(skill) {
  if (!skill) return { icon: "none" };
  if (skill.art && ART_ICON[skill.art]) return { icon: ART_ICON[skill.art] };
  if (skill.id === "t") return { icon: "slash", palette: TONES.frost };
  return { icon: skill.icon ?? "burst" };
}
/** Clear time decides the grade on the result card. */
export function runRank(time) {
  return time < 240 ? "S" : time < 360 ? "A" : time < 540 ? "B" : "C";
}

const HEADLINE_TIME = 2.4, TOAST_TIME = 1.8;
const TOAST_TONES = { gold: DNF.goldHi, mp: hex("#8fc0ff"), hp: hex("#ff9a86") };

const PORTRAIT = 18;
const portraits = new Map();
/** The hero's head, cropped from the idle frame at the frame's own density. */
function heroPortrait(look, appearance, density) {
  const key = `${look}:${density}:${JSON.stringify(appearance ?? null)}`;
  let image = portraits.get(key);
  if (image !== undefined) return image;
  const body = heroSprite(look, {}, false, appearance);
  image = null;
  if (body?.n) {
    let top = Infinity;
    for (let i = 0; i < body.n; i++) if (body.ys[i] < top) top = body.ys[i];
    let sum = 0, count = 0;
    for (let i = 0; i < body.n; i++) if (body.ys[i] < top + 11) { sum += body.xs[i]; count++; }
    const cx = sum / Math.max(1, count), size = PORTRAIT * density;
    image = new Uint32Array(size * size);
    for (let i = 0; i < body.n; i++) {
      const x = Math.round((body.xs[i] - cx + PORTRAIT / 2) * density), y = Math.round((body.ys[i] - top + 1) * density);
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      // Sprites authored below the frame density would leave gaps; fill the whole source texel.
      const span = Math.max(1, Math.round(density / (body.density ?? density)));
      for (let dy = 0; dy < span && y + dy < size; dy++) for (let dx = 0; dx < span && x + dx < size; dx++) image[(y + dy) * size + x + dx] = body.color[i];
    }
  }
  if (portraits.size > 24) portraits.delete(portraits.keys().next().value);
  portraits.set(key, image);
  return image;
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
    this.target = null;
    this.bossTrail = { ref: null, v: 1 };
    this.headline = null;
    this.toasts = [];
  }

  reset() {
    this.t = 0;
    this.fx = [];
    this.pulse = {};
    this.deny = {};
    this.inventorySkillPick = null;
    this.actionPulse = { id: "", t: 0 };
    this.target = null;
    this.bossTrail = { ref: null, v: 1 };
    this.headline = null;
    this.toasts = [];
  }

  update(dt) {
    this.t += dt;
    for (const k in this.pulse) this.pulse[k] = Math.max(0, this.pulse[k] - dt);
    for (const k in this.deny) this.deny[k] = Math.max(0, this.deny[k] - dt);
    this.actionPulse.t = Math.max(0, this.actionPulse.t - dt);
    for (const inst of this.fx) inst.update(dt);
    this.fx = this.fx.filter((inst) => !inst.done());
    if (this.headline && (this.headline.t += dt) >= HEADLINE_TIME) this.headline = null;
    for (const toast of this.toasts) toast.t += dt;
    this.toasts = this.toasts.filter((toast) => toast.t < TOAST_TIME);
    // damage trails catch up with the real health a moment after the hit
    const boss = this.bossTrail.ref;
    if (boss) this.bossTrail.v = Math.max(Math.max(0, boss.hp) / boss.maxHp, this.bossTrail.v - dt * 0.12);
    if (this.target) {
      const e = this.target.ref;
      this.target.t -= dt * (e.dead || e.hp <= 0 ? 4 : 1);
      this.target.trail = Math.max(Math.max(0, e.hp) / e.maxHp, this.target.trail - dt * 0.9);
      if (this.target.t <= 0) this.target = null;
    }
  }

  // screen-space pixelfx UI effects
  play(mod, opts) { this.fx.push(createFx(mod, opts)); }
  /** A headline across the middle of the screen: stage intro, wave, boss, stage clear. */
  banner(kicker, text, sub = "") {
    this.headline = { kicker, text, sub, t: 0 };
  }
  toast(text, tone = "gold") {
    this.toasts.push({ text, tone, t: 0 });
    if (this.toasts.length > 3) this.toasts.shift();
  }
  stageClear() {
    this.banner("", uiCopy(this.g).stageClear, "");
  }
  comboMilestone(n) {
    this.play(comboFx, {
      x: 214, y: 96, count: n, label: "COMBO", palette: UI_GOLD,
      textScale: COMBO_MILESTONE_TEXT_SCALE,
    });
  }

  pulseSkill(id) { this.pulse[id] = 0.26; }
  denySkill(id) { this.deny[id] = 0.22; }

  /** Remember the enemy that was just hit so its name and health show at the top of the screen. */
  noteTarget(enemy) {
    if (!enemy || enemy.boss) return;
    this.target = { ref: enemy, t: 3, trail: Math.max(enemy.hp, 0) / enemy.maxHp };
  }

  touchLayout(g) { return !!g.touchUi?.active; }

  draw(g, p, frame) {
    const t = this.t;
    if (g.state === "camp") {
      if (!g.campMenuOpen) {
        this.drawHeroPanel(g, p, t);
        if (!this.touchLayout(g)) this.drawConsole(g, p, t, g.hubZone !== "arena");
        for (const inst of this.fx) inst.draw(frame);
        this.drawNotices(painterFor(frame));
      }
      return;
    }
    this.drawHud(g, p, t);
    if (g.state === "inventory") return;
    this.drawCommand(g, p, t);
    for (const inst of this.fx) inst.draw(frame);
    p = painterFor(frame);
    this.drawNotices(p);
    if (g.state === "paused" || g.state === "gameover" || g.state === "victory") this.drawMenu(g, p);
  }

  /** The headline and the toast stack. Both slide in, hold, and fade by dither. */
  drawNotices(p) {
    const h = this.headline;
    if (h) {
      const k = Math.min(1, h.t / 0.16), out = clamp((h.t - (HEADLINE_TIME - 0.28)) / 0.28), a = Math.min(k, 1 - out);
      const x = 160 + Math.round((1 - k) * (1 - k) * 26 - out * out * 26), y = 70, w = Math.max(60, titleWidth(h.text));
      if (a > 0.02) {
        veil(p, 0, y - 6, SW, 28, DNF.ink, 0.34 * a);
        if (h.kicker) label(p, h.kicker, x, y - 11, DNF.goldHi, { align: "center", outline: DNF.ink, a });
        title(p, h.text, x, y, { align: "center", a });
        for (const dir of [-1, 1]) {
          const x0 = x + dir * (w / 2 + 8);
          p.rect(dir < 0 ? x0 - 40 : x0, y + 7, 40, 1, DNF.gold, a);
          p.rect(x0 - 1, y + 6, 3, 3, DNF.goldHi, a);
        }
        if (h.sub) label(p, h.sub, x, y + 19, DNF.text, { align: "center", outline: DNF.ink, a });
      }
    }
    this.toasts.forEach((toast, i) => {
      const a = Math.min(1, toast.t / 0.12, (TOAST_TIME - toast.t) / 0.3);
      const y = 140 - (this.toasts.length - 1 - i) * 9 - Math.round((1 - Math.min(1, toast.t / 0.12)) * 4);
      const w = labelWidth(p, toast.text) + 12;
      veil(p, 160 - w / 2, y - 2, w, 9, DNF.ink, 0.5 * a);
      label(p, toast.text, 160, y, TOAST_TONES[toast.tone] ?? DNF.goldHi, { align: "center", outline: DNF.ink, a });
    });
  }

  drawHud(g, p, t) {
    const c = uiCopy(g), touch = this.touchLayout(g);
    this.drawHeroPanel(g, p, t);
    if (!touch) this.drawConsole(g, p, t, false);

    // dungeon card, top right (below the DOM bag/pause buttons on touch screens)
    const boss = g.bossRef && !g.bossRef.dead ? g.bossRef : null;
    const phaseLine = g.phase === "clear" ? c.enterGate : g.phase === "travel" ? c.travelling : boss ? c.boss : c.wave(g.waveIndex + 1, g.stage.waves.length);
    const mapY = touch ? 38 : 4;
    withPlace(p, SW - 4, mapY, () => minimapFx.draw(p, t, {
      title: stageName(g, g.stage), rooms: STAGES.length, current: g.stageIndex, boss: BOSS_ROOMS,
      sub: phaseLine, time: fmtTime(g.runTime ?? 0), width: 62,
    }));
    label(p, `${c.kills} ${g.kills}`, SW - 6, mapY + 34, DNF.text, { align: "right", outline: DNF.ink });

    // target bar, top centre: the boss while it lives, otherwise the enemy that was last hit
    if (boss) {
      const value = Math.max(0, boss.hp) / boss.maxHp;
      if (this.bossTrail.ref !== boss) this.bossTrail = { ref: boss, v: value };
      withPlace(p, 164, 4, () => bossBarFx.draw(p, t, {
        name: pick(g, boss.nameEn ?? "BOSS", c.bossWarden, boss.nameEn ?? "BOSS"), value, trail: this.bossTrail.v,
        layers: Math.max(2, Math.round(boss.maxHp / 30)), phase: ["PHASE I", "PHASE II", "PHASE III"][boss.phase - 1] ?? "",
      }));
    } else if (this.target && this.target.t > 0) {
      const e = this.target.ref, value = Math.max(0, e.hp) / e.maxHp;
      withPlace(p, 160, 6, () => bossBarFx.draw(p, t, {
        compact: true, name: pick(g, e.type?.nameEn ?? "", e.name ?? "", e.type?.nameEn ?? ""), value, trail: this.target.trail,
        a: Math.min(1, this.target.t / 0.4),
      }));
    }
  }

  drawHeroPanel(g, p, t) {
    const h = g.hero, c = uiCopy(g), r = HERO_PANEL;
    slotFrame(p, r.x, r.y, r.s, { selected: true });
    p.rect(r.x + 2, r.y + 2, r.s - 4, r.s - 4, hex("#1a2030"));
    const density = p.density ?? 1, image = heroPortrait(h.look, h.appearance, density);
    if (image) p.image(image, PORTRAIT * density, PORTRAIT * density, r.x + 2, r.y + 2, density);
    const tx = r.x + r.s + 3;
    label(p, classLabel(h.classId, g.language), tx, r.y + 1, DNF.goldHi, { outline: DNF.ink });
    const level = `Lv${h.level}`;
    if (this.touchLayout(g)) {
      label(p, level, tx + labelWidth(p, classLabel(h.classId, g.language)) + 4, r.y + 1, DNF.text, { outline: DNF.ink });
      layeredBar(p, tx, r.y + 9, 58, 3, h.hp / h.maxHp, 1);
      layeredBar(p, tx, r.y + 14, 58, 2, h.mp / h.maxMp, 1, { colors: [hex("#3a8ee0")] });
      layeredBar(p, tx, r.y + 18, 58, 1, h.xp / h.xpNext, 1, { colors: [hex("#9ac83c")] });
    } else {
      label(p, level, tx, r.y + 9, DNF.text, { outline: DNF.ink });
      label(p, `${c.embers} ${h.embers ?? 0}`, tx + labelWidth(p, level) + 4, r.y + 9, DNF.gold, { outline: DNF.ink });
    }
    if (g.state !== "camp") this.drawAutoToggles(g, p, t, c);
  }

  drawAutoToggles(g, p, _t, c = uiCopy(g)) {
    const rows = [
      { rect: AUTO_TOGGLE_RECTS.battle, label: c.autoBattleHud, on: g.autoBattle },
      { rect: AUTO_TOGGLE_RECTS.loot, label: c.autoLootHud, on: g.autoLoot },
    ];
    for (const { rect, label, on } of rows) button(p, rect.x, rect.y, rect.w, rect.h, label, { hot: on, dim: !on });
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

  /** Bottom console: life orb, seven slots, action and experience bars, mana orb. */
  drawConsole(g, p, t, locked) {
    const h = g.hero;
    const slots = h.skillSlots.map((id, i) => {
      const s = SKILL_META.find((skill) => skill.id === id) ?? SKILL_META[0];
      const left = h.cd[s.id] ?? 0, max = s.id === "j" ? h.meleeCooldownMax : s.cd;
      return {
        ...slotIconOf(s), key: SKILL_KEYS[i] ?? String(i + 1),
        cooldown: max > 0 ? clamp(left / max) : 0,
        cdText: left > 0.05 && max >= 1 ? (left >= 1 ? String(Math.ceil(left)) : left.toFixed(1)) : "",
        mana: h.mp >= (s.cost ?? 0), flash: (this.pulse[s.id] ?? 0) > 0, deny: (this.deny[s.id] ?? 0) > 0,
      };
    });
    withPlace(p, HUD_CONSOLE.x, HUD_CONSOLE.y, () => hudFx.draw(p, t, {
      hp: h.hp / h.maxHp, mp: h.mp / h.maxMp, ap: h.ap / h.maxAp, xp: h.xp / h.xpNext,
      hpText: String(Math.max(0, Math.ceil(h.hp))), mpText: String(Math.floor(h.mp)), slots, locked,
    }));
  }

  drawCommand(g, p, _t) {
    const hud = uiCopy(g);
    if (g.combo.count >= 2 && g.combo.timer > 0) {
      label(p, hud.combo, 6, 56, DNF.goldHi, { outline: DNF.ink });
      label(p, "x" + g.combo.count, 6, 63, C.gold2, { outline: DNF.ink, font: "big" });
    }
    if (g.portal) label(p, hud.gate, 314, 146, g.portal.color, { align: "right", outline: C.ink });
  }

  handlePointer(x, y) {
    const g = this.g, h = g.hero;
    if (g.state !== "inventory") return false;
    if (y < 34) { g.toggleInventory(); return true; }
    if (y >= 124 && y <= 156) {
      const i = Math.floor((x + 4) / 41);
      if (i >= 0 && i < h.skillSlots.length) { this.inventorySkillPick = i; g.audio.play("ui"); return true; }
    }
    if (y >= 162 && y <= 192 && this.inventorySkillPick != null) {
      const i = Math.floor((x - 10) / 42);
      const s = SKILL_META.filter((s) => h.canUseSkill(s.id))[i];
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
    if (key === "arrowleft" || key === "arrowright") {
      const d = key === "arrowright" ? 1 : -1;
      this.inventorySkillPick = (this.inventorySkillPick == null ? 0 : (this.inventorySkillPick + d + h.skillSlots.length) % h.skillSlots.length);
      g.audio.play("ui");
      return true;
    }
    if ((key === "z" || key === "x") && this.inventorySkillPick != null) {
      const d = key === "x" ? 1 : -1;
      const ids = SKILL_META.filter((s) => h.canUseSkill(s.id)).map((s) => s.id);
      const at = Math.max(0, ids.indexOf(h.skillSlots[this.inventorySkillPick]));
      h.swapSkill(this.inventorySkillPick, ids[(at + d + ids.length) % ids.length]);
      g.audio.play("ui");
      return true;
    }
    return false;
  }

  drawMenu(g, p) {
    const c = uiCopy(g), s = g.stats(), t = this.t;
    veil(p, 0, 0, SW, SH, DNF.ink, g.state === "paused" ? 0.55 : 0.64);
    const rows = (x, y, w, list) => list.forEach(([name, value], i) => {
      if (i % 2) veil(p, x, y + i * 9 - 2, w, 9, DNF.bar0, 0.5);
      label(p, name, x + 4, y + i * 9, DNF.muted, { outline: DNF.ink });
      label(p, String(value), x + w - 4, y + i * 9, DNF.text, { align: "right", outline: DNF.ink });
    });
    if (g.state === "paused") {
      const box = windowFrame(p, 78, 34, 164, 110, { title: c.pausedTitle, close: true });
      rows(box.x + 4, box.y + 4, box.w - 8, [[c.kills, s.kills], [c.level, s.level], [c.time, fmtTime(s.time)]]);
      const hot = Math.sin(t * 4) > -0.2;
      button(p, RESUME_BUTTON.x, RESUME_BUTTON.y, RESUME_BUTTON.w, RESUME_BUTTON.h, c.continue, { hot });
      button(p, CAMP_BUTTON.x, CAMP_BUTTON.y, CAMP_BUTTON.w, CAMP_BUTTON.h, c.returnCamp);
      label(p, c.pausedPrompt, 160, 134, DNF.muted, { align: "center", outline: DNF.ink });
      return;
    }
    const win = g.state === "victory";
    const box = windowFrame(p, 80, 38, 160, 96, { title: win ? c.victoryTitle : c.defeatTitle, accent: win ? DNF.goldHi : hex("#ff8a7a") });
    label(p, win ? c.wardenAsh : c.defeatSub, 160, box.y + 2, win ? DNF.gold : DNF.muted, { align: "center", outline: DNF.ink });
    if (win) {
      const rank = runRank(s.time);
      label(p, c.rank, box.x + 22, box.y + 14, DNF.muted, { align: "center", outline: DNF.ink });
      label(p, rank, box.x + 22, box.y + 24, rank === "S" ? DNF.goldHi : DNF.text, { align: "center", outline: DNF.ink, font: "big", scale: 3 });
      p.glow(box.x + 22, box.y + 34, 22, DNF.goldHi, 0.12 + 0.05 * Math.sin(t * 3));
      rows(box.x + 46, box.y + 16, box.w - 50, [[c.time, fmtTime(s.time)], [c.kills, s.kills], [c.level, s.level], [c.embers, g.hero.embers ?? 0]]);
    } else {
      rows(box.x + 4, box.y + 16, box.w - 8, [[c.stage, s.stage], [c.kills, s.kills], [c.level, s.level], [c.time, fmtTime(s.time)]]);
    }
    const a = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.2));
    label(p, c.resultPrompt, 160, box.y + box.h - 8, DNF.goldHi, { align: "center", outline: DNF.ink, a });
  }
}
