// Pixelfx module registry: maps logical ids to effect implementations.

import * as mapMossy from "../../../pixelfx/src/fx/world/mossy-ruins.js";
import * as mapMarsh from "../../../pixelfx/src/fx/world/wisp-marsh.js";
import * as mapEmber from "../../../pixelfx/src/fx/world/ember-depths.js";
import * as mapAurora from "../../../pixelfx/src/fx/world/aurora-pass.js";
import * as mapCrystal from "../../../pixelfx/src/fx/world/crystal-hollow.js";
import * as mapInkbound from "../../../pixelfx/src/fx/world/inkbound-shrine.js";
import * as mapSunscar from "../../../pixelfx/src/fx/world/sunscar-temple.js";
import * as mapMosswood from "../../../pixelfx/src/fx/world/mosswood-ruins.js";
import * as mapStarterCamp from "../../../pixelfx/src/fx/world/starter-camp.js";
import * as mapHearthTown from "../../../pixelfx/src/fx/world/hearth-town.js";

import * as slime from "../../../pixelfx/src/fx/critters/slime.js";
import * as snake from "../../../pixelfx/src/fx/critters/snake.js";
import * as frog from "../../../pixelfx/src/fx/critters/frog.js";
import * as bat from "../../../pixelfx/src/fx/critters/bat.js";
import * as wisp from "../../../pixelfx/src/fx/critters/wisp.js";
import * as ghost from "../../../pixelfx/src/fx/critters/ghost.js";
import * as eyeball from "../../../pixelfx/src/fx/critters/eyeball.js";
import * as flyingSkull from "../../../pixelfx/src/fx/critters/flying-skull.js";
import * as bird from "../../../pixelfx/src/fx/critters/bird.js";
import * as butterfly from "../../../pixelfx/src/fx/critters/butterfly.js";
import * as fishSchool from "../../../pixelfx/src/fx/critters/fish-school.js";
import * as jellyfish from "../../../pixelfx/src/fx/critters/jellyfish.js";

import * as goblinAgile from "../../../pixelfx/src/fx/mobs/goblin-agile.js";
import * as goblinArcher from "../../../pixelfx/src/fx/mobs/goblin-archer.js";
import * as goblinGiant from "../../../pixelfx/src/fx/mobs/goblin-giant.js";
import * as goblinMage from "../../../pixelfx/src/fx/mobs/goblin-mage.js";
import * as goblinWarrior from "../../../pixelfx/src/fx/mobs/goblin-warrior.js";
import * as emberImp from "../../../pixelfx/src/fx/mobs/ember-imp.js";
import * as cinderSpitter from "../../../pixelfx/src/fx/mobs/cinder-spitter.js";
import * as cinderBrute from "../../../pixelfx/src/fx/mobs/cinder-brute.js";

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
import * as shieldBlock from "../../../pixelfx/src/fx/impacts/shield-block.js";
import * as critHit from "../../../pixelfx/src/fx/impacts/crit-hit.js";
import * as goblinHit from "../../../pixelfx/src/fx/impacts/goblin-hit.js";
import * as smallExplosion from "../../../pixelfx/src/fx/explosions/small-explosion.js";
import * as poof from "../../../pixelfx/src/fx/spawn/poof.js";
import * as shatterDeath from "../../../pixelfx/src/fx/spawn/shatter-death.js";
import * as goblinDeath from "../../../pixelfx/src/fx/spawn/goblin-death.js";
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
import * as magicMissile from "../../../pixelfx/src/fx/projectiles/magic-missile.js";
import * as laserBolt from "../../../pixelfx/src/fx/projectiles/laser-bolt.js";
import * as energyDisc from "../../../pixelfx/src/fx/projectiles/energy-disc.js";
import * as arrow from "../../../pixelfx/src/fx/projectiles/arrow.js";
import * as flare from "../../../pixelfx/src/fx/projectiles/flare.js";
import * as holyResurrection from "../../../pixelfx/src/fx/holy/resurrection.js";
import * as shadowTendrils from "../../../pixelfx/src/fx/shadow/shadow-tendrils.js";
import * as gemSpin from "../../../pixelfx/src/fx/pickups/gem-spin.js";
import * as elixirGourd from "../../../pixelfx/src/fx/pickups/elixir-gourd.js";
import * as spiritStone from "../../../pixelfx/src/fx/pickups/spirit-stone.js";
import * as stagePortal from "../fx/stage-portal.js";

export const FX = {
  swordSlash, doubleSlash, heavyCleave, scytheReap, fireball, meteor, frostNova,
  lightningStrike, thunderclap, healAoe, blessing, divineShield,
  hitSpark, shieldBlock, critHit, goblinHit, smallExplosion, poof, shatterDeath, goblinDeath, spawnPortal, levelUp,
  runeCircle, manaBurst, frozen, burning, stunned, plasmaShot,
  heartPickup, potionPickup, xpOrb, collectBurst,
  magicMissile, laserBolt, energyDisc, arrow, flare,
  holyResurrection, shadowTendrils,
  gemSpin, elixirGourd, spiritStone,
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
  mapMosswood,
  mapStarterCamp,
  mapHearthTown,
};

export const CRITTER_MODS = {
  slime, snake, frog, bat, wisp, ghost, eyeball, flyingSkull,
  bird, butterfly, fishSchool, jellyfish,
};

export const MOB_MODS = {
  goblinAgile,
  goblinArcher,
  goblinGiant,
  goblinMage,
  goblinWarrior,
  emberImp,
  cinderSpitter,
  cinderBrute,
};

export const PICKUP_MODS = { heartPickup, potionPickup, xpOrb, poof, shatterDeath, gemSpin, elixirGourd, spiritStone };
