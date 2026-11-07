// A persistent doorway, anchored at the feet. The opening reveal is controlled by the game;
// the four-second vortex itself is seamless and draws color and additive light separately.
import { fit, hex, TAU } from "../../../pixelfx/src/core/index.js";

export const GATE_PALETTES = {
  normal: ["#0b091c", "#24163d", "#403477", "#7055c0", "#a483f5", "#c9b3ff", "#e7dcff", "#ffffff"],
  final: ["#200a13", "#4c1525", "#832332", "#c74b42", "#f78854", "#ffc477", "#ffe5ac", "#fff8e5"],
  exit: ["#181322", "#39304b", "#71607c", "#ac8d6e", "#dfba7d", "#ffdda4", "#fff0cf", "#ffffff"],
};

export const meta = {
  name: "Stage doorway", desc: "A standing rift with a rotating double rim, inward spirals and floating shards.",
  tags: ["portal", "door", "loop"], size: [100, 96], origin: [50, 74],
  duration: 4, loop: true, fps: 30, bg: "ground",
  options: { palette: GATE_PALETTES.normal, reveal: 1, seed: 1 },
};

export function drawBack(p, t, o) {
  const C = fit(o.palette, 8), s = Math.max(0.02, o.reveal), ph = t / meta.duration * TAU;
  p.glow(0, -22, 40 * s, C[4], 0.17 * s);
  p.glow(0, -1, 30 * s, C[4], 0.32 * s);
  p.ellipse(0, 0, 19 * s, 4 * s, hex("#07050e"));
  p.ellipse(0, -25 * s, 12 * s, 24 * s, C[0]);
  p.ellipse(0, -25 * s, 9 * s, 21 * s, hex("#05040c"));
  // Three curling threads sink toward the dark center. Their phase closes after a whole turn.
  for (let arm = 0; arm < 3; arm++) {
    for (let j = 0; j < 38; j++) {
      const q = 0.15 + j / 38 * 0.78, a = arm * TAU / 3 + ph - q * 5;
      const x = Math.cos(a) * q * 10 * s, y = -25 * s + Math.sin(a) * q * 21 * s;
      p.dot(x, y, q > 0.65 ? C[4] : C[2], (0.35 + q * 0.5) * s);
    }
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8), s = Math.max(0.02, o.reveal), ph = t / meta.duration * TAU;
  const rx = 14 * s, ry = 25 * s, cy = -26 * s;
  // Interrupted outside rim and a bright inside rim: a slit in space, not a flat filled disc.
  for (let i = 0; i < 124; i++) {
    const a = i / 124 * TAU, pulse = 0.6 + 0.4 * Math.cos(a * 3 - ph * 2);
    const x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    p.dot(x, y, pulse > 0.86 ? C[7] : C[5], s);
    if (i % 7 < 4) p.dot(Math.cos(a) * (rx + 3), cy + Math.sin(a) * (ry + 2), C[3], s * 0.8);
  }
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + ph;
    const x = Math.cos(a) * (rx + 2), y = cy + Math.sin(a) * (ry + 1);
    p.line(x - 1, y - 2, x + 1, y + 1, C[6], s);
    p.glow(x, y, 6, C[5], 0.28 * s);
  }
  // Small sparks rise at different speeds and respawn invisibly at each end of their path.
  for (let i = 0; i < 12; i++) {
    const u = ((t / meta.duration * (1 + i % 2) + i / 12) % 1);
    const x = (Math.sin(i * 8.3 + ph) * 21 + Math.sin(u * Math.PI) * 3) * s;
    const y = -u * 59 * s, a = Math.sin(u * Math.PI) * s;
    p.dot(x, y, i % 3 ? C[5] : C[7], a);
    if (i % 3 === 0) p.glow(x, y, 4, C[4], 0.24 * a);
  }
  p.line(-15 * s, 0, 15 * s, 0, C[5], 0.8 * s);
}
