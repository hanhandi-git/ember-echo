import { STASH_ITEMS } from "../../content/stash-catalog.js";
import { HUB_SPAWNS } from "../../content/hub-worlds.js";
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
    if (!opts.uiClosed) this.domUi?.close?.();
    this.keys.clear();
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

  /** Save the run and return to the camp hub from battle (pause, bag, or end screens). */
  retreatToCamp() {
    if (!["playing", "paused", "inventory"].includes(this.state) || !this.hero.alive) return;
    this.keys.clear();
    if (this.state === "playing") this.togglePause();
    if (this.state === "inventory") this.domUi?.close?.();
    this.persistSave?.();
    const enter = () => this.enterCamp({ synced: true });
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(enter);
    else enter();
  },

  /** Leave the fight (defeat/victory) and open the camp hub. */
  enterCamp(opts = {}) {
    if (!opts.synced) this.persistSave?.();
    this.keys.clear();
    this.loadHub?.();
    this.hero.reset();
    applyHeroProfile(this.hero, loadSave()?.profile);
    this.hero.spawn(HUB_SPAWNS.camp[0], HUB_SPAWNS.camp[1]);
    this.kills = 0;
    this.runTime = 0;
    this.domUi?.openCamp?.();
    this.scheduleCampPrewarm?.();
  },

  /** Primary camp action: resume a saved expedition when one exists. */
  enterBattle() {
    if (this.state !== "camp" || !this.hubActive) return;
    this.domUi?.close?.();
    const begin = () => this.startRun({ uiClosed: true });
    const frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => fn();
    frame(() => frame(begin));
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
