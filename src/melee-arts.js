// Adapt pixelfx's authored poses and VFX to the game's short, cancelable attack beats.
// Damage still belongs to castJ; an effect's preview hit-stop/targets never enter the game.
import { effects } from "../../pixelfx/src/fx/index.js";
import { poseAt, READY, clamp } from "../../pixelfx/src/core/index.js";
import { weaponAttack } from "../../pixelfx/src/fx/melee/_weapons.js";
import { CUSTOM_MELEE_FX } from "./fx/custom-melee-arts.js";
import * as emberDraw from "./fx/ember-draw.js";

const EMBER = ["#251227", "#54223c", "#a14348", "#e77943", "#ffbd63", "#fff0bb", "#ffffff"];
const MOON = ["#101326", "#29244b", "#514179", "#8070bc", "#bbabf0", "#ece5ff", "#ffffff"];
const JADE = ["#081d22", "#163e44", "#2c6870", "#4ba69c", "#89ddbf", "#dcffee", "#ffffff"];
const STEEL = ["#171c35", "#2d3e65", "#4a6c9f", "#73a8d6", "#b4dfff", "#e9f8ff", "#ffffff"];

const art = (id, contact, extra = {}) => ({ id: `melee/${id}`, module: effects[`melee/${id}`], contact, ...extra });
const singleStaff = weaponAttack({ weapon: "staff", name: "Staff opening sweep", windup: 0.25,
  hits: [4 / 30], width: 5, seed: 32, palette: JADE });

const STRINGS = {
  blade: [{ id: "game/ember-draw", module: emberDraw, contact: 2 / 30 }, art("double-slash", 0.2), art("spin-slash", 0.17, { spin: true, palette: EMBER })],
  katana: [art("katana-draw", 2 / 30), art("double-slash", 0.2, { palette: MOON }), art("spin-slash", 0.17, { spin: true, palette: MOON })],
  scythe: [art("scythe-reap", 0.42, { from: -0.16 }), art("spear-sweep", 0.1, { palette: MOON }), art("spin-slash", 0.17, { spin: true, palette: JADE })],
  staff: [{ id: "melee/staff-combo", module: singleStaff, contact: 4 / 30, palette: JADE }, art("spear-sweep", 0.1, { palette: JADE }), art("spin-slash", 0.17, { spin: true, palette: JADE })],
  thrust: [art("rapier-lunge", 2 / 30, { palette: STEEL }), art("lance-thrust", 0.1, { palette: STEEL }), art("thrust", 0.07, { palette: EMBER })],
  claw: [art("claw-swipe", 0.12), art("dagger-flurry", 0.425, { palette: MOON }), art("spin-slash", 0.17, { spin: true, palette: EMBER })],
  slam: [art("mace-crush", 0.2), art("heavy-cleave", 0.335), art("hammer-smash", 0.15)],
  holy: [art("sword-slash", 0.06, { palette: EMBER }), art("double-slash", 0.2, { palette: EMBER }), art("holy-sword-cleave", 5 / 30)],
};

const customArt = (id, contact) => ({ id: `custom/${id}`, module: CUSTOM_MELEE_FX[id], contact });
const CUSTOM_STRINGS = {
  "ember-greatsword": [customArt("ember-greatsword", 0.2), customArt("ember-greatsword", 0.28), customArt("ember-greatsword", 0.17)],
  "frost-lightsword": [customArt("frost-lightsword", 0.08), customArt("frost-lightsword", 0.16), customArt("frost-lightsword", 0.2)],
  "shadow-katana": [customArt("shadow-katana", 0.05), customArt("shadow-katana", 0.11), customArt("shadow-katana", 0.15)],
  "thunder-claymore": [customArt("thunder-claymore", 0.12), customArt("thunder-claymore", 0.19), customArt("thunder-claymore", 0.24)],
  "starlight-rapier": [customArt("starlight-rapier", 0.05), customArt("starlight-rapier", 0.1), customArt("starlight-rapier", 0.13)],
};

