// World map modules keyed like stages.config.json `map` field (worker bundle imports these).

import * as mapMossy from "../../../pixelfx/src/fx/world/mossy-ruins.js";
import * as mapMarsh from "../../../pixelfx/src/fx/world/wisp-marsh.js";
import * as mapEmber from "../../../pixelfx/src/fx/world/ember-depths.js";
import * as mapAurora from "../../../pixelfx/src/fx/world/aurora-pass.js";
import * as mapCrystal from "../../../pixelfx/src/fx/world/crystal-hollow.js";
import * as mapInkbound from "../../../pixelfx/src/fx/world/inkbound-shrine.js";
import * as mapSunscar from "../../../pixelfx/src/fx/world/sunscar-temple.js";
import * as mapMosswood from "../../../pixelfx/src/fx/world/mosswood-ruins.js";

export const MAP_MODULES = {
  mossy: mapMossy,
  marsh: mapMarsh,
  ember: mapEmber,
  aurora: mapAurora,
  crystal: mapCrystal,
  inkbound: mapInkbound,
  sunscar: mapSunscar,
  mosswood: mapMosswood,
};
