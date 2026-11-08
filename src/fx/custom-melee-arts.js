// Original sword-family accents layered over the authored pixelfx melee choreography.
// The base modules provide the readable pose and crescent; these accents give each new
// weapon a distinct material language without copying any named game's weapon art.
import { effects } from "../../../pixelfx/src/fx/index.js";
import { clamp, fit, hex } from "../../../pixelfx/src/core/index.js";

const WHITE = hex("#fffdf2");

function ramp(o) {
  return fit(o.palette, 7);
}

function wrap(base, name, desc, palette, drawAccent, drawBackAccent) {
  const baseMeta = base.meta ?? {};
  return {
    meta: {
      ...baseMeta,
      name,
      desc,
      options: { ...(baseMeta.options ?? {}), palette },
    },
    // Reuse the source act's skeleton poses so the new effect stays locked to the hero's hands.
    act: base.act,
    create(o) {
      const impl = base.create ? base.create(o) : base;
      return {
        update(dt) {
          impl.update?.(dt, o);
        },
        drawBack(p, t, opts) {
          if (base.create) impl.drawBack?.(p);
          else impl.drawBack?.(p, t, opts);
          drawBackAccent?.(p, t, opts);
        },
        draw(p, t, opts) {
          if (base.create) impl.draw?.(p);
          else impl.draw?.(p, t, opts);
          drawAccent(p, t, opts);
        },
      };
    },
  };
}

function infernoBack(p, t, o) {
  const C = ramp(o), k = clamp((t - 0.16) / 0.5) * (1 - clamp((t - 0.58) / 0.48));
  if (k <= 0) return;
  p.glow(18, 1, 28, C[3], 0.2 * k);
  p.line(-8, 1, 28, 1, C[2], 0.45 * k);
  for (let i = 0; i < 5; i++) {
    const x = -9 + i * 9 + Math.sin(t * 15 + i) * 2;
    p.dot(x, 0, C[i % 2 ? 3 : 2], 0.7 * k);
  }
}

function inferno(p, t, o) {
  const C = ramp(o), rise = clamp((t - 0.08) / 0.3), fade = 1 - clamp((t - 0.38) / 0.46);
  if (fade <= 0) return;
  for (let i = 0; i < 7; i++) {
    const u = i / 6, x = -10 + u * 58;
    const y = -7 - rise * (5 + (i % 3) * 2) + Math.sin(t * 18 + i * 1.7) * 2;
    p.line(x, y + 3, x + 2 + (i % 2), y - 3 - rise * 4, i % 3 ? C[4] : C[5], fade * (0.45 + u * 0.4));
    if (i % 2 === 0) p.glow(x + 2, y - 2, 5, C[4], fade * 0.22);
  }
  if (rise > 0.7) {
    const pop = (rise - 0.7) / 0.3;
    p.glow(42, -17, 20, C[5], pop * 0.35);
    p.dot(42, -17, WHITE, pop * 0.8);
  }
}

function frostBack(p, t, o) {
  const C = ramp(o), k = clamp((t - 0.04) / 0.35) * (1 - clamp((t - 0.5) / 0.42));
  if (k <= 0) return;
  for (let i = 0; i < 7; i++) {
    const x = -18 + i * 10;
    p.dot(x, 1 + Math.sin(i * 2.1) * 0.8, C[2], k * 0.75);
  }
}

function frost(p, t, o) {
  const C = ramp(o), grow = clamp((t - 0.12) / 0.28), fade = 1 - clamp((t - 0.42) / 0.5);
  if (fade <= 0) return;
  const shards = [[18, -16, -1], [30, -22, 1], [42, -11, -1], [51, -19, 1]];
  for (let i = 0; i < shards.length; i++) {
    const [x, y, side] = shards[i], length = (6 + i * 1.7) * grow;
    p.line(x, y, x + side * 2, y - length, C[5], fade * 0.75);
    p.line(x + side * 2, y - length, x + side * 4, y - length + 2, C[3], fade * 0.65);
    if (i % 2 === 0) p.glow(x, y - length * 0.6, 6, C[4], fade * 0.25);
  }
  const ring = 8 + grow * 18;
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + t * 1.2;
    p.dot(28 + Math.cos(a) * ring, -11 + Math.sin(a) * ring * 0.35, C[4], fade * 0.5);
  }
}

function umbralBack(p, t, o) {
  const C = ramp(o), k = clamp((t - 0.02) / 0.18) * (1 - clamp((t - 0.35) / 0.35));
  if (k <= 0) return;
  p.line(-18, 1, 40, 1, C[1], k * 0.5);
  p.glow(26, 1, 24, C[2], k * 0.2);
}

