/** Attach focused subsystems to Game.prototype (mixin composition). */
export function mixin(Game, ...parts) {
  for (const block of parts) Object.assign(Game.prototype, block);
}
