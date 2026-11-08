export const loopSystem = {
  addDashTrail(trail) {
    this.dashTrails.push(trail);
  },

  updateDashTrails(dt) {
    for (const t of this.dashTrails) {
      t.t += dt;
      if (t.kind === "dodge" && t.t <= 0.22) t.to = { x: this.hero.x, y: this.hero.y };
    }
    this.dashTrails = this.dashTrails.filter((t) => t.t < t.life);
  },

  tick(dt) {
    this.time += dt;
    if (this.state === "paused" || this.state === "inventory") return;

    if (this.state === "camp") {
      for (const map of this.mapFxTiles) map.update(dt * 0.8);
      this.hero.update(this, dt, this.keys);
      this.updateEffects(dt);
      this.updateDashTrails(dt);
      return;
    }

    if (this.state === "gameover" || this.state === "victory") {
      for (const map of this.mapFxTiles) map.update(dt * 0.5);
      this.updateMotes(dt);
      this.updateNumbers(dt);
      this.updateImpacts(dt);
      this.updateDashTrails(dt);
      return;
    }

    this.runTime += dt;

    if (this.phase === "travel") {
      for (const map of this.mapFxTiles) map.update(dt);
      this.updatePortal(dt);
      this.updateEffects(dt);
      this.updateDashTrails(dt);
      this.updateShake(dt);
      this.updateFlow(dt);
      return;
    }

    if (this.hitStop > 0) {
      this.updateSpellActs?.(dt);
      this.hitStop = Math.max(0, this.hitStop - dt);
      for (const map of this.mapFxTiles) map.update(dt);
      this.updateShake(dt);
      this.updateFlash(dt);
      this.updateDashTrails(dt);
      this.updateImpacts(dt);
      return;
    }

    if (this.timers.length) {
      const due = [];
      for (const t of this.timers) {
        t.t -= dt;
        if (t.t <= 0) due.push(t);
      }
      this.timers = this.timers.filter((t) => t.t > 0);
      for (const t of due) t.fn();
    }

    for (const map of this.mapFxTiles) map.update(dt);
    this.updateSpellActs?.(dt);
    this.updateAuto?.(dt);
    this.hero.update(this, dt, this.keys);
    this.updateCombatInput(dt);
    this.updateCamera();
    for (const e of this.enemies) e.update(this, dt);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.updateEffects(dt);
    this.updateDashTrails(dt);
    this.updatePortal(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateMotes(dt);
    this.updateNumbers(dt);
    this.updateImpacts(dt);
    this.updateTelegraphs(dt);
    this.updateShake(dt);
    this.updateFlash(dt);
    this.updateSpawns(dt);
    this.updateFlow(dt);

    if (this.combo.timer > 0) {
      this.combo.timer -= dt;
      if (this.combo.timer <= 0) this.combo.count = 0;
    }
    this.combo.count = Math.min(999, this.combo.count);

    if (!this.hero.alive) {
      this.deathT += dt;
      if (this.deathT > 2.2 && this.state === "playing") {
        this.state = "gameover";
        this.clearRunSave?.();
      }
    }

    this.tickSave?.(dt);
  },
};
