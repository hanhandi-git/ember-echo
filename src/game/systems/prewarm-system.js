import { createFrame, createFx } from "../../../../pixelfx/src/core/index.js";
import { RENDER_DENSITY } from "../constants.js";
import { STAGES } from "../../data.js";
import { canContinue, loadSave } from "../../save.js";
import { warmAudioTemplates } from "../../audio.js";

function buildMapTiles(index) {
  const stage = STAGES[index];
  if (!stage) return null;
  const mapFxTiles = [0, 320].map((x) => createFx(stage.map, { x, y: 0, seed: 3 + index + x / 320 }));
  const mapTileFrames = mapFxTiles.map(() => createFrame(320, 180, 0, 0, RENDER_DENSITY));
  return { index, mapFxTiles, mapTileFrames };
}

export const prewarmSystem = {
  _stagePrewarm: null,
  _prewarmIdle: null,

  /** Reuse the camp backdrop when it already matches the saved stage — avoids a second createFx pass. */
  seedBattlePrewarmFromBackdrop() {
    if (this.state !== "camp" || !this.mapFxTiles?.length) return;
    const data = loadSave();
    if (!canContinue(data)) return;
    const index = data.run.stageIndex ?? 0;
    if (this.stageIndex !== index) return;
    if (this._stagePrewarm?.index === index) return;
    this._stagePrewarm = { index, mapFxTiles: this.mapFxTiles, mapTileFrames: this.mapTileFrames };
  },

  prewarmResumeStage() {
    if (this.state !== "camp") return;
    const data = loadSave();
    const index = canContinue(data) ? (data.run.stageIndex ?? 0) : 0;
    if (this._stagePrewarm?.index === index) return;
    if (this.stageIndex === index && this.mapFxTiles?.length) {
      this._stagePrewarm = { index, mapFxTiles: this.mapFxTiles, mapTileFrames: this.mapTileFrames };
      return;
    }
    const built = buildMapTiles(index);
    if (built) this._stagePrewarm = built;
  },

  adoptStagePrewarm(index) {
    const prewarm = this._stagePrewarm;
    if (!prewarm || prewarm.index !== index) return false;
    this._stagePrewarm = null;
    this.mapFxTiles = prewarm.mapFxTiles;
    this.mapTileFrames = prewarm.mapTileFrames;
    this.mapFx = prewarm.mapFxTiles[0];
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
      this.prewarmResumeStage();
    };
    if (typeof requestIdleCallback === "function") {
      this._prewarmIdle = requestIdleCallback(run, { timeout: 1500 });
    } else {
      this._prewarmIdle = setTimeout(run, 120);
    }
  },
};
