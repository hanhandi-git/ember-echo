import * as mapEmberCamp from "../../../pixelfx/src/fx/world/ember-camp.js";
import * as mapEmberTown from "../../../pixelfx/src/fx/world/ember-town.js";
import * as mapMossy from "../../../pixelfx/src/fx/world/mossy-ruins.js";
import * as mapMarsh from "../../../pixelfx/src/fx/world/wisp-marsh.js";
import * as mapAurora from "../../../pixelfx/src/fx/world/aurora-pass.js";
import * as mapSunscar from "../../../pixelfx/src/fx/world/sunscar-temple.js";

export const HUB_TILE_W = 320;
export const HUB_WORLD_W = HUB_TILE_W * 6;

export const HUB_MAPS = [
  { id: "ember-camp", module: mapEmberCamp },
  { id: "ember-town", module: mapEmberTown },
  { id: "mossy-ruins", module: mapMossy },
  { id: "wisp-marsh", module: mapMarsh },
  { id: "aurora-pass", module: mapAurora },
  { id: "sunscar-temple", module: mapSunscar },
];

/** World-space spawns on the stitched hub strip (tile i starts at i * HUB_TILE_W). */
export const HUB_SPAWNS = {
  camp: mapEmberCamp.map.spawns.hero,
  town: [mapEmberTown.map.spawns.hero[0] + HUB_TILE_W, mapEmberTown.map.spawns.hero[1]],
  arena: [mapMossy.map.spawns.hero[0] + HUB_TILE_W * 2, mapMossy.map.spawns.hero[1]],
  marsh: [mapMarsh.map.spawns.hero[0] + HUB_TILE_W * 3, mapMarsh.map.spawns.hero[1]],
  peak: [mapAurora.map.spawns.hero[0] + HUB_TILE_W * 4, mapAurora.map.spawns.hero[1]],
  temple: [mapSunscar.map.spawns.hero[0] + HUB_TILE_W * 5, mapSunscar.map.spawns.hero[1]],
};

/** Straw dummy on the mossy arena tile, aligned with the stage boss anchor. */
export const HUB_ARENA_DUMMY = [
  HUB_TILE_W * 2 + mapMossy.map.spawns.boss[0],
  mapMossy.map.spawns.boss[1],
];

/** Adventure gate aligned with the rune portal art in ember-camp. */
export const HUB_ADVENTURE_GATE = { x: 278, y: 148, r: 20 };
