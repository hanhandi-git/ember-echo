// All times are seconds, distances are world units. These are Ember Echo tuning values,
// inspired by the readable contact/release rhythm of Hades, not measurements of that game.
export const ATTACK_BUFFER = 0.16;
export const MELEE_BEATS = [
  { hit: 0.065, duration: 0.24, damage: 11, knock: 38, lunge: 36, tier: "light" },
  { hit: 0.085, duration: 0.28, damage: 14, knock: 46, lunge: 46, tier: "medium" },
  { hit: 0.17, duration: 0.43, damage: 24, knock: 100, lunge: 66, tier: "heavy" },
];

export const IMPACTS = {
  light: { stop: 0.028, shake: 1.1, duration: 0.12, stagger: 0.15, sparks: 4, radius: 7 },
  medium: { stop: 0.038, shake: 1.6, duration: 0.15, stagger: 0.19, sparks: 5, radius: 9 },
  heavy: { stop: 0.062, shake: 2.8, duration: 0.21, stagger: 0.29, sparks: 9, radius: 15 },
  spell: { stop: 0.032, shake: 1.3, duration: 0.14, stagger: 0.12, sparks: 5, radius: 9 },
  projectile: { stop: 0.025, shake: 0.9, duration: 0.11, stagger: 0.1, sparks: 4, radius: 7 },
};

export function meleeBeat(hero, combo) {
  const beat = MELEE_BEATS[combo];
  const speed = hero.meleeWeapon?.speed ?? 64;
  const tempo = speed >= 72 ? 0.86 : speed <= 55 ? 1.13 : 1;
  return { ...beat, hit: beat.hit * tempo, duration: beat.duration * tempo };
}
