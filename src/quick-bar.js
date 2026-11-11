// The three-command quick bar shared by touch buttons, keyboard keys and the HUD console.
// Guard and the Chidori rush are cross-class here; the bag loadout still filters by class.

export const QUICK_GUARD = "sword:guard";
export const QUICK_RUSH = "fx:ninjutsu/chidori-rush";
export const QUICK_KEYS = ["j", "k", "l"];
export const QUICK_HUD_KEYS = ["J", "K", "L"];

export function quickAttackId(classId) {
  return classId === "mage" ? "mage:bolt" : "j";
}

export function quickSkills(classId) {
  return [quickAttackId(classId), QUICK_GUARD, QUICK_RUSH];
}

/** Hub zones where the quick bar may cast: the camp tile, the town beside it, and the arena. */
export const HUB_SKILL_ZONES = new Set(["camp", "town", "arena"]);

export function hubSkillsAllowed(g) {
  return g.state === "camp" && g.hubActive && HUB_SKILL_ZONES.has(g.hubZone)
    && !g.campMenuOpen && !g._hubDepartPending;
}
