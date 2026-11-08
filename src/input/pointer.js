import { VIEW_W } from "./bindings.js";

/** Canvas click / resume routing (coordinates in game pixels). */
export function installPointer(game, canvas) {
  canvas.addEventListener("click", (e) => {
    game.audio.unlock();
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * VIEW_W / rect.width;
    const y = (e.clientY - rect.top) * canvas.height / rect.height;
    if (game.state === "camp") return;
    if (game.state === "inventory" || game.state === "playing" || game.state === "paused") {
      if (game.handlePointer(x, y)) return;
    }
    if (game.state === "gameover" || game.state === "victory") game.enterCamp();
    else if (game.state === "paused") game.togglePause();
  });
}

export function installVisibilityPause(game) {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (game.state === "playing") game.togglePause();
      return;
    }
    game.audio.unlock();
  });
}
