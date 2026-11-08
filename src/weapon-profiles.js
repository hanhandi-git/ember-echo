// Physical geometry and contact policy, in the same local units as pixelfx's weapon rig.
// 'pierce' is a finite number of targets; 'return' starts the return leg on contact.
const blade = (length, extra = {}) => ({ kind: "arc", length, radius: 2.5, windup: 0.08, duration: 0.2, recovery: 0.14, response: "stop", maxHits: 1, ...extra });
const shot = (length, extra = {}) => ({ kind: "projectile", length, radius: 2, windup: 0.16, speed: 210, range: 240, response: "stop", maxHits: 1, ...extra });
export const WEAPON_PROFILES = {
  sword: blade(28),
  scythe: blade(46, { response: "cleave", maxHits: 5, duration: 0.3, startAngle: -2.5, endAngle: 0.8 }),
  claw: blade(10, { windup: 0.035, duration: 0.12, radius: 4 }),
  dagger: blade(14, { kind: "thrust", windup: 0.035, duration: 0.12, radius: 2 }),
  staff: blade(34, { response: "cleave", maxHits: 4, duration: 0.26, radius: 3 }),
  spear: blade(47, { kind: "thrust", response: "pierce", maxHits: 2, duration: 0.18, radius: 2 }),
  lance: blade(62, { kind: "thrust", response: "pierce", maxHits: 3, windup: 0.15, duration: 0.22 }),
  "holy-sword": blade(40, { response: "cleave", maxHits: 3, windup: 0.12, duration: 0.25 }),
  katana: blade(36, { windup: 0.12, duration: 0.1, response: "pierce", maxHits: 2 }),
  kusanagi: blade(36, { response: "cleave", maxHits: 3, status: "stun", statusTime: 0.35 }),
  totsuka: blade(44, { response: "cleave", maxHits: 3, windup: 0.14, duration: 0.28 }),
  "war-mace": blade(35, { kind: "slam", radius: 7, windup: 0.2, duration: 0.25 }),
  rapier: blade(38, { kind: "thrust", duration: 0.14, radius: 1.5 }),
  "ember-greatsword": blade(84, { kind: "arc", radius: 6, windup: 0.2, duration: 0.3, recovery: 0.24, response: "cleave", maxHits: 4 }),
  "frost-lightsword": blade(70, { kind: "arc", radius: 3, windup: 0.06, duration: 0.16, recovery: 0.1, response: "stop" }),
  "shadow-katana": blade(64, { kind: "arc", radius: 2.5, windup: 0.045, duration: 0.11, recovery: 0.12, response: "pierce", maxHits: 2 }),
  "thunder-claymore": blade(78, { kind: "arc", radius: 5, windup: 0.14, duration: 0.24, recovery: 0.18, response: "cleave", maxHits: 3 }),
  "starlight-rapier": blade(76, { kind: "thrust", radius: 2, windup: 0.04, duration: 0.1, recovery: 0.1, response: "pierce", maxHits: 3 }),
  kunai: shot(18, { speed: 300, range: 260 }),
  "powder-bomb": shot(15, { speed: 150, range: 180, radius: 5, lob: 34, response: "explode", blastRadius: 30 }),
  boomerang: shot(19, { speed: 185, range: 165, radius: 5, response: "return", returnSpeed: 240 }),
  talisman: shot(17, { speed: 180, response: "explode", blastRadius: 21, status: "burn", statusTime: 2 }),
  "flying-sword": shot(17, { speed: 255, response: "pierce", maxHits: 3 }),
  "binding-silk": shot(9, { speed: 180, radius: 4, range: 170, status: "freeze", statusTime: 1.1 }),
  "soul-bell": shot(10, { speed: 160, range: 150, response: "return", returnSpeed: 220, radius: 5, status: "stun", statusTime: 0.6 }),
  "pear-needles": shot(13, { speed: 340, radius: 1.5, response: "pierce", maxHits: 3, range: 210 }),
};

export function weaponProfile(id) {
  return { ...(WEAPON_PROFILES[id] ?? WEAPON_PROFILES.sword) };
}
