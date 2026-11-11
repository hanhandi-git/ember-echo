import { STAGES, ENEMY_TYPES, FX } from "../../data.js";
import { Boss, spawnEnemy as spawnEnemyEntity } from "../../enemies.js";
import { stageName, uiCopy } from "../../copy.js";
import { LEGACY_BAND } from "../depth.js";

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
    // The stage flows left to right, so arrivals are scattered over a wide band
    // ahead of the hero rather than hugging authored anchors; a `count` pack
    // means extra copies each rolled independently, not a tight squad.
    const lo = Math.max(36, Math.min(this.hero.x - 90, this.worldW - 260));
    const hi = this.worldW - 30;
    const expanded = [];
    wave.forEach((spec) => {
      const { count, spread: _spread, ...rest } = spec;
      const n = Math.max(1, Math.min(6, count ?? 1));
      for (let k = 0; k < n; k++) {
        if (spec.type === "boss") { expanded.push(spec); break; }
        // pow() skews the roll right so most mobs still appear ahead of the hero
        expanded.push({
          ...rest,
          x: this.clampX(lo + Math.pow(Math.random(), 0.55) * (hi - lo), 30),
          y: Math.min(LEGACY_BAND[1], Math.max(LEGACY_BAND[0], spec.y + (Math.random() * 2 - 1) * 12)),
          elite: k === 0 && spec.elite === true,
        });
      }
    });
    // Entrances stagger left to right so the wave reads as an advance.
    expanded.sort((a, b) => a.x - b.x);
    expanded.forEach((spec, n) => {
      this.spawnQueue.push({ ...spec, y: this.depthY(spec.y), delay: n * 0.16 + Math.random() * 0.12 });
    });
    if (i > 0) {
      const boss = wave.some((s) => ENEMY_TYPES[s.type]?.boss || s.type === "boss");
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
    for (const q of ready) this.spawnEnemy(q.type, q.x, q.y, { seed: 100 + this.kills * 13 + Math.floor(this.time * 9), elite: q.elite === true });
  },

  spawnEnemy(type, x, y, opts = {}) {
    const e = spawnEnemyEntity(this, type, x, y, opts);
    if (e instanceof Boss) {
      // Boss entrances get a ceremony: tendrils for the warden, a resurrection for the shade.
      const enter = type === "boss" ? FX.shadowTendrils : FX.holyResurrection;
      if (enter) this.addFx(enter, { x, y, light: 1.2 }, { life: enter.meta?.duration ?? 2 });
      this.bossRef = e;
      this.audio.setScene({ boss: true });
      this.sfxAt("boss", x);
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
