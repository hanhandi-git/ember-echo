import { createFx, clamp } from "../../../../pixelfx/src/core/index.js";
import { GATE_PALETTES } from "../../fx/stage-portal.js";
import { uiCopy } from "../../copy.js";
import { HUB_ADVENTURE_GATE, HUB_SPAWNS, HUB_WORLD_W } from "../../content/hub-worlds.js";
import { acquireHubMapTiles } from "../map-tile-pool.js";

export const hubSystem = {
  hubActive: false,
  hubZone: "camp",
  hubDepartHintT: 0,

  loadHub(opts = {}) {
    this.domUi?.close?.();
    this.hubActive = true;
    this.campMenuOpen = false;
    this.hubGateArmed = true;
    this._hubDepartPending = false;
    this.invalidateStagePrewarm?.();
    const built = acquireHubMapTiles(this.mapFxTiles);
    this.mapFxTiles = built.mapFxTiles;
    this.mapTileFrames = built.mapTileFrames;
    this.mapFx = this.mapFxTiles[0];
    this.worldW = HUB_WORLD_W;
    this.hubZone = opts.zone ?? "camp";
    const spawn = HUB_SPAWNS[this.hubZone] ?? HUB_SPAWNS.camp;
    this.ui.reset();
    this.hero.spawn(spawn[0], spawn[1]);
    this.cameraX = clamp(this.hero.x - 160, 0, HUB_WORLD_W - 320);
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.impacts = [];
    this.hitStop = 0;
    this.shakeState = { amp: 0, t: 0, dur: 0 };
    this.flashState.a = 0;
    this.keys.clear();
    this.touchAttackHeld = false;
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
    this.dashTrails = [];
    this.portal = null;
    this.bossRef = null;
    this.bossDefeated = false;
    this.waveIndex = 0;
    this.phaseT = 0;
    this.clearT = 0;
    this.hold = 0;
    this.deathT = 0;
    this.combo = { count: 0, timer: 0 };
    this.phase = "camp";
    this.state = "camp";
    this.fade = 0;
    this.hubDepartHintT = 0;
    this.hubAdventureFx = createFx(this.fx.stagePortal, {
      x: HUB_ADVENTURE_GATE.x,
      y: HUB_ADVENTURE_GATE.y,
      palette: GATE_PALETTES.normal,
      reveal: 1,
      seed: 84,
    });
    this.audio.setScene({ camp: true, stageIndex: this.stageIndex ?? 0, boss: false });
    this.scheduleCampPrewarm?.();
    if (built.ready) {
      built.ready.then((tiles) => {
        if (!tiles || !this.hubActive) return;
        const settled = acquireHubMapTiles(this.mapFxTiles);
        this.mapFxTiles = settled.mapFxTiles;
        this.mapTileFrames = settled.mapTileFrames;
        this.mapFx = this.mapFxTiles[0];
      });
    }
  },

  hubAdventureDistance() {
    const g = HUB_ADVENTURE_GATE;
    return Math.hypot(this.hero.x - g.x, (this.hero.y - g.y) * 1.35);
  },

  nearHubAdventureGate() {
    return this.hubAdventureDistance() < HUB_ADVENTURE_GATE.r;
  },

  openHubDeparture() {
    if (this.state !== "camp" || !this.hubActive || this.campMenuOpen
      || this._hubDepartPending || !this.nearHubAdventureGate()) return false;
    this.hubGateArmed = false;
    this.keys.clear();
    this.touchUi?.reset?.();
    this.hero.vx = this.hero.vy = 0;
    this.campMenuOpen = true;
    this.domUi?.openCamp?.();
    this.audio.play("ui");
    return true;
  },

  tryHubDepart() {
    if (this.state !== "camp" || !this.hubActive) return false;
    if (this.nearHubAdventureGate()) {
      this.openHubDeparture();
      return true;
    }
    const c = uiCopy(this);
    this.ui.toast(c.hubDepartHint, "gold");
    this.hubDepartHintT = 2.4;
    this.audio.play("ui");
    return true;
  },

  updateHub(dt) {
    if (this.state !== "camp" || !this.hubActive) return;
    this.hubAdventureFx?.update(dt);
    if (!this.campMenuOpen && !this._hubDepartPending) {
      if (this.hubAdventureDistance() > HUB_ADVENTURE_GATE.r + 4) this.hubGateArmed = true;
      if (this.hubGateArmed && this.nearHubAdventureGate()) this.openHubDeparture();
    }
    const nextZone = this.hero.x < 300 ? "camp" : "town";
    if (nextZone !== this.hubZone) {
      this.hubZone = nextZone;
      const c = uiCopy(this);
      this.ui.toast(nextZone === "town" ? c.hubTownArrive : c.hubCampArrive, "gold");
      this.audio.play("ui");
    }
    if (this.hubDepartHintT > 0) this.hubDepartHintT -= dt;
    this.updateCamera();
  },

  drawHubGates(p) {
    if (this.state !== "camp" || !this.hubActive) return;
    const c = uiCopy(this);
    const gate = HUB_ADVENTURE_GATE;
    this.hubAdventureFx.options.x = gate.x;
    this.hubAdventureFx.options.y = gate.y;
    const ink = "#07060d", gold = "#ffd36a", dim = "#a8a0b0";
    if (!this.campMenuOpen) {
      p.text(c.hubExploreHint, this.cameraX + 160, 173, gold, { align: "center", outline: ink, font: "mini" });
    }
    if (this.nearHubAdventureGate()) {
      p.text(c.hubDepartReady, gate.x, gate.y - 62, gold, { align: "center", outline: ink, font: "mini" });
    } else if (this.hubZone === "camp") {
      p.text(c.hubAdventureSign, gate.x, gate.y - 62, dim, { align: "center", outline: ink, font: "mini" });
    }
    if (this.hubZone === "camp" && this.hero.x < 260) {
      p.text(c.hubTownSign, 310, 132, dim, { align: "center", outline: ink, font: "mini" });
    } else if (this.hubZone === "town" && this.hero.x > 340) {
      p.text(c.hubCampSign, 330, 132, dim, { align: "center", outline: ink, font: "mini" });
    }
  },
};
