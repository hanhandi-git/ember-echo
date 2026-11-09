import { castSkill } from "../skills.js";
import { uiCopy } from "../copy.js";
import { MOVE_KEYS, SKILL_SLOT_KEYS } from "./bindings.js";

/**
 * Registers keyboard listeners. Input is routed through small handlers so main.js
 * stays a thin bootstrap.
 */
export function installKeyboard(game) {
  const unlock = () => game.audio.unlock();

  const handleInventoryKey = (key) =>
    (game.state === "inventory" || game.state === "camp")
    && (game.domUi?.handleKey(key) || game.ui.handleInventoryKey(key));

  const handleTab = () => {
    if (game.state === "playing" || game.state === "inventory") game.toggleInventory();
  };

  const handleEscape = () => {
    if (game.state === "inventory") game.toggleInventory();
    else if (game.state === "playing" || game.state === "paused") {
      game.togglePause();
      game.audio.play("ui");
    }
  };

  const handleDash = () => {
    if (game.state === "playing") game.hero.tryDash(game);
  };

  const handleQuickMove = () => {
    if (game.state === "playing") game.hero.tryQuickMove(game);
  };

  const handleConfirm = () => {
    if (game.state === "camp" && game.hubActive) game.tryHubDepart?.();
    else if (game.state === "gameover" || game.state === "victory") game.enterCamp();
    else if (game.state === "paused") game.togglePause();
  };

  const handleRestart = () => {
    game.startRun({ fresh: true });
  };

  const handleMute = () => {
    game.toggleMute();
    game.audio.play("ui");
    game.domUi?.refreshAudio?.();
  };

  const handlePauseKey = () => {
    game.togglePause();
    game.audio.play("ui");
  };

  const castSlotKey = (key) => {
    if (game.state === "camp") return;
    const id = game.hero.skillSlots[SKILL_SLOT_KEYS[key]];
    castSkill(game, id);
  };

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (MOVE_KEYS.has(key)) {
      if (!game.campMenuOpen && !game._hubDepartPending) game.keys.add(key);
      e.preventDefault();
      return;
    }
    if (handleInventoryKey(key)) {
      e.preventDefault();
      unlock();
      game.domUi?.render();
      return;
    }
    if (key === "tab") {
      e.preventDefault();
      unlock();
      handleTab();
      return;
    }
    if (key === "escape") {
      e.preventDefault();
      unlock();
      handleEscape();
      return;
    }
    if ((key === "q" || key === "shift") && !e.repeat) {
      e.preventDefault();
      unlock();
      handleDash();
      return;
    }
    if (key === " " && !e.repeat) {
      // Let a focused menu button receive Space as its native activation.
      if (e.target?.closest?.("button, a, input, select, textarea")) return;
      e.preventDefault();
      unlock();
      handleQuickMove();
      return;
    }
    if (key === "enter") {
      // Focused buttons handle Enter natively (equip, upgrade, enter); don't double-fire.
      if (e.target?.closest?.("button, a, input, select, textarea")) return;
      e.preventDefault();
      unlock();
      handleConfirm();
      return;
    }
    if (key === "r" && (game.state === "paused" || game.state === "gameover" || game.state === "victory")) {
      e.preventDefault();
      unlock();
      handleRestart();
      return;
    }
    if (key === "f" && game.state === "playing") {
      e.preventDefault();
      unlock();
      const on = !(game.autoBattle || game.autoLoot);
      game.setAutoBattle?.(on);
      game.setAutoLoot?.(on);
      const c = uiCopy(game);
      game.ui.toast(on ? `${c.autoOn} · ${c.autoBattle}` : c.autoOn, "gold");
      return;
    }
    if (key === "m") {
      e.preventDefault();
      unlock();
      handleMute();
      return;
    }
    if (key === "p") {
      e.preventDefault();
      unlock();
      if (game.state === "playing" || game.state === "paused") handlePauseKey();
      return;
    }
    if (key === "c" && !e.repeat && (game.state === "paused" || game.state === "inventory")) {
      e.preventDefault();
      unlock();
      game.retreatToCamp?.();
      return;
    }
    if (SKILL_SLOT_KEYS[key] != null && !e.repeat) {
      e.preventDefault();
      unlock();
      if (game.state === "playing") game.keys.add(key);
      castSlotKey(key);
    }
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    game.keys.delete(key);
  });
  window.addEventListener("blur", () => { game.keys.clear(); game.hero.attackBuffer = 0; });
}