export function meleeFamily(weapon) {
  const id = weapon?.rigWeapon;
  if (weapon?.meleeArtKey === "ember-greatsword") return "slam";
  if (weapon?.meleeArtKey === "frost-lightsword") return "holy";
  if (weapon?.meleeArtKey === "shadow-katana") return "katana";
  if (weapon?.meleeArtKey === "thunder-claymore") return "slam";
  if (weapon?.meleeArtKey === "starlight-rapier") return "thrust";
  if (id === "scythe") return "scythe";
  if (id === "staff") return "staff";
  if (id === "claw") return "claw";
  if (id === "katana" || id === "kusanagi" || id === "totsuka") return "katana";
  if (id === "holy-sword") return "holy";
  if (weapon?.family === "slam" || id === "war-mace" || id === "hammer") return "slam";
  if (weapon?.family === "thrust") return "thrust";
  return "blade";
}

export function meleeArt(weapon, combo, dash = false) {
  const family = meleeFamily(weapon);
  const custom = CUSTOM_STRINGS[weapon?.meleeArtKey]?.[combo];
  const source = custom ?? (dash && family !== "slam" && family !== "scythe" && family !== "claw"
    ? art("rapier-lunge", 2 / 30, { palette: family === "staff" ? JADE : EMBER }) : STRINGS[family][combo]);
  return { ...source, family, from: source.from ?? -0.12, palette: source.palette ?? source.module.meta.options.palette,
    echo: family === "scythe" || family === "staff" ? "#a8efd5" : combo === 2 ? "#ffc87c" : "#b8cfff" };
}

/** One clock for the pose, smear and contact; preserve a short follow-through before recovery. */
export function meleeSourceTime(art, beat, time) {
  if (time <= beat.hit) return art.from + (art.contact - art.from) * clamp(time / beat.hit, 0, 1);
  const releaseEnd = Math.min(art.module.meta.duration, art.contact + 0.25);
  const hold = Math.min(0.075, (beat.duration - beat.hit) * 0.45);
  if (time <= beat.hit + hold) return art.contact + (releaseEnd - art.contact) * ((time - beat.hit) / hold);
  const end = beat.duration + 0.09;
  return releaseEnd + (art.module.meta.duration - releaseEnd) * clamp((time - beat.hit - hold) / (end - beat.hit - hold), 0, 1);
}

/** Map the library's contact pose to the short combo beat, then add a clear torso turn. */
export function meleePoseTrack(art, beat, weapon, combo) {
  const key = `${art.id}:${art.family}:${weapon.rigWeapon}:${combo}:${beat.duration}`;
  if (poseTracks.has(key)) return poseTracks.get(key);
  const source = art.module.act.poses;
  const keyTimes = new Set([0, beat.hit, beat.duration]);
  // Frequent explicit drawings preserve spins even though poseAt normally holds limbs at 12 fps.
  for (let time = 0.025; time < beat.duration; time += 0.025) keyTimes.add(time);
  const track = [...keyTimes].sort((a, b) => a - b).map((time) => {
    if (time === beat.duration) return [time, { ...READY, weapon: weapon.rigWeapon }, "snap"];
    const sourceTime = meleeSourceTime(art, beat, time);
    const base = poseAt(source, sourceTime + 1e-7);
    const phase = Math.min(1, time / beat.hit);
    const recover = clamp((time - beat.hit - 0.035) / Math.max(0.01, beat.duration - beat.hit - 0.035), 0, 1);
    const turn = art.spin ? base.yaw ?? 0 : (phase < 0.65 ? -0.5 : combo === 1 ? -0.75 : 0.5) * (1 - recover);
    const pose = {
      ...base, weapon: weapon.rigWeapon,
      x: clamp(base.x ?? 0, -7, 8) * 0.7,
      yaw: turn,
      lean: (base.lean ?? 0) + (phase > 0.65 ? 1.5 : -1),
      ffx: Math.max(9, base.ffx ?? 9), fbx: Math.min(-8, base.fbx ?? -8),
      ghost: phase >= 0.45 && recover < 0.55 ? 1 : 0,
    };
    if (["staff", "scythe", "slam"].includes(art.family) || ["spear", "lance"].includes(weapon.rigWeapon)) pose.two = true;
    if (art.family !== "claw") { delete pose.offWeapon; delete pose.sb; }
    return [time, pose, "snap"];
  });
  poseTracks.set(key, track);
  return track;
}

const poseTracks = new Map();
