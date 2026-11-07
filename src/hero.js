// The player's duelist. The body is drawn from the pixelfx character rig (a real little skeleton, not a
// bitmap), so walking, sword swings and spell casts all read as one person holding one sword.

import { posed, poseAt, painterFor, STAND, READY, hex, clamp } from "../../pixelfx/src/core/index.js";
import { HERO_LOOK, WEAPONS, DEFAULT_SKILL_SLOTS } from "./data.js";
import { createMovementTrail } from "./movement-fx.js";
import { COMBAT_SCALE, HERO_RENDER_SCALE, combatDistance as size } from "./combat-scale.js";

const GUARD = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
const IDLE = { ...GUARD, fx: 10, fy: -20, bx: 7, by: -19, crouch: 1 };
const IDLE_B = { ...IDLE, crouch: 2, fx: 9, fy: -19, lean: -0.5 };
const WIND = { ...GUARD, x: -8, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
const CUT = { ...GUARD, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -10, ghost: 1 };
const DOWN = { ...GUARD, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true };
const HIGH = { ...GUARD, x: -7, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
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

const WALK = [
  [0, { ...IDLE, ffx: 10, ffy: -2, fbx: -9, fby: -4, fx: 13, fy: -22, bx: 2, by: -18, crouch: 2, lean: 1 }],
  [0.16, { ...IDLE, ffx: 3, ffy: -8, fbx: -3, fby: -2, fx: 9, fy: -19, bx: 7, by: -21, crouch: 3, lean: 1.5 }],
  [0.32, { ...IDLE, ffx: -9, ffy: -4, fbx: 10, fby: -2, fx: 3, fy: -18, bx: 13, by: -22, crouch: 2, lean: 1 }],
  [0.48, { ...IDLE, ffx: 3, ffy: -8, fbx: -3, fby: -2, fx: 9, fy: -19, bx: 7, by: -21, crouch: 3, lean: 1.5 }],
  [0.64, { ...IDLE, ffx: 10, ffy: -2, fbx: -9, fby: -4, fx: 13, fy: -22, bx: 2, by: -18, crouch: 2, lean: 1 }],
];

const TRACKS = {
  idle: [[0, IDLE], [1.4, IDLE_B], [2.8, IDLE]],
  walk: WALK,
  attack1: [[0, WIND], [0.06, CUT, "snap"], [0.1, DOWN, "snap"], [0.32, DOWN], [0.5, GUARD]],
  attack2: [[0, HIGH], [0.02, { ...HIGH, crouch: 5 }], [0.08, CUT, "snap"], [0.12, LOW, "snap"], [0.18, UP, "snap"], [0.24, { ...UP, fy: -38 }], [0.5, { ...LOW, crouch: 3, lean: 3, fx: 18, fy: -36, sa: -1.05 }], [0.72, GUARD]],
  attack3: [[0, REST], [0.14, OVER], [0.2, { ...OVER, crouch: 3 }], [0.28, FLOOR, "snap"], [0.62, FLOOR], [0.95, REST], [1.15, GUARD]],
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
    this.look = HERO_LOOK;
    this.combatScale = COMBAT_SCALE;
    this.renderScale = HERO_RENDER_SCALE;
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
    this.xp = 0;
    this.xpNext = XP_STEPS[1];
    this.dmgMul = 1;
    this.speed = 64;
    this.weaponId = WEAPONS[0].id;
    this.weapon = WEAPONS[0];
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
    this.cd = { j: 0, k: 0, l: 0, u: 0, i: 0, o: 0 };
    this.comboIndex = 0;
    this.comboTimer = 0;
    this.anim = { kind: "idle", t: 0, track: TRACKS.idle, loop: true, dur: 2.8 };
    this.stepT = 0;
    this.lunge = 0;
  }

  equipWeapon(id, g = null) {
    const weapon = this.inventory.find((item) => item.id === id);
    if (!weapon) return false;
    this.weaponId = weapon.id;
    this.weapon = weapon;
    this.dmgMul = weapon.dmgMul * (1 + (this.level - 1) * 0.12);
    this.speed = weapon.speed;
    this.dashMax = 1.15 * weapon.dashCdMul;
    if (g) g.ui.toast(`${weapon.nameEn} EQUIPPED`, "gold");
    return true;
  }

  swapSkill(slot, id) {
    if (slot < 0 || slot >= this.skillSlots.length) return false;
    this.skillSlots[slot] = id;
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
    const from = { x: this.x, y: this.y };
    g.dust(this.x - this.dashDir.x * 7, this.y + 1, 6, this.dashDir.x, "#ffd36a");
    g.addDashTrail(createMovementTrail(this, from, "dodge"));
    g.ui.actionPulse = { id: "dodge", t: 0.25 };
    g.shake(1.4, 0.12);
    g.audio.play("dash");
    return true;
  }

  tryQuickMove(g, dir = null) {
    if (!this.alive || this.dashT > 0 || g.state !== "playing" || g.phase === "travel") return false;
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
    this.x = x;
    this.y = y;
    this.vx = this.vy = this.dashT = this.dodgeWindow = this.dodgeBuffer = 0;
    this.anim = { kind: "idle", t: 0, track: TRACKS.idle, loop: true, dur: 2.8 };
  }

  get alive() { return !this.dead && this.hp > 0; }

  startAnim(kind, track, loop = false) {
    this.anim = { kind, t: 0, track, loop, dur: track[track.length - 1][0] };
  }

  pose() {
    const a = this.anim;
    const pose = poseAt(a.track, a.loop ? a.t % a.dur : Math.min(a.t, a.dur));
    // Tracks describe timing and body motion; the equipped item supplies the actual rig shape.
    // This keeps every animation (idle, walk, attack, hurt and death) visually in sync with loadout.
    pose.weapon = this.weapon?.rigWeapon ?? "sword";
    return pose;
  }

  update(g, dt, keys) {
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
    this.comboTimer = Math.max(0, this.comboTimer - dt);
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

    if (this.dead) {
      this.anim.t += dt;
      return;
    }

    // movement: transient animations only slow the duelist down, never lock him in place
    let ix = 0, iy = 0;
    if (g.state === "playing" && g.phase !== "travel") {
      ix = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0) + (g.touchMove?.x ?? 0);
      iy = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0) + (g.touchMove?.y ?? 0);
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
      if (ix) this.facing = ix > 0 ? 1 : -1;
      this.dashDir = { x: ix, y: iy };
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = 0.26;
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
    if (this.anim.loop) {
      if (this.anim.kind !== "walk" && this.anim.kind !== "idle") this.anim.kind = "idle";
      if (moving) {
        if (this.anim.kind !== "walk") this.startAnim("walk", TRACKS.walk, true);
      } else if (this.anim.kind === "walk") {
        this.startAnim("idle", TRACKS.idle, true);
      }
    } else if (this.anim.t >= this.anim.dur) {
      this.startAnim(moving ? "walk" : "idle", moving ? TRACKS.walk : TRACKS.idle, true);
    }
  }

  draw(g, p) {
    const x = Math.round(this.x), y = Math.round(this.y);
    const scale = this.renderScale;
    const pose = this.pose();
    const r = posed(pose, this.look);
    const flip = this.facing < 0;
    // a soft contact shadow keeps the feet planted on the flagstones
    p.ellipse(x, y - 1, size(8), size(2.5), P.shadow, 0.55);
    // a quiet ember ring so the player can always find the duelist in a busy fight
    p.ellipse(x, y - 1, size(10), size(3), hex("#ff9a4a"), 0.13 + 0.04 * Math.sin(performance.now() / 420));
    // shield: a second, brighter ring under the feet
    if (this.shield > 0) p.ellipse(x, y - 1, size(12), size(3.5), hex("#ffe9a0"), 0.35);
    const blink = this.invuln > 0 && this.hitFlash <= 0 && Math.floor(this.invuln * 22) % 2 === 0;
    const a = this.dead ? 0.55 : blink ? 0.45 : 1;
    const white = this.hitFlash > 0;
    for (let i = 0; i < r.n; i++) {
      const sx = x + (flip ? -r.xs[i] : r.xs[i]) * scale;
      const sy = y + r.ys[i] * scale;
      p.dot(sx, sy, white ? P.white : r.color[i], a);
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
    g.number(this.x, this.y - 48, "+" + Math.round(n), { color: "#a8ff9a", small: !opts.big });
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
      this.dmgMul = this.weapon.dmgMul * (1 + (this.level - 1) * 0.12);
      g.addFx(g.fx.levelUp, { x: this.x, y: this.y, light: 1 });
      g.banner("LEVEL UP", `等级 ${this.level} · 生命与法力提升`, "LEVEL");
      g.flashScreen("#ffe6a0", 0.25);
      g.audio.play("level");
    }
  }

  /** Warm the pose cache so the first swing does not hitch. */
  static prepare() {
    for (const track of Object.values(TRACKS)) for (const [, pose] of track) posed(pose, HERO_LOOK);
  }
}

export { TRACKS as HERO_TRACKS };

/** Draw a small standing portrait into a canvas (used by the HUD card). */
export function drawHeroPortrait(canvas) {
  const w = 30, h = 42;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const out = new Uint32Array(img.data.buffer);
  const r = posed(IDLE, HERO_LOOK);
  for (let i = 0; i < r.n; i++) {
    const x = 16 + r.xs[i], y = h - 1 + r.ys[i];
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    out[y * w + x] = r.color[i];
  }
  ctx.putImageData(img, 0, 0);
}
