import { dlog } from "../debug.js";
import { createFx, clamp } from "../../../../pixelfx/src/core/index.js";
import { GATE_PALETTES } from "../../fx/stage-portal.js";
import { uiCopy } from "../../copy.js";
import { HUB_ADVENTURE_GATE, HUB_ARENA_DUMMY, HUB_SPAWNS, HUB_WORLD_W } from "../../content/hub-worlds.js";
import { acquireHubMapTiles } from "../map-tile-pool.js";
import { TrainingDummy } from "../../training-dummy.js";
import { LEGACY_BAND } from "../depth.js";
import { DNF, label } from "../../../../pixelfx/src/fx/ui/_dnf.js";

/** Hub zones follow the six-tile strip; boundaries sit just inside each tile's end. */
const HUB_ZONE_ORDER = ["camp", "town", "arena", "marsh", "peak", "temple"];
const HUB_ZONE_BOUNDS = [300, 620, 940, 1260, 1580];
const HUB_ZONE_TILE_X = [0, 320, 640, 960, 1280, 1600];
const HUB_ZONE_ARRIVE = {
  camp: "hubCampArrive",
  town: "hubTownArrive",
  arena: "hubArenaArrive",
  marsh: "hubMarshArrive",
  peak: "hubPeakArrive",
  temple: "hubTempleArrive",
};
const HUB_ZONE_SIGN = {
  camp: "hubCampSign",
  town: "hubTownSign",
  arena: "hubArenaSign",
  marsh: "hubMarshSign",
  peak: "hubPeakSign",
  temple: "hubTempleSign",
};

function hubZoneAt(x) {
  const i = HUB_ZONE_BOUNDS.findIndex((b) => x < b);
  return HUB_ZONE_ORDER[i === -1 ? HUB_ZONE_ORDER.length - 1 : i];
}

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
    this.mapStageIndex = null;
    dlog("hub", "loadHub", { zone: opts.zone ?? "camp", tiles: this.mapFxTiles.length, artworkPending: !!built.ready });
    this.worldW = HUB_WORLD_W;
    this.walkBand = LEGACY_BAND;
    this.hubZone = opts.zone ?? "camp";
    const spawn = HUB_SPAWNS[this.hubZone] ?? HUB_SPAWNS.camp;
    this.ui.reset();
    this.hero.spawn(spawn[0], spawn[1]);
    this.cameraX = clamp(this.hero.x - 160, 0, HUB_WORLD_W - 320);
    this.enemies = this.hubZone === "arena"
      ? [new TrainingDummy(HUB_ARENA_DUMMY[0], HUB_ARENA_DUMMY[1])]
      : [];
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
        if (!this.hubActive) { dlog("hub", "artwork settled after leaving camp — skipped"); return; }
        if (!tiles) { dlog("hub", "artwork decode returned null — staying on gradient"); return; }
        const settled = acquireHubMapTiles(this.mapFxTiles);
        this.mapFxTiles = settled.mapFxTiles;
        this.mapTileFrames = settled.mapTileFrames;
        this.mapFx = this.mapFxTiles[0];
        dlog("hub", "hub artwork swapped in", { tiles: this.mapFxTiles.length });
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

  /** Open the camp loadout panel from anywhere in the hub, without the gate. */
  openHubBag(tab = "loadout") {
    if (this.state !== "camp" || !this.hubActive || this.campMenuOpen || this._hubDepartPending) return false;
    this.keys.clear();
    this.touchUi?.reset?.();
    this.hero.vx = this.hero.vy = 0;
    this.campMenuOpen = true;
    this.domUi?.open?.(tab, "camp", { anywhere: true });
    this.audio.play("ui");
    return true;
  },

  closeHubBag() {
    if (this.state !== "camp" || !this.campMenuOpen) return false;
    this.domUi?.close?.();
    this.audio.play("ui");
    return true;
  },

  toggleHubBag() {
    return this.campMenuOpen ? this.closeHubBag() : this.openHubBag();
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
    const nextZone = hubZoneAt(this.hero.x);
    if (nextZone !== this.hubZone) {
      this.hubZone = nextZone;
      this.enemies = nextZone === "arena"
        ? [new TrainingDummy(HUB_ARENA_DUMMY[0], HUB_ARENA_DUMMY[1])]
        : [];
      const c = uiCopy(this);
      this.ui.toast(c[HUB_ZONE_ARRIVE[nextZone]] ?? c.hubCampArrive, "gold");
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
    const ink = DNF.ink, gold = DNF.goldHi, dim = DNF.text;
    if (!this.campMenuOpen) {
      label(p, c.hubExploreHint, this.cameraX + 160, 6, gold, { align: "center", outline: ink });
    }
    if (this.nearHubAdventureGate()) {
      label(p, c.hubDepartReady, gate.x, gate.y - 62, gold, { align: "center", outline: ink });
    } else if (this.hubZone === "camp") {
      label(p, c.hubAdventureSign, gate.x, gate.y - 62, dim, { align: "center", outline: ink });
    }
    if (this.hubZone === "arena") {
      label(p, c.hubArenaSign, HUB_ARENA_DUMMY[0], 74, gold, { align: "center", outline: ink });
    } else {
      const zi = HUB_ZONE_ORDER.indexOf(this.hubZone);
      const sx = HUB_ZONE_TILE_X[zi] + 40;
      if (this.hero.x > sx - 30 && this.hero.x < sx + 90) {
        label(p, c[HUB_ZONE_SIGN[this.hubZone]], sx, 132, dim, { align: "center", outline: ink });
      }
    }
  },
};
