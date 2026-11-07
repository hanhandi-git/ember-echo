// Pixelfx module registry: maps logical ids to effect implementations.

import * as mapMossy from "../../../pixelfx/src/fx/world/mossy-ruins.js";
import * as mapMarsh from "../../../pixelfx/src/fx/world/wisp-marsh.js";
import * as mapEmber from "../../../pixelfx/src/fx/world/ember-depths.js";
import * as mapAurora from "../../../pixelfx/src/fx/world/aurora-pass.js";
import * as mapCrystal from "../../../pixelfx/src/fx/world/crystal-hollow.js";
import * as mapInkbound from "../../../pixelfx/src/fx/world/inkbound-shrine.js";
import * as mapSunscar from "../../../pixelfx/src/fx/world/sunscar-temple.js";

import * as slime from "../../../pixelfx/src/fx/critters/slime.js";
import * as snake from "../../../pixelfx/src/fx/critters/snake.js";
import * as frog from "../../../pixelfx/src/fx/critters/frog.js";
import * as bat from "../../../pixelfx/src/fx/critters/bat.js";
import * as wisp from "../../../pixelfx/src/fx/critters/wisp.js";
import * as ghost from "../../../pixelfx/src/fx/critters/ghost.js";
import * as eyeball from "../../../pixelfx/src/fx/critters/eyeball.js";
import * as flyingSkull from "../../../pixelfx/src/fx/critters/flying-skull.js";

import * as swordSlash from "../../../pixelfx/src/fx/melee/sword-slash.js";
import * as doubleSlash from "../../../pixelfx/src/fx/melee/double-slash.js";
import * as heavyCleave from "../../../pixelfx/src/fx/melee/heavy-cleave.js";
import * as scytheReap from "../../../pixelfx/src/fx/melee/scythe-reap.js";
import * as fireball from "../../../pixelfx/src/fx/fire/fireball.js";
import * as meteor from "../../../pixelfx/src/fx/fire/meteor.js";
import * as frostNova from "../../../pixelfx/src/fx/ice/frost-nova.js";
import * as lightningStrike from "../../../pixelfx/src/fx/lightning/lightning-strike.js";
import * as thunderclap from "../../../pixelfx/src/fx/lightning/thunderclap.js";
import * as healAoe from "../../../pixelfx/src/fx/holy/heal-aoe.js";
import * as blessing from "../../../pixelfx/src/fx/holy/blessing.js";
import * as divineShield from "../../../pixelfx/src/fx/holy/divine-shield.js";
import * as hitSpark from "../../../pixelfx/src/fx/impacts/hit-spark.js";
import * as critHit from "../../../pixelfx/src/fx/impacts/crit-hit.js";
import * as smallExplosion from "../../../pixelfx/src/fx/explosions/small-explosion.js";
import * as poof from "../../../pixelfx/src/fx/spawn/poof.js";
import * as shatterDeath from "../../../pixelfx/src/fx/spawn/shatter-death.js";
import * as spawnPortal from "../../../pixelfx/src/fx/spawn/spawn-portal.js";
import * as levelUp from "../../../pixelfx/src/fx/ui/level-up.js";
import * as runeCircle from "../../../pixelfx/src/fx/arcane/rune-circle.js";
import * as manaBurst from "../../../pixelfx/src/fx/arcane/mana-burst.js";
import * as frozen from "../../../pixelfx/src/fx/status/frozen.js";
import * as burning from "../../../pixelfx/src/fx/status/burning.js";
import * as stunned from "../../../pixelfx/src/fx/status/stunned.js";
import * as plasmaShot from "../../../pixelfx/src/fx/projectiles/plasma-shot.js";
import * as heartPickup from "../../../pixelfx/src/fx/pickups/heart-pickup.js";
import * as potionPickup from "../../../pixelfx/src/fx/pickups/potion.js";
import * as xpOrb from "../../../pixelfx/src/fx/pickups/xp-orb.js";
import * as collectBurst from "../../../pixelfx/src/fx/pickups/collect-burst.js";
import * as stagePortal from "../fx/stage-portal.js";

export const FX = {
  swordSlash, doubleSlash, heavyCleave, scytheReap, fireball, meteor, frostNova,
  lightningStrike, thunderclap, healAoe, blessing, divineShield,
  hitSpark, critHit, smallExplosion, poof, shatterDeath, spawnPortal, levelUp,
  runeCircle, manaBurst, frozen, burning, stunned, plasmaShot,
  heartPickup, potionPickup, xpOrb, collectBurst,
  stagePortal,
};

/** Re-export map modules for stage definitions. */
export const MAPS = {
  mapMossy,
  mapMarsh,
  mapEmber,
  mapAurora,
  mapCrystal,
  mapInkbound,
  mapSunscar,
};

export const CRITTER_MODS = {
  slime, snake, frog, bat, wisp, ghost, eyeball, flyingSkull,
};

export const PICKUP_MODS = { heartPickup, potionPickup, xpOrb, poof, shatterDeath };
