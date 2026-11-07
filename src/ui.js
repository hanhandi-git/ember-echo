// DOM chrome, built from the shared pixelfx UI kit. The kit owns every frame, bar, key, slot, badge,
// button and modal; this file only fills them and moves them between states.

import { SKILL_META } from "./data.js";
import { drawHeroPortrait } from "./hero.js";
import * as px from "../../pixelfx/ui/pixel-ui.js";

const $ = (s) => document.querySelector(s);
const fmtTime = (t) => {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export class UI {
  constructor(game) {
    this.g = game;
    this.slots = {};
    this.last = 0;
    this.bannerTimer = 0;
    this.toastTimer = 0;
    this.portraitDrawn = false;
    this.stage = null;
  }

  init() {
    // hotbar slots all come from one kit component; only the glyph tint differs per skill
    const row = $("#skills");
    row.innerHTML = "";
    for (const s of SKILL_META) {
      const slot = px.skillSlot({
        id: s.id, key: s.key, glyph: s.glyph, name: s.name, cost: s.cost,
        accent: s.tint, glow: s.glow, note: s.note,
      });
      row.append(slot);
      this.slots[s.id] = { el: slot };
    }
    $("#mute-icon").innerHTML = px.icons.sound;
    $("#hint").textContent = "WASD 移动 · J K L U I O 施法 · ESC 暂停 · M 静音";
    $("#overlay").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (btn) this.action(btn.dataset.action);
    });
    $("#mute").addEventListener("click", () => this.toggleMute());
    this.title();
  }

  action(name) {
    const g = this.g;
    g.audio.unlock();
    g.audio.play("ui");
    if (name === "start") g.startRun();
    else if (name === "resume") g.togglePause();
    else if (name === "restart") g.restart();
    else if (name === "mute") this.toggleMute();
  }

  toggleMute() {
    const g = this.g;
    g.audio.unlock();
    g.audio.setMuted(!g.audio.muted);
    const muted = g.audio.muted;
    $("#mute-icon").innerHTML = muted ? px.icons.muted : px.icons.sound;
    $("#mute").classList.toggle("is-quiet", muted);
    $("#mute").setAttribute("aria-label", muted ? "取消静音" : "静音");
    $("#mute").title = muted ? "取消静音 (M)" : "静音 (M)";
  }

  // ---------------------------------------------------------------- overlays
  showOverlay(card) {
    const overlay = $("#overlay");
    overlay.innerHTML = "";
    overlay.append(card);
    overlay.classList.remove("is-hidden");
    overlay.inert = false;
  }

  hideOverlay() {
    const overlay = $("#overlay");
    overlay.classList.add("is-hidden");
    overlay.inert = true;
  }

  title() {
    const g = this.g;
    g.state = "title";
    $("#stage").classList.remove("playing");
    this.hideBoss();

    const body = document.createElement("div");
    body.className = "title-body";
    body.append(
      px.controls([
        { label: "移动", content: px.keys(["W", "A", "S", "D"]) },
        { label: "技能", content: px.skillList(SKILL_META.map((s) => ({ key: s.key, name: s.name }))) },
      ]),
    );
    const start = px.button({ label: "进入遗迹", sub: "ENTER", variant: "primary", action: "start" });
    const card = px.modal({
      kicker: "A PIXEL ACTION RPG",
      title: "余烬回响",
      latin: "EMBER ECHO",
      sub: "遗迹深处，火种未熄。",
      body,
      footer: start,
      note: "击败所有敌人推进三幕 · 拾取战利品恢复状态 · 最后有守卫者",
      wide: true,
      titleScreen: true,
      headHtml: `<span class="px-ornament px-ornament--lg" aria-hidden="true"></span>`,
    });
    this.showOverlay(card);
  }

  pause() {
    const stats = this.g.stats();
    const card = px.modal({
      kicker: "PAUSED",
      title: "暂停",
      sub: "火光暂歇",
      body: px.statGrid([
        { value: stats.kills, label: "击破" },
        { value: "Lv." + stats.level, label: "等级" },
        { value: fmtTime(stats.time), label: "用时" },
      ]),
      footer: [
        px.button({ label: "继续", sub: "ESC", variant: "primary", action: "resume" }),
        px.button({ label: "重新开始", sub: "R", variant: "ghost", action: "restart" }),
      ],
      note: "WASD 移动 · J K L U I O 施法 · M 静音",
    });
    this.showOverlay(card);
  }

  gameover(stats) {
    $("#stage").classList.remove("playing");
    const card = px.modal({
      kicker: "DEFEAT",
      title: "你倒下了",
      sub: `火种在黑暗中熄灭 · 第 ${stats.stage} 幕`,
      body: px.statGrid([
        { value: stats.kills, label: "击破" },
        { value: "Lv." + stats.level, label: "等级" },
        { value: fmtTime(stats.time), label: "用时" },
      ]),
      footer: px.button({ label: "再次进入", sub: "ENTER", variant: "primary", action: "restart" }),
      note: "ENTER 重新开始",
      className: "is-danger",
    });
    this.showOverlay(card);
  }

  victory(stats) {
    $("#stage").classList.remove("playing");
    const body = document.createElement("div");
    const rule = document.createElement("div");
    rule.className = "px-rule";
    rule.style.marginBottom = "calc(var(--px-u) * 10)";
    body.append(
      rule,
      px.statGrid([
        { value: stats.kills, label: "击破" },
        { value: "Lv." + stats.level, label: "等级" },
        { value: fmtTime(stats.time), label: "用时" },
      ]),
    );
    const strip = document.createElement("div");
    strip.className = "px-skill-strip";
    strip.style.marginTop = "calc(var(--px-u) * 12)";
    strip.innerHTML = "<span><b>J</b> 斩</span><span><b>K</b> 火</span><span><b>L</b> 霜</span><span><b>U</b> 雷</span><span><b>I</b> 愈</span><span><b>O</b> 陨</span>";
    body.append(strip);
    const card = px.modal({
      kicker: "VICTORY",
      title: "余烬仍在",
      sub: "三幕已尽，守卫者归于尘土。",
      body,
      footer: px.button({ label: "再走一遍", sub: "ENTER", variant: "primary", action: "restart" }),
      note: "感谢游玩 · 按 ENTER 重新开始",
    });
    this.showOverlay(card);
  }

  start() {
    $("#stage").classList.add("playing");
    this.hideOverlay();
    clearTimeout(this.bannerTimer);
    clearTimeout(this.toastTimer);
    $("#banner").classList.remove("is-open");
    $("#pickup-toast").classList.remove("is-open");
    this.hideBoss();
  }

  // ---------------------------------------------------------------- stage / wave
  setStage(stage) {
    $("#stage-act").textContent = stage.act;
    $("#stage-name").textContent = stage.name;
    $("#stage-wave").textContent = stage.sub;
    px.setPips($("#acts"), this.g.stageIndex);
    this.stage = stage;
  }

  setWave(i, count) {
    const wave = this.g.stage.waves[i] ?? [];
    const boss = wave.some((s) => s.type === "boss");
    $("#stage-wave").textContent = boss ? "守卫者" : `第 ${i + 1} 波 · ${count} 个敌人`;
  }

  // ---------------------------------------------------------------- transient feedback
  banner(kicker, title, sub, kind = "STAGE") {
    const b = $("#banner");
    $("#banner-kicker").textContent = kicker;
    $("#banner-title").textContent = title;
    $("#banner-sub").textContent = sub;
    b.classList.add("is-open");
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => b.classList.remove("is-open"), kind === "CLEAR" ? 2500 : kind === "LEVEL" ? 1600 : 1900);
  }

  toast(text) {
    const t = $("#pickup-toast");
    t.textContent = text;
    t.classList.add("is-open");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove("is-open"), 1000);
  }

  combo(n) {
    const c = $("#combo");
    if (n >= 2) {
      $("#combo-n").textContent = n;
      c.classList.add("is-on");
    } else c.classList.remove("is-on");
  }

  pulseSkill(id) { px.pulseSkill(this.slots[id]?.el); }
  deny(id) { px.denySkill(this.slots[id]?.el); }

  showBoss() {
    const wrap = $("#boss-wrap");
    wrap.hidden = false;
    const b = this.g.bossRef;
    if (b) $("#boss-name").textContent = b.name;
    $("#boss-phase").textContent = "相位 I";
  }

  hideBoss() { $("#boss-wrap").hidden = true; }

  // ---------------------------------------------------------------- per-frame bars
  update(g) {
    const now = performance.now();
    if (now - this.last < 45) return;
    this.last = now;
    const h = g.hero;

    px.setBar($("#hp-bar"), Math.max(0, h.hp / h.maxHp), `${Math.ceil(h.hp)} / ${h.maxHp}`);
    px.setBar($("#mp-bar"), Math.max(0, h.mp / h.maxMp), `${Math.floor(h.mp)} / ${h.maxMp}`);
    px.setBar($("#xp-bar"), Math.min(1, h.xp / h.xpNext), null);
    $("#hero-level").textContent = "Lv." + h.level;
    $("#kills").textContent = g.kills;

    if (!this.portraitDrawn) {
      drawHeroPortrait($("#portrait"));
      this.portraitDrawn = true;
    }

    for (const s of SKILL_META) {
      px.setSkill(this.slots[s.id].el, {
        left: h.cd[s.id] ?? 0,
        total: s.cd,
        mp: h.mp,
        cost: s.cost,
      });
    }

    if (this.stage && g.state !== "title") {
      const alive = g.enemies.filter((e) => !e.dead).length + g.spawnQueue.length;
      const boss = g.bossRef && !g.bossRef.dead;
      if (boss && !g.bossRef.state.includes("spawn")) {
        $("#stage-wave").textContent = "守卫者 · 第 " + g.bossRef.phase + " 相位";
      } else if (g.phase === "fight" && !boss) {
        $("#stage-wave").textContent = `第 ${g.waveIndex + 1} 波 · ${alive} 个敌人`;
      }
    }

    if (g.bossRef && !g.bossRef.dead) {
      const b = g.bossRef;
      $("#boss-wrap").hidden = false;
      $("#boss-name").textContent = b.name;
      px.setBar($("#boss-bar"), Math.max(0, b.hp / b.maxHp), "");
      $("#boss-phase").textContent = ["相位 I", "相位 II", "相位 III"][b.phase - 1] ?? "相位 I";
    } else if (g.bossDefeated) {
      this.hideBoss();
    }

    this.combo(g.combo.count >= 2 && g.combo.timer > 0 ? g.combo.count : 0);
  }
}
