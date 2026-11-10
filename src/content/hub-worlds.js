import * as mapStarterCamp from "../../../pixelfx/src/fx/world/starter-camp.js";
import * as mapHearthTown from "../../../pixelfx/src/fx/world/hearth-town.js";
import * as mapMossy from "../../../pixelfx/src/fx/world/mossy-ruins.js";

export const HUB_TILE_W = 320;
export const HUB_WORLD_W = HUB_TILE_W * 3;

export const HUB_MAPS = [
  { id: "starter-camp", module: mapStarterCamp },
  { id: "hearth-town", module: mapHearthTown },
  { id: "training-arena", module: mapMossy },
];

/** World-space spawns on the stitched hub strip (camp tile 0, town tile +320). */
export const HUB_SPAWNS = {
  camp: mapStarterCamp.map.spawns.hero,
  town: [mapHearthTown.map.spawns.hero[0] + HUB_TILE_W, mapHearthTown.map.spawns.hero[1]],
  arena: [mapMossy.map.spawns.hero[0] + HUB_TILE_W * 2, mapMossy.map.spawns.hero[1]],
};

/** Straw dummy on the mossy arena tile, aligned with the stage boss anchor. */
export const HUB_ARENA_DUMMY = [
  HUB_TILE_W * 2 + mapMossy.map.spawns.boss[0],
  mapMossy.map.spawns.boss[1],
];

/** Adventure gate aligned with the rune portal art in starter-camp. */
export const HUB_ADVENTURE_GATE = { x: 278, y: 148, r: 20 };
