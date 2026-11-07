/** Melee vs thrown loadout helpers. */

export function isThrownWeapon(weapon) {
  return weapon?.class === "thrown";
}

export function isMeleeWeapon(weapon) {
  return weapon != null && !isThrownWeapon(weapon);
}

export function weaponEquipKind(weapon) {
  return isThrownWeapon(weapon) ? "thrown" : "melee";
}
