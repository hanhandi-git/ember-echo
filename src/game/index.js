import { mixin } from "./compose.js";
import { Game, boot } from "./core.js";
import { worldRenderSystem } from "./systems/world-render.js";
import { portalSystem } from "./systems/portal.js";
import { stageFlowSystem } from "./systems/stage-flow.js";
import { combatSystem } from "./systems/combat.js";
import { fxEntitySystem } from "./systems/fx-entities.js";
import { loopSystem } from "./systems/loop.js";
import { sceneRenderSystem } from "./systems/scene-render.js";
import { saveSystem } from "./systems/save-system.js";
import { prewarmSystem } from "./systems/prewarm-system.js";
import { autoSystem } from "./systems/auto-system.js";
import { hubSystem } from "./systems/hub-system.js";

mixin(
  Game,
  loopSystem,
  worldRenderSystem,
  portalSystem,
  stageFlowSystem,
  combatSystem,
  fxEntitySystem,
  sceneRenderSystem,
  autoSystem,
  saveSystem,
  prewarmSystem,
  hubSystem,
);

export { Game, boot };
