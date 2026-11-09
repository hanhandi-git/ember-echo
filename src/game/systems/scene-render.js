import { clearFrame, painterFor, composite, hex } from "../../../../pixelfx/src/core/index.js";
import { drawMovementTrail } from "../../movement-fx.js";
import { COMBAT_SCALE, PICKUP_RENDER_SCALE } from "../../combat-scale.js";
import { SW, SH, PALETTE as C, NUM_FONT_SCALE } from "../constants.js";
import { mergeUI } from "./world-render.js";
import { drawSpellActFx } from "../../spell-act.js";

export const sceneRenderSystem = {
  render() {
    const f = this.frame;
    // Complex x4 spell rasters are refreshed in a small rotating budget. Their
    // simulation still advances every tick; staggering redraws prevents a burst
    // of meteors/lightning/runes from monopolizing one frame.
    this._fxCacheRefreshBudget = 2;
    this._largeFxDrawBudget = 1;
    this._fxDrawBudget = 3;
    this._fxCacheFrameId = (this._fxCacheFrameId ?? 0) + 1;
    this._fxCachePhaseCounter = 0;
    const sh = this.shakeState;
    let sx = 0, sy = 0;
    if (sh.amp > 0 && sh.t < sh.dur) {
      const k = (1 - sh.t / sh.dur) ** 2;
      sx = (Math.sin(sh.t * 72) * 0.65 + (sh.dir ?? 0) * Math.cos(sh.t * 42) * 0.35) * sh.amp * k;
      sy = Math.sin(sh.t * 53) * sh.amp * 0.35 * k;
    }
    this.updateCamera();
    f.ox = Math.round(this.cameraX - sx);
    f.oy = -Math.round(sy);
    clearFrame(f);

    this.drawMapTiles(f);

    let p = painterFor(f);
    for (const t of this.telegraphs) this.drawTelegraph(p, t);
    for (const ef of this.effects) if (ef.layer === "ground") {
      if (ef.act) drawSpellActFx(this, ef, "back");
      else this.drawScaledFx(ef.inst, ef.inst.options.x ?? 0, ef.inst.options.y ?? 0, ef.scale);
      p = painterFor(f);
    }
    if (this.state === "camp" && this.hubAdventureFx) {
      this.hubAdventureFx.draw(f, "back");
      p = painterFor(f);
    }
    if (this.portal) { this.portal.fx.draw(f, "back"); p = painterFor(f); }
    for (const ef of this.effects) if (ef.split) {
      this.drawScaledFx(ef.inst, ef.inst.options.x ?? 0, ef.inst.options.y ?? 0, ef.scale, "back");
      p = painterFor(f);
    }
    for (const trail of this.dashTrails) drawMovementTrail(p, trail);

    const actors = [...this.pickups.filter((q) => !q.dead).map((q) => ({ y: q.y, kind: "pickup", ref: q }))];
    for (const e of this.enemies) if (!e.dead) actors.push({ y: e.y, kind: "enemy", ref: e });
    actors.push({ y: this.hero.y, kind: "hero", ref: this.hero });
    actors.sort((a, b) => a.y - b.y || (a.kind === "hero" ? 1 : -1));
    for (const a of actors) {
      if (a.kind === "pickup") {
        this.drawScaledFx(a.ref.fx, a.ref.x, a.ref.y, PICKUP_RENDER_SCALE);
        p = painterFor(f);
      } else if (a.kind === "enemy") {
        a.ref.draw(this, painterFor(f));
      } else {
        this.hero.draw(this, painterFor(f));
      }
    }

    for (const ef of this.effects) if (ef.layer !== "ground") {
      if (ef.act) {
        drawSpellActFx(this, ef, "back");
        drawSpellActFx(this, ef, "front");
      } else this.drawScaledFx(ef.inst, ef.inst.options.x ?? 0, ef.inst.options.y ?? 0, ef.scale, ef.split ? "front" : undefined);
      p = painterFor(f);
    }
    for (const ef of this.effects) if (ef.act && ef.layer === "ground") {
      drawSpellActFx(this, ef, "front");
      p = painterFor(f);
    }
    for (const pr of this.projectiles) { this.drawScaledFx(pr.fx, pr.x, pr.y, COMBAT_SCALE); p = painterFor(f); }

    const largeSpells = this.effects.filter((ef) => !ef.act && !ef.melee && ef.layer !== "ground" && (ef.inst.meta.size?.[0] ?? 0) >= 128);
    if (largeSpells.length >= 2 && this.hero.alive && !this.hero.actPose) this.hero.drawCombatFocus(p);

    if (this.state === "camp" && this.hubAdventureFx) {
      this.hubAdventureFx.draw(f, "front");
      p = painterFor(f);
      this.drawHubGates?.(p);
    }
    if (this.portal) {
      this.portal.fx.options.x = this.portal.x;
      this.portal.fx.options.y = this.portal.y;
      this.portal.fx.draw(f, "front");
      p = painterFor(f);
      p.text(this.portal.label, this.portal.x, this.portal.y - 56, this.portal.color, { align: "center", outline: C.ink, font: "mini" });
    }

    for (const m of this.motes) {
      const a = 1 - m.t / m.life;
      p.dot(m.x, m.y, m.color, a * 0.9);
    }
    this.drawImpacts(p);
    for (const n of this.numbers) {
      const a = 1 - n.t / n.life;
      const tier = n.tier ?? (n.crit ? "crit" : "normal");
      const pop = n.small ? 1 : 1 + 0.24 * Math.exp(-n.t * 18) * Math.sin(Math.min(1, n.t / 0.12) * Math.PI);
      const scale = (NUM_FONT_SCALE[tier] ?? 1) * (n.small ? 0.92 : 1) * pop;
      p.text(n.text, n.x, n.y, n.color, {
        font: "mini", scale, align: "center",
        outline: C.ink, a: Math.min(1, a * 1.6),
      });
    }

    f.ox = 0;
    f.oy = 0;
    if (this.flashState.a > 0) {
      painterFor(f).rect(0, 0, SW, SH, this.flashState.color, Math.min(0.22, this.flashState.a));
    }
    const uf = this.uiFrame;
    uf.ox = 0;
    uf.oy = 0;
    clearFrame(uf);
    painterFor(uf);
    this.ui.draw(this, painterFor(uf), uf);
    mergeUI(f, uf);
    p = painterFor(f);
    if (this.phase === "travel") {
      p.rect(0, 0, SW, SH, hex("#050409"), Math.min(1, this.phaseT / 0.5));
    }
    if (this.fade > 0.001) {
      p.rect(0, 0, SW, SH, hex("#050409"), this.fade);
      this.fade = Math.max(0, this.fade - 0.035);
    }
    composite(f, this.img.data, C.bg);
    this.ctx.putImageData(this.img, 0, 0);
  },
};
