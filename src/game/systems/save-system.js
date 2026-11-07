import { STASH_ITEMS } from "../../content/stash-catalog.js";
import {
  canContinue,
  clearRunSave,
  loadSave,
  persistSave,
  resumeRun,
  applyHeroProfile,
  applyGameProfile,
} from "../../save.js";

const STASH_DROP_CHANCE = 0.1;
const AUTOSAVE_INTERVAL = 7;

export const saveSystem = {
  _saveTimer: 0,

  canContinueSave() {
    return canContinue(loadSave());
  },

  loadPersistedProfile() {
    const profile = loadSave()?.profile;
    applyHeroProfile(this.hero, profile);
    applyGameProfile(this, profile);
  },

  persistSave() {
    persistSave(this);
  },

  tryStashDrop(x, y) {
    if (Math.random() > STASH_DROP_CHANCE) return;
    const item = STASH_ITEMS[Math.floor(Math.random() * STASH_ITEMS.length)];
    this.hero.addStash(item.id, 1, this);
    this.addFx(this.fx.collectBurst, { x, y: y - 6, light: 0.6, seed: Math.floor(this.time * 97) % 999 });
  },

  startRun(opts = {}) {
    const fresh = opts === true || opts?.fresh;
    if (!fresh && resumeRun(this, loadSave())) return;
    this.audio.unlock();
    this.hero.reset();
    applyHeroProfile(this.hero, loadSave()?.profile);
    this.kills = 0;
    this.runTime = 0;
    this.loadStage(0, false);
    clearRunSave(this);
  },

  restart() {
    this.startRun({ fresh: true });
  },

  tickSave(dt) {
    if (this.state !== "playing" || !this.hero.alive) return;
    this._saveTimer += dt;
    if (this._saveTimer < AUTOSAVE_INTERVAL) return;
    this._saveTimer = 0;
    this.persistSave();
  },
};
