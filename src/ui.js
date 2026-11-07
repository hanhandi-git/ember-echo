// DOM chrome: bars, the six-slot skill row, banners, toasts and the overlay screens.

import { SKILL_META } from "./data.js";
import { drawHeroPortrait } from "./hero.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
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
  }

  init() {
    const skills = $("#skills");
    skills.innerHTML = SKILL_META.map((s) => `
      <div class="skill ready" data-skill="${s.id}" style="--tint:${s.tint};--glow:${s.glow}">
        <span class="key">${s.key}</span>
        <span class="glyph">${s.glyph}</span>
        <span class="name">${esc(s.name)}</span>
        <span class="cost">${s.cost || ""}</span>
        <span class="cd"></span>
        <span class="cdnum"></span>
      </div>`).join("");
    for (const el of skills.querySelectorAll(".skill")) {
      const id = el.dataset.skill;
      this.slots[id] = { el, cd: el.querySelector(".cd"), num: el.querySelector(".cdnum") };
    }
    $("#hint").textContent = "WASD 移动 · J K L U I O 施法 · ESC 暂停 · M 静音";
    $("#stage").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      this.action(btn.dataset.action);
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
    g.audio.setMuted(!g.audio.muted);
    $("#mute").classList.toggle("muted", g.audio.muted);
    $("#mute").textContent = g.audio.muted ? "×" : "♪";
    $("#mute").title = g.audio.muted ? "取消静音 (M)" : "静音 (M)";
  }

  // ---------------------------------------------------------------- overlays
  showOverlay(html) {
    const card = $("#overlay-card");
    card.innerHTML = html;
    $("#overlay").classList.remove("hidden");
  }

  hideOverlay() { $("#overlay").classList.add("hidden"); }

  title() {
    const g = this.g;
    g.state = "title";
    $("#stage").classList.remove("playing");
    this.showOverlay(`
      <div class="title-screen">
        <div class="rune">✦</div>
        <h1>余烬回响</h1>
        <div class="latin">EMBER ECHO</div>
        <p class="tagline">遗迹深处，火种未熄。</p>
        <div class="controls">
          <div class="ctrl-group">
            <div class="ctrl-head">移动</div>
            <div class="keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>
          </div>
          <div class="ctrl-group">
            <div class="ctrl-head">技能</div>
            <div class="skill-list">
              ${SKILL_META.map((s) => `<span><kbd>${s.key}</kbd>${esc(s.name)}</span>`).join("")}
            </div>
          </div>
        </div>
        <button class="cta" type="button" data-action="start">进入遗迹 <small>ENTER</small></button>
        <div class="footnote">击败所有敌人推进三幕 · 拾取战利品恢复状态 · 最后有守卫者</div>
      </div>`);
  }

  pause() {
    this.showOverlay(`
      <div class="rune" style="animation-play-state:paused">✦</div>
      <h2>暂停</h2>
      <div class="sub">火光暂歇</div>
      <div class="overlay-actions">
        <button class="ghost-btn" type="button" data-action="resume">继续 · ESC</button>
        <button class="ghost-btn" type="button" data-action="restart">重新开始 · R</button>
      </div>
      <div class="footnote" style="margin-top:1.4cqw">WASD 移动 · J K L U I O 施法 · M 静音</div>`);
  }

  statGrid(stats) {
    return `<div class="stat-grid">
      <div><b>${stats.kills}</b><span>击破</span></div>
      <div><b>Lv.${stats.level}</b><span>等级</span></div>
      <div><b>${fmtTime(stats.time)}</b><span>用时</span></div>
    </div>`;
  }

  gameover(stats) {
    $("#stage").classList.remove("playing");
    this.showOverlay(`
      <div class="rune" style="animation:none;color:#8c6a72">✧</div>
      <h2 style="color:#ffc8b8">你倒下了</h2>
      <div class="sub">火种在黑暗中熄灭 · 第 ${stats.stage} 幕</div>
      ${this.statGrid(stats)}
      <div class="overlay-actions">
        <button class="cta" type="button" data-action="restart">再次进入 <small>ENTER</small></button>
      </div>`);
  }

  victory(stats) {
    $("#stage").classList.remove("playing");
    this.showOverlay(`
      <div class="rune">✦</div>
      <h2 style="color:#ffe8a8">余烬仍在</h2>
      <div class="sub">三幕已尽，守卫者归于尘土。</div>
      ${this.statGrid(stats)}
      <div class="skill-strip">
        <span><b>WASD</b> 移动</span><span><b>J</b> 斩</span><span><b>K</b> 火</span><span><b>L</b> 霜</span><span><b>U</b> 雷</span><span><b>I</b> 愈</span><span><b>O</b> 陨</span>
      </div>
      <div class="overlay-actions">
        <button class="cta" type="button" data-action="restart">再走一遍 <small>ENTER</small></button>
      </div>`);
  }

  start() {
    $("#stage").classList.add("playing");
    this.hideOverlay();
    this.bannerTimer = 0;
    this.toastTimer = 0;
    $("#banner").classList.remove("show");
    this.hideBoss();
  }

  // ---------------------------------------------------------------- stage / wave
  setStage(stage) {
    $("#stage-act").textContent = stage.act;
    $("#stage-name").textContent = stage.name;
    $("#stage-wave").textContent = stage.sub;
    const acts = [...document.querySelectorAll("#acts i")];
    acts.forEach((el, i) => el.classList.toggle("on", i === this.g.stageIndex));
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
    b.classList.add("show");
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => b.classList.remove("show"), kind === "CLEAR" ? 2500 : kind === "LEVEL" ? 1600 : 1900);
  }

  toast(text) {
    const t = $("#pickup-toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove("show"), 1000);
  }

  combo(n) {
    const c = $("#combo");
    if (n >= 2) {
      $("#combo-n").textContent = n;
      c.classList.add("show");
    } else c.classList.remove("show");
  }

  pulseSkill(id) {
    const s = this.slots[id];
    if (!s) return;
    s.el.classList.remove("pulse");
    void s.el.offsetWidth;
    s.el.classList.add("pulse");
    clearTimeout(s.pulseT);
    s.pulseT = setTimeout(() => s.el.classList.remove("pulse"), 280);
  }

  deny(id) {
    const s = this.slots[id];
    if (!s) return;
    s.el.classList.add("deny");
    clearTimeout(s.denyT);
    s.denyT = setTimeout(() => s.el.classList.remove("deny"), 220);
  }

  showBoss() {
    $("#boss-wrap").classList.remove("hidden");
    const b = this.g.bossRef;
    if (b) $("#boss-name").textContent = b.name;
    $("#boss-phase").textContent = "相位 I";
  }

  hideBoss() { $("#boss-wrap").classList.add("hidden"); }

  // ---------------------------------------------------------------- per-frame bars
  update(g) {
    const now = performance.now();
    if (now - this.last < 45) return;
    this.last = now;
    const h = g.hero;
    const hpPct = Math.max(0, h.hp / h.maxHp) * 100;
    const mpPct = Math.max(0, h.mp / h.maxMp) * 100;
    $("#hp-fill").style.width = hpPct.toFixed(1) + "%";
    $("#mp-fill").style.width = mpPct.toFixed(1) + "%";
    $("#hp-text").textContent = `${Math.ceil(h.hp)} / ${h.maxHp}`;
    $("#mp-text").textContent = `${Math.floor(h.mp)} / ${h.maxMp}`;
    $("#xp-fill").style.width = Math.min(100, (h.xp / h.xpNext) * 100).toFixed(1) + "%";
    $("#hero-level").textContent = "Lv." + h.level;
    $("#kills").textContent = g.kills;

    if (!this.portraitDrawn) {
      drawHeroPortrait($("#portrait"));
      this.portraitDrawn = true;
    }

    for (const s of SKILL_META) {
      const slot = this.slots[s.id];
      const left = h.cd[s.id] ?? 0;
      const cooled = left <= 0.0001;
      slot.el.classList.toggle("cooling", !cooled);
      slot.el.classList.toggle("ready", cooled && h.mp >= s.cost);
      slot.el.classList.toggle("nomana", h.mp < s.cost);
      slot.cd.style.setProperty("--cd", cooled ? "0%" : Math.min(100, (left / s.cd) * 100).toFixed(1) + "%");
      slot.num.textContent = cooled ? "" : left >= 1 ? Math.ceil(left) : left.toFixed(1);
    }

    // wave count
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
      $("#boss-fill").style.width = Math.max(0, (b.hp / b.maxHp) * 100).toFixed(1) + "%";
      $("#boss-phase").textContent = ["相位 I", "相位 II", "相位 III"][b.phase - 1] ?? "相位 I";
      $("#boss-wrap").classList.remove("hidden");
    } else if (g.bossDefeated) {
      this.hideBoss();
    }

    this.combo(g.combo.count >= 2 && g.combo.timer > 0 ? g.combo.count : 0);
  }
}
