// Boot, keyboard/pointer input, and the one requestAnimationFrame loop. There is no DOM HUD:
// the whole interface is pixel art drawn into the 320 x 240 canvas.

import { boot } from "./game.js";
import { castSkill } from "./skills.js";

const game = boot();
const canvas = document.querySelector("#game");

const MOVE = new Set(["w", "a", "s", "d"]);
const SKILL = { j: "j", k: "k", l: "l", u: "u", i: "i", o: "o" };

function unlock() { game.audio.unlock(); }

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) {
    game.keys.add(key);
    e.preventDefault();
    return;
  }
  if (key === "escape") {
    e.preventDefault();
    unlock();
    if (game.state === "playing" || game.state === "paused") {
      game.togglePause();
      game.audio.play("ui");
    }
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
  if (SKILL[key] && !e.repeat) {
    e.preventDefault();
    unlock();
    if (game.state === "title") return;
    castSkill(game, SKILL[key]);
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) game.keys.delete(key);
});
window.addEventListener("blur", () => game.keys.clear());

// clicking anywhere on the canvas does the same thing as ENTER / ESC, so the demo is usable with a mouse
canvas.addEventListener("click", () => {
  unlock();
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
  game.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
game.render();
