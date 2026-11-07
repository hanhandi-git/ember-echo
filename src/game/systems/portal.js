import { createFx, hex } from "../../../../pixelfx/src/core/index.js";
import { GATE_PALETTES } from "../../fx/stage-portal.js";
import { STAGES } from "../../data.js";
import { uiCopy } from "../../copy.js";

export const portalSystem = {
  openPortal() {
    const targetStage = this.stageIndex + 1;
    const exit = targetStage >= STAGES.length;
    const finalGate = targetStage === STAGES.length - 1;
    const palette = exit ? GATE_PALETTES.exit : finalGate ? GATE_PALETTES.final : GATE_PALETTES.normal;
    const x = this.worldW - 70, y = 152;
    const distance = Math.hypot(this.hero.x - x, (this.hero.y - y) * 1.4);
    this.portal = {
      x, y, finalGate, exit, targetStage, t: 0, armed: distance > 20,
      label: exit ? "ESCAPE" : finalGate ? "FINAL STAGE" : "NEXT STAGE",
      color: hex(palette[5]),
      fx: createFx(this.fx.stagePortal, { x, y, palette, reveal: 0, seed: 910 + this.stageIndex }),
    };
    const c = uiCopy(this);
    this.ui.toast(exit ? c.portalEscape : finalGate ? c.portalFinal : c.portalOpen);
    this.audio.play("portal");
  },

  updatePortal(dt) {
    if (!this.portal) return;
    this.portal.t += dt;
    this.portal.fx.update(dt);
    this.portal.fx.options.reveal = Math.min(1, this.portal.t / 0.65);
    const distance = Math.hypot(this.hero.x - this.portal.x, (this.hero.y - this.portal.y) * 1.4);
    if (distance > 22) this.portal.armed = true;
    if (this.phase === "clear" && this.portal.t > 0.8 && this.portal.armed && this.hero.alive && distance < 14) this.enterPortal();
  },

  enterPortal() {
    if (!this.portal || this.phase !== "clear" || !this.hero.alive) return;
    this.phase = "travel";
    this.phaseT = 0;
    this.keys.clear();
    this.hero.vx = this.hero.vy = this.hero.dashT = 0;
    this.audio.play("portal");
    this.shake(2, 0.25);
  },
};
