import { STAGES } from "../../data.js";
import { Boss, spawnEnemy as spawnEnemyEntity } from "../../enemies.js";
import { stageName, uiCopy } from "../../copy.js";

const STAGE_EMBER_REWARD = 20;

export const stageFlowSystem = {
  updateFlow(dt) {
    if (!this.hero.alive) return;
    if (this.hold > 0) {
      this.hold -= dt;
      return;
    }
    this.phaseT += dt;
    if (this.phase === "intro") {
      if (this.phaseT > 1.45) this.startWave(0);
    } else if (this.phase === "fight") {
      const busy = this.enemies.length > 0 || this.spawnQueue.length > 0;
      if (!busy) {
        this.clearT += dt;
        if (this.clearT > 0.85) {
          if (this.waveIndex + 1 < this.stage.waves.length) this.startWave(this.waveIndex + 1);
          else this.stageClear();
        }
      } else this.clearT = 0;
    } else if (this.phase === "clear") {
      if (!this.portal) this.openPortal();
    } else if (this.phase === "travel") {
      if (this.phaseT > 0.65) {
        const next = this.portal?.targetStage ?? this.stageIndex + 1;
        if (next < STAGES.length) {
          this.fade = 1;
          this.loadStage(next, false);
        } else {
          this.portal = null;
          this.victory();
        }
      }
    }
  },

  startWave(i) {
    this.waveIndex = i;
    this.phase = "fight";
    this.phaseT = 0;
    this.clearT = 0;
    const wave = this.stage.waves[i] ?? [];
    wave.forEach((spec, n) => this.spawnQueue.push({ ...spec, delay: n * 0.28 }));
    if (i > 0) {
      const boss = wave.some((s) => s.type === "boss");
      const c = uiCopy(this);
      if (boss) this.banner(c.boss, c.bossWarden, c.bossSub);
      else this.banner(c.wave(i + 1, this.stage.waves.length), stageName(this, this.stage), c.waveGather);
    }
  },

  updateSpawns(dt) {
    if (!this.spawnQueue.length) return;
    for (const q of this.spawnQueue) q.delay -= dt;
    const ready = this.spawnQueue.filter((q) => q.delay <= 0);
    this.spawnQueue = this.spawnQueue.filter((q) => q.delay > 0);
    for (const q of ready) this.spawnEnemy(q.type, q.x, q.y, { seed: 100 + this.kills * 13 + Math.floor(this.time * 9) });
  },

  spawnEnemy(type, x, y, opts = {}) {
    const e = spawnEnemyEntity(this, type, x, y, opts);
    if (e instanceof Boss) {
      this.bossRef = e;
      this.audio.play("boss");
    }
    return e;
  },

  stageClear() {
    if (!this.hero.alive || this.phase === "clear" || this.phase === "travel") return;
    this.phase = "clear";
    this.phaseT = 0;
    this.ui.stageClear();
    this.audio.play("level");
    this.hero.heal(this, Math.round(this.hero.maxHp * 0.22));
    this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 24);
    this.hero.earnEmbers(STAGE_EMBER_REWARD);
    this.projectiles = [];
    this.spawnQueue = [];
    this.timers = [];
    this.telegraphs = [];
    this.portal = null;
    this.openPortal();
    this.persistSave?.();
  },

  victory() {
    if (this.state === "victory") return;
    this.state = "victory";
    this.audio.play("level");
    this.clearRunSave?.();
  },

  stats() {
    return {
      kills: this.kills,
      level: this.hero.level,
      time: this.runTime,
      stage: this.stageIndex + 1,
    };
  },
};
