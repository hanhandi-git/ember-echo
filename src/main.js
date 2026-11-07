// Boot, keyboard/pointer input, and the loop. Touch controls and settings are separate DOM layers.

import { boot } from "./game.js";
import { castSkill } from "./skills.js";
import { createSettingsUI } from "./settings-ui.js";
import { createTouchControls } from "./touch-controls.js";

const game = boot();
game.domUi = createSettingsUI(game);
game.touchUi = createTouchControls(game);
const canvas = document.querySelector("#game");

const MOVE = new Set(["w", "a", "s", "d"]);
const SKILL_SLOT = { j: 0, k: 1, l: 2, u: 3, i: 4, o: 5 };

function unlock() { game.audio.unlock(); }

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) {
    game.keys.add(key);
    e.preventDefault();
    return;
  }
  if (game.state === "inventory" && (game.domUi?.handleKey(key) || game.ui.handleInventoryKey(key))) {
    e.preventDefault();
    unlock();
    game.domUi?.render();
    return;
  }
  if (key === "tab") {
    e.preventDefault();
    unlock();
    if (game.state === "playing" || game.state === "inventory") game.toggleInventory();
    return;
  }
  if (key === "escape") {
    e.preventDefault();
    unlock();
    if (game.state === "inventory") game.toggleInventory();
    else if (game.state === "playing" || game.state === "paused") {
      game.togglePause();
      game.audio.play("ui");
    }
    return;
  }
  if ((key === "q" || key === "shift") && !e.repeat) {
    e.preventDefault();
    unlock();
    if (game.state === "playing") game.hero.tryDash(game);
    return;
  }
  if (key === " " && !e.repeat) {
    e.preventDefault();
    unlock();
    if (game.state === "playing") game.hero.tryQuickMove(game);
    return;
  }
  if (key === "enter") {
    e.preventDefault();
    unlock();
    if (game.state === "title" || game.state === "gameover" || game.state === "victory") game.startRun();
    else if (game.state === "paused") game.togglePause();
    return;
  }
  if (key === "r" && (game.state === "paused" || game.state === "gameover" || game.state === "victory")) {
    e.preventDefault();
    unlock();
    game.startRun();
    return;
  }
  if (key === "m") {
    e.preventDefault();
    unlock();
    game.toggleMute();
    game.audio.play("ui");
    return;
  }
  if (key === "p") {
    e.preventDefault();
    unlock();
    if (game.state === "playing" || game.state === "paused") {
      game.togglePause();
      game.audio.play("ui");
    }
    return;
  }
  if (SKILL_SLOT[key] != null && !e.repeat) {
    e.preventDefault();
    unlock();
    if (game.state === "title") return;
    const id = game.hero.skillSlots[SKILL_SLOT[key]];
    castSkill(game, id);
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) game.keys.delete(key);
});
window.addEventListener("blur", () => game.keys.clear());

// clicking anywhere on the canvas does the same thing as ENTER / ESC, so the demo is usable with a mouse
canvas.addEventListener("click", (e) => {
  unlock();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * 320 / rect.width;
  const y = (e.clientY - rect.top) * canvas.height / rect.height;
  if (game.state === "inventory" || game.state === "playing" || game.state === "paused") {
    if (game.handlePointer(x, y)) return;
  }
  if (game.state === "title" || game.state === "gameover" || game.state === "victory") game.startRun();
  else if (game.state === "paused") game.togglePause();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing") game.togglePause();
});

// a debug handle for smoke tests and curious players
game.cast = (id) => castSkill(game, id);
game.begin = () => game.startRun();
window.__EMBER__ = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  game.ui.update(dt);
  game.tick(dt);
  game.touchUi?.sync();
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
game.render();
