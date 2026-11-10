import { Target, hex } from "../../pixelfx/src/core/index.js";
import { COMBAT_SCALE } from "./combat-scale.js";

/** A non lethal arena target that accepts every normal combat hit and reports damage. */
export class TrainingDummy {
  constructor(x, y) {
    this.typeId = "training-dummy";
    this.name = "稻草人";
    this.x = x; this.y = y; this.prevX = x; this.prevY = y;
    this.maxHp = 999999; this.hp = this.maxHp; this.damageHp = this.hp;
    this.w = 16; this.baseBarH = 44; this.barH = 44; this.combatScale = COMBAT_SCALE;
    this.renderScale = 0.72 * COMBAT_SCALE; this.facing = -1; this.dead = false; this.dying = false;
    this.hitFlash = 0; this.totalDamage = 0; this.lastDamage = 0; this.swing = 0;
    this.target = new Target(0, 411);
  }

  get alive() { return !this.dead; }
  get boss() { return false; }
  update(_g, dt) { this.hitFlash = Math.max(0, this.hitFlash - dt); this.swing += dt; this.target.step(dt); }

  hurt(g, amount, opts = {}) {
    const damage = Math.max(1, Math.round(amount ?? 1));
    this.totalDamage += damage; this.lastDamage = damage; this.hitFlash = 0.16;
    this.target.hit({ push: Math.sign(opts.fromX == null ? 1 : this.x - opts.fromX) * 0.18, straw: 5, flash: 0.12 });
    g.number(this.x, this.y - 48, String(damage), { color: opts.crit ? "#ffd36a" : "#fff0d0", crit: !!opts.crit });
    g.comboAdd?.();
    g.addFx?.(g.fx.hitSpark, { x: this.x, y: this.y - 28, light: 0.8, seed: 411 });
    g.audio?.play?.("hit", { gain: 0.25 });
    return damage;
  }

  draw(g, p) {
    const frame = p.frame, worldW = frame.w / frame.density, worldH = frame.h / frame.density;
    // Reuse one scratch buffer at world resolution. Allocating two full-screen
    // arrays per frame was the training yard's main GC/frame-time drain.
    let buffer = this._buffer;
    if (!buffer || buffer.length !== worldW * worldH) buffer = this._buffer = new Uint32Array(worldW * worldH);
    else buffer.fill(0);
    p.ellipse(this.x, this.y - 1, 11, 3, hex("#05040a"), 0.5);
    const fx = this.x - frame.ox, fy = this.y - frame.oy;
    this.target.draw(buffer, worldW, worldH, fx, fy, this.facing < 0);
    this.target.drawStraw(buffer, worldW, worldH, fx, fy, this.facing < 0);
    p.image(buffer, worldW, worldH, frame.ox, frame.oy);
    if (this.totalDamage > 0) {
      p.text(String(this.totalDamage), this.x, this.y - 62, hex("#ffd36a"), {
        align: "center", outline: hex("#07060d"), font: "mini",
      });
    }
  }
}
