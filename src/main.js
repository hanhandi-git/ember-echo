// Boot, input, and the one requestAnimationFrame loop.

import { boot } from "./game.js";
import { castSkill } from "./skills.js";

const game = boot();

const MOVE = new Set(["w", "a", "s", "d"]);
const SKILL = { j: "j", k: "k", l: "l", u: "u", i: "i", o: "o" };

function unlockAndStart() {
  game.audio.unlock();
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (e.target instanceof HTMLInputElement) return;
  if (MOVE.has(key)) {
    game.keys.add(key);
    e.preventDefault();
    return;
  }
  if (key === "escape") {
    e.preventDefault();
    if (game.state === "playing" || game.state === "paused") {
      game.togglePause();
      game.audio.play("ui");
    }
    return;
  }
  if (key === "enter") {
    e.preventDefault();
    unlockAndStart();
    if (game.state === "title" || game.state === "gameover" || game.state === "victory") game.startRun();
    else if (game.state === "paused") game.togglePause();
    return;
  }
  if (key === "r" && (game.state === "paused" || game.state === "gameover" || game.state === "victory")) {
    e.preventDefault();
    unlockAndStart();
    game.restart();
    return;
  }
  if (key === "m") {
    e.preventDefault();
    game.ui.toggleMute();
    return;
  }
  if (SKILL[key] && !e.repeat) {
    e.preventDefault();
    if (game.state === "title") return;
    unlockAndStart();
    castSkill(game, SKILL[key]);
  }
});

window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) game.keys.delete(key);
});

window.addEventListener("blur", () => game.keys.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing") game.togglePause();
});

// touch pads (visible only on coarse pointers)
for (const btn of document.querySelectorAll(".tbtn")) {
  const key = btn.dataset.key;
  const press = (e) => {
    e.preventDefault();
    unlockAndStart();
    if (MOVE.has(key)) game.keys.add(key);
    else if (game.state === "playing") castSkill(game, key);
  };
  const release = (e) => {
    e.preventDefault();
    game.keys.delete(key);
  };
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
}

// a debug handle for smoke tests and curious players
game.cast = (id) => castSkill(game, id);
game.begin = () => game.startRun();
window.__EMBER__ = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  game.tick(dt);
  game.render();
  game.ui.update(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// first paint before any gesture: the title screen is composed in the constructor, so just make sure
// the canvas is not an empty buffer if the browser throttles rAF for a moment.
game.render();
