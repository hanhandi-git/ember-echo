// Boot, input layers, and the animation loop.

import { boot } from "./game.js";
import { castSkill } from "./skills.js";
import { createSettingsUI } from "./settings-ui.js";
import { createTouchControls } from "./touch-controls.js";
import { installGameViewport } from "./viewport.js";
import { installKeyboard } from "./input/keyboard.js";
import { installPointer, installVisibilityPause } from "./input/pointer.js";

installGameViewport(document.querySelector("#stage"));

const game = boot();
// Unlock/resume WebAudio on interaction (first init + recover from suspended after tab switch).
const unlockAudio = () => game.audio.unlock();
window.addEventListener("pointerdown", unlockAudio, { capture: true });
window.addEventListener("keydown", unlockAudio, { capture: true });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) game.audio.unlock();
});
game.domUi = createSettingsUI(game);
game.touchUi = createTouchControls(game);
game.domUi.openCamp?.();
game.scheduleCampPrewarm?.();
const canvas = document.querySelector("#game");

installKeyboard(game);
installPointer(game, canvas);
installVisibilityPause(game);

game.cast = (id) => castSkill(game, id);
game.begin = () => game.enterBattle();
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
