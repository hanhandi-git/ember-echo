import { canContinue, loadSave } from "../../save.js";
import { warmAudioTemplates } from "../../audio.js";
import { acquireStageMapTiles } from "../map-tile-pool.js";
import { STAGES } from "../../data.js";

export const prewarmSystem = {
  _stagePrewarm: null,
  _prewarmIdle: null,

  prewarmResumeStage() {
    if (this.state !== "camp") return;
    // Workers rasterize the stage off-thread; the main-thread bake is only a fallback.
    if (this.battleMapWorkers?.available) return;
    const data = loadSave();
    const index = canContinue(data) ? (data.run.stageIndex ?? 0) : 0;
    if (this._stagePrewarm?.index === index) return;
    // Hub backdrop tiles are not battle maps — always bake the real stage into prewarm.
    if (!this.hubActive && this.stageIndex === index && this.mapFxTiles?.length) {
      this._stagePrewarm = { index, mapFxTiles: this.mapFxTiles, mapTileFrames: this.mapTileFrames };
      return;
    }
    const built = acquireStageMapTiles(index);
    if (built) this._stagePrewarm = built;
  },

  adoptStagePrewarm(index) {
    const prewarm = this._stagePrewarm;
    if (!prewarm || prewarm.index !== index) return false;
    this._stagePrewarm = null;
    this.mapFxTiles = prewarm.mapFxTiles;
    this.mapTileFrames = prewarm.mapTileFrames;
    this.mapFx = prewarm.mapFxTiles[0];
    this.mapStageIndex = index;
    return true;
  },

  invalidateStagePrewarm() {
    this._stagePrewarm = null;
  },

  scheduleCampPrewarm() {
    if (this._prewarmIdle != null) return;
    const run = () => {
      this._prewarmIdle = null;
      if (this.state !== "camp") return;
      warmAudioTemplates();
      this.hero.warmMeleePoses();
      // Bake the resumed stage's worker raster while the player is still in
      // camp so stepping through the gate never waits on the main thread.
      const data = loadSave();
      const index = canContinue(data) ? (data.run.stageIndex ?? 0) : 0;
      const mapKey = STAGES[index]?.mapKey;
      if (mapKey) this.battleMapWorkers?.prepareStage(index, mapKey, STAGES[index].map);
      this.prewarmResumeStage();
    };
    if (typeof requestIdleCallback === "function") {
      this._prewarmIdle = requestIdleCallback(run, { timeout: 1500 });
    } else {
      this._prewarmIdle = setTimeout(run, 120);
    }
  },
};
