// The player's duelist. The body is drawn from the pixelfx character rig (a real little skeleton, not a
// bitmap), so walking, sword swings and spell casts all read as one person holding one sword.

import { posed, poseAt, READY, hex, clamp } from "../../pixelfx/src/core/index.js";
import {
  HERO_LOOK_DEFAULT, HERO_LOOKS, loadHeroLook, WEAPONS, DEFAULT_SKILL_SLOTS,
  DEFAULT_MELEE_WEAPON_ID, DEFAULT_THROWN_WEAPON_ID,
} from "./data.js";
import { uiCopy, weaponLabel } from "./copy.js";
import { QUICK_MOVE_AP_COST } from "./save.js";
import { stashItem, stashLabel } from "./content/stash-catalog.js";
import { weaponEquipKind } from "./weapons-util.js";
import { createMovementTrail } from "./movement-fx.js";
import { COMBAT_SCALE, HERO_RENDER_SCALE, combatDistance as size } from "./combat-scale.js";
import { UPGRADE_STATS, emptyUpgrades, spentUpgrades, upgradeById, upgradeCost } from "./upgrades.js";
import { interruptSpellActs } from "./spell-act.js";
import { meleeArt, meleePoseTrack, isSheathDrawWeapon, sheathedIdlePose, applySheathCarry } from "./melee-arts.js";
import { meleeBeat } from "./combat-feel.js";