function umbral(p, t, o) {
  const C = ramp(o), sweep = clamp((t - 0.04) / 0.3), fade = 1 - clamp((t - 0.36) / 0.4);
  if (fade <= 0) return;
  for (let ghost = 0; ghost < 3; ghost++) {
    const offset = ghost * 8, x0 = -12 + sweep * (35 + offset), y0 = -24 + ghost * 5;
    p.line(x0, y0, x0 + 20, y0 - 4 + Math.sin(t * 17 + ghost) * 2, ghost ? C[2] : C[4], fade * (0.35 - ghost * 0.07));
  }
  p.glow(37, -17, 16, C[4], fade * 0.3);
  if (sweep > 0.6) {
    const k = (sweep - 0.6) / 0.4;
    p.line(42, -20, 52, -7, C[5], k * fade * 0.8);
    p.dot(52, -7, WHITE, k * fade);
  }
}

function thunderBack(p, t, o) {
  const C = ramp(o), k = clamp((t - 0.16) / 0.32) * (1 - clamp((t - 0.62) / 0.3));
  if (k <= 0) return;
  p.line(-12, 1, 48, 1, C[2], 0.45 * k);
  for (let i = 0; i < 6; i++) p.dot(-7 + i * 11, 0, C[3], k * 0.55);
}

function thunder(p, t, o) {
  const C = ramp(o), charge = clamp((t - 0.1) / 0.28), fade = 1 - clamp((t - 0.42) / 0.48);
  if (fade <= 0) return;
  const points = [[16, -21], [24, -12], [32, -18], [40, -7], [49, -14]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    p.line(a[0], a[1], b[0], b[1], i % 2 ? C[5] : C[4], fade * (0.55 + charge * 0.35));
    if (i % 2) p.glow(b[0], b[1], 5, C[4], fade * 0.22);
  }
  if (charge > 0.72) {
    const k = (charge - 0.72) / 0.28;
    p.line(43, -30, 43, -8, C[5], k * fade * 0.75);
    p.line(36, -19, 50, -19, C[5], k * fade * 0.75);
    p.dot(43, -19, WHITE, k * fade);
  }
}

function starlightBack(p, t, o) {
  const C = ramp(o), k = clamp((t - 0.02) / 0.2) * (1 - clamp((t - 0.45) / 0.36));
  if (k <= 0) return;
  p.line(5, 0, 56, 0, C[2], k * 0.45);
  p.glow(28, 0, 20, C[3], k * 0.16);
}

function starlight(p, t, o) {
  const C = ramp(o), thrust = clamp((t - 0.02) / 0.22), fade = 1 - clamp((t - 0.3) / 0.5);
  if (fade <= 0) return;
  const end = 9 + thrust * 52;
  p.glowLine(7, -18, end, -18, 5, C[4], fade * 0.4);
  p.line(7, -18, end, -18, C[5], fade * 0.78);
  p.line(7, -16, end - 6, -16, C[3], fade * 0.5);
  if (thrust > 0.62) {
    const k = (thrust - 0.62) / 0.38, x = end, y = -18;
    p.line(x - 4, y, x + 4, y, WHITE, k * fade);
    p.line(x, y - 4, x, y + 4, C[6], k * fade);
    p.glow(x, y, 10, C[5], k * fade * 0.5);
  }
}

const INFERNO = ["#261523", "#5a2637", "#a63e36", "#e76636", "#ffad4f", "#ffe0a0", "#ffffff"];
const FROST = ["#10192b", "#203c63", "#2d6f9d", "#59b7cf", "#a7eaff", "#e6fbff", "#ffffff"];
const UMBRAL = ["#141126", "#2a1d4e", "#51317b", "#744fb0", "#b18be5", "#ead7ff", "#ffffff"];
const THUNDER = ["#131b32", "#243d69", "#3d77a7", "#6eb6cf", "#b5ebff", "#e9ffff", "#ffffff"];
const STARLIGHT = ["#17142e", "#2b2f69", "#4859a8", "#778fe0", "#b8d7ff", "#eef6ff", "#ffffff"];

export const CUSTOM_MELEE_FX = Object.freeze({
  "ember-greatsword": wrap(effects["melee/heavy-cleave"], "Inferno greatsword", "A broad ember crescent that leaves burning sparks in its wake.", INFERNO, inferno, infernoBack),
  "frost-lightsword": wrap(effects["melee/holy-sword-cleave"], "Frost lightsword", "A clean ice-blue sweep that fractures into floating crystal shards.", FROST, frost, frostBack),
  "shadow-katana": wrap(effects["melee/katana-draw"], "Umbral katana", "A silent draw cut followed by violet afterimages and a shadow pin.", UMBRAL, umbral, umbralBack),
  "thunder-claymore": wrap(effects["melee/double-slash"], "Thunder claymore", "A heavy storm blade that discharges a zig-zag bolt on contact.", THUNDER, thunder, thunderBack),
  "starlight-rapier": wrap(effects["melee/rapier-lunge"], "Starlight rapier", "A precise thrust that stretches into a bright star-point lance.", STARLIGHT, starlight, starlightBack),
});
