// A wider game-speed variant of pixelfx's katana draw: a low hip turn and a steel-blue crescent.
import { weaponAttack } from "../../../pixelfx/src/fx/melee/_weapons.js";

const attack = weaponAttack({
  weapon: "katana", name: "Ember draw cut", two: false, windup: 0.28, hits: [2 / 30], width: 9, seed: 35,
  desc: "A low draw accelerates into a broad steel-blue crescent, with a short cutting line and cooling flecks.",
  palette: ["#171c35", "#2d3e65", "#4a6c9f", "#73a8d6", "#b4dfff", "#e9f8ff", "#ffffff"],
});

export const { meta, act, draw, drawBack } = attack;