const GUARD = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
const IDLE = { ...GUARD, fx: 10, fy: -20, bx: 7, by: -19, crouch: 1 };
const IDLE_B = { ...IDLE, crouch: 2, fx: 9, fy: -19, lean: -0.5 };
const WIND = { ...GUARD, x: -8, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
const CUT = { ...GUARD, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -10, ghost: 1 };
const DOWN = { ...GUARD, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true };
const LOW = { ...GUARD, x: 3, crouch: 6, lean: 6, fx: 22, fy: -20, sa: 0.62, bx: -8, by: -24, ffx: 13, fbx: -10, toeB: true };
const UP = { ...LOW, x: 5, crouch: 3, lean: 5, fx: 22, fy: -28, sa: 0.1, by: -18, toeB: true };
const REST = { ...GUARD, x: -4, crouch: 2 };
const OVER = { ...GUARD, x: -4, crouch: 2, lean: -2, fx: 1, fy: -42, sa: -2.45, ffx: 8, fbx: -7 };
const FLOOR = { ...GUARD, x: 0, crouch: 7, lean: 6, fx: 17, fy: -21, sa: 0.72, ffx: 11, fbx: -10, toeB: true };
const HOLD = { ...GUARD, crouch: 4, lean: 2, fx: 16, fy: -30, sa: -1.1, bx: 2, by: -20 };
const THROW = { ...GUARD, x: 2, crouch: 4, lean: 6, fx: 19, fy: -30, sa: -1.3, bx: -6, by: -24, ffx: 11, fbx: -10 };
const HEAVEN = { ...GUARD, crouch: 0, lean: -3, fx: -5, fy: -43, bx: 8, by: -43, sa: -2.0, ffx: -4, fbx: 5 };
const SLAM = { ...GUARD, crouch: 8, lean: 3, fx: -8, fy: -10, bx: 10, by: -10, sa: 0.4, ffx: -7, fbx: 8 };
const HURT = { turn: 0.9, x: -5, crouch: 4, lean: -6, fx: -6, fy: -30, bx: 5, by: -28, ffx: 6, fbx: -6, weapon: "sword", sa: 0.3 };
const DOWNED = { turn: 1.25, crouch: 12, lean: 8, fx: -9, fy: -5, bx: 4, by: -6, weapon: "sword", sa: 0.1 };

const WALK_STEP = { ...IDLE, turn: 0.22, weapon: "sword" };
const WALK = [
  [0, { ...WALK_STEP, crouch: 4, lean: 3, ffx: 11, ffy: -6, fbx: -11, fby: -7, toeB: true, fx: 10, fy: -22, bx: 7, by: -19 }],
  [0.13, { ...WALK_STEP, crouch: 2, lean: 2, ffx: 4, ffy: -9, fbx: -2, fby: -5, fx: 9, fy: -20, bx: 6, by: -18 }],
  [0.26, { ...WALK_STEP, crouch: 4, lean: 3, ffx: -11, ffy: -7, fbx: 11, fby: -6, toeF: true, fx: 10, fy: -22, bx: 7, by: -19 }],
  [0.39, { ...WALK_STEP, crouch: 2, lean: 2, ffx: -2, ffy: -5, fbx: 3, fby: -9, fx: 9, fy: -20, bx: 6, by: -18 }],
  [0.52, { ...WALK_STEP, crouch: 4, lean: 3, ffx: 11, ffy: -6, fbx: -11, fby: -7, toeB: true, fx: 10, fy: -22, bx: 7, by: -19 }],
];

const TRACKS = {
  idle: [[0, IDLE], [1.4, IDLE_B], [2.8, IDLE]],
  walk: WALK,
  attack1: [[0, WIND], [0.04, CUT, "snap"], [0.065, DOWN, "snap"], [0.11, DOWN], [0.24, GUARD]],
  attack2: [[0, LOW], [0.05, CUT, "snap"], [0.085, UP, "snap"], [0.14, { ...UP, fy: -38 }], [0.28, GUARD]],
  attack3: [[0, REST], [0.07, OVER], [0.13, { ...OVER, crouch: 3 }], [0.17, FLOOR, "snap"], [0.25, FLOOR], [0.43, GUARD]],
  castK: [[0, GUARD], [0.09, HOLD], [0.18, THROW, "snap"], [0.38, THROW], [0.55, GUARD]],
  castL: [[0, GUARD], [0.14, HEAVEN], [0.42, SLAM, "snap"], [0.7, SLAM], [1.0, GUARD]],
  castU: [[0, GUARD], [0.16, HEAVEN], [0.5, HEAVEN], [0.78, GUARD]],
  castI: [[0, GUARD], [0.18, HEAVEN], [0.55, HEAVEN], [0.95, GUARD]],
  castO: [[0, GUARD], [0.22, HEAVEN], [0.85, HEAVEN], [1.15, GUARD]],
  hurt: [[0, HURT], [0.22, HURT], [0.42, IDLE]],
  dead: [[0, DOWNED], [1.4, DOWNED]],
};

const XP_STEPS = [0, 50, 130, 250, 420, 640, 900];
const P = {
  shadow: hex("#05040a"), white: 0xffffffff,
};

export class Hero {
  constructor() {
    this.look = loadHeroLook();
    this.combatScale = COMBAT_SCALE;
    this.renderScale = HERO_RENDER_SCALE;
    this.upgrades = emptyUpgrades();
    this.embers = 0;
    this._upgradeHp = 0;
    this._upgradeMp = 0;
    this.reset();
  }

  reset() {
    this.x = 54;
    this.y = 150;
    this.facing = 1;
    this.vx = 0;
    this.vy = 0;
    this.level = 1;
    this.maxHp = 110;
    this.hp = 110;
    this.maxMp = 70;
    this.mp = 70;
    this.maxAp = 100;
    this.ap = 100;
    this.apRegen = 22;
    this.stash = { ...(this.stash ?? {}) };
    this.upgrades = { ...emptyUpgrades(), ...(this.upgrades ?? {}) };
    this.embers = Math.max(0, Math.round(this.embers ?? 0));
    this._upgradeHp = 0;
    this._upgradeMp = 0;
    this.xp = 0;
    this.xpNext = XP_STEPS[1];
    this.dmgMul = 1;
    this.speed = 64;
    const melee = WEAPONS.find((w) => w.id === DEFAULT_MELEE_WEAPON_ID) ?? WEAPONS[0];
    const thrown = WEAPONS.find((w) => w.id === DEFAULT_THROWN_WEAPON_ID) ?? WEAPONS.find((w) => w.class === "thrown");
    this.meleeWeapon = melee;
    this.meleeWeaponId = melee?.id;
    this.thrownWeapon = thrown ?? melee;
    this.thrownWeaponId = this.thrownWeapon?.id;
    this.inventory = [...WEAPONS];
    this.skillSlots = [...DEFAULT_SKILL_SLOTS];
    this.skillCursor = 0;
    this.dashCd = 0;
    this.dashMax = 1.15;
    this.dashT = 0;
    this.dodgeWindow = 0;
    this.dodgeBuffer = 0;
    this.dodgeBufferDir = { x: 1, y: 0 };
    this.dashVx = 0;
    this.dashVy = 0;
    this.dashDir = { x: 1, y: 0 };
    this.dead = false;
    this.invuln = 0;
    this.hitFlash = 0;
    this.shield = 0;
    this.shieldT = 0;
    this.regen = 0;
    this.regenT = 0;
    this.cd = { j: 0, k: 0, l: 0, u: 0, i: 0, o: 0, t: 0, e: 0 };
    this.applyUpgrades();
    this.comboIndex = 0;
    this.comboTimer = 0;
    this.attackBuffer = 0;
    this.meleeCooldownMax = 0.24;
    this.melee = null;
    this.meleeEchoes = [];
    this.attackFx = null;
    this.dashAttackT = 0;
    this.healGlow = 0;
    this.anim = { kind: "idle", t: 0, track: TRACKS.idle, loop: true, dur: 2.8 };
    this.stepT = 0;
    this.lunge = 0;
    this.rigWeaponOverride = null;
    this.actPose = null;
  }

  get weapon() {
    return this.meleeWeapon;
  }

  get weaponId() {
    return this.meleeWeaponId;
  }

  applyMeleeStats() {
    const weapon = this.meleeWeapon;
    if (!weapon) return;
    const might = this.upgradeRank("might");
    const haste = this.upgradeRank("haste");
    this.dmgMul = weapon.dmgMul * (1 + (this.level - 1) * 0.12) * (1 + might * 0.06);
    this.speed = weapon.speed + haste * 2;
    this.dashMax = 1.15 * weapon.dashCdMul;
  }

  // ---- permanent camp upgrades (embers survive death and restart)

  upgradeRank(id) {
    return this.upgrades?.[id] ?? 0;
  }

  upgradeTotal() {
    return UPGRADE_STATS.reduce((total, def) => total + this.upgradeRank(def.id), 0);
  }

  earnEmbers(amount) {
    const gain = Math.max(0, Math.round(amount ?? 0));
    this.embers = Math.max(0, this.embers ?? 0) + gain;
    return gain;
  }

  /** Recompute max HP/MP from the ranks without losing level-up gains. */
  applyUpgrades() {
    const hpBonus = this.upgradeRank("vitality") * upgradeById("vitality").per;
    const mpBonus = this.upgradeRank("spirit") * upgradeById("spirit").per;
    const dHp = hpBonus - (this._upgradeHp ?? 0);
    const dMp = mpBonus - (this._upgradeMp ?? 0);
    this._upgradeHp = hpBonus;
    this._upgradeMp = mpBonus;
    if (this.maxHp != null) {
      this.maxHp += dHp;
      this.hp = Math.min(this.maxHp, Math.max(0, this.hp + Math.max(0, dHp)));
    }
    if (this.maxMp != null) {
      this.maxMp += dMp;
      this.mp = Math.min(this.maxMp, Math.max(0, this.mp + Math.max(0, dMp)));
    }
    this.applyMeleeStats();
  }

  buyUpgrade(id) {
    const def = upgradeById(id);
    if (!def) return false;
    const rank = this.upgradeRank(id);
    if (rank >= def.max) return false;
    const cost = upgradeCost(def, rank);
    if ((this.embers ?? 0) < cost) return false;
    this.embers -= cost;
    this.upgrades[id] = rank + 1;
    this.applyUpgrades();
    return true;
  }

  respecUpgrades() {
    const refund = spentUpgrades(this.upgrades);
    if (!refund) return 0;
    this.upgrades = emptyUpgrades();
    this.embers = Math.max(0, this.embers ?? 0) + refund;
    this.applyUpgrades();
    return refund;
  }

  equipWeapon(id, g = null) {
    const weapon = this.inventory.find((item) => item.id === id);
    if (!weapon) return false;
    const kind = weaponEquipKind(weapon);
    if (kind === "thrown") {
      this.thrownWeapon = weapon;
      this.thrownWeaponId = weapon.id;
    } else {
      this.meleeWeapon = weapon;
      this.meleeWeaponId = weapon.id;
      this.applyMeleeStats();
    }
    if (g) {
      if (kind !== "thrown") this.warmMeleePoses();
      g.ui.toast(uiCopy(g).equipped(weaponLabel(g, weapon)), "gold");
      g.persistSave?.();
    }
    return true;
  }

  addStash(id, amount = 1, g = null) {
    if (!id || amount <= 0) return 0;
    this.stash[id] = (this.stash[id] ?? 0) + amount;
    if (g) {
      const def = stashItem(id);
      const name = def ? stashLabel(g, def) : id;
      g.ui.toast(uiCopy(g).stashGain(name), "gold");
      g.persistSave?.();
    }
    return this.stash[id];
  }

  stashCount(id) {
    return this.stash[id] ?? 0;
  }

  isWeaponEquipped(id) {
    return this.meleeWeaponId === id || this.thrownWeaponId === id;
  }

  swapSkill(slot, id) {
    if (slot < 0 || slot >= this.skillSlots.length) return false;
    this.skillSlots[slot] = id;
    return true;
  }

  equipLook(id, g = null) {
    const look = HERO_LOOKS.find((c) => c.id === id);
    if (!look) return false;
    this.look = look.id;
    if (typeof localStorage !== "undefined") localStorage.setItem("ember-echo-look", look.id);
    for (const track of Object.values(TRACKS)) for (const [, pose] of track) posed(pose, look.id);
    this.warmMeleePoses();
    if (g) {
      const name = g.language === "zh" ? look.label : look.name;
      g.ui.toast(uiCopy(g).equipped(name), "gold");
      g.persistSave?.();
    }
    return true;
  }

  tryDash(g, dir = null) {
    if (!this.alive || this.dashT > 0 || g.state !== "playing" || g.phase === "travel") return false;
    const d = dir ?? this.moveDirection(g);
    if (this.dashCd > 0) {
      this.dodgeBuffer = 0.14;
      this.dodgeBufferDir = d;
      return false;
    }
    return this.startDash(g, d);
  }

  startDash(g, d) {
    this.cancelMelee();
    interruptSpellActs(g);
    this.startAnim("idle", TRACKS.idle, true);
    const len = Math.hypot(d.x, d.y) || 1;
    this.dashDir = { x: d.x / len, y: d.y / len };
    if (this.dashDir.x) this.facing = Math.sign(this.dashDir.x);
    this.dashT = 0.28;
    this.dashCd = this.dashMax;
    this.dodgeWindow = 0.42;
    this.invuln = Math.max(this.invuln, this.dodgeWindow);
    this.dashVx = this.dashDir.x * 245;
    this.dashVy = this.dashDir.y * 138;
    this.vx = this.vy = 0;
    this.lunge = 0.22;
    this.dashAttackT = 0.5;
    // A dodge releases hit-stop immediately so defensive input always responds.
    g.hitStop = 0;
    const from = { x: this.x, y: this.y };
    g.dust(this.x - this.dashDir.x * 7, this.y + 1, 6, this.dashDir.x, "#ffd36a");
    g.addDashTrail(createMovementTrail(this, from, "dodge"));
    g.ui.actionPulse = { id: "dodge", t: 0.25 };
    g.audio.play("dash");
    return true;
  }

  tryQuickMove(g, dir = null) {
    if (!this.alive || this.dashT > 0 || g.state !== "playing" || g.phase === "travel") return false;
    if (this.ap < QUICK_MOVE_AP_COST) {
      g.ui.toast(uiCopy(g).apLow, "mp");
      g.audio.play("ui");
      return false;
    }
    this.ap = Math.max(0, this.ap - QUICK_MOVE_AP_COST);
    const d = dir ?? this.moveDirection(g);
    const len = Math.hypot(d.x, d.y) || 1;
    this.dashDir = { x: d.x / len, y: d.y / len };
    if (this.dashDir.x) this.facing = Math.sign(this.dashDir.x);
    const from = { x: this.x, y: this.y };
    this.x = g.clampX(this.x + this.dashDir.x * 22);
    this.y = clamp(this.y + this.dashDir.y * 13, 134, 170);
    this.vx = this.dashDir.x * 72;
    this.vy = this.dashDir.y * 42;
    this.lunge = 0.1;
    g.dust(this.x - this.dashDir.x * 7, this.y + 1, 3, this.dashDir.x, "#9edbff");
    g.addDashTrail(createMovementTrail(this, from, "quick"));
    g.ui.actionPulse = { id: "quick", t: 0.25 };
    g.audio.play("quick");
    return true;
  }

  moveDirection(g) {
    const x = Number(g.keys.has("d")) - Number(g.keys.has("a")) + (g.touchMove?.x ?? 0);
    const y = Number(g.keys.has("s")) - Number(g.keys.has("w")) + (g.touchMove?.y ?? 0);
    return x || y ? { x, y } : this.dashDir;
  }

  spawn(x, y) {
    this.cancelMelee();
    this.attackBuffer = this.dashAttackT = 0;
    this.x = x;
    this.y = y;
    this.vx = this.vy = this.dashT = this.dodgeWindow = this.dodgeBuffer = 0;
    this.anim = { kind: "idle", t: 0, track: TRACKS.idle, loop: true, dur: 2.8 };
  }

  get alive() { return !this.dead && this.hp > 0; }

  startAnim(kind, track, loop = false) {
    if (!kind.startsWith("attack")) this.cancelMelee(kind === "idle" || kind === "walk");
    if (kind !== "castK") this.clearThrowRig();
    this.anim = { kind, t: 0, track, loop, dur: track[track.length - 1][0] };
  }

  cancelMelee(keepTail = false) {
    if (this.melee) this.melee.cancelled = true;
    const retain = keepTail && this.melee?.landed;
    this.melee = null;
    if (this.attackFx) this.attackFx.options.cancelled = !retain;
    this.attackFx?.stop();
    this.attackFx = null;
    if (!retain) this.meleeEchoes = [];
  }

  /** While throwing, the rig briefly shows the thrown weapon instead of the melee one. */
  setThrowRig(rigWeapon) {
    this.rigWeaponOverride = rigWeapon ?? null;
  }

  clearThrowRig() {
    this.rigWeaponOverride = null;
  }

  activeRigWeapon() {
    return this.rigWeaponOverride ?? this.meleeWeapon?.rigWeapon ?? "sword";
  }

  pose() {
    if (this.actPose) {
      return { ...this.actPose, weapon: this.activeRigWeapon() };
    }
    const a = this.anim;
    const pose = poseAt(a.track, a.loop ? a.t % a.dur : Math.min(a.t, a.dur));
    pose.weapon = this.activeRigWeapon();
    if (isSheathDrawWeapon(this.meleeWeapon)) {
      if (a.kind === "walk") applySheathCarry(pose, this.meleeWeapon);
      else if (a.kind === "idle") {
        const breathe = { crouch: pose.crouch, lean: pose.lean };
        Object.assign(pose, sheathedIdlePose(this.meleeWeapon));
        pose.crouch = breathe.crouch;
        pose.lean = (breathe.lean ?? 0) - 1.5;
      }
    }
    return pose;
  }

  update(g, dt, keys) {
    for (const echo of this.meleeEchoes) echo.age += dt;
    this.meleeEchoes = this.meleeEchoes.filter((echo) => echo.age < 0.12);
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.dodgeWindow = Math.max(0, this.dodgeWindow - dt);
    this.dodgeBuffer = Math.max(0, this.dodgeBuffer - dt);
    if (this.dodgeBuffer > 0 && this.dashCd <= 0 && this.dashT <= 0 && g.state === "playing") {
      const d = this.dodgeBufferDir;
      this.dodgeBuffer = 0;
      this.startDash(g, d);
    }
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.healGlow = Math.max(0, this.healGlow - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    this.dashAttackT = Math.max(0, this.dashAttackT - dt);
    if (this.comboTimer <= 0) this.comboIndex = 0;
    if (this.shieldT > 0) {
      this.shieldT -= dt;
      if (this.shieldT <= 0) this.shield = 0;
    }
    if (this.regenT > 0 && this.regen > 0 && this.alive) {
      const n = Math.min(this.regen * dt, this.maxHp - this.hp);
      if (n > 0) this.hp += n;
      this.regenT -= dt;
    }
    this.mp = Math.min(this.maxMp, this.mp + (this.alive ? 4.2 * dt : 0));
    if (g.state === "playing" && g.phase !== "travel" && this.alive) {
      this.ap = Math.min(this.maxAp, this.ap + this.apRegen * dt);
    }

    if (this.dead) {
      this.anim.t += dt;
      return;
    }

    if (this.actPose) {
      this.anim.t += dt;
      this.vx = this.vy = 0;
      return;
    }

    // movement: transient animations only slow the duelist down, never lock him in place
    let ix = 0, iy = 0;
    if ((g.state === "playing" || g.state === "camp") && g.phase !== "travel") {
      ix = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + (g.touchMove?.x ?? 0) + (g.autoMove?.x ?? 0);
      iy = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0) + (g.touchMove?.y ?? 0) + (g.autoMove?.y ?? 0);
    }
    const len = Math.max(1, Math.hypot(ix, iy));
    ix /= len; iy /= len;
    const moving = !!(ix || iy);
    if (this.dashT > 0) {
      this.dashT = Math.max(0, this.dashT - dt);
      this.x += this.dashVx * dt;
      this.y += this.dashVy * dt;
      this.dashVx *= Math.max(0, 1 - 10 * dt);
      this.dashVy *= Math.max(0, 1 - 10 * dt);
      this.x = g.clampX(this.x);
      this.y = clamp(this.y, 134, 170);
      this.anim.t += dt;
      return;
    }
    const busy = this.anim.kind.startsWith("cast") ? 0.42 : this.anim.kind.startsWith("attack") ? 0.76 : this.anim.kind === "hurt" ? 0.2 : 1;
    const sp = this.speed * busy;

    if (moving) {
      this.x += ix * sp * dt + this.vx * dt;
      this.y += iy * sp * 0.56 * dt + this.vy * dt;
      if (ix && !(this.melee && this.anim.t < this.melee.hitTime + 0.045)) this.facing = ix > 0 ? 1 : -1;
      this.dashDir = { x: ix, y: iy };
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = 0.13;
        g.dust(this.x - this.facing * 4, this.y + 1, 2, this.facing);
      }
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    this.vx *= Math.max(0, 1 - 9 * dt);
    this.vy *= Math.max(0, 1 - 9 * dt);
    this.lunge = Math.max(0, this.lunge - dt);
    this.x = g.clampX(this.x);
    this.y = clamp(this.y, 134, 170);

    // animation selection
    this.anim.t += dt;
    if (this.melee?.art && this.pose().ghost) {
      this.melee.echoT += dt;
      if (this.melee.echoT >= 0.025) {
        this.melee.echoT = 0;
        this.meleeEchoes.push({ x: this.x, y: this.y, facing: this.melee.facing, age: 0,
          body: posed(this.pose(), this.look, { density: 2 }), color: hex(this.melee.art.echo) });
        if (this.meleeEchoes.length > 3) this.meleeEchoes.shift();
      }
    }
    if (this.anim.loop) {
      if (this.anim.kind !== "walk" && this.anim.kind !== "idle") this.anim.kind = "idle";
      if (moving) {
        if (this.anim.kind !== "walk") this.startAnim("walk", TRACKS.walk, true);
      } else if (this.anim.kind === "walk") {
        this.startAnim("idle", TRACKS.idle, true);
      }
    } else if (this.anim.t >= this.anim.dur) {
      if (this.rigWeaponOverride && this.anim.kind === "castK") this.clearThrowRig();
      this.startAnim(moving ? "walk" : "idle", moving ? TRACKS.walk : TRACKS.idle, true);
    }
  }

  draw(g, p) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const scale = this.renderScale;
    const pose = this.pose();
    const r = posed(pose, this.look, { density: 2 });
    const flip = this.facing < 0;
    // a soft contact shadow keeps the feet planted on the flagstones
    p.ellipse(x, y - 1, size(8), size(2.5), P.shadow, 0.55);
    // a quiet ember ring so the player can always find the duelist in a busy fight
    p.ellipse(x, y - 1, size(10), size(3), hex("#ff9a4a"), 0.13 + 0.04 * Math.sin(performance.now() / 420));
    // shield: a second, brighter ring under the feet
    if (this.shield > 0) p.ellipse(x, y - 1, size(12), size(3.5), hex("#ffe9a0"), 0.35);
    if (this.healGlow > 0) {
      const k = this.healGlow / 0.42;
      p.glow(x, y - size(22), size(26), hex("#8fff7a"), 0.18 + 0.42 * k);
      p.glow(x, y - size(14), size(16), hex("#e8ffe0"), 0.12 + 0.28 * k);
    }
    for (const echo of this.meleeEchoes) {
      const b = echo.body, cell = 1 / b.density, alpha = 0.22 * (1 - echo.age / 0.12) ** 2;
      for (let i = 0; i < b.n; i++) {
        p.rect(echo.x + (echo.facing < 0 ? -b.xs[i] - cell : b.xs[i]) * scale,
          echo.y + b.ys[i] * scale, scale * cell, scale * cell, echo.color, alpha);
      }
    }
    const blink = this.invuln > 0 && this.hitFlash <= 0 && Math.floor(this.invuln * 22) % 2 === 0;
    const a = this.dead ? 0.55 : blink ? 0.45 : 1;
    const white = this.hitFlash > 0;
    for (let i = 0; i < r.n; i++) {
      const cell = 1 / r.density;
      const sx = x + (flip ? -r.xs[i] - cell : r.xs[i]) * scale;
      const sy = y + r.ys[i] * scale;
      p.rect(sx, sy, scale * cell, scale * cell, white ? P.white : r.color[i], a);
    }
  }

  // Reassert the real rig above overlapping large spell effects, with a thin dark keyline.
  // The world still owns depth sorting; this pass only protects the player's silhouette.
  drawCombatFocus(p) {
    const r = posed(this.pose(), this.look, { density: 2 }), scale = this.renderScale;
    const cell = scale / r.density, flip = this.facing < 0;
    for (const outline of [true, false]) {
      for (let i = 0; i < r.n; i++) {
        const x = Math.round(this.x) + (flip ? -r.xs[i] - 1 / r.density : r.xs[i]) * scale;
        const y = Math.round(this.y) + r.ys[i] * scale;
        const pad = outline ? 0.65 : 0;
        if (outline) {
          // pixelfx composites additive light after color. Clear glare only under the rig mask,
          // otherwise even a redrawn player would still disappear inside a white lightning beam.
          p.each(x - pad, y - pad, x + cell + pad, y + cell + pad, (lx, ly, sx, sy) => {
            if (lx >= x - pad && lx < x + cell + pad && ly >= y - pad && ly < y + cell + pad) {
              p.L[(sy - p.oy) * p.w + sx - p.ox] = 0;
            }
          });
        }
        p.rect(x - pad, y - pad, cell + pad * 2, cell + pad * 2,
          outline ? P.shadow : this.hitFlash > 0 ? P.white : r.color[i], outline ? 0.85 : 1);
      }
    }
  }

  // ---- damage, healing, progression
  hurt(g, amount, opts = {}) {
    if (!this.alive) return false;
    if (this.invuln > 0) {
      if (this.dodgeWindow > 0) {
        g.number(this.x, this.y - 42, "DODGE", { color: "#ffe8a0", small: true });
        g.addFx(g.fx.hitSpark, { x: this.x, y: this.y - 18, light: 0.8, seed: 921 });
        g.audio.play("ui");
        g.shake(1.1, 0.1);
      }
      return false;
    }
    let dmg = Math.max(1, Math.round(amount));
    if (this.shield > 0) {
      const absorb = Math.min(this.shield, dmg);
      this.shield -= absorb;
      dmg -= absorb;
      if (this.shield <= 0) {
        this.shieldT = 0;
        g.addFx(g.fx.manaBurst, { x: this.x, y: this.y, light: 0.8 });
      }
      g.number(this.x, this.y - 46, "护盾 -" + absorb, { color: "#ffe9a0", small: true });
    }
    if (dmg > 0) {
      this.cancelMelee();
      this.attackBuffer = 0;
      interruptSpellActs(g);
      this.hp = Math.max(0, this.hp - dmg);
      this.hitFlash = 0.16;
      g.number(this.x, this.y - 44, "-" + dmg, { color: "#ff6a6a" });
      g.shake(3.4, 0.3);
      g.flashScreen("#ff3a4a", 0.16);
      g.audio.play("hurt");
      this.startAnim("hurt", TRACKS.hurt, false);
      if (opts.knock !== false) {
        const dir = Math.sign(this.x - (opts.fromX ?? this.x - this.facing));
        this.vx = dir * 55;
        this.vy = 14;
      }
    }
    this.invuln = Math.max(this.invuln, 0.7);
    if (this.hp <= 0.001) {
      this.hp = 0;
      this.dead = true;
      this.startAnim("dead", TRACKS.dead, false);
      g.addFx(g.fx.poof, { x: this.x, y: this.y - 14, palette: ["#2a2030", "#5c4a62", "#958aa6", "#cfc4dc", "#f4eefc", "#ffffff"] });
      g.shake(5, 0.6);
      g.flashScreen("#ff2a3a", 0.4);
      g.audio.play("death");
    }
    return true;
  }

  heal(g, amount, opts = {}) {
    if (!this.alive) return 0;
    const n = Math.min(amount, this.maxHp - this.hp);
    if (n <= 0) return 0;
    this.hp += n;
    if (opts.linger) {
      this.regen = Math.max(this.regen, 3);
      this.regenT = Math.max(this.regenT, opts.linger);
    }
    this.healGlow = Math.max(this.healGlow, 0.42);
    const healAmt = Math.round(n);
    const hx = this.x, hy = this.y - size(44);
    g.after(0.32, () => {
      if (!this.alive) return;
      g.number(hx, hy, "+" + healAmt, { color: "#6ee86a" });
    });
    return n;
  }

  addShield(g, amount, time) {
    this.shield = Math.max(this.shield, amount);
    this.shieldT = Math.max(this.shieldT, time);
  }

  gainXp(g, n) {
    this.xp += n;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = XP_STEPS[Math.min(XP_STEPS.length - 1, this.level)] ?? Math.round(this.xpNext * 1.6);
      this.maxHp += 14;
      this.maxMp += 8;
      this.hp = Math.min(this.maxHp, this.hp + 34);
      this.mp = Math.min(this.maxMp, this.mp + 18);
      this.applyMeleeStats();
      g.addFx(g.fx.levelUp, { x: this.x, y: this.y, light: 1 });
      const c = uiCopy(g);
      g.banner(c.levelUp, `${c.level} ${this.level} · ${c.levelUpSub}`, c.levelUpSub);
      g.flashScreen("#ffe6a0", 0.25);
      g.audio.play("level");
    }
  }

  /** Warm the pose cache so the first swing does not hitch. */
  warmMeleePoses() {
    for (let combo = 0; combo < 3; combo++) {
      const art = meleeArt(this.meleeWeapon, combo), beat = meleeBeat(this, combo);
      for (const [, pose] of meleePoseTrack(art, beat, this.meleeWeapon, combo)) posed(pose, this.look, { density: 2 });
    }
  }

  static prepare() {
    const warm = new Set([HERO_LOOK_DEFAULT, loadHeroLook()]);
    for (const c of HERO_LOOKS) {
      if (!warm.has(c.id)) continue;
      for (const track of Object.values(TRACKS)) for (const [, pose] of track) posed(pose, c.id);
    }
  }
}

export { TRACKS as HERO_TRACKS };

/** Draw a small standing portrait into a canvas (used by the HUD card). */
export function drawHeroPortrait(canvas, weapon = "sword", look = loadHeroLook()) {
  const density = 2, w = 112 * density, h = 88 * density;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const out = new Uint32Array(img.data.buffer);
  const r = posed({ ...IDLE, weapon }, look, { density });
  for (let i = 0; i < r.n; i++) {
    const x = Math.round((42 + r.xs[i]) * density), y = Math.round(h - (14 - r.ys[i]) * density);
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    out[y * w + x] = r.color[i];
  }
  ctx.putImageData(img, 0, 0);
}
