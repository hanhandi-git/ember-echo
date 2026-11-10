import { castSkill, SKILLS } from "../../skills.js";
import { combatDistance as size } from "../../combat-scale.js";

const AUTO_CAST_GAP = 0.22;
const LOOT_CHASE = 200;
const MELEE_CAST = size(58);
const SPELL_CAST = size(150);

function norm(dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function livingEnemies(g) {
  return g.enemies.filter((e) => !e.dead && e.hp > 0);
}

function nearestEnemy(g) {
  const h = g.hero;
  let best = null, bd = Infinity;
  for (const e of livingEnemies(g)) {
    const d = Math.hypot(e.x - h.x, (e.y - h.y) * 1.35);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function nearestPickup(g) {
  const h = g.hero;
  let best = null, bd = Infinity;
  for (const p of g.pickups) {
    if (p.dead) continue;
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

function wantsLoot(h, p) {
  if (!p) return false;
  if (p.kind === "heart" && h.hp < h.maxHp * 0.92) return true;
  if (p.kind === "potion" && h.mp < h.maxMp * 0.88) return true;
  if (p.kind === "xp") return true;
  return h.hp < h.maxHp * 0.65 || h.mp < h.maxMp * 0.5;
}

function tryAutoCast(g, dist) {
  const h = g.hero;
  g._autoCastCd = Math.max(0, (g._autoCastCd ?? 0) - (g._autoDt ?? 0));
  if (h.actPose || h.actionBusy || g.hitStop > 0) return;
  if (g._autoCastCd > 0) return;

  const primary = h.classId === "mage" ? "mage:bolt" : "j";
  if (dist < (h.classId === "mage" ? SPELL_CAST : MELEE_CAST)) {
    if (castSkill(g, primary)) {
      g._autoCastCd = AUTO_CAST_GAP;
      return;
    }
  }
  if (dist > SPELL_CAST) return;

  const slots = h.skillSlots.filter((id) => id && id !== "t");
  const start = g._autoSkillCursor ?? 0;
  for (let n = 0; n < slots.length; n++) {
    const id = slots[(start + n) % slots.length];
    if (id === primary) continue;
    if (h.cd[id] > 0) continue;
    const sk = SKILLS.find((s) => s.id === id);
    const cost = sk?.cost ?? 8;
    if (h.mp < cost) continue;
    if (castSkill(g, id)) {
      g._autoSkillCursor = (start + n + 1) % slots.length;
      g._autoCastCd = AUTO_CAST_GAP + 0.08;
      return;
    }
  }
}

export const autoSystem = {
  autoBattle: false,
  autoLoot: false,
  autoMove: { x: 0, y: 0 },

  setAutoBattle(on) {
    this.autoBattle = !!on;
    this.persistSave?.();
  },

  setAutoLoot(on) {
    this.autoLoot = !!on;
    this.persistSave?.();
  },

  toggleAutoBattle() {
    this.setAutoBattle(!this.autoBattle);
    return this.autoBattle;
  },

  toggleAutoLoot() {
    this.setAutoLoot(!this.autoLoot);
    return this.autoLoot;
  },

  updateAuto(dt) {
    this.autoMove = { x: 0, y: 0 };
    this._autoDt = dt;
    if (!this.autoBattle && !this.autoLoot) return;
    if (this.state !== "playing" || this.phase === "travel" || !this.hero.alive) return;

    const h = this.hero;
    const enemy = this.autoBattle ? nearestEnemy(this) : null;
    const pickup = this.autoLoot ? nearestPickup(this) : null;
    const chaseLoot = pickup && wantsLoot(h, pickup) && Math.hypot(pickup.x - h.x, pickup.y - h.y) < LOOT_CHASE;

    let tx = h.x;
    let ty = h.y;

    if (this.autoBattle && this.phase === "clear" && this.portal) {
      tx = this.portal.x;
      ty = this.portal.y;
    } else if (chaseLoot) {
      tx = pickup.x;
      ty = pickup.y;
    } else if (enemy) {
      const standOff = h.classId === "mage" ? size(95) : 0;
      tx = enemy.x - Math.sign(enemy.x - h.x || h.facing) * standOff;
      ty = enemy.y;
    } else if (pickup && this.autoLoot) {
      tx = pickup.x;
      ty = pickup.y;
    }

    const dx = tx - h.x;
    const dy = ty - h.y;
    if (Math.hypot(dx, dy) > 6) {
      const v = norm(dx, dy * 0.85);
      this.autoMove = v;
    }

    if (this.autoBattle && this.phase === "fight" && enemy) {
      const dist = Math.hypot(enemy.x - h.x, (enemy.y - h.y) * 1.35);
      tryAutoCast(this, dist);
    }
  },
};
