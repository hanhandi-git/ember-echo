// Game-speed performances of pixelfx weapon art, with footwork and short ember wakes.
// The source modules retain their crescent shading, particles and separate light buffer.
import { resolveOptions, hex, Rng, Particles, P, clamp } from "../../../pixelfx/src/core/index.js";
import { meleeArt, meleeSourceTime } from "../melee-arts.js";
import { MELEE_BEATS } from "../combat-feel.js";

export const meta = {
  name: "Duelist weapon arts", desc: "Weapon attacks retimed into a responsive three-cut string.",
  tags: ["melee", "combo", "directional", "one-shot"],
  size: [240, 152], origin: [100, 124], duration: 0.7, loop: false, fps: 60,
  options: { seed: 1, combo: 0, range: 58 },
};

export function create(o) {
  const art = o.art ?? meleeArt({ rigWeapon: "sword" }, o.combo);
  const beat = o.beat ?? MELEE_BEATS[o.combo];
  const sourceOptions = resolveOptions(art.module.meta, { palette: art.palette, seed: o.seed, radius: o.range * 0.7 });
  const sourceArt = art.module.create ? art.module.create(sourceOptions) : art.module;
  const rng = new Rng(o.seed), particles = new Particles({ rng, ground: () => 0,
    sparks: ["#fff3ce", "#ffd18a", "#ef9860", "#9d5361"] });
  let time = 0, sourceTime = 0, released = false;
  const prepare = (p) => {
    if (o.cancelled || time >= beat.duration + 0.09 || meleeSourceTime(art, beat, time, o.weapon, o.combo) < 0) return false;
    p.fade *= Math.min(1, (beat.duration + 0.09 - time) / 0.065);
    return true;
  };
  return {
    update(dt) {
      time += dt;
      if (o.cancelled) return;
      const next = Math.max(0, meleeSourceTime(art, beat, time, o.weapon, o.combo));
      const delta = next - sourceTime;
      if (delta > 0) {
        const steps = Math.max(1, Math.ceil(delta * 120));
        for (let i = 0; i < steps; i++) sourceArt.update?.(delta / steps, sourceOptions);
        sourceTime = next;
      }
      if (!released && time >= beat.hit) {
        released = true;
        for (let i = 0; i < (o.combo === 2 ? 9 : 4); i++) {
          particles.spawn(P.DUST, -8 + rng.range(-4, 6), -1, rng.range(-48, -12), rng.range(-18, -5),
            rng.range(0.13, 0.25), hex("#ac8c79"), rng.range(0.6, 1.3));
        }
      }
      particles.update(dt);
    },
    drawBack(p) {
      if (!prepare(p)) return;
      sourceArt.drawBack?.(p, sourceTime, sourceOptions);
      particles.draw(p, "back");
    },
    draw(p) {
      if (!prepare(p)) return;
      sourceArt.draw(p, sourceTime, sourceOptions);
      particles.draw(p, "front");
      const age = time - beat.hit;
      if (o.combo === 2 && age >= 0 && age < 0.14) {
        const k = 1 - age / 0.14, end = 18 + Math.sqrt(clamp(age / 0.14, 0, 1)) * 25;
        const color = hex(art.echo);
        for (const side of [-1, 1]) {
          p.line(8, -1 + side, end, -1 + side * 4, color, k * 0.65);
          p.glowLine(8, -1, end, -1 + side * 3, 3, color, k * 0.15);
        }
      }
    },
  };
}
