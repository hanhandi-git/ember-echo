var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../pixelfx/src/core/math.js
var TAU = Math.PI * 2;
var clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
var lerp = (a, b, t) => a + (b - a) * t;
var fract = (x) => x - Math.floor(x);
var wrap = (x, m) => (x % m + m) % m;
var seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
var smooth = (e0, e1, x) => {
  const t = seg(x, e0, e1);
  return t * t * (3 - 2 * t);
};
var ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inExpo: (t) => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  outExpo: (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inSine: (t) => 1 - Math.cos(t * Math.PI / 2),
  outSine: (t) => Math.sin(t * Math.PI / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: (t, s = 1.70158) => t <= 0 ? 0 : t >= 1 ? 1 : (s + 1) * t * t * t - s * t * t,
  outBack: (t, s = 1.70158) => t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: (t) => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  }
};
function hash(...ns) {
  let h = 2654435769;
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
var rand = (...ns) => hash(...ns) / 4294967296;
var Rng = class {
  constructor(seed = 1) {
    this.s = seed >>> 0 || 1;
  }
  next() {
    let t = this.s = this.s + 1831565813 >>> 0;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + (b - a) * this.next();
  }
  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }
  chance(p) {
    return this.next() < p;
  }
  sign() {
    return this.next() < 0.5 ? -1 : 1;
  }
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }
  /** Roughly normal, mean 0, sd 1. */
  gauss() {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 1.732;
  }
};
var rng = (...ns) => new Rng(hash(...ns));
function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rand(i, seed), rand(i + 1, seed), u) * 2 - 1;
}
function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = rand(ix, iy, seed), b = rand(ix + 1, iy, seed), c = rand(ix, iy + 1, seed), d = rand(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
function tileNoise(x, y, px = 0, py = 0, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = px ? wrap(ix, px) : ix, x1 = px ? wrap(ix + 1, px) : ix + 1;
  const y0 = py ? wrap(iy, py) : iy, y1 = py ? wrap(iy + 1, py) : iy + 1;
  const a = rand(x0, y0, seed), b = rand(x1, y0, seed), c = rand(x0, y1, seed), d = rand(x1, y1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}

// ../pixelfx/src/core/color.js
var rgb = (r, g, b) => 255 << 24 | (b & 255) << 16 | (g & 255) << 8 | r & 255;
var red = (c) => c & 255;
var green = (c) => c >>> 8 & 255;
var blue = (c) => c >>> 16 & 255;
function hex(h) {
  if (typeof h === "number") return h;
  let s = h.replace("#", "");
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s.slice(0, 6), 16);
  return rgb(v >> 16 & 255, v >> 8 & 255, v & 255);
}
var toHex = (c) => "#" + [red(c), green(c), blue(c)].map((v) => v.toString(16).padStart(2, "0")).join("");
function mix(a, b, t) {
  t = clamp(t);
  return rgb(red(a) + (red(b) - red(a)) * t, green(a) + (green(b) - green(a)) * t, blue(a) + (blue(b) - blue(a)) * t);
}
var scale = (c, k) => rgb(Math.min(255, red(c) * k), Math.min(255, green(c) * k), Math.min(255, blue(c) * k));
var luma = (c) => (0.299 * red(c) + 0.587 * green(c) + 0.114 * blue(c)) / 255;
var ramp = (list) => list.map(hex);
function fit(r, n) {
  r = r.map(hex);
  if (r.length === n) return r;
  return Array.from({ length: n }, (_, i) => r[Math.round(i * (r.length - 1) / Math.max(1, n - 1))]);
}
var PAL = {
  fire: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
  ember: ["#1a0a0e", "#3d1012", "#701a14", "#a8301a", "#e0561e", "#ff8a2a", "#ffc46a"],
  lava: ["#14060a", "#380a10", "#6e1210", "#ac2410", "#e8501a", "#ff8c2a", "#ffd25a"],
  smoke: ["#0e0c12", "#1d1a22", "#2e2a35", "#433e4b", "#5c5664", "#7b7484", "#a39cab"],
  dust: ["#1c1610", "#33281c", "#4f3f2c", "#6e5a40", "#927a58", "#b89f78", "#dcc8a2"],
  ice: ["#0c1430", "#162c5c", "#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
  water: ["#081830", "#0e2e5a", "#14508c", "#1c76bc", "#36a2e0", "#78ccf4", "#c4ecff", "#ffffff"],
  electric: ["#0a0f2e", "#172a78", "#2550d0", "#3f8cff", "#7cc8ff", "#c8f0ff", "#ffffff"],
  volt: ["#24160a", "#5e3a0c", "#a8680f", "#e8a218", "#ffd23c", "#fff08a", "#ffffff"],
  poison: ["#0d1a0c", "#173a14", "#265e18", "#3f8a1e", "#6cb82a", "#a8e04a", "#e0ff8a"],
  holy: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
  heal: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
  arcane: ["#140a26", "#2b1252", "#481c88", "#6b2cc0", "#9a48ec", "#c684ff", "#ecc8ff", "#ffffff"],
  shadow: ["#050308", "#0f0a18", "#1c1230", "#2c1a4a", "#432468", "#5e3290", "#8048b8", "#a970e0"],
  blood: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a"],
  earth: ["#140e0a", "#2a1e14", "#47321e", "#69492a", "#8e6638", "#b88a52", "#dcb47c"],
  stone: ["#0e0e12", "#1c1c24", "#2c2c38", "#42424f", "#5c5c6b", "#7d7d8c", "#a4a4b2", "#d0d0da"],
  gold: ["#1e1206", "#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
  leaf: ["#0c1a0e", "#163418", "#225224", "#357530", "#4f9a3a", "#7cc048", "#b4e070", "#e4ffb0"],
  wood: ["#160c06", "#2e1a0c", "#4a2c14", "#6a421e", "#8e5c2c", "#b47c40", "#d8a464"],
  metal: ["#0c0e14", "#1c2230", "#2e3648", "#4a5468", "#6e7a90", "#9aa6ba", "#d0d8e6", "#ffffff"],
  bone: ["#1a1814", "#3a352c", "#5e5648", "#8a806c", "#b8ad96", "#e4dcc8", "#fffaf0"],
  neon: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
  cyber: ["#041418", "#08303a", "#0c5260", "#108088", "#18b4b0", "#4ce8d8", "#b4fff0", "#ffffff"],
  matrix: ["#020a04", "#05200c", "#0a3c16", "#106624", "#1a9a34", "#3cd650", "#a4ffa8", "#e8ffe8"],
  candy: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1"],
  night: ["#07060d", "#0c0a18", "#131026", "#1b1734", "#241f44", "#2f2956"]
};
var RAMP = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, ramp(v)]));
var WHITE = hex("#ffffff");
var BLACK = hex("#000000");
var INK = hex("#0b0a10");
var PATCH = hex("#f53cd1");

// ../pixelfx/src/core/particles.js
function fly(x, y, vx, vy, t, g = 0, drag = 0) {
  if (drag <= 0) return [x + vx * t, y + vy * t + 0.5 * g * t * t];
  const f = (1 - Math.exp(-drag * t)) / drag, vt = g / drag;
  return [x + vx * f, y + vt * t + (vy - vt) * f];
}
function cycle(t, period, count, seed, life, fn) {
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 911);
    const born = g.next() * period;
    const L4 = typeof life === "function" ? life(g) : life;
    let age = ((t - born) % period + period) % period;
    for (; age < L4; age += period) fn(age, L4, rng(seed, i), i);
  }
}

// ../pixelfx/src/core/sdf.js
function nonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative`);
}
function circle(cx, cy, r) {
  nonNegative(r, "radius");
  return (x, y) => Math.hypot(x - cx, y - cy) - r;
}
function box(cx, cy, rx, ry) {
  nonNegative(rx, "box half-width");
  nonNegative(ry, "box half-height");
  return (x, y) => {
    const dx = Math.abs(x - cx) - rx, dy = Math.abs(y - cy) - ry;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  };
}
function capsule(x0, y0, x1, y1, r) {
  nonNegative(r, "radius");
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  return (x, y) => {
    const u = l2 ? Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / l2)) : 0;
    return Math.hypot(x - x0 - dx * u, y - y0 - dy * u) - r;
  };
}
var union = (...shapes) => (x, y) => {
  let d = Infinity;
  for (const shape2 of shapes) d = Math.min(d, shape2(x, y));
  return d;
};
var intersect = (...shapes) => (x, y) => {
  let d = -Infinity;
  for (const shape2 of shapes) d = Math.max(d, shape2(x, y));
  return d;
};
var subtract = (a, b) => (x, y) => Math.max(a(x, y), -b(x, y));
var expand = (shape2, amount) => (x, y) => shape2(x, y) - amount;
var shell = (shape2, width) => {
  nonNegative(width, "shell width");
  return (x, y) => Math.abs(shape2(x, y)) - width / 2;
};
var translate = (shape2, dx, dy) => (x, y) => shape2(x - dx, y - dy);
function rotate(shape2, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return (x, y) => shape2(x * c + y * s, -x * s + y * c);
}
function scale2(shape2, k) {
  if (!(k > 0) || !Number.isFinite(k)) throw new RangeError("SDF scale must be finite and positive");
  return (x, y) => shape2(x / k, y / k) * k;
}
function distanceTransform(features, w, h) {
  const data = Float64Array.from(features, (v) => v ? 0 : Infinity);
  const n = Math.max(w, h), f = new Float64Array(n), out = new Float64Array(n);
  const sites = new Int32Array(n), cuts = new Float64Array(n + 1);
  const pass = (size) => {
    let last2 = -1;
    for (let q = 0; q < size; q++) {
      if (!Number.isFinite(f[q])) continue;
      let cut2 = -Infinity;
      while (last2 >= 0) {
        const v = sites[last2];
        cut2 = (f[q] + q * q - (f[v] + v * v)) / (2 * (q - v));
        if (cut2 > cuts[last2]) break;
        last2--;
      }
      sites[++last2] = q;
      cuts[last2] = last2 === 0 ? -Infinity : cut2;
      cuts[last2 + 1] = Infinity;
    }
    let k = 0;
    for (let q = 0; q < size; q++) {
      if (last2 < 0) {
        out[q] = Infinity;
        continue;
      }
      while (k < last2 && cuts[k + 1] < q) k++;
      out[q] = (q - sites[k]) ** 2 + f[sites[k]];
    }
  };
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = data[y * w + x];
    pass(h);
    for (let y = 0; y < h; y++) data[y * w + x] = out[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = data[y * w + x];
    pass(w);
    for (let x = 0; x < w; x++) data[y * w + x] = out[x];
  }
  return data;
}
function fromMask(mask, x = 0, y = 0) {
  const { w, h, data } = mask;
  if (!Number.isInteger(w) || w < 1 || !Number.isInteger(h) || h < 1 || !data || data.length !== w * h)
    throw new TypeError("mask needs positive integer w,h and w*h data cells");
  const W7 = w + 2, H4 = h + 2, inside2 = new Uint8Array(W7 * H4);
  let count = 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    if (data[j * w + i]) {
      inside2[(j + 1) * W7 + i + 1] = 1;
      count++;
    }
  if (!count) return () => Infinity;
  const toInside = distanceTransform(inside2, W7, H4);
  const toOutside = distanceTransform(inside2.map((v) => 1 - v), W7, H4);
  const distances = Float32Array.from(inside2, (v, i) => v ? 0.5 - Math.sqrt(toOutside[i]) : Math.sqrt(toInside[i]) - 0.5);
  return (px, py) => {
    const ix = Math.floor(px - x) + 1, iy = Math.floor(py - y) + 1;
    const sx = Math.max(0, Math.min(W7 - 1, ix)), sy = Math.max(0, Math.min(H4 - 1, iy));
    return distances[sy * W7 + sx] + Math.hypot(ix - sx, iy - sy);
  };
}
function toMask(shape2, w, h, x = 0, y = 0) {
  if (!Number.isInteger(w) || w < 1 || !Number.isInteger(h) || h < 1)
    throw new RangeError("mask dimensions must be positive integers");
  const data = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    data[j * w + i] = shape2(x + i + 0.5, y + j + 0.5) <= 0 ? 1 : 0;
  return { w, h, data };
}
var SDF = Object.freeze({
  circle,
  box,
  capsule,
  union,
  intersect,
  subtract,
  expand,
  shell,
  translate,
  rotate,
  scale: scale2,
  fromMask,
  toMask
});

// ../pixelfx/src/core/sim.js
var GRAVITY = 950;
var CROSS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
var DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
var HOT = ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"].map(hex);
var FIRE_RAMP = ["#ffffff", "#fff3a6", "#ffe26b", "#ffc23d", "#ff8a2a", "#f2561d", "#c9281f", "#8a1f17", "#4a1712"].map(hex);
var SMOKE_RAMP = ["#7b6f72", "#5d5660", "#433d48", "#2b2630", "#1a171e"].map(hex);
var rampAt = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];
var P = { SPARK: 0, MOTE: 1, STREAK: 2, FLAKE: 3, VAPOUR: 4, DUST: 5, STAR: 6, EMBER: 7, SMOKE: 8, FIRE: 9, BRAND: 10, GRIT: 11 };
var PF = { SMOKES: 1, BIG: 2, BACK: 4 };
var SOFT = /* @__PURE__ */ new Set([P.VAPOUR, P.DUST, P.SMOKE]);
var Particles = class {
  constructor(opts = {}) {
    this.R = opts.rng ?? new Rng(opts.seed ?? 1);
    this.list = [];
    this.t = 0;
    this.ground = opts.ground ?? (() => Infinity);
    this.sparks = (opts.sparks ?? HOT).map(hex);
    this.haze = opts.haze === void 0 ? null : hex(opts.haze);
    this.onLand = opts.onLand ?? null;
    this.field = opts.field ?? null;
  }
  /** delay: seconds before it appears; flag: PF bits. col 0 lets FIRE and SMOKE use their own ramps. */
  spawn(k, x, y, vx, vy, life, col = WHITE, size = 1, delay = 0, flag = 0) {
    this.list.push({ k, x, y, vx, vy, life, max: life, col: col ? hex(col) : 0, size, seed: this.R.next() * 100, delay, flag });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    this.t += dt;
    const R4 = this.R, t = this.t;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      if ((p.life -= dt) <= 0) {
        if (p.k === P.FIRE && p.flag & PF.SMOKES) {
          const big = p.flag & PF.BIG;
          this.spawn(P.SMOKE, p.x, p.y, p.vx * 0.6, p.vy * 0.6 - 6, big ? R4.range(1.3, 2.3) : R4.range(0.8, 1.4), 0, p.size * (big ? 0.85 : 0.7), 0, big ? PF.BIG : 0);
        }
        this.list.splice(i, 1);
        continue;
      }
      if (this.field) {
        const [ax, ay] = this.field(p.x, p.y, t - dt);
        p.vx += ax * dt;
        p.vy += ay * dt;
      }
      switch (p.k) {
        case P.FIRE:
          p.vy -= 95 * dt;
          p.vx += Math.sin(t * 17 + p.seed) * 30 * dt;
          p.vx -= p.vx * 5 * dt;
          p.vy -= p.vy * 3.2 * dt;
          break;
        case P.GRIT: {
          p.vy += GRAVITY * dt;
          p.vx -= p.vx * 0.8 * dt;
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) {
            p.y = g - 0.25;
            if (p.vy > 130 && R4.chance(0.4)) p.vy = -p.vy * 0.25, p.vx = p.vx * 0.5 + R4.range(-10, 10);
            else p.vx = p.vy = 0, p.life = Math.min(p.life, 0.5);
          } else p.y = ny;
          continue;
        }
        case P.BRAND: {
          p.vy += GRAVITY * 0.8 * dt;
          p.vx -= p.vx * 0.9 * dt;
          if (R4.chance(0.9 * Math.min(1, dt * 60))) this.spawn(P.FIRE, p.x, p.y, p.vx * 0.1 + R4.range(-7, 7), p.vy * 0.1 - 10, R4.range(0.16, 0.32), 0, R4.range(0.9, 1.7) * (0.5 + p.life / p.max * 0.6), 0, R4.chance(0.4) ? PF.SMOKES : 0);
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) {
            this.onLand?.(p.x, g);
            this.list.splice(i, 1);
          } else p.y = ny;
          continue;
        }
        case P.SPARK: {
          p.vy += GRAVITY * 0.45 * dt;
          p.vx -= p.vx * 2.2 * dt;
          p.vy -= p.vy * 2.2 * dt;
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) p.vy = -p.vy * 0.45, p.vx *= 0.7, p.y = g - 0.25;
          else p.y = ny;
          continue;
        }
        case P.STREAK:
          p.vx += p.vx * 3 * dt, p.vy += p.vy * 3 * dt;
          break;
        case P.FLAKE:
          p.vx -= p.vx * 2.2 * dt;
          p.vy -= p.vy * 2.2 * dt - 35 * dt;
          p.x += Math.sin(this.t * 2.5 + p.seed) * 7 * dt;
          break;
        case P.EMBER:
          p.vy += (-30 + Math.sin(t * 3 + p.seed) * 20) * dt;
          p.vx += Math.cos(t * 2.3 + p.seed) * 45 * dt;
          p.vx -= p.vx * 1.6 * dt;
          p.vy -= p.vy * 1.6 * dt;
          break;
        case P.SMOKE: {
          const big = p.flag & PF.BIG;
          p.vy -= (big ? 23 : 16) * dt;
          p.vx += Math.sin(t * 1.3 + p.seed) * 8 * dt;
          p.vx -= p.vx * 1.6 * dt;
          p.vy -= p.vy * 1.2 * dt;
          break;
        }
        case P.MOTE:
          p.vx -= p.vx * 0.6 * dt;
          p.vy -= p.vy * 0.6 * dt;
          break;
        default: {
          const drag = SOFT.has(p.k) ? 4 : 1.6;
          p.vx -= p.vx * drag * dt;
          p.vy -= p.vy * drag * dt + 5 * dt;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  draw(p, layer) {
    for (const q of this.list) {
      if (q.delay > 0) continue;
      if (layer && (SOFT.has(q.k) || q.flag & PF.BACK ? "back" : "front") !== layer) continue;
      const k = q.life / q.max, x = q.x, y = q.y, sp = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / sp, uy = q.vy / sp;
      switch (q.k) {
        case P.SPARK: {
          const S = this.sparks, head4 = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2], len2 = Math.min(9, 1 + sp * 0.022);
          p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.4, y - uy * len2 * 0.4, k > 0.5 ? head4 : S[S.length - 1]);
          p.line(x - ux * len2 * 0.45, y - uy * len2 * 0.45, x, y, head4);
          p.glow(x, y, 3, head4, 0.45 * k);
          break;
        }
        case P.MOTE: {
          const len2 = Math.min(16, 0.5 + sp * 0.026) * q.size, a = k < 0.35 ? k / 0.35 : 1;
          p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.35, y - uy * len2 * 0.35, scale(q.col, 0.55), a);
          p.line(x - ux * len2 * 0.4, y - uy * len2 * 0.4, x, y, q.col, a);
          p.glow(x, y, 2.5 + q.size, q.col, 0.4 * k);
          break;
        }
        case P.STREAK: {
          const L4 = clamp(sp / 30, 1, 7);
          for (let d = L4; d >= 0; d -= 0.5) p.dot(x - ux * d, y - uy * d, d < 1 ? WHITE : d < L4 * 0.5 ? q.col : scale(q.col, 0.6), d < L4 * 0.5 ? 1 : 1.2 - d / L4);
          p.glow(x, y, 4, q.col, 0.4);
          break;
        }
        case P.FLAKE: {
          const a = Math.min(1, k * 3);
          p.dot(x, y, q.col, a);
          if (q.size > 1.3) for (const [dx, dy] of CROSS) p.dot(x + dx, y + dy, scale(q.col, 0.8), a * 0.8);
          break;
        }
        case P.VAPOUR: {
          const r = q.size * (0.6 + (1 - k) * 0.9);
          p.disc(x, y, r, q.col, Math.pow(k, 1.3) * 0.45);
          if (this.haze) p.glow(x, y, r * 1.8, this.haze, 0.16 * k);
          break;
        }
        case P.DUST:
          p.disc(x, y, q.size * (0.6 + (1 - k) * 0.9), q.col, Math.pow(k, 1.3) * 0.7);
          break;
        case P.SMOKE: {
          const age = 1 - k, big = q.flag & PF.BIG;
          const r = q.size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
          const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58);
          const c = q.col ? mix(q.col, rampAt(SMOKE_RAMP, age), age) : rampAt(SMOKE_RAMP, age * 1.05);
          p.disc(x, y, r, c, a * 0.45);
          p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
          if (age < 0.5) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
          break;
        }
        case P.FIRE: {
          const age = 1 - k, heat2 = Math.min(0.999, Math.pow(age, 0.62) + q.seed % 1 * 0.1), F = FIRE_RAMP, n = F.length;
          const idx = Math.min(n - 2, Math.floor(heat2 * (n - 1)));
          const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = F[idx];
          if (idx >= n - 2) p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
          else {
            p.circle(x, y, r, F[Math.min(n - 1, idx + 2)]);
            p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
            if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
            if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, F[Math.max(0, idx - 1)]);
            if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
          }
          break;
        }
        case P.BRAND:
          p.circle(x, y, 1.6, HOT[3]);
          p.px(x, y, Math.sin(this.t * 40 + q.seed) > 0 ? HOT[0] : HOT[1]);
          p.px(x + 1, y, HOT[1]);
          p.glow(x, y, 7, HOT[2], 0.45);
          break;
        case P.GRIT:
          if (k > 0.25 || k * 4 > 0.5) {
            p.px(x, y, q.col);
            if (q.size >= 2) p.px(x + 1, y, q.col), p.px(x, y + 1, scale(q.col, 0.8)), p.px(x + 1, y + 1, scale(q.col, 0.7));
          }
          break;
        case P.EMBER: {
          const c = k > 0.6 ? this.sparks[0] : k > 0.3 ? this.sparks[1] : this.sparks[2];
          if (k < 0.25 && Math.sin(this.t * 40 + q.seed) < 0) break;
          p.px(x, y, c);
          if (q.size > 1.5) p.px(x, y + 1, this.sparks[this.sparks.length - 1]);
          p.glow(x, y, 3 + q.size, c, 0.35 * k);
          break;
        }
        default: {
          const tw = 0.6 + 0.4 * Math.sin(this.t * (8 + q.seed % 5) + q.seed);
          if (q.size < 1) {
            if (tw * k > 0.25) p.px(x, y, tw > 0.8 ? WHITE : q.col);
            p.glow(x, y, 3, q.col, 0.4 * k * tw);
            break;
          }
          sparkle(p, x, y, q.size * tw * Math.min(1, k * 3), q.col, scale(q.col, 0.75), 0.5 * k * tw);
        }
      }
    }
  }
};
var Blazes = class {
  constructor(ps) {
    this.ps = ps;
    this.list = [];
  }
  add(x, y, life, power) {
    this.list.push({ x, y, life, max: life, acc: this.ps.R.next(), power });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    const ps = this.ps, R4 = ps.R;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if ((b.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      const k = b.life / b.max, intensity = b.power * (k > 0.7 ? 1 : 0.35 + k / 0.7 * 0.65);
      for (b.acc += dt * (6 + 16 * intensity); b.acc > 1; b.acc--) {
        const s = R4.range(1.2, 2.8) * intensity;
        ps.spawn(P.FIRE, b.x + R4.range(-1.5, 1.5), b.y - s * 0.6, R4.range(-6, 6), R4.range(-30, -12), R4.range(0.28, 0.6), 0, s, 0, PF.BACK | (R4.chance(0.3) ? PF.SMOKES : 0));
        if (R4.chance(0.06)) ps.spawn(P.EMBER, b.x, b.y - 1.5, R4.range(-15, 15), R4.range(-45, -15), R4.range(0.6, 1.4), HOT[2], 1, 0, PF.BACK);
      }
    }
  }
  drawBack(p) {
    for (const b of this.list) {
      const k = b.life / b.max;
      p.px(b.x, b.y, k > 0.4 ? Math.sin(b.life * 31 + b.x) > 0 ? HOT[1] : HOT[2] : HOT[3]);
      p.glow(b.x, b.y, 6 + 5 * k * b.power, HOT[2], 0.3 * k * b.power);
    }
  }
};
var B = { SHARD: 0, CHUNK: 1, DRIP: 2 };
var Bits = class {
  constructor(opts = {}) {
    this.list = [];
    this.ground = opts.ground ?? (() => Infinity);
  }
  add(b) {
    const life = b.life ?? 1;
    this.list.push({ kind: B.SHARD, vx: 0, vy: 0, a: 0, va: 0, s: 1, c: WHITE, g: 1, drag: 0, bounce: 0, rest: false, ...b, life, max: life });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if ((b.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      if (b.rest) continue;
      b.vy += GRAVITY * b.g * dt;
      b.vx -= b.vx * b.drag * dt;
      b.vy -= b.vy * b.drag * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.va * dt;
      const floor = this.ground(b.x), sp = b.vy;
      if (b.g <= 0 || b.y < floor || sp <= 0) continue;
      b.y = floor - 0.01;
      if (b.kind === B.DRIP) b.life = 0;
      else if (b.bounce > 0 && sp > 70) b.vy = -sp * b.bounce, b.vx *= 0.7, b.va *= 0.6;
      else b.rest = true, b.vx = b.vy = 0;
    }
  }
  draw(p) {
    for (const b of this.list) {
      const a = Math.min(1, b.life / 0.4), ca = Math.cos(b.a), sa = Math.sin(b.a);
      if (b.kind === B.SHARD) {
        for (let d = -b.s / 2; d <= b.s / 2; d += 0.5) p.dot(b.x + ca * d, b.y + sa * d, d > b.s / 2 - 0.6 ? WHITE : hex(b.c), a);
      } else if (b.kind === B.DRIP) {
        p.dot(b.x, b.y, hex(b.c), a);
        p.dot(b.x, b.y - 1, hex(b.c), a * 0.5);
      } else {
        const R4 = (b.ramp ?? ["#1c2030", "#3a4a66", "#6e86a8", "#a8c0dc", "#e8f2ff"]).map(hex), n = R4.length;
        const x = Math.round(b.x), y = Math.round(b.y), r = Math.ceil(b.s) + 1;
        for (let py = -r; py <= r; py++)
          for (let px = -r; px <= r; px++) {
            const u = (px + 0.5) * ca + (py + 0.5) * sa, v = -(px + 0.5) * sa + (py + 0.5) * ca;
            const d = Math.abs(u) / b.s + Math.abs(v) / (b.s * 0.62);
            if (d > 1.3) continue;
            p.dot(x + px, y + py, d > 1 ? R4[0] : v < 0 ? u < 0 ? R4[n - 1] : R4[n - 2] : u < 0 ? R4[n - 3] : R4[Math.max(1, n - 4)], a);
          }
      }
    }
  }
};
var Lights = class {
  constructor() {
    this.list = [];
  }
  add(x, y, r, color, k, life) {
    this.list.push({ x, y, r, color: hex(color), k, life, max: life });
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].life -= dt) <= 0) this.list.splice(i, 1);
  }
  draw(p) {
    for (const l of this.list) {
      const k = l.life / l.max;
      p.glow(l.x, l.y, l.r * (0.55 + 0.45 * k), l.color, l.k * k * k);
    }
  }
};
function sparkle(p, x, y, arm, c, tip = c, k = 0.6) {
  const n = Math.round(arm);
  if (n < 1) return;
  const X = Math.floor(x), Y = Math.floor(y);
  for (let d = 1; d <= n; d++) {
    const cc = d > n * 0.6 ? tip : c;
    for (const [dx, dy] of CROSS) p.px(X + dx * d, Y + dy * d, cc);
  }
  if (n >= 3) for (const [dx, dy] of DIAG) p.px(X + dx, Y + dy, c);
  if (n >= 6) for (const [dx, dy] of DIAG) p.px(X + dx * 2, Y + dy * 2, tip);
  p.px(X, Y, WHITE);
  p.glow(x, y, 4 + n * 2, c, k);
}
function flare(p, x, y, L4, k, ramp2) {
  if (L4 < 1) return;
  const R4 = ramp2.map(hex), n = R4.length;
  for (let i = 0; i < 8; i++) {
    const an = i * Math.PI / 4, len2 = i % 4 === 0 ? L4 : i % 2 === 0 ? L4 * 0.6 : L4 * 0.3, ca = Math.cos(an), sa = Math.sin(an);
    for (let d = 0; d <= len2; d += 0.5) {
      const u = d / len2;
      p.dot(x + ca * d, y + sa * d, u < 0.35 ? WHITE : u < 0.7 ? R4[n - 2] : R4[n - 3], u < 0.6 ? 1 : k * 1.5 * (1 - u) + 0.2);
    }
  }
}
function band(p, cx, cy, r, sy, th, k, ramp2, keep2 = () => true, hot = false) {
  if (r <= 0 || k <= 0) return;
  const R4 = ramp2.map(hex), n = R4.length;
  for (let j = 0, m = Math.ceil(r * TAU * 1.2); j < m; j++) {
    const ang = j / m * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
    if (!keep2(ang)) continue;
    for (let o = th; o >= 0; o -= 0.5) {
      const u = o / th, c = u < 0.15 ? hot ? WHITE : R4[n - 1] : u < 0.4 ? R4[n - 2] : u < 0.7 ? R4[n - 3] : R4[n - 4];
      p.dot(cx + ca * (r - o), cy + sa * (r - o) * sy, c, k * (u < 0.4 ? 1.2 : 1.15 - u));
    }
  }
}
function crystal(p, x, base, h, w, lean, ramp2, opts = {}) {
  if (h < 1.5) return;
  const R4 = ramp2.map(hex), n = R4.length, C5 = (i) => R4[Math.max(0, n - 1 - i)];
  const a = opts.a ?? 1, top = base - h, ridge0 = x - w * 0.14, glint2 = opts.glint ?? -1;
  const inside2 = (px, py) => {
    const u = (base - (py + 0.5)) / h;
    return u >= 0 && u <= 1 && Math.abs(px + 0.5 - (x + lean * u)) <= w / 2 * (1 - u) + 0.35;
  };
  for (let py = Math.floor(top) - 1; py < Math.ceil(base); py++)
    for (let px = Math.floor(x - w / 2 - Math.abs(lean) - 2); px <= Math.ceil(x + w / 2 + Math.abs(lean) + 2); px++) {
      if (!inside2(px, py)) {
        if (inside2(px - 1, py) || inside2(px + 1, py) || inside2(px, py + 1) || inside2(px, py - 1) && py < base - 1) p.dot(px, py, R4[0], a);
        continue;
      }
      if (opts.white) {
        p.dot(px, py, WHITE, a);
        continue;
      }
      const u = (base - (py + 0.5)) / h, rx = ridge0 + (x + lean - ridge0) * u, c = x + lean * u, hw = w / 2 * (1 - u) + 0.35, fx = px + 0.5;
      let col = u > 0.9 ? WHITE : Math.abs(fx - rx) < 0.55 ? C5(1) : fx < rx ? fx - (c - hw) < 1 ? C5(1) : (fx - (c - hw)) / Math.max(1, rx - (c - hw)) > 0.55 ? C5(2) : C5(3) : c + hw - fx < 1.2 ? C5(Math.min(n - 2, 6)) : (fx - rx) / Math.max(1, c + hw - rx) > 0.5 ? C5(5) : C5(4);
      if (glint2 >= 0 && fx <= rx + 0.6) {
        const g = Math.abs(u - glint2);
        if (g < 0.05) col = WHITE;
        else if (g < 0.1) col = C5(1);
      }
      p.dot(px, py, col, a);
    }
}

// ../pixelfx/src/core/font.js
var MINI = {
  A: ".#.|#.#|###|#.#|#.#",
  B: "##.|#.#|##.|#.#|##.",
  C: ".##|#..|#..|#..|.##",
  D: "##.|#.#|#.#|#.#|##.",
  E: "###|#..|##.|#..|###",
  F: "###|#..|##.|#..|#..",
  G: ".##|#..|#.#|#.#|.##",
  H: "#.#|#.#|###|#.#|#.#",
  I: "###|.#.|.#.|.#.|###",
  J: "..#|..#|..#|#.#|.#.",
  K: "#.#|#.#|##.|#.#|#.#",
  L: "#..|#..|#..|#..|###",
  M: "#.#|###|###|#.#|#.#",
  N: "##.|#.#|#.#|#.#|#.#",
  O: ".#.|#.#|#.#|#.#|.#.",
  P: "##.|#.#|##.|#..|#..",
  Q: ".#.|#.#|#.#|##.|.##",
  R: "##.|#.#|##.|#.#|#.#",
  S: ".##|#..|.#.|..#|##.",
  T: "###|.#.|.#.|.#.|.#.",
  U: "#.#|#.#|#.#|#.#|###",
  V: "#.#|#.#|#.#|#.#|.#.",
  W: "#.#|#.#|###|###|#.#",
  X: "#.#|#.#|.#.|#.#|#.#",
  Y: "#.#|#.#|.#.|.#.|.#.",
  Z: "###|..#|.#.|#..|###",
  0: "###|#.#|#.#|#.#|###",
  1: ".#.|##.|.#.|.#.|###",
  2: "##.|..#|.#.|#..|###",
  3: "##.|..#|.#.|..#|##.",
  4: "#.#|#.#|###|..#|..#",
  5: "###|#..|##.|..#|##.",
  6: ".##|#..|###|#.#|###",
  7: "###|..#|.#.|.#.|.#.",
  8: "###|#.#|###|#.#|###",
  9: "###|#.#|###|..#|##.",
  "+": "...|.#.|###|.#.|...",
  "-": "...|...|###|...|...",
  "!": "#|#|#|.|#",
  "?": "##.|..#|.#.|...|.#.",
  ".": ".|.|.|.|#",
  ",": "..|..|..|.#|#.",
  ":": ".|#|.|#|.",
  "/": "..#|..#|.#.|#..|#..",
  "%": "#.#|..#|.#.|#..|#.#",
  x: "...|#.#|.#.|#.#|...",
  "*": "#.#|.#.|#.#|...|...",
  "'": "#|#|.|.|.",
  "(": ".#|#.|#.|#.|.#",
  ")": "#.|.#|.#|.#|#.",
  "<": "..#|.#.|#..|.#.|..#",
  ">": "#..|.#.|..#|.#.|#..",
  "=": "...|###|...|###|...",
  _: "...|...|...|...|###",
  "#": "#.#|###|#.#|###|#.#"
};
var BIG = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
  B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####",
  F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####",
  H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "###|.#.|.#.|.#.|.#.|.#.|###",
  J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
  L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
  N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
  P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
  R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.",
  T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
  X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
  Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
  1: ".#.|##.|.#.|.#.|.#.|.#.|###",
  2: ".###.|#...#|....#|...#.|..#..|.#...|#####",
  3: "#####|...#.|..#..|...#.|....#|#...#|.###.",
  4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
  5: "#####|#....|####.|....#|....#|#...#|.###.",
  6: "..##.|.#...|#....|####.|#...#|#...#|.###.",
  7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
  8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
  9: ".###.|#...#|#...#|.####|....#|...#.|.##..",
  "!": "#|#|#|#|#|.|#",
  "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
  "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
  "-": "....|....|....|####|....|....|....",
  ".": ".|.|.|.|.|.|#",
  ",": "..|..|..|..|..|.#|#.",
  ":": ".|.|#|.|.|#|.",
  "/": "....#|....#|...#.|..#..|.#...|#....|#....",
  "%": "##...|##..#|...#.|..#..|.#...|#..##|...##",
  x: ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",
  "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..|.....",
  "'": "#|#|.|.|.|.|.",
  "<": "...#|..#.|.#..|#...|.#..|..#.|...#",
  ">": "#...|.#..|..#.|...#|..#.|.#..|#...",
  "=": "....|....|####|....|####|....|....",
  "(": "..#|.#.|#..|#..|#..|.#.|..#",
  ")": "#..|.#.|..#|..#|..#|.#.|#..",
  "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#."
};
function build(table, h) {
  const out = {};
  for (const [ch, src] of Object.entries(table)) {
    const rows = src.split("|");
    out[ch] = { w: rows[0].length, rows: rows.map((r) => [...r].map((c) => c === "#")) };
    if (rows.length !== h) throw new Error(`glyph ${ch} has ${rows.length} rows, expected ${h}`);
  }
  return out;
}
var FONTS = {
  mini: { h: 5, space: 2, gap: 1, glyphs: build(MINI, 5) },
  big: { h: 7, space: 3, gap: 1, glyphs: build(BIG, 7) }
};
function textWidth(str, font = "mini") {
  const F = FONTS[font];
  let w = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
    w += (g ? g.w : F.space) + F.gap;
  }
  return Math.max(0, w - F.gap);
}
function rasterText(str, font, plot2) {
  const F = FONTS[font];
  let x = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
    if (!g) {
      x += F.space + F.gap;
      continue;
    }
    for (let r = 0; r < F.h; r++) for (let c = 0; c < g.w; c++) if (g.rows[r][c]) plot2(x + c, r);
    x += g.w + F.gap;
  }
}

// ../pixelfx/src/core/painter.js
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
var OUT = { c: 0, a: 1, l: 0, k: 0 };
var sprites = /* @__PURE__ */ new WeakMap();
var call = (v, ...args) => typeof v === "function" ? v(...args) : v;
var Painter = class {
  constructor(frame3) {
    this.frame = frame3;
    this.reset();
  }
  /** Re-read the frame and clear placement, fade and light strength. */
  reset() {
    const f = this.frame;
    this.w = f.w;
    this.h = f.h;
    this.ox = f.ox | 0;
    this.oy = f.oy | 0;
    this.C = f.color;
    this.L = f.light;
    this.tx = 0;
    this.ty = 0;
    this.fx = 1;
    this.cs = 1;
    this.sn = 0;
    this.fade = 1;
    this.lightK = 1;
    this.layer = "front";
    return this;
  }
  /** Put the effect's origin at (x, y) in frame space, mirrored if flip, rotated by angle (radians). */
  place(x, y, flip = false, angle = 0) {
    this.tx = x;
    this.ty = y;
    this.fx = flip ? -1 : 1;
    this.cs = Math.cos(angle);
    this.sn = Math.sin(angle);
    return this;
  }
  // ---- transforms: local (effect) space <-> screen (frame) space
  toX(x, y) {
    return this.tx + x * this.fx * this.cs - y * this.sn;
  }
  toY(x, y) {
    return this.ty + x * this.fx * this.sn + y * this.cs;
  }
  fromX(sx, sy) {
    const dx = sx - this.tx, dy = sy - this.ty;
    return (dx * this.cs + dy * this.sn) * this.fx;
  }
  fromY(sx, sy) {
    const dx = sx - this.tx, dy = sy - this.ty;
    return -dx * this.sn + dy * this.cs;
  }
  // the screen pixel of the local pixel cell holding (x, y): mirrors and rotations land on whole cells
  cellX(x, y) {
    return Math.floor(this.toX(Math.floor(x) + 0.5, Math.floor(y) + 0.5));
  }
  cellY(x, y) {
    return Math.floor(this.toY(Math.floor(x) + 0.5, Math.floor(y) + 0.5));
  }
  // ---- raw writes, screen space, whole pixels. Color 0 means "nothing": it never erases what's there.
  put(sx, sy, c, a = 1) {
    if (!c) return;
    a *= this.fade;
    if (a < 1 && a <= BAYER[(sy & 3) << 2 | sx & 3]) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.C[y * this.w + x] = c;
  }
  add(sx, sy, c, k = 1) {
    k *= this.fade * this.lightK;
    if (k <= 4e-3) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, d = this.L[i];
    const r = Math.min(255, (d & 255) + (c & 255) * k) | 0;
    const g = Math.min(255, (d >>> 8 & 255) + (c >>> 8 & 255) * k) | 0;
    const b = Math.min(255, (d >>> 16 & 255) + (c >>> 16 & 255) * k) | 0;
    this.L[i] = 255 << 24 | b << 16 | g << 8 | r;
  }
  /**
   * Blend a color over what's there at alpha a (0..1), keeping the result's own alpha: soft smoke, vapour and
   * mist. Use dithered dot() for hard pixel fades and blend() for translucent volumes.
   */
  blendPx(sx, sy, c, a) {
    a *= this.fade;
    if (!c || a <= 4e-3) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, d = this.C[i], da = (d >>> 24) / 255, oa = a + da * (1 - a), k = a / oa;
    const ch = (s) => (c >>> s & 255) * k + (d >>> s & 255) * (1 - k) & 255;
    this.C[i] = (oa * 255 & 255) << 24 | ch(16) << 16 | ch(8) << 8 | ch(0);
  }
  /** Translucent pixel at a local point. */
  blend(x, y, c, a) {
    this.blendPx(this.cellX(x, y), this.cellY(x, y), c, a);
  }
  /** A translucent disc: puffs of smoke, vapour, dust. c and a may be functions of (d: 0 center..1 rim, angle). */
  disc(cx, cy, r, c, a) {
    if (r < 0.5) return this.blend(cx, cy, call(c, 0, 0), call(a, 0, 0));
    this.each(cx - r, cy - r, cx + r, cy + r, (x, y, sx, sy) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
      this.blendPx(sx, sy, call(c, d, ang), call(a, d, ang));
    });
  }
  /** Read back the color under a local point (0 if empty). */
  get(x, y) {
    const sx = this.cellX(x, y) - this.ox, sy = this.cellY(x, y) - this.oy;
    return sx < 0 || sy < 0 || sx >= this.w || sy >= this.h ? 0 : this.C[sy * this.w + sx];
  }
  // ---- pixels
  /** One opaque pixel. */
  px(x, y, c) {
    this.put(this.cellX(x, y), this.cellY(x, y), c, 1);
  }
  /** One pixel at alpha a (0..1), faded by ordered dither. */
  dot(x, y, c, a = 1) {
    if (a > 0) this.put(this.cellX(x, y), this.cellY(x, y), c, a);
  }
  /** Add light to one pixel. */
  light(x, y, c, k = 1) {
    this.add(this.cellX(x, y), this.cellY(x, y), c, k);
  }
  /**
   * Visit every screen pixel whose center falls in the local box [x0, x1] x [y0, y1], with that center in
   * local space: fn(lx, ly, sx, sy). The basis of every filled shape, so shapes mirror and rotate exactly.
   */
  each(x0, y0, x1, y1, fn) {
    let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
    for (let k = 0; k < 4; k++) {
      const x = k & 1 ? x1 : x0, y = k & 2 ? y1 : y0, sx = this.toX(x, y), sy = this.toY(x, y);
      if (sx < ax) ax = sx;
      if (sx > bx) bx = sx;
      if (sy < ay) ay = sy;
      if (sy > by) by = sy;
    }
    const sx0 = Math.max(Math.floor(ax), this.ox), sx1 = Math.min(Math.ceil(bx), this.ox + this.w - 1);
    const sy0 = Math.max(Math.floor(ay), this.oy), sy1 = Math.min(Math.ceil(by), this.oy + this.h - 1);
    for (let sy = sy0; sy <= sy1; sy++)
      for (let sx = sx0; sx <= sx1; sx++) {
        const cx = sx + 0.5, cy = sy + 0.5;
        fn(this.fromX(cx, cy), this.fromY(cx, cy), sx, sy);
      }
  }
  /**
   * A pixel shader over a local box. fn(x, y, out) returns a color, or sets out.c (color), out.a (alpha),
   * out.l (light color, defaults to out.c) and out.k (light amount). Return nothing to leave the pixel alone.
   */
  shade(x0, y0, x1, y1, fn) {
    const o = OUT;
    this.each(x0, y0, x1, y1, (lx, ly, sx, sy) => {
      o.c = 0;
      o.a = 1;
      o.l = 0;
      o.k = 0;
      const c = fn(lx, ly, o) || o.c;
      if (c) this.put(sx, sy, c, o.a);
      if (o.k > 0) this.add(sx, sy, o.l || c, o.k);
    });
  }
  // ---- shapes. Colors (c) and alphas (a) can be numbers or functions of the shape's own coordinates.
  /** 1 px line. c and a may be functions of u (0 at the start, 1 at the end). */
  line(x0, y0, x1, y1, c, a = 1) {
    let sx = this.cellX(x0, y0), sy = this.cellY(x0, y0);
    const ex = this.cellX(x1, y1), ey = this.cellY(x1, y1);
    const dx = Math.abs(ex - sx), dy = -Math.abs(ey - sy), stepx = sx < ex ? 1 : -1, stepy = sy < ey ? 1 : -1;
    const n = Math.max(dx, -dy) || 1, fc = typeof c === "function", fa = typeof a === "function";
    let err = dx + dy, i = 0;
    for (; ; ) {
      const u = i++ / n;
      this.put(sx, sy, fc ? c(u) : c, fa ? a(u) : a);
      if (sx === ex && sy === ey) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        sx += stepx;
      }
      if (e2 <= dx) {
        err += dx;
        sy += stepy;
      }
    }
  }
  /** Lines through a list of points [[x, y], ...]. */
  polyline(pts, c, a = 1) {
    for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, a);
  }
  /**
   * Stroke a compiled createPath(). width may depend on arc-length progress u; c/a may depend on (u,v),
   * where v is 0 at the center and 1 at the edge. from/to select a normalized distance interval, useful
   * for writing paths and moving trails. Sampling includes the path's corners and uses <= 1 px steps.
   */
  strokePath(path, width, c, a = 1, from = 0, to = 1) {
    from = clamp(from);
    to = clamp(to);
    if (to <= from) return;
    if (!path.length) {
      const q = path.sample(from), w = call(width, from);
      if (w > 0) this.circle(q.x, q.y, w / 2, (v) => call(c, from, v), (v) => call(a, from, v));
      return;
    }
    const size = this.C.length;
    let s = this._stroke;
    if (!s || s.seen.length !== size) s = this._stroke = {
      seen: new Uint32Array(size),
      touched: new Uint32Array(size),
      depth: new Float64Array(size),
      progress: new Float64Array(size),
      id: 0
    };
    if (!(s.id = s.id + 1 >>> 0)) {
      s.seen.fill(0);
      s.id = 1;
    }
    let count = 0;
    const stops = [from];
    let d = 0;
    for (let i = 1; i < path.points.length; i++) {
      d += Math.hypot(path.points[i][0] - path.points[i - 1][0], path.points[i][1] - path.points[i - 1][1]);
      const u = d / path.length;
      if (u > from && u < to) stops.push(u);
    }
    stops.push(to);
    for (let i = 1; i < stops.length; i++) {
      const start = stops[i - 1], end = stops[i], n = Math.max(1, Math.ceil((end - start) * path.length));
      let q = path.sample(start);
      for (let j = 1; j <= n; j++) {
        const u0 = start + (end - start) * (j - 1) / n, u1 = start + (end - start) * j / n;
        const next = path.sample(u1), r0 = Math.max(0, call(width, u0)) / 2, r1 = Math.max(0, call(width, u1)) / 2;
        const r = Math.max(r0, r1), dx = next.x - q.x, dy = next.y - q.y, l2 = dx * dx + dy * dy;
        if (r > 0) this.each(
          Math.min(q.x, next.x) - r,
          Math.min(q.y, next.y) - r,
          Math.max(q.x, next.x) + r,
          Math.max(q.y, next.y) + r,
          (x, y, sx, sy) => {
            const k = l2 ? clamp(((x - q.x) * dx + (y - q.y) * dy) / l2) : 0;
            const radius3 = r0 + (r1 - r0) * k;
            if (!radius3) return;
            const ex = q.x + dx * k - x, ey = q.y + dy * k - y, depth = (ex * ex + ey * ey) / (radius3 * radius3);
            if (depth > 1) return;
            const index = (sy - this.oy) * this.w + sx - this.ox;
            if (s.seen[index] !== s.id) {
              s.seen[index] = s.id;
              s.touched[count++] = index;
            } else if (depth >= s.depth[index]) return;
            s.depth[index] = depth;
            s.progress[index] = u0 + (u1 - u0) * k;
          }
        );
        q = next;
      }
    }
    for (let i = 0; i < count; i++) {
      const index = s.touched[i], u = s.progress[index], v = Math.sqrt(s.depth[index]);
      this.put(index % this.w + this.ox, Math.floor(index / this.w) + this.oy, call(c, u, v), call(a, u, v));
    }
  }
  /**
   * Draw a signed distance function inside explicit local bounds [x0,y0,x1,y1]. c/a may depend on
   * (distance,x,y); positive distances are skipped. Use SDF.shell/expand for borders and growth.
   */
  sdf(shape2, bounds, c, a = 1) {
    this.shade(...bounds, (x, y, out) => {
      if (x < bounds[0] || y < bounds[1] || x > bounds[2] || y > bounds[3]) return;
      const d = shape2(x, y);
      if (d > 0 || !Number.isFinite(d)) return;
      out.c = call(c, d, x, y);
      out.a = call(a, d, x, y);
    });
  }
  /** Thick segment with round ends. c and a may be functions of (u along, v across: 0 center, 1 edge). */
  beam(x0, y0, x1, y1, width, c, a = 1) {
    const r = width / 2, dx = x1 - x0, dy = y1 - y0, L22 = dx * dx + dy * dy || 1e-9;
    this.shade(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (x, y, o) => {
      const u = clamp(((x - x0) * dx + (y - y0) * dy) / L22), px = x0 + dx * u - x, py = y0 + dy * u - y;
      const d2 = px * px + py * py;
      if (d2 > r * r) return;
      const v = Math.sqrt(d2) / r;
      o.c = call(c, u, v);
      o.a = call(a, u, v);
    });
  }
  /** Filled disc. c and a may be functions of (d: 0 center to 1 rim, angle). */
  circle(cx, cy, r, c, a = 1) {
    if (r < 0.6) return this.dot(cx, cy, call(c, 0, 0), call(a, 0, 0));
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
      o.c = call(c, d, ang);
      o.a = call(a, d, ang);
    });
  }
  /** Ellipse. c and a may be functions of (d: 0 center to 1 rim, angle). */
  ellipse(cx, cy, rx, ry, c, a = 1) {
    if (rx <= 0 || ry <= 0) return;
    this.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y, o) => {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d2 = dx * dx + dy * dy;
      if (d2 > 1) return;
      const d = Math.sqrt(d2), ang = Math.atan2(dy, dx);
      o.c = call(c, d, ang);
      o.a = call(a, d, ang);
    });
  }
  /** Ring from radius r - w to r. c and a may be functions of (v: 0 inner to 1 outer, angle). */
  ring(cx, cy, r, w, c, a = 1) {
    const r0 = Math.max(0, r - w);
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r || d2 < r0 * r0) return;
      const v = w > 0 ? (Math.sqrt(d2) - r0) / (r - r0 || 1) : 1, ang = Math.atan2(dy, dx);
      o.c = call(c, v, ang);
      o.a = call(a, v, ang);
    });
  }
  /**
   * Band of a ring from angle a0 to a1 (radians, a1 > a0), radius r - w to r: the slash and smear shape.
   * c and a may be functions of (u: 0 at a0 to 1 at a1, v: 0 inner to 1 outer). w can be a function of u
   * for a crescent that tapers at both ends.
   */
  arc(cx, cy, r, w, a0, a1, c, a = 1) {
    const span = a1 - a0, wf = typeof w === "function";
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) return;
      let ang = Math.atan2(dy, dx) - a0;
      ang -= Math.floor(ang / (Math.PI * 2)) * Math.PI * 2;
      if (ang > span) return;
      const u = ang / span, ww = wf ? w(u) : w;
      if (ww <= 0 || d < r - ww) return;
      const v = (d - (r - ww)) / ww;
      o.c = call(c, u, v);
      o.a = call(a, u, v);
    });
  }
  /**
   * Blit a w x h color buffer (0 = transparent) with its top-left at (x, y). This is the fast path for a map's
   * cached static layers: no per-pixel shape tests and no rotation maths on the common unflipped case.
   */
  image(buf, bw, bh, x = 0, y = 0) {
    if (this.sn === 0 && this.fx === 1) {
      const X = Math.round(x), Y = Math.round(y);
      const x0 = Math.max(0, this.ox - X), x1 = Math.min(bw, this.ox + this.w - X);
      const y0 = Math.max(0, this.oy - Y), y1 = Math.min(bh, this.oy + this.h - Y);
      for (let yy = y0; yy < y1; yy++) {
        const dst = (Y + yy - this.oy) * this.w + X - this.ox;
        const src = yy * bw;
        for (let xx = x0; xx < x1; xx++) {
          const c = buf[src + xx];
          if (c) this.C[dst + xx] = c;
        }
      }
      return;
    }
    for (let yy = 0; yy < bh; yy++)
      for (let xx = 0; xx < bw; xx++) {
        const c = buf[yy * bw + xx];
        if (c) this.put(this.cellX(x + xx, y + yy), this.cellY(x + xx, y + yy), c);
      }
  }
  /** Add a cached w x h light buffer (0 = no light) with its top-left at (x, y). */
  lightImage(buf, bw, bh, x = 0, y = 0) {
    if (this.sn === 0 && this.fx === 1) {
      const X = Math.round(x), Y = Math.round(y), k = this.fade * this.lightK;
      if (k <= 4e-3) return;
      const x0 = Math.max(0, this.ox - X), x1 = Math.min(bw, this.ox + this.w - X);
      const y0 = Math.max(0, this.oy - Y), y1 = Math.min(bh, this.oy + this.h - Y);
      for (let yy = y0; yy < y1; yy++) {
        const dst = (Y + yy - this.oy) * this.w + X - this.ox;
        const src = yy * bw;
        for (let xx = x0; xx < x1; xx++) {
          const l = buf[src + xx];
          if (!(l & 16777215)) continue;
          const i = dst + xx, d = this.L[i];
          const r = Math.min(255, (d & 255) + (l & 255) * k) | 0;
          const g = Math.min(255, (d >>> 8 & 255) + (l >>> 8 & 255) * k) | 0;
          const b = Math.min(255, (d >>> 16 & 255) + (l >>> 16 & 255) * k) | 0;
          this.L[i] = 255 << 24 | b << 16 | g << 8 | r;
        }
      }
      return;
    }
    for (let yy = 0; yy < bh; yy++)
      for (let xx = 0; xx < bw; xx++) {
        const l = buf[yy * bw + xx];
        if (l & 16777215) this.light(x + xx, y + yy, l, 1);
      }
  }
  /** Filled rectangle. */
  rect(x, y, w, h, c, a = 1) {
    if (this.sn === 0) {
      const X0 = Math.round(x), Y0 = Math.round(y), X1 = Math.round(x + w), Y1 = Math.round(y + h);
      for (let yy = Y0; yy < Y1; yy++) for (let xx = X0; xx < X1; xx++) this.put(this.cellX(xx, yy), this.cellY(xx, yy), c, a);
      return;
    }
    this.shade(x, y, x + w, y + h, (lx, ly, o) => {
      if (lx < x || ly < y || lx >= x + w || ly >= y + h) return;
      o.c = c;
      o.a = a;
    });
  }
  /** Filled polygon from points [[x, y], ...] (even-odd rule). */
  poly(pts, c, a = 1) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const n = pts.length;
    this.shade(x0, y0, x1, y1, (x, y, o) => {
      let inside2 = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside2 = !inside2;
      }
      if (!inside2) return;
      o.c = call(c, x, y);
      o.a = call(a, x, y);
    });
  }
  tri(x0, y0, x1, y1, x2, y2, c, a = 1) {
    this.poly([[x0, y0], [x1, y1], [x2, y2]], c, a);
  }
  // ---- light
  /** Radial glow into the light buffer: k at the center, falling to 0 at radius r. */
  glow(x, y, r, c, k = 0.5) {
    if (r < 1 || k <= 4e-3) return;
    const cx = this.toX(x, y), cy = this.toY(x, y);
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
    for (let sy = y0; sy <= y1; sy++) {
      const dy = (sy + 0.5 - cy) / r;
      for (let sx = x0; sx <= x1; sx++) {
        const dx = (sx + 0.5 - cx) / r, d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const f = 1 - Math.sqrt(d);
        this.add(sx, sy, c, f * f * k);
      }
    }
  }
  /** Glow around a segment (a soft beam of light). */
  glowLine(x0, y0, x1, y1, r, c, k = 0.5) {
    if (r < 1 || k <= 4e-3) return;
    const ax = this.toX(x0, y0), ay = this.toY(x0, y0), bx = this.toX(x1, y1), by = this.toY(x1, y1);
    const dx = bx - ax, dy = by - ay, L22 = dx * dx + dy * dy || 1e-9;
    const X0 = Math.floor(Math.min(ax, bx) - r), X1 = Math.ceil(Math.max(ax, bx) + r);
    const Y0 = Math.floor(Math.min(ay, by) - r), Y1 = Math.ceil(Math.max(ay, by) + r);
    for (let sy = Y0; sy <= Y1; sy++)
      for (let sx = X0; sx <= X1; sx++) {
        const px = sx + 0.5, py = sy + 0.5, u = clamp(((px - ax) * dx + (py - ay) * dy) / L22);
        const ex = ax + dx * u - px, ey = ay + dy * u - py, d = Math.sqrt(ex * ex + ey * ey) / r;
        if (d >= 1) continue;
        const f = 1 - d;
        this.add(sx, sy, c, f * f * k);
      }
  }
  /** Glow hugging a circle of radius R (a shockwave's light), falling off over width r. */
  glowRing(x, y, R4, r, c, k = 0.5) {
    if (r < 1 || k <= 4e-3) return;
    const cx = this.toX(x, y), cy = this.toY(x, y), E = R4 + r;
    for (let sy = Math.floor(cy - E); sy <= Math.ceil(cy + E); sy++)
      for (let sx = Math.floor(cx - E); sx <= Math.ceil(cx + E); sx++) {
        const d = Math.abs(Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy) - R4) / r;
        if (d >= 1) continue;
        const f = 1 - d;
        this.add(sx, sy, c, f * f * k);
      }
  }
  // ---- sprites, text, masks
  /**
   * A little sprite from strings: rows like ["..##..", ".#oo#."], pal maps characters to colors
   * ({ "#": "#222034", o: 0xff... }); "." and " " are empty. Top-left at (x, y).
   * opts: { scale, a, flip (mirror left-right), flipY (upside down), tint (draw every pixel in one color) }.
   */
  sprite(rows, pal, x, y, opts = {}) {
    let s = sprites.get(rows);
    if (!s) sprites.set(rows, s = rows.map((r) => [...r]));
    const k = opts.scale ?? 1, a = opts.a ?? 1, W7 = s[0]?.length ?? 0, cache = {};
    for (let r = 0; r < s.length; r++)
      for (let q = 0; q < s[r].length; q++) {
        const ch = s[r][q];
        if (ch === "." || ch === " ") continue;
        let c = opts.tint;
        if (c === void 0) {
          c = cache[ch];
          if (c === void 0) c = cache[ch] = pal[ch] === void 0 ? 0 : hex(pal[ch]);
        }
        if (!c) continue;
        const col = opts.flip ? W7 - 1 - q : q, row = opts.flipY ? s.length - 1 - r : r;
        if (k === 1) this.dot(x + col, y + row, c, a);
        else this.rect(x + col * k, y + row * k, k, k, c, a);
      }
  }
  /**
   * Pixel text. opts: { font: "mini" (3x5) | "big" (5x7), scale, align: "left" | "center" | "right",
   * outline: color, shadow: color, a }. (x, y) is the top of the text, at the left, center or right.
   */
  text(str, x, y, c, opts = {}) {
    const font = opts.font ?? "mini", k = opts.scale ?? 1, a = opts.a ?? 1, w = textWidth(str, font) * k;
    const left = Math.round(opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x), top = Math.round(y);
    const ol = opts.outline, sh = opts.shadow;
    if (ol !== void 0) rasterText(str, font, (gx, gy) => this.rect(left + gx * k - 1, top + gy * k - 1, k + 2, k + 2, ol, a));
    if (sh !== void 0) rasterText(str, font, (gx, gy) => this.rect(left + gx * k + 1, top + gy * k + 1, k, k, sh, a));
    rasterText(str, font, (gx, gy) => this.rect(left + gx * k, top + gy * k, k, k, call(c, gx, gy), a));
  }
  /** Size of text in pixels: [w, h]. */
  measure(str, opts = {}) {
    const k = opts.scale ?? 1;
    return [textWidth(str, opts.font ?? "mini") * k, FONTS[opts.font ?? "mini"].h * k];
  }
  /** Fill a mask ({ w, h, data }) with its top-left at (x, y). c may be a function of (mx, my). */
  mask(m, x, y, c, a = 1) {
    for (let my = 0; my < m.h; my++)
      for (let mx = 0; mx < m.w; mx++) if (m.data[my * m.w + mx]) this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
  }
  /** The 1 px outline just outside a mask. */
  outline(m, x, y, c, a = 1) {
    const at8 = (mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.data[my * m.w + mx];
    for (let my = -1; my <= m.h; my++)
      for (let mx = -1; mx <= m.w; mx++)
        if (!at8(mx, my) && (at8(mx - 1, my) || at8(mx + 1, my) || at8(mx, my - 1) || at8(mx, my + 1)))
          this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
  }
};

// ../pixelfx/src/core/characters.js
var DUMMY_PAL = {
  k: "#0e0c14",
  A: "#e4e6ec",
  B: "#b6b9c3",
  C: "#868995",
  D: "#5c5e6a",
  E: "#6e707c",
  F: "#4b4d58",
  G: "#34353f",
  J: "#2a2b33",
  m: "#f53cd1"
};
var gold = ["#fff1b0", "#e9b957", "#aa6336", "#57302d"];
var leather = ["#a48276", "#695367", "#3e354b", "#211f33"];
var bone = ["#fff1d5", "#d9c8b7", "#9f8091", "#51465f"];
var CHARACTERS = Object.freeze([
  { id: "dummy", name: "Armored stand-in", label: "\u76D4\u7532\u4EBA", role: "\u8BAD\u7EC3\u4EBA\u5076", accent: "#b6b9c3", desc: "Neutral armor for comparing effect colors." },
  {
    id: "ember-duelist",
    name: "Ember duelist",
    label: "\u4F59\u70EC\u5251\u58EB",
    role: "\u77ED\u62AB\u98CE \xB7 \u8D64\u91D1",
    accent: "#ef7259",
    style: "duelist",
    desc: "Swept dark hair, a crimson half cape, bare arms, bronze bracers and a split battle skirt.",
    skin: ["#ffd8a5", "#dba077", "#a25f56", "#603b4e"],
    cloth: ["#ff9472", "#d84f52", "#8d2e48", "#42233c"],
    hair: ["#76607d", "#42334f", "#292538", "#191b2c"],
    gold,
    leather,
    bone,
    lining: ["#ffe5a0", "#e9ac62", "#a44b46", "#502a3e"],
    glow: ["#fff4be", "#ffa760", "#e8554a", "#76334d"]
  },
  {
    id: "moon-oracle",
    name: "Moon oracle",
    label: "\u6708\u76F8\u796D\u53F8",
    role: "\u6708\u51A0 \xB7 \u975B\u84DD\u957F\u888D",
    accent: "#b7b5ff",
    style: "oracle",
    desc: "Silver hair, a crescent diadem, long indigo vestments and layered pale-gold hems.",
    skin: ["#f8dfd1", "#d0acba", "#9e7599", "#5b4c75"],
    cloth: ["#a7a8ee", "#6465b4", "#3b3a7c", "#242744"],
    hair: ["#fff7e8", "#d9cee2", "#a39bbf", "#656184"],
    gold: ["#fff7cb", "#d5c8a2", "#9a8196", "#554769"],
    leather,
    bone,
    lining: ["#e9e7fa", "#b5acd9", "#7976a9", "#484467"],
    glow: ["#ffffff", "#e4d4ff", "#b29bf0", "#6861b1"]
  },
  {
    id: "laurel-ranger",
    name: "Laurel ranger",
    label: "\u6708\u6842\u6E38\u4FA0",
    role: "\u957F\u8FAB \xB7 \u7FE0\u7EFF\u62AB\u80A9",
    accent: "#76d7a0",
    style: "ranger",
    desc: "A copper braid, a laurel circlet, a leaf-cut green mantle, short tunic and laced boots.",
    skin: ["#efc58e", "#c98b68", "#915a53", "#54394b"],
    cloth: ["#b7e59b", "#68a981", "#3c7064", "#24464b"],
    hair: ["#f0b76f", "#bb7351", "#77454a", "#402d3f"],
    gold,
    leather,
    bone,
    lining: ["#e6e7ac", "#b7be79", "#758459", "#3e554b"],
    glow: ["#fff9c6", "#d9ed95", "#8ec989", "#4c876f"]
  },
  {
    id: "styx-warden",
    name: "Styx warden",
    label: "\u51A5\u6CB3\u5B88\u536B",
    role: "\u9AA8\u9762 \xB7 \u6697\u7D2B\u91CD\u88C5",
    accent: "#81d5d2",
    style: "warden",
    desc: "An ivory death mask, high asymmetric pauldrons, amethyst armor and a tattered river cloak.",
    skin: ["#b6ceca", "#86a4ad", "#586b82", "#343c59"],
    cloth: ["#a294c5", "#71618e", "#463e66", "#282b45"],
    hair: ["#8f89a1", "#5b526e", "#3b354f", "#22263d"],
    gold: ["#edf3d6", "#b6c9bd", "#718f9c", "#40516c"],
    leather,
    bone,
    lining: ["#d49bb8", "#9a5b82", "#633a63", "#382841"],
    glow: ["#e7fff4", "#a2e8dd", "#62b5be", "#397789"]
  },
  {
    id: "naruto",
    name: "Naruto",
    label: "\u9E23\u4EBA",
    role: "\u91D1\u8272\u523A\u53D1 \xB7 \u6A59\u9ED1\u5FCD\u8005\u88C5",
    accent: "#ff8a3c",
    style: "shinobi",
    desc: "Sun-blond spikes above a steel headband plate, an orange track jacket with a black shoulder yoke, bandaged forearms and dark sandals.",
    skin: ["#ffd6a0", "#e0a371", "#a86a4e", "#5e3c3c"],
    cloth: ["#ffb35e", "#f07c32", "#b34a28", "#642a28"],
    hair: ["#ffeaa8", "#ffc84e", "#d18d2c", "#7d4d20"],
    gold: ["#f2f5f7", "#c3cad3", "#848d9a", "#454d5c"],
    leather: ["#8f9ab8", "#5a6486", "#363e5e", "#1c2236"],
    bone: ["#fff8e6", "#e3d4b8", "#b09a7e", "#6b5c52"],
    lining: ["#a6bcec", "#617cbe", "#3d508c", "#222f56"],
    glow: ["#fff6c8", "#ffb457", "#f0732e", "#8d3628"]
  },
  {
    id: "sasuke",
    name: "Sasuke",
    label: "\u4F50\u52A9",
    role: "\u6DF1\u8272\u957F\u5218\u6D77 \xB7 \u9AD8\u9886\u7D2B\u7EE6",
    accent: "#8a7fe0",
    style: "avenger",
    desc: "Blue-black hair with a long fringe, a high collar that hides the neck, a violet rope belt, wrapped forearms and a lean dark silhouette.",
    skin: ["#f7dfd2", "#d6aa9b", "#9f7270", "#5c444f"],
    cloth: ["#9aa1c0", "#5d6486", "#363d5c", "#1d2235"],
    hair: ["#8f9cbb", "#4e5a7c", "#2b3350", "#141a2c"],
    gold: ["#eef2f5", "#bcc5cf", "#7e8897", "#434b59"],
    leather: ["#7c7f96", "#4b4f66", "#2b2f44", "#171a29"],
    bone: ["#fdf6e8", "#e0d2bc", "#ad9d8a", "#6a5e59"],
    lining: ["#d4b0e8", "#9c6ec0", "#65438a", "#382552"],
    glow: ["#f0e6ff", "#bb95f2", "#7f55c8", "#432c72"]
  },
  {
    id: "hatsune-miku",
    name: "Hatsune Miku",
    label: "\u521D\u97F3\u672A\u6765",
    role: "\u9752\u7EFF\u53CC\u9A6C\u5C3E \xB7 \u5076\u50CF\u5236\u670D",
    accent: "#4fe0d0",
    style: "idol",
    desc: "Twin teal tails that fall past the hips, a dark sleeveless top with a teal tie and pleated skirt, detached sleeves and thigh boots.",
    skin: ["#ffe4d8", "#e5b6ac", "#ad8087", "#665064"],
    cloth: ["#b0f8e8", "#5fdccc", "#2e9c9b", "#1b5968"],
    hair: ["#bcfff3", "#72e8da", "#3aacb4", "#1f6479"],
    gold: ["#f5fbfa", "#c6d8d8", "#859ba0", "#475761"],
    leather: ["#9197aa", "#5b6177", "#353a4c", "#1c202d"],
    bone: ["#ffffff", "#e8e4ea", "#bab2c0", "#736c7c"],
    lining: ["#e2fff9", "#a9f2e8", "#68c9c4", "#3a7e83"],
    glow: ["#eefffb", "#a2ffee", "#52d9d0", "#2b8f96"]
  },
  {
    id: "daoist",
    name: "Daoist",
    label: "\u9053\u58EB",
    role: "\u9053\u9AFB \xB7 \u975B\u84DD\u9053\u888D",
    accent: "#7fa8e0",
    style: "daoist",
    desc: "A pinned topknot and thin beard above a crossed white collar, wide indigo sleeves, a pale sash and a long pleated robe.",
    skin: ["#f8e4ca", "#dab494", "#a47864", "#5f4a45"],
    cloth: ["#b6c4e0", "#7186ad", "#475878", "#29344b"],
    hair: ["#b3b2c0", "#747486", "#484a5e", "#242633"],
    gold: ["#fff0b6", "#e4bf6e", "#a87e3c", "#5b452b"],
    leather: ["#a08672", "#6d564d", "#46383c", "#251e28"],
    bone: ["#fffaf0", "#e7dcc6", "#b8a88f", "#726659"],
    lining: ["#e6f0fb", "#b0c8e2", "#7794b6", "#4a5c74"],
    glow: ["#efffff", "#b2edf4", "#64bccb", "#356873"]
  },
  {
    id: "lu-mingfei",
    name: "Lu Mingfei",
    label: "\u8DEF\u660E\u975E",
    role: "\u4E71\u53D1 \xB7 \u5B66\u9662\u5236\u670D",
    accent: "#8fa3c9",
    style: "student",
    desc: "An ordinary schoolboy: messy dark hair, a navy uniform jacket over a white shirt, a school satchel, long trousers and white sneakers.",
    skin: ["#ffdcc0", "#e0af8a", "#aa7960", "#614846"],
    cloth: ["#a2aec9", "#68769b", "#434d70", "#262d45"],
    hair: ["#c09a78", "#8a6750", "#574035", "#2d2324"],
    gold: ["#f3e8c4", "#cdb47c", "#93784a", "#524430"],
    leather: ["#9a9cae", "#66687d", "#3d4052", "#232634"],
    bone: ["#fffdf4", "#e6dfcf", "#b6af9c", "#6f6a5f"],
    lining: ["#e4eefb", "#b2c6e0", "#7c98b9", "#4d6079"],
    glow: ["#e8feff", "#a8ecf4", "#62bccb", "#376d7a"]
  },
  {
    id: "uesugi-eriyi",
    name: "Uesugi Eriyi",
    label: "\u4E0A\u6749\u7ED8\u68A8\u8863",
    role: "\u7EEF\u7EA2\u957F\u53D1 \xB7 \u767D\u88D9\u7EA2\u7EE6",
    accent: "#ff6a70",
    style: "priestess",
    desc: "Straight crimson hair down to the thighs, a red hair ribbon, red eyes, a white dress with a red sash and a small gold bell.",
    skin: ["#fff0e6", "#eccbc1", "#bd9aa0", "#75606d"],
    cloth: ["#ffffff", "#f0e9f1", "#cbc0d2", "#8c8298"],
    hair: ["#ffb3a4", "#eb6a66", "#ac334c", "#5f2438"],
    gold: ["#fff3c8", "#ebc675", "#ad8040", "#60472c"],
    leather: ["#c08e94", "#8a5a64", "#5a3843", "#302026"],
    bone: ["#fffdf6", "#efe6d8", "#c0b3a5", "#7b6f6a"],
    lining: ["#ffa6a0", "#e85862", "#ab2f44", "#5f1f2c"],
    glow: ["#ffe0de", "#ff8f86", "#d63c4e", "#7b1f31"]
  },
  {
    id: "iron-man",
    name: "Iron Man",
    label: "\u94A2\u94C1\u4FA0",
    role: "\u7EA2\u91D1\u52A8\u529B\u7532 \xB7 \u65B9\u821F\u53CD\u5E94\u7089",
    accent: "#e8402f",
    style: "sentinel",
    desc: "A red-and-gold powered suit with a gold faceplate, cyan eye slits, a glowing arc reactor and repulsor palms.",
    skin: ["#ffd8b0", "#d8a070", "#a06a48", "#5a3a30"],
    cloth: ["#ff8a70", "#e8402f", "#a82226", "#5c1420"],
    hair: ["#4a4a55", "#30303a", "#1e1e28", "#101018"],
    gold: ["#fff4c0", "#f2c84e", "#c08a28", "#6b4a16"],
    leather: ["#b04a4a", "#7a2a30", "#4a1a24", "#25101a"],
    bone: ["#f8fbff", "#d8e0ea", "#94a0b0", "#525c6a"],
    lining: ["#d8ffff", "#8ce8ff", "#3fb8e0", "#1a6a88"],
    glow: ["#ffffff", "#c8f8ff", "#58d8ff", "#2a7fbf"]
  },
  {
    id: "hulk",
    name: "Hulk",
    label: "\u7EFF\u5DE8\u4EBA",
    role: "\u4F3D\u9A6C\u7EFF\u5DE8\u8EAF \xB7 \u7834\u635F\u7D2B\u88E4",
    accent: "#6fd44a",
    style: "gamma",
    desc: "A gamma-green bulk with a heavy brow, huge fists and torn purple trousers over bare shins.",
    skin: ["#e0ffb0", "#94e05a", "#4f9e34", "#2a5a24"],
    cloth: ["#c9a8e8", "#8f63b8", "#5c3a80", "#2e1e45"],
    hair: ["#8a9a78", "#526048", "#303c2e", "#161f18"],
    gold: ["#f0e6b0", "#c9b46a", "#8a7538", "#4a3d22"],
    leather: ["#b09a7a", "#7a6248", "#4a3a2c", "#241c16"],
    bone: ["#fffdf0", "#e6dcc4", "#b0a288", "#6a5e50"],
    lining: ["#b8c8a8", "#849878", "#5a6a52", "#303a2e"],
    glow: ["#eaffd0", "#b8ff7a", "#6ad43c", "#2e7a20"]
  },
  {
    id: "thor",
    name: "Thor",
    label: "\u96F7\u795E",
    role: "\u7FFC\u76D4\u7EA2\u62AB\u98CE \xB7 \u94F6\u7532\u96F7\u795E",
    accent: "#7fc4ff",
    style: "asgardian",
    desc: "Long blond hair and a silver winged helm above a red cape, silver chest discs, bracers and a dark tunic.",
    skin: ["#ffe0c0", "#e0b08a", "#a87858", "#5f4438"],
    cloth: ["#a8bce0", "#5f78a8", "#3a4e78", "#1e2a48"],
    hair: ["#fff0b0", "#e8c85a", "#b08a30", "#5f4a18"],
    gold: ["#fff2b0", "#e8c45a", "#b08830", "#5f461c"],
    leather: ["#a09080", "#6a5a4a", "#3e322a", "#1f1814"],
    bone: ["#ffffff", "#dce4ee", "#96a4b4", "#56626f"],
    lining: ["#ff9a8a", "#d84a44", "#92282e", "#4f1620"],
    glow: ["#f0ffff", "#b8e8ff", "#5ab8ff", "#2a5fbf"]
  },
  {
    id: "captain-america",
    name: "Captain America",
    label: "\u7F8E\u56FD\u961F\u957F",
    role: "\u84DD\u767D\u661F\u5FBD \xB7 \u7EA2\u767D\u8170\u7EB9",
    accent: "#4a7fe0",
    style: "patriot",
    desc: "A blue cowl with white temple wings, a white chest star, red-and-white waist stripes and red boots.",
    skin: ["#ffdcc0", "#e0af8a", "#aa7960", "#614846"],
    cloth: ["#b8c8f0", "#5a7fd0", "#2f4f96", "#1a2a55"],
    hair: ["#fff0b8", "#e8c86a", "#b08a38", "#5f4a20"],
    gold: ["#fff2c0", "#e8cc70", "#b08a38", "#5f4a20"],
    leather: ["#c09a6a", "#8a6440", "#5a3c2a", "#2e1e16"],
    bone: ["#ffffff", "#ece6dc", "#c0b6a8", "#7a7068"],
    lining: ["#ff9a90", "#e04848", "#a02434", "#551624"],
    glow: ["#e8f4ff", "#a8d4ff", "#5a9ae8", "#2a5a9f"]
  },
  {
    id: "amaterasu",
    name: "Amaterasu",
    label: "\u5929\u7167\u547D",
    role: "\u65E5\u8F6E \xB7 \u516B\u54AB\u955C",
    accent: "#f0c24c",
    style: "sun-goddess",
    desc: "A gold sun disc behind her head, black hair past the waist, a white haori over a vermilion hakama and the Yata mirror at her chest.",
    skin: ["#ffe8cc", "#e8bd94", "#b38668", "#664b48"],
    cloth: ["#fff4de", "#e6d3ae", "#bda681", "#7a6a55"],
    hair: ["#4c5268", "#2c3044", "#1b1e2d", "#0d0f18"],
    gold: ["#fff2b8", "#efc75f", "#b8862e", "#6b4a1a"],
    leather: ["#c07a54", "#8a4a34", "#5c2c26", "#2f1718"],
    bone: ["#fffdf4", "#ece0c8", "#bfae92", "#786a5c"],
    lining: ["#f08060", "#c8402a", "#8a221c", "#4c1214"],
    glow: ["#ffffff", "#fff6c8", "#ffd25c", "#c08a2e"]
  },
  {
    id: "tsukuyomi",
    name: "Tsukuyomi",
    label: "\u6708\u8BFB\u547D",
    role: "\u6708\u51A0 \xB7 \u84DD\u67D3\u675F\u5E26",
    accent: "#9dc4e8",
    style: "moon-god",
    desc: "A tall black kanmuri crowned with a silver crescent, a straight mane to the waist, an indigo sokutai with wide sleeves and a white obi.",
    skin: ["#fff2e6", "#e4c8bc", "#b39494", "#6a5560"],
    cloth: ["#a8b6d8", "#5d6fa0", "#38466f", "#1e2746"],
    hair: ["#6a7288", "#454c62", "#2b3044", "#161a28"],
    gold: ["#f4f9ff", "#c8d8ea", "#8a9bb4", "#4d5a70"],
    leather: ["#8a8fa6", "#5a5f78", "#3a3e52", "#1f2230"],
    bone: ["#ffffff", "#e6ecf2", "#b8c2cc", "#707a88"],
    lining: ["#f6fbff", "#d4e2f0", "#9fb4c8", "#5e7188"],
    glow: ["#ffffff", "#e2f2ff", "#9dc4e8", "#4f7aa8"]
  },
  {
    id: "susanoo",
    name: "Susanoo",
    label: "\u987B\u4F50\u4E4B\u7537",
    role: "\u66B4\u98CE \xB7 \u6CE8\u8FDE\u7EF3",
    accent: "#68e0cc",
    style: "storm-god",
    desc: "A wild mane, bare shoulders, a torn storm cloak, the shimenawa rope twisted across his chest and lightning still crawling on one arm.",
    skin: ["#f0cfa8", "#cfa274", "#9a6e50", "#5c4038"],
    cloth: ["#a8c0b8", "#5f8078", "#3a5656", "#1e3034"],
    hair: ["#7a8a92", "#4a5a62", "#2c3a42", "#161e24"],
    gold: ["#e8d4a0", "#c09a5c", "#8a6634", "#4e3620"],
    leather: ["#a07a5c", "#6e4e3a", "#46302a", "#241a1a"],
    bone: ["#fff8e6", "#e0d0b4", "#b09a7a", "#6a5844"],
    lining: ["#f08a62", "#c8482a", "#8a2a1e", "#4c1416"],
    glow: ["#ffffff", "#d4fff4", "#68e0cc", "#2a8a86"]
  }
]);
var characterOf = (id) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];

// ../pixelfx/src/core/costume.js
function costume(S, look2, api) {
  const { ball, bone: bone2, panel: panel2 } = api, { B: B3 } = S;
  const head4 = (v, r, m = 5) => ball("head", v, r, m);
  const line = (f, a, b, ra, rb, m) => bone2(f, a, b, ra, rb, m);
  const face2 = (f, pts, m) => panel2(f, pts, m);
  const cape = (length, spread, mat = 4) => {
    face2("chest", [[-2.5, 3, -4], [-2.5, 3, 4], [-7, -length + 2, spread], [-8.5, -length, 1], [-9, -length + 3, -spread]], mat);
    face2("chest", [[-2.7, 3, 1.8], [-7.1, -length + 2, spread - 0.5], [-8.6, -length, 1]], 10);
    line("chest", [-3, 3, 3.8], [-7.2, -length + 2, spread], 0.38, 0.28, 6);
  };
  const skirt = (length, spread) => {
    face2("pelvis", [[3.1, 1, -3.9], [3.1, 1, 4], [3.8, -length, spread], [4.2, -length - 1, 1.2], [3.4, -length + 1.5, -spread]], 4);
    face2("pelvis", [[3.4, 0, -1], [3.5, 0, 1.4], [4.5, -length - 0.8, 1.1], [4.1, -length + 1, -1.2]], 10);
    line("pelvis", [3.4, 0.7, -4.2], [3.4, 0.7, 4.2], 0.55, 0.55, 6);
    line("pelvis", [3.5, -length + 0.4, -spread], [3.9, -length, -1], 0.35, 0.35, 6);
    line("pelvis", [4.4, -length - 1, 1.2], [3.9, -length, spread], 0.35, 0.35, 6);
  };
  ball("head", [2.4, -0.4, 0], [0.65, 0.8, 1.1], 3);
  for (const side of [-1, 1]) {
    head4([2.35, 0.35, side * 1.55], [0.5, 0.52, 0.6], 7);
    head4([2.72, 0.35, side * 1.55], [0.23, 0.23, 0.35], 8);
    line("head", [2.4, 1, side * 1.2], [2, 1.3, side * 2.2], 0.32, 0.22, 5);
  }
  head4([-0.9, 1.7, 0], [2.7, 2.3, 3]);
  if (["duelist", "oracle", "ranger", "warden"].includes(look2.style)) {
    line("chest", [3.3, 3.4, 3.4], [3.9, -2.6, -3], 0.6, 0.6, 6);
    ball("chest", [3.7, 2.3, 2.5], [0.6, 0.8, 0.8], 8);
    for (const f of ["foreN", "foreF"]) line(f, [5.2, 0, 0], [6.3, 0, 0], 1.45, 1.4, 6);
  }
  if (look2.style === "duelist") {
    cape(16, 6.5);
    skirt(6.8, 5.3);
    for (const [x, y, z] of [[-2.5, 4.1, -1.8], [-0.2, 4.7, 0], [1.5, 4.1, 1.4]])
      line("head", [x - 1, 1.7, z], [x, y, z], 1.35, 0.15, 5);
    ball("upperN", [0.8, 0, 0], [2.1, 2.5, 2.8], 6);
    line("head", [1.1, 1.8, 2.7], [2.3, 1.5, 1.7], 0.4, 0.3, 6);
    face2("chest", [[2.7, 4, 2], [4, 2, 4], [3.3, -3, 2.5], [2.5, -1, 1.2]], 4);
    line("head", [1.2, 2.3, 1.9], [3.3, 3.5, 1.3], 1, 0.15, 5);
    line("head", [1, 1.7, 2.6], [2.5, 1.6, 2.2], 0.4, 0.4, 4);
    face2("chest", [[-2.8, 2.9, 5], [-9.5, 0.6, 6.2], [-14, -2.6, 5.7], [-10, -0.4, 5.5], [-13, 1.7, 5.8]], 4);
    line("chest", [-3, 2.8, 5.2], [-10, 0.8, 6.4], 0.35, 0.25, 10);
  } else if (look2.style === "oracle") {
    cape(23, 7.8, 10);
    skirt(17, 7.2);
    for (const s of [-1, 1]) {
      line("head", [0, 2, s * 2.8], [-0.2, 4.3, s * 4], 0.75, 0.65, 6);
      line("head", [-0.2, 4.3, s * 4], [0.3, 6.8, s * 3.5], 0.65, 0.1, 6);
      line("head", [-1.8, 1.4, s * 2.5], [-2.2, -7, s * 3.4], 1.1, 0.45, 5);
    }
    head4([2.4, 1.9, 0], [0.5, 0.9, 0.5], 8);
    line("pelvis", [4.1, -4, 0], [4.5, -13, 0], 0.35, 0.25, 6);
    for (const f of ["upperN", "upperF"]) {
      face2(f, [[0, -1.5, -1.8], [0, 1.8, 1.8], [7, 4.2, 2.7], [7.4, -3.5, -2]], 4);
      line(f, [7, -3.3, -2], [7, 4.1, 2.7], 0.4, 0.4, 6);
    }
  } else if (look2.style === "ranger") {
    cape(10, 9);
    skirt(6, 5.2);
    for (let i = 0; i < 6; i++) head4([-3.2 - i * 0.6, -0.8 - i * 1.7, 1.2 + i % 2 * 0.5], [1.15 - i * 0.09, 1.2, 1], 5);
    head4([-6.4, -10.5, 1.5], [0.8, 1.2, 1.1], 6);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++)
      head4([0.3 + i * 0.85, 2.9 - i * 0.3, s * (2.5 - i * 0.35)], [0.85, 0.4, 0.6], 6);
    for (const f of ["shinN", "shinF"]) for (let i = 3; i <= 6; i += 1.5)
      line(f, [i, -1.5, -0.6], [i + 0.5, -1.4, 0.8], 0.26, 0.26, 6);
    face2("chest", [[1.5, 3.8, -5], [0, 4.5, 5.5], [-3, -2, 7], [-2, -5, 3]], 4);
  } else if (look2.style === "warden") {
    cape(22, 9, 10);
    skirt(10, 6.5);
    ball("upperN", [0.4, 0, 0], [3.2, 3.4, 3.4], 6);
    ball("upperF", [0.4, 0, 0], [2.6, 2.6, 2.8], 6);
    for (const s of [-1, 1]) {
      line("upperN", [-0.5, 1.4, s * 2], [-2.2, 4.2, s * 2.5], 1.1, 0.15, 9);
      line("head", [-1, 2.4, s * 2.5], [-2.8, 5.6, s * 3.5], 0.85, 0.1, 9);
    }
    ball("head", [1.2, -0.2, 0], [2.4, 2.9, 2.7], 9);
    for (const s of [-1, 1]) {
      head4([3.1, 0.6, s * 1.6], [0.5, 0.65, 0.85], 7);
      head4([3.5, 0.65, s * 1.6], [0.24, 0.28, 0.5], 8);
    }
    line("head", [3.3, -1.4, -0.7], [3.3, -2.2, 0.7], 0.3, 0.3, 7);
    ball("chest", [3.9, 0, 0], [0.65, 1.4, 1.3], 8);
    for (let i = 0; i < 3; i++) {
      line("chest", [3.7, -0.5 - i * 1.4, -3.1], [4.2, -1.3 - i * 1.4, 3.3], 0.4, 0.4, 6);
    }
  } else if (look2.style === "shinobi") {
    head4([-1, 1.6, 0], [2.9, 2.4, 3.1]);
    for (const [a, b, r] of [
      [[0.3, 2.4, 0], [1.3, 5.6, 0.3], 1.35],
      [[-1.1, 2.7, 0.2], [-1.9, 5.3, -0.4], 1.2],
      [[-2.2, 2, 0], [-3.8, 4.2, 0.5], 1.15],
      [[0, 2.1, -2.2], [0.4, 4.2, -3.7], 0.95],
      [[0, 2.1, 2.1], [0.6, 4.1, 3.4], 0.95]
    ]) line("head", a, b, r, 0.12, 5);
    for (const s of [-1, 1]) {
      line("head", [1.3, 2.4, s * 1.2], [2.5, 3.9, s * 1.7], 0.8, 0.12, 5);
      line("head", [2.6, 0.95, 0], [1.45, 0.95, s * 2.3], 0.5, 0.38, 10);
    }
    ball("head", [2.55, 0.95, 0], [0.42, 0.62, 1.35], 6);
    ball("head", [2.83, 0.95, 0], [0.18, 0.26, 0.5], 7);
    ball("neck", [-0.35, 0.15, 0], [1.6, 1.05, 1.95], 4);
    for (const f of ["upperN", "upperF"]) ball(f, [0.9, 0, 0], [2.2, 2.6, 2.9], 7);
    line("chest", [2.5, 3.8, 0], [3.32, 0.4, 0], 0.22, 0.2, 9);
    line("chest", [3.32, 0.4, 0], [3.15, -2.8, 0], 0.2, 0.18, 9);
    for (const f of ["thighN", "thighF"]) line(f, [1, 0, 0], [8, 0, 0], 2.75, 2.25, 7);
    for (const f of ["foreN", "foreF"]) {
      line(f, [0.6, 0, 0], [7, 0, 0], 1.55, 1.3, 9);
      for (const x of [2.2, 4.2, 6]) line(f, [x, 1.05, 0], [x + 0.35, 1.05, 0.9], 0.2, 0.2, 7);
    }
    ball("pelvis", [-2.2, -0.6, 2.2], [1.4, 1.7, 1.2], 7);
    ball("pelvis", [-2.2, 0.6, 3.1], [0.5, 0.4, 0.25], 6);
    line("pelvis", [2.6, 0.9, -3.6], [3.4, 0.9, 2.2], 0.42, 0.42, 7);
  } else if (look2.style === "avenger") {
    line("head", [-2.2, 1.2, 0], [-2.8, -5.6, 0], 1.9, 0.9, 5);
    for (const s of [-1, 1]) {
      line("head", [-2.4, 1.6, s * 1.6], [-3, -4.8, s * 2.6], 1.3, 0.5, 5);
      line("head", [1.4, 2, s * 2.2], [1.7, -4, s * 2.6], 0.9, 0.3, 5);
    }
    line("head", [1, 2.9, -1], [2.4, 0.9, -1.8], 1.1, 0.3, 5);
    for (const [a, b, r] of [
      [[-0.6, 2.6, -0.6], [-0.9, 4.6, -1], 1.15],
      [[-2, 2, -0.8], [-3.2, 3.8, -1.2], 0.95],
      [[-2.6, 1.2, 1.2], [-3.8, 2.6, 1.8], 0.8]
    ]) line("head", a, b, r, 0.12, 5);
    ball("neck", [-0.3, 0.15, 0], [1.55, 1.15, 2], 4);
    line("chest", [2.45, 4, 0], [3.25, 0.4, 0], 0.18, 0.17, 6);
    line("chest", [3.25, 0.4, 0], [3.05, -2.8, 0], 0.17, 0.15, 6);
    line("pelvis", [3.35, 0.7, -3.8], [3.4, 0.7, 3.8], 0.5, 0.5, 10);
    ball("pelvis", [3.5, 0.6, 1.1], [0.7, 0.6, 0.6], 10);
    line("pelvis", [3.4, 0.3, 0.9], [2.8, -4.6, 1.9], 0.28, 0.22, 10);
    line("pelvis", [3.3, 0.2, -0.4], [2.5, -3.4, -1.9], 0.26, 0.2, 10);
    for (const f of ["thighN", "thighF"]) line(f, [1, 0, 0], [8, 0, 0], 2.7, 2.2, 7);
    for (const f of ["foreN", "foreF"]) {
      line(f, [0.5, 0, 0], [7, 0, 0], 1.5, 1.3, 9);
      for (const x of [2, 4.4]) line(f, [x, 1, 0], [x + 0.3, 1, 0.85], 0.18, 0.18, 7);
    }
  } else if (look2.style === "idol") {
    head4([-1, 1.6, 0], [2.85, 2.4, 3.05]);
    for (const [z, x] of [[-1.9, 1.4], [0, 1.8], [1.9, 1.4]])
      line("head", [x, 2.7, z], [x + 0.7, 1, z * 1.05], 0.8, 0.35, 5);
    for (const s of [-1, 1]) {
      line("head", [1.5, 1.5, s * 2.3], [1.1, -3.2, s * 2.7], 0.8, 0.3, 5);
      head4([-0.4, 2.4, s * 2.6], [1.15, 1, 1.1], 5);
      line("head", [-0.4, 2.6, s * 2.8], [-0.9, 4.2, s * 5.2], 0.95, 0.9, 5);
      for (let i = 0; i < 9; i++)
        head4([-1 - i * 0.1, 3.4 - i * 1.8, s * (9 + i * 0.05)], [1.1 - i * 0.03, 1.25, 1.05], 5);
      head4([-0.4, 2.5, s * 2.8], [0.55, 0.45, 0.55], 7);
      head4([0.2, 0.5, s * 2.65], [0.65, 0.9, 0.55], 6);
      head4([0.55, 0.5, s * 2.85], [0.25, 0.3, 0.2], 8);
    }
    line("head", [0.75, 0.1, 2.5], [2.3, -1.1, 2], 0.14, 0.12, 6);
    ball("head", [2.35, -1.15, 1.95], [0.18, 0.18, 0.18], 8);
    ball("neck", [-0.3, 0.1, 0], [1.5, 1, 1.9], 7);
    line("neck", [1, 0.6, -1.5], [1, 0.6, 1.5], 0.3, 0.3, 4);
    line("chest", [2.7, 3.5, 0], [3.45, 0.2, 0], 0.5, 0.45, 4);
    line("chest", [3.45, 0.2, 0], [3.25, -2.4, 0], 0.42, 0.4, 4);
    for (const f of ["upperN", "upperF"]) {
      line(f, [2.2, 0, 0], [7.8, 0, 0], 1.9, 1.7, 7);
      line(f, [2.2, 0, 0], [2.9, 0, 0], 1.95, 1.9, 4);
    }
    for (const f of ["foreN", "foreF"]) {
      line(f, [0.3, 0, 0], [7.1, 0, 0], 1.6, 1.35, 7);
      line(f, [6.6, 0, 0], [7.2, 0, 0], 1.5, 1.4, 4);
    }
    face2("pelvis", [[3, 1.2, -4], [3, 1.2, 4], [4.4, -6.6, 6.4], [4.7, -7.2, 0], [4.3, -6.6, -6.4]], 4);
    for (const z of [-5.2, -2.6, 0, 2.6, 5.2]) line("pelvis", [3.2, 0.9, z], [4.5, -6.7, z * 1.18], 0.2, 0.16, 10);
    line("pelvis", [3.9, -6.1, -6], [4.6, -6.9, 0], 0.28, 0.24, 10);
    line("pelvis", [4.6, -6.9, 0], [4, -6.1, 6], 0.24, 0.28, 10);
    for (const f of ["thighN", "thighF"]) {
      line(f, [1.2, 0, 0], [8.2, 0, 0], 2.75, 2.2, 7);
      line(f, [1.2, 0, 0], [2, 0, 0], 2.8, 2.7, 4);
    }
    for (const f of ["footN", "footF"]) line(f, [-1.2, -1.35, 0], [3.6, -1.6, 0], 0.55, 0.45, 4);
  } else if (look2.style === "daoist") {
    head4([-1.5, 3.5, 0], [1.15, 1.4, 1.15], 5);
    line("head", [-1, 3.4, -1.8], [-2.4, 4.8, 1.4], 0.2, 0.16, 6);
    line("head", [-2.4, 4.8, 1.4], [-2.9, 2.2, 2.2], 0.22, 0.14, 6);
    for (const s of [-1, 1]) line("head", [-1.2, 1.6, s * 2.4], [-2.2, -4.6, s * 2.8], 0.9, 0.35, 5);
    line("head", [2.5, -1.6, 0], [3.5, -3.8, 0], 0.7, 0.5, 5);
    line("head", [3.5, -3.8, 0], [2.9, -7.2, 0], 0.5, 0.2, 5);
    line("chest", [1, 4.2, -2.1], [3.25, 1.2, 0], 0.3, 0.28, 9);
    line("chest", [1, 4.2, 2.1], [3.25, 1.2, 0], 0.3, 0.28, 9);
    line("chest", [3.25, 1.2, 0], [3.2, -2.2, 0], 0.26, 0.22, 9);
    ball("chest", [3.6, 0.8, 0.2], [0.45, 0.55, 0.55], 9);
    ball("chest", [3.76, 0.55, 0.5], [0.32, 0.34, 0.34], 7);
    line("chest", [2.7, 3.4, 0], [3.55, 1.3, 0.2], 0.18, 0.16, 10);
    face2("pelvis", [[3.1, 1.2, -4.2], [3.1, 1.2, 4.2], [4.6, -16, 7], [4.9, -16.8, 0], [4.5, -16, -7]], 4);
    face2("pelvis", [[3.2, 1.1, -2.2], [3.2, 1.1, 2.2], [4.7, -16.2, 2.4], [4.8, -16.4, 0], [4.6, -16.2, -2.4]], 10);
    line("pelvis", [3.3, 1, -4.3], [3.4, 1, 4.3], 0.55, 0.55, 10);
    ball("pelvis", [3.5, 1, 1], [0.55, 0.6, 0.55], 6);
    line("pelvis", [3.4, 0.7, 0.8], [3.1, -5.6, 1.8], 0.26, 0.2, 10);
    line("pelvis", [4.05, -15.8, -6.8], [4.9, -16.5, 0], 0.42, 0.38, 9);
    line("pelvis", [4.9, -16.5, 0], [4.25, -15.8, 6.8], 0.38, 0.42, 9);
    for (const f of ["upperN", "upperF"]) {
      line(f, [1.2, 0, 0], [7.6, 0, 0], 2.05, 1.75, 4);
      face2(f, [[1.2, -2, -2.2], [1.2, 2.4, 2.2], [6.8, 2.8, 2.6], [7, -5, -2.6]], 4);
      line(f, [6.8, -4.6, -2.4], [6.8, 2.6, 2.5], 0.32, 0.32, 9);
    }
    for (const f of ["foreN", "foreF"]) line(f, [6.5, 0, 0], [7.4, 0, 0], 1.55, 1.4, 9);
  } else if (look2.style === "student") {
    head4([-1, 1.6, 0], [2.8, 2.35, 3]);
    for (const [a, b, r] of [
      [[0.4, 2.4, 0.2], [1.8, 4.8, 0.6], 1.2],
      [[-1.2, 2.7, -0.6], [-2.4, 5.2, -1.2], 1.15],
      [[-2.4, 2.2, 0.8], [-4.2, 3.8, 1.4], 0.95],
      [[-0.2, 2.5, -2.3], [-0.6, 4.6, -3.4], 0.95],
      [[0.6, 2.3, 2.2], [1.4, 3.9, 3.2], 0.85]
    ]) line("head", a, b, r, 0.12, 5);
    for (const [z, x] of [[-1.8, 1.6], [0, 2], [1.8, 1.6]])
      line("head", [x, 2.6, z], [x + 0.5, 1.2, z * 1.05], 0.75, 0.4, 5);
    line("chest", [1.2, 4.2, -1.6], [3.35, 1.4, 0], 0.4, 0.35, 9);
    line("chest", [1.2, 4.2, 1.6], [3.35, 1.4, 0], 0.4, 0.35, 9);
    line("chest", [3.35, 1.4, 0], [3.4, -1.6, 0], 0.42, 0.36, 9);
    line("chest", [3.4, 2, 0], [3.4, 0.4, 0], 0.34, 0.3, 7);
    ball("chest", [3.45, 1.7, 1.5], [0.35, 0.4, 0.25], 6);
    face2("pelvis", [[3, 1.4, -4], [3, 1.4, 4], [3.6, -2.2, 4.6], [3.8, -2.8, 0], [3.6, -2.2, -4.6]], 4);
    ball("pelvis", [4.2, -2.2, 3.6], [1.5, 1.9, 1.2], 7);
    face2("pelvis", [[3.9, -0.6, 2.6], [3.9, -0.6, 4.9], [4.9, -1.6, 4.6], [4.9, -1.6, 2.8]], 7);
    ball("pelvis", [4.5, -2.2, 4.5], [0.32, 0.4, 0.25], 6);
    for (const f of ["thighN", "thighF"]) line(f, [1, 0, 0], [8, 0, 0], 2.7, 2.2, 7);
    for (const f of ["footN", "footF"]) {
      line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.65, 1.35, 9);
      line(f, [-1.2, -1.5, 0], [3.8, -1.7, 0], 0.5, 0.4, 7);
    }
  } else if (look2.style === "priestess") {
    head4([-1.1, 1.6, 0], [2.85, 2.45, 3.05]);
    for (const [z, x] of [[-1.9, 1.4], [-0.5, 1.9], [0.7, 1.9], [1.9, 1.4]])
      line("head", [x, 2.9, z], [x + 0.3, 1.05, z * 1.05], 0.8, 0.42, 5);
    for (const s of [-1, 1]) {
      head4([-3.3, 1.4, s * 1.6], [1.8, 1.5, 1.6], 5);
      for (let i = 0; i < 15; i++)
        head4([-3.6 - i * 0.2, 0.2 - i * 1.75, s * (1.35 + i * 0.05)], [1.8 - i * 0.02, 1.2, 1.5], 5);
      line("head", [1, 2, s * 3.2], [0.2, -7, s * 5.6], 1.15, 0.85, 5);
    }
    for (const s of [-1, 1]) head4([-0.2, 3.9, s * 1.5], [0.95, 0.6, 0.55], 10);
    ball("head", [-0.2, 3.8, 0], [0.5, 0.45, 0.45], 10);
    line("head", [-1.1, 3.6, 0.4], [-2.4, 1.6, 1.2], 0.35, 0.16, 10);
    ball("neck", [-0.3, 0.1, 0], [1.45, 0.95, 1.85], 4);
    line("neck", [1.1, 0.3, -1.2], [1.1, 0.3, 1.2], 0.3, 0.3, 10);
    ball("neck", [1.4, -0.1, 1.1], [0.45, 0.4, 0.4], 10);
    line("chest", [1, 4, -1.4], [3.3, 2.1, 0.5], 0.2, 0.18, 10);
    ball("chest", [3.62, 2, 0.8], [0.38, 0.42, 0.38], 6);
    face2("pelvis", [[3, 1.2, -4], [3, 1.2, 4], [4.4, -9, 6.4], [4.7, -9.6, 0], [4.3, -9, -6.4]], 4);
    line("pelvis", [3.3, 1.2, -4.1], [3.5, 1.2, 4.1], 0.5, 0.5, 10);
    ball("pelvis", [3.6, 1.2, 1], [0.6, 0.55, 0.5], 10);
    line("pelvis", [3.5, 0.8, 0.8], [3.1, -5, 1.6], 0.25, 0.2, 10);
    line("pelvis", [3.45, 0.8, -0.4], [3, -4.2, -1.4], 0.22, 0.18, 10);
    line("pelvis", [4, -8.7, -6.2], [4.7, -9.4, 0], 0.3, 0.3, 9);
    line("pelvis", [4.7, -9.4, 0], [4.2, -8.7, 6.2], 0.3, 0.3, 9);
    for (const f of ["shinN", "shinF"]) line(f, [0.8, 0, 0], [7.8, 0, 0], 2.05, 1.55, 9);
    for (const f of ["footN", "footF"]) {
      line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.6, 1.3, 9);
      line(f, [1.4, -0.25, -1.5], [1.4, -0.25, 1.5], 0.24, 0.24, 10);
    }
  } else if (look2.style === "sentinel") {
    head4([-0.7, 1.75, 0], [3, 2.45, 3.3], 4);
    head4([2, -0.25, 0], [1.5, 1.9, 3], 6);
    head4([1.5, 0.2, 2.5], [1.1, 1.7, 0.75], 4);
    for (const s of [-1, 1]) line("head", [3.5, 0.6, s * 0.4], [3.5, 0.6, s * 1.3], 0.28, 0.2, 8);
    line("head", [3.45, -1.15, -0.45], [3.45, -1.15, 0.45], 0.2, 0.2, 7);
    ball("neck", [-0.2, 0.1, 0], [1.55, 1, 1.9], 4);
    ball("chest", [3.3, 1.2, 0], [0.4, 0.9, 0.9], 9);
    ball("chest", [3.55, 1.2, 0], [0.3, 0.72, 0.72], 10);
    ball("chest", [3.75, 1.2, 0], [0.22, 0.45, 0.45], 8);
    line("chest", [3.3, -1, -2.2], [3.3, -1, 2.2], 0.28, 0.28, 6);
    line("chest", [3.3, -2.4, -2], [3.3, -2.4, 2], 0.26, 0.26, 6);
    for (const f of ["upperN", "upperF"]) {
      ball(f, [0.6, 0, 0], [2.6, 3, 3.1], 4);
      line(f, [1.2, 0, 0], [7.5, 0, 0], 2, 1.7, 4);
    }
    for (const f of ["foreN", "foreF"]) {
      line(f, [0.6, 0, 0], [7.2, 0, 0], 1.65, 1.45, 6);
      ball(f, [7.3, 0, 0], [1.35, 1.35, 1.35], 4);
      ball(f, [8.3, 0.2, 0], [0.35, 0.4, 0.4], 8);
      line(f, [0.5, 0, 0], [0.9, 0, 0], 1.7, 1.65, 7);
    }
    for (const f of ["thighN", "thighF"]) line(f, [1, 0, 0], [8, 0, 0], 2.75, 2.3, 4);
    for (const f of ["shinN", "shinF"]) {
      line(f, [0.4, 0, 0], [7.8, 0, 0], 2.05, 1.6, 4);
      ball(f, [0.7, 0, 0], [1.9, 2, 2], 6);
    }
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.65, 1.35, 6);
  } else if (look2.style === "gamma") {
    ball("chest", [0.4, 0.6, 0], [4.3, 4.7, 6.4], 3);
    ball("neck", [0, 0.2, 0], [2.2, 1.6, 2.8], 3);
    for (const f of ["upperN", "upperF"]) {
      ball(f, [0.4, 0, 0], [3.5, 3.9, 4.4], 3);
      line(f, [1, 0, 0], [7.4, 0, 0], 3.1, 2.7, 3);
    }
    for (const f of ["foreN", "foreF"]) {
      line(f, [0, 0, 0], [7.2, 0, 0], 2.8, 2.4, 3);
      ball(f, [7.3, 0, 0], [3, 3, 3], 3);
    }
    line("pelvis", [3.9, -2.4, -4.6], [3.9, -2.4, 4.6], 0.8, 0.8, 4);
    for (const f of ["thighN", "thighF"]) line(f, [0.6, 0, 0], [7.5, 0, 0], 3.6, 3.2, 4);
    for (const f of ["shinN", "shinF"]) line(f, [0, 0, 0], [7.6, 0, 0], 2.8, 2.3, 3);
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 2, 1.7, 3);
    head4([-1, 1.9, 0], [2.8, 2.3, 3.05], 5);
    for (const [a, b, r] of [
      [[0.4, 2.3, 0], [1.6, 4.2, 0.4], 1],
      [[-1.2, 2.5, -0.4], [-2.4, 4, -0.8], 0.9],
      [[-0.2, 2.4, -2.2], [-0.6, 3.8, -3.2], 0.8]
    ]) line("head", a, b, r, 0.1, 5);
    ball("head", [2.55, 0.9, 0], [0.5, 0.45, 1.6], 3);
    ball("head", [2.5, -1.35, 0], [0.65, 0.6, 1.15], 3);
    for (const s of [-1, 1]) ball("head", [2.4, -0.5, s * 1.1], [0.4, 0.6, 0.5], 3);
  } else if (look2.style === "asgardian") {
    cape(18, 7.5, 10);
    head4([-1, 1.9, 0], [2.85, 2.3, 3.1], 9);
    head4([-2.2, 0.8, 0], [1.6, 2.6, 2.9], 5);
    for (const s of [-1, 1]) {
      line("head", [-1.2, 1.4, s * 2.4], [-1.6, -4.8, s * 2.9], 1.15, 0.65, 5);
      line("head", [0.3, 2.1, s * 2.6], [0, 3.9, s * 3.7], 0.55, 0.08, 6);
      line("head", [0.35, 2, s * 2.7], [0.9, 3.5, s * 4.1], 0.5, 0.1, 6);
      line("head", [0.3, 1.9, s * 2.7], [-0.5, 3.5, s * 4.2], 0.45, 0.08, 6);
    }
    for (const z of [-2.2, 0, 2.2]) ball("chest", [3.1, 1.6, z], [0.55, 0.7, 0.7], 9);
    for (const s of [-1, 1]) ball("chest", [2.9, 3.7, s * 2.6], [0.6, 0.5, 0.5], 6);
    for (const f of ["foreN", "foreF"]) {
      line(f, [4.6, 0, 0], [7.2, 0, 0], 1.55, 1.45, 9);
      line(f, [4.6, 0, 0], [5, 0, 0], 1.6, 1.55, 6);
    }
    for (const f of ["shinN", "shinF"]) line(f, [6.6, 0, 0], [7.4, 0, 0], 2.05, 1.9, 9);
    line("pelvis", [3.3, 1, -4.1], [3.3, 1, 4.1], 0.5, 0.5, 6);
    ball("pelvis", [3.6, 1, 0.6], [0.5, 0.55, 0.5], 6);
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.65, 1.4, 7);
  } else if (look2.style === "patriot") {
    head4([-0.9, 1.8, 0], [2.85, 2.35, 3.05], 4);
    for (const s of [-1, 1]) {
      line("head", [0.4, 2.3, s * 2.7], [0.4, 3.5, s * 3.4], 0.35, 0.1, 9);
      line("head", [0.5, 2.2, s * 2.8], [1.1, 3.1, s * 3.5], 0.3, 0.1, 9);
    }
    const star3 = (i) => {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.3 : 2.4;
      const y = 1.7 + Math.sin(a) * r;
      return [3.3 - (y - 1.7) * 0.22, y, Math.cos(a) * r];
    };
    for (let i = 0; i < 5; i++) face2("chest", [star3(i * 2), star3(i * 2 + 1), star3((i * 2 + 9) % 10)], 9);
    face2("chest", [star3(1), star3(3), star3(5), star3(7), star3(9)], 9);
    for (let i = 0; i < 5; i++) {
      const z = -2.2 + i * 1.1;
      line("pelvis", [3.2, 0.9, z], [3.1, -3.2, z * 0.95], 0.55, 0.55, i % 2 ? 9 : 10);
    }
    line("pelvis", [3.25, 1.3, -3.8], [3.25, 1.3, 3.8], 0.45, 0.45, 7);
    ball("pelvis", [3.55, 1.3, 0.8], [0.45, 0.45, 0.4], 6);
    for (const f of ["thighN", "thighF"]) line(f, [1, 0, 0], [8, 0, 0], 2.75, 2.25, 4);
    for (const f of ["shinN", "shinF"]) {
      line(f, [0.4, 0, 0], [7.8, 0, 0], 2.05, 1.65, 4);
      line(f, [6.6, 0, 0], [7.6, 0, 0], 2, 1.9, 9);
    }
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.7, 1.4, 10);
    for (const f of ["foreN", "foreF"]) {
      ball(f, [7.2, 0, 0], [1.35, 1.35, 1.35], 4);
      line(f, [5.8, 0, 0], [6.4, 0, 0], 1.4, 1.35, 10);
    }
  } else if (look2.style === "sun-goddess") {
    face2("head", [[-5, -6.4, -5.6], [-5, -6.4, 5.6], [-5, 0.4, 8], [-5, 8.6, 0], [-5, 0.4, -8]], 6);
    face2("head", [[-4.8, -5, -4.2], [-4.8, -5, 4.2], [-4.8, 0.2, 6], [-4.8, 6.6, 0], [-4.8, 0.2, -6]], 4);
    for (const a of [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4]) {
      const cy = 1.6 + Math.sin(a) * 7.2, cz = Math.cos(a) * 9.2;
      line("head", [-5, 1.6 + Math.sin(a) * 8.6, Math.cos(a) * 10.4], [-5, cy, cz], 0.22, 0.12, 6);
    }
    head4([-1, 1.7, 0], [2.9, 2.4, 3.05]);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 9; i++)
        head4([-3.5 - i * 0.12, -1.2 - i * 2.1, s * (1.4 + i * 0.14)], [1.5, 1.15, 1.3], 5);
      line("head", [0.6, 2.3, s * 2.6], [-1.6, -1.2, s * 3.2], 0.9, 0.4, 5);
      line("head", [2.1, 2.2, s * 2.2], [2.7, -0.6, s * 2.4], 0.7, 0.25, 5);
    }
    line("head", [-0.6, 3.6, -2.2], [2.2, 4.8, 0.4], 0.24, 0.16, 6);
    line("head", [-0.6, 3.6, 2.2], [2.2, 4.8, -0.4], 0.24, 0.16, 6);
    head4([2.08, 1.62, 0], [0.26, 0.42, 0.42], 10);
    ball("chest", [3.7, 1.2, 0.4], [0.55, 1, 1], 6);
    ball("chest", [3.95, 1.2, 0.4], [0.3, 0.72, 0.72], 8);
    line("chest", [4.1, 0.4, 0.4], [4.1, 2, 0.4], 0.14, 0.14, 6);
    line("neck", [0.6, 0.2, -1.4], [3.6, 2.1, 0.4], 0.14, 0.14, 6);
    for (const f of ["upperN", "upperF"]) {
      line(f, [0.8, 0, 0], [7.4, 0, 0], 1.9, 1.7, 4);
      face2(f, [[0.8, -1.8, -2], [0.8, 2, 2], [6.4, 2.4, 2.6], [6.6, -4.6, -2.4]], 4);
      line(f, [6.5, -4.4, -2.2], [6.5, 2.3, 2.4], 0.3, 0.3, 6);
    }
    line("chest", [3.2, 3.4, 0], [2.4, -2.2, 0.8], 0.28, 0.24, 9);
    face2("pelvis", [[3.1, 1.2, -4.2], [3.1, 1.2, 4.2], [4.5, -11, 6.6], [4.8, -11.6, 0], [4.4, -11, -6.6]], 10);
    for (const z of [-4.6, -1.6, 1.6, 4.6]) line("pelvis", [3.3, 0.9, z], [4.6, -10.8, z * 1.35], 0.2, 0.16, 6);
    line("pelvis", [3.25, 1.2, -4.2], [3.35, 1.2, 4.2], 0.55, 0.55, 6);
    for (const f of ["shinN", "shinF"]) line(f, [0.8, 0, 0], [7.8, 0, 0], 2.05, 1.55, 9);
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.6, 1.3, 7);
  } else if (look2.style === "moon-god") {
    face2("head", [[-0.6, 2.4, -1.9], [-0.6, 2.4, 1.9], [0.8, 7.6, 2.1], [0.8, 7.6, -2.1]], 5);
    line("head", [0.9, 7.5, -2.2], [0.9, 7.5, 2.2], 0.32, 0.32, 6);
    line("head", [-0.2, 2.3, -2], [-0.2, 2.3, 2], 0.3, 0.3, 6);
    line("head", [1.2, 4.4, -1.7], [1.9, 6.1, 0], 0.34, 0.24, 8);
    line("head", [1.9, 6.1, 0], [1.2, 7.8, 1.7], 0.3, 0.2, 8);
    for (let i = 0; i <= 9; i++) {
      const a = -1.35 + i / 9 * 2.7;
      head4([-4.4, 2.6 + Math.sin(a) * 5.2, Math.cos(a) * 5.2], [0.5, 0.95, 0.95], 8);
      if (i % 3 === 0) head4([-4.5, 2.6 + Math.sin(a) * 6.4, Math.cos(a) * 6.4], [0.3, 0.5, 0.5], 5);
    }
    face2("head", [[-3.4, 1.2, -3.4], [-3.4, 1.2, 3.4], [-4, -8, 3.2], [-4.2, -11, 0], [-4, -8, -3.2]], 5);
    for (const s of [-1, 1]) line("head", [1, 2, s * 2.7], [0.2, -5.2, s * 3.2], 0.8, 0.3, 5);
    line("chest", [1, 4.2, -2], [3.3, 1.2, 0], 0.3, 0.28, 10);
    line("chest", [1, 4.2, 2], [3.3, 1.2, 0], 0.3, 0.28, 10);
    line("chest", [3.3, 1.2, 0], [3.2, -2.4, 0], 0.26, 0.22, 10);
    for (const f of ["upperN", "upperF"]) {
      line(f, [1.2, 0, 0], [7.6, 0, 0], 2.05, 1.75, 4);
      face2(f, [[1.2, -2, -2.2], [1.2, 2.4, 2.2], [6.8, 2.8, 2.6], [7, -5, -2.6]], 4);
      line(f, [6.8, -4.6, -2.4], [6.8, 2.6, 2.5], 0.32, 0.32, 10);
    }
    face2("pelvis", [[3.1, 1.2, -4.2], [3.1, 1.2, 4.2], [4.6, -16, 7], [4.9, -16.8, 0], [4.5, -16, -7]], 4);
    line("pelvis", [3.25, 1.2, -4.2], [3.35, 1.2, 4.2], 0.6, 0.6, 10);
    ball("pelvis", [4.4, 0.2, 1.2], [0.4, 0.55, 0.55], 8);
    ball("chest", [3.55, 1.6, -0.8], [0.32, 0.4, 0.4], 8);
    for (const f of ["shinN", "shinF"]) line(f, [0.8, 0, 0], [7.8, 0, 0], 2, 1.5, 9);
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.6, 1.3, 7);
  } else if (look2.style === "storm-god") {
    head4([-1, 1.7, 0], [2.9, 2.3, 3.1]);
    for (const [a, b, r] of [
      [[0.4, 2.4, 0], [1.8, 5.8, 0.4], 1.3],
      [[-1.2, 2.8, -0.4], [-2.8, 6, -1], 1.25],
      [[-2.4, 2.2, 0.6], [-4.8, 4.4, 1.4], 1.1],
      [[-0.2, 2.5, -2.4], [-0.8, 5, -3.6], 1],
      [[0.4, 2.4, 2.3], [0.8, 4.6, 3.6], 0.95]
    ]) line("head", a, b, r, 0.12, 5);
    for (const s of [-1, 1]) {
      line("head", [-2.6, 0.6, s * 2.2], [-4.2, -4.4, s * 2.8], 1.2, 0.5, 5);
      line("head", [1.2, 1.6, s * 2.6], [0.4, -2.6, s * 3.1], 0.8, 0.3, 5);
    }
    line("chest", [2.6, 2.8, -2.6], [3.2, 1.2, 0], 0.35, 0.3, 3);
    line("chest", [2.6, 2.8, 2.6], [3.2, 1.2, 0], 0.35, 0.3, 3);
    line("chest", [1.8, 0.6, -2.2], [2.6, -1.4, 0], 0.25, 0.22, 3);
    face2("chest", [[-2.6, 3, 1.6], [-2.6, 3, 4.6], [-7.4, -8.6, 6], [-8.4, -10, 2.4], [-7.6, -8.2, 1.2]], 4);
    ball("upperF", [0.4, 0, 0], [2.6, 2.8, 3], 4);
    line("chest", [3.4, 2.6, -3.4], [3.8, -1.6, 3.2], 0.7, 0.7, 10);
    for (let i = 0; i < 4; i++) line("chest", [3.45, 2.2 - i * 1.1, -3.3], [3.85, 2 - i * 1.1, 3.1], 0.22, 0.22, 4);
    line("chest", [3.9, -1, 2.8], [3.2, -6.4, 3.2], 0.45, 0.2, 10);
    line("chest", [3.6, -0.6, 2.2], [2.6, -5.4, 2.6], 0.4, 0.18, 10);
    for (const f of ["foreN", "foreF"]) line(f, [1, 0, 0], [7, 0, 0], 1.65, 1.4, 7);
    face2("pelvis", [[3.1, 1.2, -4.4], [3.1, 1.2, 4.4], [4.4, -7.4, 6.2], [4.8, -8, 0], [4.3, -7.4, -6.2]], 4);
    line("pelvis", [3.25, 1.2, -4.4], [3.35, 1.2, 4.4], 0.65, 0.65, 10);
    line("pelvis", [3.4, 0.8, 1.4], [3, -4.6, 2], 0.3, 0.22, 10);
    for (const f of ["shinN", "shinF"]) line(f, [0.8, 0, 0], [7.8, 0, 0], 2.05, 1.6, 7);
    for (const f of ["footN", "footF"]) line(f, [-1, -0.7, 0], [3.6, -1.1, 0], 1.6, 1.3, 7);
    line("upperF", [2, 1.4, 0], [4, 2.2, 0], 0.2, 0.18, 8);
    line("upperF", [4, 2.2, 0], [5, 1.2, 0], 0.18, 0.16, 8);
    line("upperF", [4, 2.2, 0], [4.6, 3.2, 0.4], 0.14, 0.12, 8);
  }
}

// ../pixelfx/src/core/weapons.js
var C = Object.fromEntries(Object.entries({
  white: "#fffdf2",
  silver: "#d8e4ed",
  steel: "#8b9cb8",
  edge: "#53627e",
  ink: "#25283d",
  dark: "#3c3951",
  wrap: "#a8939d",
  leather: "#60394b",
  gold: "#f0cb72",
  goldL: "#fff0b4",
  goldD: "#a3683d",
  wood: "#a3714a",
  woodD: "#603f36",
  red: "#c75461",
  redL: "#f48b74",
  cyan: "#91dbe1",
  blue: "#568bb8",
  violet: "#8e71bb",
  jade: "#7fd3b0",
  jadeD: "#3f7f68",
  patina: "#7aa88a",
  patinaD: "#456b58",
  ivory: "#f7eed9",
  ivoryD: "#cbb796",
  bronze: "#b98b4a",
  bronzeD: "#6f5228",
  rose: "#e8b3b8"
}).map(([k, v]) => [k, hex(v) >>> 0]));
function shaft(T4, from, to, r, light, dark) {
  for (let i = from; i <= to; i += 0.4) for (let k = -r; k <= r; k += 0.4)
    T4(i, k, k < 0 ? light : dark);
}
function band2(T4, at8, width, radius3, light = C.gold, dark = C.goldD) {
  shaft(T4, at8, at8 + width, radius3, light, dark);
}
function polygon(T4, pts, color) {
  const x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
  const y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
  for (let x = x0; x <= x1; x += 0.4) for (let y = y0; y <= y1; y += 0.4) {
    let inside2 = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[j];
      if (ay > y !== by > y && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside2 = !inside2;
    }
    if (inside2) T4(x, y, typeof color === "function" ? color(x, y) : color);
  }
}
function ring(T4, cx, cy, r, c) {
  for (let a = 0; a < Math.PI * 2; a += 0.1) T4(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
}
function wraps(T4, from, to, radius3 = 0.9) {
  shaft(T4, from, to, radius3, C.leather, C.ink);
  for (let i = from + 0.5; i < to; i += 1.8) for (let k = -radius3; k <= radius3; k += 0.4) T4(i + k * 0.5, k, C.wrap);
}
var MELEE_SHAPES = {
  dagger: { two: -3, draw(T4) {
    wraps(T4, -3.8, 2, 0.7);
    band2(T4, -4.3, 0.7, 1.15);
    polygon(T4, [[2, -3.2], [3.3, -2], [3.3, 2], [2, 3.2]], C.gold);
    polygon(T4, [[3, -1.7], [8, -2.2], [14, 0], [8, 1.9], [3, 1.7]], (_, y) => y < -0.7 ? C.white : y < 0.25 ? C.silver : C.edge);
    for (let i = 4; i < 11; i += 0.5) T4(i, 0, C.steel);
    T4(-4.3, 0, C.cyan);
  } },
  staff: { two: -9, draw(T4) {
    shaft(T4, -25, 34, 0.9, C.wood, C.woodD);
    wraps(T4, -12, 5, 0.95);
    for (const at8 of [-25, -21, 28, 32]) band2(T4, at8, 1.8, 1.35, C.goldL, C.goldD);
    for (const at8 of [-23, 29]) {
      T4(at8, -1.4, C.goldL);
      T4(at8 + 1.2, 1.4, C.gold);
    }
  } },
  lance: { two: -11, draw(T4) {
    shaft(T4, -21, 43, 0.65, C.wood, C.woodD);
    wraps(T4, -10, 3, 0.85);
    for (const at8 of [-21, 29, 35, 41]) band2(T4, at8, 1.1, 1.2);
    polygon(T4, [[42, -1.5], [49, -3.5], [62, 0], [49, 3.5], [42, 1.5]], (_, y) => y < -0.7 ? C.white : y < 0.4 ? C.silver : C.edge);
    shaft(T4, 44, 59, 0.3, C.goldL, C.gold);
    polygon(T4, [[40, 1], [37, 7.5], [32, 8], [34, 5], [30, 6], [36, 1]], C.red);
    polygon(T4, [[39, 1.2], [36, 6], [33, 6.8], [36.8, 1.2]], C.redL);
  } },
  "holy-sword": { two: -5, draw(T4) {
    wraps(T4, -6.5, 2.6, 1);
    ring(T4, -7.4, 0, 1.7, C.gold);
    T4(-7.4, 0, C.cyan);
    polygon(T4, [[2, -1.8], [0, -7.8], [4, -5.8], [5.5, -2], [5.5, 2], [4, 5.8], [0, 7.8], [2, 1.8]], C.gold);
    for (const s of [-1, 1]) for (let k = 2; k <= 6; k += 0.4) T4(3 - k * 0.35, s * k, C.goldL);
    polygon(T4, [[5, -3.1], [28, -3.1], [40, 0], [28, 3.1], [5, 3.1]], (_, y) => y < -1.4 ? C.white : y < 1 ? C.silver : C.blue);
    shaft(T4, 8, 32, 0.4, C.goldL, C.gold);
    for (const at8 of [12, 19, 26]) for (const s of [-1, 1]) T4(at8, s * 1.5, C.gold);
    ring(T4, 4, 0, 1.5, C.goldL);
    T4(4, 0, C.cyan);
  } },
  katana: { two: -5, draw(T4) {
    wraps(T4, -7, 2.5, 0.85);
    band2(T4, -7.6, 0.6, 1.1);
    band2(T4, 2.6, 0.7, 3.2, C.goldL, C.goldD);
    for (let i = 3.4; i < 36; i += 0.35) {
      const u = (i - 3.4) / 32.6, curve2 = -2.8 * u * u, width = u > 0.86 ? (1 - u) / 0.14 * 1.7 : 1.7;
      for (let k = -width; k <= width; k += 0.4) T4(i, curve2 + k, k < -0.6 ? C.white : k < 0.5 ? C.silver : C.edge);
    }
    T4(-7, -1.1, C.redL);
  } },
  "war-mace": { two: -5, draw(T4) {
    shaft(T4, -8, 23, 0.9, C.steel, C.edge);
    wraps(T4, -7, 5, 1);
    band2(T4, -8.5, 1.1, 1.5);
    polygon(T4, [[20, -3], [23, -6.4], [28, -6.4], [32, -2], [32, 2], [28, 6.4], [23, 6.4], [20, 3]], (_, y) => y < -2 ? C.silver : y < 1.5 ? C.steel : C.edge);
    for (const s of [-1, 1]) {
      polygon(T4, [[22, s * 4], [23.5, s * 10], [25, s * 5]], C.silver);
      polygon(T4, [[27, s * 5], [29.5, s * 9], [29.5, s * 3]], C.edge);
    }
    polygon(T4, [[30, -1.7], [35, 0], [30, 1.7]], C.silver);
    band2(T4, 24, 1, 6, C.gold, C.goldD);
    T4(25, -3, C.goldL);
  } },
  kusanagi: { two: -7, draw(T4) {
    wraps(T4, -7.6, 2, 0.85);
    band2(T4, -8.2, 0.6, 1.1);
    ring(T4, -8.8, 0, 1.25, C.gold);
    T4(-8.8, 0, C.jade);
    T4(-8.8, -0.6, C.goldL);
    polygon(T4, [[2.2, -3.6], [3.6, -2.4], [3.6, 2.4], [2.2, 3.6]], C.gold);
    for (const dy of [-2.8, 0, 2.8]) polygon(T4, [[2.7, dy - 1.1], [4.7, dy - 0.35], [4.7, dy + 0.35], [2.7, dy + 1.1]], C.goldL);
    for (let i = 4; i < 37; i += 0.35) {
      const u = (i - 4) / 33, w = u > 0.9 ? (1 - u) / 0.1 * 1.9 : 1.9;
      for (let k = -w; k <= w; k += 0.4) T4(i, k, k < -1.2 ? C.white : k < -0.25 ? C.silver : k < 0.5 ? C.steel : C.edge);
    }
    for (let i = 5; i < 35; i += 0.7) T4(i, 0, C.cyan);
    for (const dy of [-1.6, 1.6]) for (let i = 4.4; i < 7; i += 0.3) T4(i, dy, C.jade);
    T4(-7.2, -1.2, C.cyan);
  } },
  totsuka: { two: -9, draw(T4) {
    wraps(T4, -10, 2.4, 0.95);
    band2(T4, -10.6, 0.6, 1.3, C.bronze, C.bronzeD);
    polygon(T4, [[-11.4, -1.5], [-9.4, 0], [-11.4, 1.5]], C.gold);
    polygon(T4, [[2.4, -5], [4.2, -3.2], [4.2, 3.2], [2.4, 5]], C.gold);
    polygon(T4, [[3, -4.2], [4, -2.4], [4, 2.4], [3, 4.2]], C.goldD);
    for (let i = 4.6; i < 46; i += 0.35) {
      const u = (i - 4.6) / 41, w = u > 0.9 ? (1 - u) / 0.1 * 2.4 : 2.4;
      for (let k = -w; k <= w; k += 0.4) T4(i, k, k < -1.5 ? C.white : k < -0.3 ? C.silver : k < 0.8 ? C.steel : C.edge);
    }
    for (let i = 6; i < 44; i += 0.5) T4(i, 0, C.violet);
    for (const dy of [-1.4, 1.4]) for (let i = 5; i < 8.6; i += 0.3) T4(i, dy, C.violet);
    T4(-9.7, 0, C.redL);
  } },
  "yata-mirror": { draw(T4) {
    wraps(T4, -4.8, 0.4, 0.8);
    band2(T4, -5, 0.6, 1.15, C.bronze, C.bronzeD);
    ring(T4, 4, 0, 4.8, C.bronze);
    ring(T4, 4, 0, 4.1, C.gold);
    for (let y = -3.6; y <= 3.6; y += 0.4) for (let x = 0.8; x <= 7.2; x += 0.4) {
      const d = (x - 4) ** 2 + y * y;
      if (d <= 3.7 * 3.7) T4(x, y, y < -1 ? C.ivory : y < 0.9 ? C.goldL : C.gold);
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) T4(4 + Math.cos(a) * 2.4, Math.sin(a) * 2.4, C.bronzeD);
    T4(4, 0, C.white);
    T4(3, 0, C.white);
    T4(5, 0, C.white);
    for (let i = 0; i < 3; i++) T4(-5.6 - i * 0.4, -1.2 - i * 0.7, i & 1 ? C.red : C.redL);
  } },
  rapier: { two: -3.5, draw(T4) {
    wraps(T4, -4, 2, 0.65);
    band2(T4, -5, 0.7, 1.1);
    ring(T4, 2.6, 0, 3.3, C.gold);
    ring(T4, -0.2, 1.2, 3.2, C.goldD);
    for (let i = -2; i < 2; i += 0.4) T4(i, -3.2, C.goldL);
    for (let i = 4; i <= 38; i += 0.35) {
      T4(i, 0, C.silver);
      if (i < 32) T4(i, -0.5, C.white);
    }
    T4(-4.5, 0, C.violet);
  } }
};
var THROWN_SHAPES = {
  kunai: { two: -2.5, draw(T4) {
    wraps(T4, -4, 2.4, 0.65);
    ring(T4, -6, 0, 1.8, C.steel);
    T4(-7.8, 0, C.silver);
    band2(T4, 2.3, 0.5, 1.4, C.edge, C.ink);
    polygon(T4, [[3, -1], [7.2, -3.1], [17, 0], [7.2, 3.1], [3, 1]], (_, y) => y < -0.25 ? C.steel : C.ink);
    polygon(T4, [[3.5, -0.2], [7.2, -2.8], [17, 0], [7.2, 0.4]], C.silver);
    for (let i = 7; i < 16.5; i += 0.5) T4(i, (17 - i) * -0.04, C.white);
  } },
  "powder-bomb": { draw(T4) {
    wraps(T4, -4, 2, 0.7);
    band2(T4, -4.2, 0.7, 1.2, C.gold, C.goldD);
    for (let x = 3; x <= 13; x += 0.4) for (let y = -5; y <= 5; y += 0.4) {
      const d = (x - 8) ** 2 / 26 + y * y / 25;
      if (d <= 1) T4(x, y, y < -1 ? C.ink : y < 2 ? C.dark : C.edge);
    }
    band2(T4, 6.5, 1, 5.2, C.gold, C.goldD);
    for (let i = 0; i < 4; i++) T4(13 + i * 0.8, -5 - i * 0.6, i & 1 ? C.gold : C.goldL);
  } },
  boomerang: { draw(T4) {
    wraps(T4, -4, 2, 0.7);
    band2(T4, -4.2, 0.7, 1.2, C.gold, C.goldD);
    for (let u = 0; u <= 1; u += 0.02) {
      const a = -0.75 + u * 1.5, r = 6 + u * 11, x = 3 + Math.cos(a) * r, y = Math.sin(a) * r;
      T4(x, y, C.wood);
      T4(x + 0.6, y - 0.4, C.goldL);
    }
    for (let i = 0; i < 5; i++) T4(10 + i * 1.1, -2.5 + i * 0.35, C.silver);
  } },
  talisman: { draw(T4) {
    wraps(T4, -3.4, 1.2, 0.6);
    band2(T4, -3.6, 0.6, 1.05, C.gold, C.goldD);
    polygon(T4, [[2.6, -6], [10.6, -5], [11.6, 6], [3.6, 7]], (x, y) => {
      if (x > 10.4 || y > 5.7 || x < 3.2 || y < -5.4) return C.goldD;
      if (x > 8.3) return C.red;
      if (x > 5 && x < 7.5 && (y > -1.9 && y < -1.2 || y > 0.3 && y < 1)) return C.ink;
      if (y > -2.6 && y < 1.4 && x > 6.05 && x < 6.55) return C.ink;
      return C.goldL;
    });
  } },
  "flying-sword": { two: -2.4, draw(T4) {
    wraps(T4, -3, 1.6, 0.6);
    ring(T4, -3.8, 0, 1.2, C.gold);
    T4(-3.8, 0, C.jade);
    band2(T4, 1.6, 0.6, 2.2, C.gold, C.goldD);
    for (let i = 2.2; i <= 16.4; i += 0.4) {
      const u = (i - 2.2) / 14.2, width = u > 0.84 ? (1 - u) / 0.16 * 1.2 : 1.2;
      for (let k = -width; k <= width; k += 0.4) T4(i, k, k < -0.45 ? C.white : k < 0.3 ? C.silver : C.edge);
    }
    for (let i = 3; i < 15.4; i += 0.6) T4(i, 0, C.steel);
    for (let i = 0; i < 3; i++) T4(-4.4 - i * 0.4, 1 + i * 1.1, i & 1 ? C.red : C.redL);
  } },
  "binding-silk": { draw(T4) {
    for (let x = -2.2; x <= 6.6; x += 0.4) for (let y = -2.2; y <= 2.2; y += 0.4) {
      const d = (x - 2.2) ** 2 / 20 + y * y / 4.6;
      if (d <= 1) T4(x, y, y < -0.55 ? C.ivory : y < 0.7 ? C.ivoryD : C.woodD);
    }
    band2(T4, -2.4, 0.9, 2.5, C.gold, C.goldD);
    band2(T4, 5.5, 0.9, 2.5, C.gold, C.goldD);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 8; j++) {
        const x = -2.6 - j * 0.55 + Math.sin(j * 0.8 + i * 2) * 1.1, y = (i ? -1.4 : 1.6) + j * 0.9;
        T4(x, y, j & 1 ? C.ivoryD : C.ivory);
        if (j % 3 === 0) T4(x, y + 0.5, C.goldD);
      }
    }
  } },
  "soul-bell": { draw(T4) {
    ring(T4, -2.2, 0, 1.3, C.bronze);
    T4(-2.2, 0, C.goldL);
    shaft(T4, -1.4, 0.4, 0.8, C.bronze, C.bronzeD);
    polygon(T4, [[0.6, -3], [3.6, -2.6], [7.4, -4.6], [8.4, 0], [7.4, 4.6], [3.6, 2.6], [0.6, 3]], (x, y) => {
      if (y > 3.4 || y < -3.4) return C.bronzeD;
      if (x > 6.8) return C.patinaD;
      if (y < -1.6) return C.bronze;
      if (y > 1.8) return C.bronzeD;
      return x > 4 ? C.patina : C.bronze;
    });
    band2(T4, 7.5, 1.1, 4.9, C.gold, C.goldD);
    T4(8.9, 0, C.goldL);
    T4(7.2, 0, C.goldD);
    for (let i = 0; i < 4; i++) T4(-1.4 - i * 0.4, -2.6 - i * 0.9, i & 1 ? C.red : C.redL);
  } },
  "pear-needles": { draw(T4) {
    band2(T4, -1.2, 2, 2.4, C.blue, C.edge);
    for (let k = -2; k <= 2; k += 0.4) T4(0.4, k, C.wrap);
    for (const dy of [-2.2, 0, 2.2]) {
      for (let i = 1.4; i <= 13; i += 0.35) T4(i, dy, i > 11.4 ? C.white : i > 5 ? C.silver : C.steel);
      T4(13.2, dy, C.white);
      T4(13.6, dy, C.white);
      T4(2.4, dy, C.rose);
    }
  } }
};
var WEAPON_CLASSES = Object.freeze([
  { id: "melee", label: "\u8FD1\u6218\u6B66\u5668", name: "Melee" },
  { id: "thrown", label: "\u6295\u63B7\u6B66\u5668", name: "Thrown" }
]);
var ARMORY = Object.freeze([
  { id: "sword", label: "\u957F\u5251", name: "Sword", fx: "melee/sword-slash", tip: 28, family: "sweep", class: "melee" },
  { id: "dagger", label: "\u5315\u9996", name: "Dagger", fx: "melee/dagger-flurry", tip: 14, family: "thrust", class: "melee" },
  { id: "staff", label: "\u91D1\u7B8D\u68CD", name: "Banded staff", fx: "melee/staff-combo", tip: 34, family: "sweep", class: "melee" },
  { id: "spear", label: "\u957F\u77DB", name: "Spear", fx: "melee/spear-sweep", tip: 47, family: "sweep", class: "melee" },
  { id: "lance", label: "\u9A91\u58EB\u957F\u67AA", name: "Knight lance", fx: "melee/lance-thrust", tip: 62, family: "thrust", class: "melee" },
  { id: "holy-sword", label: "\u5723\u5251", name: "Holy sword", fx: "melee/holy-sword-cleave", tip: 40, family: "sweep", class: "melee" },
  { id: "katana", label: "\u592A\u5200", name: "Katana", fx: "melee/katana-draw", tip: 36, family: "sweep", class: "melee" },
  { id: "kusanagi", label: "\u4E91\u4ECE\u5251", name: "Kusanagi", fx: "kami/ame-no-murakumo", tip: 36, family: "sweep", class: "melee" },
  { id: "totsuka", label: "\u5341\u62F3\u5251", name: "Totsuka", fx: "kami/susanoo-thunder", tip: 44, family: "sweep", class: "melee" },
  { id: "yata-mirror", label: "\u516B\u54AB\u955C", name: "Yata mirror", fx: "kami/amaterasu-sun", tip: 9, family: "slam", class: "melee" },
  { id: "war-mace", label: "\u91CD\u9489\u9524", name: "War mace", fx: "melee/mace-crush", tip: 35, family: "slam", class: "melee" },
  { id: "rapier", label: "\u523A\u5251", name: "Rapier", fx: "melee/rapier-lunge", tip: 38, family: "thrust", class: "melee" },
  { id: "kunai", label: "\u82E6\u65E0", name: "Kunai", fx: "thrown/kunai-throw", tip: 18, family: "throw", class: "thrown" },
  { id: "powder-bomb", label: "\u706B\u836F\u5F39", name: "Powder bomb", fx: "thrown/powder-bomb-throw", tip: 15, family: "throw", class: "thrown" },
  { id: "boomerang", label: "\u56DE\u65CB\u9556", name: "Boomerang", fx: "thrown/boomerang-throw", tip: 19, family: "throw", class: "thrown" },
  { id: "talisman", label: "\u7B26\u7B93", name: "Talisman", fx: "thrown/talisman-throw", tip: 17, family: "throw", class: "thrown" },
  { id: "flying-sword", label: "\u98DE\u5251", name: "Flying sword", fx: "thrown/flying-sword-throw", tip: 17, family: "throw", class: "thrown" },
  { id: "binding-silk", label: "\u7F1A\u4ED9\u7EEB", name: "Binding silk", fx: "thrown/binding-silk-throw", tip: 9, family: "throw", class: "thrown" },
  { id: "soul-bell", label: "\u6444\u9B42\u94C3", name: "Soul bell", fx: "thrown/soul-bell-throw", tip: 10, family: "throw", class: "thrown" },
  { id: "pear-needles", label: "\u68A8\u82B1\u9488", name: "Pear-blossom needles", fx: "thrown/pear-needles-throw", tip: 13, family: "throw", class: "thrown" }
]);
var MELEE_WEAPONS = Object.freeze(ARMORY.filter((w) => w.class === "melee"));
var THROWN_WEAPONS = Object.freeze(ARMORY.filter((w) => w.class === "thrown"));

// ../pixelfx/src/core/rig.js
var PAL2 = Object.fromEntries(Object.entries(DUMMY_PAL).map(([k, v]) => [k, hex(v) >>> 0]));
var INK2 = PAL2.k;
var SEAM = PAL2.J;
var MARK = PAL2.m;
var SHELL = [PAL2.A, PAL2.B, PAL2.C, PAL2.D];
var CORE = [PAL2.E, PAL2.F, PAL2.G, PAL2.G];
var DEG = Math.PI / 180;
var W0 = 24;
var H0 = 38;
var add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
var dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
var cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
var len = (a) => Math.hypot(a[0], a[1], a[2]);
var unit = (a) => mul(a, 1 / (len(a) || 1e-6));
var rotY = (t) => {
  const c = Math.cos(t), s = Math.sin(t);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
};
var rotZ = (t) => {
  const c = Math.cos(t), s = Math.sin(t);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};
var mm = (A2, B3) => {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A2[r * 3] * B3[c] + A2[r * 3 + 1] * B3[3 + c] + A2[r * 3 + 2] * B3[6 + c];
  return o;
};
var mv = (M2, v) => [M2[0] * v[0] + M2[1] * v[1] + M2[2] * v[2], M2[3] * v[0] + M2[4] * v[1] + M2[5] * v[2], M2[6] * v[0] + M2[7] * v[1] + M2[8] * v[2]];
var tv = (M2, v) => [M2[0] * v[0] + M2[3] * v[1] + M2[6] * v[2], M2[1] * v[0] + M2[4] * v[1] + M2[7] * v[2], M2[2] * v[0] + M2[5] * v[1] + M2[8] * v[2]];
var clamp01 = (v) => Math.max(0, Math.min(1, v));
var M = {
  pelvis: 19.7,
  spine1: 2.8,
  spine2: 4.6,
  shoulderUp: 2.5,
  shoulderOut: 5.9,
  neckUp: 4,
  headUp: 3.1,
  hipDown: 1.1,
  hipOut: 2.8,
  thigh: 8.6,
  shin: 8.3,
  upper: 7.6,
  fore: 7.4,
  turn: 36 * DEG
};
var STAND = { lean: 0, crouch: 0, yaw: 0, fx: -3, fy: -15, bx: 5, by: -15, ffx: -2, ffy: -4, fbx: 3, fby: -4 };
function ik(a, target, L1, L22, pole) {
  let to = sub(target, a), d = len(to);
  const reach = L1 + L22 - 0.02;
  if (d > reach) {
    to = mul(to, reach / d);
    d = reach;
  }
  const u = unit(to), along4 = (L1 * L1 - L22 * L22 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - along4 * along4));
  let v = sub(pole, mul(u, dot(pole, u)));
  v = len(v) < 1e-4 ? unit(cross(u, [0, 0, 1])) : unit(v);
  return { joint: add(a, add(mul(u, along4), mul(v, h))), end: add(a, to), u, v };
}
function frame(t, R4) {
  return { t, R: R4 };
}
function boneFrame(a, b, pole) {
  const x = unit(sub(b, a));
  let y = sub(pole, mul(x, dot(pole, x)));
  y = len(y) < 1e-4 ? unit(cross(x, [0, 0, 1])) : unit(y);
  const z = cross(x, y);
  return frame(a, [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]);
}
var weaponOf = (name) => WEAPONS[name];
function solve(pose4) {
  const q = { ...STAND, ...pose4 }, lean = q.lean, W7 = q.weapon && weaponOf(q.weapon), OW = q.offWeapon && weaponOf(q.offWeapon);
  const sa = q.sa ?? 0, wl = q.wl ?? 1, axisZ = Math.sqrt(Math.max(0, 1 - wl * wl)) * (q.wz ?? 1);
  const axis = [Math.cos(sa) * wl, -Math.sin(sa) * wl, axisZ], side = [-Math.sin(sa), -Math.cos(sa), 0];
  const two = !!(q.two && W7), nearZ = q.fz ?? (two ? 3 : 4.5);
  const fwd = (q.fx - STAND.fx) / 24, farFwd = two ? 0 : (q.bx - STAND.bx) / 22;
  let turn = M.turn + (fwd >= 0 ? -44 * DEG * Math.min(1, fwd) : 28 * DEG * Math.min(1, -fwd * 1.8));
  turn += (farFwd > 0 ? 34 * DEG * Math.min(1, farFwd) : 0) + (q.twist ?? 0) * 4 * DEG;
  if (q.turn !== void 0) turn = q.turn;
  const hipTurn = M.turn + (turn - M.turn) * 0.45, tilt = Math.atan2(lean, 13);
  const Rp = mm(rotZ(-tilt * 0.25), rotY(-hipTurn)), Rc = mm(rotZ(-tilt), rotY(-turn));
  const ankleN = [q.ffx, -q.ffy - 1.8, q.fzz ?? 2.4], ankleF = [q.fbx, -q.fby - 1.8, q.bzz ?? -2.4];
  let pelvis = [lean * 0.2, M.pelvis - q.crouch, 0];
  const hipAt = (s) => add(pelvis, mv(Rp, [0, -M.hipDown, s * M.hipOut]));
  const maxLeg = (M.thigh + M.shin) * 0.995;
  for (const [s, a] of [[1, ankleN], [-1, ankleF]]) {
    const h = hipAt(s), dx = h[0] - a[0], dz = h[2] - a[2], flat = dx * dx + dz * dz;
    if (flat < maxLeg * maxLeg) {
      const top = a[1] + Math.sqrt(maxLeg * maxLeg - flat);
      if (h[1] > top) pelvis = [pelvis[0], pelvis[1] - (h[1] - top), pelvis[2]];
    }
  }
  const waist = add(pelvis, [Math.sin(tilt * 0.45) * M.spine1, Math.cos(tilt * 0.45) * M.spine1, 0]);
  const chest = add(waist, [Math.sin(tilt) * M.spine2, Math.cos(tilt) * M.spine2, 0]);
  const neck = add(chest, mv(Rc, [0, M.neckUp, 0]));
  const headTurn = M.turn * 0.9 + (turn - M.turn) * 0.35, nod = tilt * 0.35 + (q.hy ?? 0) * 7 * DEG, roll = (q.hx ?? 0) * 7 * DEG;
  const Rh = mm(rotZ(-nod - roll), rotY(-headTurn));
  const head4 = add(neck, mv(Rh, [0.15, M.headUp, 0]));
  const pick = (s, target) => {
    const base = add(chest, mv(Rc, [0, M.shoulderUp, s * M.shoulderOut])), to = sub(target, base), d = len(to);
    return add(base, mul(unit(to), Math.min(1.8, Math.max(0, d - 11) * 0.35)));
  };
  const nearT = [q.fx, -q.fy, nearZ];
  const farT = two ? [q.fx + axis[0] * W7.two, -q.fy + axis[1] * W7.two, nearZ + axis[2] * W7.two] : [q.bx, -q.by, q.bz ?? (q.armsFront ? 5.5 : -4.5)];
  const sN = pick(1, nearT), sF = pick(-1, farT);
  const pole = (s, T4, shoulder, hold) => {
    const up = clamp01((T4[1] - shoulder[1] + 2) / 10);
    const base = [-0.55 + up * 1.1, -1 + up * 0.9, s * (0.45 + up * 0.5)];
    if (!hold) return base;
    const u = unit(sub(T4, shoulder));
    let best = base, score = Infinity;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, x = unit(cross(u, [0.3, 1, 0.2])), y = cross(u, x), v = add(mul(x, Math.cos(a)), mul(y, Math.sin(a)));
      const A2 = ik(shoulder, T4, M.upper, M.fore, v), f = unit(sub(A2.end, A2.joint));
      const cost = Math.abs(dot(f, hold)) * 0.7 + (1 - dot(unit(base), v)) * 0.55;
      if (cost < score) {
        score = cost;
        best = v;
      }
    }
    return best;
  };
  const holdN = W7 ? W7.across ? side : axis : null, holdF = two ? W7.across ? side : axis : OW ? [Math.cos(q.sb ?? Math.PI), -Math.sin(q.sb ?? Math.PI), 0] : null;
  const armN = ik(sN, nearT, M.upper, M.fore, pole(1, nearT, sN, holdN)), armF = ik(sF, farT, M.upper, M.fore, pole(-1, farT, sF, holdF));
  const kneePole = (s) => mv(Rp, [1, 0, s * 0.35]);
  const hipN = hipAt(1), hipF = hipAt(-1);
  const legN = ik(hipN, ankleN, M.thigh, M.shin, kneePole(1)), legF = ik(hipF, ankleF, M.thigh, M.shin, kneePole(-1));
  const footDir = (s) => {
    const t = hipTurn * 0.6 + s * 8 * DEG;
    return [Math.cos(t), 0, Math.sin(t)];
  };
  const B3 = {
    pelvis: frame(pelvis, Rp),
    waist: frame(waist, mm(rotZ(-tilt * 0.6), rotY(-(turn + hipTurn) / 2))),
    chest: frame(chest, Rc),
    head: frame(head4, Rh),
    neck: frame(neck, Rh),
    upperN: boneFrame(sN, armN.joint, armN.v),
    foreN: boneFrame(armN.joint, armN.end, armN.v),
    upperF: boneFrame(sF, armF.joint, armF.v),
    foreF: boneFrame(armF.joint, armF.end, armF.v),
    thighN: boneFrame(hipN, legN.joint, legN.v),
    shinN: boneFrame(legN.joint, legN.end, legN.v),
    thighF: boneFrame(hipF, legF.joint, legF.v),
    shinF: boneFrame(legF.joint, legF.end, legF.v)
  };
  B3.footN = frame(legN.end, mm(rotY(-Math.atan2(footDir(1)[2], footDir(1)[0])), rotZ(q.toeF ? -55 * DEG : 0)));
  B3.footF = frame(legF.end, mm(rotY(-Math.atan2(footDir(-1)[2], footDir(-1)[0])), rotZ(q.toeB ? -55 * DEG : 0)));
  return { B: B3, W: W7, OW, q, axis, side, armN, armF, legN, legF, sN, sF, hipN, hipF, turn };
}
var BW = 300;
var BH = 240;
var OX = 150;
var OY = 180;
var Zb = new Float32Array(BW * BH);
var Tone = new Float32Array(BW * BH);
var Part = new Int8Array(BW * BH);
var Mat = new Int8Array(BW * BH);
var Fr = new Int8Array(BW * BH);
var LX = new Float32Array(BW * BH);
var LY = new Float32Array(BW * BH);
var Col = new Uint32Array(BW * BH);
var touched = [];
var LIGHT = unit([-0.55, 0.72, 0.5]);
var clipBody = false;
var clipWeapon = false;
var curFrameIndex = 0;
var curDim = 0;
var onlyPart = 0;
var FRAME_IDS = ["pelvis", "waist", "chest", "head", "neck", "upperN", "foreN", "upperF", "foreF", "thighN", "shinN", "thighF", "shinF", "footN", "footF"];
function plot(i, z, tone, part, mat, wx, wy, color) {
  if (onlyPart && part !== onlyPart) return;
  if (Part[i] === 0) touched.push(i);
  else if (z <= Zb[i]) return;
  Zb[i] = z;
  Tone[i] = tone;
  Part[i] = part;
  Mat[i] = mat;
  Fr[i] = curFrameIndex;
  LX[i] = wx;
  LY[i] = wy;
  Col[i] = color;
}
function sphere(c, r, part, mat) {
  const x0 = Math.floor(c[0] - r), x1 = Math.ceil(c[0] + r), y0 = Math.floor(c[1] - r), y1 = Math.ceil(c[1] + r);
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      const dx = wx - c[0], dy = wy - c[1], d2 = dx * dx + dy * dy;
      if (d2 > r * r || clipBody && wy < 1.5) continue;
      const dz = Math.sqrt(r * r - d2), n = [dx / r, dy / r, dz / r], i = (OY - wy) * BW + (OX + wx);
      plot(i, c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, 0);
    }
}
function sweep(a, b, ra, rb, part, mat, bulge = 0) {
  const n = Math.max(2, Math.ceil(len(sub(b, a)) / 0.4));
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    sphere(add(a, mul(sub(b, a), u)), ra + (rb - ra) * u + bulge * Math.sin(u * Math.PI), part, mat);
  }
}
function ellipsoid(c, R4, r, part, mat) {
  const big = Math.max(r[0], r[1], r[2]), x0 = Math.floor(c[0] - big), x1 = Math.ceil(c[0] + big), y0 = Math.floor(c[1] - big), y1 = Math.ceil(c[1] + big);
  const Rt = [R4[0], R4[3], R4[6], R4[1], R4[4], R4[7], R4[2], R4[5], R4[8]], D17 = [1 / (r[0] * r[0]), 1 / (r[1] * r[1]), 1 / (r[2] * r[2])];
  const A2 = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A2[i * 3 + j] = R4[i * 3] * D17[0] * R4[j * 3] + R4[i * 3 + 1] * D17[1] * R4[j * 3 + 1] + R4[i * 3 + 2] * D17[2] * R4[j * 3 + 2];
  void Rt;
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      if (clipBody && wy < 1.5) continue;
      const dx = wx - c[0], dy = wy - c[1];
      const qa = A2[8], qb = 2 * (A2[2] * dx + A2[5] * dy), qc = A2[0] * dx * dx + 2 * A2[1] * dx * dy + A2[4] * dy * dy - 1, disc = qb * qb - 4 * qa * qc;
      if (disc < 0) continue;
      const dz = (-qb + Math.sqrt(disc)) / (2 * qa);
      const n = unit([A2[0] * dx + A2[1] * dy + A2[2] * dz, A2[3] * dx + A2[4] * dy + A2[5] * dz, A2[6] * dx + A2[7] * dy + A2[8] * dz]);
      plot((OY - wy) * BW + (OX + wx), c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, 0);
    }
}
var PART = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22, weapon: 23, offWeapon: 24 };
var useFrame = (name) => {
  curFrameIndex = FRAME_IDS.indexOf(name);
};
function drawBody(S) {
  const { B: B3, armN, armF, legN, legF, sN, sF, hipN, hipF, turn } = S, F_ = (name) => B3[name];
  useFrame("pelvis");
  ellipsoid(add(F_("pelvis").t, mv(F_("pelvis").R, [0, -0.2, 0])), F_("pelvis").R, [2.9, 2.6, 4.2], PART.pelvis, 0);
  useFrame("waist");
  sweep(F_("pelvis").t, F_("chest").t, 3, 3.3, PART.waist, 1);
  useFrame("chest");
  ellipsoid(add(F_("chest").t, mv(F_("chest").R, [0.2, 0.9, 0])), F_("chest").R, [3.4, 4.2, 5.5], PART.chest, 0);
  useFrame("neck");
  sweep(F_("neck").t, add(F_("neck").t, mv(F_("head").R, [0, 1.6, 0])), 1.25, 1.15, PART.neck, 1);
  useFrame("head");
  ellipsoid(F_("head").t, F_("head").R, [3, 3.3, 2.8], PART.head, 0);
  ellipsoid(add(F_("head").t, mv(F_("head").R, [0.85, -0.45, 0])), F_("head").R, [2.4, 2.7, 2.35], PART.face, 0);
  const arm = (far, A2, sh, up, el, fo, ha, nameU, nameF) => {
    curDim = far ? 1 : 0;
    useFrame(nameU);
    sphere(sh, 2.5, up, 0);
    sweep(sh, A2.joint, 2.1, 1.6, up, 0);
    sphere(A2.joint, 1.45, el, 1);
    useFrame(nameF);
    sweep(A2.joint, A2.end, 1.6, 1.2, fo, 0, 0.15);
    sphere(A2.end, 1.9, ha, 0);
    curDim = 0;
  };
  arm(false, armN, sN, PART.upperN, PART.elbowN, PART.foreN, PART.handN, "upperN", "foreN");
  arm(true, armF, sF, PART.upperF, PART.elbowF, PART.foreF, PART.handF, "upperF", "foreF");
  const leg = (far, L4, hip, th, kn, sh, fo, nameT, nameS, nameFt) => {
    useFrame(nameT);
    sweep(hip, L4.joint, 3.2, 2.2, th, 0);
    sphere(L4.joint, 1.9, kn, 1);
    useFrame(nameS);
    sweep(L4.joint, L4.end, 2.15, 1.4, sh, 0, 0.4);
    useFrame(nameFt);
    const R4 = F_(nameFt).R, a = F_(nameFt).t;
    sweep(add(a, mv(R4, [-1.5, -0.6, 0])), add(a, mv(R4, [4.6, -1.1, 0])), 1.7, 1.25, fo, 0);
  };
  leg(false, legN, hipN, PART.thighN, PART.kneeN, PART.shinN, PART.footN, "thighN", "shinN", "footN");
  leg(true, legF, hipF, PART.thighF, PART.kneeF, PART.shinF, PART.footF, "thighF", "shinF", "footF");
  void turn;
}
function mesh(F, points, part, mat) {
  const pts = points.map((v) => add(F.t, mv(F.R, v)));
  for (let k = 1; k < pts.length - 1; k++) {
    const [a, b, c] = [pts[0], pts[k], pts[k + 1]];
    const area = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(area) < 0.01) continue;
    let normal = unit(cross(sub(b, a), sub(c, a)));
    if (normal[2] < 0) normal = mul(normal, -1);
    const tone = dot(normal, LIGHT);
    for (let y = Math.ceil(Math.min(a[1], b[1], c[1])); y <= Math.max(a[1], b[1], c[1]); y++)
      for (let x = Math.ceil(Math.min(a[0], b[0], c[0])); x <= Math.max(a[0], b[0], c[0]); x++) {
        if (clipBody && y < 1.5) continue;
        const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / area;
        const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / area;
        if (u < -1e-3 || v < -1e-3 || u + v > 1.001) continue;
        const sx = OX + x, sy = OY - y;
        if (sx < 0 || sy < 0 || sx >= BW || sy >= BH) continue;
        plot(sy * BW + sx, a[2] * u + b[2] * v + c[2] * (1 - u - v), tone, part, mat, x, y, 0);
      }
  }
}
function drawCharacter(S, look2) {
  const { B: B3, armN, armF, legN, legF, sN, sF, hipN, hipF } = S;
  const heavy = look2.style === "warden", robed = look2.style === "oracle";
  const local = (f, v) => add(B3[f].t, mv(B3[f].R, v));
  const ball = (f, v, radii, mat) => {
    useFrame(f);
    ellipsoid(local(f, v), B3[f].R, radii, PART[f] ?? PART.chest, mat);
  };
  const bone2 = (f, a, b, ra, rb, mat) => {
    useFrame(f);
    sweep(local(f, a), local(f, b), ra, rb, PART[f] ?? PART.chest, mat);
  };
  ball("pelvis", [0, -0.2, 0], [2.8, 2.4, 3.8], 4);
  useFrame("waist");
  sweep(B3.pelvis.t, B3.chest.t, 2.6, 2.9, PART.waist, 4);
  ball("chest", [0.2, 0.8, 0], heavy ? [3.8, 4.3, 5.7] : robed ? [2.9, 3.8, 4.7] : [3.1, 3.9, 4.9], 4);
  bone2("neck", [0, 0, 0], [0, 1.6, 0], 1.15, 1.05, 3);
  ball("head", [0, 0, 0], [2.7, 3, 2.6], 3);
  ball("head", [0.65, -0.5, 0], [2.2, 2.4, 2.2], 3);
  const arm = (A2, sh, up, el, fo, ha, U, F) => {
    const cloth = heavy || robed;
    useFrame(U);
    sphere(sh, heavy ? 2.6 : 2, up, cloth ? 4 : 3);
    sweep(sh, A2.joint, heavy ? 2.2 : 1.65, 1.25, up, cloth ? 4 : 3);
    sphere(A2.joint, 1.2, el, cloth ? 4 : 3);
    useFrame(F);
    sweep(A2.joint, A2.end, 1.45, 1.05, fo, heavy ? 4 : 3);
    sphere(A2.end, 1.5, ha, 3);
  };
  arm(armN, sN, PART.upperN, PART.elbowN, PART.foreN, PART.handN, "upperN", "foreN");
  arm(armF, sF, PART.upperF, PART.elbowF, PART.foreF, PART.handF, "upperF", "foreF");
  const leg = (L4, hip, th, kn, sh, ft, T4, F, foot) => {
    useFrame(T4);
    sweep(hip, L4.joint, heavy ? 3 : 2.5, 1.7, th, look2.style === "ranger" ? 3 : 4);
    sphere(L4.joint, 1.5, kn, heavy ? 6 : 3);
    useFrame(F);
    sweep(L4.joint, L4.end, heavy ? 2 : 1.7, 1.15, sh, heavy ? 4 : 7);
    bone2(foot, [-1.2, -0.6, 0], [4, -1.1, 0], 1.4, 1, 7);
  };
  leg(legN, hipN, PART.thighN, PART.kneeN, PART.shinN, PART.footN, "thighN", "shinN", "footN");
  leg(legF, hipF, PART.thighF, PART.kneeF, PART.shinF, PART.footF, "thighF", "shinF", "footF");
  costume(S, look2, { ball, bone: bone2, panel(f, points, mat) {
    useFrame(f);
    mesh(B3[f], points, PART[f] ?? PART.chest, mat);
  } });
}
function along(H4, axis, side, part) {
  const n = cross(axis, side);
  const T4 = (i, k, c, lift2 = 0) => {
    const x = H4[0] + axis[0] * i + side[0] * k + n[0] * lift2, y = H4[1] + axis[1] * i + side[1] * k + n[1] * lift2, z = H4[2] + axis[2] * i + side[2] * k + n[2] * lift2;
    const wx = Math.round(x), wy = Math.round(y);
    if (clipWeapon && wy < 0) return;
    const idx = (OY - wy) * BW + (OX + wx);
    if (idx < 0 || idx >= BW * BH) return;
    curFrameIndex = -1;
    plot(idx, z + 0.05, 2, part, 2, wx, wy, c);
  };
  T4.at = (i, k) => [H4[0] + axis[0] * i + side[0] * k, H4[1] + axis[1] * i + side[1] * k, H4[2] + axis[2] * i + side[2] * k];
  return T4;
}
var STEEL = Object.fromEntries(Object.entries({ hi: "#ffffff", a: "#e8edf6", b: "#a4afc6", d: "#68748f", gold: "#ffd84a", goldD: "#b8862a", grip: "#7a3a2a", gripD: "#4a2018", wood: "#8a5a32", woodD: "#5a3820", dark: "#3a3448", darkD: "#262033", olive: "#58663f", oliveA: "#7d8c58", oliveD: "#3a4529" }).map(([k, v]) => [k, hex(v) >>> 0]));
function blade(T4, from, length, w) {
  for (let i = from; i <= from + length + 0.01; i += 0.4) {
    const r = i - from, wd = r > length - 5 ? Math.max(0, (length - r) / 5 * w) : w;
    for (let k = -wd; k <= wd + 0.01; k += 0.4) T4(i, k, k < -w * 0.4 ? STEEL.hi : k > w * 0.4 ? STEEL.d : STEEL.a);
  }
}
var haft = (T4, from, to, a, d, r = 0.8) => {
  for (let i = from; i <= to; i += 0.4) for (let k = -r; k <= r + 0.01; k += 0.4) T4(i, k, k > 0.1 ? d : a);
};
var WEAPONS = {
  // the fist is at i = 0; `two` is where the other hand goes; `across`: the handle lies across the weapon's length
  sword: { two: -4.4, draw(T4, q) {
    const end = q.two ? -6.5 : -2.6;
    haft(T4, end, 2.2, STEEL.grip, STEEL.gripD);
    for (let k = -1.4; k <= 1.4; k += 0.4) T4(end - 0.4, k, STEEL.gold);
    for (let k = -4.6; k <= 4.6; k += 0.4) T4(2.6, k, Math.abs(k) > 3.8 ? STEEL.goldD : STEEL.gold), T4(3, k, STEEL.goldD);
    blade(T4, 3.2, 25, 2.2);
  } },
  greatsword: { two: -4.8, draw(T4) {
    haft(T4, -7.2, 2.2, STEEL.grip, STEEL.gripD);
    for (let k = -1.8; k <= 1.8; k += 0.4) T4(-7.6, k, STEEL.gold);
    for (let k = -6.6; k <= 6.6; k += 0.4) T4(2.6, k, Math.abs(k) > 5.6 ? STEEL.goldD : STEEL.gold), T4(3, k, STEEL.goldD);
    blade(T4, 3.2, 31, 3);
    for (let i = 4; i <= 28; i += 0.4) T4(i, 0, STEEL.b);
  } },
  spear: { two: -12, draw(T4) {
    haft(T4, -18, 36, STEEL.wood, STEEL.woodD, 0.5);
    blade(T4, 36, 11, 2);
    for (let k = -2.4; k <= 2.4; k += 0.4) T4(36, k, STEEL.goldD);
  } },
  hammer: { two: -7, draw(T4) {
    for (const lift2 of [-0.8, 0, 0.8]) for (let i = -10; i <= 18; i += 0.4) for (let k = -0.8; k <= 0.81; k += 0.4) T4(i, k, k > 0.1 ? STEEL.woodD : STEEL.wood, lift2);
    for (let i = 18; i <= 28; i += 0.4) for (let k = -9; k <= 9; k += 0.4) {
      const face2 = Math.abs(k) > 7.4 ? k < 0 ? STEEL.a : STEEL.d : i < 20 ? STEEL.hi : i > 26.4 ? STEEL.d : Math.abs(k) < 2 ? STEEL.gold : STEEL.b;
      T4(i, k, face2, 4.5);
      T4(i, k, face2, -4.5);
      if (i < 18.4 || i > 27.6 || Math.abs(k) > 8.6) for (let l = -4; l <= 4; l += 0.4) T4(i, k, k < 0 ? STEEL.a : i > 27.6 ? STEEL.d : STEEL.b, l);
    }
  } },
  scythe: { two: -11, draw(T4) {
    haft(T4, -16, 31, STEEL.dark, STEEL.darkD, 0.5);
    for (let j = 0; j <= 28; j += 0.4) {
      const u = j / 28, w = 3.2 * (1 - u) + 0.3, b = 31.5 - u * u * 12;
      for (let k = -w; k <= w; k += 0.4) T4(b + k, j + 0.8, k > w * 0.3 ? STEEL.hi : k < -w * 0.4 ? STEEL.d : STEEL.b);
    }
  } },
  claw: { draw(T4) {
    for (const q0 of [-2.4, 0, 2.4])
      for (let i = 2; i <= 9.5; i += 0.4) {
        const u = (i - 2) / 7.5, k = q0 + u * u * 1.8;
        T4(i, k, u > 0.55 ? STEEL.hi : STEEL.a);
        if (u < 0.6) T4(i, k + 0.8, STEEL.d);
      }
  } },
  bow: { across: true, draw(T4, q, off) {
    for (let u = -1; u <= 1.001; u += 0.025) {
      const k = u * 17, i = 6 * (1 - u * u) - 1;
      T4(i, k, Math.abs(u) > 0.85 ? STEEL.goldD : STEEL.wood);
      T4(i + 0.8, k, STEEL.woodD);
    }
    const tipA = T4.at(-1, -17), tipB = T4.at(-1, 17), mid = q.pull ? off : T4.at(-1, 0);
    const line = (A2, B3, c) => {
      const n = Math.max(2, Math.ceil(len(sub(B3, A2)) / 0.4)), Z = STEEL.a;
      for (let k = 0; k <= n; k++) {
        const P3 = add(A2, mul(sub(B3, A2), k / n)), wx = Math.round(P3[0]), wy = Math.round(P3[1]), idx = (OY - wy) * BW + (OX + wx);
        curFrameIndex = -1;
        plot(idx, P3[2] + 0.05, 2, PART.weapon, 2, wx, wy, c ?? Z);
      }
    };
    line(tipA, mid);
    line(tipB, mid);
    if (q.nocked) {
      const nock = mid, tip = T4.at(13, 0);
      line(nock, tip, STEEL.wood);
      for (let i = 9; i <= 13; i += 0.4) for (let k = -(13 - i) * 0.45; k <= (13 - i) * 0.45; k += 0.4) T4(i, k, STEEL.hi);
    }
  } },
  pistol: { across: true, draw(T4) {
    for (let i = -1; i <= 9.5; i += 0.4) for (let k = -4.2; k <= -2.4; k += 0.4) T4(i, k, k < -3.6 ? STEEL.a : k > -2.9 ? STEEL.d : STEEL.b);
    for (let i = -1.2; i <= 1.2; i += 0.4) for (let k = -2.4; k <= 2.4; k += 0.4) T4(i, k, STEEL.gripD);
    T4(9, -4.6, STEEL.hi);
  } },
  launcher: { two: -9, draw(T4) {
    for (let i = -14; i <= 22; i += 0.4) for (let k = -6; k <= -1; k += 0.4) T4(i, k, k < -4.8 ? STEEL.oliveA : k > -2.2 ? STEEL.oliveD : Math.abs(i - 3) < 1.4 ? STEEL.gold : STEEL.olive);
    for (let k = -6.8; k <= -0.2; k += 0.4) T4(22.4, k, STEEL.b), T4(-14.4, k, STEEL.d);
  } },
  handle: { draw(T4) {
    haft(T4, -2.6, 6, STEEL.grip, STEEL.gripD);
    for (let k = -1.6; k <= 1.6; k += 0.4) T4(-3, k, STEEL.gold), T4(6.4, k, STEEL.gold);
  } },
  ...MELEE_SHAPES,
  ...THROWN_SHAPES
};
function finish(S, restFrames, look2, sourceBox) {
  const dim = (part) => part >= PART.upperF && part <= PART.handF ? 1 : part >= PART.thighF && part <= PART.footF ? 1 : 0;
  const toneOf2 = (v, part) => {
    let t = v > 0.8 ? 0 : v > 0.42 ? 1 : v > 0.08 ? 2 : 3;
    t = Math.min(3, t + dim(part));
    return t;
  };
  const tones = /* @__PURE__ */ new Map();
  for (const i of touched) tones.set(i, toneOf2(Tone[i], Part[i]));
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    const t = tones.get(i), votes = [0, 0, 0, 0];
    let same = false;
    for (const d of [-1, 1, -BW, BW]) {
      const j = i + d;
      if (Part[j] !== Part[i] || !tones.has(j)) continue;
      const u = tones.get(j);
      votes[u]++;
      if (u === t) same = true;
    }
    if (!same && votes.some((v) => v > 0)) tones.set(i, votes.indexOf(Math.max(...votes)));
  }
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    Col[i] = (look2.materials?.[Mat[i]] ?? (Mat[i] === 1 ? CORE : SHELL))[tones.get(i)];
  }
  const marks = /* @__PURE__ */ new Map();
  for (const i of touched) {
    for (const d of [1, BW]) {
      const j = i + d;
      if (Part[j] === 0 || Part[j] === Part[i]) continue;
      const far = Zb[i] < Zb[j] ? i : j, dz = Math.abs(Zb[i] - Zb[j]), steel = Mat[i] === 2 || Mat[j] === 2;
      if (Mat[far] === 2 && dz < 1) continue;
      const ink = steel || dz > 2.2;
      if (ink) marks.set(far, INK2);
      else if (!marks.has(far)) marks.set(far, look2.style ? look2.materials[Mat[far]]?.[3] ?? SEAM : SEAM);
    }
  }
  for (const [i, c] of marks) Col[i] = c;
  const { B: B3 } = S, chestAt = add(B3.chest.t, mv(B3.chest.R, [3, 1.6, -1.8]));
  if (!look2.style && mv(B3.chest.R, [1, 0, 0])[2] > 0.15) {
    const i = (OY - Math.round(chestAt[1])) * BW + (OX + Math.round(chestAt[0]));
    if (Part[i] === PART.chest) Col[i] = MARK;
  }
  const list = touched.slice(), ring4 = /* @__PURE__ */ new Map();
  for (const i of list) for (const d of [-1, 1, -BW, BW]) {
    const j = i + d;
    if (Part[j] === 0 && !ring4.has(j)) ring4.set(j, i);
  }
  const n = list.length + ring4.size, out = { n, xs: new Int16Array(n), ys: new Int16Array(n), color: new Uint32Array(n), src: new Int16Array(n), ink: new Uint8Array(n), x0: 0, y0: 0, x1: 0, y1: 0 };
  const srcFor = (i) => {
    const f = Fr[i];
    if (f < 0 || !restFrames) return -1;
    const name = FRAME_IDS[f], A2 = B3[name], R02 = restFrames[name], wx = i % BW - OX, wy = OY - (i / BW | 0), P3 = [wx, wy, Zb[i]];
    const lp = tv(A2.R, sub(P3, A2.t)), rp = add(R02.t, mv(R02.R, lp));
    const c = Math.round(rp[0]) - sourceBox.x, r = -Math.round(rp[1]) - sourceBox.y;
    return c < 0 || r < 0 || c >= sourceBox.w || r >= sourceBox.h ? -1 : r * sourceBox.w + c;
  };
  let k = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const push = (i, c, s, isInk) => {
    const x = i % BW - OX, y = (i / BW | 0) - OY;
    out.xs[k] = x;
    out.ys[k] = y;
    out.color[k] = c;
    out.src[k] = s;
    out.ink[k] = isInk ? 1 : 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
    k++;
  };
  for (const i of list) push(i, Col[i], srcFor(i), Col[i] === INK2);
  for (const [j, i] of ring4) push(j, INK2, srcFor(i), true);
  let zs = 0;
  for (const i of list) zs += Zb[i];
  Object.assign(out, { x0, y0, x1, y1, z: list.length ? zs / list.length : 0 });
  for (const i of list) Part[i] = 0;
  touched.length = 0;
  return out;
}
var turnAll = (S, a) => {
  const R4 = rotY(-a), P3 = (v) => mv(R4, v);
  for (const f of Object.values(S.B)) {
    f.t = P3(f.t);
    f.R = mm(R4, f.R);
  }
  for (const A2 of [S.armN, S.armF, S.legN, S.legF]) {
    A2.joint = P3(A2.joint);
    A2.end = P3(A2.end);
  }
  S.sN = P3(S.sN);
  S.sF = P3(S.sF);
  S.hipN = P3(S.hipN);
  S.hipF = P3(S.hipF);
  S.axis = P3(S.axis);
  S.side = P3(S.side);
};
var REST_FRAMES = null;
function render(pose4, look2 = characterOf("dummy"), sourceBox = { x: -12, y: -38, w: W0, h: H0 }) {
  const S = solve(pose4), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
  if (whole) turnAll(S, whole);
  const air = (q.y ?? 0) < -0.5;
  clipBody = !air;
  clipWeapon = !air;
  if (look2.style) drawCharacter(S, look2);
  else drawBody(S);
  clipBody = false;
  if (S.W) S.W.draw(along(S.armN.end, S.axis, S.side, PART.weapon), q, S.armF.end);
  if (S.OW) {
    const sb = q.sb ?? Math.PI;
    let ax = [Math.cos(sb), -Math.sin(sb), 0], sd = [-Math.sin(sb), -Math.cos(sb), 0];
    if (whole) {
      const R4 = rotY(-whole);
      ax = mv(R4, ax);
      sd = mv(R4, sd);
    }
    S.OW.draw(along(S.armF.end, ax, sd, PART.offWeapon), q, S.armF.end);
  }
  clipWeapon = false;
  return finish(S, REST_FRAMES, look2, sourceBox);
}
REST_FRAMES = solve({}).B;
var CACHE = /* @__PURE__ */ new Map();
var LOOKS = /* @__PURE__ */ new Map();
var SOURCE_BOXES = /* @__PURE__ */ new Map();
function resolveLook(character) {
  const c = characterOf(character);
  if (!LOOKS.has(c.id)) {
    const names = { 3: "skin", 4: "cloth", 5: "hair", 6: "gold", 7: "leather", 8: "glow", 9: "bone", 10: "lining" };
    LOOKS.set(c.id, { ...c, materials: c.style ? Object.fromEntries(Object.entries(names).map(([m, key]) => [m, c[key].map((v) => hex(v) >>> 0)])) : null });
  }
  return LOOKS.get(c.id);
}
var keyOf = (p) => {
  let s = (p.y ?? 0) < -0.5 ? "air," : "";
  for (const k of Object.keys(p).sort()) {
    const v = p[k];
    if (v === void 0 || k === "x" || k === "y" || k === "ghost") continue;
    s += k + (typeof v === "number" ? k === "sa" || k === "sb" || k === "wl" || k === "yaw" || k === "turn" ? Math.round(v * 20) : Math.round(v) : v) + ",";
  }
  return s;
};
function posed(pose4, character = "dummy") {
  const look2 = resolveLook(character);
  if (look2.style && !SOURCE_BOXES.has(look2.id)) {
    const rest = render({}, look2);
    SOURCE_BOXES.set(look2.id, { x: rest.x0, y: rest.y0, w: rest.x1 - rest.x0 + 1, h: rest.y1 - rest.y0 + 1 });
  }
  const key = look2.id + ":" + keyOf(pose4);
  let r = CACHE.get(key);
  if (!r) {
    if (CACHE.size > 6e3) CACHE.clear();
    CACHE.set(key, r = render(pose4, look2, SOURCE_BOXES.get(look2.id)));
  }
  return r;
}

// ../pixelfx/src/core/actor.js
var HERO = [
  "....kkkkk...",
  "..kkhhhhhk..",
  ".khhhhhhhhk.",
  ".khhhhhhhhhk",
  ".khhssssshhk",
  ".khsessesshk",
  ".khsessesshk",
  "..ksssssssk.",
  "...kkSSSkk..",
  "..kttttttk..",
  ".kttTttTttk.",
  ".ksttTTttsk.",
  ".kstttttttk.",
  "..kbbbbbbk..",
  "..kppkkppk..",
  "..kppk.kppk.",
  "..kppk.kppk.",
  "..koook.kook",
  "..kkkkk.kkkk"
];
var HERO_PAL = {
  k: "#17121f",
  h: "#7a4128",
  s: "#f3c49d",
  S: "#c98b6c",
  e: "#17121f",
  t: "#5f6f94",
  T: "#46536f",
  b: "#8a5a32",
  p: "#38334a",
  o: "#6a4030",
  // the 2x character's extra detail
  H: "#a35d34",
  w: "#ffffff",
  m: "#a3564a",
  g: "#e8c060",
  L: "#7f90b6",
  O: "#8f5a3f",
  P: "#4b4560",
  // the scarf
  c: "#f53cd1",
  C: "#ff8fe6",
  D: "#a31f8a"
};
var HERO2 = [
  "...........kkk..........",
  "..........kAABk.........",
  ".........kAAABJk........",
  ".........kABBJJk........",
  ".........kBBBJCDk.......",
  ".........kBCJDDDk.......",
  ".........kkJJJDk........",
  ".......kkkkABBJCkk......",
  "......kAABCJBCCCkDk.....",
  "......kABBCJCCCmDkDk....",
  "......kBBCDDJCDDDkDk....",
  "......kABCDJDDDDDkk.....",
  ".....kAABDkDDDDJkk......",
  ".....kABCDkDDJJGkk......",
  ".....kABCkJJJGGGkk......",
  "....kJJCDkFFFGGGk.......",
  "....kAJJDkJJJGGGk.......",
  "....kJCJJkABBJGGk.......",
  ".....kJCCkBBCDJJJk......",
  ".....kCCCJBBCDJJDk......",
  ".....kCCCDJCCDkJDDk.....",
  "......kCDDJBCDkDDDk.....",
  ".......kDJJJCDkDDDkk....",
  ".......kJBCJCDkDDDkk....",
  ".......kBDJBCDkCDDkk....",
  "........kJJBCDkCDDk.....",
  "........kBBBCDkCCDDk....",
  "........kBBBCDkCCDDk....",
  ".........kBBCDkJDDDk....",
  "........kBJJJJkCJJJk....",
  "........kBBCCDkCCDDk....",
  "........kBBCDDkCDDk.....",
  "........kBBCDkCCDDk.....",
  "........kBCCDkCCDDk.....",
  "........kBCDDkCDDDk.....",
  ".......kJBCJkkkDJkkkk...",
  ".......kAJJAAAAkCCCCCk..",
  "........kkkkkkkkkkkkk..."
];
function maskOf(rows, k = 1) {
  const h = rows.length * k, w = rows[0].length * k, data = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === ".") return;
    for (let j = 0; j < k * k; j++) data[(y * k + (j / k | 0)) * w + x * k + j % k] = 1;
  }));
  return { w, h, data };
}
var MASKS = { 1: maskOf(HERO, 1), 2: maskOf(HERO2, 1) };
function pixelsOf(rows, pal) {
  const w = rows[0].length, data = new Uint32Array(w * rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => data[y * w + x] = ch === "." ? 0 : hex(pal[ch])));
  return data;
}
var PIXELS = { 1: pixelsOf(HERO, HERO_PAL), 2: pixelsOf(HERO2, DUMMY_PAL) };
var CHARACTER_ACTORS = /* @__PURE__ */ new Map();
function stockActor(k = 1, character = "dummy") {
  k = k === 2 ? 2 : 1;
  const look2 = characterOf(character);
  if (look2.style) {
    const key = look2.id + ":" + k;
    if (!CHARACTER_ACTORS.has(key)) {
      const r = posed({}, look2.id), scale3 = k === 2 ? 1 : 2;
      const x2 = Math.floor(r.x0 / scale3), y2 = Math.floor(r.y0 / scale3);
      const w = Math.floor(r.x1 / scale3) - x2 + 1, h = Math.floor(r.y1 / scale3) - y2 + 1;
      const pixels = new Uint32Array(w * h), data = new Uint8Array(w * h);
      for (let i = 0; i < r.n; i++) {
        const index = (Math.floor(r.ys[i] / scale3) - y2) * w + Math.floor(r.xs[i] / scale3) - x2;
        data[index] = 1;
        pixels[index] = r.color[i];
      }
      CHARACTER_ACTORS.set(key, {
        character: look2.id,
        mask: { w, h, data },
        pixels,
        x: x2,
        y: y2,
        w,
        h,
        k,
        head: [0, y2],
        chest: [0, -26 / scale3],
        custom: true
      });
    }
    return CHARACTER_ACTORS.get(key);
  }
  const m = MASKS[k], x = -Math.floor(m.w / 2), y = -m.h;
  return { mask: m, pixels: PIXELS[k], x, y, w: m.w, h: m.h, k, head: [0, y], chest: [0, k === 2 ? -26 : y + 11], ...k === 2 ? { eyes: [[13, 3], [15, 3]] } : {} };
}

// ../pixelfx/src/core/fx.js
function createFrame(w, h, ox = 0, oy = 0) {
  return { w, h, ox, oy, color: new Uint32Array(w * h), light: new Uint32Array(w * h) };
}
function clearFrame(f) {
  f.color.fill(0);
  f.light.fill(0);
  return f;
}
var painters = /* @__PURE__ */ new WeakMap();
function painterFor(frame3) {
  let p = painters.get(frame3);
  if (!p) painters.set(frame3, p = new Painter(frame3));
  return p.reset();
}
var FADE = 0.3;
var isRamp = (v) => Array.isArray(v) && v.length > 0 && v.every((c) => typeof c === "number" || /^#[0-9a-f]{3,8}$/i.test(c));
function resolveOptions(meta49, o = {}) {
  const opts = { ...meta49.options ?? {}, ...o };
  for (const [k, def] of Object.entries(meta49.options ?? {}))
    if (isRamp(def) && isRamp(o[k]) && o[k].length !== def.length) opts[k] = fit(o[k], def.length).map(toHex);
  if (meta49.actor && !opts.actor) opts.actor = stockActor(meta49.actor === 2 ? 2 : 1, opts.character);
  return opts;
}
function createFx(mod, o = {}) {
  const meta49 = mod.meta ?? {};
  const opts = resolveOptions(meta49, o);
  const impl = mod.create ? mod.create(opts) : mod;
  const D17 = meta49.duration ?? 1;
  let t = 0, stopAt = Infinity;
  return {
    meta: meta49,
    options: opts,
    get t() {
      return t;
    },
    update(dt) {
      t += dt;
      if (!impl.update) return;
      const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
      for (let i = 0; i < n; i++) impl.update(dt / n, opts);
    },
    draw(frame3, layer) {
      const p = painterFor(frame3);
      p.place(opts.x ?? 0, opts.y ?? 0, !!opts.flip, opts.angle ?? 0);
      p.fade = stopAt === Infinity ? 1 : clamp(1 - (t - stopAt) / FADE);
      p.lightK = opts.light ?? 1;
      const tt = meta49.loop ? t % D17 : Math.min(t, D17);
      if (layer !== "front" && impl.drawBack) {
        p.layer = "back";
        impl.drawBack(p, tt, opts);
      }
      if (layer !== "back") {
        p.layer = "front";
        impl.draw(p, tt, opts);
      }
    },
    /** Let it end: loops fade out, one-shots cut short. */
    stop() {
      if (stopAt === Infinity) stopAt = t;
    },
    done() {
      return t - stopAt >= FADE || !meta49.loop && t >= D17;
    }
  };
}
function composite(f, out, bg = null, lightK = 1) {
  const n = f.w * f.h, C5 = f.color, L4 = f.light, flat = typeof bg === "number";
  for (let i = 0; i < n; i++) {
    const c = C5[i], l = L4[i] & 16777215;
    let r, g, b, a;
    const ca = c >>> 24;
    if (ca === 255) {
      r = c & 255;
      g = c >>> 8 & 255;
      b = c >>> 16 & 255;
      a = 255;
    } else if (bg === null) {
      r = c & 255;
      g = c >>> 8 & 255;
      b = c >>> 16 & 255;
      a = ca;
    } else {
      const k = flat ? bg : bg[i], f2 = ca / 255;
      r = (c & 255) * f2 + (k & 255) * (1 - f2);
      g = (c >>> 8 & 255) * f2 + (k >>> 8 & 255) * (1 - f2);
      b = (c >>> 16 & 255) * f2 + (k >>> 16 & 255) * (1 - f2);
      a = 255;
    }
    if (l) {
      const lr = (l & 255) * lightK, lg = (l >>> 8 & 255) * lightK, lb = (l >>> 16 & 255) * lightK;
      if (a < 255) {
        const pa = a / 255, pr = r * pa + lr, pg = g * pa + lg, pb = b * pa + lb;
        const na = Math.min(1, Math.max(pa, Math.max(lr, lg, lb) / 255));
        if (na > 0) {
          r = Math.min(255, pr / na);
          g = Math.min(255, pg / na);
          b = Math.min(255, pb / na);
          a = na * 255;
        }
      } else {
        r = Math.min(255, r + lr);
        g = Math.min(255, g + lg);
        b = Math.min(255, b + lb);
      }
    }
    const j = i * 4;
    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;
    out[j + 3] = a;
  }
  return out;
}

// ../pixelfx/src/core/scene.js
var SKY = hex("#15131d");
var SKY_TOP = hex("#0d0b14");
var SKY_LOW = hex("#221d33");
var FLOOR_EDGE = hex("#4a4263");
var FLOOR = hex("#2b2639");
var FLOOR_DARK = hex("#211d2d");
var MORTAR = hex("#1a1724");

// ../pixelfx/src/core/act.js
var lerp2 = (a, b, u) => a + (b - a) * u;
function lerpPose(a, b, u) {
  const out = { ...STAND, ...a };
  const B3 = { ...STAND, ...b };
  for (const k of Object.keys(B3)) {
    const v = B3[k];
    if (typeof v === "number" && typeof out[k] === "number") out[k] = lerp2(out[k], v, u);
    else if (out[k] === void 0 && typeof v === "number") out[k] = v;
  }
  for (const k of ["hx", "hy", "lean", "crouch"]) if (B3[k] === void 0 && typeof out[k] === "number") out[k] = lerp2(out[k], 0, u);
  if (B3.wl === void 0 && typeof out.wl === "number") out.wl = lerp2(out.wl, 1, u);
  return out;
}
var eases = { out: (u) => 1 - (1 - u) * (1 - u), in: (u) => u * u, line: (u) => u };
function poseAt(track, t) {
  if (t <= track[0][0]) return track[0][1];
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, a] = track[i], [t1, b, how] = track[i + 1];
    if (t >= t1) continue;
    if (how === "snap") return a;
    const e = eases[how] ?? ((u2) => u2 * u2 * (3 - 2 * u2));
    const stepped = t0 + Math.floor((t - t0) * 12 + 1e-6) / 12;
    const out = lerpPose(a, b, e((stepped - t0) / (t1 - t0)));
    const u = e((t - t0) / (t1 - t0));
    out.x = lerp2(a.x ?? 0, b.x ?? 0, u);
    out.y = lerp2(a.y ?? 0, b.y ?? 0, u);
    return out;
  }
  return track[track.length - 1][1];
}
var TW = 38;
var TH = 52;
var TP = Object.fromEntries(Object.entries({ ink: "#0b0a1a", wood: "#724c2e", woodL: "#a0703a", woodD: "#4e331f", straw: "#d2aa55", strawL: "#f0d98a", burlapD: "#86643a", burlap: "#b38b57", burlapL: "#c9a26c", red: "#9a2f3c", redL: "#c4434f", white: "#ffffff" }).map(([k, v]) => [k, hex(v)]));
var DUST = ["#efe7dc", "#c9bfb8", "#8f8693", "#5a5468"].map(hex);
var DUMMY = new Uint32Array(TW * TH);
(function buildDummy() {
  const px = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < TW && y < TH) DUMMY[y * TW + x] = c;
  };
  const R4 = (x, y, w, h, c) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c);
  };
  R4(15, 38, 8, 14, TP.ink);
  R4(16, 34, 6, 18, TP.wood);
  R4(16, 34, 2, 18, TP.woodL);
  R4(20, 34, 2, 18, TP.woodD);
  R4(1, 18, 36, 1, TP.ink);
  R4(1, 23, 36, 1, TP.ink);
  R4(1, 19, 36, 4, TP.wood);
  R4(1, 19, 36, 1, TP.woodL);
  R4(1, 22, 36, 1, TP.woodD);
  for (const [bx, s] of [[0, -1], [33, 1]]) {
    R4(bx, 17, 5, 8, TP.straw);
    for (const [dx, dy, c] of [[2, 16, TP.straw], [3, 15, TP.strawL], [1, 17, TP.strawL], [2, 25, TP.straw], [1, 26, TP.strawL], [3, 25, TP.burlapD], [2, 19, TP.strawL], [3, 21, TP.strawL], [1, 22, TP.burlapD], [2, 23, TP.strawL]]) px(bx + dx, dy, c);
    px(s < 0 ? bx - 1 : bx + 5, 19, TP.straw);
    px(s < 0 ? bx - 1 : bx + 5, 22, TP.strawL);
  }
  const sack = (x, y, w, h) => {
    R4(x + 1, y, w - 2, 1, TP.ink);
    R4(x + 1, y + h - 1, w - 2, 1, TP.ink);
    R4(x, y + 1, 1, h - 2, TP.ink);
    R4(x + w - 1, y + 1, 1, h - 2, TP.ink);
    R4(x + 1, y + 1, w - 2, h - 2, TP.burlap);
    R4(x + w - 4, y + 1, 3, h - 2, TP.burlapD);
    R4(x + 1, y + h - 3, w - 2, 2, TP.burlapD);
    R4(x + 1, y + 1, 1, h - 4, TP.burlapL);
    R4(x + 1, y + 1, w - 6, 1, TP.burlapL);
    for (let j = y + 2; j < y + h - 2; j += 3) for (let i = x + 3 + j % 2; i < x + w - 4; i += 4) px(i, j, TP.burlapD);
  };
  sack(9, 17, 20, 24);
  for (let y = 19; y < 36; y++) for (let x = 11; x < 27; x++) {
    const d = Math.hypot(x - 18.5, y - 27);
    if (d > 4 && d < 5.4 || d < 1.9) px(x, y, x + y < 45 ? TP.redL : TP.red);
  }
  for (let x = 10; x < 28; x++) {
    px(x, 36, x & 1 ? TP.woodL : TP.straw);
    px(x, 37, x & 1 ? TP.woodD : TP.wood);
  }
  for (const [x, y, c] of [[11, 41, TP.straw], [12, 42, TP.strawL], [14, 41, TP.strawL], [15, 42, TP.straw], [23, 41, TP.straw], [24, 42, TP.strawL], [26, 41, TP.straw], [13, 43, TP.straw], [25, 43, TP.straw]]) px(x, y, c);
  sack(10, 1, 18, 16);
  for (const ex of [14, 23]) for (let d = -2; d <= 2; d++) {
    px(ex + d, 7 + d, TP.ink);
    px(ex - d, 7 + d, TP.ink);
  }
  for (let x = 14; x < 24; x++) px(x, 12, x & 1 ? TP.ink : TP.burlapD);
  for (const x of [15, 18, 21]) {
    px(x, 11, TP.ink);
    px(x, 13, TP.ink);
  }
  for (let x = 12; x < 26; x++) {
    px(x, 16, x & 1 ? TP.woodL : TP.straw);
    px(x, 17, x & 1 ? TP.wood : TP.woodD);
  }
  for (const [x, y, c] of [[13, 0, TP.straw], [15, 0, TP.strawL], [18, 0, TP.straw], [21, 0, TP.strawL], [24, 0, TP.straw], [9, 4, TP.straw], [28, 6, TP.straw], [8, 7, TP.strawL], [29, 3, TP.strawL]]) px(x, y, c);
})();
var SKINS = { flash: [TP.white, 1], char: [hex("#1a0c0e"), 0.72], ice: [hex("#a8e8ff"), 0.72], shadow: [hex("#3a1a70"), 0.5], holy: [hex("#fff4c0"), 0.5], red: [hex("#ff2040"), 0.45], shock: [hex("#8fd6ff"), 0.6], poison: [hex("#58c43a"), 0.5] };
var STRAW = [TP.strawL, TP.straw, TP.straw, TP.burlapD, TP.burlapD];

// ../pixelfx/src/core/poses.js
var READY = { crouch: 3, fx: 11, fy: -21, bx: 9, by: -21, ffx: 7, fbx: -7 };

// ../pixelfx/src/core/encounter.js
var UI = {
  ink: hex("#090711"),
  panel: hex("#171120"),
  edge: hex("#4a3a58"),
  gold: hex("#f0c860"),
  lit: hex("#fff2b8"),
  white: hex("#ffffff"),
  bar: hex("#d4472f"),
  barLit: hex("#ff8a5a"),
  barDark: hex("#731d28"),
  barBg: hex("#2a1520"),
  phase: hex("#9adf7a")
};

// ../pixelfx/src/fx/world/mossy-ruins.js
var mossy_ruins_exports = {};
__export(mossy_ruins_exports, {
  create: () => create,
  map: () => map,
  meta: () => meta
});

// ../pixelfx/src/fx/world/_lib.js
var BAYER2 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
var dither = (x, y) => BAYER2[(y & 3) << 2 | x & 3];
function bake(w, h, fn) {
  const f = createFrame(w, h);
  const p = painterFor(clearFrame(f));
  p.place(0, 0);
  fn(p, f);
  return { w, h, color: f.color, light: f.light };
}
function blit(p, layer) {
  p.image(layer.color, layer.w, layer.h, 0, 0);
  p.lightImage(layer.light, layer.w, layer.h, 0, 0);
}
function sky(p, w, h, top, low, { horizon = h, steps = 6, seed = 0 } = {}) {
  const rows = Math.max(1, horizon);
  for (let y = 0; y < h; y++) {
    const u = clamp(y / rows), q = clamp(u * steps + dither(0, y) / steps - 0.08), c = mix(top, low, clamp(q / steps));
    for (let x = 0; x < w; x++) p.px(x, y, c);
  }
}
function stars(p, w, h, seed = 0, count = 90, maxY = h * 0.55, color = "#d8d4ff") {
  const c = hex(color);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand(seed, i, 1) * w), y = Math.floor(rand(seed, i, 2) * maxY), r = rand(seed, i, 3);
    p.px(x, y, r > 0.94 ? hex("#ffffff") : c);
    if (r > 0.985) {
      p.dot(x - 1, y, c, 0.55);
      p.dot(x + 1, y, c, 0.55);
      p.dot(x, y - 1, c, 0.55);
      p.dot(x, y + 1, c, 0.55);
      p.glow(x, y, 5, c, 0.35);
    }
  }
}
function moon(p, x, y, r, core, halo, seed = 0) {
  for (let yy = -r - 1; yy <= r + 1; yy++)
    for (let xx = -r - 1; xx <= r + 1; xx++) {
      const d = Math.hypot(xx, yy) / r;
      if (d > 1) continue;
      let c = core;
      if (d > 0.86) c = mix(core, halo, 0.5);
      const n = rand(Math.floor(xx + x), Math.floor(yy + y), seed);
      if (n > 0.86) c = mix(c, halo, 0.25);
      p.px(x + xx, y + yy, c);
    }
  p.glow(x, y, r * 3.2, halo, 0.3);
  p.glow(x, y, r * 1.15, core, 0.14);
}
function foliage(p, x, y, rx, ry, C5, seed = 0, n = 7) {
  p.ellipse(x, y, rx, ry, C5[1]);
  for (let i = 0; i < n; i++) {
    const a = rand(seed, i, 1) * TAU, d = rand(seed, i, 2), r = 2 + rand(seed, i, 3) * rx * 0.42;
    const px = x + Math.cos(a) * rx * 0.62 * d, py = y + Math.sin(a) * ry * 0.62 * d;
    p.disc(px, py, r, C5[2], 0.9);
    if (rand(seed, i, 4) > 0.45) p.disc(px - r * 0.25, py - r * 0.35, r * 0.55, C5[3], 0.85);
  }
  for (let i = 0; i < n; i++) {
    const a = Math.PI + i / n * Math.PI, px = x + Math.cos(a) * rx * 0.85, py = y + Math.sin(a) * ry * 0.8;
    p.dot(px, py, C5[3], 0.9);
  }
}
function arch(p, x, baseY, w, h, C5, { broken = true, seed = 0 } = {}) {
  const top = baseY - h, pw = Math.max(5, Math.round(w * 0.15));
  const ix0 = x + pw + Math.round(w * 0.12), ix1 = x + w - pw - Math.round(w * 0.12), iw = Math.max(1, ix1 - ix0);
  const springY = top + Math.round(h * 0.52), apexY = top + Math.round(h * 0.2), ring4 = Math.max(4, Math.round(w * 0.075));
  const openingTop = (px) => {
    const u = clamp((px - ix0) / (iw - 1), 0, 1);
    return Math.round(apexY + Math.pow(Math.abs(u - 0.5) * 2, 1.8) * (springY - apexY));
  };
  const wallTop = (px) => {
    if (!broken) return top;
    const n = Math.sin(px * 0.19 + seed * 1.7) * 4 + Math.sin(px * 0.07 + seed) * 6 + rand(seed, px, 3) * 8;
    return Math.round(top - 4 + n);
  };
  for (let px = x; px < x + w; px++) {
    const wt = wallTop(px);
    for (let py = wt; py < baseY; py++) {
      const row = Math.floor((py - top) / 7), off = row % 2 ? 4 : 0;
      let c = C5[2];
      if ((px + off) % 12 === 0 || (py - top) % 7 === 6) c = C5[1];
      else if ((px * 5 + py * 3 + seed) % 29 === 0) c = C5[3];
      else if (py < wt + 2) c = C5[3];
      p.px(px, py, c);
    }
  }
  for (let px = ix0; px < ix1; px++) {
    const ot = openingTop(px);
    for (let py = ot; py < baseY; py++) p.px(px, py, C5[0]);
    for (let k = 1; k <= ring4; k++) {
      let c = k === 1 ? C5[5] : k === 2 ? C5[4] : k === ring4 ? C5[1] : C5[2];
      if ((px + k) % 9 === 0) c = C5[1];
      p.px(px, ot - k, c);
    }
  }
  for (const [jx, dir] of [[ix0 - 1, -1], [ix1, 1]]) {
    for (let py = springY - 2; py < baseY; py++) {
      p.px(jx, py, C5[4]);
      p.px(jx + dir, py, C5[1]);
      if (py % 7 === 0) p.px(jx, py, C5[2]);
    }
  }
  let cx = x + Math.round(w * (broken ? 0.8 : 0.24)), cy = wallTop(cx) + 2;
  while (cy < baseY - 2) {
    p.px(cx, cy, C5[0]);
    p.px(cx + 1, cy, C5[1]);
    cy += 1;
    cx += Math.sin(cy * 0.7 + seed) > 0.3 ? 1 : rand(seed, cy, 9) > 0.6 ? -1 : 0;
  }
  if (!broken) for (let px = x; px < x + w; px += 7) p.rect(px, wallTop(px) - 1, 6, 1, C5[4]);
  if (broken) {
    for (let i = 0; i < 7; i++) {
      const bx = x + w * 0.4 + rand(seed, i, 1) * w * 0.55, by = baseY - 1 - rand(seed, i, 2) * 10;
      p.rect(bx, by, 2 + Math.floor(rand(seed, i, 3) * 4), 1 + Math.floor(rand(seed, i, 4) * 2), i % 3 ? C5[2] : C5[3]);
    }
  }
  for (let i = 0; i < 22; i++) {
    const mx = x + 2 + rand(seed, i, 5) * (w - 4), my = baseY - 2 - rand(seed, i, 6) * Math.min(26, h * 0.6);
    p.dot(mx, my, i % 3 ? C5[3] : C5[4], 0.7);
  }
  for (let i = 0; i < 5; i++) fernlike(p, x + 4 + rand(seed, i, 7) * (w - 8), baseY - 1, 2, C5, seed + i);
}
function fernlike(p, x, y, s, C5, seed = 0) {
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.32, L4 = s * (2 + rand(seed, i, 1));
    for (let k = 1; k <= L4; k++) p.px(x + Math.cos(a) * k, y + Math.sin(a) * k + k * k * 0.06, k > L4 * 0.7 ? C5[4] : C5[3]);
  }
}
function pillar(p, x, baseY, w, h, C5, { broken = false } = {}) {
  const top = baseY - h;
  p.rect(x, top, w, h, C5[2]);
  p.rect(x, top, 1, h, C5[4]);
  p.rect(x + w - 2, top, 2, h, C5[1]);
  for (let y = top + 4; y < baseY; y += 8) p.rect(x, y, w, 1, C5[1]);
  for (let y = top + 2; y < baseY; y += 8) p.rect(x + 2, y, w - 4, 1, C5[3]);
  p.rect(x - 2, baseY - 4, w + 4, 4, C5[2]);
  p.rect(x - 2, baseY - 4, w + 4, 1, C5[4]);
  if (broken) {
    for (let i = 0; i < 4; i++) p.dot(x + rand(3, i, 1) * w, top - 1, C5[3], 0.7);
  } else {
    p.rect(x - 3, top - 4, w + 6, 4, C5[2]);
    p.rect(x - 3, top - 4, w + 6, 1, C5[4]);
    p.rect(x - 1, top, w + 2, 2, C5[1]);
  }
}
function ground(p, w, y, h, C5, { grass = true, seed = 0, stone: stone4 = false, lava = false } = {}) {
  const floor = hex(C5[0]), dark = hex(C5[1]), lit = hex(C5[4]), rim = hex(C5[5]);
  for (let yy = y; yy < h; yy++) {
    const d = yy - y;
    let c = d < 2 ? mix(floor, dark, 0.35) : d < 6 ? floor : mix(floor, dark, clamp((d - 5) / 18) * 0.75);
    for (let x = 0; x < w; x++) {
      const n = tileNoise(x / 4.5, d / 4.5, 0, 0, seed);
      if (n > 0.35 && d > 2) c = mix(c, lit, 0.18);
      if (n < -0.4 && d > 3) c = mix(c, dark, 0.4);
      p.px(x, yy, c);
    }
  }
  for (let x = 0; x < w; x++) p.px(x, y, rim);
  for (let x = 0; x < w; x++) if ((x + seed) % 3 === 0) p.px(x, y + 1, mix(rim, lit, 0.35));
  if (grass) {
    for (let x = 0; x < w; x++) {
      const hgt = rand(seed, x, 7);
      if (hgt > 0.62) p.px(x, y - 1, hgt > 0.86 ? rim : lit);
      if (hgt > 0.9) p.px(x, y - 2, lit);
    }
    for (let i = 0; i < 35; i++) {
      const x = Math.floor(rand(seed, i, 11) * w), hh = 1 + Math.floor(rand(seed, i, 12) * 4);
      for (let k = 1; k <= hh; k++) p.px(x + (k > 2 ? 1 : 0), y - k, k === hh ? rim : lit);
    }
  }
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(rand(seed, i, 21) * w), yy = y + 3 + Math.floor(rand(seed, i, 22) * Math.max(1, Math.min(22, h - y - 5)));
    const ww = 1 + Math.floor(rand(seed, i, 23) * 4);
    p.rect(x, yy, ww, 1, mix(floor, lit, 0.32));
    p.dot(x, yy + 1, dark, 0.8);
  }
  if (stone4) {
    for (let x = 0; x < w; x += 16) {
      p.rect(x, y + 6, 1, h - y - 6, dark);
      p.rect(x + 1, y + 6, 15, 1, mix(floor, lit, 0.2));
    }
    for (let x = 8; x < w; x += 16) p.rect(x, y + 15, 1, h - y - 15, dark);
  }
  if (lava) {
    for (let i = 0; i < 10; i++) {
      let x = Math.floor(rand(seed, i, 31) * w), yy = y + 4 + Math.floor(rand(seed, i, 32) * 20);
      for (let k = 0; k < 6; k++) {
        p.px(x, yy, C5[5]);
        p.px(x + 1, yy, C5[4]);
        p.glow(x, yy, 4, C5[4], 0.35);
        x += rand(seed, i, 40 + k) > 0.5 ? 1 : -1;
        yy += rand(seed, i, 50 + k) > 0.5 ? 1 : 0;
      }
    }
  }
}
function tufts(p, w, y, C5, seed = 0, count = 26) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand(seed, i, 1) * w), hh = 2 + Math.floor(rand(seed, i, 2) * 5);
    for (let k = 1; k <= hh; k++) p.px(x + Math.round(k * 0.35), y - k, k === hh ? C5[5] : C5[4]);
    if (rand(seed, i, 3) > 0.72) p.px(x + 1, y - hh - 1, C5[6] ?? C5[5]);
  }
}
function mushroom(p, x, y, s, C5) {
  p.rect(x, y - s * 1.6, Math.max(1, Math.round(s * 0.5)), Math.round(s * 1.6), C5[5]);
  p.rect(x, y - Math.round(s * 1.6), Math.max(1, Math.round(s * 0.5)), 1, C5[6]);
  p.ellipse(x + s * 0.25, y - s * 1.9, s * 1.1, s * 0.62, C5[6]);
  p.ellipse(x + s * 0.25, y - s * 1.75, s * 0.85, s * 0.35, C5[7]);
  p.dot(x + s * 0.6, y - s * 2.05, C5[6], 0.9);
  p.glow(x + s * 0.25, y - s * 2, s * 2.4, C5[5], 0.1);
}
function fern(p, x, y, s, C5, seed = 0) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.42 + (rand(seed, i, 1) - 0.5) * 0.1, L4 = s * (2.2 + rand(seed, i, 2) * 1.4);
    for (let k = 1; k <= L4; k++) {
      const u = k / L4, px = x + Math.cos(a) * k * (1 - u * 0.35), py = y + Math.sin(a) * k + u * u * L4 * 0.4;
      p.px(px, py, k > L4 * 0.7 ? C5[5] : C5[4]);
      if (k > 2 && k % 2 === 0) {
        p.px(px - 1, py, C5[3]);
        if (k < L4 * 0.7) p.px(px + 1, py - 1, C5[4]);
      }
    }
  }
}
function pool(p, x, y, rx, C5, k = 0.3) {
  p.glow(x, y - 1, rx * 1.6, C5[3], k * 0.55);
  p.glow(x, y - 1, rx * 0.7, C5[4], k * 0.7);
  p.glow(x, y - 1, rx * 0.3, C5[5], k * 0.45);
}
function mist(p, t, D17, { y0 = 60, y1 = 140, color = "#8fa8b8", seed = 0, bands = 3, alpha = 0.08 } = {}) {
  const c = hex(color), ph = t / D17 * 8;
  for (let b = 0; b < bands; b++) {
    const yy = Math.round(lerp(y0, y1, (b + 0.5) / bands));
    for (let y = yy - 6; y <= yy + 6; y++) {
      for (let x = 0; x < 320; x++) {
        const n = tileNoise(x / 38 + ph + b * 3.1, y / 7, 8, 0, seed + b * 11);
        const a = clamp((n - 0.05) * alpha * 1.8, 0, alpha);
        if (a > 8e-3) p.blend(x, y, c, a);
      }
    }
  }
}
function fireflies(p, t, D17, { count = 14, x0 = 8, x1 = 312, y0 = 48, y1 = 146, color = "#d8ff8a", seed = 0 } = {}) {
  const c = hex(color), hot = mix(c, hex("#ffffff"), 0.55), ph = t / D17 * TAU;
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 4), bx = lerp(x0, x1, g.next()), by = lerp(y0, y1, g.next());
    const x = bx + Math.sin(ph * (1 + i % 3) + i * 2.1) * (9 + g.next() * 9);
    const y = by + Math.cos(ph * (1 + (i + 1) % 3) + i * 1.7) * (4 + g.next() * 6);
    const tw = 0.5 + 0.5 * Math.sin(t * (2.2 + i % 4 * 0.6) + i * 1.3);
    const a = 0.35 + tw * 0.65;
    if (x < 0 || y < 0 || x >= 320 || y >= 180) continue;
    p.dot(x, y, tw > 0.55 ? hot : c, a);
    if (tw > 0.75) p.dot(x - 1, y, c, 0.5), p.dot(x, y - 1, c, 0.5);
    p.glow(x, y, 4 + tw * 2, c, 0.14 * a);
  }
}
function leaves(p, t, D17, { count = 10, color = "#b8d98a", back, seed = 0, x0 = -10, x1 = 330, y0 = 12, y1 = 120 } = {}) {
  const c = hex(color), b = hex(back ?? "#e4ffb0"), ph = t / D17 * TAU;
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 5), sx = lerp(x0, x1, g.next()), sy = lerp(y0, y1, g.next()), k = 0.6 + g.next() * 0.8;
    const x = sx + Math.sin(ph * 2 + i * 1.8) * (8 + g.next() * 10), y = sy + (t / D17 * 240 + i * 7) % 120;
    const flip = Math.sin(t / D17 * TAU * 3 + i * 1.7);
    if (x < 0 || y < 0 || x + 1 >= 320 || y + 1 >= 180) continue;
    p.px(x, y, flip > 0 ? b : c);
    p.px(x + 1, y, c);
    if (Math.abs(flip) < 0.4) p.px(x, y + 1, c);
    if (Math.abs(flip) > 0.8) p.px(x + 1, y - 1, b);
  }
}
function embers(p, t, D17, { count = 18, color = "#ffb050", seed = 0, x0 = 0, x1 = 320, y0 = 148, y1 = 60 } = {}) {
  const c = hex(color);
  cycle(t, D17, count, seed, (g) => 2.5 + g.next() * 4, (age, L4, g, i) => {
    const k = age / L4, bx = lerp(x0, x1, g.next()), x = bx + Math.sin(age * 2.3 + i) * 6 * k;
    const y = lerp(y0, y1, k) - k * k * 16;
    const a = Math.min(1, k * 8) * Math.min(1, (1 - k) * 3);
    const hot = k < 0.25 ? mix(c, hex("#fff6c4"), 0.65) : k < 0.65 ? c : mix(c, hex("#a8301a"), 0.5);
    if (x < 0 || y < 0 || x >= 320 || y >= 180) return;
    p.dot(x, y, hot, a);
    const x2 = x + Math.sin(age * 9 + i) * 1.4;
    if (k < 0.5 && x2 >= 0 && x2 < 320) p.dot(x2, y + 2, mix(c, hex("#701a14"), 0.4), a * 0.7);
    p.glow(x, y, 5 + (1 - k) * 4, hot, 0.25 * a);
  });
}
function motes(p, t, D17, { count = 24, color = "#e8e0c8", seed = 0, x0 = 0, x1 = 320, y0 = 20, y1 = 150 } = {}) {
  const c = hex(color);
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 6), bx = lerp(x0, x1, g.next()), by = lerp(y0, y1, g.next());
    const x = bx + Math.sin(t / D17 * TAU * (1 + i % 3) + i) * 5, y = by - (t / D17 * 68 + i * 13) % 34 + 17;
    const a = 0.16 + 0.18 * Math.sin(t / D17 * TAU * 2 + i * 1.9);
    if (x < 0 || y < 0 || x >= 320 || y >= 180) continue;
    p.dot(x, y, c, a);
  }
}

// ../pixelfx/src/fx/world/mossy-ruins.js
var meta = {
  name: "Mossy Ruins",
  desc: "A moonlit clearing inside broken elven ruins: mist drifts over a cracked flagstone floor, fireflies wander the arch and leaves fall through the cold light.",
  tags: ["map", "forest", "ruins", "fantasy", "arena", "night", "loop"],
  kind: "map",
  size: [320, 180],
  origin: [0, 0],
  duration: 10,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#05080d", "#08140f", "#0e2218", "#173522", "#26502c", "#3f7238", "#6aa04c", "#a8d97a"],
    seed: 1
  }
};
var map = {
  groundY: 150,
  bounds: [8, 312],
  walk: [[8, 312]],
  platforms: [],
  spawns: { hero: [54, 150], mobs: [[152, 150], [198, 150]], boss: [262, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 }
};
var W = 320;
var H = 180;
var D = meta.duration;
var SKY_TOP2 = hex("#05040c");
var SKY_LOW2 = hex("#132134");
var STONE = ["#090a10", "#12161f", "#1c2430", "#29343e", "#3b4a50", "#56656a", "#7e8d88", "#b8c4b2"].map(hex);
var WATER = ["#071018", "#0d2230", "#143a44", "#1f5860", "#3a8a8a", "#79c4b8"].map(hex);
function farTrees(p, baseY, seed, color) {
  const c = hex(color);
  for (let i = 0; i < 40; i++) {
    const x = Math.round(rand(seed, i, 1) * W), h = 8 + rand(seed, i, 2) * 22, w = 3 + rand(seed, i, 3) * 7;
    p.rect(x, baseY - h, 1, h, c);
    for (let k = 0; k < 3; k++) {
      const yy = baseY - h * (0.35 + k * 0.25), ww = w * (1 - k * 0.22);
      p.tri(x - ww, yy, x + ww, yy, x, yy - ww * 0.9, c);
    }
  }
}
function vine(p, x, y, len2, C5, seed = 0) {
  let px = x;
  for (let i = 0; i < len2; i++) {
    px = x + Math.sin(i * 0.35 + seed) * 2.2;
    p.px(px, y + i, i % 4 === 0 ? C5[5] : C5[3]);
    p.px(px - 1, y + i, C5[2]);
    if (i % 5 === 2) p.px(px + 1, y + i, C5[5]);
  }
  for (let i = 0; i < 4; i++) foliage(p, x + Math.sin(i * 2.1 + seed) * 3, y + len2 * (0.3 + i * 0.18), 2.2, 1.6, C5, seed + i, 3);
}
function bigTree(p, x, baseY, h, C5) {
  const bark = ["#09080d", "#171410", "#292117", "#3d3020", "#5a4428"].map(hex);
  const top = baseY - h;
  for (let y = top; y < baseY; y++) {
    const u = (y - top) / h, hw = 1.8 + Math.pow(u, 1.3) * 7.5;
    for (let xx = Math.round(x - hw); xx <= Math.round(x + hw); xx++) {
      let c = bark[2];
      if (xx < x - hw * 0.42) c = bark[3];
      if (xx > x + hw * 0.5) c = bark[1];
      if ((xx + y) % 7 === 0) c = bark[1];
      p.px(xx, y, c);
    }
    if (u > 0.55) p.px(x - hw * 0.7, y, bark[4]);
  }
  for (let i = 0; i < 7; i++) {
    const dir = i % 2 ? 1 : -1, len2 = 5 + i % 3 * 3;
    for (let k = 1; k <= len2; k++) p.px(x + dir * k, baseY - 1 - Math.pow(k / len2, 1.4) * 3, k > len2 - 3 ? bark[2] : bark[1]);
  }
  for (const [bx, by, tx, ty, w] of [[x, top + h * 0.16, x - 22, top - 4, 3], [x + 1, top + h * 0.1, x + 20, top - 8, 3], [x - 1, top + h * 0.24, x - 8, top - 22, 2]]) {
    for (let k = 0; k <= 1; k += 0.012) {
      const px = lerp(bx, tx, k), py = lerp(by, ty, k) + Math.sin(k * Math.PI) * 2;
      const r = lerp(w, 0.7, k);
      for (let xx = Math.round(px - r); xx <= Math.round(px + r); xx++) p.px(xx, Math.round(py), xx < px ? bark[3] : bark[1]);
    }
  }
  foliage(p, x - 25, top + 8, 22, 13, C5, 3, 8);
  foliage(p, x + 21, top + 14, 20, 12, C5, 5, 7);
  foliage(p, x - 4, top + 1, 25, 14, C5, 7, 9);
  for (let i = 0; i < 26; i++) {
    const a = rand(9, i, 1) * TAU, r = 9 + rand(9, i, 2) * 24;
    const px = x + Math.cos(a) * r, py = top + 8 + Math.sin(a) * r * 0.6;
    p.dot(px, py, i % 3 ? C5[4] : C5[5], 0.55);
  }
  for (let i = 0; i < 12; i++) {
    const px = x - 28 + rand(13, i, 1) * 12, py = top + 4 + rand(13, i, 2) * 6;
    p.dot(px, py, C5[5], 0.7);
  }
}
function paving(p, y, C5, seed) {
  for (let row = 0; row < 2; row++) {
    for (let x = 60 + row % 2 * 11; x < 262; x += 24) {
      const yy = y + 3 + row * 5, ww = 12 + Math.floor(rand(seed, row, x) * 9);
      if (rand(seed, row, x + 1) > 0.86) continue;
      const tone = mix(STONE[2], STONE[3], rand(seed, row, x + 2) * 0.6);
      p.rect(x, yy, ww, 2, tone);
      p.rect(x, yy, ww, 1, mix(tone, STONE[5], 0.35));
      p.rect(x, yy + 2, ww, 1, STONE[1]);
      if (rand(seed, row, x + 3) > 0.7) p.px(x + 3, yy + 1, mix(tone, C5[4], 0.6));
    }
  }
}
function dais(p, x, y, C5, seed) {
  p.ellipse(x, y, 58, 8.5, STONE[1]);
  p.ellipse(x, y - 1, 54, 7, STONE[2]);
  p.ellipse(x, y - 2, 47, 5.6, mix(STONE[2], STONE[3], 0.55));
  p.ellipse(x, y - 2, 38, 4.4, STONE[2]);
  for (let a = 0; a < TAU; a += 0.22) {
    const px = x + Math.cos(a) * 50, py = y - 1 + Math.sin(a) * 6;
    p.dot(px, py, a % 0.9 < 0.3 ? C5[4] : STONE[4], 0.55);
  }
  for (let i = 0; i < 18; i++) {
    const a = rand(seed, i, 1) * TAU, r = 12 + rand(seed, i, 2) * 40;
    p.dot(x + Math.cos(a) * r, y - 2 + Math.sin(a) * r * 0.12, STONE[4], 0.5);
  }
  p.ellipse(x, y - 3, 20, 2.4, mix(STONE[1], WATER[3], 0.3));
  for (let i = 0; i < 6; i++) {
    const a = i * 1.1;
    p.dot(x + Math.cos(a) * 14, y - 3 + Math.sin(a) * 1.6, WATER[4], 0.35);
  }
  p.glow(x, y - 3, 26, WATER[4], 0.06);
}
function build2(C5, o) {
  const seed = o.seed ?? 1;
  const base = bake(W, H, (p) => {
    sky(p, W, H, SKY_TOP2, SKY_LOW2, { horizon: 128, steps: 7 });
    stars(p, W, H, seed, 120, 112, "#cfc8ff");
    moon(p, 252, 39, 16, hex("#e8ecd8"), hex("#9db8c0"), seed);
    p.glow(252, 39, 68, hex("#a8c4c8"), 0.07);
    farTrees(p, 128, seed + 31, "#0a1715");
    for (let i = 0; i < 9; i++) {
      const x = rand(seed, i, 41) * W;
      p.glow(x, 122, 26, C5[3], 0.05);
    }
  });
  const mid = bake(W, H, (p) => {
    arch(p, 22, 150, 86, 92, STONE, { broken: true, seed: seed + 2 });
    pillar(p, 286, 150, 13, 58, STONE, { broken: true });
    p.rect(20, 148, 100, 3, STONE[1]);
    bigTree(p, 12, 150, 118, C5);
    bigTree(p, 312, 150, 96, C5);
    p.rect(144, 136, 32, 14, STONE[2]);
    p.rect(144, 136, 32, 1, STONE[4]);
    p.rect(146, 138, 28, 10, STONE[1]);
    p.rect(148, 140, 24, 6, STONE[2]);
    p.rect(150, 142, 20, 3, STONE[1]);
    p.rect(140, 134, 40, 2, STONE[2]);
    p.rect(140, 134, 40, 1, STONE[3]);
    p.rect(156, 130, 8, 4, STONE[1]);
    p.ellipse(160, 130, 5, 1.6, STONE[1]);
    p.dot(160, 129, WATER[4], 0.8);
    p.dot(159, 129, WATER[3], 0.6);
    p.glow(160, 130, 18, WATER[4], 0.14);
    vine(p, 148, 136, 18, C5, 6);
    vine(p, 172, 136, 14, C5, 8);
    vine(p, 38, 0, 42, C5, 1);
    vine(p, 88, 0, 58, C5, 3);
    vine(p, 268, 0, 34, C5, 5);
    vine(p, 300, 0, 52, C5, 7);
    for (let i = 0; i < 18; i++) {
      const x = 26 + rand(seed, i, 61) * 96, yy = 149 - rand(seed, i, 62) * 3;
      p.rect(x, yy, 1 + Math.floor(rand(seed, i, 63) * 4), 1 + Math.floor(rand(seed, i, 64) * 2), STONE[i % 3 ? 2 : 3]);
      if (i % 3 === 0) p.dot(x + 1, yy - 1, C5[3], 0.7);
    }
    for (let i = 0; i < 8; i++) {
      const x = 272 + rand(seed, i, 65) * 30, yy = 149 - rand(seed, i, 66) * 2;
      p.rect(x, yy, 2, 1, STONE[3]);
    }
    for (let i = 0; i < 30; i++) {
      const x = rand(seed, i, 71) * W, yy = 98 + rand(seed, i, 72) * 50;
      if (x > 20 && x < 116) p.dot(x, yy, C5[3], 0.6);
      if (x > 276) p.dot(x, yy, C5[3], 0.5);
    }
    p.glow(70, 120, 60, C5[4], 0.06);
  });
  const floor = bake(W, H, (p) => {
    ground(p, W, 150, H, ["#141714", "#090c09", "#1b2118", "#262e1d", "#334226", "#4a5c30", "#6d8340"].map(hex), { grass: true, stone: false, seed });
    paving(p, 150, C5, seed + 4);
    dais(p, 160, 157, C5, seed + 5);
    p.ellipse(96, 157, 28, 5.6, WATER[1]);
    p.ellipse(96, 156.5, 24, 4.3, WATER[2]);
    p.ellipse(100, 156, 10, 2.2, WATER[3]);
    for (let x = 70; x < 123; x++) p.px(x, 152 + Math.round(Math.abs(Math.sin(x * 0.3)) * 0.6), WATER[4]);
    for (let i = 0; i < 12; i++) p.dot(84 + rand(seed, i, 81) * 24, 155 + rand(seed, i, 82) * 3, WATER[5], 0.7);
    p.glow(96, 155, 34, WATER[4], 0.14);
    for (const [x, y, len2] of [[18, 150, 42], [24, 151, 28], [300, 151, 22]]) {
      for (let k = 0; k < len2; k++) p.px(x + k, y + Math.round(Math.sin(k * 0.22) * 1.5), k < len2 * 0.5 ? hex("#2c2115") : hex("#3d3020"));
    }
    mushroom(p, 116, 149, 2.2, C5);
    mushroom(p, 122, 150, 1.6, C5);
    fern(p, 34, 150, 3.2, C5, 2);
    fern(p, 280, 150, 3.6, C5, 5);
    fern(p, 64, 150, 2.4, C5, 8);
    tufts(p, W, 150, C5, seed + 11, 38);
    for (let i = 0; i < 18; i++) p.px(108 + rand(seed, i, 91) * 110, 148 + Math.floor(rand(seed, i, 92) * 3), i % 3 ? STONE[2] : C5[3]);
    pool(p, 252, 150, 32, WATER, 0.3);
  });
  const fore = bake(W, H, (p) => {
    for (let x = 0; x < W; x++) {
      const hh = 3 + rand(seed, x, 101) * 9 + Math.sin(x * 0.08) * 2;
      if (rand(seed, x, 102) > 0.42) {
        p.px(x, H - 1, C5[1]);
        for (let k = 1; k < hh; k++) p.px(x + Math.round(k * 0.22), H - 1 - k, k > hh * 0.7 ? C5[2] : C5[1]);
      }
    }
    for (let i = 0; i < 10; i++) {
      const x = rand(seed, i, 111) * W, y = 160 + rand(seed, i, 112) * 10;
      p.rect(x, y, 2, 1, C5[1]);
      p.px(x + 2, y, C5[2]);
    }
  });
  return { base, mid, floor, fore };
}
function create(o) {
  const C5 = fit(o.palette, 8), L4 = build2(C5, o);
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(p) {
      const tt = t % D;
      blit(p, L4.base);
      blit(p, L4.mid);
      mist(p, tt, D, { y0: 96, y1: 142, color: "#a8c8c0", seed: (o.seed ?? 1) + 5, bands: 3, alpha: 0.07 });
      blit(p, L4.floor);
      const ph = tt / D * TAU;
      for (let i = 0; i < 5; i++) {
        const x = 86 + i * 5 + Math.sin(ph * 2 + i) * 2, y = 153 + Math.round(Math.sin(ph * 3 + i * 1.7) * 0.6);
        p.dot(x, y, WATER[5], 0.25 + 0.2 * Math.sin(ph * 2 + i * 1.3));
      }
      fireflies(p, tt, D, { count: 11, x0: 10, x1: 310, y0: 30, y1: 142, color: "#d8ff8a", seed: (o.seed ?? 1) + 3 });
      leaves(p, tt, D, { count: 9, color: "#8fb45a", back: "#cfe49a", seed: (o.seed ?? 1) + 7, y0: 20, y1: 116 });
      motes(p, tt, D, { count: 22, color: "#e8f0d0", seed: (o.seed ?? 1) + 9, y0: 28, y1: 140 });
      p.glow(252, 146, 70, hex("#a8c8c8"), 0.1 + 0.02 * Math.sin(ph));
      p.glow(96, 154, 30, WATER[4], 0.14 + 0.03 * Math.sin(ph * 2));
      blit(p, L4.fore);
    }
  };
}

// ../pixelfx/src/fx/world/wisp-marsh.js
var wisp_marsh_exports = {};
__export(wisp_marsh_exports, {
  create: () => create2,
  map: () => map2,
  meta: () => meta2
});

// ../pixelfx/src/fx/world/_nature.js
function contour(points) {
  if (points.length < 2) return points.map(([x, y]) => [x, y]);
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) * 1.5));
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)));
    }
  }
  out.push([...points.at(-1)]);
  return out;
}
function limb(p, points, width, tip, colors, { seed = 1, bark = true } = {}) {
  const C5 = fit(colors, 5), path = contour(points);
  if (path.length < 2) return;
  const distances = [0];
  for (let i = 1; i < path.length; i++) distances.push(distances.at(-1) + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const length = distances.at(-1) || 1;
  const radius3 = (i) => lerp(width, tip, distances[i] / length) * 0.5;
  const ribbon2 = (scale3, shift2, color) => {
    const left = [], right = [];
    for (let i = 0; i < path.length; i++) {
      const before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
      const dx = after[0] - before[0], dy = after[1] - before[1], n = Math.hypot(dx, dy) || 1;
      const r = Math.max(0.35, radius3(i)), x = path[i][0] + shift2 * r, y = path[i][1];
      left.push([x - dy / n * r * scale3, y + dx / n * r * scale3]);
      right.push([x + dy / n * r * scale3, y - dx / n * r * scale3]);
    }
    p.poly([...left, ...right.reverse()], color);
  };
  ribbon2(1, 0, C5[0]);
  ribbon2(0.83, -0.02, C5[2]);
  ribbon2(0.27, -0.4, C5[3]);
  if (!bark || width < 5) return;
  for (let i = 0; i < Math.floor(width * 0.75); i++) {
    const first = Math.floor(rand(seed, i, 1) * (path.length - 1) * 0.8);
    const last2 = Math.min(path.length - 1, first + 5 + Math.floor(rand(seed, i, 2) * path.length * 0.24));
    const side = (rand(seed, i, 3) - 0.5) * 1.2;
    const groove = path.slice(first, last2 + 1).map(([x, y], j) => [x + side * radius3(first + j), y]);
    p.polyline(groove, i % 4 === 0 ? C5[4] : C5[1]);
  }
}
function rock(p, x, y, rx, ry, colors, { seed = 1, moss = null } = {}) {
  const C5 = fit(colors, 5), radii = Array.from({ length: 13 }, (_, i) => 0.82 + rand(seed, i, 1) * 0.23);
  p.shade(x - rx * 1.1, y - ry * 1.1, x + rx * 1.1, y + ry * 1.1, (px, py) => {
    const nx = (px - x) / rx, ny = (py - y) / ry, angle = (Math.atan2(ny, nx) / TAU + 1) % 1 * radii.length;
    const sector = Math.floor(angle), edge = lerp(radii[sector], radii[(sector + 1) % radii.length], angle - sector);
    const r = Math.hypot(nx, ny);
    if (r > edge) return;
    const grain = noise2(px / 12, py / 9, seed), plane2 = -nx * 0.5 - ny * 0.9 + grain * 0.19;
    let step = plane2 > 0.7 ? 4 : plane2 > 0.28 ? 3 : plane2 > -0.35 ? 2 : 1;
    if (ny > 0.62 || r > edge - 0.06 && ny > 0) step = 0;
    const seam = 0.12 + Math.sin(ny * 5 + seed) * 0.13 + Math.max(0, ny) * 0.4;
    if (ny > -0.55 && ny < 0.55 && Math.abs(nx - seam) < 0.65 / rx) step = Math.max(0, step - 2);
    if (grain > 0.48 && noise2(px / 3, py / 3, seed + 41) > 0.3) step = Math.max(1, step - 1);
    if (moss && ny < -0.35 && grain > 0.08 && plane2 > 0.1) return moss[grain > 0.4 ? 1 : 0];
    return C5[step];
  });
}
function leafClump(p, x, y, rx, ry, C5, seed) {
  const edge = Array.from({ length: 18 }, (_, i) => {
    const a = i / 18 * TAU, r = 0.72 + rand(seed, i, 6) * 0.3;
    return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
  });
  p.poly(edge, C5[1]);
  for (let i = 0; i < 9; i++) {
    const bx = x + (rand(seed, i, 7) - 0.5) * rx * 1.35, by = y + (rand(seed, i, 8) - 0.5) * ry;
    const w = 2 + rand(seed, i, 9) * 4;
    p.poly([[bx - w, by], [bx - 1, by - 2], [bx + w, by - 1], [bx + 2, by + 2]], i % 3 ? C5[2] : C5[3]);
  }
}
function marshTree(p, x, base, h, width, colors, { seed = 1, lean = 8, crown: crown2 = true, detail = true } = {}) {
  const C5 = fit(colors, 5), at8 = (dx, u) => [x + dx, base - h * u];
  const left = 0.24 + rand(seed, 0, 21) * 0.2, right = 0.2 + rand(seed, 0, 22) * 0.22;
  const lift2 = 0.76 + rand(seed, 0, 23) * 0.23, upper = 0.1 + rand(seed, 0, 24) * 0.16;
  const branches = [
    [at8(lean * 0.4, 0.49), at8(-h * left * 0.3, 0.61), at8(-h * left * 0.72, lift2 - 0.12), at8(-h * left, lift2)],
    [at8(lean * 0.5, 0.62), at8(h * right * 0.38, 0.72), at8(h * right * 0.85, lift2 - 0.03), at8(h * right, lift2 + 0.08)],
    [at8(lean, 0.78), at8(-h * upper * 0.4, 0.9), at8(-h * upper, 0.98 + rand(seed, 1, 25) * 0.14)],
    [at8(lean * 0.9, 0.85), at8(h * upper * 0.7, 0.95), at8(h * upper * 1.3, 1.04 + rand(seed, 2, 25) * 0.13)]
  ];
  branches.forEach((pts, i) => {
    limb(p, pts, width * (0.5 - i * 0.07), 0.5, C5, { seed: seed + i, bark: detail });
    const split = pts[pts.length - 2], end = pts.at(-1), dir = i % 2 ? 1 : -1;
    const twig = 5 + rand(seed, i, 26) * 9;
    limb(p, [split, [split[0] - dir * 2, split[1] - twig * 0.6], [split[0] + dir * twig * 0.3, split[1] - twig]], width * 0.15, 0.3, C5, { bark: false });
  });
  limb(p, [at8(0, 0), at8(-width * 0.2, 0.2), at8(lean * 0.5, 0.48), at8(lean, 0.73), at8(lean * 0.7, 1.06)], width, width * 0.09, C5, { seed, bark: detail });
  for (let i = 0; i < 5; i++) {
    const dir = i % 2 ? 1 : -1, reach = width * (0.8 + rand(seed, i, 10) * 1.3);
    limb(p, [[x + dir * width * 0.15, base - h * 0.12], [x + dir * reach * 0.4, base - 4], [x + dir * reach, base + 1 + i % 2]], width * 0.28, 0.6, C5, { seed: seed + i + 31, bark: detail });
  }
  if (crown2) {
    for (const [i, pts] of branches.entries()) {
      const tip = pts.at(-1);
      leafClump(p, tip[0] + 2, tip[1] + 3, h * (0.13 + i % 2 * 0.025), h * 0.075, C5, seed + i * 19);
      if (rand(seed, i, 27) > 0.4) leafClump(p, tip[0] - 8, tip[1] + 8, h * 0.1, h * 0.05, C5, seed + i * 29);
    }
  }
  if (!detail) return;
  const knotY = base - h * 0.34, knotX = x + lean * 0.2;
  p.ellipse(knotX, knotY, width * 0.16, width * 0.24, C5[0]);
  p.arc(knotX, knotY, width * 0.23, 1, 2, 4.6, C5[3]);
  const mossPaths = branches.slice(0, 2).map(contour);
  for (let i = 0; i < 9; i++) {
    const path = mossPaths[i < 4 ? 0 : 1], k = 0.28 + rand(seed, i, 12) * 0.49;
    const [bx, by] = path[Math.floor(k * (path.length - 1))];
    const length = 5 + rand(seed, i, 13) * 11;
    const moss = [C5[1], C5[2], C5[3], mix(C5[3], C5[4], 0.2), C5[4]];
    limb(p, [[bx, by], [bx - 1, by + length * 0.5], [bx + 2, by + length]], 2, 0.5, moss, { bark: false });
  }
}

// ../pixelfx/src/fx/world/wisp-marsh.js
var meta2 = {
  name: "Wisp Marsh",
  desc: "A flooded twilight marsh crossed by a stone causeway: ghost lights drift between crooked roots, luminous mushrooms shed spores and bubbles spread rings across the black water.",
  tags: ["map", "swamp", "water", "mushroom", "wisp", "fantasy", "arena", "loop"],
  kind: "map",
  size: [320, 180],
  origin: [0, 0],
  duration: 12,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: ["#080d19", "#111c27", "#1b3037", "#2c484b", "#466764", "#6b9990", "#8ed7bf", "#d5f4c9"], seed: 1 }
};
var map2 = {
  groundY: 150,
  bounds: [8, 312],
  walk: [[8, 312]],
  platforms: [],
  spawns: { hero: [54, 150], mobs: [[146, 150], [198, 150]], boss: [264, 150] },
  arena: { x0: 8, x1: 312, groundY: 150 }
};
var W2 = 320;
var H2 = 180;
var D2 = meta2.duration;
var FUNGI = [[22, 145, 6], [37, 149, 3.2], [284, 145, 7], [302, 149, 3.5]];
function build3(C5, seed) {
  const back = bake(W2, H2, (p) => {
    sky(p, W2, H2, mix(C5[0], C5[3], 0.15), C5[2], { horizon: 140 });
    for (let i = 0; i < 9; i++) {
      const x = i * 42 - 5 + rand(seed, i, 1) * 22, h = 82 + rand(seed, i, 2) * 38;
      const far = [C5[0], C5[1], mix(C5[1], C5[2], 0.36), mix(C5[1], C5[2], 0.48), C5[2]];
      marshTree(p, x, 133, h, 6 + rand(seed, i, 3) * 3, far, { seed: seed + i * 17, lean: (rand(seed, i, 4) - 0.5) * 23, detail: false });
    }
    const mid = [C5[0], C5[1], C5[2], mix(C5[2], C5[3], 0.3), C5[3]];
    marshTree(p, 76, 139, 110, 11, mid, { seed: seed + 40, lean: -12, detail: false });
    marshTree(p, 249, 137, 98, 12, mid, { seed: seed + 71, lean: 9, detail: false });
    const bank = contour([[0, 130], [30, 128], [66, 137], [102, 132], [151, 135], [196, 129], [239, 133], [279, 126], [320, 131]]);
    p.poly([...bank, [320, 150], [0, 150]], C5[1]);
    for (let i = 0; i < 65; i++) {
      const x = rand(seed, i, 3) * W2, y = 129 + rand(seed, i, 4) * 20;
      p.rect(x, y, 2 + rand(seed, i, 5) * 12, 1, C5[2]);
    }
    for (const [x, y] of [[78, 134], [112, 144], [238, 136], [260, 142]]) {
      p.ellipse(x, y, 5, 1.3, C5[3]);
      p.line(x, y, x + 4, y, C5[2]);
    }
    const wood = [C5[0], mix(C5[0], C5[2], 0.65), C5[2], C5[3], C5[4]];
    marshTree(p, 12, 150, 143, 23, wood, { seed: seed + 7, lean: 13 });
    marshTree(p, 309, 150, 151, 27, wood, { seed: seed + 29, lean: -11 });
    limb(p, [[19, 143], [28, 136], [39, 139], [43, 148]], 6, 1, wood, { seed });
    limb(p, [[302, 144], [291, 133], [279, 137], [274, 149]], 7, 1, wood, { seed: seed + 1 });
  });
  const floor = bake(W2, H2, (p) => {
    p.rect(0, 150, W2, 12, C5[1]);
    const stone4 = [C5[0], C5[1], C5[2], C5[3], C5[4]];
    for (let i = 0, x = -4; x < W2; i++) {
      const w = 12 + Math.floor(rand(seed, i, 31) * 15);
      rock(p, x + w / 2, 156, w * 0.67, 6, stone4, { seed: seed + i * 13, moss: [C5[2], C5[3]] });
      p.rect(x, 150, w, 2, C5[2]);
      p.line(x, 150, x + w - 2, 150, C5[3]);
      x += w;
    }
    p.rect(0, 162, W2, 18, C5[1]);
    for (let i = 0; i < 42; i++) {
      const x = rand(seed, i, 8) * W2, y = 164 + rand(seed, i, 9) * 14;
      p.rect(x, y, 3 + rand(seed, i, 10) * 8, 1, C5[2]);
    }
    for (const [x, y, s] of FUNGI) mushroom(p, x, y, s, C5);
    for (const [i, x] of [8, 28, 291, 312].entries()) rock(p, x, 152, 9, 5, stone4, { seed: seed + i * 21, moss: [C5[3], C5[4]] });
    for (const x of [8, 43, 275, 314]) fern(p, x, 151, 3, C5, seed + x);
    for (let i = 0; i < 24; i++) {
      const x = i < 12 ? 2 + i * 3 : 283 + (i - 12) * 3, h = 4 + rand(seed, i, 11) * 11;
      p.line(x, 179, x + 2, 179 - h, C5[3]);
      if (i % 4 === 0) p.rect(x + 1, 178 - h, 2, 4, C5[4]);
    }
  });
  return { back, floor };
}
function create2(o) {
  const C5 = fit(o.palette, 8), seed = o.seed ?? 1, L4 = build3(C5, seed);
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(p) {
      const u = t % D2 / D2, ph = u * TAU;
      blit(p, L4.back);
      mist(p, t % D2, D2, { y0: 102, y1: 141, color: "#93b9b0", seed, bands: 2, alpha: 0.075 });
      for (let i = 0; i < 5; i++) {
        const x = 69 + i * 42 + Math.sin(ph + i * 2) * 10, y = 89 + i % 3 * 13 + Math.cos(ph * 2 + i) * 5;
        const a = 0.55 + 0.25 * Math.sin(ph * 2 + i);
        p.glow(x, y, 9, C5[6], a * 0.28);
        p.disc(x, y, 1.8, C5[6], a * 0.65);
        p.dot(x, y - 1, C5[7], a);
        p.dot(x - 1, y + 2, C5[5], a * 0.4);
        p.line(x - 3, 140 + i % 2 * 3, x + 3, 140 + i % 2 * 3, C5[5], a * 0.35);
      }
      blit(p, L4.floor);
      for (let i = 0; i < FUNGI.length; i++) {
        const [x, y, s] = FUNGI[i];
        p.glow(x, y - s * 2, 14, C5[6], 0.07 + 0.045 * Math.sin(ph * 2 + i));
        for (let j = 0; j < 4; j++) {
          const q = (u * 2 + j / 4 + i * 0.19) % 1;
          const px = x + Math.sin(ph * 2 + j * 2 + i) * 6, py = y - s * 2 - q * 28;
          p.dot(px, py, C5[7], Math.sin(q * Math.PI) * 0.7);
        }
      }
      for (let i = 0; i < 8; i++) {
        const q = (u * 3 + i / 8) % 1, x = 50 + i * 30, y = 169 + i % 3 * 3;
        if (q < 0.16) p.dot(x, y - Math.sin(q / 0.16 * Math.PI) * 2, C5[5], Math.sin(q / 0.16 * Math.PI) * 0.8);
        for (let j = 0; j < 24; j++) {
          const a = j / 24 * TAU;
          p.dot(x + Math.cos(a) * (1 + q * 7), y + Math.sin(a) * (0.5 + q * 1.4), C5[4], Math.sin(q * Math.PI) * 0.65);
        }
      }
    }
  };
}

// ../pixelfx/src/fx/world/ember-depths.js
var ember_depths_exports = {};
__export(ember_depths_exports, {
  create: () => create3,
  map: () => map3,
  meta: () => meta3
});
var meta3 = {
  name: "Ember Depths",
  desc: "A basalt arena under a volcano: lava falls pour down both walls, a broken bridge smoulders in the dark, heat haze drifts over glowing fissures and ash falls.",
  tags: ["map", "volcano", "cavern", "lava", "fantasy", "arena", "loop"],
  kind: "map",
  size: [320, 180],
  origin: [0, 0],
  duration: 9,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PAL.ember, seed: 1 }
};
var map3 = {
  groundY: 150,
  bounds: [6, 314],
  walk: [[6, 314]],
  platforms: [],
  spawns: { hero: [52, 150], mobs: [[150, 150], [196, 150]], boss: [264, 150] },
  arena: { x0: 6, x1: 314, groundY: 150 }
};
var W3 = 320;
var H3 = 180;
var D3 = meta3.duration;
var ROCK = ["#080709", "#0f0c0e", "#171217", "#221a1e", "#30242a", "#443038", "#5c4142", "#7a5a50"].map(hex);
var HOT2 = [hex("#2a0808"), hex("#6a140c"), hex("#b82c12"), hex("#f06018"), hex("#ff9a28"), hex("#ffd45a"), hex("#fff6c8")];
function stalactites(p, seed) {
  for (let x = -2; x < W3 + 2; x++) {
    const h = 8 + Math.max(0, Math.sin(x * 0.09 + seed) * 10) + rand(seed, x, 1) * 22;
    for (let y = 0; y < h; y++) {
      let c = y < h * 0.55 ? ROCK[1] : ROCK[2];
      if (y > h - 3) c = ROCK[3];
      p.px(x, y, c);
    }
    if (x % 13 === 0 && h > 20) {
      for (let y = h; y < h + 6; y++) p.px(x, y, ROCK[2]);
      p.px(x, h + 6, HOT2[2]);
    }
  }
}
function lavaFall(p, x, top, bottom, seed) {
  const width = 5 + seed % 3;
  for (let y = top; y < bottom; y++) {
    const u = (y - top) / (bottom - top), ww = width * (0.7 + u * 0.7);
    for (let xx = Math.round(x - ww / 2); xx <= Math.round(x + ww / 2); xx++) {
      const d = Math.abs(xx - x) / (ww / 2);
      const n = Math.sin(y * 0.35 + seed + xx * 0.8) * 0.5 + Math.sin(y * 0.11 + seed * 2) * 0.5;
      let c = HOT2[2];
      if (d < 0.45 + n * 0.15) c = HOT2[4];
      if (d < 0.22) c = HOT2[5];
      if (n > 0.55 && d > 0.3) c = HOT2[1];
      p.px(xx, y, c);
    }
    p.glow(x, y, 10, HOT2[3], 0.1);
  }
  for (let i = 0; i < 10; i++) {
    const yy = top + rand(seed, i, 2) * (bottom - top);
    p.dot(x + (rand(seed, i, 3) - 0.5) * width * 2, yy, HOT2[5], 0.8);
  }
}
function columns(p, seed) {
  for (const [x, w, h, lean] of [[8, 22, 118, -2], [46, 14, 86, 1], [252, 16, 98, 2], [286, 26, 126, -1]]) {
    const top = 150 - h;
    for (let y = top; y < 150; y++) {
      const u = (y - top) / h, off = Math.round(lean * u);
      for (let xx = x + off; xx < x + w + off; xx++) {
        let c = ROCK[3];
        if (xx < x + off + 2) c = ROCK[5];
        else if (xx > x + w + off - 3) c = ROCK[1];
        if ((xx * 3 + y) % 29 === 0) c = ROCK[2];
        p.px(xx, y, c);
      }
    }
    for (let y = top + 6; y < 150; y++) p.dot(x + w + Math.round(lean) - 2, y, HOT2[3], 0.22 + 0.1 * Math.sin(y * 0.2 + seed));
    p.glow(x + w / 2, top + h * 0.7, 30, HOT2[2], 0.06);
  }
}
function bridge(p, seed) {
  const y = 104;
  for (let x = 68; x < 250; x++) {
    if (x > 150 && x < 178) continue;
    const u = (x - 68) / 182, sag = Math.sin(u * Math.PI) * 8;
    const yy = y + sag;
    p.rect(x, yy, 1, 4, ROCK[4]);
    p.px(x, yy, ROCK[6]);
    p.px(x, yy + 4, ROCK[2]);
    if ((x - 68) % 14 === 0) p.rect(x, yy + 4, 3, 5, ROCK[2]);
  }
  for (let i = 0; i < 6; i++) {
    const x = 154 + rand(seed, i, 1) * 22, yy = y + 14 + rand(seed, i, 2) * 10;
    p.rect(x, yy, 2 + rand(seed, i, 3) * 3, 1, ROCK[3]);
  }
}
function build4(C5, o) {
  const seed = o.seed ?? 1;
  const base = bake(W3, H3, (p) => {
    for (let y = 0; y < H3; y++) {
      const u = y / H3, c = mix(hex("#050408"), hex("#1c0b0b"), clamp(u * 1.1));
      for (let x = 0; x < W3; x++) p.px(x, y, c);
    }
    stalactites(p, seed);
    for (let x = 0; x < W3; x++) {
      const h = 118 + Math.round(Math.sin(x * 0.05 + seed) * 3);
      for (let y = h; y < 136; y++) {
        const u = (y - h) / 18;
        p.px(x, y, u < 0.18 ? HOT2[5] : u < 0.5 ? mix(HOT2[4], HOT2[3], u) : mix(HOT2[2], HOT2[1], u));
      }
      if (x % 7 === 0) p.dot(x, h - 1, HOT2[4], 0.5 + 0.3 * Math.sin(x * 0.3));
    }
    p.glow(160, 126, 190, HOT2[3], 0.17);
    p.glow(160, 128, 100, HOT2[4], 0.12);
    for (let i = 0; i < 16; i++) {
      const x = rand(seed, i, 5) * W3, w = 3 + rand(seed, i, 6) * 9, h = 10 + rand(seed, i, 7) * 40;
      for (let y = 136 - h; y < 136; y++) for (let xx = x; xx < x + w; xx++) p.px(xx, y, ROCK[1]);
    }
  });
  const mid = bake(W3, H3, (p) => {
    bridge(p, seed + 4);
    columns(p, seed + 2);
    lavaFall(p, 34, 64, 150, seed + 3);
    lavaFall(p, 288, 52, 150, seed + 9);
    for (let i = 0; i < 9; i++) {
      const x = rand(seed, i, 11) * W3, y = 120 + rand(seed, i, 12) * 28;
      p.dot(x, y, HOT2[4], 0.7);
      p.glow(x, y, 8, HOT2[3], 0.12);
    }
  });
  const floor = bake(W3, H3, (p) => {
    ground(p, W3, 150, H3, [ROCK[1], hex("#090709"), ROCK[2], ROCK[3], ROCK[4], HOT2[2], HOT2[3]], { grass: false, stone: true, lava: true, seed });
    p.ellipse(160, 156, 78, 7, ROCK[1]);
    p.ellipse(160, 155, 72, 5, ROCK[2]);
    for (let a = 0; a < TAU; a += 0.18) p.dot(160 + Math.cos(a) * 70, 155 + Math.sin(a) * 5, ROCK[3], 0.7);
    for (const [x0, y0, x1, y1] of [[42, 154, 96, 166], [278, 153, 224, 167], [106, 171, 128, 156], [214, 170, 192, 156]]) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n) + Math.sin(i * 0.7) * 1.2);
        p.px(x, y, HOT2[4]);
        p.dot(x, y + 1, HOT2[2], 0.7);
        p.glow(x, y, 4, HOT2[3], 0.18);
      }
    }
    for (const [cx, rx, ry] of [[4, 26, 8], [316, 28, 9]]) {
      p.ellipse(cx, 157, rx, ry, HOT2[2]);
      p.ellipse(cx, 156, rx * 0.8, ry * 0.7, HOT2[4]);
      for (let i = 0; i < 12; i++) p.dot(cx + (rand(seed, i, 21) - 0.5) * rx * 1.4, 154 + rand(seed, i, 22) * 6, HOT2[5], 0.6);
      p.glow(cx, 155, 50, HOT2[3], 0.25);
    }
    for (let i = 0; i < 26; i++) {
      const x = 12 + rand(seed, i, 31) * 296, y = 148 + Math.floor(rand(seed, i, 32) * 4);
      p.rect(x, y, 1 + rand(seed, i, 33) * 3, 1, i % 3 ? ROCK[2] : HOT2[2]);
    }
    mushroom(p, 66, 149, 1.8, [ROCK[0], ROCK[1], ROCK[2], ROCK[3], ROCK[4], HOT2[2], HOT2[4], HOT2[5]]);
  });
  const fore = bake(W3, H3, (p) => {
    for (const [x0, dir] of [[0, 1], [320, -1]]) {
      for (let i = 0; i < 46; i++) {
        const x = x0 + dir * i, h = 2 + rand(seed, i, 41) * (i < 18 ? 12 : 6);
        for (let k = 0; k < h; k++) p.px(x, H3 - 1 - k, k > h * 0.6 ? ROCK[1] : ROCK[0]);
      }
    }
  });
  return { base, mid, floor, fore };
}
function create3(o) {
  const C5 = fit(o.palette, 7), L4 = build4(C5, o);
  let t = 0;
  return {
    update(dt) {
      t += dt;
    },
    draw(p) {
      const tt = t % D3, ph = tt / D3 * TAU;
      blit(p, L4.base);
      mist(p, tt, D3, { y0: 78, y1: 138, color: "#e08a58", seed: (o.seed ?? 1) + 8, bands: 2, alpha: 0.055 });
      blit(p, L4.mid);
      for (let i = 0; i < 8; i++) {
        const x = i < 4 ? 34 : 288, y = 70 + (tt * 40 + i * 17) % 78, j = Math.sin(tt * 9 + i) * 2;
        p.dot(x + j, y, HOT2[5], 0.6);
        if (i % 2) p.glow(x + j, y, 5, HOT2[3], 0.16);
      }
      blit(p, L4.floor);
      p.glow(34, 148, 34, HOT2[3], 0.15 + 0.04 * Math.sin(ph * 3));
      p.glow(288, 148, 36, HOT2[3], 0.15 + 0.04 * Math.sin(ph * 3 + 1.2));
      p.glow(160, 152, 60, HOT2[2], 0.06 + 0.02 * Math.sin(ph * 2));
      embers(p, tt, D3, { count: 22, color: "#ff9a3c", seed: (o.seed ?? 1) + 3, y0: 150, y1: 48 });
      motes(p, tt, D3, { count: 18, color: "#ffdca8", seed: (o.seed ?? 1) + 7, y0: 24, y1: 144 });
      blit(p, L4.fore);
    }
  };
}

// ../pixelfx/src/fx/critters/slime.js
var slime_exports = {};
__export(slime_exports, {
  draw: () => draw,
  drawBack: () => drawBack,
  meta: () => meta4
});

// ../pixelfx/src/fx/critters/_lib.js
var shift = (t, D17, seed = 1) => wrap(t + (seed - 1) * 0.618 * D17, D17);
function curve(x, list) {
  if (x <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    const [x0, v0] = list[i - 1], [x1, v1] = list[i];
    if (x <= x1) {
      const u = (x - x0) / (x1 - x0 || 1);
      return v0 + (v1 - v0) * u * u * (3 - 2 * u);
    }
  }
  return list[list.length - 1][1];
}
var lnoise = (t, D17, F, off = 0, seed = 0) => tileNoise(t / D17 * F + off, 0.5, F, 0, seed);
var spring = (age, hz, damp) => age < 0 ? 0 : Math.exp(-age * damp) * Math.cos(age * hz * TAU);
function toss(x, y, vx, vy, age, g, floor = 0) {
  const tl = g > 0 ? (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * (floor - y)))) / g : Infinity;
  if (age < tl) return { x: x + vx * age, y: y + vy * age + 0.5 * g * age * age, vx, vy: vy + g * age, landed: false, at: tl, lx: x + vx * tl };
  return { x: x + vx * tl, y: floor, vx: 0, vy: 0, landed: true, at: tl, lx: x + vx * tl };
}
var Grid = class {
  constructor(x0, y0, w, h) {
    this.x0 = Math.floor(x0);
    this.y0 = Math.floor(y0);
    this.w = w;
    this.h = h;
    this.c = new Uint32Array(w * h);
    this.a = new Float32Array(w * h);
    this.tag = new Uint8Array(w * h);
    this.o = { a: 1, t: 0 };
  }
  idx(x, y) {
    const ix = Math.floor(x) - this.x0, iy = Math.floor(y) - this.y0;
    return ix < 0 || iy < 0 || ix >= this.w || iy >= this.h ? -1 : iy * this.w + ix;
  }
  /** Paint a cell: color c, alpha a (below 1 is drawn translucent), tag (any 0..255 label for later passes). */
  set(x, y, c, a = 1, tag = 0) {
    const i = this.idx(x, y);
    if (i >= 0 && c) this.c[i] = c, this.a[i] = a, this.tag[i] = tag;
  }
  get(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.c[i];
  }
  tagAt(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.tag[i];
  }
  erase(x, y) {
    const i = this.idx(x, y);
    if (i >= 0) this.c[i] = 0;
  }
  /** One cell, the same as set() with a friendlier shape for small details. */
  px(x, y, c, a = 1, tag = 0) {
    this.set(x, y, c, a, tag);
  }
  /** A filled rectangle in cells. */
  rect(x, y, w, h, c, a = 1) {
    for (let yy = Math.floor(y); yy < Math.floor(y + h); yy++)
      for (let xx = Math.floor(x); xx < Math.floor(x + w); xx++) this.set(xx, yy, c, a);
  }
  /** A ring from radius r - w to r, on the cell grid. */
  ring(cx, cy, r, w, c, a = 1) {
    const r0 = Math.max(0, r - w);
    for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++)
      for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) {
        const d2 = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2;
        if (d2 <= r * r && d2 >= r0 * r0) this.set(xx, yy, c, a);
      }
  }
  /**
   * fn(x, y, out) at each cell center in the box returns a color (or 0 / undefined to leave it); it may set
   * out.a (alpha) and out.t (tag).
   */
  shade(x0, y0, x1, y1, fn) {
    const o = this.o;
    for (let y = Math.floor(y0); y <= Math.floor(y1); y++)
      for (let x = Math.floor(x0); x <= Math.floor(x1); x++) {
        o.a = 1;
        o.t = 0;
        const c = fn(x + 0.5, y + 0.5, o);
        if (c) this.set(x, y, c, o.a, o.t);
      }
  }
  /** Filled ellipse; c may be fn(nx, ny) of the normalized offset (-1..1), returning a color. */
  ellipse(cx, cy, rx, ry, c, a = 1) {
    if (rx <= 0 || ry <= 0) return;
    this.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y, o) => {
      const nx = (x - cx) / rx, ny = (y - cy) / ry;
      if (nx * nx + ny * ny > 1) return 0;
      o.a = a;
      return typeof c === "function" ? c(nx, ny) : c;
    });
  }
  /** 1 px line; c may be fn(u). */
  line(x0, y0, x1, y1, c, a = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) this.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, typeof c === "function" ? c(i / n) : c, a);
  }
  /** A line of discs, r may be fn(u): tails, tentacles, legs. c may be fn(u, v) with v 0 center .. 1 edge. */
  tube(pts, r, c, a = 1) {
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k], L4 = Math.max(1, Math.hypot(bx - ax, by - ay));
      for (let s = 0; s <= L4; s += 0.5) {
        const u = (k - 1 + s / L4) / (pts.length - 1), rr = typeof r === "function" ? r(u) : r;
        const x = ax + (bx - ax) * s / L4, y = ay + (by - ay) * s / L4;
        if (rr < 0.75) {
          this.set(x, y, typeof c === "function" ? c(u, 0) : c, a);
          continue;
        }
        this.shade(x - rr, y - rr, x + rr, y + rr, (px, py, o) => {
          const d = Math.hypot(px - x, py - y) / rr;
          o.a = a;
          return d > 1 ? 0 : typeof c === "function" ? c(u, d) : c;
        });
      }
    }
  }
  /** Filled polygon (even-odd); c may be fn(x, y). */
  poly(pts, c, a = 1) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
    const n = pts.length;
    this.shade(x0, y0, x1, y1, (x, y, o) => {
      let inside2 = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside2 = !inside2;
      }
      o.a = a;
      return inside2 ? typeof c === "function" ? c(x, y) : c : 0;
    });
  }
  /**
   * A sprite from strings, its pixel (ax, ay) placed at (X, Y). opts: { sx, sy (scale), rot, flip }.
   * Scaled or turned sprites are resampled nearest-neighbour, so they stay hard pixels.
   */
  sprite(rows, pal, X, Y, { ax = 0, ay = 0, sx = 1, sy = 1, rot = 0, flip = false } = {}) {
    const H4 = rows.length, W7 = rows[0].length, cache = {};
    const col = (ch) => ch in cache ? cache[ch] : cache[ch] = pal[ch] === void 0 ? 0 : hex(pal[ch]);
    if (sx === 1 && sy === 1 && rot === 0) {
      for (let r = 0; r < H4; r++)
        for (let q = 0; q < W7; q++) {
          const ch = rows[r][flip ? W7 - 1 - q : q];
          if (ch === "." || ch === " ") continue;
          const c = col(ch);
          if (c) this.set(Math.round(X - (flip ? W7 - 1 - ax : ax)) + q, Math.round(Y - ay) + r, c);
        }
      return;
    }
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const R4 = Math.hypot(Math.max(ax, W7 - ax) * Math.abs(sx), Math.max(ay, H4 - ay) * Math.abs(sy)) + 1;
    this.shade(X - R4, Y - R4, X + R4, Y + R4, (x, y) => {
      const dx = x - X, dy = y - Y, u = (dx * cs + dy * sn) / sx, v = (-dx * sn + dy * cs) / sy;
      let q = Math.floor(ax + u), r = Math.floor(ay + v);
      if (q < 0 || r < 0 || q >= W7 || r >= H4) return 0;
      if (flip) q = W7 - 1 - q;
      const ch = rows[r][q];
      return ch === "." || ch === " " ? 0 : col(ch);
    });
  }
  /**
   * How deep each filled cell sits: 1 on the edge (next to an empty cell, 4-neighbour), 2 one in, ... up to max.
   * Returns a Uint8Array over the grid (0 where empty); depth(x, y) reads it.
   */
  depths(max = 4) {
    const { w, h, c } = this, d = new Uint8Array(w * h), q = [];
    for (let i = 0; i < w * h; i++) {
      if (!c[i]) continue;
      const x = i % w, y = i / w | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !c[i - 1] || !c[i + 1] || !c[i - w] || !c[i + w]) d[i] = 1, q.push(i);
    }
    for (let k = 0; k < q.length; k++) {
      const i = q[k], v = d[i];
      if (v >= max) continue;
      for (const j of [i - 1, i + 1, i - w, i + w]) if (j >= 0 && j < w * h && c[j] && !d[j]) d[j] = v + 1, q.push(j);
    }
    for (let i = 0; i < w * h; i++) if (c[i] && !d[i]) d[i] = max;
    this.d = d;
    return d;
  }
  depth(x, y) {
    const i = this.idx(x, y);
    return i < 0 || !this.d ? 0 : this.d[i];
  }
  /**
   * Wrap everything drawn so far in a 1 px outline (4-neighbour). c is a color, or fn(x, y, nx, ny) with
   * (nx, ny) the outward direction there (summed from the filled neighbours), so the outline can be picked
   * per side: darker under the light, broken where a highlight touches it. Return 0 to leave a gap.
   */
  outline(c, a = 1) {
    const src = this.c.slice(), w = this.w, h = this.h, fn = typeof c === "function";
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (src[i]) continue;
        const l = x > 0 && src[i - 1], r = x < w - 1 && src[i + 1], u = y > 0 && src[i - w], d = y < h - 1 && src[i + w];
        if (!(l || r || u || d)) continue;
        const col = fn ? c(this.x0 + x, this.y0 + y, (l ? 1 : 0) - (r ? 1 : 0), (u ? 1 : 0) - (d ? 1 : 0)) : c;
        if (col) this.c[i] = col, this.a[i] = a, this.tag[i] = 255;
      }
  }
  /** Rework every filled cell: fn(x, y, color, alpha, tag) returns its new color (0 erases it). */
  recolor(fn) {
    for (let i = 0; i < this.w * this.h; i++) {
      if (!this.c[i]) continue;
      this.c[i] = fn(this.x0 + i % this.w, this.y0 + (i / this.w | 0), this.c[i], this.a[i], this.tag[i]) || 0;
    }
  }
  /** Put the grid on the painter, moved by (dx, dy): opaque cells dithered by fade, translucent ones blended. */
  draw(p, fade = 1, dx = 0, dy = 0) {
    const X = this.x0 + Math.round(dx), Y = this.y0 + Math.round(dy);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x, c = this.c[i];
        if (!c) continue;
        const a = this.a[i];
        if (a >= 0.999) p.dot(X + x, Y + y, c, fade);
        else p.blend(X + x, Y + y, c, a * fade);
      }
  }
  clear() {
    this.c.fill(0);
    this.tag.fill(0);
    this.d = null;
    return this;
  }
};
var Swarm = class {
  constructor(opts = {}) {
    this.ps = new Particles({ rng: new Rng(1), ...opts });
  }
  begin(t) {
    this.ps.list.length = 0;
    this.ps.t = t;
    return this;
  }
  add(k, x, y, vx, vy, age, life, col = WHITE, size = 1, flag = 0, seed = 0) {
    if (age < 0 || age >= life) return;
    this.ps.list.push({ k, x, y, vx, vy, life: life - age, max: life, col: col ? hex(col) : 0, size, seed, delay: 0, flag });
  }
  draw(p, layer) {
    this.ps.draw(p, layer);
  }
};
var LAYERS = [[1, 1, 6], [0.76, 0.86, 4], [0.54, 0.68, 2], [0.3, 0.42, 0]];
function tongue(p, x, y, h, w, sx, t, D17, n, heat2, only = -1) {
  if (h < 1) return;
  const F1 = Math.max(1, Math.round(9 * D17)), F2 = Math.max(1, Math.round(4 * D17));
  for (let li = 0; li < LAYERS.length; li++) {
    if (only >= 0 && li !== only) continue;
    const [lw, lh, ri] = LAYERS[li];
    const H4 = h * lh, col = heat2[ri];
    for (let r = 0; r <= H4; r++) {
      const u = r / Math.max(1, H4);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + lnoise(t, D17, F1, r * 0.45, n) * 0.5;
      const cx = x + sx * u * u * lh + lnoise(t, D17, F2, r * 0.2, n + 7) * u * 1.1;
      if (half < 0.3) continue;
      for (let px = Math.round(cx - half); px <= Math.round(cx + half); px++) p.px(px, Math.round(y - r), col);
    }
  }
}
function firePuff(p, x, y, k, size, seed, heat2) {
  const age = 1 - k, n = heat2.length, hot = Math.min(0.999, Math.pow(age, 0.62) + seed % 1 * 0.1);
  const idx = Math.min(n - 2, Math.floor(hot * (n - 1)));
  const r = size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = heat2[idx];
  if (idx >= n - 2) return p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
  p.circle(x, y, r, heat2[Math.min(n - 1, idx + 2)]);
  p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
  if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
  if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, heat2[Math.max(0, idx - 1)]);
  if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
}
function shadow(p, cx, cy, rx, ry, c, a) {
  if (rx <= 0 || ry <= 0 || a <= 0) return;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
      if (d < 1) p.blend(x, y, c, a * (1 - d) ** 0.7);
    }
}
function bounce(x, y, vx, vy, age, g, floor = 0, e = 0.45) {
  let hops = 0;
  for (; hops < 6; hops++) {
    const f = toss(x, y, vx, vy, age, g, floor);
    if (!f.landed) return { x: f.x, y: f.y, vx: f.vx, vy: f.vy, hops, rest: false };
    const vl = vy + g * f.at;
    age -= f.at;
    x = f.lx;
    y = floor - 0.01;
    vx *= 0.7;
    vy = -vl * e;
    if (Math.abs(vy) < 25) break;
  }
  return { x, y: floor - 0.25, vx: 0, vy: 0, hops, rest: true };
}

// ../pixelfx/src/fx/critters/slime.js
var meta4 = {
  name: "Slime",
  desc: "A glossy slime hops in place: it squashes to wind up, stretches into the jump, rounds out in the air, splats down flinging droplets that creep back, then wobbles and blinks.",
  tags: ["critter", "slime", "monster", "hop", "goo", "loop"],
  size: [112, 88],
  origin: [56, 72],
  duration: 1.8,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#061412", "#0b2f2b", "#12594a", "#1f8f4f", "#47c752", "#a6f06a", "#f0ffd2"], hop: 24, seed: 1 }
};
var GRID = new Grid(-30, -64, 60, 66);
var D4 = meta4.duration;
var T_SQ = 0.5;
var T_UP = 0.84;
var T_LIFT = 0.9;
var T_LAND = 1.44;
var SNAP = 0.965;
var W02 = 30;
var H02 = 22;
var VC = 0.4;
var G = 640;
var NDROP = 12;
function pose(t, hop) {
  const age = wrap(t - T_LAND, D4);
  let s, by = 0, lean = 0, round = 0.1, q = -1;
  if (t >= T_LIFT && t < T_LAND) {
    q = (t - T_LIFT) / (T_LAND - T_LIFT);
    by = -hop * 4 * q * (1 - q);
    s = curve(q, [[0, 0.36], [0.4, 0.02], [0.55, -0.05], [0.85, 0.08], [1, 0.16]]);
    round = 0.1 + 0.8 * smooth(0, 0.16, q) * (1 - smooth(0.86, 1, q));
  } else if (t >= T_UP && t < T_LIFT) s = lerp(-0.3, 0.36, ease.outCubic(seg(t, T_UP, T_LIFT)));
  else if (t >= T_SQ && t < T_UP) {
    const u = seg(t, T_SQ, T_UP);
    s = -0.3 * ease.inOutSine(u) + 0.018 * Math.sin(t * TAU * 16) * smooth(0.55, 1, u);
  } else {
    s = age < 0.06 ? -0.46 : -0.46 * spring(age - 0.06, 2.1, 4.6);
    lean = 0.07 * Math.exp(-age * 4) * Math.sin(age * TAU * 1.9);
    if (t < T_SQ) s += 0.02 * Math.sin(t / T_SQ * TAU);
  }
  return { s, by, lean, round, q, age, W: W02 / Math.sqrt(1 + s), H: H02 * (1 + s) };
}
function halfW(v, P3) {
  if (v < 0 || v > 1) return -1;
  const { W: W7, H: H4, round } = P3;
  if (v >= VC) {
    const q2 = (v - VC) / (1 - VC);
    return W7 / 2 * Math.sqrt(1 - q2 * q2);
  }
  const q = (VC - v) / VC, hb = v * H4, rc = 3;
  let hw = W7 / 2 * Math.sqrt(Math.max(0, 1 - round * q * q));
  if (hb < rc) hw -= rc - Math.sqrt(rc * rc - (rc - hb) ** 2);
  return hw;
}
var inside = (P3, x, y) => {
  const v = (P3.by - 1 - y) / P3.H, hw = halfW(v, P3);
  return hw >= 0 && Math.abs(x - P3.lean * v * P3.H) <= hw;
};
function body(g, C5, P3) {
  const yb = P3.by - 1, half = P3.W / 2 + 3;
  const cx = P3.lean * 0.45 * P3.H, cy = yb - P3.H * 0.5, lx = cx - P3.W * 0.24, ly = cy - P3.H * 0.36;
  const lit = (x, y, k) => inside(P3, lx + (x - lx) / k, ly + (y - ly) / k);
  g.clear();
  g.shade(-half, yb - P3.H - 1, half, yb, (x, y, o) => {
    if (!inside(P3, x, y)) return 0;
    o.t = 1;
    o.a = 0.92;
    let i = lit(x, y, 0.42) ? 5 : lit(x, y, 0.7) ? 4 : 3;
    const v = (yb - y) / P3.H;
    if (v < 0.3 && inside(P3, x, y + 1.4)) i = !inside(P3, x, y + 2.4) ? 5 : v < 0.2 ? 4 : i;
    if (!inside(P3, x + 2, y + 2.4)) i = 2, o.a = 1;
    const ang = Math.atan2(y - cy, (x - cx) * (P3.H / P3.W));
    if (!inside(P3, x - 1.6, y - 1.6) && inside(P3, x - 0.7, y - 0.7) && ang > -2.75 && ang < -1.55) i = ang > -2.45 && ang < -1.8 ? 6 : 5, o.a = 1;
    if (i === 2 && inside(P3, x + 1, y + 1.2) && !inside(P3, x + 2, y + 2.4) && ang > 0.3 && ang < 1.5) i = 4;
    return C5[i];
  });
  const hx = Math.round(cx - P3.W * 0.27), hy = Math.round(cy - P3.H * 0.14);
  if (inside(P3, hx - 1, hy) && inside(P3, hx + 1, hy + 1)) g.set(hx, hy, C5[6]), g.set(hx, hy + 1, C5[5]);
}
function face(g, C5, P3, t) {
  const yb = P3.by - 1, ev = 0.47, ey = Math.round(yb - P3.H * ev), ex = Math.max(3, Math.round(P3.W * 0.16)), xc = Math.round(P3.lean * ev * P3.H);
  const air = P3.q >= 0, shut = P3.age < 0.16 && !air, blink = t > 0.22 && t < 0.29;
  const wind = t >= T_SQ && t < T_LIFT ? seg(t, T_SQ, T_UP) : 0, look2 = air ? P3.q < 0.45 ? -1 : P3.q > 0.7 ? 1 : 0 : 0;
  const eh = clamp(Math.round(4 * (1 + P3.s * 0.8) - wind * 2 + (air && P3.q < 0.6 ? 1 : 0)), 1, 5);
  for (const side of [-1, 1]) {
    const x = xc + side * ex - (side > 0 ? 1 : 0);
    if (shut) {
      const a = side < 0 ? 0 : 1, b = 1 - a;
      g.set(x + a, ey - 1, C5[0]);
      g.set(x + b, ey, C5[0]);
      g.set(x + a, ey + 1, C5[0]);
      continue;
    }
    if (blink) {
      g.set(x, ey + 1, C5[0]);
      g.set(x + 1, ey + 1, C5[0]);
      continue;
    }
    const top = ey + 2 - eh + look2;
    for (let k = 0; k < eh; k++) g.set(x, top + k, C5[0]), g.set(x + 1, top + k, C5[0]);
    g.set(x + (look2 > 0 ? 1 : 0), top + (look2 > 0 ? 1 : 0), C5[6]);
    if (eh >= 4) g.set(x + 1, top + eh - 1, C5[2]);
  }
  const my = Math.round(yb - P3.H * 0.31);
  if (air && P3.q < 0.75) g.set(xc, my, C5[0]), g.set(xc - 1, my, C5[0]), g.set(xc, my + 1, C5[1]), g.set(xc - 1, my + 1, C5[1]);
  else if (!shut) g.set(xc, my, C5[1]), g.set(xc - 1, my, C5[1]);
}
var POP = 0.4;
function bubbleIn(g, C5, P3, t) {
  if (t > POP) return;
  const v = lerp(0.18, 0.86, ease.inQuad(t / POP)), hw = halfW(v, P3), x = P3.lean * v * P3.H - hw * lerp(0.35, 0.05, t / POP), y = P3.by - 1 - v * P3.H;
  g.set(x, y, C5[6]);
  g.set(x + 1, y, C5[5]);
  g.set(x, y + 1, C5[5]);
  g.set(x + 1, y + 1, C5[4]);
}
function droplet(i, o, age) {
  const r = rng(o.seed, i, 7), a = -Math.PI / 2 + r.range(-1.2, 1.2), sp = r.range(60, 118), size = r.chance(0.35) ? 1 : r.chance(0.7) ? 2 : 3;
  const fa = a + Math.PI / 2, x0 = Math.sin(fa) * 21, y0 = -1 - Math.cos(fa) * 12.5;
  const f = toss(x0, y0, Math.cos(a) * sp * 0.75, Math.sin(a) * sp, age, G, -1);
  f.size = size;
  if (f.landed) {
    const home = Math.sign(f.lx || 1) * (W02 / 2 - 2), dur = Math.min(0.55, 0.22 + Math.abs(f.lx - home) / 60), u = seg(age - f.at - 0.14, 0, dur);
    f.x = lerp(f.lx, home, ease.inOutSine(u));
    f.k = 1 - u;
    f.gone = u >= 1;
    f.splat = clamp(1 - (age - f.at) / 0.14);
  }
  return f;
}
function puddleR(t, P3) {
  if (P3.q >= 0) return (W02 / Math.sqrt(1.36) / 2 + 3) * (1 - 0.22 * P3.q);
  return P3.W / 2 + 3 + 9 * Math.exp(-P3.age * 5) * (1 - Math.exp(-P3.age * 40)) * (t >= T_LAND || t < T_SQ ? 1 : 0);
}
function draw(p, time, o) {
  const t = shift(time, D4, o.seed), C5 = fit(o.palette, 7), P3 = pose(t, o.hop), yb = P3.by - 1, age = P3.age;
  const g = GRID;
  body(g, C5, P3);
  face(g, C5, P3, t);
  bubbleIn(g, C5, P3, t);
  g.outline((x, y, nx, ny) => ny < 0 && nx <= 0 && y < yb - P3.H * 0.5 ? C5[1] : C5[0]);
  g.draw(p);
  if (t >= POP && t < POP + 0.16) {
    const k = (t - POP) / 0.16, x = P3.lean * P3.H - halfW(0.86, P3) * 0.05, y = yb - P3.H - 0.5;
    for (let a = 0; a < TAU; a += 0.6) p.dot(x + Math.cos(a) * (1 + k * 3), y + Math.sin(a) * (1 + k * 3) * 0.7, C5[6], 1.2 - k);
    for (const s of [-1, 1]) p.dot(x + s * (1 + k * 4), y - 1 - k * 6 + k * k * 4, C5[5], 1.3 - k);
    p.glow(x, y, 6, C5[5], 0.4 * (1 - k));
  }
  for (let i = 0; i < NDROP; i++) {
    const f = droplet(i, o, age);
    if (f.landed || inside(P3, f.x, f.y)) continue;
    const sv = Math.hypot(f.vx, f.vy) || 1, ux = f.vx / sv, uy = f.vy / sv, L4 = Math.min(2.5, sv / 50);
    p.line(f.x - ux * L4, f.y - uy * L4, f.x, f.y, C5[3]);
    if (f.size >= 2) p.px(f.x - 1, f.y, C5[4]), p.px(f.x - 1, f.y + 1, C5[3]), p.px(f.x, f.y + 1, C5[2]);
    if (f.size >= 3) p.px(f.x + 1, f.y, C5[3]), p.px(f.x - 1, f.y - 1, C5[4]), p.px(f.x, f.y - 1, C5[5]);
    p.px(f.x, f.y, f.size >= 2 ? C5[6] : C5[5]);
    p.glow(f.x, f.y, 5 + f.size, C5[4], 0.32);
  }
  cycle(t, D4, 7, o.seed * 13 + 1, (r) => r.range(1.2, 1.8), (ag, L4, r, i) => {
    const k = ag / L4, x = r.range(-24, 24) + Math.sin(ag * 2.1 + i * 1.7) * 3, y = -2 - r.range(9, 17) * ag - 5 * ag * ag;
    const a = Math.min(1, k * 4) * Math.min(1, (1 - k) * 2.5), tw = 0.6 + 0.4 * Math.sin(ag * 7 + i * 2.3), big = r.chance(0.35);
    p.dot(x, y, tw > 0.8 ? C5[6] : C5[5], a);
    if (big) p.dot(x + 1, y, C5[5], a), p.dot(x, y + 1, C5[4], a), p.dot(x + 1, y + 1, C5[4], a * 0.6);
    p.glow(x, y, big ? 9 : 6, C5[5], (big ? 0.45 : 0.32) * a * tw);
  });
  for (const [t0, dx] of DRIPS) {
    const a2 = wrap(t - t0, D4);
    if (a2 > 0.6) continue;
    const P0 = pose(t0, o.hop), f = toss(dx, P0.by - 0.5, 0, 12, a2, G, -1);
    if (!f.landed) p.px(dx, f.y, C5[5]), p.px(dx, f.y - 1, C5[4]), p.glow(dx, f.y, 4, C5[4], 0.3);
    else if (a2 - f.at < 0.14) {
      const k = (a2 - f.at) / 0.14;
      for (const s2 of [-1, 1]) p.dot(dx + s2 * (1 + k * 3), -2 - k * 3 + k * k * 3, C5[5], 1.2 - k);
    }
  }
  if (P3.q > 0.4 && P3.q < 0.64) {
    const k = Math.sin(Math.PI * seg(P3.q, 0.4, 0.64));
    sparkle(p, P3.lean * 0.8 * P3.H - P3.W * 0.21, yb - P3.H * 0.8, 1 + 2.5 * k, C5[6], C5[5], 0.5 * k);
  }
  const cx = P3.lean * P3.H * 0.4, cy = yb - P3.H * 0.45, near = clamp(1 + P3.by / (o.hop * 1.1));
  const R4 = puddleR(t, P3), br = 0.9 + 0.1 * Math.sin(t / D4 * TAU * 2);
  p.glow(cx * 0.5, -14, 64, C5[3], 0.3 * br);
  p.glow(cx, cy, 30 + P3.W * 0.3, C5[4], 0.2);
  p.glow(cx, cy + 3, 14, C5[5], 0.16);
  p.glow(0, -2, R4 * 1.3 + 6, C5[4], 0.12 + 0.08 * near);
  if (t >= T_LAND || t < T_SQ) p.glow(0, -3, 40, C5[5], 0.42 * Math.exp(-age * 9));
}
var DRIPS = [[1.02, -4], [1.18, 3]];
function drawBack(p, time, o) {
  const t = shift(time, D4, o.seed), C5 = fit(o.palette, 7), P3 = pose(t, o.hop), age = P3.age;
  const R4 = puddleR(t, P3), hp = Math.min(2.4, 0.9 + R4 * 0.06);
  for (let x = Math.floor(-R4); x <= Math.ceil(R4); x++) {
    const d = Math.abs(x + 0.5) / R4;
    if (d > 1) continue;
    const top = -1 - Math.round(Math.sqrt(1 - d * d) * hp);
    for (let y = top; y <= 0; y++) {
      let c = y === top ? C5[5] : y === 0 ? C5[2] : C5[4];
      if (d > 0.88) c = y === top ? C5[4] : C5[3];
      if (y === top && d < 0.88) {
        const n = lnoise(t, D4, 7, x * 0.18, 3) + lnoise(t, D4, 4, x * 0.07, 4) * 0.6;
        if (n > 0.55) c = C5[6];
      } else if (y === top + 1 && d < 0.8 && lnoise(t, D4, 3, x * 0.12, 5) > 0.3) c = C5[5];
      p.px(x, y, c);
    }
    if (d > 0.96) p.px(x, top - 1, C5[1]);
  }
  cycle(t, D4, 4, o.seed * 17 + 3, (r) => r.range(0.45, 0.75), (ag, L4, r) => {
    const x = r.range(-0.85, 0.85) * R4, k = ag / L4, rb = r.range(1.4, 2.6) * (0.3 + 0.7 * ease.outCubic(Math.min(1, k * 1.25)));
    if (Math.abs(x) < P3.W / 2 + 1 && P3.q < 0) return;
    const sy = -1 - Math.round(Math.sqrt(Math.max(0, 1 - (x / R4) ** 2)) * hp);
    if (k < 0.85) {
      for (let y = Math.floor(sy - rb); y <= sy; y++)
        for (let xx = Math.floor(x - rb - 1); xx <= Math.ceil(x + rb + 1); xx++) {
          const dx = xx + 0.5 - x, dy = y + 0.5 - sy, dd = Math.hypot(dx, dy);
          if (dd > rb + 0.5) continue;
          if (dd > rb - 0.7) p.px(xx, y, dx < 0 && dy < -rb * 0.3 ? C5[6] : C5[4]);
          else p.blend(xx, y, C5[5], 0.3);
        }
      p.glow(x, sy - rb * 0.5, rb * 2 + 3, C5[5], 0.2);
    } else {
      const q = (k - 0.85) / 0.15;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0.6, -0.7], [-0.6, -0.7], [0, -1]]) p.dot(x + dx * (2 + 3 * q), sy + dy * (2 + 3 * q), C5[6], 1.2 - q);
    }
  });
  for (let i = 0; i < NDROP; i++) {
    const f = droplet(i, o, age);
    if (!f.landed || f.gone) continue;
    const x = Math.round(f.x), w = f.size + (f.splat > 0 ? 1 : 0);
    for (let j = 0; j < w; j++) p.px(x - (w >> 1) + j, -1, j === 0 ? C5[5] : C5[4]);
    if (f.size >= 2 && f.splat <= 0) p.px(x, -2, C5[5]), p.px(x - 1, -2, C5[4]);
    p.px(x, 0, C5[3]);
    const dir = Math.sign(f.lx - f.x);
    for (let j = 1; j < Math.min(8, Math.abs(f.lx - f.x)); j++) p.dot(x + dir * j, 0, C5[2], 0.7 - j * 0.08);
    p.glow(x, -1, 5, C5[4], 0.25 * f.k + 0.1);
  }
  if (t >= T_LIFT && t < SNAP) {
    const bot = P3.by - 1, u = (t - T_LIFT) / (SNAP - T_LIFT);
    for (let y = Math.floor(bot); y < 0; y++) {
      const m = Math.sin((y - bot) / -bot * Math.PI);
      p.px(-1, y, C5[4]);
      if (m * u < 0.45) p.px(0, y, C5[3]);
    }
  } else if (t >= SNAP && t < SNAP + 0.3) {
    const a2 = t - SNAP, ys = pose(SNAP, o.hop).by - 1, f = toss(-1, ys * 0.45, 0, 0, a2, G * 1.3, -2);
    if (!f.landed) p.px(-1, f.y, C5[5]), p.px(-1, f.y - 1, C5[3]);
    const nub = 3 * (1 - a2 / 0.12);
    for (let j = 0; j < nub; j++) p.px(-1, P3.by + j, j === 0 ? C5[3] : C5[4]);
  }
}

// ../pixelfx/src/fx/critters/snake.js
var snake_exports = {};
__export(snake_exports, {
  draw: () => draw2,
  drawBack: () => drawBack2,
  meta: () => meta5
});
var meta5 = {
  name: "Snake",
  desc: "A snake slithers along the floor, head raised: humps rise and roll back down its patterned body to the tail, dust puffs where it touches down, its forked tongue flicks.",
  tags: ["critter", "snake", "reptile", "ground", "loop"],
  size: [136, 56],
  origin: [68, 48],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#081410", "#123a1e", "#1d5e2a", "#2f8a36", "#5cb848", "#a8e070", "#e8ffc0"],
    belly: ["#4a3a14", "#b08a34", "#f0d878"],
    seed: 1
  }
};
var D5 = meta5.duration;
var HEAD = 30;
var LEN = 70;
var GRID2 = new Grid(-44, -24, 88, 26);
var SWARM = new Swarm();
var TONGUE = hex("#e8304a");
var DUST2 = hex("#8a7f92");
var K = TAU / 30;
var W4 = TAU * 2 / D5;
function lift(u, t) {
  const wave = Math.max(0, Math.sin(K * u - W4 * t)) ** 0.85, env = smooth(8, 18, u) * (1 - smooth(LEN - 14, LEN - 2, u));
  const neck = u < 12 ? 6 * (1 - u / 12) ** 2 : 0;
  return 7 * wave * env + neck;
}
var radius = (u) => u < 6 ? 3.3 : lerp(3.4, 0.6, ((u - 6) / (LEN - 6)) ** 1.3);
var bob = (t) => 0.8 * Math.sin(W4 * t);
function tongue2(t) {
  for (const t0 of [0.3, 1.5]) {
    const k = (t - t0) / 0.5;
    if (k >= 0 && k < 1) return Math.max(0, Math.sin(k * Math.PI * 3)) ** 0.6;
  }
  return 0;
}
function snake(g, C5, B3, t) {
  g.clear();
  const hb = bob(t);
  for (let u = LEN; u >= 2; u -= 0.5) {
    const x = HEAD - u, r0 = radius(u), cy = -r0 - lift(u, t) + (u < 12 ? hb * (1 - u / 12) : 0), hump = lift(u, t);
    const slope = lift(u + 0.5, t) - lift(u - 0.5, t), r = r0 * Math.sqrt(1 + slope * slope);
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      const v = (y + 0.5 - cy) / r;
      if (Math.abs(v) > 1) continue;
      let c = v < -0.5 ? C5[4] : v < 0.1 ? C5[3] : v < 0.45 ? C5[2] : v < 0.8 ? B3[1] : B3[0];
      const dm = Math.abs((u + 2) % 7 - 3.5) / 3.5 + Math.abs(v + 0.25) / 0.55;
      if (dm < 0.85 && v < 0.35 && u > 4) c = dm < 0.5 ? C5[1] : C5[2];
      if (v < -0.62 && hump > 4.5 && dm >= 0.85) c = hump > 6 ? C5[6] : C5[5];
      if (v > 0.45 && v < 0.8 && Math.floor(u) % 3 === 0) c = B3[2];
      g.set(x, y, c);
    }
  }
  const hx = HEAD + 2, hy = -9.5 + hb;
  g.shade(hx - 5, hy - 4, hx + 6, hy + 4, (x, y) => {
    const dx = (x - hx) / (x > hx ? 5.6 : 4.6), dy = (y - hy) / (3.6 - Math.max(0, x - hx) * 0.18);
    if (dx * dx + dy * dy > 1) return 0;
    if (dy > 0.55) return B3[1];
    return dy < -0.3 ? dx < 0.3 ? C5[5] : C5[4] : C5[3];
  });
  g.line(hx - 1, hy + 1.5, hx + 5, hy + 1.2, C5[1]);
  g.set(hx + 1, hy - 2, C5[0]);
  g.set(hx + 2, hy - 2, B3[2]);
  g.set(hx + 1, hy - 1, B3[2]);
  g.set(hx + 2, hy - 1, C5[0]);
  g.set(hx + 1, hy - 3, C5[6]);
  g.set(hx + 5, hy - 1, C5[1]);
  g.outline(C5[0]);
}
function draw2(p, time, o) {
  const t = shift(time, D5, o.seed), C5 = fit(o.palette, 7), B3 = fit(o.belly, 3), hb = bob(t);
  const e = tongue2(t), tx = HEAD + 7.5, ty = -8.2 + hb;
  if (e > 0.05) {
    const L4 = 7 * e, wig = Math.sin(t * 60) * 0.6 * e;
    p.line(tx, ty, tx + L4, ty + wig, TONGUE);
    if (L4 > 3) p.px(tx + L4 + 1, ty + wig - 1, TONGUE), p.px(tx + L4 + 1, ty + wig + 1, TONGUE);
  }
  const g = GRID2;
  snake(g, C5, B3, t);
  g.draw(p);
  const sw = SWARM.begin(t);
  cycle(t, D5, 26, o.seed * 7 + 1, (r) => r.range(0.6, 1.1), (age, L4, r) => {
    const born = wrap(t - age, D5), m = r.int(0, 2), u = (Math.PI + W4 * born + m * TAU) / K;
    if (u < 18 || u > LEN - 10) return;
    const x = HEAD - u + r.range(-2, 2) - r.range(6, 16) * age;
    sw.add(P.SMOKE, x, -0.5 - age * r.range(3, 8), 0, 0, age, L4, DUST2, r.range(1.8, 3.4));
  });
  sw.draw(p);
  p.glow(HEAD + 3.5, -11 + hb, 4, B3[2], 0.35);
}
function drawBack2(p, time, o) {
  const t = shift(time, D5, o.seed), C5 = fit(o.palette, 7);
  for (let u = 2; u <= LEN; u += 2) {
    const h = lift(u, t), r = radius(u);
    shadow(p, HEAD - u, -0.2, 2.2 + r * 0.4, 1.2, C5[0], 0.5 * (1 - clamp(h / 10)) + 0.1);
  }
  shadow(p, HEAD + 2, -0.2, 5, 1.2, C5[0], 0.35);
}

// ../pixelfx/src/fx/critters/frog.js
var frog_exports = {};
__export(frog_exports, {
  draw: () => draw3,
  drawBack: () => drawBack3,
  meta: () => meta6
});
var meta6 = {
  name: "Frog",
  desc: "A frog puffs its throat, blinks, crouches and leaps to snap a buzzing fly out of the air, then lands with a squash and a puff of dust, gulps and settles.",
  tags: ["critter", "frog", "animal", "hop", "ground", "loop"],
  size: [112, 88],
  origin: [56, 80],
  duration: 2.6,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#0a160c", "#173a18", "#256024", "#3a8a2e", "#62b440", "#a8e070", "#e8ffc0"],
    belly: ["#5e5a24", "#bdb45a", "#efe9a8"],
    seed: 1
  }
};
var D6 = meta6.duration;
var GRID3 = new Grid(-22, -40, 44, 44);
var SWARM2 = new Swarm();
var T_CROUCH = 0.95;
var T_UP2 = 1.2;
var T_LAND2 = 1.62;
var T_SNAP = 1.4;
var T_BACK = 1.95;
var G2 = 1e3;
var HOP = G2 * (T_LAND2 - T_UP2) ** 2 / 8;
var EYE = ["#3a2a08", "#c89420", "#ffd860"].map(hex);
var TONGUE2 = hex("#e8607a");
var FLY = hex("#141018");
var WINGS = hex("#c8d0e0");
var DUST3 = hex("#8a7f92");
function pose2(t) {
  let by = 0, rot = 0, sq = 0, leg = 0, throat = 0, shut = 0;
  const age = wrap(t - T_LAND2, D6);
  for (const [a, b] of [[0.05, 0.45], [0.5, 0.85], [1.75, 1.95]]) if (t > a && t < b) throat = Math.sin(Math.PI * ((t - a) / (b - a))) ** 0.7 * (a > 1 ? 0.6 : 1);
  if (t > 0.88 && t < 0.95) shut = 1;
  if (t >= T_CROUCH && t < T_UP2) {
    const u = ease.inOutSine(seg(t, T_CROUCH, T_UP2));
    sq = -0.18 * u;
    rot = -0.12 * u;
  } else if (t >= T_UP2 && t < T_LAND2) {
    const q = (t - T_UP2) / (T_LAND2 - T_UP2);
    by = -HOP * 4 * q * (1 - q);
    rot = lerp(0.42, -0.25, q);
    sq = lerp(0.18, 0.02, Math.min(1, q * 2));
    leg = q < 0.75 ? 1 : 1 - (q - 0.75) / 0.25;
  } else {
    sq = -0.24 * spring(age, 2.4, 6.5);
    rot = -0.08 * Math.exp(-age * 6);
  }
  return { by, rot, sq, leg, throat, shut, air: t >= T_UP2 && t < T_LAND2 };
}
function fly2(t) {
  if (t > T_SNAP && t < T_BACK) return null;
  const a = t / D6 * TAU * 3, home = [16 + 6 * Math.sin(a), -40 + 3 * Math.sin(2 * a)];
  const inn = wrap(t - T_BACK, D6);
  if (inn < 0.45) {
    const u = ease.outCubic(inn / 0.45);
    return [lerp(-52, home[0], u), lerp(-46, home[1], u) + Math.sin(inn * 30) * 1.5];
  }
  return home;
}
function frog(g, C5, Bl, Pz, t) {
  g.clear();
  const cs = Math.cos(Pz.rot), sn = Math.sin(Pz.rot), sx = 1 + Pz.sq * -0.6, sy = 1 + Pz.sq;
  const local = (x, y) => {
    const dx = x, dy = y + 7;
    return [(dx * cs + dy * sn) / sx, (-dx * sn + dy * cs) / sy - 7];
  };
  const inBody = (x, y) => ((x + 1) / 10.5) ** 2 + ((y + 7) / 6) ** 2 <= 1 || ((x - 6) / 6.2) ** 2 + ((y + 8.6) / 4.8) ** 2 <= 1;
  const inEye = (x, y) => (x - 5.5) ** 2 + (y + 13.2) ** 2 <= 3.2 ** 2;
  const lit = (x, y, k) => inBody(-4 + (x + 4) / k, -13 + (y + 13) / k);
  g.shade(-15, -22, 15, 1, (x, y) => {
    const [u, v] = local(x, y);
    if (!inBody(u, v) && !inEye(u, v)) return 0;
    if (inEye(u, v)) {
      const d = Math.hypot(u - 5.5, v - 13.2 * -1);
      if (Pz.shut) return v < -13.2 ? C5[4] : C5[3];
      if (Math.abs(v + 13) < 0.7 && Math.abs(u - 6) < 1.8) return C5[0];
      if (u < 4.7 && v < -14) return EYE[2];
      return d < 2.4 ? EYE[1] : EYE[0];
    }
    if (v > -5 && u > -6) return v > -3 ? Bl[1] : Bl[2];
    for (const [px, py, r] of [[-5, -10, 1.6], [0, -11.5, 1.3], [-8, -7, 1.2], [3, -12.5, 0.9]]) if (Math.hypot(u - px, v - py) < r) return C5[2];
    if (!inBody(u + 2, v + 2.4)) return C5[2];
    return lit(u, v, 0.5) ? C5[5] : lit(u, v, 0.8) ? C5[4] : C5[3];
  });
  const legs = [];
  if (Pz.leg < 0.5) {
    g.ellipse(-7.5, -4.5 + (1 - sy) * 3, 5, 3.6, (nx, ny) => nx * -0.6 + ny * -0.8 > 0.35 ? C5[4] : ny > 0.4 ? C5[2] : C5[3]);
    legs.push([[-4, -1.5], [-9, -1], [-3, -0.5], [4, -0.5]]);
  } else {
    const ex = -8 - 10 * Pz.leg, ey = 4 + 6 * Pz.leg;
    legs.push([[-6, -5], [-10, 0], [ex, ey], [ex - 5, ey + 2]]);
  }
  for (const L4 of legs) {
    g.tube(L4, (u) => lerp(2, 0.7, u), (u, v) => v > 0.55 ? C5[2] : u > 0.66 ? C5[3] : C5[4]);
    const [fx, fy] = L4[L4.length - 1], [px, py] = L4[L4.length - 2], dx = fx - px, dy = fy - py, l = Math.hypot(dx, dy) || 1;
    for (const k of [-1, 0, 1]) g.line(fx, fy, fx + dx / l * 2 - dy / l * k * 1.6, fy + dy / l * 2 + dx / l * k * 1.6, C5[3]);
  }
  if (!Pz.shut) {
    const [gx, gy] = [4.6, -14.4], X = gx * cs - (gy + 7) * sn * 1, Y = gx * sn + (gy + 7) * cs - 7;
    g.set(X, Y, C5[6]);
  }
  for (let u = 3; u <= 11; u++) {
    const v = -7.8 + (u - 3) * 0.05, X = u * sx * cs - (v + 7) * sy * sn, Y = u * sx * sn + (v + 7) * sy * cs - 7;
    g.set(X, Y, C5[1]);
  }
  const fl = Pz.air ? [[7, -4], [9, -1]] : [[7, -4], [8, -0.5]];
  g.line(fl[0][0], fl[0][1], fl[1][0], fl[1][1], C5[3]);
  g.set(fl[1][0] + 1, fl[1][1], C5[3]);
  g.set(fl[1][0] - 1, fl[1][1], C5[3]);
  if (Pz.throat > 0.05) {
    const r = 0.8 + 2.8 * Pz.throat, cx = 7, cy = -5.2 + r * 0.25;
    g.ellipse(cx, cy, r * 1.1, r, (nx, ny) => nx * -0.6 + ny * -0.8 > 0.55 ? Bl[2] : ny > 0.5 ? Bl[1] : mix(Bl[2], C5[5], 0.4), 0.9);
    g.set(cx - r * 0.4, cy - r * 0.45, C5[6]);
  }
  g.outline(C5[0]);
}
function draw3(p, time, o) {
  const t = shift(time, D6, o.seed), C5 = fit(o.palette, 7), Bl = fit(o.belly, 3), Pz = pose2(t);
  const g = GRID3;
  frog(g, C5, Bl, Pz, t);
  g.draw(p, 1, 0, Math.round(Pz.by));
  const ts = (t - T_SNAP + 0.06) / 0.14;
  if (ts > 0 && ts < 1) {
    const f2 = fly2(T_SNAP - 1e-3), e = Math.sin(Math.PI * ts), mx = 11, my = Pz.by - 8;
    const x1 = lerp(mx, f2[0], e), y1 = lerp(my, f2[1], e);
    p.line(mx, my, x1, y1, TONGUE2);
    p.line(mx, my + 1, x1, y1 + 1, mix(TONGUE2, C5[0], 0.4));
    p.circle(x1, y1, 1.4, TONGUE2);
  }
  const f = fly2(t);
  if (f) {
    const flap = Math.sin(t * 90) > 0;
    p.px(f[0], f[1], FLY);
    p.px(f[0] + 1, f[1], FLY);
    p.dot(f[0], f[1] - (flap ? 1 : 0), WINGS, 0.8);
    p.dot(f[0] + 1, f[1] - (flap ? 0 : 1), WINGS, 0.8);
    p.glow(f[0], f[1], 3, WINGS, 0.15);
  }
  const sw = SWARM2.begin(t);
  for (const [t0, n, pow] of [[T_UP2, 7, 0.6], [T_LAND2, 18, 1]]) {
    const age = wrap(t - t0, D6);
    for (let i = 0; i < n; i++) {
      const r = rng(o.seed, i, t0 * 100), L4 = r.range(0.6, 1.1) * pow;
      if (age > L4) continue;
      const s = r.sign(), v = r.range(24, 70) * pow, x = s * (7 + v / 3.5 * (1 - Math.exp(-age * 3.5))), y = -1.5 - r.range(1, 5) * age;
      sw.add(P.SMOKE, x, y, 0, 0, age, L4, DUST3, r.range(2.2, 4.2) * (0.65 + 0.35 * pow), 2);
    }
    if (pow === 1)
      for (let i = 0; i < 8; i++) {
        const r = rng(o.seed, i, 909), b = toss(r.range(-8, 8), -1, r.range(-40, 40), -r.range(30, 70), age, 700, -0.5);
        if (age < 0.7) p.dot(b.x, b.y, i % 2 ? hex("#6a6074") : hex("#9a90a4"), b.landed ? 1.4 - age * 2 : 1);
      }
  }
  sw.draw(p);
}
function drawBack3(p, time, o) {
  const t = shift(time, D6, o.seed), C5 = fit(o.palette, 7), Pz = pose2(t), hgt = clamp(-Pz.by / HOP);
  shadow(p, 0, -0.2, 13 * (1 - 0.35 * hgt), 1.6, C5[0], 0.6 - 0.3 * hgt);
}

// ../pixelfx/src/fx/critters/bat.js
var bat_exports = {};
__export(bat_exports, {
  draw: () => draw4,
  meta: () => meta7
});
var meta7 = {
  name: "Bat",
  desc: "A bat flaps in four snappy wing frames along a figure-eight, its body lifting on each downbeat, moonlight on its wing bones, red eyes glowing and glinting.",
  tags: ["critter", "bat", "night", "flying", "spooky", "loop"],
  size: [112, 80],
  origin: [56, 40],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: ["#0c0912", "#1f1629", "#382645", "#5b3f66", "#866089", "#b88fb0", "#e8cfe0"], eyes: ["#8a1020", "#ff3b30", "#ffb04a", "#fff0c0"], seed: 1 }
};
var D7 = meta7.duration;
var FLAPS = 6;
var GRID4 = new Grid(-24, -22, 48, 40);
var FRAMES = [
  { arm: -58, al: 8, f: [-112, -76, -38], fl: [9, 11, 9], lift: 1 },
  { arm: -18, al: 9, f: [-40, -12, 16], fl: [10, 11, 9], lift: 0 },
  { arm: 28, al: 8, f: [50, 72, 94], fl: [9, 10, 8], lift: -2 },
  { arm: -42, al: 6, f: [-66, -38, -10], fl: [7, 8, 6], lift: -1 }
];
var rad = (d) => d * Math.PI / 180;
function at(t) {
  const a = t / D7 * TAU;
  return { x: 22 * Math.sin(a), y: 7 * Math.sin(2 * a), vx: Math.cos(a) };
}
var frameAt = (t) => Math.floor(wrap(t / D7 * FLAPS, 1) * 4) % 4;
function wingPts(F, s) {
  const sh = [s * 2.5, -2], ar = rad(F.arm), wr = [sh[0] + s * Math.cos(ar) * F.al, sh[1] + Math.sin(ar) * F.al];
  const tips = F.f.map((d, i) => [wr[0] + s * Math.cos(rad(d)) * F.fl[i], wr[1] + Math.sin(rad(d)) * F.fl[i]]);
  const pull = (a, b, k) => [lerp((a[0] + b[0]) / 2, wr[0], k), lerp((a[1] + b[1]) / 2, wr[1], k)];
  const hip = [s * 2, 3.5];
  return { sh, wr, tips, hip, poly: [sh, wr, tips[0], pull(tips[0], tips[1], 0.22), tips[1], pull(tips[1], tips[2], 0.22), tips[2], pull(tips[2], hip, 0.38), hip] };
}
function bat(g, C5, E, F, t) {
  g.clear();
  for (const s of [-1, 1]) {
    const w = wingPts(F, s), lead = (x, y) => {
      const [ax, ay] = w.wr, [bx, by] = w.tips[0], dx = bx - ax, dy = by - ay, L4 = Math.hypot(dx, dy) || 1;
      return Math.abs(((x - ax) * dy - (y - ay) * dx) / L4);
    };
    g.poly(w.poly, (x, y) => {
      const near = Math.hypot(x - w.sh[0], y - w.sh[1]);
      if (lead(x, y) < 1.2 && F.arm < 20) return C5[3];
      return near < 4.5 ? C5[1] : C5[2];
    });
    g.line(w.sh[0], w.sh[1], w.wr[0], w.wr[1], C5[4]);
    for (const tip of w.tips) g.line(w.wr[0], w.wr[1], tip[0], tip[1], (u) => u < 0.6 ? C5[4] : C5[3]);
    g.set(w.wr[0], w.wr[1] - 1, C5[5]);
  }
  g.ellipse(0, 0.5, 3.8, 4.8, (nx, ny) => nx * -0.6 + ny * -0.8 > 0.45 ? C5[4] : nx * 0.6 + ny * 0.8 > 0.55 ? C5[2] : ny > 0.1 && Math.abs(nx) < 0.5 ? C5[4] : C5[3]);
  for (const s of [-1, 1]) {
    g.poly([[s * 0.6, -3.5], [s * 3.6, -9.5], [s * 3.8, -3]], s < 0 ? C5[4] : C5[3]);
    g.line(s * 2.6, -4, s * 3.2, -7.5, C5[5]);
  }
  g.set(-2, -1, E[1]);
  g.set(1, -1, E[1]);
  g.set(-1, 0, C5[1]);
  g.set(0, 0, C5[1]);
  g.set(-1, 1, C5[6]);
  g.set(0, 1, C5[6]);
  g.set(-2, 5, C5[3]);
  g.set(1, 5, C5[3]);
  g.outline(C5[0]);
}
function draw4(p, time, o) {
  const t = shift(time, D7, o.seed), C5 = fit(o.palette, 7), E = fit(o.eyes, 4), S = at(t), fi = frameAt(t), F = FRAMES[fi];
  const X = Math.round(S.x), Y = Math.round(S.y + F.lift);
  for (let k = 2; k <= 16; k++) {
    const A2 = at(t - (k - 1) * 0.022), B22 = at(t - k * 0.022), u = 1 - k / 17;
    for (const ex of [-1.5, 1.5]) p.glowLine(A2.x + ex, A2.y - 0.5, B22.x + ex, B22.y - 0.5, 2.6, E[1], 0.16 * u);
  }
  cycle(t, D7, 9, o.seed * 11 + 1, D7, (age, L4, r) => {
    const x = r.range(-50, 50) + Math.sin(age * 1.1 + r.next() * 6) * 3, y = r.range(-34, 34) + age * r.range(-2, 3);
    const tw = Math.sin(age * 2.6 + r.next() * 6), a = Math.min(1, age * 2, (L4 - age) * 2) * (0.4 + 0.5 * tw);
    p.dot(x, y, tw > 0.7 ? C5[6] : C5[5], a);
    if (tw > 0.5) p.glow(x, y, 3, C5[5], 0.2 * a);
  });
  const g = GRID4;
  if (fi === 2) {
    bat(g, C5, E, FRAMES[1], t);
    g.recolor((x, y, c) => mix(c, C5[4], 0.35));
    g.a.fill(0.35);
    g.draw(p, 1, X, Y - FRAMES[1].lift + F.lift);
  }
  bat(g, C5, E, F, t);
  g.draw(p, 1, X, Y);
  p.glow(X - 3, Y - 6, 10, C5[5], 0.12);
  for (const ex of [-1.5, 1.5]) p.glow(X + ex, Y - 0.5, 7, E[1], 0.6), p.glow(X + ex, Y - 0.5, 2.5, E[2], 0.5);
  p.glow(X, Y, 22, E[0], 0.25);
  for (const g0 of [0.3, 1.5]) {
    const k = wrap(t - g0, D7) / 0.24;
    if (k < 1) sparkle(p, X - 2, Y - 1, 1 + 2.5 * Math.sin(Math.PI * k), E[3], E[2], 0.4 * Math.sin(Math.PI * k));
  }
}

// ../pixelfx/src/fx/critters/wisp.js
var wisp_exports = {};
__export(wisp_exports, {
  draw: () => draw5,
  drawBack: () => drawBack4,
  meta: () => meta8
});
var meta8 = {
  name: "Wisp",
  desc: "A will-o'-the-wisp loops a figure-eight over the floor: a little soul-flame with a face, its flame tail licking up and streaming behind, shedding puffs and sparks.",
  tags: ["critter", "wisp", "spirit", "flame", "magic", "flying", "loop"],
  size: [128, 104],
  origin: [64, 96],
  duration: 3.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0a1f2e", "#0f3d52", "#14707e", "#1fa8a8", "#4fe0c8", "#a8fff0", "#ffffff"], hover: 36, seed: 1 }
};
var D8 = meta8.duration;
var SWARM3 = new Swarm();
function at2(t, hover) {
  const a = t / D8 * TAU;
  return { x: 34 * Math.sin(a), y: -hover - 10 * Math.sin(2 * a), vx: 34 * TAU / D8 * Math.cos(a), vy: -20 * TAU / D8 * Math.cos(2 * a) };
}
function draw5(p, time, o) {
  const t = shift(time, D8, o.seed), C5 = fit(o.palette, 7), S = at2(t, o.hover);
  const heat2 = [C5[6], C5[6], C5[5], C5[5], C5[4], C5[4], C5[3], C5[3], C5[3]];
  const lean = clamp(-S.vx / 80, -0.9, 0.9), stretch = clamp(S.vy / 120, -0.3, 0.4), X = S.x, Y = S.y;
  cycle(t, D8, 30, o.seed * 7 + 1, (r) => r.range(0.3, 0.6), (age, L4, r) => {
    const S0 = at2(wrap(t - age, D8), o.hover), [x, y] = fly(S0.x + r.range(-3, 3), S0.y - r.range(0, 4), r.range(-8, 8), -r.range(6, 16), age, -40, 2.5);
    firePuff(p, x, y, 1 - age / L4, r.range(1.2, 2.6), r.next() * 100, heat2);
  });
  const tails = [[-3.5, 13, 2.5, 3], [3.5, 14, 2.5, 7], [0, 20, 3.2, 11]];
  for (let li = 0; li < 4; li++)
    for (const [dx, h, w, n] of tails) {
      const hh = (h + 0.25 * h * lnoise(t, D8, 9, n, 5)) * (1 + stretch);
      tongue(p, X + dx, Y - 2, hh, w, lnoise(t, D8, 6, n, 40) * 1.5 + lean * hh * 0.9, t, D8, n, heat2, li);
    }
  const R4 = 7.5;
  p.shade(X - R4 - 2, Y - R4 - 2, X + R4 + 2, Y + R4 + 2, (x, y, out) => {
    const dx = x - X, dy = y - Y, ang = Math.atan2(dy, dx), rr = R4 + 0.7 * lnoise(t, D8, 16, ang * 1.6 + 10, 3) + (dy > 0 ? -0.6 : 0);
    const d = Math.hypot(dx, dy) / rr;
    if (d > 1) return 0;
    return d < 0.42 ? C5[6] : d < 0.68 ? C5[5] : d < 0.88 ? C5[4] : C5[3];
  });
  const look2 = Math.round(clamp(S.vx / 60, -1, 1)), blink = wrap(t, D8) > 2.2 && wrap(t, D8) < 2.28;
  for (const s of [-1, 1]) {
    const ex = Math.round(X) + s * 2 - (s > 0 ? 0 : 1) + look2, ey = Math.round(Y) - 1;
    if (blink) p.px(ex, ey + 1, C5[1]), p.px(ex + 1, ey + 1, C5[1]);
    else {
      for (let k = 0; k < 3; k++) p.px(ex, ey + k, C5[1]), p.px(ex + 1, ey + k, C5[1]);
      p.px(ex + (look2 > 0 ? 1 : 0), ey, C5[6]);
    }
  }
  p.px(Math.round(X) + look2, Math.round(Y) + 3, C5[2]);
  p.px(Math.round(X) - 1 + look2, Math.round(Y) + 3, C5[2]);
  const sw = SWARM3.begin(t);
  sw.ps.sparks = [C5[6], C5[5], C5[4], C5[3]];
  cycle(t, D8, 26, o.seed * 7 + 2, (r) => r.range(0.8, 1.6), (age, L4, r) => {
    const S0 = at2(wrap(t - age, D8), o.hover), s = r.next() * 100, [x, y] = fly(S0.x + r.range(-5, 5), S0.y - r.range(4, 12), r.range(-20, 20), -r.range(20, 45), age, -15, 1.6);
    sw.add(P.EMBER, x + Math.sin(age * 2.3 + s) * 3 * Math.min(1, age), y, 0, 0, age, L4, C5[4], r.chance(0.3) ? 2 : 1, 0, s);
  });
  sw.draw(p);
  const fl = 0.85 + 0.15 * lnoise(t, D8, 22, 0, 9);
  p.glow(X + lean * 3, Y - 6, 46 * fl, C5[4], 0.38);
  p.glow(X, Y - 1, 13, C5[5], 0.35 * fl);
}
function drawBack4(p, time, o) {
  const t = shift(time, D8, o.seed), C5 = fit(o.palette, 7), S = at2(t, o.hover), near = clamp(1 - (-S.y - 24) / 30);
  shadow(p, S.x, 0, 7, 1.2, C5[0], 0.4);
  for (let x = -24; x <= 24; x += 6) p.glow(S.x + x, -1, 16, C5[4], (0.08 + 0.1 * near) * (1 - Math.abs(x) / 32));
}

// ../pixelfx/src/fx/critters/ghost.js
var ghost_exports = {};
__export(ghost_exports, {
  draw: () => draw6,
  drawBack: () => drawBack5,
  meta: () => meta9
});
var meta9 = {
  name: "Ghost",
  desc: "A sheet ghost bobs over the floor: its scalloped hem ripples and trails its drift, little arms flutter, it glances about and blinks, motes trickle off its hem.",
  tags: ["critter", "ghost", "spirit", "undead", "spooky", "float", "loop"],
  size: [96, 100],
  origin: [48, 90],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#10142a", "#232c52", "#3e4f86", "#6b84bb", "#a3b8e2", "#d8e4ff", "#ffffff"], hover: 14, seed: 1 }
};
var D9 = meta9.duration;
var GRID5 = new Grid(-20, -40, 40, 46);
var R = 10.5;
function at3(t, hover) {
  const a = t / D9 * TAU;
  return { x: 4 * Math.sin(a), y: -hover - 3 * Math.sin(2 * a + 0.8) };
}
function halfW2(h) {
  const top = 2 * R + 9;
  if (h > top || h < -1) return -1;
  if (h > top - R) return Math.sqrt(Math.max(0, R * R - (h - (top - R)) ** 2));
  return lerp(R + 2.2, R, (h / (top - R)) ** 0.7);
}
function sheet(g, C5, t, o, lagX) {
  g.clear();
  const top = 2 * R + 9, ph = t / D9 * TAU * 2, NL2 = 4, HW = R + 2.2, LW = 2 * HW / NL2;
  const off = (h) => lagX * (1 - clamp(h / top)) ** 1.4;
  const lobe = (X) => {
    const j = clamp(Math.floor((X + HW) / LW), 0, NL2 - 1), c = -HW + (j + 0.5) * LW, u = (X - c) / (LW / 2);
    return { j, u, d: (2.2 + 1.1 * Math.sin(ph - j * 1.5)) * Math.sqrt(Math.max(0, 1 - u * u)) };
  };
  const inside2 = (x, y) => {
    const h = -y, X = x - off(h);
    if (h < 0 && -h > lobe(X).d) return false;
    const hw = halfW2(Math.max(0, h));
    return hw >= 0 && Math.abs(X) <= hw;
  };
  const arm = (x, y) => {
    for (const s of [-1, 1]) {
      const ax = s * (R + 1.2) + off(13), ay = -13 + 1.6 * Math.sin(ph + s * 1.3);
      if (((x - ax) / 3) ** 2 + ((y - ay) / 2.2) ** 2 <= 1) return true;
    }
    return false;
  };
  const any = (x, y) => inside2(x, y) || arm(x, y);
  const lx = -9, ly = -top - 1;
  const lit = (x, y, k) => any(lx + (x - lx) / k, ly + (y - ly) / k);
  g.shade(-19, -top - 2, 19, 5, (x, y, o2) => {
    if (!any(x, y)) return 0;
    const h = -y, X = x - off(h);
    let i = lit(x, y, 0.62) ? 5 : 4;
    if (!any(x + 2.4, y + 1.8)) i = 3;
    if (!any(x + 1.2, y + 1) && X > 2) i = 2;
    if (h > top - R - 2 && X < 1 && !any(x - 1.5, y - 1.5) && any(x - 0.6, y - 0.6)) i = 6;
    if (h < 1) {
      const L4 = lobe(X);
      if (L4.u > 0.1 || -h > L4.d - 1.2) i = Math.min(i, 3);
    }
    if (h < 7 && h >= -0.5) {
      for (let j = 1; j < NL2; j++) {
        const cx = -HW + j * LW + 0.6 * Math.sin(ph - j), w = (7 - h) * 0.09;
        if (Math.abs(X - cx) <= w + 0.3) i = Math.min(i, 3);
        else if (cx - X > w + 0.3 && cx - X < w + 1.3 && i === 4) i = 5;
      }
    }
    o2.a = h < 2 ? 0.86 : 0.95;
    return C5[i];
  });
  return { inside: inside2, off, top };
}
function draw6(p, time, o) {
  const t = shift(time, D9, o.seed), C5 = fit(o.palette, 7), S = at3(t, o.hover), lagX = at3(t - 0.3, o.hover).x - S.x;
  const g = GRID5;
  const sh = sheet(g, C5, t, o, lagX), top = sh.top;
  const look2 = wrap(t, D9) < 0.7 ? 0 : wrap(t, D9) < 1.3 ? 1 : wrap(t, D9) < 1.9 ? -1 : 0, blink = wrap(t, D9) > 1.95 && wrap(t, D9) < 2.03;
  const ey = -top + R - 1, mo = 0.5 + 0.5 * Math.sin(t / D9 * TAU * 2);
  for (const s of [-1, 1]) {
    const ex = s * 4 - (s > 0 ? 1 : 0) + look2;
    if (blink) g.set(ex, ey + 2, C5[1]), g.set(ex + 1, ey + 2, C5[1]);
    else {
      for (let k = 0; k < 4; k++) g.set(ex, ey + k, C5[0]), g.set(ex + 1, ey + k, C5[0]);
      g.set(ex + (look2 < 0 ? 0 : 1), ey, C5[2]);
    }
  }
  const my = ey + 6;
  g.set(look2 - 1, my, C5[1]);
  g.set(look2, my, C5[1]);
  if (mo > 0.4) g.set(look2 - 1, my + 1, C5[0]), g.set(look2, my + 1, C5[0]);
  g.outline((x, y, nx, ny) => ny > 0 ? C5[2] : C5[1], 0.95);
  g.draw(p, 1, S.x, S.y);
  cycle(t, D9, 12, o.seed * 3 + 1, (r) => r.range(1, 1.7), (age, L4, r, i) => {
    const S0 = at3(wrap(t - age, D9), o.hover), k = age / L4, x0 = S0.x + r.range(-10, 10), y0 = S0.y + 1.5;
    const x = x0 + Math.sin(age * 2.2 + i) * 2.4, y = y0 + r.range(5, 11) * age - 3 * age * age;
    const a = Math.min(1, k * 6) * Math.min(1, (1 - k) * 2.2), tw = 0.6 + 0.4 * Math.sin(age * 8 + i * 1.7);
    p.dot(x, y, tw > 0.8 ? C5[6] : C5[5], a);
    if (r.chance(0.3)) p.dot(x, y - 1, C5[4], a * 0.7);
    p.glow(x, y, 7, C5[4], 0.42 * a * tw);
  });
  p.glow(S.x, S.y - top * 0.55, 54, C5[3], 0.3);
  p.glow(S.x - 3, S.y - top * 0.72, 14, C5[5], 0.12);
}
function drawBack5(p, time, o) {
  const t = shift(time, D9, o.seed), C5 = fit(o.palette, 7), S = at3(t, o.hover), hgt = clamp((-S.y - 8) / 16);
  shadow(p, S.x, 0, 11 - 3 * hgt, 1.6, C5[0], 0.55 - 0.2 * hgt);
  for (let x = -24; x <= 24; x += 6) p.glow(S.x + x, -1, 16, C5[4], 0.14 * (1 - Math.abs(x) / 34) * (1 - 0.4 * hgt));
}

// ../pixelfx/src/fx/critters/eyeball.js
var eyeball_exports = {};
__export(eyeball_exports, {
  draw: () => draw7,
  drawBack: () => drawBack6,
  meta: () => meta10
});
var meta10 = {
  name: "Eyeball",
  desc: "A bloodshot eyeball floats in its fleshy lids: its glowing iris snaps from one look to the next, it blinks, and its nerve sways behind it as it bobs.",
  tags: ["critter", "eyeball", "eye", "monster", "spooky", "float", "loop"],
  size: [96, 108],
  origin: [48, 100],
  duration: 3.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#2a1420", "#6a3040", "#b07078", "#dcbcb4", "#f4e9de", "#ffffff"],
    flesh: ["#1e0c16", "#4a1a2c", "#7c2c40", "#b04a58", "#e07a80"],
    iris: ["#0c2a14", "#1f6a2a", "#3fae3a", "#9be05a", "#e8ffb0"],
    hover: 48,
    seed: 1
  }
};
var D10 = meta10.duration;
var GRID6 = new Grid(-18, -18, 36, 38);
var NERVE = new Grid(-20, -70, 40, 64);
var R2 = 13;
var VEIN = hex("#c42a3a");
var LOOKS2 = [[0, 0, 0], [0.55, 4.2, -1.2], [1.15, -4.4, 0.8], [1.95, 1.2, 3.4], [2.5, -2, -3.4], [3, 0, 0]];
function look(t) {
  let i = LOOKS2.length - 1;
  while (i > 0 && t < LOOKS2[i][0]) i--;
  const [t0, x1, y1] = LOOKS2[i], [, x0, y0] = LOOKS2[(i + LOOKS2.length - 1) % LOOKS2.length], u = ease.outBack(clamp((t - t0) / 0.08), 2.2);
  return [lerp(x0, x1, u), lerp(y0, y1, u)];
}
var lid = (t) => t > 1.74 && t < 1.92 ? Math.sin(Math.PI * ((t - 1.74) / 0.18)) : 0;
function at4(t, hover) {
  const a = t / D10 * TAU;
  return { x: 1.5 * Math.sin(a), y: -hover - 3 * Math.sin(2 * a + 0.4) };
}
function veins(seed) {
  const out = [], r = rng(seed, 77);
  for (let i = 0; i < 7; i++) {
    let a = i / 7 * TAU + r.range(-0.3, 0.3), d = R2 - 0.5;
    const pts = [[Math.cos(a) * d, Math.sin(a) * d]];
    for (let k = 0; k < 4; k++) {
      a += r.range(-0.35, 0.35);
      d -= r.range(1.2, 2.1);
      pts.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    out.push(pts);
  }
  return out;
}
function eye(g, C5, Fl, I, t, seed) {
  g.clear();
  const [lx, ly] = look(t), L4 = lid(t), V = veins(seed);
  const lit = (x, y, k) => Math.hypot(-4 + (x + 4) / k, -4.5 + (y + 4.5) / k) <= R2;
  g.shade(-R2, -R2, R2, R2, (x, y) => {
    const d = Math.hypot(x, y);
    if (d > R2) return 0;
    if (!(Math.hypot(x + 2, y + 2.2) <= R2)) return C5[2];
    return lit(x, y, 0.5) ? C5[5] : lit(x, y, 0.8) ? C5[4] : C5[3];
  });
  for (const pts of V) {
    const sh = pts.map(([x, y]) => [x + lx * 0.35 * (1 - Math.hypot(x, y) / R2), y + ly * 0.35 * (1 - Math.hypot(x, y) / R2)]);
    for (let k = 1; k < sh.length; k++) g.line(sh[k - 1][0], sh[k - 1][1], sh[k][0], sh[k][1], k < 2 ? VEIN : mix(VEIN, C5[3], 0.45));
  }
  const off = Math.hypot(lx, ly), fx = 1 - 0.32 * (Math.abs(lx) / R2) ** 1.4 * 3, fy = 1 - 0.32 * (Math.abs(ly) / R2) ** 1.4 * 3;
  const ir = 6.4, pr = 2 + 0.4 * Math.sin(t / D10 * TAU * 2);
  g.shade(lx - ir - 1, ly - ir - 1, lx + ir + 1, ly + ir + 1, (x, y) => {
    const dx = (x - lx) / (ir * fx), dy = (y - ly) / (ir * fy), d = Math.hypot(dx, dy);
    if (d > 1 || Math.hypot(x, y) > R2 - 0.5) return 0;
    const pd = Math.hypot((x - lx) / fx, (y - ly) / fy);
    if (pd < pr) return C5[0];
    if (d > 0.86) return I[0];
    const ang = Math.atan2(dy, dx), streak = Math.sin(ang * 9 + d * 4) > 0.5;
    if (d < 0.5) return streak ? I[4] : I[3];
    if (d < 0.7) return streak ? I[3] : I[2];
    return streak ? I[2] : I[1];
  });
  if (L4 < 0.5) g.set(-4, -5, C5[5]), g.set(-3, -5, C5[5]), g.set(-4, -4, C5[5]), g.set(1, -2, C5[5]);
  const up = lerp(-R2 + 3, R2 * 0.42, L4), dn = lerp(R2 - 2.2, R2 * 0.42, L4);
  const flit = (x, y, k) => Math.hypot(-4 + (x + 4) / k, -5 + (y + 5) / k) <= R2 + 0.6;
  g.shade(-R2 - 1, -R2 - 1, R2 + 1, R2 + 1, (x, y) => {
    const d = Math.hypot(x, y);
    if (d > R2 + 0.6) return 0;
    const ue = up + 1.8 * (x / R2) ** 2, de = dn - 1.4 * (x / R2) ** 2;
    const tone = !(Math.hypot(x + 2, y + 2.2) <= R2 + 0.6) ? Fl[1] : flit(x, y, 0.55) ? Fl[4] : flit(x, y, 0.85) ? Fl[3] : Fl[2];
    if (y < ue) return y > ue - 1.2 ? Fl[0] : tone;
    if (y > de) return y < de + 1.1 ? Fl[0] : tone === Fl[4] ? Fl[3] : tone;
    return 0;
  });
  g.outline(C5[0]);
}
function draw7(p, time, o) {
  const t = shift(time, D10, o.seed), C5 = fit(o.palette, 6), Fl = fit(o.flesh, 5), I = fit(o.iris, 5), S = at4(t, o.hover);
  const ng = NERVE.clear();
  for (let s = 0; s <= 20; s += 0.5) {
    const B3 = at4(t - s * 0.035, o.hover), sw = 2.6 * (s / 20) ** 1.3 * Math.sin(t / D10 * TAU * 2 - s * 0.16), r = lerp(2, 0.6, s / 20);
    const cx = B3.x + 1 + sw, cy = B3.y + R2 - 2 + s;
    ng.shade(cx - r - 1, cy - 1, cx + r + 1, cy + 1, (x, y) => {
      const v = (x - cx) / Math.max(0.6, r);
      if (Math.abs(v) > 1 || Math.abs(y - cy) > 0.5) return 0;
      return v < -0.35 ? Fl[4] : v < 0.4 ? Fl[3] : Fl[2];
    });
  }
  ng.outline(Fl[0]);
  ng.draw(p);
  const g = GRID6;
  eye(g, C5, Fl, I, t, o.seed);
  g.draw(p, 1, S.x, S.y);
  const [lx, ly] = look(t), snap = Math.max(...LOOKS2.map(([t0]) => Math.max(0, 1 - Math.abs(wrap(t - t0 + D10 / 2, D10) - D10 / 2) / 0.2)));
  const open = 1 - lid(t);
  p.glow(S.x + lx, S.y + ly, 15, I[3], (0.5 + 0.3 * snap) * open);
  p.glow(S.x + lx, S.y + ly, 5, I[4], 0.4 * open);
  p.glow(S.x, S.y, 50, I[1], 0.3);
  for (let i = 0; i < 8; i++) {
    const sp = (i % 2 ? 1 : -1) * (i % 3 ? 1 : 2), a0 = i * TAU / 8, rr = 19 + i % 3 * 2;
    let prev = null;
    for (let k = 5; k >= 0; k--) {
      const a = t / D10 * TAU * sp + a0 - sp * k * 0.035, z = Math.sin(a), x = S.x + Math.cos(a) * rr, y = S.y + z * 5 - Math.cos(a) * 3;
      if (z < 0 && Math.hypot(x - S.x, y - S.y) < R2 + 1) {
        prev = null;
        continue;
      }
      if (prev && k > 0) p.line(prev[0], prev[1], x, y, I[2], 0.4 + (5 - k) * 0.12);
      if (k === 0) p.px(x, y, z > 0 ? I[4] : I[3]), p.glow(x, y, 5, I[3], 0.45);
      prev = [x, y];
    }
  }
}
function drawBack6(p, time, o) {
  const t = shift(time, D10, o.seed), I = fit(o.iris, 5), S = at4(t, o.hover);
  shadow(p, S.x, 0, 10, 1.5, hex("#0d0a12"), 0.5);
  for (let x = -26; x <= 26; x += 6) p.glow(S.x + x, -1, 18, I[2], 0.15 * (1 - Math.abs(x) / 34));
}

// ../pixelfx/src/fx/critters/flying-skull.js
var flying_skull_exports = {};
__export(flying_skull_exports, {
  draw: () => draw8,
  drawBack: () => drawBack7,
  meta: () => meta11
});
var meta11 = {
  name: "Flying skull",
  desc: "A cracked bone skull bobs in the air, jaw chattering, eyes burning, a fire roaring off its crown that sheds flame puffs, embers and smoke and throws warm light.",
  tags: ["critter", "skull", "undead", "fire", "flying", "monster", "loop"],
  size: [96, 132],
  origin: [48, 120],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    bone: ["#1a1114", "#3e2b2a", "#6b5144", "#9e8467", "#cdb892", "#efe2bf", "#fffaea"],
    hover: 40,
    floor: true,
    seed: 1
  }
};
var D11 = meta11.duration;
var GRID7 = new Grid(-14, -20, 28, 40);
var SOCKET = hex("#120a0c");
var SWARM4 = new Swarm();
function at5(t, hover) {
  const a = t / D11 * TAU;
  return {
    x: 3 * Math.sin(a),
    y: -hover + 3 * Math.sin(2 * a + 0.5),
    vx: 3 * TAU * Math.cos(a) / D11,
    vy: 6 * TAU * Math.cos(2 * a + 0.5) / D11
  };
}
function jaw(t) {
  const ch = Math.max(0, Math.sin(t / D11 * TAU * 22)), b1 = burst(t, 0.15, 0.75), b2 = burst(t, 1.3, 1.95);
  const gape = burst(t, 1.95, 2.3);
  return Math.round(Math.max(ch * 2.4 * Math.max(b1, b2), gape * 3.4));
}
var burst = (t, a, b) => t <= a || t >= b ? 0 : Math.sin(Math.PI * ((t - a) / (b - a))) ** 0.5;
var flick = (t) => 0.74 + 0.16 * lnoise(t, D11, 18, 0, 1) + 0.1 * lnoise(t, D11, 46, 0, 2);
var inCranium = (x, y) => (x / 11) ** 2 + ((y + 6) / 10.5) ** 2 <= 1;
var inFace = (x, y) => y >= -3 && y <= 6.5 && Math.abs(x) <= lerp(10.2, 7.2, (y + 3) / 9.5);
var inSkull = (x, y) => inCranium(x, y) || inFace(x, y);
var browY = (x) => -6.6 + (8.5 - Math.abs(x)) * 0.3;
var inSocket = (x, y) => ((Math.abs(x) - 5.1) / 3.3) ** 2 + ((y + 2.9) / 3.3) ** 2 <= 1 && y > browY(x);
var NOSE = [[-1, 1], [0, 1], [-2, 2], [-1, 2], [0, 2], [1, 2], [-2, 3], [1, 3]];
var CRACK = [[4, -16], [4, -15], [5, -14], [5, -13], [4, -12], [5, -11], [6, -10], [6, -9]];
var topY = (x) => -6 - 10.5 * Math.sqrt(Math.max(0, 1 - (x / 11) ** 2));
function skull(g, B3, F, open, t) {
  const warm = mix(B3[6], F[6], 0.45), rim = mix(B3[5], F[5], 0.3);
  const lx = -4, ly = -15, lit = (x, y, k) => inSkull(lx + (x - lx) / k, ly + (y - ly) / k);
  g.clear();
  g.shade(-12, -17, 12, 8, (x, y, o) => {
    if (!inSkull(x, y)) return 0;
    let c = lit(x, y, 0.45) ? B3[5] : lit(x, y, 0.74) ? B3[4] : B3[3];
    if (Math.abs(x) > 8.2 && y > -7 && y < -1) c = x < 0 ? B3[3] : B3[2];
    if (!inSkull(x + 2, y + 2.2) || x > 0 && !inSkull(x + 2.6, y)) c = B3[2];
    if (!inSkull(x + 1, y + 1.2) && y > 2) c = B3[1];
    if (!inSkull(x, y - 1.5)) c = Math.abs(x) < 7 ? warm : rim;
    else if (!inSkull(x, y - 2.5) && Math.abs(x) < 6) c = rim;
    if (y > browY(x) - 1.2 && y < browY(x) + 0.4 && Math.abs(x) > 1.6 && Math.abs(x) < 8.6) c = x < 0 ? B3[4] : B3[3];
    if (Math.abs(x) > 6.2 && Math.abs(x) < 9.2 && y > 0 && y < 2) c = x < 0 ? B3[5] : B3[3];
    if (y > 6) {
      if (Math.abs(x) > 6.4) return 0;
      const cx = Math.floor(x), gap2 = cx === -6 || cx === -3 || cx === 2 || cx === 5;
      c = gap2 ? B3[1] : y < 7 ? x < 0 ? B3[5] : B3[4] : cx === -1 || cx === 0 ? B3[3] : B3[4];
    }
    return c;
  });
  g.shade(-9, -7, 9, 1, (x, y) => {
    if (!inSocket(x, y)) return 0;
    if (!inSocket(x, y + 1.3)) return mix(B3[2], F[4], 0.55);
    return SOCKET;
  });
  for (const [x, y] of NOSE) g.set(x, y, y === 3 ? B3[1] : SOCKET);
  g.set(-1, 3, B3[2]);
  g.set(0, 3, B3[2]);
  for (const [x, y] of CRACK) g.set(x, y, B3[1]), g.set(x - 1, y, B3[5]);
  g.set(7, -7, B3[1]);
  g.set(8, -6, B3[1]);
  const jy = 8 + open;
  g.shade(-8, 4, 8, jy + 6, (x, y) => {
    const ax = Math.abs(x);
    if (ax > 6.6 && ax < 8.1 && y > 4 && y < jy + 2) return x < 0 ? B3[3] : B3[2];
    if (y < jy || y > jy + 5.5) return 0;
    const v = y - jy, hw = 7.4 - v * 0.45 - (v > 4 ? (v - 4) * 1.2 : 0);
    if (ax > hw) return 0;
    if (v < 1.5) {
      if (ax > 6) return x < 0 ? B3[4] : B3[3];
      const cx = Math.floor(x), gap2 = cx === -5 || cx === -2 || cx === 1 || cx === 4;
      return gap2 ? B3[1] : v < 1 ? B3[5] : B3[4];
    }
    return !inJaw(x + 1.6, y + 1.6, jy) ? B3[1] : v < 2.5 ? x < 0 ? B3[4] : B3[3] : B3[3];
  });
  if (open > 0) for (let y = 8; y < jy; y++) for (let x = -6; x <= 5; x++) g.set(x, y, y === jy - 1 ? mix(SOCKET, F[3], 0.5) : SOCKET);
  g.outline((x, y, nx, ny) => ny < 0 ? mix(B3[0], F[1], 0.75) : B3[0]);
}
function inJaw(x, y, jy) {
  const v = y - jy, hw = 7.4 - v * 0.45 - (v > 4 ? (v - 4) * 1.2 : 0);
  return v >= 0 && v <= 5.5 && Math.abs(x) <= hw;
}
function crown(seed) {
  const out = [];
  for (let x = -10; x <= 10; x += 2) out.push({ x, h: 13 + 13 * (1 - (x / 11) ** 2), w: 2.3 + rand(x + 20, seed, 3) * 0.8, n: 37 + x * 3 + seed * 11, front: false });
  for (const s of [-1, 1]) out.push({ x: s * 11, y: -5, h: 10, w: 1.8, n: 61 + s * 13 + seed * 5, front: false });
  for (let x = -5; x <= 5; x += 2.5) out.push({ x, h: 5 + 3 * rand(x * 4 + 20, seed, 5), w: 1.6, n: 91 + x * 5 + seed * 7, front: true });
  return out;
}
function height(f, t, k) {
  const leap = Math.max(0, lnoise(t, D11, 6, f.n * 3.1, 70) - 0.55) * 1.6;
  return (f.h + 0.25 * f.h * lnoise(t, D11, 8, f.n * 1.7, 5) + f.h * leap) * (0.9 + 0.1 * k);
}
function draw8(p, time, o) {
  const t = shift(time, D11, o.seed), F = fit(o.palette, 9), heat2 = [...F].reverse(), B3 = fit(o.bone, 7);
  const S = at5(t, o.hover), k = flick(t), lean = clamp(-S.vx / 60, -0.8, 0.8), stretch = clamp(S.vy / 90, -0.3, 0.45);
  const tongues = crown(o.seed).sort((a, b) => Math.abs(b.x) - Math.abs(a.x));
  const X = Math.round(S.x), Y = Math.round(S.y);
  const lick = (f) => lnoise(t, D11, 5, f.n, 40) * 2 + lean * height(f, t, k) * 0.9 - clamp(f.x * 0.25, -2, 2);
  for (let li = 0; li < 4; li++)
    for (const f of tongues) if (!f.front) tongue(p, X + f.x, Y + (f.y ?? topY(f.x) + 3), height(f, t, k) * (1 + stretch), f.w * (1 - 0.25 * Math.abs(lean)), lick(f), t, D11, f.n, heat2, li);
  particles(p, t, o, heat2, F, true);
  const g = GRID7;
  skull(g, B3, F, jaw(t), t);
  g.draw(p, 1, X, Y);
  for (const s of [-1, 1]) {
    const ex = X + s * 5.1 - 0.5, ey = Y - 2.4, fl = 0.75 + 0.25 * lnoise(t, D11, 30, s * 9, 12);
    p.px(ex, ey, heat2[0]);
    p.px(ex + 1, ey, heat2[1]);
    p.px(ex, ey + 1, heat2[2]);
    p.px(ex + 1, ey + 1, heat2[3]);
    if (fl > 0.8) p.px(ex, ey - 1, heat2[3]), p.px(ex + 1, ey - 1, heat2[5]);
    p.glow(ex + 1, ey + 1, 6, F[5], 0.45 * fl);
    p.glow(ex + 1, ey + 0.5, 3, F[7], 0.5 * fl);
  }
  const open = jaw(t);
  if (open > 0) p.glow(X, Y + 8 + open * 0.5, 4 + open * 2, F[5], 0.25 * open);
  for (let i = 0; i < 9; i++) {
    const r = rng(o.seed, i, 21), born = 1.98 + i * 0.03, age = wrap(t - born, D11), L4 = r.range(0.25, 0.45);
    if (age >= L4) continue;
    const S0 = at5(born, o.hover), [x, y] = fly(S0.x + r.range(-3, 3), S0.y + 11, r.range(-22, 22), r.range(40, 75), age, -70, 3.5);
    firePuff(p, x, y, 1 - age / L4, r.range(1.1, 2), r.next() * 100, heat2);
  }
  for (let li = 0; li < 4; li++)
    for (const f of tongues) if (f.front) tongue(p, X + f.x, Y + topY(f.x) + 1.5, height(f, t, k) * (1 + stretch), f.w, lick(f) * 0.6, t, D11, f.n, heat2, li);
  particles(p, t, o, heat2, F, false);
  const br = 0.92 + 0.08 * Math.sin(t / D11 * TAU * 2);
  p.glow(X + lean * 4, Y - 20, 74 * br * (0.9 + 0.1 * k), mix(F[4], F[5], 0.5), 0.48 * k);
  p.glow(X, Y - 21, 24, F[6], 0.3 * k);
  p.glow(X, Y - 15, 9, F[8], 0.16 * k);
}
function particles(p, t, o, heat2, F, back) {
  const sw = SWARM4.begin(t);
  sw.ps.sparks = [F[7], F[6], F[4], F[2]];
  if (back) {
    cycle(t, D11, 15, o.seed * 7 + 1, (r) => r.range(1.7, 2.5), (age, L4, r) => {
      const S0 = at5(wrap(t - age, D11), o.hover), x0 = S0.x + r.range(-6, 6), y0 = S0.y - 22 - r.range(0, 8);
      const [x, y] = fly(x0, y0, r.range(-5, 5), -r.range(16, 26), age, -12, 1.2);
      sw.add(P.SMOKE, x + Math.sin(age * 1.3 + r.next() * 6) * 3 * age, y, 0, 0, age, L4, mix(hex("#5b5566"), F[2], 0.3), r.range(2.8, 4.4), PF.BIG);
    });
    sw.draw(p);
    return;
  }
  cycle(t, D11, 40, o.seed * 7 + 2, (r) => r.range(0.18, 0.36), (age, L4, r) => {
    const S0 = at5(wrap(t - age, D11), o.hover), side = r.chance(0.3), a = side ? r.sign() * r.range(0.9, 1.45) : r.range(-0.8, 0.8);
    const x0 = S0.x + Math.sin(a) * 10.5, y0 = S0.y - 6 - Math.cos(a) * 10 - (side ? 0 : r.range(2, 10));
    const [x, y] = fly(x0, y0, r.range(-6, 6) + Math.sin(a) * 6, -r.range(18, 34), age, -95, 3.2);
    firePuff(p, x + Math.sin(age * 17 + r.next() * 6) * 0.8, y, 1 - age / L4, r.range(1, 2.2), r.next() * 100, heat2);
  });
  cycle(t, D11, 18, o.seed * 7 + 3, 0.26, (age, L4, r) => {
    const S0 = at5(wrap(t - age, D11), o.hover), fx = r.range(-10, 10), x0 = S0.x + fx, y0 = S0.y + topY(fx) - r.range(4, 16) * (1 - Math.abs(fx) / 14);
    const kk = 1 - age / L4, x = x0 + r.range(-3, 3) * age, y = y0 - r.range(12, 20) * age, rr = r.range(0.9, 1.7) * (0.4 + 0.6 * kk);
    p.circle(x, y, rr + 0.6, kk > 0.5 ? heat2[5] : heat2[6]);
    if (kk > 0.35) p.circle(x, y - 0.3, rr * 0.6, kk > 0.7 ? heat2[2] : heat2[4]);
  });
  cycle(t, D11, 24, o.seed * 7 + 4, (r) => r.range(1, 2.4), (age, L4, r) => {
    const S0 = at5(wrap(t - age, D11), o.hover), x0 = S0.x + r.range(-11, 11), y0 = S0.y - r.range(6, 24), s = r.next() * 100;
    const [x, y] = fly(x0, y0, r.range(-22, 22), -r.range(25, 70), age, -20, 1.6);
    sw.add(P.EMBER, x + Math.sin(age * 2.3 + s) * 4 * Math.min(1, age), y, 0, 0, age, L4, F[4], r.chance(0.3) ? 2 : 1, 0, s);
  });
  if (o.floor)
    cycle(t, D11, 5, o.seed * 7 + 5, (r) => r.range(0.9, 1.4), (age, L4, r) => {
      const S0 = at5(wrap(t - age, D11), o.hover), b = bounce(S0.x + r.range(-6, 6), S0.y - r.range(10, 18), r.range(-28, 28), -r.range(50, 110), age, 430, -0.5, 0.42);
      sw.add(P.SPARK, b.x, b.y, b.rest ? 0.1 : b.vx, b.rest ? 0 : b.vy, age, L4, 0, 1, 0, r.next() * 100);
    });
  sw.draw(p);
}
function drawBack7(p, time, o) {
  if (!o.floor) return;
  const t = shift(time, D11, o.seed), F = fit(o.palette, 9), S = at5(t, o.hover), k = flick(t);
  shadow(p, S.x, 0, 9, 1.6, hex("#0d0a12"), 0.6);
  for (let x = -30; x <= 30; x += 6) p.glow(S.x + x, -1, 20, mix(F[4], F[5], 0.5), 0.15 * k * (1 - Math.abs(x) / 40));
}

// ../pixelfx/src/fx/melee/sword-slash.js
var sword_slash_exports = {};
__export(sword_slash_exports, {
  act: () => act,
  create: () => create4,
  meta: () => meta12
});
var meta12 = {
  name: "Sword slash",
  desc: "A tilted crescent whips round in two frames, cools from white to deep blue as it trails off, glints at the tip and throws sparks.",
  tags: ["melee", "slash", "sword", "combat", "directional", "one-shot"],
  size: [136, 104],
  origin: [44, 92],
  duration: 0.75,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#b8c9e8", "#e8f1ff", "#ffffff"],
    sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
    radius: 42,
    seed: 2
  }
};
var GUARD = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
var WIND = { ...GUARD, x: -8, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
var CUT = { ...GUARD, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -10, ghost: 1 };
var DOWN = { ...GUARD, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true };
var act = {
  target: { x: 58 },
  poses: [
    [-0.55, { ...GUARD, x: -8 }],
    [-0.3, WIND],
    [-0.08, { ...WIND, crouch: 5, lean: -5 }],
    [0, CUT, "snap"],
    [0.06, DOWN, "snap"],
    [0.3, { ...DOWN, x: 3, crouch: 6 }],
    [0.58, { ...GUARD, x: 1, crouch: 3, fx: 15, fy: -21, sa: 0.1, bx: -5, by: -21, ffx: 9, fbx: -7 }],
    [0.86, { ...GUARD, x: -8 }]
  ],
  hits: [{ t: 0.06, stop: 0.14, shake: 0.18, amp: 2, push: 2.8, straw: 18 }],
  dust: [{ t: 0.06, x: 16, n: 7, dir: 1 }, { t: 0.06, x: -11, n: 4, dir: -1 }]
};
function onArc(s, r, a) {
  const lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy, c = Math.cos(s.rot), n = Math.sin(s.rot);
  return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
}
function crescent(p, s, ta, L4, W7, age) {
  if (Math.abs(L4) < 0.02 || W7 < 0.3) return;
  const R4 = s.ramp, n = R4.length, dir = Math.sign(L4), span = Math.abs(L4), c = Math.cos(s.rot), sn = Math.sin(s.rot), B3 = s.R + 2;
  p.shade(s.cx - B3, s.cy - B3, s.cx + B3, s.cy + B3, (x, y, out) => {
    const dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * sn, ly = (-dx * sn + dy * c) / s.sy, r = Math.hypot(lx, ly);
    if (r > s.R + 0.5 || r < s.R - W7 - 1) return;
    let u = dir * (Math.atan2(ly, lx) - ta) % TAU;
    if (u < 0) u += TAU;
    if (u > span) return;
    const v = u / span, w = W7 * Math.pow(Math.sin(Math.PI * Math.pow(v, 2.2)), 0.6);
    if (w < 0.35) return;
    const q = (s.R - r) / w;
    if (q < 0 || q > 1) return;
    const ci = q < 0.22 && age < 0.5 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4);
    out.c = R4[n - 1 - clamp(ci, 0, n - 1)];
    out.a = Math.min(1, v / 0.4);
  });
  for (let u = 0; u <= span; u += 0.3) {
    const [x, y] = onArc(s, s.R - W7 * 0.4, ta + dir * u);
    p.glow(x, y, 5 + W7, R4[n - 3], 0.22 * (1 - age) * (u / span));
  }
}
function drawSlash(p, s, t) {
  const u = t - s.t0;
  if (u < 0) return;
  const span = s.a1 - s.a0, head4 = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, s.sweep + s.hold + s.trail, u);
  const age = clamp(u / (s.sweep + s.hold + s.trail));
  if (tail < 1) crescent(p, s, s.a0 + span * tail, span * (head4 - tail), s.W * (1 - tail * 0.55), age);
  const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
  if (tail > 0.02 && th > 0)
    for (let k = 0; k <= tail; k += 0.6 / (Math.abs(span) * s.R)) {
      const [x, y] = onArc(s, s.R - 0.5, s.a0 + span * k);
      p.dot(x, y, s.ramp[1], th * (0.4 + 0.6 * k));
    }
}
function tipOf(s) {
  const [x, y] = onArc(s, s.R - s.W * 0.3, s.a1), [x2, y2] = onArc(s, s.R - s.W * 0.3, s.a1 + Math.sign(s.a1 - s.a0) * 0.05);
  const l = Math.hypot(x2 - x, y2 - y) || 1;
  return { x, y, dx: (x2 - x) / l, dy: (y2 - y) / l };
}
function create4(o) {
  const C5 = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks });
  const R02 = o.radius, a0 = -2.55, a1 = 0.95;
  const A2 = { cx: 6, cy: -26, R: R02, sy: 0.6, rot: -0.38, a0, a1, W: 12, t0: 0, sweep: 0.06, hold: 0.06, trail: 0.24, ramp: C5 };
  const E = { ...A2, R: R02 * (33 / 42), W: R02 * (4.5 / 42), a0: a0 + (a1 - a0) * 0.1, a1: a1 - (a1 - a0) * (0.15 / 3.5), t0: 0.017, hold: 0.03, trail: 0.2, ramp: C5.slice(0, 6) };
  const tip = tipOf(A2);
  let t = 0, landed = false;
  return {
    update(dt) {
      t += dt;
      if (!landed && t >= A2.sweep) {
        landed = true;
        for (let i = 0; i < 10; i++) {
          const a = Math.atan2(tip.dy, tip.dx) + Rg.range(-0.5, 0.5), sp = Rg.range(150, 400);
          ps.spawn(P.SPARK, tip.x, tip.y, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.35));
        }
        for (let i = 0; i < 16; i++) {
          const a = a0 + (a1 - a0) * Rg.range(0.3, 1), [x, y] = onArc(A2, A2.R, a);
          const ox = x - A2.cx, oy = y - A2.cy, l = Math.hypot(ox, oy) || 1, sp = Rg.range(30, 100);
          ps.spawn(P.MOTE, x, y, ox / l * sp, oy / l * sp - 10, Rg.range(0.25, 0.55), C5[4 + Rg.int(0, 1)], 0.6);
        }
      }
      ps.update(dt);
    },
    draw(p) {
      drawSlash(p, E, t);
      drawSlash(p, A2, t);
      const g = t - A2.sweep * 0.6;
      if (g > 0 && g < 0.22) sparkle(p, tip.x, tip.y, 9 * ease.outBack(Math.min(1, g / 0.05)) * (1 - g / 0.22), C5[5], C5[3], 0.6);
      if (t < 0.3) {
        const [x, y] = onArc(A2, A2.R - 4, A2.a0 + (A2.a1 - A2.a0) * ease.outExpo(clamp(t / A2.sweep)));
        p.glow(x, y, 40, C5[3], 0.5 * (1 - t / 0.3));
      }
      ps.draw(p);
    }
  };
}

// ../pixelfx/src/fx/melee/double-slash.js
var double_slash_exports = {};
__export(double_slash_exports, {
  act: () => act2,
  create: () => create5,
  meta: () => meta13
});

// ../pixelfx/src/fx/melee/_lib.js
var swing = (o) => ({ cx: 0, cy: 0, R: 30, sy: 1, rot: 0, a0: 0, dir: 1, k: 0, ...o });
function through(x, y, th, dir, R4, span, at8 = 0.55, extra = {}) {
  const a = th - dir * Math.PI / 2;
  return swing({ cx: x - Math.cos(a) * R4, cy: y - Math.sin(a) * R4, R: R4, sy: 1, rot: 0, a0: a - dir * span * at8, dir, span, ...extra });
}
function onSwing(s, r, u) {
  const a = s.a0 + s.dir * u, lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy - s.k * (s.R - r), c = Math.cos(s.rot), n = Math.sin(s.rot);
  return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
}
function travel(s, u) {
  const [x0, y0] = onSwing(s, s.R, u), [x1, y1] = onSwing(s, s.R, u + 0.01), l = Math.hypot(x1 - x0, y1 - y0) || 1;
  return { x: x0, y: y0, dx: (x1 - x0) / l, dy: (y1 - y0) / l, a: s.a0 + s.dir * u };
}
function plane(s, x, y) {
  const c = Math.cos(s.rot), n = Math.sin(s.rot), dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * n, ly = -dx * n + dy * c;
  if (!s.k) return [Math.hypot(lx, ly / s.sy), Math.atan2(ly / s.sy, lx)];
  const m = ly + s.k * s.R, A2 = s.sy * s.sy - s.k * s.k, B3 = 2 * m * s.k, Cc = lx * lx * s.sy * s.sy + m * m;
  const r = (-B3 + Math.sqrt(B3 * B3 + 4 * A2 * Cc)) / (2 * A2);
  return [r, Math.atan2((m - s.k * r) / s.sy, lx)];
}
function smear(p, s, u0, u1, wMax, fn, half = 0, pad = 1) {
  if (u1 - u0 < 5e-3) return;
  const c = Math.cos(s.rot), n = Math.sin(s.rot), A2 = s.R + pad + 1, Bn = A2 * s.sy + s.k * (wMax + 2);
  const hx = Math.hypot(A2 * c, Bn * n) + 1, hy = Math.hypot(A2 * n, Bn * c) + 1, rIn = s.R - wMax - 1;
  const over = Math.abs(n) * A2 + s.k * (wMax + 2) + 2, y0 = half > 0 ? s.cy - over : s.cy - hy, y1 = half < 0 ? s.cy + over : s.cy + hy;
  p.shade(s.cx - hx, y0, s.cx + hx, y1, (x, y, out) => {
    const [r, a] = plane(s, x, y);
    if (r > s.R + pad || r < rIn) return;
    if (half && (Math.sin(a) < 0 ? -1 : 1) !== half) return;
    let u = s.dir * (a - s.a0) % TAU;
    if (u < 0) u += TAU;
    while (u < u0) u += TAU;
    if (u > u1) return;
    return fn(u, r, out, a);
  });
}
function trace(p, s, r, u0, u1, c, a, half = 0, step = 0.6) {
  const du = step / Math.max(4, r);
  for (let u = u0; u <= u1; u += du) {
    const g = s.a0 + s.dir * u;
    if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
    const [x, y] = onSwing(s, r, u), k = typeof a === "function" ? a(u) : a;
    if (k > 0) p.dot(x, y, typeof c === "function" ? c(u) : c, k);
  }
}
function glowAlong(p, s, r, u0, u1, rad2, c, k, half = 0, step = 0.35) {
  for (let u = u0; u <= u1; u += step) {
    const g = s.a0 + s.dir * u;
    if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
    const [x, y] = onSwing(s, r, u), kk = typeof k === "function" ? k(u) : k;
    if (kk > 4e-3) p.glow(x, y, rad2, c, kk);
  }
}
function slash(p, s, t, half = 0) {
  const u = t - s.t0;
  if (u < 0) return;
  const R4 = s.ramp, n = R4.length, life = s.sweep + s.hold + s.trail, hot = s.hot ?? 0;
  const head4 = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, life, u), age = clamp(u / life);
  const U = s.span * head4, T4 = s.span * tail, W7 = s.W * (1 - tail * 0.55);
  if (tail < 1 && U - T4 > 0.01) {
    smear(p, s, T4, U, W7, (uu, r, out) => {
      const v = (uu - T4) / (U - T4), w = W7 * Math.pow(Math.sin(Math.PI * Math.pow(v, s.lens ? 1 : 2.2)), s.lens ? 0.75 : 0.6);
      if (w < 0.35) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      const ci = q < 0.22 && age < 0.5 || q < hot * 0.7 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4 - hot * 3);
      out.c = R4[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / (s.lens ? 0.1 : 0.4));
    }, half);
    glowAlong(p, s, s.R - W7 * 0.4, T4, U, 5 + W7, R4[n - 3], (uu) => (0.22 + hot * 0.3) * (1 - age) * ((uu - T4) / (U - T4)), half, 0.3);
  }
  const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
  if (tail > 0.02 && th > 0) trace(p, s, s.R - 0.5, 0, T4, R4[2], (uu) => th * (0.4 + 0.6 * uu / s.span), half);
}
var slashEnd = (s) => travel({ ...s, R: s.R - s.W * 0.3 }, s.span);
function shavings(ps, R4, s, n, colors, from = 0.3) {
  for (let i = 0; i < n; i++) {
    const [x, y] = onSwing(s, s.R, s.span * R4.range(from, 1)), ox = x - s.cx, oy = y - s.cy, l = Math.hypot(ox, oy) || 1, sp = R4.range(30, 100);
    ps.spawn(P.MOTE, x, y, ox / l * sp, Math.min(25, oy / l * sp) - 10, R4.range(0.25, 0.55), R4.pick(colors), 0.6);
  }
}
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3), dark: scale(c, 0.42) };
}
var OUTLINE = hex("#1a1422");
function rock2(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}
function cracks(R4, x0, n, reach, depth = 7, bias = 0.3) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const side = R4.chance(0.5 + bias * 0.5) ? 1 : -1, L4 = reach * R4.range(0.45, 1) * (i < 2 ? 1 : 0.7), pts = [[x0 + side * R4.range(0, 1.5), 0]];
    let x = pts[0][0], y = 0;
    while (Math.abs(x - x0) < L4 && y < depth) {
      x += side * R4.range(1.5, 3.5);
      y = Math.min(depth, Math.max(0, y + R4.range(-0.6, 1.6) * (Math.abs(x - x0) > 3 ? 1 : 0.3)));
      pts.push([Math.round(x), Math.round(y)]);
      if (R4.chance(0.18) && pts.length > 3 && y < depth - 2) {
        const f = [[Math.round(x), Math.round(y)]];
        let fx = x, fy = y;
        for (let j = R4.int(1, 3); j > 0; j--) fx += side * R4.range(1, 3), fy += R4.range(0.8, 2), f.push([Math.round(fx), Math.round(Math.min(depth + 1, fy))]);
        out.push({ pts: f, at: Math.abs(x - x0) / reach, fork: true });
      }
    }
    out.push({ pts, at: 0, fork: false });
  }
  return out;
}
function star(p, x, y, spikes2, sc, th, core, body2, inner, rim) {
  for (const pass of [0, 1, 2])
    for (const s of spikes2) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), L4 = s.len * sc;
      for (let d = 0; d <= L4; d += 0.5) {
        const hw0 = s.w * th * (1 - d / L4) * Math.min(1, 0.5 + d / 3), hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
        if (pass === 2 && d > L4 * 0.55) break;
        for (let o = -hw; o <= hw; o += 0.5) p.px(x + c * d - sn * o, y + sn * d + c * o, pass === 0 ? rim : pass === 1 ? d < L4 * 0.35 ? inner : body2 : core);
      }
    }
  const r = 2.4 * sc * Math.sqrt(th);
  p.circle(x, y, r + 0.8, inner);
  p.circle(x, y, r, core);
}
function sliver(p, x, y, a, r, arc, c, k) {
  const n = Math.ceil(r * arc * 2.2);
  for (let j = 0; j <= n; j++) {
    const u = j / n - 0.5, th = a + u * arc, w = 1.4 * (1 - Math.abs(u) * 2);
    for (let o = -w * 0.5; o <= w * 0.5 + 0.01; o += 0.5) p.dot(x + Math.cos(th) * (r + o), y + Math.sin(th) * (r + o), c, k);
  }
}
function along2(pts, len2, fn) {
  let d = 0;
  for (let i = 1; i < pts.length && d < len2; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0), f = Math.min(1, (len2 - d) / l);
    fn(x0, y0, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, d);
    d += l;
  }
}

// ../pixelfx/src/fx/melee/double-slash.js
var meta13 = {
  name: "Double slash",
  desc: "A down cut, then an up cut that crosses it: the moment the X closes both strokes flash white, the crossing bursts with light and sparks, and a dotted X lingers.",
  tags: ["melee", "slash", "combo", "sword", "cross", "combat", "directional", "one-shot"],
  size: [164, 108],
  origin: [44, 92],
  duration: 0.8,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#2a0a22", "#5e1238", "#a01f4e", "#e0386a", "#ff86a6", "#ffd2dd", "#ffffff"],
    sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
    seed: 6
  }
};
var STANCE = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
var HIGH = { ...STANCE, x: -7, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
var LOW = { ...STANCE, x: 3, crouch: 6, lean: 6, fx: 22, fy: -20, sa: 0.62, bx: -8, by: -24, ffx: 13, fbx: -10, toeB: true };
var act2 = {
  target: { x: 62 },
  poses: [
    [-0.42, { ...STANCE, x: -7 }],
    [-0.18, HIGH],
    [-0.04, { ...HIGH, crouch: 5 }],
    [0, { ...STANCE, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -9, ghost: 1 }, "snap"],
    [0.06, LOW, "snap"],
    [0.14, { ...LOW, x: 4, crouch: 6, lean: 5, fx: 20, fy: -17, sa: 0.85, ghost: 1 }],
    [0.17, { ...LOW, x: 5, crouch: 3, lean: 5, fx: 22, fy: -28, sa: 0.1, by: -18, toeB: true, ghost: 1 }, "snap"],
    [0.21, { ...LOW, x: 6, crouch: 1, lean: 6, fx: 19, fy: -37, sa: -0.95, by: -18, ffx: 13, fby: -6 }, "snap"],
    [0.5, { ...LOW, x: 6, crouch: 3, lean: 3, fx: 18, fy: -36, sa: -1.05, by: -19, ffx: 12 }],
    [0.92, { ...STANCE, x: -7 }]
  ],
  hits: [
    { t: 0.06, stop: 0.05, shake: 0.08, amp: 1, push: 1.4, straw: 8 },
    { t: 0.16, stop: 0.14, shake: 0.2, amp: 2, push: 2.8, straw: 18, y: -28 }
  ],
  dust: [{ t: 0.06, x: 16, n: 5, dir: 1 }, { t: 0.17, x: -8, n: 4, dir: -1 }]
};
var UP = 0.14;
var R0 = 62;
var cut = (x, y, th, dir, span, extra) => through(x, y, th, dir, R0, span, 0.55, extra);
function create5(o) {
  const C5 = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks }), lights = new Lights();
  const X = 34, Y = -23;
  const down = cut(X, Y, 0.72, 1, 0.84, { W: 10, t0: 0, sweep: 0.06, hold: 0.07, trail: 0.24, ramp: C5, lens: true });
  const up = cut(X, Y, -0.66, -1, 0.84, { W: 11, t0: UP, sweep: 0.06, hold: 0.06, trail: 0.26, ramp: C5, lens: true });
  const ends = [slashEnd(down), slashEnd(up)], slivers = [-2.4, -1.1, 0.2, 1.6].map((a) => ({ a: a + Rg.range(-0.2, 0.2), r: Rg.range(5, 8), v: Rg.range(70, 120), arc: Rg.range(0.4, 0.7) }));
  const CLOSE = UP + 0.012;
  let t = 0, cut1 = false, cut2 = false, closed = false;
  return {
    update(dt) {
      t += dt;
      if (!cut1 && t >= down.sweep) {
        cut1 = true;
        shavings(ps, Rg, down, 10, [C5[4], C5[5]]);
        for (let i = 0; i < 6; i++) {
          const a = Math.atan2(ends[0].dy, ends[0].dx) + Rg.range(-0.5, 0.5), sp = Rg.range(120, 300);
          ps.spawn(P.SPARK, ends[0].x, ends[0].y, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.3));
        }
      }
      if (!closed && t >= CLOSE) {
        closed = true;
        lights.add(X, Y, 56, C5[3], 0.45, 0.4);
        lights.add(X, Y, 18, WHITE, 0.6, 0.08);
        for (let i = 0; i < 18; i++) {
          const a = Rg.range(-Math.PI, Math.PI) * 0.8, sp = Rg.range(140, 360);
          ps.spawn(P.SPARK, X, Y, Math.cos(a) * sp, Math.sin(a) * sp - 40, Rg.range(0.14, 0.4));
        }
        for (let i = 0; i < 5; i++) ps.spawn(P.STAR, X + Rg.range(-14, 14), Y + Rg.range(-12, 12), 0, -4, Rg.range(0.2, 0.4), Rg.chance(0.5) ? C5[5] : WHITE, Rg.range(1, 2.2), Rg.range(0.05, 0.2));
      }
      if (!cut2 && t >= UP + up.sweep) {
        cut2 = true;
        shavings(ps, Rg, up, 12, [C5[4], C5[5]]);
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const flash = t >= CLOSE && t < CLOSE + 0.07 ? 1 : 0;
      down.hot = up.hot = flash;
      slash(p, down, t);
      slash(p, up, t);
      for (const [s, e] of [[down, ends[0]], [up, ends[1]]]) {
        const g = t - s.t0 - s.sweep * 0.6;
        if (g > 0 && g < 0.2) sparkle(p, e.x, e.y, 7 * ease.outBack(Math.min(1, g / 0.05)) * (1 - g / 0.2), C5[5], C5[3], 0.5);
      }
      const q = t - CLOSE;
      if (q >= 0 && q < 0.26) {
        const k = q / 0.26;
        flare(p, X, Y, 22 * Math.pow(1 - k, 1.4), 1 - k, C5);
        p.glow(X, Y, 34, C5[4], 0.35 * (1 - k));
      }
      if (q >= 0.03 && q < 0.15) {
        const k = (q - 0.03) / 0.12;
        for (const s of slivers) sliver(p, X, Y, s.a, s.r + s.v * (q - 0.03), s.arc * (1 - 0.4 * k), k < 0.4 ? C5[6] : k < 0.7 ? C5[5] : C5[4], 1 - k);
      }
      for (const s of [down, up]) {
        const u = t - s.t0;
        if (u <= 0 || u >= 0.25) continue;
        const e = slashEnd({ ...s, span: s.span * ease.outExpo(clamp(u / s.sweep)) });
        p.glow(e.x, e.y, 40, C5[3], 0.5 * (1 - u / 0.25));
      }
      ps.draw(p);
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/melee/heavy-cleave.js
var heavy_cleave_exports = {};
__export(heavy_cleave_exports, {
  act: () => act3,
  create: () => create6,
  meta: () => meta14
});
var meta14 = {
  name: "Heavy cleave",
  desc: "A glint over the head, then a thick ember arc accelerates over the top into the floor: a white slam, glowing cracks, dust rolling both ways, grit and rising embers.",
  tags: ["melee", "slash", "cleave", "axe", "heavy", "ground", "fire", "combat", "directional", "one-shot"],
  size: [208, 116],
  origin: [68, 96],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#2a0c10", "#5c1414", "#a3241a", "#e0481c", "#ff8a2a", "#ffc23d", "#fff0a0", "#ffffff"],
    stone: "#4a3f69",
    seed: 5
  }
};
var REST_ = { ...READY, weapon: "greatsword", two: true, sa: -1, fx: 11, fy: -21 };
var OVER = { ...REST_, x: -4, crouch: 2, lean: -2, fx: 1, fy: -42, sa: -2.45, ffx: 8, fbx: -7 };
var FLOOR2 = { ...REST_, x: 0, crouch: 7, lean: 6, fx: 17, fy: -21, sa: 0.72, ffx: 11, fbx: -10, toeB: true };
var act3 = {
  target: { x: 66 },
  poses: [
    [-0.42, { ...REST_, x: -4 }],
    [-0.3, { ...REST_, x: -3, crouch: 4, fx: 13, fy: -29, sa: -1.3 }],
    [-0.12, { ...OVER, crouch: 4 }],
    [0.2, { ...OVER, crouch: 3 }],
    [0.27, { ...REST_, x: -1, y: -2, crouch: 0, lean: 2, fx: 11, fy: -42, sa: -1.45, ffx: 10, ghost: 1 }, "snap"],
    [0.31, { ...REST_, x: 0, y: -1, crouch: 3, lean: 4, fx: 18, fy: -33, sa: -0.45, ffx: 12, ghost: 1 }, "snap"],
    [0.335, FLOOR2, "snap"],
    [0.85, { ...FLOOR2, crouch: 6, lean: 5 }],
    [1.3, { ...REST_, x: -2, crouch: 4, lean: 2, fx: 15, fy: -23, sa: 0.1 }],
    [1.7, { ...REST_, x: -4 }]
  ],
  hits: [{ t: 0.335, stop: 0.2, shake: 0.34, amp: 3, push: 3.2, straw: 28, y: -8 }],
  dust: [{ t: 0.335, x: 18, n: 8, dir: 1 }, { t: 0.335, x: -12, n: 5, dir: -1 }]
};
var RAISE = 0.2;
var SWING = 0.135;
var HIT = RAISE + SWING;
var HOLD = 0.05;
var TRAIL = 0.22;
var head = (t) => ease.inQuad(clamp((t - RAISE) / SWING));
var passedAt = (f) => RAISE + SWING * Math.sqrt(clamp(f));
function create6(o) {
  const C5 = fit(o.palette, 8), n = C5.length, R4 = new Rng(o.seed), st = stone(o.stone), floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [C5[6], C5[5], C5[4], C5[3]] }), bits = new Bits({ ground: floor }), lights = new Lights();
  const A2 = swing({ cx: 3, cy: -22, R: 37, sy: 0.88, rot: 0.32, a0: -2.45, dir: 1 });
  let U1 = 0;
  while (onSwing(A2, A2.R, U1)[1] < -0.5 && U1 < 4) U1 += 5e-3;
  const E = { ...A2, R: A2.R * 0.76 }, W7 = 16, WE = 5;
  const [X] = onSwing(A2, A2.R - 2, U1), GLINT = onSwing(A2, A2.R - 3, 0);
  const lines = cracks(R4, X, 4, 40, 7, 0.4);
  const spikes2 = [-Math.PI, -2.7, -2.15, -1.62, -1.05, -0.45, 0].map((a, i) => ({ a: a + R4.range(-0.08, 0.08), len: (i === 0 || i === 6 ? 20 : i === 3 ? 15 : 9) + R4.range(0, 4), w: 1.6 + R4.range(0, 0.6) }));
  const shards = [-2.5, -1.9, -1.2, -0.6].map((a) => ({ a: a + R4.range(-0.15, 0.15), r: 8 + R4.range(0, 3), v: R4.range(80, 130), arc: R4.range(0.35, 0.6) }));
  let t = 0, hit = false;
  const arc = (p, s, w0, lag, rim) => {
    const tt = t - lag, U = U1 * head(tt), T4 = U1 * smooth(HIT + HOLD, HIT + HOLD + TRAIL, tt);
    if (U < 0.02 || T4 >= U - 0.02) return;
    const gone = smooth(HIT + HOLD, HIT + HOLD + TRAIL, tt), shrink = 1 - 0.75 * gone;
    smear(p, s, T4, U, w0, (u, r, out) => {
      const age = Math.max(0, tt - passedAt(u / U1)), v = (u - T4) / (U - T4);
      const w = w0 * shrink * Math.pow(Math.sin(Math.PI * Math.pow(v, 2.2)), 0.6);
      if (w < 0.4) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      const ci = rim && q < 0.22 && age < 0.12 ? 0 : Math.round(q * (n - 1) * 0.62 + age * 7 + Math.max(0, tt - HIT) * 10 - v * 0.8 + (rim ? 0.7 : 1.7));
      out.c = C5[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / 0.35) * (1.2 - gone);
    });
    if (rim) glowAlong(p, s, s.R - w0 * 0.4, T4, U, 7 + w0 * 0.5, C5[4], (u) => 0.26 * Math.exp(-Math.max(0, tt - passedAt(u / U1)) / 0.2) * ((u - T4) / (U - T4)));
  };
  return {
    update(dt) {
      t += dt;
      if (t < RAISE - 0.04 && R4.chance(0.35)) {
        const a = R4.range(0, TAU), D17 = R4.range(14, 26), T4 = R4.range(0.14, 0.2), v = D17 * 3 / (Math.exp(3 * T4) - 1);
        ps.spawn(P.STREAK, GLINT[0] + Math.cos(a) * D17, GLINT[1] + Math.sin(a) * D17, -Math.cos(a) * v, -Math.sin(a) * v, T4, R4.chance(0.5) ? C5[5] : C5[4]);
      }
      if (t > RAISE && t < HIT && R4.chance(0.7)) {
        const u = U1 * head(t) * R4.range(0.6, 1), [x, y] = onSwing(A2, A2.R - R4.range(0, 6), u);
        ps.spawn(P.EMBER, x, y, R4.range(-20, 20), R4.range(-40, -10), R4.range(0.5, 1.1), C5[4], R4.range(1, 2));
      }
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(X, -6, 26, WHITE, 0.9, 0.1);
        lights.add(X, -12, 64, C5[4], 0.5, 0.8);
        for (let i = 0; i < 26; i++) {
          const a = -Math.PI / 2 + R4.range(-1.2, 1.35), sp = R4.range(140, 360);
          ps.spawn(P.SPARK, X, -1, Math.cos(a) * sp, Math.sin(a) * sp - 40, R4.range(0.15, 0.5));
        }
        for (let i = 0; i < 20; i++) {
          const s = i % 2 ? -1 : 1;
          ps.spawn(P.SMOKE, X + s * R4.range(0, 8), -R4.range(2, 6), s * R4.range(45, 135), -R4.range(2, 12), R4.range(1, 1.45), st.dust, R4.range(5, 8.5), R4.range(0, 0.07), PF.BIG);
        }
        for (let i = 0; i < 4; i++) ps.spawn(P.SMOKE, X + R4.range(-4, 4), -R4.range(3, 8), R4.range(-15, 15), -R4.range(40, 90), R4.range(1, 1.45), st.dust, R4.range(4, 6.5), R4.range(0.02, 0.1), PF.BIG);
        for (let i = 0; i < 8; i++) ps.spawn(P.DUST, X + R4.range(-4, 4), -R4.range(1, 4), R4.range(-60, 60), -R4.range(8, 30), R4.range(0.35, 0.7), st.dust, R4.range(2, 3.5));
        for (let i = 0; i < 44; i++) {
          const a = -Math.PI / 2 + R4.range(-0.7, 1), sp = R4.range(60, 230);
          ps.spawn(P.GRIT, X + R4.range(-3, 3), -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1, 1.5), R4.pick([st.light, st.body, st.body, st.shade]), R4.chance(0.35) ? 2 : 1);
        }
        for (let i = 0; i < 6; i++)
          bits.add({ kind: B.CHUNK, x: X + R4.range(-3, 3), y: -2, vx: R4.range(-50, 110), vy: -R4.range(120, 260), g: 1, drag: 0.4, bounce: 0.3, life: R4.range(1.15, 1.5), a: R4.range(0, TAU), va: R4.range(-14, 14), s: R4.int(1, 2) });
        for (let i = 0; i < 16; i++) ps.spawn(P.EMBER, X + R4.range(-8, 8), -R4.range(1, 6), R4.range(-50, 60), -R4.range(30, 110), R4.range(0.7, 1.5), C5[4], R4.range(1, 2));
      }
      if (hit && t < HIT + 0.6 && R4.chance(0.12)) {
        const c = R4.pick(lines), pt = R4.pick(c.pts);
        ps.spawn(P.EMBER, pt[0], pt[1] - 1, R4.range(-12, 12), -R4.range(20, 50), R4.range(0.5, 0.9), C5[4], 1);
      }
      bits.update(dt);
      for (const b of bits.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 2; i++) ps.spawn(P.DUST, b.x + R4.range(-1.5, 1.5), -0.5, R4.sign() * R4.range(8, 30), -R4.range(2, 12), R4.range(0.3, 0.6), st.dust, R4.range(1.3, 2.4));
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const q = t - HIT;
      if (q >= 0) {
        const fade = 1 - smooth(1, 1.5, q);
        for (let y = 0; y <= 2; y++)
          for (let x = -9; x <= 9; x++) {
            const d = Math.hypot((x + 0.5) / 9, (y + 0.5) / 3.5);
            if (d > 1) continue;
            const T4 = Math.pow(clamp(1 - q / 0.8), 1.4) * (1.2 - d) - rand(x, y, 3) * 0.3;
            if (T4 > 0.08) p.dot(X + x, y, C5[clamp(Math.round(T4 * 9), 1, 7)], fade);
            else p.dot(X + x, y, d < 0.5 ? st.dark : st.shade, (d < 0.9 - rand(x, y, 9) * 0.3 ? 1 : 1 - d) * fade);
          }
        const k = q / 0.45;
        if (k < 1) band(p, X, 0.5, 6 + 46 * ease.outCubic(k), 0.16, Math.max(1, 3 * (1 - k)), 1.15 - k, [st.body, st.light, C5[4], C5[6]], (g) => Math.sin(g) < 0);
      }
      ps.draw(p, "back");
    },
    draw(p) {
      const q = t - HIT;
      if (t < RAISE + 0.03) {
        const g = ease.outBack(clamp(t / 0.1)) * (1 + 0.15 * Math.sin(t * 60)) * (t > RAISE ? 1 - (t - RAISE) / 0.03 : 1);
        sparkle(p, GLINT[0], GLINT[1], 1 + 7 * g, C5[6], C5[4], 0.5);
        p.glow(GLINT[0], GLINT[1], 22, C5[4], 0.3 * g);
      }
      if (q >= 0) {
        const heat2 = Math.pow(clamp(1 - q / 1.2), 1.2), fade = 1 - smooth(1.15, 1.5, q);
        for (const c of lines) {
          const reach = 40 * ease.outCubic(clamp((q - c.at * 0.1) / 0.13)) * (c.fork ? 0.3 : 1);
          if (reach <= 0) continue;
          along2(c.pts, reach, (x0, y0, x1, y1, d) => {
            const h = heat2 * (1 - d / 46) - (c.fork ? 0.12 : 0), col = h > 0.72 ? WHITE : h > 0.08 ? C5[clamp(Math.round(h * 8), 1, 6)] : st.dark;
            if (y1 > 0.5) p.line(x0 + 1, y0, x1 + 1, y1, st.dark, fade);
            p.line(x0, y0, x1, y1, col, fade);
            if (h > 0.25 && (d | 0) % 6 < 2) p.glow(x1, y1, 6, C5[4], 0.2 * h * fade);
          });
        }
        if (heat2 > 0) p.glow(X, -2, 34, C5[4], 0.32 * heat2 * fade);
        const k = q / 0.45;
        if (k < 1) band(p, X, 0.5, 6 + 46 * ease.outCubic(k), 0.16, Math.max(1, 3 * (1 - k)), 1.15 - k, [st.body, st.light, C5[4], C5[6]], (g) => Math.sin(g) >= 0);
      }
      arc(p, E, WE, 0.02, false);
      arc(p, A2, W7, 0, true);
      const tail = U1 * smooth(HIT + HOLD, HIT + HOLD + TRAIL, t), th = 0.8 * (1 - clamp((t - HIT - HOLD) / (TRAIL + 0.25)));
      if (tail > 0.02 && th > 0) trace(p, A2, A2.R - 0.5, 0, tail, C5[3], (u) => th * (0.4 + 0.6 * u / U1));
      if (t > RAISE && t < HIT + 0.05) {
        const [x, y] = onSwing(A2, A2.R - 5, U1 * head(t));
        p.glow(x, y, 40, C5[4], 0.5);
      }
      if (q >= 0 && q < 0.035) star(p, X, -1, spikes2, 1, 1, WHITE, C5[6], C5[7], C5[5]);
      else if (q >= 0.035 && q < 0.07) star(p, X, -1, spikes2, 1.25, 0.55, C5[7], C5[6], C5[6], C5[4]);
      if (q >= 0.05 && q < 0.16) {
        const k = (q - 0.05) / 0.11;
        for (const s of shards) sliver(p, X, -1, s.a, s.r + s.v * (q - 0.05), s.arc * (1 - 0.4 * k), k < 0.4 ? C5[6] : k < 0.7 ? C5[5] : C5[4], 1 - k);
      }
      if (q >= 0 && q < 0.2) {
        const pop = Math.exp(-q / 0.05);
        p.glow(X, -6, 30, C5[5], 0.8 * pop);
        p.glow(X, -2, 10, WHITE, 0.7 * pop);
      }
      for (const b of bits.list) rock2(p, b, st);
      ps.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/melee/scythe-reap.js
var scythe_reap_exports = {};
__export(scythe_reap_exports, {
  act: () => act4,
  create: () => create7,
  meta: () => meta15
});
var meta15 = {
  name: "Scythe reap",
  desc: "A slow, huge dark crescent reaps round the front with a pale ghostly edge; it hangs, then tears away from the tail into curling wisps and cold vapour.",
  tags: ["melee", "scythe", "reap", "dark", "ghost", "death", "slash", "combat", "one-shot"],
  size: [184, 116],
  origin: [84, 98],
  duration: 2.1,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#07040c", "#140a22", "#24113a", "#3b1d58", "#5a3a82", "#7fd6c0", "#d8fff2", "#ffffff"],
    seed: 13
  }
};
var REST_2 = { ...READY, weapon: "scythe", x: 2, sa: -1.5, fx: 11, fy: -22, bx: 7, by: -16 };
var OUT_ = { ...REST_2, two: true, crouch: 4, lean: 4, fx: 17, fy: -27, sa: -0.45, ffx: 11, fbx: -8 };
var END = { ...REST_2, two: true, x: 0, yaw: 3.14, crouch: 6, lean: 4, fx: 15, fy: -24, sa: 0.3, ffx: 11, fbx: -10, toeB: true };
var act4 = {
  target: { x: 66 },
  poses: [
    [-0.56, REST_2],
    [-0.26, OUT_],
    [0.08, { ...OUT_, crouch: 5 }],
    [0.2, { ...OUT_, yaw: 0.8, crouch: 5, lean: 3, fx: 16, fy: -23, sa: 0.1, ghost: 1 }],
    [0.3, { ...OUT_, x: 1, yaw: 1.9, crouch: 6, lean: 3, fx: 15, fy: -23, sa: 0.2, ghost: 1 }],
    [0.42, END],
    [0.92, { ...END, crouch: 5 }],
    [1.3, { ...REST_2, x: 1, yaw: 1.4, crouch: 4 }],
    [1.7, REST_2]
  ],
  hits: [{ t: 0.14, stop: 0.12, shake: 0.16, amp: 2, push: 2.4, straw: 20, skin: "shadow" }],
  dust: [{ t: 0.3, x: 2, n: 6 }]
};
var WIND2 = 0.08;
var SWEEP = 0.34;
var HANG = 0.14;
var TEAR = 0.55;
var T0 = WIND2;
var T1 = WIND2 + SWEEP;
var T2 = T1 + HANG;
var T3 = T2 + TEAR;
var head2 = (t) => ease.inOutSine(clamp((t - T0) / SWEEP));
function create7(o) {
  const C5 = fit(o.palette, 8), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, haze: C5[5] }), lights = new Lights();
  const A2 = swing({ cx: 8, cy: -33, R: 52, sy: 0.6, k: 0.1, rot: 0.08, a0: -0.5, dir: 1, span: 3.5 });
  const W7 = 21;
  const wisps = [];
  let t = 0, lastTear = 0;
  const tear = () => smooth(T2, T3, t);
  const addWisp = (x, y, far) => wisps.push({ x, y, vx: Rg.range(-12, 12), vy: -Rg.range(8, 26), life: Rg.range(0.5, 0.9), max: 0, seed: Rg.range(0, 100), pts: [], far });
  return {
    update(dt) {
      t += dt;
      if (t < WIND2 && Rg.chance(0.5)) {
        const [x, y] = onSwing(A2, A2.R - 4, 0);
        ps.spawn(P.VAPOUR, x + Rg.range(-14, 14), y + Rg.range(-8, 8), Rg.range(-10, 10), Rg.range(-6, 6), Rg.range(0.3, 0.5), C5[5], Rg.range(1.5, 2.5));
      }
      if (t > T0 && t < T1 && Rg.chance(0.5)) {
        const tr = travel(A2, A2.span * head2(t) * Rg.range(0.75, 1));
        ps.spawn(P.VAPOUR, tr.x, tr.y, tr.dx * 20, -Rg.range(4, 14), Rg.range(0.5, 0.9), C5[6], Rg.range(2, 3.5), 0, Math.sin(tr.a) < 0 ? PF.BACK : 0);
      }
      const k = tear();
      for (let u = lastTear; u < k * 1.15; u += 0.022) {
        const uu = Math.min(1, u) * A2.span, tr = travel({ ...A2, R: A2.R - Rg.range(0, 8) }, uu), far = Math.sin(tr.a) < 0;
        addWisp(tr.x, tr.y, far);
        if (Rg.chance(0.5)) ps.spawn(P.VAPOUR, tr.x, tr.y, Rg.range(-10, 10), -Rg.range(6, 18), Rg.range(0.55, 0.85), Rg.chance(0.5) ? C5[5] : C5[4], Rg.range(2.5, 4.5), 0, far ? PF.BACK : 0);
        if (Rg.chance(0.2)) ps.spawn(P.STAR, tr.x + Rg.range(-3, 3), tr.y + Rg.range(-3, 3), 0, -6, Rg.range(0.25, 0.5), Rg.chance(0.5) ? C5[6] : WHITE, Rg.range(0.6, 1.6), 0, far ? PF.BACK : 0);
      }
      lastTear = Math.max(lastTear, k * 1.15);
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i];
        w.max += dt;
        if (w.max > w.life) {
          wisps.splice(i, 1);
          continue;
        }
        w.vy -= 30 * dt;
        w.vx += Math.sin(w.max * 9 + w.seed) * 120 * dt;
        w.vx -= w.vx * 2 * dt;
        w.vy -= w.vy * 1.2 * dt;
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        w.pts.push([w.x, w.y]);
        if (w.pts.length > 14) w.pts.shift();
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      this.blade(p, -1);
      ps.draw(p, "back");
      this.threads(p, true);
    },
    draw(p) {
      this.blade(p, 1);
      if (t < WIND2 + 0.05) {
        const [x, y] = onSwing(A2, A2.R - 3, 0);
        sparkle(p, x, y, 6 * Math.min(1, t / 0.04) * (1 - smooth(WIND2 - 0.02, WIND2 + 0.05, t)), C5[6], C5[5], 0.45);
      }
      const g = t - T1 + 0.06;
      if (g > 0 && g < 0.3) {
        const [x, y] = onSwing(A2, A2.R - 3, A2.span);
        sparkle(p, x, y, 9 * ease.outBack(Math.min(1, g / 0.06)) * (1 - g / 0.3), C5[6], C5[5], 0.55);
      }
      ps.draw(p, "front");
      this.threads(p, false);
      lights.draw(p);
    },
    blade(p, half) {
      const U = A2.span * head2(t), k = tear();
      if (U < 0.02 || k >= 1) return;
      const ramp2 = half < 0 ? [C5[0], C5[0], C5[1], C5[2], C5[3], C5[4], C5[5], C5[6]] : C5;
      smear(p, A2, 0, U, W7, (u, r, out, a) => {
        const v = u / U, w = W7 * Math.pow(Math.sin(Math.PI * Math.pow(v, 1.7)), 0.55);
        if (w < 0.5) return;
        const q = (A2.R - r) / w;
        if (q < 0 || q > 1) return;
        const n = rand(Math.floor(u * 40), Math.floor(r), 7);
        if (k > 0 && u / A2.span < k * 1.2 - n * 0.2) return;
        const ci = q < 0.08 ? 7 : q < 0.16 ? 6 : q < 0.25 ? 5 : q < 0.4 ? 4 : q < 0.62 ? 3 : 2;
        out.c = ramp2[t > T1 && q < 0.2 ? ci - 1 : ci];
        out.a = Math.min(1, v / 0.25);
      }, half);
      glowAlong(p, A2, A2.R - 2, Math.max(0, k * 1.2 * A2.span - 0.3), U, 14, C5[5], (u) => 0.3 * (u / U), half, 0.25);
    },
    threads(p, back) {
      for (const w of wisps) {
        if (w.far !== back) continue;
        const life = 1 - w.max / w.life;
        for (let i = 1; i < w.pts.length; i++) {
          const f = i / w.pts.length;
          p.line(w.pts[i - 1][0], w.pts[i - 1][1], w.pts[i][0], w.pts[i][1], f > 0.75 ? C5[6] : f > 0.4 ? C5[5] : C5[3], life * (0.3 + 0.7 * f));
        }
        if (life > 0.5) p.glow(w.x, w.y, 5, C5[5], 0.25 * life);
      }
    }
  };
}

// ../pixelfx/src/fx/fire/fireball.js
var fireball_exports = {};
__export(fireball_exports, {
  draw: () => draw9,
  meta: () => meta16
});

// ../pixelfx/src/fx/fire/_lib.js
function pnoise(x, period, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = rand(wrap(i, period), seed), b = rand(wrap(i + 1, period), seed);
  return (a + (b - a) * u) * 2 - 1;
}
function noiseFor(D17) {
  if (!D17) return (tt, rate, seed = 0, off = 0) => noise(tt * rate + off, seed);
  return (tt, rate, seed = 0, off = 0) => {
    const P3 = Math.max(1, Math.round(rate * D17));
    return pnoise(tt / D17 * P3 + off, P3, seed);
  };
}
function looped(t, D17, count, seed, make, draw26) {
  for (let i = 0; i < count; i++) {
    const r = rng(seed, i), born = r.next() * D17, q = make(r, i);
    for (let age = wrap(t - born, D17); age < q.life; age += D17) draw26(q, age, i);
  }
}
var hotFirst = (F) => [...F].reverse();
var LAYERS2 = [[1, 1, 6], [0.76, 0.86, 4], [0.54, 0.68, 2], [0.3, 0.42, 0]];
function flameBlade(p, x, y, ux, uy, len2, w, bend2, N5, n, H4, layers = LAYERS2, jit = 0.5, wob = 1.1) {
  if (len2 < 1) return;
  const nx = -uy, ny = ux;
  for (const [lw, lh, ri] of layers) {
    const L4 = len2 * lh, c = H4[ri];
    for (let r = 0; r <= L4; r += 0.5) {
      const u = r / Math.max(1, L4);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N5(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const off = bend2 * u * u * lh + N5(4, n + 7, r * 0.2) * u * wob, cx = x + ux * r + nx * off, cy = y + uy * r + ny * off;
      for (let q = -half; q <= half; q += 0.5) p.px(cx + nx * q, cy + ny * q, c);
    }
  }
}
function solid(p, x, y, r, c) {
  if (r < 0.6) return p.px(x, y, c);
  const cx = p.toX(x, y), cy = p.toY(x, y), r2 = r * r;
  for (let sy = Math.floor(cy - r); sy <= Math.ceil(cy + r); sy++) {
    const dy = sy + 0.5 - cy, s2 = r2 - dy * dy;
    if (s2 < 0) continue;
    const s = Math.sqrt(s2);
    for (let sx = Math.ceil(cx - s - 0.5); sx <= Math.floor(cx + s - 0.5); sx++) p.put(sx, sy, c, 1);
  }
}
function soft(p, x, y, r, c, a) {
  if (a <= 4e-3) return;
  if (r < 0.5) return p.blend(x, y, c, a);
  const cx = p.toX(x, y), cy = p.toY(x, y), r2 = r * r;
  for (let sy = Math.floor(cy - r); sy <= Math.ceil(cy + r); sy++) {
    const dy = sy + 0.5 - cy, s2 = r2 - dy * dy;
    if (s2 < 0) continue;
    const s = Math.sqrt(s2);
    for (let sx = Math.ceil(cx - s - 0.5); sx <= Math.floor(cx + s - 0.5); sx++) p.blendPx(sx, sy, c, a);
  }
}
function firePuff2(p, x, y, k, size, frac, H4, glowK = 0.18, tx = 0, ty = -1) {
  const age = 1 - k, n = H4.length, heat2 = Math.min(0.999, Math.pow(age, 0.62) + frac * 0.1);
  const idx = Math.min(n - 2, Math.floor(heat2 * (n - 1)));
  const r = size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = H4[idx];
  if (idx >= n - 2) return soft(p, x, y, r, c, Math.min(1, k * 3) * 0.85);
  solid(p, x, y, r, H4[Math.min(n - 1, idx + 2)]);
  if (r > 1.6 && ty > -0.99) solid(p, x + tx * r * 1.5, y + ty * r * 1.5, r * 0.3, H4[Math.min(n - 1, idx + 1)]);
  solid(p, x - r * 0.16, y - r * 0.22, r * 0.78, c);
  if (r > 1.6) solid(p, x + tx * r * 0.9, y + ty * r * 0.9, r * 0.42, c);
  if (idx <= 3 && r > 1.8) solid(p, x - r * 0.28, y - r * 0.34, r * 0.36, H4[Math.max(0, idx - 1)]);
  if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, glowK * k);
}
var rampAt2 = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];
function smokePuff(p, x, y, k, size, col = 0, big = false, aMul = 1) {
  const age = 1 - k;
  const r = size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
  const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58) * aMul;
  const c = col ? mix(col, rampAt2(SMOKE_RAMP, age), age) : rampAt2(SMOKE_RAMP, age * 1.05);
  soft(p, x, y, r, c, a * 0.45);
  soft(p, x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
  if (age < 0.5) soft(p, x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
}
function ember(p, x, y, k, size, cols, ph) {
  if (k < 0.25 && Math.sin(ph) < 0) return;
  const c = k > 0.6 ? cols[0] : k > 0.3 ? cols[1] : cols[2];
  if (size >= 2) {
    const rim = k > 0.45 ? cols[2] : cols[3];
    p.px(x - 1, y, rim), p.px(x + 1, y, rim), p.px(x, y - 1, rim), p.px(x, y + 1, rim);
    p.px(x, y, c);
    p.glow(x, y, 8, c, 0.4 * k);
    return;
  }
  p.px(x, y, c);
  if (size > 1.4) p.px(x, y + 1, cols[3]);
  p.glow(x, y, 3 + size, c, 0.35 * k);
}
function spark(p, x, y, vx, vy, k, cols) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len2 = Math.min(9, 1 + sp * 0.022);
  const head4 = k > 0.6 ? cols[0] : k > 0.3 ? cols[1] : cols[2];
  p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.4, y - uy * len2 * 0.4, k > 0.5 ? head4 : cols[cols.length - 1]);
  p.line(x - ux * len2 * 0.45, y - uy * len2 * 0.45, x, y, head4);
  p.glow(x, y, 3, head4, 0.45 * k);
}
function along3(x, v, a, k, t) {
  if (k <= 0) return [x + v * t + 0.5 * a * t * t, v + a * t];
  const e = Math.exp(-k * t), vt = a / k;
  return [x + vt * t + (v - vt) * (1 - e) / k, vt + (v - vt) * e];
}
function drift(x, y, vx, vy, t, ax, ay, kx, ky) {
  const X = along3(x, vx, ax, kx, t), Y = along3(y, vy, ay, ky, t);
  return [X[0], Y[0], X[1], Y[1]];
}
function floorLight(p, x, y, rx, ry, c, k) {
  if (k <= 4e-3 || rx < 1 || ry < 0.5) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}
function simDraw(p, ps, H4, layer) {
  const all = ps.list, rest = [], fire = [];
  for (const q of all) (q.k === P.FIRE ? fire : rest).push(q);
  const puffs = (back) => {
    for (const q of fire) if (q.delay <= 0 && !!(q.flag & PF.BACK) === back) firePuff2(p, q.x, q.y, q.life / q.max, q.size, q.seed % 1, H4);
  };
  ps.list = rest;
  if (layer !== "front") ps.draw(p, "back"), puffs(true);
  if (layer !== "back") puffs(false), ps.draw(p, "front");
  ps.list = all;
}
var SMOKE1 = hex("#5b5566");

// ../pixelfx/src/fx/fire/fireball.js
var meta16 = {
  name: "Fireball",
  desc: "A fireball flying right: a churning white-hot head with a corona of flame, a long torn tail of flame puffs cooling into smoke, embers shed behind.",
  tags: ["fire", "fireball", "projectile", "magic", "directional", "loop"],
  size: [136, 56],
  origin: [112, 28],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    radius: 5,
    speed: 120,
    seed: 5
  }
};
var D12 = meta16.duration;
var NL = noiseFor(D12);
var SMOKE12 = hex("#5b5566");
var BODY = [[30, 4.2, 0], [23, 4.4, -1.6], [22, 4.4, 1.6], [15, 4.6, 0]];
var CORONA = [[-1.3, 6, 1.1], [-1.8, 8, 1.2], [-2.3, 7, 1.1], [1.3, 6, 1.1], [1.8, 8, 1.2], [2.3, 7, 1.1]];
function head3(p, H4, t, R02, S, hx, hy) {
  const ph = t / D12;
  p.shade(hx - R02 * 2.4, hy - R02 * 1.7, hx + R02 * 1.5, hy + R02 * 1.7, (x, y, out) => {
    x -= hx;
    y -= hy;
    const d = Math.hypot(x, y), th = Math.atan2(y, x), back = Math.max(0, -Math.cos(th)), a = th / TAU;
    const bump = 0.55 * pnoise(a * 9 + ph * 9, 9, S) + 0.35 * pnoise(a * 5 - ph * 10, 5, S + 1);
    const rim = R02 * (1 + 0.55 * back * back) + bump;
    if (d > rim) return;
    const swirl = pnoise(a * 5 - ph * 10 + d * 0.45, 5, S + 2);
    const h = 1 - d / rim + 0.26 * swirl + 0.1 * (1 - back);
    if (rim - d < 1 && back < 0.3) return h > 0.3 ? H4[3] : H4[5];
    return h > 0.74 ? H4[0] : h > 0.58 ? H4[1] : h > 0.42 ? H4[2] : h > 0.27 ? H4[4] : h > 0.13 ? H4[5] : H4[6];
  });
}
function draw9(p, t, o) {
  const F = fit(o.palette, 9), H4 = hotFirst(F), S = o.seed, R02 = o.radius, V = o.speed;
  const N5 = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  const GLOW = mix(mix(H4[3], H4[4], 0.5), WHITE, 0.25), SMOKE = mix(SMOKE12, H4[6], 0.3), SPARKS = [H4[1], H4[2], H4[4], H4[5]], EMB = [H4[1], H4[2], H4[4], H4[6]];
  const hx = N5(3, S + 50) * 0.5, hy = N5(2.5, S + 51) * 0.7;
  const fire = [], smoke2 = [];
  looped(t, D12, 130, S + 100, (r) => {
    const fl2 = r.range(0.22, 0.55), sm = r.chance(0.55), x = -r.range(2, 24);
    return { x, y: r.range(-1, 1) * (R02 - 0.1 * -x), v: V * r.range(0.3, 0.6), vy: r.range(-16, 16), fl: fl2, sm, sl: r.range(0.25, 0.45), s: r.range(1.3, 2.9), f: r.next() * 0.5 + 0.5 * (-x / 24), life: fl2 + (sm ? 0.45 : 0) };
  }, (q, age) => {
    const ta = Math.min(age, q.fl), [wx, y, wvx, vy] = drift(0, q.y, q.v, q.vy, ta, 0, -70, 4.5, 3);
    const x = q.x + wx - V * ta;
    if (age < q.fl) return fire.push([age, x, y, q]);
    if (!q.sm || age - q.fl > q.sl) return;
    const sa = age - q.fl, [sx, sy] = drift(x, y, wvx - V, vy * 0.6 - 6, sa, V * 2, -30, 2, 1.2);
    smoke2.push([sa, sx, sy, q]);
  });
  for (const [sa, x, y, q] of smoke2) smokePuff(p, x, y, 1 - sa / q.sl, q.s * 0.9, SMOKE);
  fire.sort((a, b) => b[0] - a[0]);
  for (const [age, x, y, q] of fire) {
    const u = age / q.fl;
    firePuff2(p, x, y, 1 - u, q.s * (1 + 1.3 * u), q.f, H4, 0.07, -0.86, -0.5);
  }
  BODY.forEach(([len2, w, dy], i) => {
    const n = (S * 5 + i) * 17, L4 = len2 * (0.82 + 0.25 * N5(4, n)) * (1 + 0.3 * Math.max(0, N5(2.4, n + 3)));
    flameBlade(p, hx + 1, hy + dy * 0.5, -1, dy * 0.02, L4, w * R02 / 5, N5(3, n + 5) * 3 + dy, N5, n, H4, LAYERS2, 0.5, 1.1 + L4 * 0.05);
  });
  CORONA.forEach(([a, len2, w], i) => {
    const n = (S * 5 + i + 20) * 17, L4 = len2 * (0.7 + 0.4 * (0.5 + 0.5 * N5(6, n))), ox = Math.cos(a) * R02 * 0.85, oy = Math.sin(a) * R02 * 0.85;
    const dx = Math.cos(a) * 0.55 - 1, dy = Math.sin(a) * 0.55, l = Math.hypot(dx, dy);
    flameBlade(p, hx + ox, hy + oy, dx / l, dy / l, L4, w, -Math.sign(a) * 1.5, N5, n, H4, LAYERS2);
  });
  head3(p, H4, t, R02, S, hx, hy);
  looped(t, D12, 26, S + 200, (r) => ({ a: r.range(-2.4, 2.4), v: r.range(30, 70), life: r.range(0.08, 0.18) }), (q, age) => {
    const ca = Math.cos(q.a), sa = Math.sin(q.a), d = R02 * 0.9 + q.v * age, x = hx + ca * d - V * 0.4 * age, y = hy + sa * d;
    const k = 1 - age / q.life, L4 = 1 + 2 * k;
    p.line(x - ca * L4 + V * 0.02, y - sa * L4, x, y, k > 0.5 ? H4[1] : H4[3]);
    p.glow(x, y, 3, H4[2], 0.4 * k);
  });
  looped(t, D12, 30, S + 300, (r) => ({ x: -r.range(2, 16), y: r.range(-3, 3), v: V * r.range(0.3, 0.8), vy: r.range(-20, 20), life: r.range(0.25, 0.55), big: r.chance(0.25), ph: r.range(0, 6.3) }), (q, age) => {
    const [wx, y, wvx, vy] = drift(0, q.y, q.v, q.vy, age, 0, 50, 3, 2);
    const x = q.x + wx - V * age, k = 1 - age / q.life;
    if (q.big) ember(p, x, y, k, 2, EMB, age * 40 + q.ph);
    else spark(p, x, y, wvx - V, vy, k, SPARKS);
  });
  const fl = 0.85 + 0.15 * N5(9, S + 7);
  p.glowLine(hx - 6, hy, -50, -2, 12, GLOW, 0.2 * fl);
  p.glow(hx - 2, hy, 42, GLOW, 0.42 * fl);
  p.glow(hx, hy, 13, H4[1], 0.3 * fl);
}

// ../pixelfx/src/fx/fire/meteor.js
var meteor_exports = {};
__export(meteor_exports, {
  create: () => create8,
  meta: () => meta17
});
var meta17 = {
  name: "Meteor",
  desc: "A burning rock streaks in from the upper left in a comet of fire and smashes into the floor: a white flash, a fireball, rocks and brands thrown, a glowing crater that cools.",
  tags: ["fire", "meteor", "impact", "explosion", "spell", "debris", "one-shot"],
  size: [272, 232],
  origin: [150, 208],
  duration: 5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    stone: "#4a3f69",
    rock: ["#120e16", "#2a2230", "#463a4a", "#6a5a66"],
    seed: 9
  }
};
var HIT2 = 0.62;
var FROM = [-112, -142];
var SOOT = hex("#0d0a12");
var SOOT2 = hex("#17121d");
var OUTLINE2 = hex("#1a1422");
var WARM = rgb(255, 176, 96);
function stone2(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3) };
}
function rock3(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE2 : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}
function create8(o) {
  const F = fit(o.palette, 9), H4 = hotFirst(F), RK = fit(o.rock, 4), st = stone2(o.stone), R4 = new Rng(o.seed), floor = () => 0, S = o.seed * 11;
  let blazes;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [H4[1], H4[2], H4[4], H4[5]], onLand: (x, y) => blazes.add(x, y - 0.25, R4.range(0.9, 1.6), R4.range(0.5, 0.85)) });
  blazes = new Blazes(ps);
  const bits = new Bits({ ground: floor }), lights = new Lights(), GLOW = mix(mix(H4[3], H4[4], 0.5), WHITE, 0.25);
  const len2 = Math.hypot(FROM[0], FROM[1]), ux = -FROM[0] / len2, uy = -FROM[1] / len2;
  const pos = (tt) => {
    const k = ease.inQuad(clamp(tt / HIT2)) * 0.35 + clamp(tt / HIT2) * 0.65;
    return [FROM[0] * (1 - k), FROM[1] * (1 - k)];
  };
  let t = 0, hit = false, last2 = pos(0);
  const meteor = (p, x, y, R02, cool, alpha = 1) => {
    p.shade(x - R02 - 2, y - R02 - 2, x + R02 + 2, y + R02 + 2, (px, py, out) => {
      out.a = alpha;
      const dx = px - x, dy = py - y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), rr = R02 * (1 + 0.18 * noise(a * 2.2 + 3, S) + 0.1 * noise(a * 5, S + 1));
      if (d > rr + 1) return;
      if (d > rr) return OUTLINE2;
      const face2 = (dx * ux + dy * uy) / Math.max(1, d), heat2 = (1 - cool) * (face2 * 0.6 + 0.5 - d / rr * 0.25);
      if (heat2 > 0.62) return heat2 > 0.85 ? H4[0] : heat2 > 0.74 ? H4[1] : H4[2];
      if (heat2 > 0.42) return H4[4];
      const h = rand(Math.floor(px - x), Math.floor(py - y), S + 3);
      if (h < 0.22 * (1 - cool * 0.7)) return 1 - cool > 0.5 ? H4[4] : H4[6];
      return dx * -0.6 + dy * -0.8 > 0 ? RK[2] : d / rr > 0.6 ? RK[0] : RK[1];
    });
  };
  const crater = (p) => {
    if (t < HIT2) return;
    const a = t - HIT2, end = 1 - smooth(meta17.duration - 1, meta17.duration - 0.15, t), rx = 36 * Math.min(1, a / 0.08), ry = 6;
    for (let y = -1; y <= 3; y++)
      for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
        const dx = (x + 0.5) / rx, dy = (y + 0.5) / ry, d = Math.sqrt(dx * dx + dy * dy);
        if (d > 1) continue;
        const k = rand(x * 31 + y, S + 5), T4 = Math.pow(clamp(1 - a / 2.6), 1.3) * (1.25 - d) - k * 0.35;
        if (T4 > 0.06) {
          const ramp2 = [H4[0], H4[1], H4[2], H4[3], H4[4], H4[5], H4[6], H4[7], H4[8]], c = ramp2[Math.min(8, Math.floor((1 - Math.min(1, T4)) * 8))];
          p.dot(x, y, c, end);
          if ((x & 3) === 0) p.glow(x + 0.5, y, 7, c, 0.2 * T4 * end);
        } else p.dot(x, y, d < 0.55 ? SOOT : SOOT2, (d < 0.95 - k * 0.3 ? 1 : 1 - d) * end);
      }
    for (let x = -40; x <= 40; x++) {
      const e = Math.abs(x) / 40, hh = e < 0.7 ? 0 : Math.round(2.4 * Math.sin((e - 0.7) / 0.3 * Math.PI) * (0.6 + 0.4 * rand(x, S + 7)));
      for (let j = 0; j < hh; j++) p.dot(x, -1 - j, j === hh - 1 ? mix(st.light, H4[4], 0.5 * clamp(1 - a / 2)) : st.shade, end);
      if (hh) p.dot(x, 0, OUTLINE2, end);
    }
  };
  return {
    update(dt) {
      t += dt;
      if (t < HIT2) {
        const [x, y] = pos(t), vx = (x - last2[0]) / dt, vy = (y - last2[1]) / dt;
        last2 = [x, y];
        for (let i = 0; i < 3; i++) {
          if (!R4.chance(0.8 * dt * 60)) continue;
          ps.spawn(P.FIRE, x - ux * R4.range(2, 8) + R4.range(-3, 3), y - uy * R4.range(2, 8) + R4.range(-3, 3), vx * 0.15 + R4.range(-20, 20), vy * 0.15 + R4.range(-30, 10), R4.range(0.3, 0.6), 0, R4.range(3, 6), 0, R4.chance(0.65) ? PF.SMOKES | PF.BIG : 0);
        }
        if (R4.chance(0.6 * dt * 60)) ps.spawn(P.SPARK, x, y, vx * 0.35 + R4.range(-80, 80), vy * 0.35 + R4.range(-80, 40), R4.range(0.2, 0.5));
        if (R4.chance(0.3 * dt * 60)) ps.spawn(P.EMBER, x, y, vx * 0.1 + R4.range(-30, 30), vy * 0.1 + R4.range(-40, 0), R4.range(0.8, 1.6), H4[3], R4.chance(0.2) ? 2 : 1);
      } else if (!hit) {
        hit = true;
        lights.add(0, -40, 100, WARM, 0.95, 0.9);
        lights.add(0, -20, 46, WHITE, 0.9, 0.12);
        for (let i = 0; i < 34; i++) {
          const a = -Math.PI / 2 + R4.range(-1.3, 1.3) + 0.25, sp = R4.range(50, 210);
          ps.spawn(P.FIRE, R4.range(-6, 6), -R4.range(2, 10), Math.cos(a) * sp, Math.sin(a) * sp * 0.75 - 30, R4.range(0.5, 1.1), 0, R4.range(5, 9), 0, R4.chance(0.5) ? PF.SMOKES | PF.BIG : 0);
        }
        for (let i = 0; i < 9; i++) ps.spawn(P.FIRE, R4.range(-6, 6), -6, R4.range(-14, 14), -R4.range(130, 220), R4.range(0.8, 1.2), 0, R4.range(6, 8.5), R4.range(0, 0.12), PF.SMOKES | PF.BIG);
        for (let i = 0; i < 20; i++) {
          const a = R4.range(-Math.PI, 0), d = R4.range(4, 18);
          ps.spawn(P.SMOKE, Math.cos(a) * d, -R4.range(6, 24), Math.cos(a) * R4.range(10, 40), -R4.range(30, 110), R4.range(1.8, 2.8), 0, R4.range(8, 12), R4.range(0.15, 0.5), PF.BIG);
        }
        for (let i = 0; i < 16; i++) {
          const s = R4.sign();
          ps.spawn(P.SMOKE, s * R4.range(4, 18), -R4.range(1, 5), s * R4.range(60, 130) + 10, -R4.range(2, 12), R4.range(1.2, 2), st.dust, R4.range(5, 8), R4.range(0, 0.06), PF.BIG);
        }
        for (let i = 0; i < 90; i++) {
          const a = -Math.PI / 2 + R4.range(-1.3, 1.3) + 0.15, sp = R4.range(100, 300);
          ps.spawn(P.SPARK, 0, -4, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.2, 0.7));
        }
        for (let i = 0; i < 36; i++) {
          const a = R4.range(0, TAU), sp = R4.range(40, 150);
          ps.spawn(P.EMBER, Math.cos(a) * 8, -8 + Math.sin(a) * 6, Math.cos(a) * sp, Math.sin(a) * sp - 70, R4.range(1.2, 2.6), H4[3]);
        }
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + R4.range(-1, 1.05), sp = R4.range(130, 240);
          ps.spawn(P.BRAND, 0, -6, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.7, 1.3));
        }
        for (let i = 0; i < 28; i++)
          bits.add({ kind: B.CHUNK, x: R4.range(-8, 8), y: -3, vx: R4.range(-80, 110), vy: -R4.range(140, 340), g: 1, drag: 0.4, bounce: 0.3, life: R4.range(1.8, 2.8), a: R4.range(0, TAU), va: R4.range(-16, 16), s: R4.int(1, 3), ramp: [OUTLINE2, st.shade, st.body, st.light, mix(st.light, WHITE, 0.3)] });
        for (let i = 0; i < 80; i++) {
          const u = R4.range(-1, 1), a = -Math.PI / 2 + u * 0.7 + 0.15, sp = R4.range(90, 270) * (1 - 0.4 * Math.abs(u));
          ps.spawn(P.GRIT, u * 6, -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1.2, 2.2), R4.pick([st.light, st.body, st.body, st.shade]), R4.chance(0.45) ? 2 : 1);
        }
      }
      bits.update(dt);
      for (const b of bits.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 3; i++) ps.spawn(P.DUST, b.x + R4.range(-1.5, 1.5), -0.5, R4.sign() * R4.range(8, 35), -R4.range(2, 18), R4.range(0.3, 0.6), st.dust, R4.range(1.3, 2.6));
        }
      blazes.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      crater(p);
      simDraw(p, ps, H4, "back");
      blazes.drawBack(p);
      const k = (t - HIT2) / 0.5;
      if (k > 0 && k < 1) band(p, 0, 0.5, 110 * ease.outCubic(k), 0.16, Math.max(1, 5 * (1 - k)), 1.15 - k, [st.body, st.light, H4[4], H4[1]], (g) => Math.sin(g) < 0);
    },
    draw(p) {
      const k = (t - HIT2) / 0.5;
      if (k > 0 && k < 1) band(p, 0, 0.5, 110 * ease.outCubic(k), 0.16, Math.max(1, 5 * (1 - k)), 1.15 - k, [st.body, st.light, H4[4], H4[1]], (g) => Math.sin(g) >= 0, k < 0.12);
      for (const b of bits.list) rock3(p, b, st);
      if (t < HIT2) {
        const [x, y] = pos(t), NZ = (rate, seed = 0, off = 0) => noise(t * rate + off, seed);
        floorLight(p, 0, 0.5, 30 + 40 * (t / HIT2), 7, GLOW, 0.5 * (t / HIT2) ** 2);
        [[36, 7, 0], [26, 7.5, -2.5], [26, 7.5, 2.5], [16, 8, 0]].forEach(([L4, w, off], i) => {
          const n = (S + i) * 13;
          flameBlade(p, x - uy * off, y + ux * off, -ux, -uy, L4 * (0.85 + 0.25 * NZ(5, n)), w, NZ(3, n + 3) * 3, NZ, n, H4, LAYERS2, 0.5, 1.6);
        });
        meteor(p, x, y, 6.5, 0);
        p.glow(x, y, 46, GLOW, 0.55);
        p.glow(x, y, 12, H4[1], 0.4);
      } else {
        const a = t - HIT2, cool = clamp(a / 2.8), end = 1 - smooth(meta17.duration - 1.1, meta17.duration - 0.2, t);
        if (end > 0) {
          meteor(p, 0, 0, 5.5, cool, end);
          p.glow(0, -2, 22, GLOW, 0.4 * (1 - cool) * end);
        }
      }
      simDraw(p, ps, H4, "front");
      const f = (t - HIT2) / 0.08;
      if (f > 0 && f < 1) {
        p.circle(0, -6, 11 * (1 - f * 0.3) + 1.5, H4[3]);
        p.circle(0, -6, 11 * (1 - f * 0.3), f < 0.5 ? H4[1] : H4[2]);
        p.circle(0, -6, 7 * (1 - f * 0.3), f < 0.5 ? WHITE : H4[1]);
      }
      const fr = (t - HIT2) / 0.24;
      if (fr > 0 && fr < 1) flare(p, 0, -6, 44 * Math.pow(1 - fr, 1.4), 1 - fr, [H4[6], H4[4], H4[2], H4[1]]);
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/ice/frost-nova.js
var frost_nova_exports = {};
__export(frost_nova_exports, {
  act: () => act5,
  create: () => create9,
  meta: () => meta18
});
var meta18 = {
  name: "Frost nova",
  desc: "Frost spirals into a spinning snowflake, then a wave blooms three rings of ice crystals round the caster; snow drifts, frost creeps, and the ice melts back into the floor.",
  tags: ["ice", "nova", "aoe", "frost", "magic", "one-shot"],
  size: [288, 192],
  origin: [144, 150],
  duration: 3.4,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], reach: 104, seed: 4 }
};
var HIGH2 = { turn: 1.15, crouch: 0, fx: -7, fy: -44, bx: 8, by: -44, ffx: -5, fbx: 6 };
var SLAM = { turn: 1.15, crouch: 8, lean: 3, fx: -9, fy: -8, bx: 11, by: -8, ffx: -8, fbx: 9 };
var EASE = { turn: 1, crouch: 2, fx: -8, fy: -17, bx: 9, by: -17, ffx: -4, fbx: 5 };
var act5 = {
  target: { x: 76 },
  poses: [
    [-0.34, READY],
    [-0.04, { ...HIGH2, crouch: 2, fy: -36, by: -36 }],
    [0.36, HIGH2],
    [0.42, SLAM, "snap"],
    [0.9, { ...SLAM, crouch: 7 }],
    [1.9, { ...SLAM, crouch: 6 }],
    [2.6, EASE],
    [3.4, READY]
  ],
  hits: [
    { t: 0.42, stop: 0.1, shake: 0.26, amp: 2, target: false },
    { t: 0.66, push: 0.9, straw: 6, y: -10, skin: "ice", shiver: 1.7 },
    { t: 2.9, push: 0.2, straw: 0, flash: 0, skin: null }
  ],
  dust: [{ t: 0.42, x: 10, n: 5, dir: 1, c: "#d8f2ff" }, { t: 0.42, x: -10, n: 5, dir: -1, c: "#d8f2ff" }]
};
var CHARGE = 0.42;
var SPREAD = 0.62;
var HOLD2 = 1.95;
var MELT = 0.7;
var CORE_Y = -24;
var RINGS = [
  { q: [0.15, 0.24], h: [24, 32], w: [10, 13], n: 2, kids: 2 },
  { q: [0.36, 0.52], h: [13, 19], w: [7, 9], n: 3, kids: 1 },
  { q: [0.62, 0.9], h: [5, 10], w: [4, 6], n: 4, kids: 0 }
];
function frost(p, C5, x0, x1, reach, a, edge) {
  for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
    const d = Math.abs(x + 0.5), q = d / reach, k = clamp((a * 1.15 - q) / 0.15);
    if (k <= 0) continue;
    const h = rand(x, 17), fresh = edge > 0 && d > edge - 3, tuft = h < 0.45 ? Math.round((1 + rand(x, 5) * 3) * (1 - q * 0.6)) : 0, D17 = (4 + rand(x, 11) * 4) * (1 - q * 0.5);
    p.dot(x, 0, fresh || h < 0.25 ? WHITE : C5[6], k);
    for (let j = 1; j <= tuft; j++) p.dot(x, -j, j === tuft ? WHITE : C5[5], k);
    if (tuft > 1 && rand(x, 9) < 0.5) p.dot(x + (rand(x, 3) < 0.5 ? -1 : 1), -tuft + 1, C5[6], k);
    for (let j = 1; j <= D17; j++) {
      const v = j / D17;
      p.dot(x, j, rand(x * 31 + j, 7) < 0.06 ? WHITE : v < 0.25 ? C5[6] : v < 0.55 ? C5[5] : C5[4], k * (1.1 - v) * (fresh ? 1.3 : 1));
    }
  }
}
function snowflake(p, C5, x, y, L4, spin, k) {
  if (L4 < 0.8) return;
  for (let i = 0; i < 6; i++) {
    const a = spin + i * TAU / 6, ca = Math.cos(a), sa = Math.sin(a);
    for (let d = 0; d <= L4; d += 0.5) p.dot(x + ca * d, y + sa * d, d < L4 * 0.4 ? WHITE : C5[6], k + 0.2);
    if (L4 > 3)
      for (const s of [-1, 1]) {
        const bx = x + ca * L4 * 0.6, by = y + sa * L4 * 0.6, ba = a + s * 0.9;
        for (let d = 0; d <= L4 * 0.35; d += 0.5) p.dot(bx + Math.cos(ba) * d, by + Math.sin(ba) * d, C5[5], k);
      }
  }
  p.px(x, y, WHITE);
  p.glow(x, y, 10 + L4 * 3, C5[5], 0.35 + 0.5 * k);
}
function create9(o) {
  const C5 = fit(o.palette, 8), DIM = [C5[0], C5[0], C5[1], C5[2], C5[3], C5[4], C5[5], C5[6]], REACH2 = o.reach;
  const R4 = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [C5[7], C5[6], C5[5], C5[4]], haze: C5[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const front = (t2) => t2 < CHARGE ? 0 : REACH2 * (1 - Math.pow(1 - clamp((t2 - CHARGE) / SPREAD), 3));
  const reachedAt = (d) => CHARGE + SPREAD * (1 - Math.cbrt(1 - Math.min(1, d / REACH2)));
  const sites = [];
  for (const side of [-1, 1])
    RINGS.forEach((ring5, ri) => {
      for (let i = 0; i < ring5.n; i++) {
        const q = ring5.q[0] + (ring5.q[1] - ring5.q[0]) * (i + R4.range(0.2, 0.8)) / ring5.n, h = R4.range(...ring5.h), w = R4.range(...ring5.w);
        const parts = [{ dx: 0, h, w, lean: side * h * R4.range(0.1, 0.28) }];
        for (let k = 0; k < ring5.kids; k++) {
          const s = k % 2 ? -side : side, kh = h * R4.range(0.4, 0.62);
          parts.unshift({ dx: s * R4.range(0.3, 0.5) * w, h: kh, w: w * 0.62, lean: s * kh * R4.range(0.35, 0.6) });
        }
        sites.push({ x: side * q * REACH2, d: q * REACH2, h, back: (i + ri + (side > 0 ? 1 : 0)) % 2 === 1, t0: reachedAt(q * REACH2) + R4.range(0, 0.03), up: false, parts, phase: R4.next() });
      }
    });
  let t = 0, released = false;
  const sink = (tt) => smooth(HOLD2, HOLD2 + MELT, tt);
  const drawCrystals = (p, back) => {
    const m = sink(t);
    for (const s of sites) {
      if (!s.up || s.back !== back || m >= 1) continue;
      const g = ease.outBack(clamp((t - s.t0) / 0.1), 2.6), white = t < s.t0 + 0.03, sw = ((t - s.t0) * 0.7 + s.phase * 3) % 1.6 / 0.5;
      for (const q of s.parts)
        crystal(p, s.x + q.dx, back ? -1 : 0, q.h * g * (1 - m), q.w * (1 - m * 0.3), q.lean * g * (1 - m), back ? DIM : C5, { white, glint: sw <= 1 ? sw : -1 });
    }
  };
  const ring4 = (p, back) => {
    if (t < CHARGE) return;
    const u = clamp((t - CHARGE) / (SPREAD + 0.15));
    if (u >= 1) return;
    band(p, 0, 0, front(t) + 2, 0.16, Math.max(2, 10 * Math.pow(1 - u, 0.7)), u < 0.75 ? 1 : (1 - u) / 0.25, C5, (g) => Math.sin(g) < 0 === back, t - CHARGE < 0.1);
    if (!back) for (const s of [-1, 1]) p.glow(s * (front(t) + 2), -2, 22, C5[5], 0.55 * (1 - u));
  };
  return {
    update(dt) {
      t += dt;
      if (t < CHARGE - 0.06) {
        if (R4.chance(0.9)) {
          const a = R4.range(0, TAU), D17 = R4.range(26, 58), T4 = R4.range(0.2, 0.3), v = D17 * 3 / (Math.exp(3 * T4) - 1);
          const x = Math.cos(a) * D17, y = Math.min(CORE_Y + Math.sin(a) * D17 * 0.8, -2), l = Math.hypot(x, y - CORE_Y) || 1;
          ps.spawn(P.STREAK, x, y, -x / l * v, (CORE_Y - y) / l * v, T4, R4.chance(0.5) ? C5[6] : C5[5]);
        }
        if (R4.chance(0.14)) {
          const s = R4.sign();
          ps.spawn(P.VAPOUR, s * R4.range(28, 60), -R4.range(0, 2), -s * R4.range(35, 70), -R4.range(0, 3), R4.range(0.35, 0.5), C5[6], R4.range(2, 3));
        }
      }
      if (t >= CHARGE && !released) {
        released = true;
        lights.add(0, CORE_Y, 84, C5[4], 0.8, 0.55);
        lights.add(0, CORE_Y, 45, WHITE, 0.7, 0.12);
        for (let i = 0; i < 22; i++) {
          const a = R4.range(-Math.PI, 0.25), sp = R4.range(110, 280);
          bits.add({ kind: B.SHARD, x: R4.range(-3, 3), y: CORE_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.7, drag: 0.6, bounce: 0.3, life: R4.range(0.9, 1.5), a: R4.range(0, TAU), va: R4.range(-20, 20), s: R4.range(1.5, 3.5), c: R4.pick([C5[7], C5[6], C5[5]]) });
        }
        for (let i = 0; i < 14; i++) {
          const a = R4.range(-Math.PI, 0), sp = R4.range(40, 160);
          ps.spawn(P.FLAKE, 0, CORE_Y, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1.2, 1.8), R4.chance(0.6) ? WHITE : C5[6], R4.range(0.5, 1.6));
        }
      }
      const fr = front(t);
      if (t > CHARGE && t < CHARGE + SPREAD)
        for (const s of [-1, 1]) {
          ps.spawn(P.VAPOUR, s * fr + R4.range(-2, 2), -R4.range(0, 5), s * R4.range(15, 75), -R4.range(2, 15), R4.range(0.6, 1), R4.chance(0.7) ? C5[6] : C5[5], R4.range(3, 5.5) * (1 - 0.4 * (fr / REACH2)));
          if (R4.chance(0.45)) ps.spawn(P.FLAKE, s * fr, -2, s * R4.range(10, 45), -R4.range(30, 85), R4.range(1.1, 1.9), R4.chance(0.5) ? WHITE : C5[6], R4.range(0.5, 1.2));
        }
      for (const s of sites) {
        if (!s.up && t >= s.t0) {
          s.up = true;
          for (let i = 0; i < 2 + Math.round(s.h / 8); i++) {
            const a = -Math.PI / 2 + R4.range(-1.3, 1.3), sp = R4.range(60, 200) * (0.5 + s.h / 40);
            bits.add({ kind: B.SHARD, x: s.x + R4.range(-3, 3), y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.8, drag: 0.6, bounce: 0.3, life: R4.range(0.9, 1.6), a: R4.range(0, TAU), va: R4.range(-18, 18), s: R4.range(1.5, 3), c: R4.pick([C5[7], C5[6], C5[5]]) });
          }
          ps.spawn(P.VAPOUR, s.x, -1, R4.range(-30, 30), -R4.range(2, 8), R4.range(0.5, 0.9), C5[6], R4.range(2.5, 4));
          if (s.h > 10) ps.spawn(P.STAR, s.x + R4.range(-3, 3), -R4.range(4, s.h * 0.8), 0, -3, R4.range(0.3, 0.6), C5[6], R4.range(1, 2.4));
        }
      }
      if (t > CHARGE + 0.2 && t < HOLD2 + 0.2) {
        if (R4.chance(0.5)) {
          const s = R4.pick(sites);
          if (s.up) ps.spawn(P.STAR, s.x + R4.range(-3, 3), -R4.range(2, s.h * 0.9), 0, -3, R4.range(0.3, 0.6), R4.chance(0.6) ? C5[6] : WHITE, R4.range(0.6, 2.2));
        }
        if (t < HOLD2 - 0.3 && R4.chance(0.16)) ps.spawn(P.FLAKE, R4.range(-1, 1) * fr, -R4.range(40, 90), R4.range(-5, 5), R4.range(3, 10), R4.range(1.1, 1.5), R4.chance(0.5) ? WHITE : C5[6], R4.range(0.5, 1.4));
      }
      if (t > HOLD2 && t < HOLD2 + MELT) {
        if (R4.chance(0.5)) {
          const s = R4.pick(sites);
          bits.add({ kind: B.DRIP, x: s.x + R4.range(-3, 3), y: -R4.range(3, s.h * 0.6 * (1 - sink(t))), vy: 10, g: 0.6, life: 1, c: C5[5] });
        }
        if (R4.chance(0.25)) ps.spawn(P.VAPOUR, R4.range(-1, 1) * REACH2 * 0.8, -R4.range(0, 3), R4.range(-10, 10), -R4.range(6, 16), R4.range(0.6, 1), C5[5], R4.range(3, 5));
      }
      ps.update(dt);
      bits.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const out = 1 - smooth(HOLD2 + 0.2, HOLD2 + MELT + 0.6, t), fr = front(t);
      if (out > 0 && t > CHARGE) frost(p, C5, -Math.max(12, fr + 1), Math.max(12, fr + 1), REACH2, out, fr);
      ring4(p, true);
      drawCrystals(p, true);
      ps.draw(p, "back");
    },
    draw(p) {
      ring4(p, false);
      drawCrystals(p, false);
      if (t < CHARGE) {
        const k = t / CHARGE, beat3 = 1 + 0.25 * Math.exp(-((t - CHARGE * 0.55) ** 2) / 2e-3) + 0.3 * Math.exp(-((t - CHARGE * 0.85) ** 2) / 2e-3);
        snowflake(p, C5, 0, CORE_Y, (2 + 5.5 * k * k) * beat3, t * 4, k);
      } else if (t < CHARGE + 0.22) {
        const a = (t - CHARGE) / 0.22;
        flare(p, 0, CORE_Y, 36 * Math.pow(1 - a, 1.5), 1 - a, C5);
        p.glow(0, CORE_Y, 46, WHITE, 0.6 * (1 - a));
      }
      if (t > CHARGE) {
        const k = (1 - smooth(HOLD2, HOLD2 + MELT + 0.3, t)) * (0.85 + 0.15 * Math.sin(t * 2.4)), fr = front(t);
        for (let i = -3; i <= 3; i++) p.glow(i / 3.5 * fr, -4, 26, C5[4], 0.16 * k);
      }
      bits.draw(p);
      ps.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/lightning/lightning-strike.js
var lightning_strike_exports = {};
__export(lightning_strike_exports, {
  create: () => create10,
  meta: () => meta19
});

// ../pixelfx/src/fx/lightning/_lib.js
var VOLT = ["#120a33", "#2a1b78", "#4630c0", "#5a62f0", "#58a6ff", "#9ed8ff", "#e4f6ff", "#ffffff"];
var PLASMA = ["#ffffff", "#c8f8ff", "#7ff3ff", "#1ab8e6"];
var SOOT3 = hex("#110c16");
var SOOT22 = hex("#1c1522");
function zigzag(R4, x0, y0, x1, y1, jag = 0.32, forks = 0.35, w = 1, depth = 0) {
  const out = { paths: [] }, L4 = Math.hypot(x1 - x0, y1 - y0);
  let pts = [[x0, y0], [x1, y1]], off = L4 * jag;
  while (pts.length < 2 + L4 / 3) {
    const nxt = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.hypot(bx - ax, by - ay) || 1, o = R4.range(-off, off);
      nxt.push([(ax + bx) / 2 + -(by - ay) / l * o, (ay + by) / 2 + (bx - ax) / l * o], [bx, by]);
    }
    pts = nxt;
    off *= 0.52;
  }
  out.paths.push({ pts, w });
  if (depth < 2) {
    for (let i = 2; i < pts.length - 3; i++)
      if (R4.chance(forks / (1 + depth) / Math.max(4, pts.length / 6))) {
        const [ax, ay] = pts[i], [bx, by] = pts[Math.min(pts.length - 1, i + 3)];
        const a = Math.atan2(by - ay, bx - ax) + R4.sign() * R4.range(0.35, 0.9), l = (L4 - i / pts.length * L4) * R4.range(0.25, 0.55);
        out.paths.push(...zigzag(R4, ax, ay, ax + Math.cos(a) * l, ay + Math.sin(a) * l, jag * 1.1, forks, w * 0.55, depth + 1).paths);
      }
  }
  return out;
}
function bend(b, fn) {
  return { paths: b.paths.map((q) => ({ w: q.w, pts: q.pts.map(([x, y]) => fn(x, y)) })) };
}
var N = 1024;
var HALF = 512;
var GRID8 = new Uint8Array(N * N);
var HIT3 = [];
function mark(x, y, lvl) {
  const X = Math.floor(x) + HALF, Y = Math.floor(y) + HALF;
  if (X < 0 || Y < 0 || X >= N || Y >= N) return;
  const i = Y * N + X, v = GRID8[i];
  if (!v) HIT3.push(i);
  if (lvl > v) GRID8[i] = lvl;
}
function stamp(x, y, r, lvl) {
  if (r <= 0.5) return mark(Math.round(x), Math.round(y), lvl);
  const r2 = r * r;
  for (let py = Math.floor(y - r); py <= Math.ceil(y + r); py++) {
    const dy = py + 0.5 - y;
    for (let px = Math.floor(x - r); px <= Math.ceil(x + r); px++) {
      const dx = px + 0.5 - x;
      if (dx * dx + dy * dy <= r2) mark(px, py, lvl);
    }
  }
}
function flush(p, cols, alphas) {
  for (const i of HIT3) {
    const v = GRID8[i];
    GRID8[i] = 0;
    const x = i % N - HALF, y = (i / N | 0) - HALF, a = alphas ? alphas[v - 1] : 1;
    if (a >= 1) p.px(x, y, cols[v - 1]);
    else if (a > 0) p.dot(x, y, cols[v - 1], a);
  }
  HIT3.length = 0;
}
var walk = (pts, fn) => {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.max(1, Math.hypot(bx - ax, by - ay));
    for (let d = 0; d <= l; d += 0.5) fn(ax + (bx - ax) * d / l, ay + (by - ay) * d / l, i);
  }
};
function stroke(p, b, k, C5, s = 1, o = {}) {
  if (k <= 0.02) return;
  const lk = o.light ?? 0.5;
  for (const q of b.paths) {
    const trunk = q.w >= 1;
    if (!trunk && k < 0.5) continue;
    const rh = (trunk ? k > 0.6 ? 2.1 : 1.6 : 1.1) * s, rb = (trunk ? k > 0.6 ? 1.3 : 0.8 : 0.5) * s;
    const pts = o.upTo !== void 0 && trunk ? q.pts.slice(0, Math.max(2, Math.ceil(q.pts.length * o.upTo))) : q.pts;
    walk(pts, (x, y) => {
      stamp(x, y, rh, 1);
      stamp(x, y, rb, trunk ? 3 : 2);
      if (trunk && k > 0.3) o.core ? stamp(x, y, o.core, 4) : mark(x, y, 4);
    });
    for (let i = 0; i < pts.length - 1; i += 3) if (o.minY === void 0 || pts[i][1] > o.minY) p.glow(pts[i][0], pts[i][1], (trunk ? 14 : 7) * s, C5[4], lk * k * q.w);
  }
  const a = o.a ?? 1;
  flush(p, o.hero ? [C5[3], C5[6], C5[7], C5[7]] : [C5[2], C5[4], C5[5], C5[7]], [a, a, a, a]);
}
function crackle(p, b, k, C5, glowK = 0.5, a = 1) {
  if (k <= 0.02) return;
  for (const q of b.paths) {
    const thick = q.w >= 1;
    walk(q.pts, (x, y) => {
      if (k > 0.45 && thick) for (const [dx, dy] of CROSS2) mark(x + dx * 1.5, y + dy * 1.5, 1);
      if (k > 0.25 && (thick || q.w > 0.4)) mark(x + 1, y, 2), mark(x, y + 1, 2);
      mark(x, y, thick && k > 0.3 ? 4 : 3);
    });
    for (let i = 0; i < q.pts.length - 1; i += 3) p.glow(q.pts[i][0], q.pts[i][1], (thick ? 9 : 5) * (0.5 + k * 0.5), C5[4], glowK * k * q.w);
  }
  flush(p, [C5[3], C5[5], C5[5], C5[7]], [Math.min(1, (k - 0.45) * 1.6) * a, a, a, a]);
}
var CROSS2 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function trace2(p, pts, c, a = 1, from = 0, to = pts.length - 1) {
  for (let i = Math.max(0, from); i < Math.min(to, pts.length - 1); i++) p.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], c, a);
}
function scorch(p, cx, cy, rx, T02, fade = 1, ry = Math.max(2.5, rx * 0.12)) {
  if (fade <= 0) return;
  for (let y = Math.floor(cy); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const n = rand(x, y, 41), T4 = T02 * (1.25 - d) - n * 0.35;
      if (T4 > 0.06) {
        const c = FIRE_RAMP[Math.min(FIRE_RAMP.length - 1, Math.floor((1 - Math.min(1, T4)) * (FIRE_RAMP.length - 1)))];
        p.dot(x, y, c, fade);
        if ((x & 3) === 0) p.glow(x + 0.5, y, 6, c, 0.18 * T4 * fade);
      } else p.dot(x, y, d < 0.5 ? SOOT3 : SOOT22, (d < 0.95 - n * 0.3 ? 1 : 1 - d) * fade);
    }
}
var heat = (T4) => T4 > 0.06 ? FIRE_RAMP[Math.min(FIRE_RAMP.length - 1, Math.floor((1 - Math.min(1, T4)) * (FIRE_RAMP.length - 1)))] : 0;

// ../pixelfx/src/fx/lightning/lightning-strike.js
var meta19 = {
  name: "Lightning strike",
  desc: "A targeted strike: a sigil charges on the floor, the scene darkens, a thick bolt slams into it, arcs race out along the cracks it splits, the channel crumbles to a scorch.",
  tags: ["lightning", "electric", "strike", "spell", "target", "impact", "ground", "one-shot"],
  size: [240, 264],
  origin: [120, 228],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: VOLT, sparks: PLASMA, seed: 5 }
};
var W5 = 120;
var TOP = -224;
var RX = 28;
var SY = 0.22;
var REACH = 52;
var LEAD0 = 0.48;
var STEPS = 9;
var MEET = -30;
var STROKES = [{ t: 0.76, k: 1 }, { t: 1.04, k: 0.8 }, { t: 1.26, k: 0.55 }];
var FLICK = [1, 0.72, 0.3, 0.95, 0.5, 0.8, 0.22];
var level = (a) => a < 0 ? 0 : FLICK[Math.floor(a * 30 + 1e-4)] ?? 0;
var NIGHT = hex("#04030a");
var DUST4 = hex("#6e6382");
var ASH = hex("#5b5566");
var STONE2 = ["#655b7a", "#4a4263", "#342d45"].map(hex);
var S1 = STROKES[0].t;
function cracks2(R4) {
  const out = [];
  const grow = (x, y, a, len2, w, d, depth) => {
    const pts = [[x, y, d]];
    for (let s = 0; s < len2; s += 1.5) {
      a += R4.range(-0.32, 0.32);
      x += Math.cos(a) * 1.5;
      y = clamp(y + Math.sin(a) * 0.45, 0, 5);
      d += 1.5;
      pts.push([x, y, d]);
      if (depth < 2 && s > 3 && R4.chance(0.09)) grow(x, y, a + R4.sign() * R4.range(0.5, 1.2), (len2 - s) * R4.range(0.3, 0.6), w * 0.6, d, depth + 1);
    }
    out.push({ pts, w });
  };
  for (let i = 0; i < 6; i++) grow(R4.range(-1, 1), R4.range(0, 1), i % 2 ? R4.range(-0.5, 0.7) : Math.PI + R4.range(-0.7, 0.5), REACH * R4.range(0.55, 1), 1, 0, 0);
  return out;
}
function sigil(p, t, C5, k, near) {
  const reveal = clamp(t / 0.22), spin = t * 0.8, burnt = t > S1 ? t - S1 : -1;
  if (burnt > 0.45) return;
  const a0 = burnt < 0 ? 1 : burnt < 0.07 ? 1 : 1 - (burnt - 0.07) / 0.38, hot = burnt >= 0 && burnt < 0.07;
  const on = (a) => Math.sin(a) >= 0 === near;
  const from = (a) => Math.abs(((a - Math.PI / 2) % TAU + TAU + Math.PI) % TAU - Math.PI) / Math.PI;
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * TAU + spin;
    if (!on(a) || from(a) > reveal) continue;
    for (const da of [0, 0.06, 0.12]) {
      const x = Math.cos(a + da) * RX, y = Math.sin(a + da) * RX * SY;
      p.dot(x, y, hot ? WHITE : near ? k > 0.7 ? C5[6] : C5[5] : k > 0.7 ? C5[4] : C5[3], a0);
      if (near) p.dot(x, y + 1, hot ? C5[6] : C5[2], a0);
    }
    if (i % 3 === 0) p.glow(Math.cos(a) * RX, Math.sin(a) * RX * SY, 5, C5[4], 0.3 * k * a0);
  }
  for (let j = 0; j < 4; j++) {
    const a = spin * -0.5 + j * TAU / 4 + Math.PI / 4;
    if (!on(a) || reveal < 1) continue;
    p.line(Math.cos(a) * (RX - 5), Math.sin(a) * (RX - 5) * SY, Math.cos(a) * (RX + 5), Math.sin(a) * (RX + 5) * SY, hot ? WHITE : near ? C5[6] : C5[4], a0);
  }
  if (t > 0.3)
    for (let a = 0; a < TAU; a += 0.09) {
      if (!on(a)) continue;
      p.dot(Math.cos(a) * 14, Math.sin(a) * 14 * SY, hot ? WHITE : near ? C5[4] : C5[2], a0 * clamp((t - 0.3) / 0.12));
    }
  if (near && burnt < 0) {
    const pulse2 = 0.6 + 0.4 * Math.sin(t * (10 + 30 * k));
    p.px(0, 0, k > 0.5 ? WHITE : C5[6]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) p.px(dx, dy, C5[5]);
    p.glow(0, -1, 10 + 10 * k, C5[5], 0.3 + 0.4 * k * pulse2);
  }
}
function keep(b) {
  const paths = [];
  for (const q of b.paths) {
    const pts = [];
    for (const pt of q.pts) {
      if (Math.abs(pt[0]) > W5 - 5 || pt[1] > -3 || pt[1] < TOP + 6) break;
      pts.push(pt);
    }
    if (q.w >= 1 || pts.length > 3) paths.push({ w: q.w, pts: q.w >= 1 ? q.pts : pts });
  }
  return { paths };
}
function create10(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: o.sparks }), hot = new Particles({ rng: R4, ground: floor }), lights = new Lights();
  const X0 = R4.range(8, 18) * (R4.chance(0.5) ? 1 : -1);
  const main = keep(zigzag(R4, X0, TOP, 0, -1, 0.17, 0.5)), trunk = main.paths[0].pts;
  const drift2 = (dx) => (x, y) => [x + dx * Math.sin(Math.PI * y / TOP), y];
  const bolts = [main, bend({ paths: [{ pts: trunk, w: 1 }] }, drift2(1.5)), bend({ paths: [{ pts: trunk, w: 1 }] }, drift2(3))];
  const chan = (i) => bolts[i].paths[0].pts, last2 = STROKES[STROKES.length - 1], end = chan(STROKES.length - 1);
  const tree = cracks2(R4);
  const gone = end.map(([, y], i) => last2.t + 0.25 + 0.75 * (0.55 * rand(o.seed, i, 5) + 0.45 * (1 - y / TOP)));
  let t = 0, struck = -1;
  const now = () => {
    for (let i = STROKES.length - 1; i >= 0; i--) if (t >= STROKES[i].t) return { i, s: STROKES[i], a: t - STROKES[i].t, k: level(t - STROKES[i].t) * STROKES[i].k };
    return null;
  };
  const charge = () => clamp(t / S1) ** 1.5;
  const heatAt = () => struck < 0 ? 0 : Math.max(...STROKES.slice(0, struck + 1).map((s) => s.k * Math.pow(clamp(1 - (t - s.t) / 1.6), 1.4)));
  return {
    update(dt) {
      t += dt;
      for (const [i, s] of STROKES.entries()) {
        if (struck >= i || t < s.t) continue;
        struck = i;
        const k = s.k;
        lights.add(0, -50, 120, C5[4], 0.55 * k, 0.4);
        lights.add(0, -3, 24, WHITE, 0.5 * k, 0.1);
        for (let j = 0; j < Math.round(44 * k); j++) {
          const a = -Math.PI / 2 + R4.range(-1.3, 1.3), sp = R4.range(110, 320) * (0.65 + 0.35 * k);
          ps.spawn(P.SPARK, R4.range(-1.5, 1.5), -2, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.2, 0.55));
        }
        for (let j = 0; j < Math.round(12 * k); j++) {
          const a = -Math.PI / 2 + R4.range(-1.2, 1.2), sp = R4.range(70, 220);
          hot.spawn(P.SPARK, R4.range(-2, 2), -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.5, 1));
        }
        for (let j = 0; j < Math.round(5 * k); j++) hot.spawn(P.EMBER, R4.range(-4, 4), -2, R4.range(-25, 25), -R4.range(30, 80), R4.range(0.8, 1.5));
        for (let j = 0; j < Math.round(18 * k); j++) {
          const a = -Math.PI / 2 + R4.range(-1.1, 1.1), sp = R4.range(50, 190);
          ps.spawn(P.GRIT, R4.range(-3, 3), -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1, 1.5), R4.pick(STONE2), R4.chance(0.35) ? 2 : 1);
        }
        for (let j = 0; j < 8; j++) ps.spawn(P.DUST, R4.range(-3, 3), -1, R4.sign() * R4.range(30, 110), -R4.range(4, 24), R4.range(0.4, 0.8), DUST4, R4.range(1.5, 3));
        for (let j = 0; j < Math.round(4 * k); j++) ps.spawn(P.SMOKE, R4.range(-8, 8), -4, R4.range(-10, 10), -R4.range(10, 25), R4.range(1.1, 1.6), mix(ASH, C5[2], 0.3), R4.range(3, 6), R4.range(0.05, 0.25));
      }
      if (struck >= 0 && t < 1.7 && R4.chance(6 * dt)) ps.spawn(P.SMOKE, R4.range(-8, 8), -2, R4.range(-4, 4), -R4.range(9, 17), R4.range(1, 1.3), 0, R4.range(2, 3.5));
      for (let i = 0; i < gone.length - 1; i++)
        if (gone[i] <= t && gone[i] > t - dt && rand(o.seed, i, 6) < 0.5) {
          const [x, y] = end[i];
          ps.spawn(P.MOTE, x, y, R4.range(-8, 8), R4.range(6, 22), R4.range(0.4, 0.8), R4.chance(0.5) ? C5[5] : C5[4], R4.range(0.5, 0.9));
        }
      ps.update(dt);
      hot.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const dark = 0.5 * smooth(0.46, 0.66, t) * (1 - smooth(S1 - 0.01, S1 + 0.02, t));
      if (dark > 0.01)
        for (let y = -228; y < 36; y++)
          for (let x = -W5; x < W5; x++) {
            const d = Math.hypot(x / W5, (y + 96) / 132), a = dark * (1 - smooth(0.55, 1, d));
            if (a > 0.01) p.blend(x + 0.5, y + 0.5, NIGHT, a);
          }
      sigil(p, t, C5, charge(), false);
      if (struck >= 0) {
        const s = now(), front = REACH * ease.outCubic(clamp((t - S1) / 0.35)), T02 = heatAt(), fade = 1 - smooth(2.3, 2.95, t);
        const elec = s.a < 0.14 ? s.s.k * (1 - s.a / 0.14) : 0;
        for (const br of tree)
          for (const [x, y, d] of br.pts) {
            if (d > front) break;
            const q = d / REACH, n = rand(Math.round(x * 2), Math.round(y * 2), 9), fresh = d > front - 6 && front < REACH;
            const T4 = T02 * (1.15 - q) * (br.w < 1 ? 0.8 : 1) - n * 0.25, c = fresh || elec > 0.3 && n < 0.85 ? q < 0.5 ? WHITE : C5[6] : heat(T4) || SOOT22;
            p.dot(x, y + 1, SOOT3, fade);
            p.dot(x, y, c, fade);
            if (br.w >= 1 && d < 9) p.dot(x, y + 2, SOOT3, fade);
            if ((fresh || elec > 0.3) && (Math.round(d) & 3) === 0) p.glow(x, y, 7, C5[5], 0.4);
            else if (T4 > 0.2 && (Math.round(d) & 3) === 0) p.glow(x, y, 5, c, 0.2 * T4);
          }
        scorch(p, 0, 0, 12, T02, fade);
        if (T02 > 0) p.glow(0, -2, 34, heat(0.55), 0.3 * T02);
      }
      ps.draw(p, "back");
      hot.draw(p, "back");
    },
    draw(p) {
      const s = now(), f = Math.floor(t * 30 + 1e-4), k = charge();
      sigil(p, t, C5, k, true);
      if (t > 0.15 && t < S1) {
        const r = rng(o.seed, 61, f);
        for (let i = 0; i < Math.round(1 + 4 * k); i++) {
          const a = r.range(0, TAU), x = Math.cos(a) * RX, y = Math.sin(a) * RX * SY;
          crackle(p, zigzag(r, x, y, x + r.range(-2.5, 2.5), y - r.range(4, 9) * (0.6 + k), 0.45, 0.3), 0.45 + 0.4 * k, C5, 0.3);
        }
        p.glow(0, -2, 36, C5[4], 0.12 + 0.3 * k);
      }
      if (t >= LEAD0 && t < S1) {
        const u = clamp((t - LEAD0) / (S1 - LEAD0)), st = Math.min(STEPS, Math.floor(u * STEPS) + 1), fresh = 1 - u * STEPS % 1;
        const reach = TOP + (MEET - TOP) * Math.pow(st / STEPS, 1.2), prev = TOP + (MEET - TOP) * Math.pow((st - 1) / STEPS, 1.2);
        for (const q of main.paths) {
          const tk = q.w >= 1;
          for (let i = 0; i < q.pts.length - 1; i++) {
            const [ax, ay] = q.pts[i], [bx, by] = q.pts[i + 1];
            if (by > reach) {
              if (ay <= reach && i > 0) p.px(ax, ay, WHITE), p.glow(ax, ay, 7, C5[5], 0.5 * fresh + 0.15);
              break;
            }
            const young = by > prev;
            p.line(ax, ay, bx, by, young ? fresh > 0.4 ? tk ? C5[6] : C5[5] : C5[4] : tk ? C5[3] : C5[2]);
            if (i % 4 === 0 && ay > TOP + 14) p.glow(ax, ay, young ? 8 : 5, C5[4], young ? 0.3 * fresh + 0.1 : 0.12);
          }
        }
        if (t > 0.62) {
          const h = -MEET * ease.outQuad((t - 0.62) / (S1 - 0.62)), r = rng(o.seed, 77, f);
          const b = zigzag(r, 0, -1, r.range(-2, 2), -Math.max(3, h), 0.3, 0.3), tip = b.paths[0].pts.at(-1);
          crackle(p, b, 0.85, C5, 0.45);
          p.px(tip[0], tip[1], WHITE);
          p.glow(tip[0], tip[1], 9, C5[5], 0.5);
        }
      }
      const next = STROKES.find((q) => q.t > t);
      if (next && next !== STROKES[0] && t > next.t - 0.06) {
        const tr = chan(STROKES.indexOf(next)), u = (t - (next.t - 0.06)) / 0.06, i1 = Math.floor(u * tr.length);
        trace2(p, tr, C5[3], 1);
        trace2(p, tr, C5[6], 1, i1 - 18, i1);
        for (let i = Math.max(0, i1 - 18); i < Math.min(tr.length, i1); i += 4) if (tr[i][1] > TOP + 14) p.glow(tr[i][0], tr[i][1], 9, C5[4], 0.35);
      } else if (s && s.k > 0) {
        const hero = s.i === 0 && s.a < 1 / 30;
        stroke(p, bolts[s.i], s.k, C5, s.i === 0 ? 1.5 : 1.2, { hero, core: s.k > 0.6 ? hero ? 1.2 : 0.8 : 0, minY: TOP + 14 });
        const r = 4.5 * s.k;
        p.circle(0, -1, r + 1.5, C5[2]);
        p.circle(0, -1, r + 0.5, C5[5]);
        p.circle(0, -1, r * 0.65, WHITE);
        if (s.a < 0.07) sparkle(p, 0, -2, Math.round(12 * s.k * (1 - s.a / 0.07)), C5[6], C5[4], 0.25);
        p.glow(0, -16, 96, C5[3], 0.42 * s.k);
        p.glow(0, -3, 22, C5[5], 0.3 * s.k);
        if (hero) p.glow(X0 * 0.5, -110, 170, C5[3], 0.3);
      } else if (s) {
        const crumble = s.i === STROKES.length - 1, cool = clamp((s.a - 0.23) / 0.45), tr = chan(s.i);
        for (let i = 0; i < tr.length - 1; i++) {
          if (crumble && t >= gone[i]) continue;
          const h = crumble ? 1 - clamp((t - last2.t - 0.23) / (gone[i] - last2.t - 0.23)) : 1 - cool;
          p.line(tr[i][0], tr[i][1], tr[i + 1][0], tr[i + 1][1], h > 0.7 ? C5[5] : h > 0.4 ? C5[4] : h > 0.15 ? C5[3] : C5[2]);
          if (i % 6 === 0 && h > 0.3 && tr[i][1] > TOP + 14) p.glow(tr[i][0], tr[i][1], 6, C5[4], 0.15 * h);
        }
      }
      if (s && s.a < 0.4) {
        const r = rng(o.seed, 91, f), run = s.i === 0 ? REACH * ease.outCubic(clamp(s.a / 0.35)) : REACH * clamp(s.a / 0.22);
        for (const br of tree) {
          if (br.w < 1 || r.next() < 0.3) continue;
          const i1 = br.pts.findIndex(([, , d]) => d > run), j1 = i1 < 0 ? br.pts.length : i1, j0 = Math.max(0, j1 - r.int(7, 13));
          const pts = br.pts.slice(j0, j1).map(([x, y]) => [x + r.range(-0.6, 0.6), y - 1.5 - r.range(0, 2.5)]);
          if (pts.length > 1) crackle(p, { paths: [{ pts, w: 1 }] }, 0.9 * (1 - s.a / 0.4) + 0.1, C5, 0.35);
        }
      }
      ps.draw(p, "front");
      hot.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/lightning/thunderclap.js
var thunderclap_exports = {};
__export(thunderclap_exports, {
  act: () => act6,
  create: () => create11,
  meta: () => meta20
});
var meta20 = {
  name: "Thunderclap",
  desc: "A thunderclap round the caster: a white flash, forked bolts burst out and stab the floor, a heavy shock ring tears across the ground raising dust and grit, sparks streak away.",
  tags: ["lightning", "electric", "nova", "aoe", "spell", "shockwave", "one-shot"],
  size: [288, 156],
  origin: [144, 124],
  duration: 1.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: VOLT, sparks: PLASMA, reach: 104, seed: 6 }
};
var WIDE = { turn: 1.15, crouch: 5, lean: -1, fx: -15, fy: -33, bx: 15, by: -33, ffx: -7, fbx: 8 };
var CLAP_ = { turn: 1.15, y: -2, crouch: 0, fx: -1, fy: -45, bx: 1, by: -45, ffx: -3, ffy: -5, fbx: 4, fby: -5 };
var act6 = {
  onBody: true,
  follow: 0,
  target: { x: 104 },
  poses: [
    [-0.46, READY],
    [-0.18, WIDE],
    [0.08, { ...WIDE, crouch: 6 }],
    [0.12, CLAP_, "snap"],
    [0.55, { ...CLAP_, y: 0, ffy: -4, fby: -4, crouch: 1 }],
    [1.05, { turn: 1, crouch: 3, fx: -10, fy: -28, bx: 11, by: -28, ffx: -4, fbx: 5 }],
    [1.7, READY]
  ],
  hits: [
    { t: 0.12, stop: 0.13, shake: 0.3, amp: 3, target: false },
    { t: 0.42, push: 2, straw: 14, y: -8, skin: "shock", shiver: 0.5 },
    { t: 1.2, push: 0, straw: 0, flash: 0, skin: null }
  ]
};
var CLAP = 0.12;
var CY = -22;
var BK = [1, 0.7, 0.95, 0.5, 0.8, 0.3];
var DUST5 = hex("#6e6382");
var STONE3 = ["#655b7a", "#4a4263", "#342d45"].map(hex);
var ASH2 = hex("#5b5566");
function create11(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), REACH2 = o.reach, floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: o.sparks }), hot = new Particles({ rng: R4, ground: floor }), lights = new Lights();
  const bolts = Array.from({ length: 8 }, (_, i) => {
    const down = i % 2 === 0, side = i % 4 < 2 ? -1 : 1, a = down ? side > 0 ? R4.range(0.35, 0.75) : Math.PI - R4.range(0.35, 0.75) : side > 0 ? -R4.range(0.15, 1.2) : Math.PI + R4.range(0.15, 1.2);
    const L4 = down ? -CY / Math.sin(a) : R4.range(40, 62), x1 = Math.cos(a) * L4, y1 = down ? 0 : CY + Math.sin(a) * L4;
    return { down, x1, y1, t0: CLAP + R4.range(0, 0.06) };
  });
  const front = (t2) => t2 < CLAP ? 0 : 8 + (REACH2 - 8) * ease.outCubic(clamp((t2 - CLAP) / 0.5));
  let t = 0, clapped = false;
  const landed = bolts.map(() => false);
  return {
    update(dt) {
      t += dt;
      if (t < CLAP && R4.chance(60 * dt)) {
        const a = R4.range(0, TAU), d = R4.range(16, 30), T4 = R4.range(0.07, 0.1), v = d * 3 / (Math.exp(3 * T4) - 1);
        ps.spawn(P.STREAK, Math.cos(a) * d, CY + Math.sin(a) * d * 0.8, -Math.cos(a) * v, -Math.sin(a) * v * 0.8, T4, R4.chance(0.5) ? C5[6] : C5[5]);
      }
      if (t >= CLAP && !clapped) {
        clapped = true;
        lights.add(0, CY - 10, 100, C5[4], 0.65, 0.45);
        lights.add(0, CY, 26, WHITE, 0.5, 0.07);
        for (let i = 0; i < 64; i++) {
          const a = R4.range(0, TAU), sp = R4.range(170, 380) * (Math.sin(a) > 0.4 ? 0.5 : 1);
          ps.spawn(P.SPARK, Math.cos(a) * 6, CY + Math.sin(a) * 6, Math.cos(a) * sp, Math.sin(a) * sp - 40, R4.range(0.2, 0.55));
        }
        for (let i = 0; i < 8; i++) ps.spawn(P.SMOKE, R4.range(-8, 8), CY + R4.range(-6, 6), R4.range(-25, 25), -R4.range(10, 30), R4.range(0.8, 1.3), mix(ASH2, C5[4], 0.3), R4.range(4, 7), R4.range(0.05, 0.2));
      }
      for (const [i, b] of bolts.entries())
        if (b.down && !landed[i] && t >= b.t0) {
          landed[i] = true;
          lights.add(b.x1, -4, 46, C5[4], 0.7, 0.25);
          for (let j = 0; j < 12; j++) {
            const a = -Math.PI / 2 + R4.range(-1.2, 1.2), sp = R4.range(70, 240);
            ps.spawn(P.SPARK, b.x1, -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.2, 0.5));
          }
          for (let j = 0; j < 5; j++) hot.spawn(P.SPARK, b.x1 + R4.range(-2, 2), -1, R4.range(-80, 80), -R4.range(60, 180), R4.range(0.4, 0.8));
        }
      const fr = front(t);
      if (t > CLAP && t < CLAP + 0.5)
        for (const s of [-1, 1]) {
          if (R4.chance(70 * dt)) ps.spawn(P.SMOKE, s * fr + R4.range(-3, 3), -R4.range(1, 4), s * R4.range(10, 40), -R4.range(5, 20), R4.range(0.6, 1.1), DUST5, R4.range(3, 6) * (1 - 0.4 * (fr / REACH2)), 0, PF.BIG);
          if (R4.chance(50 * dt)) ps.spawn(P.GRIT, s * fr, -1, s * R4.range(10, 60), -R4.range(60, 180), R4.range(0.8, 1.3), R4.pick(STONE3), R4.chance(0.3) ? 2 : 1);
        }
      ps.update(dt);
      hot.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      for (const b of bolts) if (b.down && t >= b.t0) scorch(p, b.x1, 0, 9, Math.pow(clamp(1 - (t - b.t0) / 1.1), 1.3), 1 - smooth(1.4, 1.85, t));
      const u = (t - CLAP) / 0.5;
      if (u > 0 && u < 1) band(p, 0, 0.5, front(t), 0.18, Math.max(2, 16 * (1 - u)), 1.25 - u, [C5[1], C5[2], C5[4], C5[6]], (g) => Math.sin(g) < 0, u < 0.15);
      ps.draw(p, "back");
      hot.draw(p, "back");
    },
    draw(p) {
      const f = Math.floor(t * 30 + 1e-4), u = (t - CLAP) / 0.5, A2 = o.actor;
      const a = t - CLAP;
      if (a >= 0 && a < 0.07) p.mask(A2.mask, A2.x, A2.y, a < 0.035 ? WHITE : C5[6]);
      if (a >= 0 && a < 0.2) {
        const q = a / 0.2;
        flare(p, 0, CY, 44 * Math.pow(1 - q, 1.4), 1 - q, C5);
        if (q < 0.35) p.circle(0, CY, 10 * (1 - q * 2) + 2, WHITE);
        p.glow(0, CY, 44, C5[5], 0.32 * (1 - q));
      }
      for (const [i, b] of bolts.entries()) {
        const ba = Math.floor((t - b.t0) * 30 + 1e-4);
        if (t < b.t0 || ba >= BK.length) continue;
        const r = rng(o.seed, 3, i, ba >> 1);
        stroke(p, zigzag(r, 0, CY, b.x1, b.y1, 0.25, b.down ? 0.5 : 0.8), BK[ba], C5, ba === 0 ? 1 : 0.8, { hero: ba === 0 });
        if (b.down) {
          p.circle(b.x1, -1, 3 * BK[ba] + 1, C5[5]);
          p.px(b.x1, -1, WHITE);
          p.glow(b.x1, -3, 20, C5[5], 0.5 * BK[ba]);
        } else if (ba < 2) sparkle(p, b.x1, b.y1, 4, C5[6], C5[4], 0.4);
      }
      if (u > 0 && u < 1) {
        band(p, 0, 0.5, front(t), 0.18, Math.max(2, 16 * (1 - u)), 1.25 - u, [C5[1], C5[2], C5[4], C5[6]], (g) => Math.sin(g) >= 0, u < 0.15);
        for (const s of [-1, 1]) p.glow(s * front(t), -3, 28, C5[4], 0.45 * (1 - u));
        const ua = (t - CLAP) / 0.26;
        const ra = 8 + 60 * ease.outCubic(ua);
        if (ua < 1) p.ring(0, CY, ra, Math.max(1, 2 * (1 - ua)), ua < 0.25 ? C5[5] : ua < 0.6 ? C5[4] : C5[3], (v, g) => CY + Math.sin(g) * ra > -1 ? 0 : 0.85 - 0.85 * ua);
      }
      if (a > 0.2 && a < 0.9) {
        const r = rng(o.seed, 9, f), k = 1 - (a - 0.2) / 0.7;
        if (r.next() < 0.8) {
          const x0 = r.range(-14, 14), y0 = r.range(-34, -4), b = r.range(0, TAU), l = r.range(6, 13);
          crackle(p, zigzag(r, x0, y0, x0 + Math.cos(b) * l, y0 + Math.sin(b) * l, 0.4, 0.3), 0.85 * k + 0.1, C5, 0.35);
        }
      }
      ps.draw(p, "front");
      hot.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/holy/heal-aoe.js
var heal_aoe_exports = {};
__export(heal_aoe_exports, {
  create: () => create12,
  meta: () => meta21
});

// ../pixelfx/src/fx/holy/_lib.js
var GOLD = ["#3b1d2a", "#7a3a2c", "#c4652e", "#f0a040", "#ffd25e", "#fff0a0", "#fffbe0", "#ffffff"];
var GREEN = ["#0e2a24", "#14472f", "#1d6e3a", "#2f9a45", "#5cc654", "#a0e46c", "#dcffb4", "#ffffff"];
var SHAPES = /* @__PURE__ */ new WeakMap();
function shapeOf(A2) {
  let s = SHAPES.get(A2.mask);
  if (s && s.x === A2.x && s.y === A2.y) return s;
  const m = A2.mask, inside2 = (i, j) => i >= 0 && j >= 0 && i < m.w && j < m.h && m.data[j * m.w + i] > 0;
  const edge = [], out = [];
  for (let j = -1; j <= m.h; j++)
    for (let i = -1; i <= m.w; i++) {
      const nb = inside2(i - 1, j) + inside2(i + 1, j) + inside2(i, j - 1) + inside2(i, j + 1);
      if (inside2(i, j)) {
        if (nb < 4) edge.push([A2.x + i, A2.y + j]);
      } else if (nb) out.push([A2.x + i, A2.y + j]);
    }
  s = { x: A2.x, y: A2.y, edge, out, top: A2.y, bottom: A2.y + m.h, at: (x, y) => inside2(Math.floor(x) - A2.x, Math.floor(y) - A2.y) };
  SHAPES.set(A2.mask, s);
  return s;
}
function oval(p, cx, cy, rx, ry, c, a = 1, keep2 = null) {
  if (rx < 0.5) return;
  const n = Math.ceil(Math.max(rx, ry) * TAU * 1.5) + 6, fc = typeof c === "function", fa = typeof a === "function";
  for (let j = 0; j < n; j++) {
    const g = j / n * TAU;
    if (keep2 && !keep2(g)) continue;
    p.dot(cx + Math.cos(g) * rx, cy + Math.sin(g) * ry, fc ? c(g) : c, fa ? a(g) : a);
  }
}
function plus(p, x, y, L4, th, R4, a = 1, glint2 = false) {
  const n = R4.length, X = Math.round(x), Y = Math.round(y), w = th > 1 ? 1 : 0;
  const ins = (i, j) => Math.abs(i) <= w && Math.abs(j) <= L4 || Math.abs(j) <= w && Math.abs(i) <= L4;
  for (let j = -L4 - 1; j <= L4 + 1; j++)
    for (let i = -L4 - 1; i <= L4 + 1; i++) {
      if (!ins(i, j)) {
        if (w && (ins(i - 1, j) || ins(i + 1, j) || ins(i, j - 1) || ins(i, j + 1))) p.dot(X + i, Y + j, R4[Math.max(0, n - 6)], a * 0.9);
        continue;
      }
      let c;
      if (!w) c = i === 0 && j === 0 ? WHITE : Math.abs(i) + Math.abs(j) >= L4 ? R4[n - 3] : R4[n - 2];
      else if (i === 0 && j === 0) c = WHITE;
      else if (i === 0 || j === 0) c = Math.abs(i) + Math.abs(j) < L4 ? R4[n - 2] : R4[n - 3];
      else c = i < 0 || j < 0 ? R4[n - 3] : R4[n - 5];
      if (glint2 && (i === 0 && j === -L4 || i === -L4 && j === 0)) c = WHITE;
      p.dot(X + i, Y + j, c, a);
    }
}

// ../pixelfx/src/fx/holy/heal-aoe.js
var meta21 = {
  name: "Healing ring",
  desc: "A seed of green light sinks into the floor and a soft ring rolls out from it; the floor glows where it passes and plus signs sprout and float up.",
  tags: ["holy", "heal", "aoe", "ring", "plus", "ground", "one-shot"],
  size: [256, 136],
  origin: [128, 104],
  duration: 2.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: GREEN, reach: 104, seed: 6 }
};
var SY2 = 0.2;
var SEED = 0.3;
var ROLL = 1;
function create12(o) {
  const C5 = fit(o.palette, 8), REACH2 = o.reach, R4 = new Rng(o.seed);
  const ps = new Particles({ rng: R4, ground: () => 0, sparks: [WHITE, C5[6], C5[5], C5[4]] });
  const lights = new Lights();
  const front = (tt) => tt < SEED ? 0 : REACH2 * ease.outCubic(seg(tt, SEED, SEED + ROLL));
  const passed = (d) => SEED + ROLL * (1 - Math.cbrt(1 - Math.min(0.999, d / REACH2)));
  const sites = Array.from({ length: 26 }, (_, i) => {
    const a = R4.range(0, TAU), d = REACH2 * Math.sqrt(R4.range(0.04, 0.92)), big = i % 5 < 2;
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, t0: passed(d) + R4.range(0, 0.06), rise: R4.range(18, 34), life: R4.range(0.9, 1.3), sway: R4.range(0, TAU), L: big ? 3 + (i % 5 === 0 ? 1 : 0) : i % 5 === 2 ? 1 : 2, thick: big ? 3 : 1, popped: false };
  });
  const riders = Array.from({ length: 14 }, (_, i) => ({ a: i / 14 * TAU + R4.range(-0.2, 0.2), w: R4.range(0.6, 1.1) * (i % 2 ? 1 : -1) }));
  let t = 0, released = false;
  function wash(p) {
    const fr = front(t);
    if (fr < 2 || t > 2.6) return;
    p.shade(-fr - 1, -fr * SY2 - 1, fr + 1, fr * SY2 + 1, (x, y, out) => {
      const d = Math.hypot(x, y / SY2);
      if (d > fr) return;
      const age = t - passed(d), k = Math.exp(-age / 0.35) * smooth(fr, fr - 6, d) * (1 - smooth(1.4, 1.9, t));
      if (k < 0.04) return;
      out.l = C5[4];
      out.k = 0.32 * k;
    });
  }
  function ring4(p, back) {
    if (t < SEED) return;
    const u = seg(t, SEED, SEED + ROLL + 0.25), fr = front(t), k = u < 0.7 ? 1 : (1 - u) / 0.3;
    if (k <= 0) return;
    const keep2 = back ? (g) => Math.sin(g) < 0 : (g) => Math.sin(g) >= 0;
    band(p, 0, 0, fr, SY2, Math.max(2, 7 * (1 - u * 0.7)), k, C5.slice(2), keep2, t < SEED + 0.08);
    oval(p, 0, 0, fr + 1, (fr + 1) * SY2, (g) => Math.sin(g) > 0.3 ? WHITE : C5[6], k * (back ? 0.7 : 1), keep2);
    for (let j = 0, n = Math.ceil(fr * 0.9); j < n; j++) {
      const g = j / n * TAU, near = Math.sin(g) >= 0;
      if (near === back || rand(j, Math.floor(t * 20)) > 0.45) continue;
      const x = Math.cos(g) * fr, y = Math.sin(g) * fr * SY2, h = (1 + rand(j, 7) * 4) * k * (near ? 1 : 0.6);
      for (let i = 1; i <= h; i++) p.dot(x, y - i, i > h - 1 ? WHITE : C5[6], k * (1.2 - i / (h + 1)));
    }
    for (const r of riders) {
      const g = r.a + r.w * (t - SEED) * 2.2, near = Math.sin(g) >= 0;
      if (near === back) continue;
      const x = Math.cos(g) * fr, y = Math.sin(g) * fr * SY2;
      if (near) sparkle(p, x, y - 1, 2 + (Math.sin(t * 9 + r.a * 5) > 0.3 ? 1 : 0), WHITE, C5[6], 0.35 * k);
      else p.dot(x, y, C5[6], k);
    }
    if (!back) for (let i = 0; i < 8; i++) {
      const g = i / 8 * TAU;
      p.glow(Math.cos(g) * fr, Math.sin(g) * fr * SY2 - 2, 16, C5[4], 0.22 * k);
    }
  }
  function sprouts(p, back) {
    for (const s of sites) {
      const a = t - s.t0;
      if (a < 0 || a > s.life || s.z < 0 !== back) continue;
      const u = a / s.life, h = s.rise * ease.outCubic(u), x = s.x + Math.sin(a * 4 + s.sway) * 1.5 * u, y = s.z * SY2 - 2 - h;
      const pop = ease.outBack(clamp(a / 0.12), 2.6), end = s.life - 0.15, L4 = Math.max(1, Math.round(s.L * pop - (back ? 1 : 0)));
      if (a < 0.04) sparkle(p, x, y, 3, WHITE, C5[6], 0.5);
      else if (a < end) plus(p, x, y, L4, back && L4 < 3 ? 1 : s.thick, back ? C5.slice(0, 7) : C5, back ? 0.8 : 1, !back && Math.sin(a * 12 + s.sway * 3) > 0.8);
      else {
        const v = (a - end) / 0.15;
        for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) p.dot(x + dx * (2 + v * 5), y + dy * (2 + v * 5) - v * 2, v < 0.4 ? WHITE : C5[6], 1 - v);
      }
      if (u < 0.5) for (let j = 1; j < h * (1 - u * 2); j += 1.5) p.dot(s.x, s.z * SY2 - 2 - h + j + 3, C5[5], (1 - j / h) * (1 - u * 2) * (back ? 0.5 : 0.8));
      p.glow(x, y, 7 + L4 * 2, C5[5], (back ? 0.2 : 0.34) * (a < end ? 1 : 1 - (a - end) / 0.15));
    }
  }
  return {
    update(dt) {
      t += dt;
      if (t < SEED - 0.04 && R4.chance(0.7)) {
        const a = R4.range(0, TAU), D17 = R4.range(24, 48), x = Math.cos(a) * D17, y = Math.sin(a) * D17 * SY2 - R4.range(1, 8);
        const T4 = R4.range(0.16, 0.24), l = Math.hypot(x, y + 3) || 1, v = l * 3 / (Math.exp(3 * T4) - 1);
        ps.spawn(P.STREAK, x, y, -x / l * v, (-3 - y) / l * v, T4, R4.chance(0.5) ? C5[6] : C5[5]);
      }
      if (!released && t >= SEED) {
        released = true;
        lights.add(0, -16, 76, C5[5], 0.85, 0.55);
        lights.add(0, -6, 28, WHITE, 0.8, 0.12);
        for (let i = 0; i < 10; i++) ps.spawn(P.MOTE, R4.range(-2, 2), -R4.range(2, 10), R4.range(-25, 25), -R4.range(80, 170), R4.range(0.3, 0.6), R4.chance(0.5) ? WHITE : C5[6], R4.range(0.6, 1));
        for (let i = 0; i < 16; i++) {
          const a = R4.range(Math.PI * 1.05, Math.PI * 1.95), sp = R4.range(40, 120);
          ps.spawn(P.STAR, 0, -3, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.4, 0.8), R4.chance(0.5) ? WHITE : C5[6], R4.range(0.6, 2));
        }
      }
      for (const s of sites)
        if (!s.popped && t >= s.t0) {
          s.popped = true;
          for (let i = 0; i < 3; i++) ps.spawn(P.STAR, s.x + R4.range(-3, 3), s.z * SY2 - 1, R4.range(-10, 10), -R4.range(15, 40), R4.range(0.3, 0.6), R4.chance(0.5) ? WHITE : C5[6], R4.range(0.5, 1.2), 0, s.z < 0 ? 4 : 0);
        }
      if (t > SEED + 0.1 && t < 1.9 && R4.chance(0.35)) {
        const fr = front(t), a = R4.range(0, TAU), d = fr * Math.sqrt(R4.next());
        ps.spawn(P.EMBER, Math.cos(a) * d, Math.sin(a) * d * SY2 - 1, R4.range(-5, 5), -R4.range(10, 30), R4.range(0.5, 1), C5[5], 1, 0, Math.sin(a) < 0 ? 4 : 0);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      wash(p);
      ring4(p, true);
      sprouts(p, true);
      ps.draw(p, "back");
    },
    draw(p) {
      ring4(p, false);
      if (t < SEED) {
        const k = t / SEED;
        sparkle(p, 0, -3, 2 + 4 * k * k, WHITE, C5[6], 0.3 + 0.4 * k);
        p.glow(0, -3, 10 + 16 * k, C5[4], 0.5 * k);
      } else if (t < SEED + 0.2) flare(p, 0, -3, 22 * Math.pow(1 - (t - SEED) / 0.2, 1.5), 1 - (t - SEED) / 0.2, C5.slice(3));
      const g = seg(t, SEED, SEED + 0.5);
      if (g > 0 && g < 1) {
        const top = -4 - 46 * ease.outCubic(Math.min(1, g * 2.2)) - 10 * g, bot = -2 - 50 * ease.inQuad(seg(g, 0.35, 1)), w = 1 + 2.4 * (1 - g);
        if (bot - top > 2) {
          p.beam(0, bot, 0, top, w * 2, (u, v) => v < 0.45 ? WHITE : u > 0.8 ? C5[5] : C5[6]);
          p.glowLine(0, bot, 0, top, 12, C5[5], 0.55 * (1 - g));
          sparkle(p, 0, top, 4 * (1 - g) + 1, WHITE, C5[6], 0.5 * (1 - g));
        }
      }
      sprouts(p, false);
      ps.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/holy/blessing.js
var blessing_exports = {};
__export(blessing_exports, {
  act: () => act7,
  draw: () => draw10,
  drawBack: () => drawBack8,
  meta: () => meta22
});
var meta22 = {
  name: "Blessing",
  desc: "A soft cone of light rests on the character from above; sparkles drift down through it, twinkling, and wink out where they land on the head and shoulders.",
  tags: ["holy", "blessing", "buff", "light", "sparkle", "character", "loop"],
  size: [80, 128],
  origin: [40, 108],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: GOLD, seed: 7 }
};
var OPEN = { turn: 1.15, fx: -13, fy: -31, bx: 14, by: -31, hy: -1, ffx: -3, fbx: 4 };
var act7 = {
  onBody: true,
  poses: [
    [0, OPEN],
    [0.75, { ...OPEN, fy: -33, by: -33 }],
    [1.5, { ...OPEN, crouch: -1, fy: -35, by: -35 }],
    [2.25, { ...OPEN, fy: -33, by: -33 }],
    [3, OPEN]
  ]
};
var TOP2 = -108;
var T = 3;
var halfW3 = (y) => lerp(5, 20, (y - TOP2) / -TOP2);
var RAYS = [[-0.62, 0.16, 1, 0.3], [-0.2, 0.2, 2, 1.7], [0.22, 0.14, 1, 4.1], [0.6, 0.18, 2, 2.6]];
var ray = (q, t) => {
  let I = 0.3 * Math.max(0, 1 - q * q);
  for (const [o, w, k, ph] of RAYS) I += Math.exp(-(((q - o) / w) ** 2)) * (0.55 + 0.45 * Math.sin(t / T * TAU * k + ph)) * 0.6;
  return I * smooth(1.25, 0.75, Math.abs(q));
};
var LANDS = /* @__PURE__ */ new Map();
function landings(o, S) {
  const key = `${o.seed}:${S.x}:${S.y}`;
  if (LANDS.has(key)) return LANDS.get(key);
  const out = [];
  for (let i = 0; i < 20; i++) {
    const R4 = rng(o.seed, i), q = R4.range(-0.9, 0.9), v = R4.range(22, 34), sway = R4.range(1, 3), ph = R4.range(0, TAU), size = R4.range(0.8, 2.4);
    let land = Infinity;
    for (let a = 0; a < 6; a += 0.02) {
      const y = TOP2 + 6 + v * a, x = q * halfW3(y) + Math.sin(a * 2.2 + ph) * sway;
      if (y >= -1 || S.at(x, y)) {
        land = a;
        break;
      }
    }
    out.push({ q, v, sway, ph, size, land });
  }
  LANDS.set(key, out);
  return out;
}
function drawBack8(p, t, o) {
  const C5 = fit(o.palette, 8);
  p.each(-24, TOP2, 24, 0.5, (x, y, sx, sy) => {
    const I = ray(x / halfW3(y), t) * (0.6 + 0.4 * smooth(TOP2, 0, y));
    if (I < 0.02) return;
    p.blendPx(sx, sy, C5[6], I * 0.13);
    p.add(sx, sy, C5[4], I * 0.22);
  });
  for (const [o2, , k, ph] of [RAYS[1], RAYS[2]])
    for (let y = TOP2; y < -1; y++) {
      const pulse2 = 0.5 + 0.5 * Math.sin(y * 0.11 - t / T * TAU * 3 + ph);
      p.dot(o2 * halfW3(y), y, pulse2 > 0.85 ? WHITE : C5[6], (0.1 + 0.45 * pulse2) * (0.5 + 0.5 * Math.sin(t / T * TAU * k + ph)) * smooth(TOP2, TOP2 + 20, y));
    }
  p.glow(0, -4, 30, C5[4], 0.22);
}
function draw10(p, t, o) {
  const C5 = fit(o.palette, 8), A2 = o.actor, S = A2 ? shapeOf(A2) : null;
  if (A2) {
    const m = A2.mask;
    for (let i = 0; i < m.w; i++)
      for (let j = 0; j < m.h; j++) {
        const c = A2.pixels[j * m.w + i];
        if (!c || luma(c) < 0.15) continue;
        p.px(A2.x + i, A2.y + j, mix(c, C5[6], 0.35));
        break;
      }
    p.glow(0, -30, 20, C5[5], 0.22);
  }
  for (let y = 0; y <= 3; y++)
    for (let x = -24; x <= 24; x++) {
      const u = Math.hypot(x / 24, y / 4);
      if (u >= 1) continue;
      p.dot(x, y, u < 0.3 ? y ? C5[5] : WHITE : u < 0.6 ? C5[5] : u < 0.85 ? C5[4] : C5[3], y === 0 ? Math.sqrt(1 - u) : (1 - u) * 0.7);
    }
  if (S) {
    const L4 = landings(o, S);
    cycle(t, T, L4.length, o.seed, (g) => 3, (age, life, R4, i) => {
      const s = L4[i], y = TOP2 + 6 + s.v * age, x = s.q * halfW3(y) + Math.sin(age * 2.2 + s.ph) * s.sway, fade = Math.min(1, age / 0.3);
      if (age > s.land) {
        const w = (age - s.land) / 0.14;
        if (w < 1) {
          const ly = TOP2 + 6 + s.v * s.land, lx = s.q * halfW3(ly) + Math.sin(s.land * 2.2 + s.ph) * s.sway;
          sparkle(p, lx, ly, 3 * (1 - w) + 1, WHITE, C5[6], 0.5 * (1 - w));
        }
        return;
      }
      const tw = 0.6 + 0.4 * Math.sin(age * (7 + i % 4) + s.ph);
      if (s.size > 1.2) sparkle(p, x, y, s.size * tw * fade, tw > 0.85 ? WHITE : C5[6], C5[5], 0.35 * fade);
      else {
        p.dot(x, y, tw > 0.8 ? WHITE : C5[6], fade);
        p.glow(x, y, 3, C5[5], 0.35 * fade);
      }
    });
  }
  cycle(t, T, 16, o.seed + 9, (g) => g.range(1.2, 2.4), (age, life, R4) => {
    const u = age / life, y = TOP2 + 10 + R4.range(0, 90) + u * R4.range(6, 14), q = R4.range(-1, 1), x = q * halfW3(y) + Math.sin(age * 1.7 + q * 5) * 1.5, k = Math.sin(u * Math.PI) * ray(q, t);
    if (k > 0.12) p.dot(x, y, k > 0.45 ? WHITE : C5[6], Math.min(1, k * 2.2));
  });
}

// ../pixelfx/src/fx/holy/divine-shield.js
var divine_shield_exports = {};
__export(divine_shield_exports, {
  act: () => act8,
  draw: () => draw11,
  drawBack: () => drawBack9,
  meta: () => meta23
});
var meta23 = {
  name: "Divine shield",
  desc: "A bubble of gold light round the character: a bright rim and a thin gold film, meridians turning like a slow globe, a sheen sweeping across and sparkles winking on it.",
  tags: ["holy", "shield", "bubble", "barrier", "buff", "character", "loop"],
  size: [88, 84],
  origin: [44, 68],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: GOLD, radius: 29, seed: 8 }
};
var BRACE = { turn: 0.7, crouch: 3, lean: 1, fx: 5, fy: -33, bx: 10, by: -20, ffx: 4, fbx: -2 };
var act8 = {
  onBody: true,
  poses: [
    [0, BRACE],
    [0.6, { ...BRACE, crouch: 4 }],
    [1.2, { ...BRACE, fy: -35, crouch: 3 }],
    [1.8, { ...BRACE, crouch: 4 }],
    [2.4, BRACE]
  ]
};
var CY2 = -22;
var TILT = 0.34;
var N2 = 4;
var FLOOR_SY = 0.26;
function onSphere(r, lat, lon) {
  const X = r * Math.cos(lat) * Math.sin(lon), Y = r * Math.sin(lat), Z = r * Math.cos(lat) * Math.cos(lon);
  return [X, CY2 - (Y * Math.cos(TILT) - Z * Math.sin(TILT)), Y * Math.sin(TILT) + Z * Math.cos(TILT)];
}
var sheen = (t, T4) => -1.7 + 3.4 * clamp(t / T4 % 1 / 0.55);
function lattice(p, t, o, back) {
  const C5 = fit(o.palette, 8), r = o.radius, T4 = meta23.duration, phi = t / T4 * (Math.PI / N2), sw = sheen(t, T4), seen = /* @__PURE__ */ new Map();
  const dot2 = (x, y, z) => {
    if (z < 0 !== back) return;
    const key = Math.floor(x) * 1e3 + Math.floor(y), f = Math.abs(z) / r, q = (x - (y - CY2)) / (r * 1.414), hot = Math.abs(q - sw) < 0.12 ? 1 : 0, v = seen.get(key);
    if (!v || f < v[2]) seen.set(key, [x, y, f, hot || (v ? v[3] : 0)]);
  };
  for (let k = 0; k < 2 * N2; k++) {
    const lon = phi + k * Math.PI / N2;
    for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += 0.7 / r) dot2(...onSphere(r, lat, lon));
  }
  for (let lon = 0; lon < TAU; lon += 0.7 / r) dot2(...onSphere(r, 0, lon));
  for (const [x, y, f, hot] of seen.values()) {
    if (back) p.blend(x, y, C5[4], 0.32);
    else if (hot) p.px(x, y, WHITE);
    else if (f < 0.4) p.px(x, y, C5[6]);
    else p.blend(x, y, f < 0.7 ? C5[6] : C5[5], f < 0.7 ? 0.8 : 0.55);
  }
}
function film(p, t, o, back) {
  const C5 = fit(o.palette, 8), r = o.radius, sw = sheen(t, meta23.duration);
  p.each(-r - 1, CY2 - r - 1, r + 1, CY2 + r + 1, (x, y, sx, sy) => {
    const d = Math.hypot(x, y - CY2) / r;
    if (d >= 1) return;
    const q = (x - (y - CY2)) / (r * 1.414), hot = Math.max(0, 1 - Math.abs(q - sw) / 0.22);
    const a = (back ? 0.07 : 0.03) + 0.26 * Math.pow(d, 6) + 0.2 * hot * (back ? 0.3 : 1);
    p.blendPx(sx, sy, hot > 0.5 && !back ? C5[6] : C5[5], a);
  });
}
function drawBack9(p, t, o) {
  const C5 = fit(o.palette, 8), r = o.radius, rf = Math.sqrt(r * r - CY2 * CY2);
  film(p, t, o, true);
  lattice(p, t, o, true);
  oval(p, 0, 0, rf, rf * FLOOR_SY, C5[5], 0.8, (g) => Math.sin(g) < 0);
  p.glow(0, CY2, r * 1.1, C5[4], 0.14);
}
function draw11(p, t, o) {
  const C5 = fit(o.palette, 8), r = o.radius, T4 = meta23.duration, rf = Math.sqrt(r * r - CY2 * CY2), A2 = o.actor;
  if (A2) for (const [x, y] of shapeOf(A2).out) p.light(x, y, C5[5], 0.3);
  film(p, t, o, false);
  lattice(p, t, o, false);
  const sw = sheen(t, T4);
  for (let j = 0, n = Math.ceil(r * TAU * 1.4); j < n; j++) {
    const g = j / n * TAU, x = Math.cos(g) * r, y = CY2 + Math.sin(g) * r, q = (x - (y - CY2)) / (r * 1.414);
    const lit = Math.cos(g + 2.36), hot = Math.abs(q - sw) < 0.15;
    p.dot(x, y, hot || lit > 0.75 ? WHITE : lit > -0.2 ? C5[6] : C5[5], 1);
    p.dot(Math.cos(g) * (r - 1), CY2 + Math.sin(g) * (r - 1), C5[4], 0.35 + 0.3 * lit);
  }
  p.glowRing(0, CY2, r, 6, C5[4], 0.32);
  const phi = t / T4 * (Math.PI / N2);
  for (let k = 0; k < 2 * N2; k++) {
    const [x, y, z] = onSphere(r, 0, phi + k * Math.PI / N2);
    if (z < r * 0.15) continue;
    p.px(x, y, WHITE);
    if (z > r * 0.45) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.blend(x + dx, y + dy, C5[6], 0.7);
    p.glow(x, y, 4, C5[5], 0.3);
  }
  const [px0, py0] = onSphere(r, Math.PI / 2, 0);
  sparkle(p, px0, py0, 2 + Math.round(1.5 + 1.5 * Math.sin(t / T4 * TAU * 2)), WHITE, C5[6], 0.45);
  for (const off of [0, Math.PI]) {
    const g = t / T4 * TAU + off + 0.8;
    sparkle(p, Math.cos(g) * r, CY2 + Math.sin(g) * r, 2, WHITE, C5[6], 0.4);
  }
  for (let g = 3.55; g < 4.2; g += 0.04) p.px(Math.cos(g) * r * 0.74, CY2 + Math.sin(g) * r * 0.74, g > 3.7 && g < 4.05 ? WHITE : C5[6]);
  p.px(Math.cos(3.4) * r * 0.62, CY2 + Math.sin(3.4) * r * 0.62, WHITE);
  for (let g = 0.45; g < 0.8; g += 0.05) p.dot(Math.cos(g) * r * 0.8, CY2 + Math.sin(g) * r * 0.8, C5[5], 0.6);
  oval(p, 0, 0, rf, rf * FLOOR_SY, (g) => Math.sin(g) > 0.6 ? WHITE : C5[6], 1, (g) => Math.sin(g) >= 0);
  for (let i = -2; i <= 2; i++) p.glow(i * rf * 0.5, 0, 12, C5[4], 0.18);
  cycle(t, T4, 9, o.seed, (g) => g.range(0.35, 0.6), (age, life, R4) => {
    const [x, y, z] = onSphere(r, R4.range(-1.2, 1.3), R4.range(0, TAU) + phi), k = Math.sin(age / life * Math.PI);
    if (z < 0) return;
    sparkle(p, x, y, 1 + 2.5 * k * R4.range(0.6, 1), WHITE, C5[6], 0.45 * k);
  });
  cycle(t, T4, 12, o.seed + 1, (g) => g.range(1.2, 2.2), (age, life, R4) => {
    const x0 = R4.range(-0.7, 0.7) * r, u = age / life, x = x0 + Math.sin(u * 6 + R4.range(0, 6)) * 2, y = CY2 + r * 0.75 - u * r * 1.4;
    if (Math.hypot(x, y - CY2) > r - 2) return;
    p.dot(x, y, u < 0.5 ? C5[6] : C5[5], Math.sin(u * Math.PI));
    p.light(x, y, C5[5], 0.4 * Math.sin(u * Math.PI));
  });
}

// ../pixelfx/src/fx/impacts/hit-spark.js
var hit_spark_exports = {};
__export(hit_spark_exports, {
  create: () => create13,
  meta: () => meta24
});
var meta24 = {
  name: "Hit spark",
  desc: "The everyday hit: a sharp, lopsided cross flare with one long ray along the blow round a white diamond core, then a cone of sparks and hot chips that fall and bounce.",
  tags: ["impact", "hit", "spark", "combat", "directional", "one-shot"],
  size: [136, 80],
  origin: [44, 64],
  duration: 0.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffe26b", "#fff3a6", "#ffffff"], height: 20, aim: 0.1, seed: 4 }
};
function ray2(p, x, y, a, L4, w, C5, from = 0) {
  const c = Math.cos(a), s = Math.sin(a);
  for (let d = from * L4; d <= L4; d += 0.5) {
    const u = d / L4, hw = w * Math.pow(1 - u, 1.6);
    const col = u < 0.3 ? WHITE : u < 0.62 ? C5[5] : u < 0.88 ? C5[4] : C5[3];
    p.px(x + c * d, y + s * d, col);
    if (hw > 0.45) for (let o = 0.5; o <= hw; o += 0.5) for (const e of [-o, o]) p.px(x + c * d - s * e, y + s * d + c * e, u < 0.3 && o < 1 ? C5[5] : C5[4]);
  }
}
function diamond(p, x, y, r, C5) {
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const m = Math.abs(dx) + Math.abs(dy);
      if (m <= r) p.px(x + dx, y + dy, WHITE);
      else if (m === r + 1) p.px(x + dx, y + dy, C5[3]);
    }
}
function create13(o) {
  const C5 = fit(o.palette, 7), R4 = new Rng(o.seed), X = 0, Y = -o.height, A2 = o.aim, floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [C5[6], C5[5], C5[4], C5[2]] });
  const lights = new Lights();
  const tilt = R4.range(-0.08, 0.08);
  const rays2 = [
    { a: A2 + tilt, L: R4.range(33, 37), w: 2.2 },
    { a: A2 + Math.PI + tilt, L: R4.range(8, 10), w: 2.2 },
    { a: A2 - Math.PI / 2 + tilt, L: R4.range(15, 18), w: 2.6 },
    { a: A2 + Math.PI / 2 + tilt, L: R4.range(10, 12), w: 2.3 },
    { a: A2 - Math.PI / 4 + tilt, L: R4.range(5, 7), w: 1 }
  ];
  lights.add(X, Y, 38, C5[4], 0.35, 0.18);
  lights.add(X + Math.cos(A2) * 10, Y + Math.sin(A2) * 10, 22, C5[5], 0.45, 0.1);
  lights.add(X, -2, 26, C5[3], 0.22, 0.22);
  for (let i = 0; i < 9; i++) {
    const a = A2 + R4.range(-0.6, 0.6) - 0.15, v = R4.range(170, 360);
    ps.spawn(P.SPARK, X + 1, Y, Math.cos(a) * v, Math.sin(a) * v - 40, R4.range(0.25, 0.45), WHITE, 1, i > 6 ? R4.range(0.01, 0.03) : 0);
  }
  for (let i = 0; i < 6; i++) {
    const a = A2 + R4.range(-1.1, 0.5) - 0.3, v = R4.range(70, 170);
    ps.spawn(P.GRIT, X + 1, Y, Math.cos(a) * v, Math.sin(a) * v - R4.range(30, 80), R4.range(0.35, 0.45), R4.pick([C5[5], C5[4], C5[4], C5[3]]), 1);
  }
  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      ps.draw(p);
      if (t < 0.025) {
        for (const r of rays2) ray2(p, X, Y, r.a, r.L, r.w, C5);
        diamond(p, X, Y, 4, C5);
      } else if (t < 0.058) {
        for (const r of rays2) ray2(p, X, Y, r.a, r.L * 1.2, r.w * 0.55, C5, 0.12);
        diamond(p, X, Y, 3, C5);
      } else if (t < 0.092) {
        const r = rays2[0];
        ray2(p, X, Y, r.a, r.L * 1.3, 0.6, [C5[0], C5[1], C5[2], C5[3], C5[3], C5[4]], 0.4);
      }
      const pop = Math.exp(-t / 0.045);
      if (pop > 0.02) {
        p.glow(X, Y, 22, C5[4], 0.3 * pop);
        p.glow(X, Y, 7, WHITE, 0.15 * pop);
        p.glowLine(X, Y, X + Math.cos(A2) * 26, Y + Math.sin(A2) * 26, 4, C5[5], 0.25 * pop);
      }
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/impacts/crit-hit.js
var crit_hit_exports = {};
__export(crit_hit_exports, {
  create: () => create14,
  meta: () => meta25
});

// ../pixelfx/src/fx/impacts/_lib.js
var SOOT4 = hex("#0d0a12");
var OUTLINE3 = hex("#1a1422");
var LIGHT2 = Math.atan2(-1, -1);
function spikes(R4, n, aim, { len: len2 = [7, 10], w = [1.5, 2.1], fwd = 1.8, back = 0.6, jag = 1, jit = 0.18 } = {}) {
  return Array.from({ length: n }, (_, i) => {
    const a = aim + i / n * TAU + R4.range(-jit, jit), cb = Math.cos(a - aim);
    const L4 = R4.range(len2[0], len2[1]) * (1 + fwd * Math.pow(Math.max(0, cb), 3) + back * Math.pow(Math.max(0, -cb), 3)) * (i % 2 ? jag : 1);
    return { a, len: L4, w: R4.range(w[0], w[1]) * (i % 2 ? Math.sqrt(jag) : 1) };
  });
}
function star2(p, x, y, list, sc, th, [rim, body2, inner, core], a = 1, heart = 2.4) {
  for (let pass = 0; pass < 3; pass++)
    for (const s of list) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), L4 = s.len * sc;
      for (let d = 0; d <= L4; d += 0.5) {
        if (pass === 2 && d > L4 * 0.55) break;
        const hw0 = s.w * th * (1 - d / L4) * Math.min(1, 0.5 + d / 3);
        const hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
        const col = pass === 0 ? rim : pass === 1 ? d < L4 * 0.35 ? inner : body2 : core;
        for (let o = -hw; o <= hw; o += 0.5) p.dot(x + c * d - sn * o, y + sn * d + c * o, col, a);
      }
    }
  const r = heart * sc * Math.sqrt(th);
  p.circle(x, y, r + 0.8, inner, a);
  p.circle(x, y, r, core, a);
}
function brokenRing(p, x, y, r, th, segs, brk, c, c2 = c, k = 1, sy = 1, maxY = Infinity) {
  if (r <= 0 || k <= 0) return;
  const full = TAU / segs.length;
  for (const s of segs) {
    const span = full * (1 - s.gap * brk) + 0.02, rr = r * (1 + s.dr * brk), m = Math.max(4, Math.ceil(rr * span * 1.8));
    for (let j = 0; j <= m; j++) {
      const u = j / m, ang = s.a + (u - 0.5) * span, w = Math.max(0.5, th * (s.w ?? 1) * (1 - brk * Math.pow(Math.abs(2 * u - 1), 1.6)));
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let o = -w / 2; o <= w / 2 + 0.01; o += 0.5) if (y + sa * (rr + o) * sy < maxY) p.dot(x + ca * (rr + o), y + sa * (rr + o) * sy, o > -0.26 ? c : c2, k);
    }
  }
}

// ../pixelfx/src/fx/impacts/crit-hit.js
var meta25 = {
  name: "Critical hit",
  desc: "A critical hit: a jagged starburst slams in white and overshoots, a ring breaks into flying arcs, sparks streak off, shards tumble to the floor under a big flare.",
  tags: ["impact", "hit", "crit", "critical", "combat", "directional", "one-shot"],
  size: [216, 136],
  origin: [84, 106],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a0510", "#5c0a1c", "#a3142a", "#e0302c", "#ff7a2a", "#ffc23d", "#fff09a", "#ffffff"], height: 26, aim: 0.12, seed: 3 }
};
var KEYS = [
  [0, 1, 1, 1, [6, 7, 7, 7]],
  [0.025, 1.3, 1, 1, [2, 5, 6, 7]],
  [0.058, 1.05, 0.72, 1, [2, 4, 5, 6]],
  [0.092, 1.22, 0.3, 1, [1, 2, 3, 4]],
  [0.125]
];
function flare2(p, x, y, L4, k, C5) {
  for (const [dx, dy, len2] of [[1, 0, L4], [0, 1, L4 * 0.45], [0.7, 0.7, L4 * 0.16], [0.7, -0.7, L4 * 0.16]])
    for (const s of [-1, 1])
      for (let d = 1; d <= len2; d++) {
        const u = d / len2, a = u < 0.7 ? 1 : k * (1.6 - u);
        p.dot(x + s * dx * d, y + s * dy * d, u < 0.35 ? WHITE : u < 0.7 ? C5[6] : C5[5], a);
        if (dy === 0 && u < 0.42) for (const e of [-1, 1]) p.dot(x + s * d, y + e, u < 0.2 ? C5[6] : C5[5], u < 0.3 ? 1 : k);
      }
  p.glowLine(x - L4, y, x + L4, y, 6, C5[6], 0.5 * k);
  p.glowLine(x, y - L4 * 0.45, x, y + L4 * 0.45, 4, C5[6], 0.3 * k);
}
function create14(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), X = 0, Y = -o.height, A2 = o.aim, floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [C5[7], C5[6], C5[5], C5[3]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const sp = spikes(R4, 14, A2, { len: [11, 15], w: [1.8, 2.5], fwd: 1.4, back: 0.6, jag: 0.5 });
  [...sp].sort((a, b) => b.len - a.len).slice(0, 2).forEach((s) => s.len *= 1.3);
  const segs = Array.from({ length: 7 }, (_, i) => {
    const a = A2 + i / 7 * TAU;
    return { a, gap: R4.range(0.55, 0.85), dr: R4.range(0.08, 0.4) + 0.15 * Math.max(0, Math.cos(a - A2)), w: 0.7 + 0.5 * Math.max(0, Math.cos(a - A2)) };
  });
  lights.add(X, Y, 84, C5[5], 0.6, 0.5);
  lights.add(X, Y, 30, WHITE, 0.7, 0.1);
  lights.add(X, -4, 44, C5[4], 0.3, 0.45);
  for (let i = 0; i < 36; i++) {
    const back = R4.chance(0.22), a = (back ? A2 + Math.PI : A2) + R4.range(-1, 1) * (back ? 0.6 : 0.8), v = R4.range(170, 430) * (back ? 0.6 : 1);
    ps.spawn(P.SPARK, X, Y, Math.cos(a) * v, Math.sin(a) * v - 50, R4.range(0.15, 0.5), WHITE, 1, R4.chance(0.3) ? R4.range(0, 0.04) : 0);
  }
  for (let i = 0; i < 10; i++) {
    const a = A2 + R4.range(-1, 1) * 1.1 - 0.35, v = R4.range(110, 280);
    bits.add({ kind: B.SHARD, x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 0.8, drag: 0.7, bounce: 0.35, life: R4.range(0.55, 0.85), a: R4.range(0, TAU), va: R4.range(-25, 25), s: R4.range(2, 4.5), c: R4.pick([C5[7], C5[6], C5[6], C5[5]]) });
  }
  for (let i = 0; i < 12; i++) {
    const a = A2 - Math.PI / 2 + R4.range(-1.4, 1.4), v = R4.range(35, 110);
    ps.spawn(P.MOTE, X + Math.cos(a) * 4, Y + Math.sin(a) * 4, Math.cos(a) * v, Math.sin(a) * v - 15, R4.range(0.35, 0.7), R4.pick([C5[6], C5[5], C5[5]]), 0.6, R4.range(0, 0.05));
  }
  for (let i = 0; i < 5; i++) {
    const a = R4.range(0, TAU), d = R4.range(14, 34);
    ps.spawn(P.STAR, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, 0, -4, R4.range(0.22, 0.38), R4.chance(0.5) ? C5[6] : WHITE, R4.range(1.6, 3), R4.range(0.08, 0.32));
  }
  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      bits.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const u = clamp((t - 0.03) / 0.37);
      if (t >= 0.03 && u < 1) {
        const r = 10 + 30 * ease.outCubic(u), brk = smooth(0.12, 0.6, u), th = Math.max(1, 3.6 * Math.pow(1 - u, 1.2));
        const i = u < 0.12 ? 7 : u < 0.3 ? 6 : u < 0.5 ? 5 : u < 0.75 ? 4 : 3;
        brokenRing(p, X, Y, r, th, segs, brk, C5[i], C5[Math.max(2, i - 2)], u < 0.6 ? 1 : (1 - u) / 0.4, 1, 0);
        if (u < 0.6) p.glowRing(X, Y, r, 6, C5[5], 0.35 * Math.pow(1 - u / 0.6, 2));
      }
      bits.draw(p);
      ps.draw(p);
      const f = (t - 0.04) / 0.28;
      if (f > 0 && f < 1) {
        flare2(p, X, Y, 64 * Math.pow(1 - f, 1.3), 1 - f, C5);
        p.glow(X, Y, 56, C5[5], 0.4 * (1 - f));
      }
      for (let i = 0; i < KEYS.length - 1; i++)
        if (t >= KEYS[i][0] && t < KEYS[i + 1][0]) {
          const [, sc, th, a, cols] = KEYS[i];
          star2(p, X, Y, sp, sc, th, cols.map((j) => C5[j]), a, 2.6);
        }
      const pop = Math.exp(-t / 0.05);
      if (pop > 0.02) {
        p.glow(X, Y, 44, C5[5], 0.4 * pop);
        p.glow(X, Y, 12, WHITE, 0.6 * pop);
      }
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/explosions/small-explosion.js
var small_explosion_exports = {};
__export(small_explosion_exports, {
  create: () => create15,
  meta: () => meta26
});
var meta26 = {
  name: "Explosion",
  desc: "A ground blast: a white flash and shock rings, fire that cools into a rolling smoke column, sparks, burning brands that land and keep burning, tumbling rocks and a glowing scorch.",
  tags: ["explosion", "fire", "smoke", "debris", "impact", "one-shot"],
  size: [300, 240],
  origin: [150, 196],
  duration: 5.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], stone: "#4a3f69", size: 1, seed: 7 }
};
var SOOT5 = hex("#0d0a12");
var SOOT23 = hex("#17121d");
var OUTLINE4 = hex("#1a1422");
var WARM2 = rgb(255, 176, 96);
function stone3(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3) };
}
function scorch2(p, F, t, rx0, cool, fade) {
  if (fade <= 0) return;
  const rx = rx0 * Math.min(1, t / 0.08), ry = 4, heat2 = [...F].reverse();
  for (let y = 0; y <= 2; y++)
    for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
      const dx = (x + 0.5) / rx, dy = (y + 0.5) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const k = rand(x * 31 + y, 3), T4 = Math.pow(clamp(1 - t / cool), 1.4) * (1.25 - d) - k * 0.35;
      if (T4 > 0.06) {
        const c = heat2[Math.min(heat2.length - 1, Math.floor((1 - Math.min(1, T4)) * (heat2.length - 1)))];
        p.dot(x, y, c, fade);
        if ((x & 3) === 0) p.glow(x + 0.5, y, 6, c, 0.18 * T4 * fade);
      } else p.dot(x, y, d < 0.5 ? SOOT5 : SOOT23, (d < 0.95 - k * 0.3 ? 1 : 1 - d) * fade);
    }
}
function rock4(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE4 : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}
function create15(o) {
  const F = fit(o.palette, 8), S = o.size, RAD = 18 * S, POWER = 0.9 * Math.pow(S, 0.8), EARTH = 1.6, st = stone3(o.stone);
  const R4 = new Rng(o.seed), floor = () => 0;
  let blazes;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [F[6], F[5], F[3], F[2]], onLand: (x, y) => blazes.add(x, y - 0.25, R4.range(0.9, 1.5), R4.range(0.55, 0.85)) });
  blazes = new Blazes(ps);
  const rocks = new Bits({ ground: floor }), lights = new Lights(), flashes = [], rings = [];
  const Y = -RAD * 0.3;
  let t = 0;
  flashes.push({ r: RAD * 1.05, life: 0.06, max: 0.06 });
  rings.push({ r0: RAD * 0.45, r1: RAD * 2.7, life: 0.34, max: 0.34, thick: 3, c: F[5] }, { r0: RAD * 0.3, r1: RAD * 1.6, life: 0.22, max: 0.22, thick: 1.8, c: F[3] });
  lights.add(0, Y, RAD * 3.4, WARM2, 0.6 * POWER, 0.7);
  lights.add(0, Y, RAD * 1.6, WHITE, 0.6, 0.08);
  for (let i = 0; i < 5; i++) ps.spawn(P.FIRE, R4.range(-2.5, 2.5), Y + R4.range(-2.5, 2.5), R4.range(-20, 20), R4.range(-40, -10), R4.range(0.18, 0.3), 0, R4.range(RAD * 0.4, RAD * 0.55));
  for (let i = 0; i < Math.round(28 * POWER); i++) {
    const a = R4.range(0, TAU), d = R4.range(0, RAD * 0.55), sp = R4.range(40, 210) * POWER;
    ps.spawn(P.FIRE, Math.cos(a) * d, Y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp * 0.8 - 40, R4.range(0.55, 1.15), 0, R4.range(RAD * 0.22, RAD * 0.46), 0, R4.chance(0.45) ? PF.SMOKES | PF.BIG : 0);
  }
  for (let i = 0; i < 5; i++) {
    const a = R4.range(0, TAU), d = R4.range(RAD * 0.1, RAD * 0.5);
    ps.spawn(P.SMOKE, Math.cos(a) * d, Y + Math.sin(a) * d, Math.cos(a) * 30, Math.sin(a) * 20 - 30, R4.range(0.9, 1.5), rgb(34, 29, 38), R4.range(RAD * 0.15, RAD * 0.26), R4.range(0.06, 0.2), PF.BIG);
  }
  for (let i = 0; i < 5; i++) ps.spawn(P.FIRE, R4.range(-RAD * 0.25, RAD * 0.25), Y, R4.range(-12, 12), R4.range(-180, -100), R4.range(0.8, 1.3), 0, R4.range(RAD * 0.24, RAD * 0.36), R4.range(0, 0.1), R4.chance(0.6) ? PF.SMOKES | PF.BIG : 0);
  for (let i = 0; i < Math.round(10 * POWER); i++) {
    const a = R4.range(0, TAU), d = R4.range(0, RAD * 0.7), sp = R4.range(15, 100);
    ps.spawn(P.SMOKE, Math.cos(a) * d, Y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp * 0.6 - 35, R4.range(1.8, 2.8), 0, R4.range(RAD * 0.26, RAD * 0.44), R4.range(0.12, 0.45), PF.BIG);
  }
  for (let i = 0; i < Math.round(80 * POWER); i++) {
    const a = R4.range(0, TAU), sp = R4.range(140, 380) * POWER;
    ps.spawn(P.SPARK, 0, Y, Math.cos(a) * sp, Math.sin(a) * sp - 70, R4.range(0.18, 0.6));
  }
  for (let i = 0; i < Math.round(40 * POWER); i++) {
    const a = R4.range(0, TAU), sp = R4.range(30, 150);
    ps.spawn(P.EMBER, Math.cos(a) * RAD * 0.4, Y + Math.sin(a) * RAD * 0.4, Math.cos(a) * sp, Math.sin(a) * sp - 75, R4.range(1.2, 2.6), F[3]);
  }
  for (let i = 0; i < Math.round(R4.range(9, 14) * Math.max(0, POWER - 0.55)); i++) {
    const a = -Math.PI / 2 + R4.range(-1.35, 1.35), sp = R4.range(170, 330);
    ps.spawn(P.BRAND, 0, Y, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.7, 1.3));
  }
  for (let i = 0; i < Math.round(RAD * 0.5); i++) {
    const s = R4.sign();
    ps.spawn(P.SMOKE, s * R4.range(0, RAD * 0.6), -R4.range(1, 5 + RAD * 0.04), s * R4.range(3, 9.5) * RAD, -R4.range(2, 15), R4.range(1.1, 2), st.dust, R4.range(4, 7) + RAD / 6, R4.range(0, 0.06), PF.BIG);
  }
  for (let i = 0; i < 26 * Math.min(1.5, S); i++)
    rocks.add({ kind: B.CHUNK, x: R4.range(-0.4, 0.4) * RAD, y: -3, vx: R4.range(-9, 9) * RAD * 0.25, vy: -R4.range(7, 16) * RAD * 0.9, g: 1, drag: 0.4, bounce: 0.3, life: R4.range(1.8, 2.6), a: R4.range(0, TAU), va: R4.range(-16, 16), s: R4.int(1, 3) });
  for (let i = 0; i < Math.round(EARTH * RAD * 4); i++) {
    const u = R4.range(-1, 1), a = -Math.PI / 2 + u * 0.5, sp = R4.range(5, 15) * RAD * (1 - 0.45 * Math.abs(u));
    ps.spawn(P.GRIT, u * 0.25 * RAD, -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1.2, 2.2), R4.pick([st.light, st.body, st.body, st.shade]), R4.chance(0.45) ? 2 : 1);
  }
  for (let i = 0; i < Math.round(EARTH * 12); i++)
    ps.spawn(P.SMOKE, R4.range(-0.3, 0.3) * RAD, -R4.range(2, RAD * 0.6), R4.range(-15, 15), -R4.range(60, 190) * EARTH * 0.6, R4.range(1.6, 2.6), st.dust, R4.range(5, 9) * Math.sqrt(S) + RAD / 7, R4.range(0, 0.15), PF.BIG);
  return {
    update(dt) {
      t += dt;
      for (const a of [flashes, rings]) for (let i = a.length - 1; i >= 0; i--) if ((a[i].life -= dt) <= 0) a.splice(i, 1);
      rocks.update(dt);
      for (const b of rocks.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 3; i++) ps.spawn(P.DUST, b.x + R4.range(-1.5, 1.5), -0.5, R4.sign() * R4.range(10, 55) * 0.6, -R4.range(2, 22), R4.range(0.3, 0.65), st.dust, R4.range(1.3, 2.8));
        }
      blazes.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      scorch2(p, F, t, 22 * S, 1.2 + RAD / 14, 1 - smooth(meta26.duration - 1.2, meta26.duration - 0.2, t));
      ps.draw(p, "back");
      blazes.drawBack(p);
      const k = t / 0.5;
      if (k < 1) band(p, 0, 0.5, 80 * S * ease.outCubic(k), 0.16, Math.max(1, (2 + RAD / 9) * (1 - k)), 1.15 - k, [st.body, st.light, F[3], F[6]], (g) => Math.sin(g) < 0);
    },
    draw(p) {
      const k = t / 0.5;
      if (k < 1) band(p, 0, 0.5, 80 * S * ease.outCubic(k), 0.16, Math.max(1, (2 + RAD / 9) * (1 - k)), 1.15 - k, [st.body, st.light, F[3], F[6]], (g) => Math.sin(g) >= 0);
      for (const b of rocks.list) rock4(p, b, st);
      ps.draw(p, "front");
      for (const f of flashes) {
        const k2 = f.life / f.max, r = f.r * (0.8 + 0.2 * k2);
        p.circle(0, Y, r + 1.2, F[2]);
        p.circle(0, Y, r, k2 > 0.45 ? F[6] : F[5]);
        p.circle(0, Y, r * 0.6, k2 > 0.45 ? WHITE : F[6]);
      }
      for (const r of rings) {
        const k2 = r.life / r.max, e = 1 - Math.pow(k2, 3);
        p.ring(0, Y, r.r0 + (r.r1 - r.r0) * e, Math.max(1, r.thick * k2 + 0.4), r.c, Math.min(1, k2 * 1.6));
      }
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/spawn/poof.js
var poof_exports = {};
__export(poof_exports, {
  create: () => create16,
  meta: () => meta27
});
var meta27 = {
  name: "Poof",
  desc: "A cartoon death poof: a white pop, a ring of soft round smoke balls bursting out between speed lines, little stars spinning off, and the cloud lifting and thinning away.",
  tags: ["spawn", "death", "despawn", "smoke", "poof", "cartoon", "one-shot"],
  size: [112, 92],
  origin: [56, 80],
  duration: 1.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#2a2440", "#5e5878", "#9a94b4", "#cdc8e0", "#f2f0fa", "#ffffff"],
    stars: ["#ffd84a", "#fff3a6", "#ffffff"],
    seed: 21
  }
};
var CY3 = -17;
function create16(o) {
  const C5 = fit(o.palette, 6), S = fit(o.stars, 3), R4 = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R4, ground: floor, sparks: [WHITE, S[1], S[0], C5[2]] }), lights = new Lights();
  const balls = [], lines = [];
  const ring4 = 9;
  for (let i = 0; i < ring4; i++) {
    const a = i / ring4 * TAU + R4.range(-0.2, 0.2), sp = R4.range(95, 140), r = R4.range(5, 7);
    balls.push({ x: Math.cos(a) * 3, y: CY3 + Math.sin(a) * 3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.8 - 12, r0: r * 0.5, r1: r, life: R4.range(0.7, 1.05), delay: R4.range(0, 0.03) });
  }
  for (let i = 0; i < 5; i++) {
    const a = R4.range(0, TAU), sp = R4.range(20, 60);
    balls.push({ x: Math.cos(a) * 2, y: CY3 + Math.sin(a) * 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 16, r0: 4, r1: R4.range(6.5, 8.5), life: R4.range(0.85, 1.2), delay: R4.range(0.02, 0.06) });
  }
  for (let i = 0; i < 7; i++) {
    const a = R4.range(0, TAU), sp = R4.range(170, 240), r = R4.range(2.2, 3.6);
    balls.push({ x: Math.cos(a) * 4, y: CY3 + Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.75 - 10, r0: r * 0.6, r1: r, life: R4.range(0.32, 0.5), delay: R4.range(0.01, 0.04) });
  }
  for (const b of balls) b.max = b.life;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU + R4.range(-0.12, 0.12) + 0.13, sa = Math.sin(a);
    lines.push({ a, r1: Math.min(R4.range(24, 34), sa > 0.1 ? (-2 - CY3) / sa : 99), d: R4.range(0, 0.04) });
  }
  for (let i = 0; i < 7; i++) {
    const a = R4.range(-Math.PI, 0.3), sp = R4.range(70, 125);
    ps.spawn(P.STAR, Math.cos(a) * 6, CY3 + Math.sin(a) * 6, Math.cos(a) * sp, Math.sin(a) * sp - 30, R4.range(0.55, 0.95), R4.pick([S[2], S[1], S[1], S[0]]), R4.range(1.3, 2.4), R4.range(0.02, 0.1));
  }
  for (let i = 0; i < 10; i++) {
    const a = R4.range(0, TAU), sp = R4.range(40, 110);
    ps.spawn(P.STAR, Math.cos(a) * 5, CY3 + Math.sin(a) * 5, Math.cos(a) * sp, Math.sin(a) * sp - 20, R4.range(0.3, 0.6), R4.pick([WHITE, S[1]]), 0.6, R4.range(0, 0.08));
  }
  for (let i = 0; i < 6; i++) {
    const s = R4.sign();
    ps.spawn(P.DUST, s * R4.range(1, 6), -1, s * R4.range(25, 70), -R4.range(2, 10), R4.range(0.4, 0.7), C5[2], R4.range(1.6, 3), R4.range(0.02, 0.08));
  }
  lights.add(0, CY3, 46, C5[4], 0.8, 0.4);
  lights.add(0, CY3, 22, WHITE, 0.8, 0.1);
  let t = 0;
  const radius3 = (b) => {
    const age = b.max - b.life, u = age / b.max;
    const grow = b.r0 + (b.r1 - b.r0) * ease.outBack(clamp(age / 0.22), 2), breathe = 1 + 0.06 * Math.sin(age * 14 + b.r1);
    return grow * breathe * (u < 0.62 ? 1 : 1 - ease.inBack(clamp((u - 0.62) / 0.38), 1.4));
  };
  const drawBall = (p, b, layer) => {
    const age = b.max - b.life, r = radius3(b), a = Math.min(1, age * 20), lit = age < 0.12;
    if (r < 0.6) return;
    const hy = (b.y - CY3 + 6) / 14, lo = hy > 0.4, hi = hy < -0.3;
    if (layer === "shade") p.disc(b.x + r * 0.16, b.y + r * 0.2, r, lit ? C5[3] : lo ? C5[1] : C5[2], 0.8 * a);
    else if (layer === "body") p.disc(b.x - r * 0.06, b.y - r * 0.08, r * 0.86, lit ? C5[4] : lo ? C5[2] : C5[3], 0.88 * a);
    else if (!lo || lit) {
      p.disc(b.x - r * 0.28, b.y - r * 0.34, r * 0.42, lit || hi ? WHITE : C5[4], 0.85 * a);
      if (age < 0.25) p.disc(b.x - r * 0.3, b.y - r * 0.38, r * 0.2, WHITE, 0.9 * a * (1 - age / 0.25));
    }
  };
  return {
    update(dt) {
      t += dt;
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (b.delay > 0) {
          b.delay -= dt;
          continue;
        }
        if ((b.life -= dt) <= 0) {
          if (b.r1 > 4) ps.spawn(P.STAR, b.x, b.y, 0, -8, 0.22, WHITE, 0.6);
          balls.splice(i, 1);
          continue;
        }
        b.vx -= b.vx * 7 * dt;
        b.vy -= b.vy * 7 * dt + 30 * dt;
        b.x += b.vx * dt;
        b.y = Math.min(b.y + b.vy * dt, -radius3(b) * 0.7);
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const s = 1 - smooth(0.1, 0.9, t);
      if (s > 0) p.glow(0, -1, 26, C5[4], 0.25 * s);
      ps.draw(p, "back");
    },
    draw(p) {
      const live = balls.filter((b) => b.delay <= 0);
      for (const layer of ["shade", "body", "cap"]) for (const b of live) drawBall(p, b, layer);
      if (t < 0.07) {
        const k = t / 0.07;
        p.circle(0, CY3, 9 + 3 * k, C5[4]);
        p.circle(0, CY3, 7 + 3 * k, WHITE);
        flare(p, 0, CY3, 20 * (1 - k * 0.5), 1 - k, C5);
      }
      const rk = (t - 0.03) / 0.2;
      if (rk > 0 && rk < 1) p.ring(0, CY3, 8 + 18 * ease.outCubic(rk), Math.max(1, 2.5 * (1 - rk)), rk < 0.3 ? WHITE : C5[4], 1.1 - rk);
      for (const l of lines) {
        const u = (t - l.d) / 0.2;
        if (u <= 0 || u >= 1) continue;
        const head4 = 8 + (l.r1 - 8) * ease.outExpo(clamp(u / 0.6)), tail = 8 + (l.r1 - 8) * ease.inCubic(u), ca = Math.cos(l.a), sa = Math.sin(l.a);
        p.line(ca * tail, CY3 + sa * tail, ca * head4, CY3 + sa * head4, (v) => v > 0.6 ? WHITE : C5[4]);
        p.glowLine(ca * tail, CY3 + sa * tail, ca * head4, CY3 + sa * head4, 3, C5[4], 0.25);
      }
      ps.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/spawn/shatter-death.js
var shatter_death_exports = {};
__export(shatter_death_exports, {
  act: () => act9,
  actorAlpha: () => actorAlpha,
  create: () => create17,
  meta: () => meta28
});

// ../pixelfx/src/fx/spawn/_lib.js
function bodyOf(actor, C5) {
  const m = actor.mask, px = actor.pixels, list = [], cells = new Array(m.w * m.h).fill(null);
  const on = (mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && !!m.data[my * m.w + mx];
  for (let my = 0; my < m.h; my++)
    for (let mx = 0; mx < m.w; mx++) {
      if (!on(mx, my)) continue;
      const own = px?.[my * m.w + mx];
      const c = own ? hex(own) : C5[Math.max(1, Math.min(C5.length - 2, Math.round((C5.length - 2) * (0.85 - my / m.h * 0.5))))];
      const b = { x: actor.x + mx, y: actor.y + my, mx, my, c, edge: !on(mx - 1, my) || !on(mx + 1, my) || !on(mx, my - 1) || !on(mx, my + 1) };
      list.push(b);
      cells[my * m.w + mx] = b;
    }
  return { list, w: m.w, h: m.h, x: actor.x, y: actor.y, on, cell: (mx, my) => on(mx, my) ? cells[my * m.w + mx] : null };
}

// ../pixelfx/src/fx/spawn/shatter-death.js
var meta28 = {
  name: "Shatter death",
  desc: "Frost races up the body and seals it in faceted ice, a glint sweeps it, cracks spread from the chest, then it bursts into its own facets that tumble, bounce and melt.",
  tags: ["spawn", "death", "ice", "freeze", "shatter", "shards", "one-shot"],
  size: [172, 96],
  origin: [84, 84],
  duration: 3.3,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#0e1636", "#1a2f66", "#2557a3", "#3488d6", "#5fc0f0", "#a2e6ff", "#dcf8ff", "#ffffff"],
    seed: 14
  }
};
var FEAR = { turn: 0.9, lean: -2, crouch: 2, fx: -9, fy: -31, bx: 9, by: -31, ffx: -3, fbx: 4 };
var act9 = {
  onBody: true,
  poses: [[-0.2, READY], [0.08, FEAR, "snap"], [0.3, { ...FEAR, lean: -3, fy: -34 }], [0.5, FEAR], [3.3, FEAR]],
  hits: [{ t: 0.5, stop: 0.02, shake: 0.06, amp: 1 }, { t: 1.4, stop: 0.09, shake: 0.26, amp: 3 }]
};
var LOCK = 0.5;
var CRACK2 = 1.05;
var BURST = 1.4;
var actorAlpha = (t) => t < BURST ? 1 : 0;
function create17(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), floor = () => 0;
  const body2 = bodyOf(o.actor, C5), W7 = body2.w + 2, H4 = body2.h + 1, X0 = body2.x - 1, Y0 = body2.y - 1;
  const ice = new Int16Array(W7 * H4).fill(-1), col = new Uint32Array(W7 * H4), glass = new Uint32Array(W7 * H4), solid2 = new Uint8Array(W7 * H4);
  const inBody = (mx, my) => body2.on(mx, my);
  for (let y = 0; y < H4; y++)
    for (let x = 0; x < W7; x++) {
      const mx = x - 1, my = y - 1;
      if (inBody(mx, my) || my < body2.h - 1 && (inBody(mx - 1, my) || inBody(mx + 1, my) || inBody(mx, my - 1) || inBody(mx, my + 1))) ice[y * W7 + x] = 0;
    }
  const seeds = [];
  for (let i = 0; i < 22; i++) {
    let x, y, tries = 0;
    do
      x = R4.range(0, W7), y = R4.range(0, H4);
    while (ice[Math.floor(y) * W7 + Math.floor(x)] < 0 && ++tries < 40);
    seeds.push([x, y]);
  }
  const at8 = (x, y) => x >= 0 && y >= 0 && x < W7 && y < H4 && ice[y * W7 + x] >= 0;
  for (let y = 0; y < H4; y++)
    for (let x = 0; x < W7; x++) {
      const i = y * W7 + x;
      if (ice[i] < 0) continue;
      let d1 = 1e9, d2 = 1e9, k = 0;
      seeds.forEach(([sx2, sy2], j) => {
        const d = Math.hypot(x + 0.5 - sx2, (y + 0.5 - sy2) * 0.85);
        if (d < d1) d2 = d1, d1 = d, k = j;
        else if (d < d2) d2 = d;
      });
      ice[i] = k;
      const [sx, sy] = seeds[k], lit = clamp(0.55 + 0.35 * (rand(k, 41) - 0.5) - 0.5 * ((sx - W7 / 2) / W7) - 0.55 * ((sy - H4 / 2) / H4));
      const own = body2.cell(x - 1, y - 1)?.c;
      col[i] = own ? mix(own, C5[4], 0.36) : C5[3];
      glass[i] = C5[3 + Math.min(2, Math.floor(lit * 3))];
      let sc = 0;
      if (d2 - d1 < 0.42 && !own) sc = lit > 0.5 ? C5[6] : C5[5];
      else if (d2 - d1 < 0.42) col[i] = mix(col[i], C5[6], 0.45);
      if (!at8(x - 1, y) || !at8(x, y - 1)) sc = C5[6];
      if (!at8(x + 1, y) || !at8(x, y + 1) && y < H4 - 1) sc = C5[3];
      if (sc) col[i] = sc, solid2[i] = 1;
    }
  const spikes2 = [];
  for (let i = 0; i < 7; i++) {
    const x = R4.int(1, W7 - 2), y0 = R4.int(2, H4 - 3);
    let y = y0;
    while (y > 0 && at8(x, y - 1)) y--;
    if (at8(x, y)) spikes2.push({ x: X0 + x + 0.5, base: Y0 + y + 1, h: R4.range(3, 6), w: R4.range(2.5, 3.5), lean: R4.range(-2.5, 2.5), at: LOCK + R4.range(-0.02, 0.08) });
  }
  for (const sd of [-1, 1])
    for (let i = 0; i < 2; i++) {
      const h = i ? R4.range(5, 7) : R4.range(8, 11);
      spikes2.push({ x: sd * (i ? R4.range(11, 13) : R4.range(7, 9)), base: 0, h, w: i ? 3.5 : 4.5, lean: sd * h * R4.range(0.25, 0.45), at: R4.range(0.08, 0.2) });
    }
  const IX = Math.round(W7 * 0.48), IY = Math.round(H4 * 0.42), cracks3 = [];
  const walk2 = (x, y, a, len2) => {
    const pts = [[x, y]];
    for (let s = 0; s < len2; s++) {
      a += R4.range(-0.5, 0.5);
      x += Math.cos(a) * R4.range(1.4, 2.4);
      y += Math.sin(a) * R4.range(1.4, 2.4);
      if (!at8(Math.floor(x), Math.floor(y))) break;
      pts.push([x, y]);
      if (pts.length > 3 && cracks3.length < 18 && R4.chance(0.15)) walk2(x, y, a + R4.sign() * R4.range(0.6, 1.1), len2 / 2);
    }
    cracks3.push(pts);
  };
  for (let i = 0; i < 7; i++) walk2(IX, IY, i / 7 * TAU + R4.range(-0.3, 0.3), 20);
  const ps = new Particles({ rng: R4, ground: floor, sparks: [WHITE, C5[6], C5[5], C5[4]], haze: C5[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights(), pieces = [], rime = [];
  let t = 0, locked = false, cracked = false, burst2 = false;
  const level2 = (t2) => H4 * (1 - ease.outCubic(clamp(t2 / LOCK)));
  function shatter() {
    const cells = /* @__PURE__ */ new Map();
    for (let y = 0; y < H4; y++)
      for (let x = 0; x < W7; x++) {
        const k = ice[y * W7 + x];
        if (k < 0) continue;
        if (!cells.has(k)) cells.set(k, []);
        const i = y * W7 + x;
        cells.get(k).push([x, y, solid2[i] ? col[i] : mix(col[i], glass[i], 0.3)]);
      }
    for (const px of cells.values()) {
      let cx = 0, cy = 0;
      for (const [x, y] of px) cx += x + 0.5, cy += y + 0.5;
      cx /= px.length, cy /= px.length;
      const map4 = /* @__PURE__ */ new Map(), r = Math.max(...px.map(([x, y]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy))) + 1;
      for (const [x, y, c] of px) map4.set(`${Math.round(x + 0.5 - cx)},${Math.round(y + 0.5 - cy)}`, c);
      const dx = cx - IX, dy = cy - IY, d = Math.hypot(dx, dy) || 1, sp = R4.range(55, 115);
      const life = R4.range(1.3, 1.85);
      pieces.push({ id: pieces.length + 1, x: X0 + cx, y: Y0 + cy, vx: dx / d * sp + R4.range(-18, 18), vy: dy / d * sp * 0.6 - R4.range(110, 220), a: 0, va: R4.range(-9, 9), r, map: map4, life, max: life, rest: false, n: px.length });
    }
    for (let i = 0; i < 64; i++) {
      const a = -Math.PI / 2 + R4.range(-1.45, 1.45), sp = R4.range(60, 180);
      bits.add({ kind: B.SHARD, x: X0 + IX + R4.range(-6, 6), y: Y0 + IY + R4.range(-8, 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.85, drag: 0.6, bounce: 0.3, life: R4.range(0.9, 1.6), a: R4.range(0, TAU), va: R4.range(-20, 20), s: R4.range(1.5, 3.2), c: R4.pick([C5[7], C5[6], C5[5]]) });
    }
    for (let i = 0; i < 14; i++) ps.spawn(P.VAPOUR, R4.range(-10, 10), -R4.range(1, 20), R4.sign() * R4.range(20, 80), -R4.range(4, 20), R4.range(0.6, 1.1), R4.chance(0.5) ? C5[6] : C5[5], R4.range(2.5, 4.5));
    for (let i = 0; i < 16; i++) ps.spawn(P.STAR, R4.range(-16, 16), -R4.range(4, 38), R4.range(-40, 40), -R4.range(10, 60), R4.range(0.4, 1), R4.pick([WHITE, C5[6]]), R4.range(1, 2.4));
    lights.add(0, Y0 + IY, 46, WHITE, 0.75, 0.14);
    lights.add(0, Y0 + IY, 70, C5[4], 0.6, 0.5);
  }
  return {
    update(dt) {
      t += dt;
      if (t < LOCK) {
        const y = Y0 + level2(t);
        if (R4.chance(0.7)) ps.spawn(P.STAR, R4.range(-10, 10), y, R4.range(-12, 12), -R4.range(0, 18), R4.range(0.25, 0.5), R4.chance(0.5) ? WHITE : C5[6], R4.range(0.8, 1.8));
        if (R4.chance(0.25)) ps.spawn(P.VAPOUR, R4.range(-8, 8), -1, R4.sign() * R4.range(15, 50), -R4.range(2, 10), R4.range(0.6, 1), C5[6], R4.range(2, 3.5));
      }
      if (!locked && t >= LOCK) {
        locked = true;
        lights.add(0, -20, 54, C5[4], 0.6, 0.3);
        for (let i = 0; i < 6; i++) ps.spawn(P.STAR, R4.range(-12, 12), -R4.range(4, 36), 0, -4, R4.range(0.35, 0.7), R4.pick([WHITE, C5[6]]), R4.range(1.2, 2.4));
      }
      if (locked && t < CRACK2 && R4.chance(0.08)) ps.spawn(P.STAR, R4.range(-11, 11), -R4.range(2, 36), 0, -3, R4.range(0.3, 0.6), R4.pick([WHITE, C5[6]]), R4.range(0.8, 2));
      if (!cracked && t >= CRACK2) {
        cracked = true;
        for (let i = 0; i < 5; i++) {
          const a = R4.range(0, TAU), sp = R4.range(60, 150);
          bits.add({ kind: B.SHARD, x: X0 + IX, y: Y0 + IY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 0.8, drag: 0.6, bounce: 0.3, life: R4.range(0.5, 0.9), a: R4.range(0, TAU), va: R4.range(-20, 20), s: R4.range(1, 2), c: C5[6] });
        }
        lights.add(0, Y0 + IY, 24, WHITE, 0.7, 0.1);
      }
      if (!burst2 && t >= BURST) {
        burst2 = true;
        shatter();
      }
      for (let i = pieces.length - 1; i >= 0; i--) {
        const q = pieces[i];
        if ((q.life -= dt) <= 0) {
          pieces.splice(i, 1);
          continue;
        }
        if (q.rest) {
          if (t < meta28.duration - 0.9 && R4.chance(0.02)) ps.spawn(P.VAPOUR, q.x, q.y - 1, R4.range(-4, 4), -R4.range(4, 10), R4.range(0.5, 0.8), C5[5], R4.range(1.5, 2.5));
          continue;
        }
        q.vy += 900 * dt;
        q.vx -= q.vx * 0.5 * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.a += q.va * dt;
        const g = -q.r * 0.55;
        if (q.y > g && q.vy > 0) {
          q.y = g;
          if (q.vy > 90) {
            rime.push({ x: q.x, w: 2 + q.r * 0.6, t0: t });
            q.vy *= -0.32;
            q.vx *= 0.65;
            q.va = q.va * 0.5 + R4.range(-4, 4);
            if (q.n > 8) ps.spawn(P.STAR, q.x, q.y, 0, -6, 0.3, WHITE, 1.2);
            for (let j = 0; j < 2; j++) ps.spawn(P.DUST, q.x + R4.range(-2, 2), -0.5, R4.sign() * R4.range(10, 30), -R4.range(2, 8), R4.range(0.3, 0.5), C5[5], R4.range(1.2, 2));
          } else if (Math.abs(q.vx) > 12) q.vy = 0, q.vx *= 0.9, q.va *= 0.85;
          else q.rest = true, q.vx = q.vy = 0;
        }
      }
      bits.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const k = smooth(0.1, LOCK, t) * (1 - smooth(BURST + 0.6, BURST + 1.6, t)), reach = 6 + 12 * smooth(0, LOCK + 0.3, t);
      if (k > 0)
        for (let x = Math.floor(-reach); x <= Math.ceil(reach); x++) {
          const h = rand(x, 17), e = 1 - Math.abs(x) / (reach + 1);
          p.dot(x, 0, h < 0.3 ? WHITE : C5[6], k * Math.min(1, e * 2));
          if (h < 0.5) p.dot(x, 1, C5[5], k * e);
          if (h < 0.35 && e > 0.3) p.dot(x, -1, C5[6], k * e);
        }
      if (k > 0) p.glow(0, -2, 26, C5[4], 0.25 * k);
      for (const r of rime) {
        const a = clamp((t - r.t0) / 0.08) * (1 - smooth(meta28.duration - 1, meta28.duration - 0.15, t));
        for (let x = Math.floor(r.x - r.w); x <= r.x + r.w; x++) {
          const h = rand(x, 23);
          if (h < 0.7) p.dot(x, 0, h < 0.25 ? WHITE : C5[6], a);
          if (h < 0.3) p.dot(x, 1, C5[5], a * 0.7);
        }
      }
      ps.draw(p, "back");
    },
    draw(p) {
      if (!burst2) {
        const lv = level2(t), shake3 = t > CRACK2 && t < BURST ? (Math.floor(t * 50) % 2 ? 1 : -1) * (t > BURST - 0.15 ? 1 : 0.5) : 0;
        const glint2 = t > LOCK ? (t - LOCK) * 0.9 % 1.6 : -1;
        for (let y = 0; y < H4; y++) {
          if (y < Math.floor(lv)) continue;
          for (let x = 0; x < W7; x++) {
            const i = y * W7 + x;
            if (ice[i] < 0) continue;
            let c = y === Math.floor(lv) && t < LOCK ? rand(x, 5) < 0.6 ? WHITE : C5[6] : t >= LOCK && t < LOCK + 0.05 ? WHITE : col[i];
            const g = Math.abs((x + (H4 - y) * 0.6) / (W7 + H4 * 0.6) - glint2), on = glint2 >= 0 && glint2 <= 1;
            if (on && g < 0.035) c = WHITE;
            else if (on && g < 0.07 && c !== C5[3]) c = C5[6];
            p.px(X0 + x + shake3, Y0 + y, c);
            if (!solid2[i] && c === col[i]) p.blend(X0 + x + shake3, Y0 + y, glass[i], 0.3);
          }
        }
        for (let y = Math.max(0, Math.floor(lv) - 1); y <= H4; y++)
          for (let x = -1; x <= W7; x++) if (!at8(x, y) && (at8(x - 1, y) || at8(x + 1, y) || at8(x, y + 1) && y + 1 >= lv || at8(x, y - 1)) && y < H4) p.px(X0 + x + shake3, Y0 + y, C5[0]);
        for (const s of spikes2) {
          const g = ease.outBack(clamp((t - s.at) / 0.12), 2.4);
          if (g > 0) crystal(p, s.x + shake3, s.base, s.h * g, s.w, s.lean * g, C5, { white: t < s.at + 0.04 });
        }
        if (cracked) {
          const k = clamp((t - CRACK2) / 0.25);
          for (const pts of cracks3)
            for (let i = 0, n = Math.floor(pts.length * k); i < n; i++) {
              const [x, y] = pts[i], fresh = i > n - 3 && t - CRACK2 < 0.3;
              p.px(X0 + x + shake3, Y0 + y, fresh ? WHITE : C5[7]);
              if (!fresh) p.px(X0 + x + shake3, Y0 + y + 1, C5[1]);
            }
        }
        p.glow(0, -18, 30, C5[4], 0.18 * smooth(0, LOCK, t));
        if (t > LOCK && t < LOCK + 0.18) sparkle(p, -4, Y0 + 8, Math.round(8 * (1 - (t - LOCK) / 0.18)), WHITE, C5[5], 0.6);
      } else if (t < BURST + 0.08) {
        const k = (t - BURST) / 0.08;
        p.circle(X0 + IX, Y0 + IY, 10 * (1 - k) + 3, WHITE);
      }
      for (const q of pieces) {
        const ca = Math.cos(q.a), sa = Math.sin(q.a), fade = Math.min(1, q.life / 0.5), r = Math.ceil(q.r);
        for (let py = -r; py <= r; py++)
          for (let px = -r; px <= r; px++) {
            const ux = Math.round(px * ca + py * sa), uy = Math.round(-px * sa + py * ca), c = q.map.get(`${ux},${uy}`);
            if (c && rand(ux, uy, q.id) < fade) p.px(Math.floor(q.x) + px, Math.floor(q.y) + py, q.max - q.life < 0.05 ? WHITE : c);
          }
        if (q.n > 6) p.glow(q.x, q.y, 6, C5[5], 0.2 * fade);
      }
      bits.draw(p);
      ps.draw(p, "front");
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/spawn/spawn-portal.js
var spawn_portal_exports = {};
__export(spawn_portal_exports, {
  create: () => create18,
  meta: () => meta29
});
var meta29 = {
  name: "Spawn portal",
  desc: "A rift tears open on the floor and swirls, belches violet smoke and sparks, spits a fountain of wisps up out of itself, then twists shut with a pop.",
  tags: ["spawn", "portal", "summon", "rift", "arcane", "smoke", "ground", "one-shot"],
  size: [208, 150],
  origin: [104, 122],
  duration: 3.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#12081f", "#2a0f4d", "#481b8c", "#7330d0", "#a35cff", "#cf9bff", "#f1dcff", "#ffffff"],
    width: 28,
    seed: 6
  }
};
var OPEN2 = 0.3;
var BELCH = [0.52, 0.76];
var BURST2 = 1;
var SHUT = 1.9;
var POP2 = 2.22;
var SY3 = 0.34;
var VOID = hex("#06030b");
var FUME = hex("#3a3046");
var STONE4 = ["#1a1424", "#2b2639", "#4a4263", "#6c6488", "#9a91b4"].map(hex);
var DUST6 = hex("#5a5070");
function radius2(t, RX2) {
  if (t < OPEN2) return RX2 * ease.outBack(clamp(t / OPEN2), 2.2);
  if (t < SHUT) return RX2 * (1 + 0.035 * Math.sin(t * 9) + 0.1 * Math.exp(-((t - BURST2 - 0.05) ** 2) / 6e-3));
  const k = clamp((t - SHUT) / (POP2 - SHUT));
  return RX2 * (k < 0.35 ? 1 + 0.1 * Math.sin(k / 0.35 * Math.PI * 0.5) : 1.1 * (1 - Math.pow((k - 0.35) / 0.65, 1.6)));
}
var spinAt = (t) => t * 2.4 + 1.5 * smooth(BURST2 - 0.1, BURST2 + 0.3, t) + 10 * Math.pow(clamp((t - SHUT) / (POP2 - SHUT)), 2.2);
var lipAt = (th, spin) => 1 + 0.05 * noise(th * 3 + spin * 0.6, 5) + 0.035 * noise(th * 8 - spin * 1.3, 9);
function hole(p, C5, rx, spin, heat2, wind = 2.3) {
  if (rx < 1) return;
  const ry = rx * SY3;
  p.shade(-rx - 2, -ry - 2, rx + 2, ry + 2, (x, y, out) => {
    const u = x / rx, v = y / ry, q = Math.hypot(u, v), th = Math.atan2(v, u), lip2 = lipAt(th, spin);
    if (q > lip2) return;
    const w = q / lip2;
    out.c = v < 0 && w > 0.72 ? w > 0.86 ? C5[2] : C5[1] : w > 0.55 ? C5[0] : VOID;
  });
  const n = Math.max(40, Math.round(rx * 5));
  for (let i = 0; i < 3; i++)
    for (let j = 0; j <= n; j++) {
      const q = 0.14 + 0.82 * (j / n), th = spin + i * TAU / 3 - wind * Math.log(q), lip2 = lipAt(th, spin);
      const x = Math.cos(th) * q * lip2 * rx, y = Math.sin(th) * q * lip2 * ry;
      const c = q > 0.8 ? heat2 > 1.1 ? WHITE : C5[6] : q > 0.55 ? C5[5] : q > 0.32 ? C5[4] : C5[3];
      p.dot(x, y, c, q > 0.3 ? 1 : q / 0.3);
      if (q > 0.4 && j % 2 === 0) {
        const t2 = th - 0.32, x2 = Math.cos(t2) * q * 0.94 * lip2 * rx, y2 = Math.sin(t2) * q * 0.94 * lip2 * ry;
        p.dot(x2, y2, q > 0.7 ? C5[4] : C5[3], 0.85);
      }
    }
  p.glow(0, 0, rx * 0.45, C5[3], 0.35 * heat2);
}
function lip(p, C5, rx, spin, heat2, near) {
  if (rx < 1) return;
  const ry = rx * SY3, n = Math.ceil(rx * 7);
  for (let j = 0; j < n; j++) {
    const th = j / n * TAU, s = Math.sin(th);
    if (s >= 0 !== near) continue;
    const l = lipAt(th, spin), x = Math.cos(th) * rx * l, y = s * ry * l, f = noise(th * 9 + spin * 3, 13);
    p.dot(Math.cos(th) * (rx * l + 1.2), s * (ry * l + 1), C5[1]);
    p.dot(x, y, near ? f > -0.3 || heat2 > 1.1 ? WHITE : C5[6] : f > 0.2 ? C5[6] : C5[5]);
    if (j % 6 === 0) p.glow(x, y, 7, C5[5], (near ? 0.3 : 0.2) * Math.min(1.4, heat2));
  }
}
function create18(o) {
  const C5 = fit(o.palette, 8), RX2 = o.width, R4 = new Rng(o.seed), floor = () => 0;
  const SM = [mix(C5[4], FUME, 0.4), mix(C5[3], FUME, 0.3), mix(C5[5], FUME, 0.55)];
  const ps = new Particles({ rng: R4, ground: floor, sparks: [C5[7], C5[6], C5[5], C5[3]] });
  const rocks = new Bits({ ground: floor }), lights = new Lights();
  const swirl = [], wisps = [], rings = [];
  const done = {};
  let t = 0;
  const addSwirl = (r0) => swirl.push({ a: R4.range(0, TAU), r: r0, w: R4.range(2.2, 4), in: R4.range(0.3, 0.7), c: R4.pick([WHITE, C5[6], C5[6], C5[5]]) });
  const pull = () => {
    const a = R4.range(Math.PI * 1.03, Math.PI * 1.97), D17 = R4.range(40, 86), T4 = R4.range(0.24, 0.42);
    const x = Math.cos(a) * D17 * 1.08, y = Math.sin(a) * D17 * 0.85, l = Math.hypot(x, y), v = 0.6 * l / (1 - Math.exp(-0.6 * T4));
    ps.spawn(P.MOTE, x, y, -x / l * v, -y / l * v, T4, R4.pick([WHITE, C5[6], C5[5], C5[5], C5[4]]), R4.range(1, 1.7));
  };
  const puff = (n, big, sp) => {
    for (let i = 0; i < n; i++) {
      const a = R4.range(0, TAU), d = R4.range(0, 0.55) * RX2;
      ps.spawn(P.SMOKE, Math.cos(a) * d, Math.sin(a) * d * SY3 - 2, R4.range(-1, 1) * sp * 0.6, -R4.range(0.4, 1) * sp, R4.range(1.2, 2.2) * (big ? 1.15 : 0.8), R4.pick(SM), R4.range(2.8, 4.6) * (big ? 1.15 : 0.9), big ? R4.range(0, 0.3) : R4.range(0, 0.1), big ? PF.BIG : 0);
    }
  };
  const sparks = (n, up, spread) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + R4.range(-spread, spread), sp = R4.range(0.5, 1) * up;
      ps.spawn(P.SPARK, R4.range(-0.5, 0.5) * RX2, -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.35, 0.8));
    }
  };
  const once = (k, at8) => !done[k] && t >= at8 && (done[k] = true);
  return {
    update(dt) {
      t += dt;
      const shutting = t > SHUT && t < POP2;
      if ((t < OPEN2 + 0.15 || shutting) && R4.chance(0.55)) {
        const s = R4.sign(), D17 = R4.range(RX2 * 1.3, RX2 * 2.4), T4 = R4.range(0.18, 0.3), v = D17 * 3 / (Math.exp(3 * T4) - 1);
        ps.spawn(P.STREAK, s * D17, -R4.range(0, 3), -s * v, R4.range(-2, 2), T4, R4.chance(0.5) ? C5[6] : C5[5]);
      }
      if (t > 0.1 && t < POP2 - 0.1 && R4.chance(shutting ? 0.85 : t < BURST2 ? 0.55 : 0.1)) pull();
      if (t < POP2 && t > 0.12 && R4.chance(shutting ? 0.5 : 0.25)) addSwirl(R4.range(1.1, 1.5));
      if (once("open", OPEN2 * 0.7)) {
        lights.add(0, -8, 50, C5[4], 0.75, 0.45);
        rings.push({ t0: t, life: 0.42, r0: RX2 * 0.8, r1: RX2 * 1.9, th: 2.5, hot: true });
        for (let i = 0; i < 8; i++) ps.spawn(P.DUST, R4.sign() * R4.range(0.7, 1.1) * RX2, -1, R4.sign() * R4.range(10, 45), -R4.range(4, 14), R4.range(0.4, 0.7), DUST6, R4.range(1.5, 3));
      }
      if (once("b0", BELCH[0])) puff(6, false, 34), sparks(8, 210, 0.55), lights.add(0, -6, 44, C5[4], 0.6, 0.3);
      if (once("b1", BELCH[1])) puff(8, false, 40), sparks(12, 240, 0.6), lights.add(0, -6, 48, C5[4], 0.65, 0.3);
      if (once("burst", BURST2)) {
        lights.add(0, -26, 74, C5[4], 1, 0.75);
        lights.add(0, -10, 40, WHITE, 0.85, 0.14);
        rings.push({ t0: t, life: 0.55, r0: RX2 * 1, r1: RX2 * 2.5, th: 3.5, hot: true }, { t0: t + 0.06, life: 0.45, r0: RX2 * 0.8, r1: RX2 * 1.8, th: 2, hot: false });
        puff(18, true, 70);
        sparks(34, 400, 0.8);
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI / 2 + (i - 2) * 0.27 + R4.range(-0.08, 0.08), sp = R4.range(185, 235);
          wisps.push({ x: R4.range(-4, 4), y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R4.range(0.75, 1), max: 1, tr: [], acc: 0, ph: R4.range(0, TAU) });
        }
        for (let i = 0; i < 12; i++)
          rocks.add({ kind: B.CHUNK, x: R4.sign() * R4.range(0.75, 1.05) * RX2, y: -1, vx: R4.range(-100, 100), vy: -R4.range(150, 280), g: 1, drag: 0.4, bounce: 0.3, life: R4.range(1.3, 1.9), a: R4.range(0, TAU), va: R4.range(-14, 14), s: R4.range(1, 2.4), ramp: STONE4 });
        for (let i = 0; i < 14; i++) ps.spawn(P.STAR, R4.range(-0.8, 0.8) * RX2, -R4.range(4, 34), R4.range(-30, 30), -R4.range(10, 60), R4.range(0.5, 1.1), R4.pick([WHITE, C5[6], C5[5]]), R4.range(0.8, 2));
      }
      if (t > OPEN2 && t < SHUT && R4.chance(0.16)) puff(1, false, 22);
      if (t > OPEN2 && t < SHUT + 0.1 && R4.chance(0.06)) sparks(1, 160, 0.4);
      if (once("pop", POP2)) {
        lights.add(0, -4, 50, C5[4], 0.95, 0.5);
        lights.add(0, -2, 28, WHITE, 0.9, 0.12);
        rings.push({ t0: t, life: 0.35, r0: 2, r1: RX2 * 1.9, th: 2.5, hot: true });
        for (let i = 0; i < 18; i++) {
          const a = R4.range(-Math.PI, 0), sp = R4.range(90, 270);
          ps.spawn(P.SPARK, 0, -1, Math.cos(a) * sp, Math.sin(a) * sp * 0.8, R4.range(0.25, 0.6));
        }
        for (let i = 0; i < 9; i++) {
          const a = R4.range(0, TAU), sp = R4.range(30, 95);
          ps.spawn(P.STAR, 0, -2, Math.cos(a) * sp, Math.sin(a) * sp * 0.5 - 20, R4.range(0.4, 0.9), R4.pick([WHITE, C5[6]]), R4.range(0.8, 1.8));
        }
        for (let i = 0; i < 6; i++) ps.spawn(P.SMOKE, R4.range(-6, 6), -R4.range(1, 4), R4.range(-34, 34), -R4.range(10, 30), R4.range(0.8, 1.3), SM[2], R4.range(2.5, 4.5));
        for (let i = 0; i < 14; i++) ps.spawn(P.STAR, R4.range(-1, 1) * RX2 * 0.9, -R4.range(0.5, 2), R4.range(-4, 4), -R4.range(0, 4), R4.range(0.6, 1.4), R4.pick([C5[6], C5[5], C5[5]]), R4.range(0.4, 0.9), R4.range(0, 0.25));
      }
      for (let i = swirl.length - 1; i >= 0; i--) {
        const s = swirl[i], k = shutting ? 2.4 : 1;
        s.a += s.w * k * dt * (1.4 / Math.max(0.3, s.r));
        s.r -= s.in * k * dt;
        if (s.r < 0.25 || t > POP2) swirl.splice(i, 1);
      }
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i];
        w.tr.unshift([w.x, w.y]);
        if (w.tr.length > 12) w.tr.pop();
        if ((w.life -= dt) <= 0 || w.vy > 0 && w.y > -2) {
          for (let j = 0; j < 8; j++) {
            const a = R4.range(0, TAU), sp = R4.range(30, 120);
            ps.spawn(P.SPARK, w.x, w.y, Math.cos(a) * sp + w.vx * 0.2, Math.sin(a) * sp + w.vy * 0.2, R4.range(0.2, 0.5));
          }
          ps.spawn(P.STAR, w.x, w.y, 0, -6, 0.45, WHITE, 2.4);
          lights.add(w.x, w.y, 24, C5[5], 0.65, 0.25);
          wisps.splice(i, 1);
          continue;
        }
        w.vy += 360 * dt;
        w.vx += Math.sin((w.max - w.life) * 16 + w.ph) * 160 * dt;
        w.vx -= w.vx * 1.1 * dt;
        w.vy -= w.vy * 1.1 * dt;
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        for (w.acc += dt; w.acc > 0.03; w.acc -= 0.03) ps.spawn(P.SMOKE, w.x, w.y, w.vx * 0.05, w.vy * 0.05 - 4, R4.range(0.6, 1), SM[0], R4.range(1.5, 2.4));
        if (R4.chance(0.3)) ps.spawn(P.MOTE, w.x, w.y, -w.vx * 0.2 + R4.range(-15, 15), -w.vy * 0.2 + R4.range(-15, 15), R4.range(0.2, 0.4), C5[6], 0.6);
      }
      for (let i = rings.length - 1; i >= 0; i--) if (t - rings[i].t0 > rings[i].life) rings.splice(i, 1);
      rocks.update(dt);
      for (const b of rocks.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 2; i++) ps.spawn(P.DUST, b.x + R4.range(-1.5, 1.5), -0.5, R4.sign() * R4.range(6, 30), -R4.range(2, 12), R4.range(0.3, 0.6), DUST6, R4.range(1.2, 2.4));
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const rx = radius2(t, RX2), spin = spinAt(t), heat2 = 0.85 + 0.15 * Math.sin(t * 7) + 0.6 * Math.exp(-((t - BURST2) ** 2) / 0.01);
      if (t < POP2) {
        p.glow(0, -4, rx * 1.8 + 10, C5[4], 0.32 * clamp(rx / RX2));
        p.glowLine(0, -2, 0, -44, rx * 0.7 + 6, C5[4], 0.16 * clamp(rx / RX2));
      }
      if (t < OPEN2 * 0.6) {
        const k = t / (OPEN2 * 0.6), L4 = RX2 * 1.1 * ease.outCubic(k);
        p.line(-L4, 0, L4, 0, (u) => Math.abs(u - 0.5) < 0.3 ? WHITE : C5[6]);
        p.glowLine(-L4, 0, L4, 0, 7, C5[5], 0.6);
      }
      if (t > OPEN2 * 0.35 && t < POP2) {
        hole(p, C5, rx, spin, heat2 + 0.4 * smooth(SHUT, POP2, t), 2.3 + 2.6 * smooth(SHUT, POP2 - 0.05, t));
        lip(p, C5, rx, spin, heat2, false);
      }
      for (const r of rings) ring2(p, C5, r, t, false);
      drawSwirl(p, false);
      ps.draw(p, "back");
    },
    draw(p) {
      const rx = radius2(t, RX2), spin = spinAt(t), heat2 = 0.85 + 0.15 * Math.sin(t * 7) + 0.6 * Math.exp(-((t - BURST2) ** 2) / 0.01);
      if (t > OPEN2 * 0.35 && t < POP2) lip(p, C5, rx, spin, heat2, true);
      for (const r of rings) ring2(p, C5, r, t, true);
      drawSwirl(p, true);
      const b = t - BURST2;
      if (b > 0 && b < 0.45) {
        const k = b / 0.45, top = -84 * ease.outExpo(clamp(b / 0.14)), bot = -1 - 60 * ease.inQuad(k), w0 = RX2 * 0.55 * (1 - k * 0.8);
        p.shade(-w0 - 1, top, w0 + 1, bot, (x, y, out) => {
          const u = (y - bot) / (top - bot), half = w0 * Math.pow(1 - u, 0.8) * (0.85 + 0.15 * Math.sin(y * 0.7 + t * 40));
          const d = Math.abs(x) / Math.max(0.5, half);
          if (d > 1) return;
          out.c = d < 0.35 ? WHITE : d < 0.7 ? C5[6] : C5[5];
        });
        p.glowLine(0, bot, 0, top, w0 + 12, C5[5], 0.55 * (1 - k));
        if (b < 0.14) flare(p, 0, -4, 36 * (1 - b / 0.14), 1 - b / 0.14, C5);
      }
      const q = t - POP2;
      if (q > -0.08 && q < 0.25) sparkle(p, 0, -1, Math.round((q < 0 ? 4 : 12) * (1 - clamp(q / 0.25))), WHITE, C5[5], 0.7 * (1 - clamp(q / 0.25)));
      rocks.draw(p);
      for (const w of wisps) {
        const k = w.life / w.max;
        for (let i = 1; i < w.tr.length; i++) {
          const [x0, y0] = w.tr[i - 1], [x1, y1] = w.tr[i], u = i / w.tr.length;
          p.line(x0, y0, x1, y1, u < 0.25 ? WHITE : u < 0.55 ? C5[6] : C5[4], 1.15 - u);
          if (u < 0.35) p.line(x0 + 1, y0, x1 + 1, y1, C5[5], 1);
        }
        p.circle(w.x, w.y, 2, C5[5]);
        p.circle(w.x, w.y, 1.2, C5[6]);
        p.px(w.x, w.y, WHITE);
        p.glow(w.x, w.y, 12, C5[5], 0.5 * k + 0.2);
      }
      ps.draw(p, "front");
      lights.draw(p);
    }
  };
  function drawSwirl(p, near) {
    const rx = radius2(t, RX2);
    for (const s of swirl) {
      for (let j = 0; j < 3; j++) {
        const a = s.a - j * 0.08 * (1.4 / Math.max(0.3, s.r)), x = Math.cos(a) * s.r * rx, y = Math.sin(a) * s.r * rx * SY3;
        if (Math.sin(a) >= 0 !== near) continue;
        p.dot(x, y - 0.5, j ? C5[5] : s.c, j ? 0.9 - j * 0.3 : 1);
        if (!j) p.glow(x, y, 3, C5[5], 0.35);
      }
    }
  }
}
function ring2(p, C5, r, t, near) {
  const k = (t - r.t0) / r.life;
  if (k < 0 || k >= 1) return;
  band(p, 0, 0, r.r0 + (r.r1 - r.r0) * ease.outCubic(k), SY3 * 0.62, Math.max(1, r.th * (1 - k)), 1.15 - k, C5, (g) => Math.sin(g) >= 0 === near, r.hot && k < 0.15);
}

// ../pixelfx/src/fx/ui/level-up.js
var level_up_exports = {};
__export(level_up_exports, {
  act: () => act10,
  create: () => create19,
  meta: () => meta30
});

// ../pixelfx/src/fx/ui/_lib.js
function spell(str, font = "big") {
  const F = FONTS[font], letters = [];
  let x = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()] ?? null;
    const w = g ? g.w : F.space;
    letters.push({ ch, g, x, w, h: F.h });
    x += w + F.gap;
  }
  return { letters, w: Math.max(0, x - F.gap), h: F.h };
}
var ids = new Int16Array(4096);
var edges = new Uint8Array(4096);
function drawWord(p, items, st) {
  if (!items.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of items) {
    const h = it.g.rows.length * it.sy, w = it.g.w * it.sx, sl = Math.abs(it.slant ?? 0) * it.g.rows.length;
    x0 = Math.min(x0, it.x - sl);
    x1 = Math.max(x1, it.x + w + sl);
    y0 = Math.min(y0, it.y);
    y1 = Math.max(y1, it.y + h);
  }
  const ow = st.ow ?? 1;
  x0 = Math.floor(x0) - 1 - ow;
  y0 = Math.floor(y0) - 1 - ow;
  x1 = Math.ceil(x1) + 2 + ow;
  y1 = Math.ceil(y1) + 3 + ow;
  const W7 = x1 - x0, H4 = y1 - y0;
  if (W7 * H4 > ids.length) ids = new Int16Array(W7 * H4 * 2), edges = new Uint8Array(W7 * H4 * 2);
  ids.fill(0, 0, W7 * H4);
  items.forEach((it, k) => {
    const g = it.g, gh = g.rows.length, h = gh * it.sy, bot = it.y + h, sl = it.slant ?? 0;
    for (let py = Math.floor(it.y); py < Math.ceil(bot); py++) {
      const gy = Math.floor((py + 0.5 - it.y) / it.sy);
      if (gy < 0 || gy >= gh) continue;
      const shift2 = Math.round((bot - py - 0.5) / it.sy * sl);
      const ry = py + 0.5 - it.y - gy * it.sy, row = g.rows[gy];
      for (let px = Math.floor(it.x + shift2) - 1; px <= Math.ceil(it.x + shift2 + g.w * it.sx); px++) {
        const fx = px + 0.5 - it.x - shift2, gx = Math.floor(fx / it.sx);
        if (gx < 0 || gx >= g.w || !row[gx]) continue;
        const i = (py - y0) * W7 + (px - x0);
        if (i < 0 || i >= W7 * H4) continue;
        ids[i] = k + 1;
        const rx = fx - gx * it.sx, up = gy > 0 ? g.rows[gy - 1] : null, dn = gy < gh - 1 ? g.rows[gy + 1] : null;
        const open = (r) => !r || !r[gx] && !r[gx - 1] && !r[gx + 1];
        edges[i] = (ry < 1 && open(up) ? 1 : 0) | (ry >= it.sy - 1 && open(dn) ? 2 : 0) | (rx < 1 && !(gx > 0 && row[gx - 1]) ? 4 : 0);
      }
    }
  });
  const at8 = (x, y) => x < x0 || y < y0 || x >= x1 || y >= y1 ? 0 : ids[(y - y0) * W7 + (x - x0)];
  const F = st.fill, nF = F.length, shine = st.shine, glint2 = st.glint ?? WHITE, sy0 = st.shineY ?? y0;
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const id = at8(x, y);
      if (id) {
        const it = items[id - 1], v = (y + 0.5 - it.y) / (it.g.rows.length * it.sy);
        let i = Math.min(nF - 1, Math.max(0, Math.floor((1 - v) * nF)));
        let c = F[i];
        const e = edges[(y - y0) * W7 + (x - x0)];
        if (e & 1) c = st.edge ?? F[nF - 1];
        else if (e & 2) c = st.under ?? F[0];
        else if (e & 4 && i < nF - 1) c = F[i + 1];
        if (shine !== void 0 && shine !== null) {
          const d = Math.abs(x + 0.5 - (y + 0.5 - sy0) * 0.6 - shine);
          if (d < 1.1) c = WHITE;
          else if (d < 2.4) c = glint2;
        }
        if (it.flash > 0.6 || it.flash > 0.25 && v < 0.5) c = WHITE;
        p.dot(x, y, c, it.a ?? 1);
        continue;
      }
      let n = 0;
      for (let dy = -ow; dy <= ow && !n; dy++) for (let dx = -ow; dx <= ow && !n; dx++) if (ow < 2 || Math.abs(dx) + Math.abs(dy) < 4) n = at8(x + dx, y + dy);
      if (n) {
        p.dot(x, y, st.outline, items[n - 1].a ?? 1);
        continue;
      }
      const s = at8(x - ow, y - 1 - ow) || at8(x + 1 - ow, y - 1 - ow) || at8(x - ow, y - ow);
      if (s && st.shadow) p.dot(x, y, st.shadow, (items[s - 1].a ?? 1) * 0.9);
    }
}
function tintActor(p, A2, k, ramp2) {
  if (!A2 || k <= 0.12) return;
  const m = A2.mask, pix = A2.pixels, cut2 = k > 0.6 ? 0 : k > 0.3 ? 0.22 : 0.5;
  for (let j = 0; j < m.h; j++)
    for (let i = 0; i < m.w; i++) {
      const q = j * m.w + i;
      if (!m.data[q]) continue;
      const l = pix ? luma(pix[q]) : 0.6;
      if (l < cut2) continue;
      p.px(A2.x + i, A2.y + j, l > 0.5 ? k > 0.8 ? WHITE : ramp2[2] : l > 0.22 ? ramp2[1] : ramp2[0]);
    }
}
function lightActor(p, A2, c, k, rim = 0, t = 0) {
  if (!A2 || k <= 0.01 && rim <= 0.01) return;
  const m = A2.mask, pix = A2.pixels, has = (i, j) => i >= 0 && j >= 0 && i < m.w && j < m.h && m.data[j * m.w + i];
  for (let j = 0; j < m.h; j++)
    for (let i = 0; i < m.w; i++) {
      if (!m.data[j * m.w + i]) continue;
      if (k > 0.01) p.light(A2.x + i, A2.y + j, c, k * (1.1 - 0.5 * j / m.h));
      if (rim <= 0.01 || !has(i - 1, j) || !has(i + 1, j) || !has(i, j - 1)) continue;
      if (has(i - 2, j) && has(i + 2, j) && has(i, j - 2)) continue;
      const f = rim * (0.75 + 0.35 * noise(j * 0.6 - t * 8, i * 3));
      if (f > 0.25) p.px(A2.x + i, A2.y + j, mix(pix ? pix[j * m.w + i] || c : c, c, Math.min(0.85, f)));
    }
}
function haloActor(p, A2, c, k, t = 0) {
  if (!A2 || k <= 0.02) return;
  p.outline(A2.mask, A2.x, A2.y, c, (mx, my) => k * (0.75 + 0.45 * noise(my * 0.45 - t * 7, mx * 3)));
}
function panel(p, x, y, w, h, col, { r = 3, a = 1, shine = null } = {}) {
  if (w < 2 || h < 2) return;
  const X1 = x + w, Y1 = y + h;
  p.shade(x, y, X1, Y1, (px, py, o) => {
    const cx = Math.max(x + r - px, 0, px - (X1 - r)), cy = Math.max(y + r - py, 0, py - (Y1 - r));
    const e = cx > 0 && cy > 0 ? r - Math.hypot(cx, cy) : Math.min(px - x, X1 - px, py - y, Y1 - py);
    if (e < 0) return;
    o.a = a;
    if (e < 1) return col.outline;
    if (py - y < 2) return col.rim;
    if (Y1 - py < 2) return col.low;
    if (shine !== null) {
      const d = Math.abs(px - (py - y) * 0.6 - shine);
      if (d < 1.3) return WHITE;
      if (d < 3) return col.rim;
    }
    return py - y < h * 0.45 ? col.top : col.body;
  });
}
function shake(t, amp, t0 = 0, len2 = 0.3, seed = 1, hz = 32) {
  if (t < t0 || t > t0 + len2) return [0, 0];
  const k = 1 - (t - t0) / len2;
  return [Math.round(noise(t * hz, seed) * amp * k * 1.7), Math.round(noise(t * hz, seed + 7) * amp * k * 1.3)];
}
var UI_GOLD = ["#2a1405", "#5c3008", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"];
var UI_INK = { outline: hex("#0d0a14"), rim: hex("#5a4f74"), top: hex("#2a2338"), body: hex("#211b2d"), low: hex("#15111c") };
var UI_TONES = {
  hp: ["#1a0508", "#4a0b12", "#8c1420", "#d42a2e", "#ff5a4a", "#ff9a86", "#ffd8cc", "#ffffff"],
  mp: ["#06121f", "#0c2a4a", "#144a7a", "#1f6fa8", "#3a9ad0", "#7cc8f0", "#c8f0ff", "#ffffff"],
  xp: ["#141a05", "#2a3a08", "#4a5c0e", "#6e8a18", "#9ab828", "#c8e05a", "#efffb0", "#ffffff"],
  boss: ["#14081f", "#2a1040", "#4a1a6a", "#6e2a94", "#9450c0", "#c08ae0", "#e8ccff", "#ffffff"],
  gold: UI_GOLD
};
function bar(p, x, y, w, h, value, C5, { cells = 10, rim = true } = {}) {
  value = clamp(value, 0, 1);
  if (w < 2 || h < 2) return;
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  p.rect(x - 1, y - 1, w + 2, h + 2, UI_INK.outline);
  p.rect(x, y, w, h, hex("#171320"));
  const fw = Math.round(w * value);
  if (fw > 0) {
    p.shade(x, y, x + fw, y + h, (px, py, o) => {
      const v = (py - y) / h;
      o.c = v < 0.16 ? C5[6] : v < 0.38 ? C5[5] : v < 0.72 ? C5[4] : v < 0.9 ? C5[3] : C5[2];
    });
    p.rect(x, y + h - 1, fw, 1, C5[1]);
    p.rect(x + fw - 1, y, 1, h, WHITE);
  }
  if (rim) p.rect(x, y, w, 1, UI_INK.rim);
  const n = Math.max(1, Math.min(cells, Math.floor(w / 10)));
  for (let i = 1; i < n; i++) p.rect(x + Math.round(w * i / n), y, 1, h, UI_INK.outline);
}

// ../pixelfx/src/fx/ui/level-up.js
var meta30 = {
  name: "Level up",
  desc: "Gold gathers at the feet and bursts up as a pillar of light round the hero; rings climb it, LEVEL UP! drops in letter by letter, a shine sweeps it, sparkles twinkle.",
  tags: ["ui", "level", "reward", "text", "light", "one-shot"],
  size: [176, 138],
  origin: [88, 114],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#2a1405", "#5c3008", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"], text: "LEVEL UP!", seed: 5 }
};
var COIL = { turn: 0.9, crouch: 7, lean: 2, fx: -6, fy: -13, bx: 7, by: -13, ffx: -5, fbx: 6 };
var LEAP = { turn: 1.1, y: -16, crouch: -1, fx: -6, fy: -45, bx: 7, by: -44, ffx: -2, ffy: -8, fbx: 5, fby: -3, toeB: true };
var PUMP = { turn: 0.9, crouch: 0, fx: -6, fy: -45, bx: 9, by: -15, ffx: -3, fbx: 4 };
var act10 = {
  onBody: true,
  follow: 0,
  poses: [
    [-0.3, READY],
    [0.28, COIL],
    [0.3, LEAP, "snap"],
    [0.46, { ...LEAP, y: -19 }],
    [0.72, { ...LEAP, y: 0, ffy: -4, fby: -4 }, "in"],
    [0.74, { ...COIL, crouch: 5 }, "snap"],
    [0.95, PUMP, "out"],
    [1.2, { ...PUMP, crouch: 1, fy: -43 }],
    [1.45, PUMP],
    [2.3, { ...PUMP, fy: -41 }],
    [2.8, READY],
    [3.2, READY]
  ],
  hits: [{ t: 0.28, stop: 0.05, shake: 0.14, amp: 2 }],
  dust: [{ t: 0.3, x: 0, n: 7 }, { t: 0.74, x: 0, n: 6 }]
};
var REL = 0.28;
var RET = 1.02;
var GONE = 1.34;
var TOP3 = 100;
var TY = -68;
var DROP = 0.5;
var STAG = 0.05;
var LANDED = 1.06;
var SHINE = 1.24;
var EXIT = 2.3;
var STRANDS = Array.from({ length: 9 }, (_, i) => ({ x: (i / 8 - 0.5) * 1.5 + (rand(i, 1) - 0.5) * 0.16, sp: 170 + rand(i, 2) * 170, per: 10 + rand(i, 3) * 16, duty: 0.3 + rand(i, 4) * 0.35, ph: rand(i, 5), lvl: rand(i, 6) < 0.35 ? 1 : 2, end: 0.5 + rand(i, 7) * 0.42 }));
var widthAt = (t) => t < REL ? 0 : 12 * (1 + 0.4 * Math.exp(-(t - REL) * 10)) * (1 - 0.82 * smooth(RET - 0.12, RET + 0.16, t));
function column(p, C5, t) {
  const a = t - REL;
  if (a < 0 || t > GONE) return;
  const top = -TOP3 * ease.outExpo(clamp(a / 0.12)), bot = -TOP3 * ease.inCubic(seg(t, RET, GONE)), W7 = widthAt(t), k = 1 - smooth(RET, GONE, t);
  p.glowLine(0, top, 0, Math.min(bot, -34), W7 * 1.6 + 6, C5[5], 0.2 * k + 0.06);
  p.glowLine(0, top, 0, Math.min(bot, -40), 5, WHITE, 0.18 * k);
  if (a < 0.04) {
    for (let y = Math.floor(top); y < bot; y++) {
      const wr = W7 * 0.55 * (1 - 0.3 * (-y / TOP3));
      for (let x = Math.floor(-wr); x <= Math.ceil(wr); x++) p.dot(x, y, Math.abs(x + 0.5) < wr - 1.5 ? WHITE : C5[6], clamp((y + TOP3) / 20) * 1.5);
    }
    return;
  }
  for (let y = Math.ceil(top); y < Math.ceil(bot); y++) {
    const h = -y / TOP3, fade = clamp((y + TOP3) / 16) * (t < RET ? 1 : clamp((bot - y) / 10)), head4 = y - top < 3 && a < 0.16;
    const wr = W7 * (1 - 0.3 * h) + 0.9 * noise2(y * 0.2, t * 12, 3);
    for (const s of [-1, 1]) {
      const run = fract(y * 0.06 + t * 3.4 + (s > 0 ? 0.5 : 0)) < 0.78, xw = s * wr;
      p.dot(xw, y, head4 ? WHITE : run ? C5[6] : C5[5], fade * 1.4);
      p.dot(xw + s, y, C5[4], fade * (run ? 0.5 : 0.25));
      if (run) p.dot(xw - s, y, C5[5], fade * 1.2);
    }
    p.dot(0, y, WHITE, fade * 1.6);
    p.dot(-1, y, noise2(y * 0.3, t * 14, 5) > -0.2 ? WHITE : C5[6], fade * 1.3);
    if (noise2(y * 0.25, t * 9, 8) > 0.25) p.dot(1, y, C5[6], fade * 1.2);
    for (const S of STRANDS) {
      if (h > S.end) continue;
      const ph = fract((y + t * S.sp) / S.per + S.ph);
      if (ph > S.duty) continue;
      const u = ph / S.duty;
      p.px(S.x * wr, y, head4 || u < 0.2 ? WHITE : u < 0.65 ? C5[7 - S.lvl] : C5[6 - S.lvl]);
    }
  }
}
function plate(p, C5, t, k) {
  if (k <= 0.02) return;
  const rx = 9 + 9 * k + Math.sin(t * 9), ry = 2.2;
  p.shade(-rx, -ry, rx, ry, (x, y, o) => {
    const dx = x / rx, dy = y / ry, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1) return;
    const u = d / Math.max(0.05, k);
    o.c = u < 0.3 ? WHITE : u < 0.55 ? C5[6] : u < 0.8 ? C5[5] : C5[4];
    o.a = d < 0.6 * k ? 1 : k * (1 - d) * 2.2;
  });
  p.glow(0, -1, rx * 2.2, C5[4], 0.35 * k);
}
function rays(p, C5, t, k, cx, cy) {
  if (k <= 0.02) return;
  for (let i = 0; i < 20; i++) {
    const an = i / 20 * TAU + 0.08, ca = Math.cos(an), sa = Math.sin(an), long = i % 2 === 0;
    if (Math.abs(sa) < 0.4) continue;
    const r0 = 1 / Math.sqrt((ca / 52) ** 2 + (sa / 12) ** 2) + 2 * k, len2 = (long ? 15 + 7 * rand(i, 9) : 7 + 4 * rand(i, 8)) * k;
    if (len2 < 1) continue;
    const sh = 0.75 + 0.25 * Math.sin(t * 7 + i * 2.1), x0 = cx + ca * r0, y0 = cy + sa * r0;
    p.line(x0, y0, x0 + ca * len2, y0 + sa * len2, (u) => u < 0.3 ? C5[7] : u < 0.6 ? C5[6] : C5[5], (u) => sh * (u < 0.55 ? 1.3 : 1.3 * (1 - u) / 0.45));
  }
}
function create19(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), A2 = o.actor, SHADOW2 = scale(C5[0], 0.5);
  const ps = new Particles({ rng: R4, ground: () => 0, sparks: [C5[7], C5[6], C5[5], C5[3]] }), lights = new Lights();
  const spawn = (k, x, y, vx, vy, life, ...rest) => ps.spawn(k, x, y, vx, vy, Math.min(life, meta30.duration - 0.05 - t), ...rest);
  const word = spell(o.text), BASE = TY + 14, X0 = -word.w;
  const lets = word.letters.filter((L4) => L4.g).map((L4, i) => ({ g: L4.g, w: L4.w, cx: X0 + (L4.x + L4.w / 2) * 2, born: DROP + i * STAG, pop: EXIT + i * 0.04, off: -18, v: 60, sq: 0, flash: 0, on: false, landed: false, rest: false, burst: false }));
  const right = X0 + word.w * 2;
  const sats = Array.from({ length: 8 }, (_, i) => {
    const s = i % 2 ? 1 : -1, x = s * R4.range(20, 60), y = TY + 7 + (Math.abs(x) < 50 ? R4.sign() * R4.range(11, 18) : R4.range(-14, 14));
    return { x, y, t0: SHINE - 0.1 + i * 0.13 + R4.range(0, 0.05), dur: R4.range(0.32, 0.5), L: R4.range(3, 6) };
  });
  const halos = [];
  let t = 0, released = false, nextHalo = REL + 0.03, gather = 0;
  const rush = [];
  const drawRush = (p, back) => {
    for (const m of rush) {
      if (m.back !== back) continue;
      const sp = Math.hypot(m.vx, m.vy), ux = m.vx / sp, uy = m.vy / sp, L4 = m.len;
      p.line(m.x - ux * L4, m.y - uy * L4, m.x - ux * L4 * 0.4, m.y - uy * L4 * 0.4, m.c);
      p.line(m.x - ux * L4 * 0.35, m.y - uy * L4 * 0.35, m.x, m.y, WHITE);
      p.glow(m.x, m.y, 4, C5[5], 0.25);
    }
  };
  return {
    update(dt) {
      t += dt;
      for (gather += t < REL ? dt * 420 : 0; gather >= 1; gather--) {
        const kind = R4.next(), sp = R4.range(140, 250) * (1 + t * 2);
        let x, y, tx, ty;
        if (kind < 0.42) {
          const an = R4.range(0, TAU), D17 = R4.range(22, 70);
          x = Math.cos(an) * D17, y = -1 - Math.abs(Math.sin(an)) * D17 * 0.1, tx = Math.cos(an) * 3, ty = -1;
        } else if (kind < 0.84) {
          const an = R4.range(0, TAU), D17 = R4.range(34, 64);
          x = Math.cos(an) * D17, y = Math.min(-3, -20 + Math.sin(an) * D17 * 0.85), tx = Math.cos(an) * 11, ty = -20 + Math.sin(an) * 14;
        } else {
          if (t < REL * 0.4) continue;
          x = R4.range(-9, 9), y = -1, tx = x * 0.7, ty = -R4.range(26, 44);
        }
        const dx = tx - x, dy = ty - y, l = Math.hypot(dx, dy) || 1;
        rush.push({ x, y, vx: dx / l * sp, vy: dy / l * sp, life: Math.min(l / sp, REL + 0.06 - t), len: R4.range(5, 9), c: R4.chance(0.45) ? C5[6] : C5[5], back: kind > 0.84 && R4.chance(0.5) });
      }
      for (let i = rush.length - 1; i >= 0; i--) {
        const m = rush[i];
        if ((m.life -= dt) <= 0) rush.splice(i, 1);
        else m.x += m.vx * dt, m.y += m.vy * dt;
      }
      if (t < REL && R4.chance(0.12)) spawn(P.STAR, R4.range(-30, 30), -R4.range(0, 3), 0, -R4.range(10, 30), R4.range(0.3, 0.5), C5[6], 0.6);
      if (!released && t >= REL) {
        released = true;
        lights.add(0, -24, 90, C5[5], 0.6, 0.7);
        lights.add(0, -8, 40, WHITE, 0.6, 0.12);
        for (let i = 0; i < 22; i++) {
          const an = i / 22 * TAU + R4.range(-0.12, 0.12), sp = R4.range(260, 460);
          const y0 = -18 + Math.sin(an) * 8, vy = Math.sin(an) * sp * 0.8, life = Math.min(R4.range(0.1, 0.2), vy > 0 ? -y0 / vy : vy < 0 ? (y0 + 104) / -vy : 1, 78 / Math.abs(Math.cos(an) * sp));
          spawn(P.MOTE, Math.cos(an) * 6, y0, Math.cos(an) * sp, vy, life, R4.chance(0.4) ? C5[7] : C5[6], 1, 0, an > 0.3 && an < Math.PI - 0.3 ? PF.BACK : 0);
        }
        for (let i = 0; i < 26; i++) {
          const an = -Math.PI / 2 + R4.range(-1.3, 1.3), sp = R4.range(120, 290);
          spawn(P.SPARK, R4.range(-5, 5), -2, Math.cos(an) * sp, Math.sin(an) * sp, R4.range(0.35, 0.8));
        }
        for (let i = 0; i < 16; i++)
          spawn(P.STAR, R4.range(-10, 10), R4.range(-36, -4), R4.range(-30, 30), -R4.range(15, 60), R4.range(0.6, 1.3), R4.pick([C5[7], C5[6], C5[5]]), R4.chance(0.35) ? R4.range(1.5, 2.6) : R4.range(0.4, 0.9), 0, R4.chance(0.4) ? PF.BACK : 0);
      }
      const W7 = widthAt(t);
      if (t >= nextHalo && t < RET - 0.1) halos.push(t), nextHalo += 0.16;
      if (t > REL && t < RET + 0.1 && R4.chance(0.5)) {
        const s = R4.sign();
        const y = R4.range(-4, -60), vy = -R4.range(140, 260);
        spawn(P.MOTE, s * R4.range(0.75, 1.6) * W7, y, 0, vy, Math.min(R4.range(0.16, 0.32), (y + 96) / -vy), R4.chance(0.5) ? C5[7] : C5[6], R4.range(0.6, 1), 0, R4.chance(0.5) ? PF.BACK : 0);
      }
      if (t > REL && t < 2.4 && R4.chance(0.14 * (1 - seg(t, 1.6, 2.4)))) {
        spawn(P.EMBER, R4.range(-20, 20), -R4.range(1, 30), R4.range(-15, 15), -R4.range(20, 55), R4.range(0.8, 1.6), C5[5], R4.range(1, 2), 0, R4.chance(0.4) ? PF.BACK : 0);
      }
      if (A2 && t > REL + 0.1 && t < 2.2 && R4.chance(0.09)) {
        const m = A2.mask;
        for (let n = 0; n < 12; n++) {
          const i = R4.int(0, m.w - 1), j = R4.int(0, m.h - 1);
          if (!m.data[j * m.w + i]) continue;
          spawn(P.STAR, A2.x + i + 0.5, A2.y + j + 0.5, R4.range(-8, 8), -R4.range(14, 34), R4.range(0.6, 1.1), R4.pick([C5[7], C5[6], C5[5]]), R4.chance(0.2) ? 1.5 : 0.6, 0, R4.chance(0.5) ? PF.BACK : 0);
          break;
        }
      }
      if (t > 1 && t < 2.5 && R4.chance(0.13)) {
        const up = R4.chance(0.6), x = up ? R4.range(-58, 58) : R4.range(-20, 20), y = up ? TY + 7 + R4.range(-16, 16) : R4.range(-44, -6);
        spawn(P.STAR, x, y, R4.range(-6, 6), -R4.range(4, 14), R4.range(0.4, 0.8), R4.pick([C5[7], C5[6], C5[6], C5[5]]), R4.chance(0.3) ? R4.range(1.5, 2.4) : 0.6, 0, R4.chance(0.3) ? PF.BACK : 0);
      }
      for (const L4 of lets) {
        if (t < L4.born) continue;
        L4.on = true;
        if (!L4.rest) {
          L4.v += 1700 * dt;
          L4.off += L4.v * dt;
          if (L4.off >= 0 && L4.v > 0) {
            L4.off = 0;
            if (L4.v > 110) {
              L4.sq = 1;
              if (!L4.landed) {
                L4.landed = true;
                L4.flash = 1;
                lights.add(L4.cx, BASE - 7, 18, C5[5], 0.55, 0.25);
                for (const s of [-1, 1]) spawn(P.STAR, L4.cx + s * L4.w, BASE - R4.range(0, 3), s * R4.range(15, 40), -R4.range(5, 25), R4.range(0.25, 0.45), C5[6], R4.range(0.5, 1.2));
              }
              L4.v = -L4.v * 0.3;
            } else L4.v = 0, L4.rest = true;
          }
        }
        L4.sq = Math.max(0, L4.sq - dt / 0.1);
        L4.flash = Math.max(0, L4.flash - dt / 0.12);
        if (!L4.burst && t >= L4.pop + 0.06) {
          L4.burst = true;
          for (let i = 0; i < 3; i++) {
            const an = R4.range(0, TAU), sp = R4.range(20, 55);
            spawn(P.STAR, L4.cx + R4.range(-3, 3), BASE - 7 + R4.range(-4, 4), Math.cos(an) * sp, Math.sin(an) * sp - 15, R4.range(0.3, 0.6), R4.pick([C5[7], C5[6]]), i ? 0.6 : R4.range(1.2, 2));
          }
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      rays(p, C5, t, ease.outExpo(seg(t, LANDED, LANDED + 0.2)) * (1 - ease.inQuad(seg(t, EXIT - 0.15, EXIT + 0.1))), 0, TY + 7);
      if (t < REL) {
        const k = seg(t, 0.02, REL);
        band(p, 0, 0, 4 + 52 * (1 - ease.inQuad(k)), 0.2, 1.5, k * 1.1, C5, (g) => Math.sin(g) < 0);
      }
      for (const [d, r1, th] of [[0, 72, 4], [0.08, 46, 2.5]]) {
        const k = (t - REL - d) / 0.55;
        if (k > 0 && k < 1) band(p, 0, 0, 5 + r1 * ease.outCubic(k), 0.2, Math.max(1, th * (1 - k)), 1.15 - k, C5, (g) => Math.sin(g) < 0, k < 0.15);
      }
      for (const h0 of halos) {
        const k = (t - h0) / 0.6;
        if (k > 0 && k < 1) band(p, 0, -2 - 72 * ease.outQuad(k), (widthAt(t) * 1.45 + 4) * (1 - 0.4 * k), 0.3, 1.5, (1 - k) * 1.4, C5, (g) => Math.sin(g) < 0, k < 0.12);
      }
      column(p, C5, t);
      plate(p, C5, t, t < REL ? 0.55 * seg(t, 0.05, REL) : 1 - smooth(RET - 0.1, GONE + 0.2, t));
      ps.draw(p, "back");
      drawRush(p, true);
    },
    draw(p) {
      if (t < REL) {
        const k = seg(t, 0.02, REL);
        band(p, 0, 0, 4 + 52 * (1 - ease.inQuad(k)), 0.2, 1.5, k * 1.1, C5, (g2) => Math.sin(g2) >= 0);
      }
      for (const [d, r1, th] of [[0, 72, 4], [0.08, 46, 2.5]]) {
        const k = (t - REL - d) / 0.55;
        if (k > 0 && k < 1) band(p, 0, 0, 5 + r1 * ease.outCubic(k), 0.2, Math.max(1, th * (1 - k)), 1.15 - k, C5, (g2) => Math.sin(g2) >= 0, k < 0.15);
      }
      for (const h0 of halos) {
        const k = (t - h0) / 0.6;
        if (k > 0 && k < 1) band(p, 0, -2 - 72 * ease.outQuad(k), (widthAt(t) * 1.45 + 4) * (1 - 0.4 * k), 0.3, 1.5, (1 - k) * 1.4, C5, (g2) => Math.sin(g2) >= 0, k < 0.12);
      }
      const lit = smooth(REL - 0.02, REL + 0.04, t) * (1 - smooth(RET, 2.5, t));
      tintActor(p, A2, t < REL ? 0 : t < REL + 0.06 ? 1 : Math.exp(-(t - REL - 0.06) / 0.07), [C5[4], C5[5], C5[6]]);
      lightActor(p, A2, C5[5], 0.1 * seg(t, 0.05, REL) * (1 - lit) + 0.06 * lit, 0.6 * lit, t);
      haloActor(p, A2, C5[5], 0.85 * lit * (1 - smooth(RET, GONE + 0.3, t)) + 0.3 * lit, t);
      if (t < REL) {
        const k = seg(t, 0.05, REL), beat3 = 1 + 0.4 * Math.exp(-((t - REL * 0.6) ** 2) / 1e-3);
        sparkle(p, 0, -2, (1 + 4 * k * k) * beat3, C5[6], C5[5], 0.3 + 0.4 * k);
      } else if (t < REL + 0.22) {
        const a = (t - REL) / 0.22;
        flare(p, 0, -4, 28 * Math.pow(1 - a, 1.5), 1 - a, C5);
        p.glow(0, -16, 48, WHITE, 0.3 * (1 - a));
      }
      ps.draw(p, "front");
      drawRush(p, false);
      const items = [], done = (t - LANDED) / 0.12;
      for (const L4 of lets) {
        if (!L4.on) continue;
        let sx = 2, sy = 2, flash = L4.flash;
        if (!L4.landed && L4.v > 150) sx = 1.8, sy = 2.3;
        if (L4.sq > 0) sx = 2 * (1 + 0.22 * L4.sq), sy = 2 * (1 - 0.22 * L4.sq);
        const pu = (t - L4.pop) / 0.07, hop = seg(t, L4.pop - 0.1, L4.pop);
        if (pu >= 1) continue;
        if (hop > 0 && pu <= 0) sx = 2 * (1 - 0.1 * hop), sy = 2 * (1 + 0.15 * hop);
        if (pu > 0) sx = sy = 2 * (1 + 0.3 * pu), flash = 1;
        flash = Math.max(flash, done > 0 && done < 1 ? 1 - done : 0);
        const h = 7 * sy, w = L4.w * sx;
        items.push({ g: L4.g, x: L4.cx - w / 2, y: BASE + L4.off - h - 3 * ease.outQuad(hop), sx, sy, a: clamp((t - L4.born) / 0.05), flash });
      }
      const sh = seg(t, SHINE, SHINE + 0.34), shine = sh > 0 && sh < 1 ? X0 - 14 + (right - X0 + 30) * ease.inOutSine(sh) : null;
      drawWord(p, items, { fill: [C5[3], C5[4], C5[5], C5[6]], edge: WHITE, under: C5[2], outline: C5[0], shadow: SHADOW2, shine, shineY: TY, glint: C5[6] });
      if (shine !== null && shine > X0 && shine < right) p.glowLine(shine, TY, shine + 8.4, BASE, 9, C5[6], 0.3);
      const hold = smooth(0.9, 1.2, t) * (1 - smooth(EXIT, EXIT + 0.4, t));
      if (hold > 0) p.glow(0, TY + 7, 50, C5[5], 0.22 * hold + (done > 0 && done < 1 ? 0.3 * (1 - done) : 0));
      for (const L4 of lets) {
        const u = (t - L4.pop - 0.07) / 0.16;
        if (u > 0 && u < 1) sparkle(p, L4.cx, BASE - 7, 6 * (1 - u) * (1 - u), C5[6], C5[5], 0.5);
      }
      const g = (t - SHINE - 0.3) / 0.26;
      if (g > 0 && g < 1) sparkle(p, right - 2, TY + 1, 7 * Math.sin(g * Math.PI), C5[6], C5[5], 0.6);
      for (const s of sats) {
        const u = (t - s.t0) / s.dur;
        if (u > 0 && u < 1) sparkle(p, s.x, s.y, s.L * Math.pow(Math.sin(u * Math.PI), 0.7), C5[6], C5[5], 0.5);
      }
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/arcane/rune-circle.js
var rune_circle_exports = {};
__export(rune_circle_exports, {
  draw: () => draw12,
  drawBack: () => drawBack10,
  meta: () => meta31
});

// ../pixelfx/src/fx/arcane/_lib.js
var BAYER3 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
var CROSS3 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function mote(p, x, y, vx, vy, c, size = 1, k = 1, glow = 0.4) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len2 = Math.min(16, 0.5 + sp * 0.026) * size, a = k < 0.35 ? k / 0.35 : 1;
  if (len2 > 1.2) p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.35, y - uy * len2 * 0.35, scale(c, 0.55), a);
  p.line(x - ux * len2 * 0.4, y - uy * len2 * 0.4, x, y, c, a);
  if (glow > 0) p.glow(x, y, 2.5 + size, c, glow * k);
}
function floorRing(p, cx, cy, r, sy, c, a = 1, keep2 = null) {
  if (r < 0.5) return;
  const fc = typeof c === "function", fa = typeof a === "function", ry = r * sy;
  p.shade(cx - r - 1, cy - ry - 1, cx + r + 1, cy + ry + 1, (x, y, o) => {
    const nx = (x - cx) / r, ny = (y - cy) / Math.max(0.3, ry), d = Math.hypot(nx, ny);
    if (d < 1e-6) return;
    const g = Math.hypot(nx / r, ny / Math.max(0.3, ry)) / d;
    if (Math.abs(d - 1) / g > 0.5) return;
    const ang = Math.atan2(ny, nx);
    if (keep2 && !keep2(ang)) return;
    o.c = fc ? c(ang) : c;
    o.a = fa ? a(ang) : a;
  });
}
var GLYPHS = [
  [".#.", "#.#", ".#.", ".#.", "#.#"],
  ["#.#", "#.#", ".#.", "#.#", "#.#"],
  ["##.", "#.#", "##.", "#..", "#.."],
  ["#..", "#.#", "###", "#.#", "..#"],
  [".##", "#..", ".#.", "..#", "##."],
  ["###", ".#.", "###", ".#.", ".#."],
  ["#.#", "###", "#.#", "..#", "..#"],
  [".#.", ".##", ".#.", "##.", ".#."]
];
function glyph(p, i, x, y, c, a = 1, under = 0) {
  const g = GLYPHS[(i % GLYPHS.length + GLYPHS.length) % GLYPHS.length], X = Math.round(x) - 1, Y = Math.round(y) - g.length + 1;
  if (under) p.sprite(g, {}, X, Y + 1, { tint: under, a });
  p.sprite(g, {}, X, Y, { tint: c, a });
}
var SIGILS = [
  ["..#..", ".#.#.", "#.#.#", "..#..", ".###.", "..#..", ".#.#."],
  ["#...#", ".#.#.", "..#..", ".###.", "..#..", ".#.#.", "#...#"],
  ["#....", "##...", "#.#..", "#..#.", "#.#..", "##...", "#...."],
  ["..#..", "#.#.#", ".###.", "..#..", "..#..", ".#.#.", "#...#"],
  ["#.#.#", "#.#.#", "#####", "..#..", "..#..", "..#..", ".###."],
  ["#...#", "##.##", "#.#.#", "#...#", "#.#.#", "##.##", "#...#"],
  ["..#..", ".#.#.", "#...#", ".#.#.", "..#..", "..#..", "..#.."],
  ["#..#.", "#.#..", "##...", "#....", "##...", "#.#..", "#..#."]
];
function sigil2(p, i, x, y, c, a = 1, edge = 0) {
  const g = SIGILS[(i % SIGILS.length + SIGILS.length) % SIGILS.length], X = Math.round(x) - 2, Y = Math.round(y) - 3;
  if (edge) for (const [dx, dy] of CROSS3) p.sprite(g, {}, X + dx, Y + dy, { tint: edge, a });
  p.sprite(g, {}, X, Y, { tint: c, a });
}

// ../pixelfx/src/fx/arcane/rune-circle.js
var D13 = 4;
var R3 = 46;
var RR = 39;
var RI = 23;
var RC = 7;
var SY4 = 0.3;
var NR = 12;
var meta31 = {
  name: "Rune circle",
  desc: "A rune circle turns on the floor in perspective: a carousel of runes lit by chasing light, a turning square, ticks, motes rising off it.",
  tags: ["arcane", "rune", "circle", "magic", "aura", "ground", "loop"],
  size: [136, 100],
  origin: [68, 80],
  duration: D13,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, seed: 8 }
};
var at6 = (g, r) => [Math.cos(g) * r, Math.sin(g) * r * SY4];
var gap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
function circle2(p, C5, t, far) {
  const ph = t / D13, spin = ph * TAU / 4, keep2 = far ? (g) => Math.sin(g) < 0 : (g) => Math.sin(g) >= 0;
  const chase = ph * TAU * 2, lit = (g, w) => gap(g, chase) < w || gap(g, chase + Math.PI) < w;
  const tone = (g, hi, lo) => Math.sin(g) < 0 ? lo : hi;
  floorRing(p, 0, 0, R3, SY4, (g) => lit(g, 0.22) ? WHITE : lit(g, 0.5) ? C5[6] : tone(g, C5[6], C5[5]), 1, keep2);
  floorRing(p, 0, 0, RI, SY4, (g) => tone(g, C5[5], C5[4]), 1, keep2);
  floorRing(p, 0, 0, RC, SY4, (g) => tone(g, C5[6], C5[5]), 1, keep2);
  for (let j = 0; j < 16; j++) {
    const g = spin + (j + 0.5) * TAU / 16;
    if (Math.sin(g) < 0 !== far) continue;
    const [x, y] = at6(g, R3 + 3.5), hot = lit(g, 0.3);
    p.px(x, y, hot ? WHITE : tone(g, j % 2 ? C5[5] : C5[6], C5[4]));
    if (j % 2 === 0) for (const [dx, dy] of [[1, 0], [-1, 0]]) p.px(x + dx, y + dy, hot ? C5[6] : tone(g, C5[4], C5[3]));
  }
  const pts = [0, 1, 2, 3].map((k) => at6(-spin + k * TAU / 4 + Math.PI / 4, RI));
  for (let k = 0; k < 4; k++) {
    let [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % 4];
    if (ay < 0 !== by < 0) {
      const u = ay / (ay - by), mx = ax + (bx - ax) * u;
      if (ay < 0 === far) bx = mx, by = 0;
      else ax = mx, ay = 0;
    } else if (ay < 0 !== far) continue;
    p.line(ax, ay, bx, by, far ? C5[4] : C5[5]);
  }
  const gs = [...Array(NR).keys()].map((k) => [k, spin + (k + 0.5) * TAU / NR]).filter(([, g]) => Math.sin(g) < 0 === far);
  gs.sort((a, b) => Math.sin(a[1]) - Math.sin(b[1]));
  for (const [k, g] of gs) {
    const [x, y] = at6(g, RR), hot = lit(g, 0.2), bob2 = Math.sin(ph * TAU * 4 + 4 * g) * 0.5;
    glyph(p, [0, 3, 5][k % 3], x, y - 1 + bob2, hot ? WHITE : far ? C5[5] : C5[6], 1, hot ? C5[5] : far ? C5[2] : C5[3]);
    p.glow(x, y - 3, hot ? 10 : 6, C5[5], hot ? 0.5 : far ? 0.12 : 0.22);
    p.glow(x, y, 5, C5[4], 0.15);
  }
}
function motes2(p, C5, t, S, far) {
  cycle(t, D13, 76, S * 5 + 1, (g) => g.range(1.1, 1.9), (age, life, r) => {
    const g0 = r.range(0, TAU), r0 = r.pick([R3, R3, RR, RR, RI]), q = age / life, g = g0 + q * r.range(0.6, 1.4);
    if (Math.sin(g) < 0 !== far) return;
    const rr = r0 * (1 - 0.35 * q), h = 2 + ease.outQuad(q) * r.range(26, 52), x = Math.cos(g) * rr, y = Math.sin(g) * rr * SY4 - h;
    const a = Math.min(1, q * 5) * (1 - smooth(0.65, 1, q)), big = r.chance(0.2);
    mote(p, x, y, -Math.sin(g) * rr * 0.8, -36 * (1 - q) - 10, r.chance(0.3) ? WHITE : r.chance(0.6) ? C5[6] : C5[5], big ? 1.1 : r.range(0.55, 0.9), a, big ? 0.5 : 0.3);
  });
  cycle(t, D13, 14, S * 5 + 2, 0.45, (age, life, r) => {
    const g = r.range(0, TAU);
    if (Math.sin(g) < 0 !== far) return;
    const rr = r.range(8, R3), x = Math.cos(g) * rr, y = Math.sin(g) * rr * SY4 - r.range(6, 34), k = Math.sin(age / life * Math.PI);
    sparkle(p, x, y, 1 + 2.4 * k, C5[6], C5[5], 0.35 * k);
  });
}
function drawBack10(p, t, o) {
  const C5 = fit(o.palette, 8), pulse2 = 0.85 + 0.15 * Math.sin(t / D13 * TAU * 4);
  p.glow(0, 0, R3 * 1.4, C5[4], 0.24 * pulse2);
  for (const s of [-1, 1]) p.glow(s * R3 * 0.55, 1, R3 * 0.7, C5[5], 0.12 * pulse2);
  for (let h = 0; h < 66; h += 6) p.glow(0, -h, 26, C5[4], 0.11 * pulse2 * (1 - h / 80));
  circle2(p, C5, t, true);
  motes2(p, C5, t, o.seed, true);
}
function draw12(p, t, o) {
  const C5 = fit(o.palette, 8), chase = t / D13 * TAU * 2;
  circle2(p, C5, t, false);
  motes2(p, C5, t, o.seed, false);
  for (const g of [chase, chase + Math.PI]) {
    const [x, y] = at6(g, R3);
    sparkle(p, x, y, 2.5 + Math.sin(t * 30) * 0.8, C5[6], C5[5], 0.5);
    p.glow(x, y, 14, C5[5], 0.4);
  }
}

// ../pixelfx/src/fx/arcane/mana-burst.js
var mana_burst_exports = {};
__export(mana_burst_exports, {
  create: () => create20,
  meta: () => meta32
});
var CY4 = -28;
var GATHER = 0.22;
var N3 = 9;
var meta32 = {
  name: "Mana burst",
  desc: "Energy rushes into a point and blows out in a white flash and rings, flinging glowing runes that flare and pop into sparks one after another.",
  tags: ["arcane", "burst", "mana", "rune", "nova", "magic", "ground", "one-shot"],
  size: [208, 150],
  origin: [104, 124],
  duration: 1.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, seed: 9 }
};
function create20(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed);
  const ps = new Particles({ rng: R4, ground: () => 0, sparks: [WHITE, C5[6], C5[5], C5[4]] }), lights = new Lights();
  const runes = Array.from({ length: N3 }, (_, i) => {
    const a = i / N3 * TAU + R4.range(-0.25, 0.25) - Math.PI / 2, sp = R4.range(150, 210);
    return { g: i, x: 0, y: CY4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (Math.sin(a) > 0 ? 0.42 : 0.85), pop: GATHER + 0.42 + i * 0.065 + R4.range(0, 0.05), popped: false, ph: R4.range(0, TAU) };
  });
  const pops = [];
  let t = 0, released = false;
  return {
    update(dt) {
      t += dt;
      if (t < GATHER - 0.03) {
        for (let i = 0; i < 2; i++) {
          const a = R4.range(0, TAU), D17 = R4.range(24, 52), T4 = R4.range(0.12, 0.18), v = D17 * 3 / (Math.exp(3 * T4) - 1);
          const x = Math.cos(a) * D17, y = Math.min(-2, CY4 + Math.sin(a) * D17 * 0.85), l = Math.hypot(x, y - CY4) || 1;
          ps.spawn(P.STREAK, x, y, -x / l * v, (CY4 - y) / l * v, T4, R4.chance(0.5) ? C5[6] : C5[5]);
        }
      }
      if (t >= GATHER && !released) {
        released = true;
        lights.add(0, CY4 - 12, 96, C5[5], 1, 0.5);
        lights.add(0, CY4, 40, WHITE, 0.9, 0.1);
        for (let i = 0; i < 96; i++) {
          const a = R4.range(0, TAU), sp = R4.range(100, 250), dn = Math.sin(a) > 0 ? 0.45 : 1;
          ps.spawn(R4.chance(0.65) ? P.MOTE : P.STAR, 0, CY4, Math.cos(a) * sp, Math.sin(a) * sp * dn, R4.range(0.25, 0.55), R4.pick([WHITE, C5[6], C5[5]]), R4.range(0.8, 1.8));
        }
        for (let i = 0; i < 20; i++) {
          const a = R4.range(0, TAU), sp = R4.range(130, 280);
          ps.spawn(P.SPARK, 0, CY4, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.2, 0.45));
        }
      }
      if (released)
        for (const r of runes) {
          if (r.popped) continue;
          r.vx -= r.vx * 4.2 * dt;
          r.vy -= r.vy * 4.2 * dt + 8 * dt;
          r.x += r.vx * dt;
          r.y += r.vy * dt;
          if (R4.chance(0.35)) ps.spawn(P.MOTE, r.x + R4.range(-1.5, 1.5), r.y, r.vx * 0.2 + R4.range(-10, 10), r.vy * 0.2 - R4.range(5, 25), R4.range(0.2, 0.4), C5[5], 0.5);
          if (t >= r.pop) {
            r.popped = true;
            pops.push({ t, x: r.x, y: r.y });
            lights.add(r.x, r.y, 34, C5[5], 0.9, 0.22);
            lights.add(r.x, r.y, 12, WHITE, 0.8, 0.06);
            for (let i = 0; i < 9; i++) {
              const a = R4.range(0, TAU), sp = R4.range(70, 200);
              ps.spawn(P.SPARK, r.x, r.y, Math.cos(a) * sp, Math.sin(a) * sp - 40, R4.range(0.15, 0.4));
            }
            for (let i = 0; i < 5; i++) {
              const a = R4.range(0, TAU), sp = R4.range(20, 80);
              ps.spawn(i % 2 ? P.STAR : P.MOTE, r.x, r.y, Math.cos(a) * sp, Math.sin(a) * sp - 20, R4.range(0.3, 0.6), R4.pick([WHITE, C5[6]]), R4.range(0.8, 1.6));
            }
          }
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const k = t < GATHER ? 0.4 * (t / GATHER) : Math.max(0, 1 - (t - GATHER) / 1.1);
      if (k > 0) p.glow(0, -1, 50, C5[4], 0.3 * k);
    },
    draw(p) {
      if (t < GATHER) {
        const k = t / GATHER, r = 1 + 3.5 * k * k;
        p.circle(0, CY4, r + 1.2, C5[4]);
        p.circle(0, CY4, r, C5[6]);
        p.circle(0, CY4, r * 0.5, WHITE);
        p.glow(0, CY4, 10 + 20 * k, C5[5], 0.4 + 0.4 * k);
        const q = clamp((t - GATHER * 0.35) / (GATHER * 0.65));
        if (q > 0 && q < 1) p.ring(0, CY4, r + 2 + 16 * (1 - ease.outCubic(q)), 1, q > 0.6 ? WHITE : C5[6], 1 - q * 0.5);
      } else {
        const q = (t - GATHER) / 0.6;
        if (q < 1) {
          const e = ease.outCubic(q);
          if (q < 0.12) {
            p.circle(0, CY4, 12 * (1 - q / 0.12) + 2, C5[5]);
            p.circle(0, CY4, 12 * (1 - q / 0.12), WHITE);
          }
          if (q < 0.32) flare(p, 0, CY4, 30 * (1 - q / 0.32) + 4, 1 - q / 0.32, C5);
          p.ring(0, CY4, 4 + 62 * e, Math.max(1, 5 * (1 - q)), q < 0.2 ? WHITE : C5[6], (v, ang) => CY4 + Math.sin(ang) * (4 + 62 * e) > 0 ? 0 : 1.2 - q);
          p.ring(0, CY4, 2 + 38 * ease.outCubic(Math.min(1, q * 1.4)), Math.max(1, 2 * (1 - q)), C5[5], (v, ang) => CY4 + Math.sin(ang) * 40 > 0 ? 0 : 1 - q);
          p.glow(0, CY4, 60 * (0.4 + 0.6 * e), C5[5], 0.9 * (1 - q));
        }
      }
      for (const r of runes) {
        if (!released || r.popped) continue;
        const left = r.pop - t, hot = t - GATHER < 0.08 || left < 0.06, bob2 = Math.sin(t * 9 + r.ph) * 0.6;
        sigil2(p, r.g, r.x, r.y + bob2, hot ? WHITE : C5[6], 1, hot ? C5[4] : C5[3]);
        p.glow(r.x, r.y + bob2, 10, C5[5], hot ? 0.7 : 0.35);
        if (left < 0.06) sparkle(p, r.x, r.y + bob2, 3 + 4 * (1 - left / 0.06), C5[6], C5[5], 0.5);
      }
      for (const q of pops) {
        const k = (t - q.t) / 0.32;
        if (k >= 1) continue;
        if (k < 0.35) flare(p, q.x, q.y, 11 * (1 - k / 0.35) + 2, 1 - k / 0.35, C5);
        p.ring(q.x, q.y, 2 + 11 * ease.outCubic(k), Math.max(1, 2 * (1 - k)), k < 0.3 ? WHITE : C5[6], 1.15 - k);
      }
      ps.draw(p);
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/status/frozen.js
var frozen_exports = {};
__export(frozen_exports, {
  act: () => act11,
  actorAlpha: () => actorAlpha2,
  draw: () => draw13,
  drawBack: () => drawBack11,
  meta: () => meta33
});

// ../pixelfx/src/fx/status/_lib.js
var SHAPES2 = /* @__PURE__ */ new WeakMap();
function shape(a) {
  const m = a.mask;
  let s = SHAPES2.get(m);
  if (s) return s;
  const { w, h, data } = m, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[y * w + x] > 0;
  const body2 = [], up = [], side = [], outline = [], top = [], rows = [];
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h && !on(x, y)) y++;
    top.push(y < h ? y : -1);
  }
  for (let y = 0; y < h; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      if (l < 0) l = x;
      r = x;
      body2.push([x, y]);
      if (!on(x, y - 1)) up.push([x, y]);
      if (!on(x - 1, y)) side.push([x, y, -1]);
      if (!on(x + 1, y)) side.push([x, y, 1]);
    }
    rows.push([l, r]);
  }
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      if (on(x, y)) continue;
      let nx = 0, ny = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (on(x + dx, y + dy)) nx -= dx, ny -= dy;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) {
        const l = Math.hypot(nx, ny) || 1;
        outline.push([x, y, nx / l, ny / l]);
      }
    }
  s = { w, h, on, body: body2, up, side, outline, top, rows };
  SHAPES2.set(m, s);
  return s;
}
var colorAt = (a, x, y) => a.pixels ? a.pixels[y * a.mask.w + x] : a.mask.data[y * a.mask.w + x] ? 4285229931 : 0;
function wnoise(x, P3, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = rand(wrap(i, P3), seed), b = rand(wrap(i + 1, P3), seed);
  return (a + (b - a) * u) * 2 - 1;
}
function tnoise(t, D17, f, seed = 0, off = 0) {
  const P3 = Math.max(2, Math.round(f * D17));
  return wnoise(t / D17 * P3 + off, P3, seed);
}
var travel2 = (v, g, d, a) => d > 0 ? g / d * a + (v - g / d) * (1 - Math.exp(-d * a)) / d : v * a + 0.5 * g * a * a;
var LAYERS3 = [[1, 1, 6], [0.76, 0.86, 4], [0.54, 0.68, 2], [0.3, 0.42, 0]];
function tongue3(p, x, y, h, w, sx, F, t, D17, n, layers = LAYERS3) {
  if (h < 1) return;
  for (const [lw, lh, ri] of layers) {
    if (ri === 0 && h < 4) continue;
    const H4 = h * lh, col = F[ri];
    for (let r = 0; r <= H4; r++) {
      const u = r / Math.max(1, H4);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + tnoise(t, D17, 9, n, r * 0.45) * 0.5;
      if (half < 0.3) continue;
      const cx = x + sx * u * u * lh + tnoise(t, D17, 4, n + 7, r * 0.2) * u * 1.1;
      for (let px = Math.round(cx - half); px <= Math.round(cx + half); px++) p.px(px, Math.round(y - r), col);
    }
  }
}
var rampAt3 = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];
function smoke(p, x, y, size, u, col, k = 1, warm = 0) {
  const r = size * (0.65 + Math.min(1, u * 2.5) * 0.45 + u * 0.4);
  const a = Math.min(1, u * 12) * Math.min(1, (1 - u) * 2.4) * 0.58 * k;
  if (a <= 0.01) return;
  const c = col ? mix(col, rampAt3(SMOKE_RAMP, u), u) : rampAt3(SMOKE_RAMP, u * 1.05);
  p.disc(x, y, r, c, a * 0.45);
  p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
  if (warm && u < 0.6) p.disc(x + r * 0.1, y + r * 0.3, r * 0.56, mix(c, warm, 0.5), a * 0.7 * (1 - u / 0.6));
  if (u < 0.5) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - u * 2));
}
function ember2(p, x, y, u, E, ph, k = 1) {
  const left = 1 - u;
  if (left < 0.22 && Math.sin(ph * 40) < 0) return;
  const c = left > 0.5 ? Math.sin(ph * 22) > -0.2 ? E[0] : E[1] : left > 0.22 ? E[1] : E[2];
  p.px(x, y, c);
  p.glow(x, y, 3, c, 0.32 * left * k);
}
function bitmap(rows, k = 1, flip = false) {
  const h = rows.length, w = rows[0].length, ox = Math.floor(w * k / 2), oy = Math.floor(h * k / 2);
  return (dx, dy) => {
    let bx = Math.floor((dx + ox) / k);
    const by = Math.floor((dy + oy) / k);
    if (bx < 0 || by < 0 || bx >= w || by >= h) return "";
    if (flip) bx = w - 1 - bx;
    const c = rows[by][bx];
    return c === "." ? "" : c;
  };
}
function icon(p, x, y, ext, inside2, R4, a = 1, paint = null) {
  const X = Math.round(x), Y = Math.round(y), at8 = (dx, dy) => !!inside2(dx, dy);
  for (let dy = -ext - 1; dy <= ext + 1; dy++)
    for (let dx = -ext - 1; dx <= ext + 1; dx++) {
      const ch = inside2(dx, dy);
      let c;
      if (ch) {
        if (paint && paint[ch] !== void 0) c = paint[ch];
        else {
          const top = !at8(dx, dy - 1), left = !at8(dx - 1, dy), bottom = !at8(dx, dy + 1), right = !at8(dx + 1, dy);
          c = top || left ? R4[3] : bottom || right ? R4[1] : R4[2];
        }
      } else if (R4[0] && (at8(dx - 1, dy) || at8(dx + 1, dy) || at8(dx, dy - 1) || at8(dx, dy + 1))) c = R4[0];
      else continue;
      p.dot(X + dx, Y + dy, c, a);
    }
}
var shaped = (f, s, ang = 0) => {
  const c = Math.cos(ang), n = Math.sin(ang);
  return (dx, dy) => {
    const x = dx + 0.5, y = dy + 0.5;
    return f((x * c + y * n) / s, (-x * n + y * c) / s) ? "#" : "";
  };
};
function starShape(r0 = 0.45) {
  return (u, v) => {
    const a = Math.atan2(v, u) + Math.PI / 2, d = Math.hypot(u, v), seg2 = 2 * Math.PI / 5;
    const k = 1 - Math.abs((a % seg2 + seg2) % seg2 - seg2 / 2) / (seg2 / 2);
    return d <= 1 - (1 - r0) * Math.pow(k, 0.8);
  };
}
var EYES = /* @__PURE__ */ new WeakMap();
function eyes(a) {
  let list = EYES.get(a.mask);
  if (list) return list;
  if (a.eyes) {
    list = a.eyes.map(([x, y]) => ({ x0: x, x1: x, y0: y, y1: y + 1, px: [[x, y], [x, y + 1]], skin: colorAt(a, x, y) }));
    EYES.set(a.mask, list);
    return list;
  }
  const S = shape(a), W7 = S.w, col = (x, y) => S.on(x, y) ? colorAt(a, x, y) : 0;
  const dark = (x, y) => S.on(x, y) && y < S.h * 0.4 && luma(col(x, y)) < 0.15 && S.on(x - 1, y) && S.on(x + 1, y) && S.on(x, y - 1) && S.on(x, y + 1);
  const seen = /* @__PURE__ */ new Set();
  list = [];
  for (const [x0, y0] of S.body) {
    if (seen.has(y0 * W7 + x0) || !dark(x0, y0)) continue;
    const px = [], q = [[x0, y0]];
    seen.add(y0 * W7 + x0);
    while (q.length) {
      const [x, y] = q.pop();
      px.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * W7 + nx;
        if (seen.has(k) || !(dark(nx, ny) || S.on(nx, ny) && luma(col(nx, ny)) > 0.95)) continue;
        seen.add(k);
        q.push([nx, ny]);
      }
    }
    if (px.length < 2 || px.length > 14) continue;
    const xs = px.map((p) => p[0]), ys = px.map((p) => p[1]), counts = /* @__PURE__ */ new Map();
    const e = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), px };
    for (const [x, y] of px)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
        const c = col(x + dx, y + dy), l = luma(c);
        if (c && l > 0.5 && l < 0.95 && !px.some((p) => p[0] === x + dx && p[1] === y + dy)) counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    e.skin = [...counts].sort((p, q2) => q2[1] - p[1])[0]?.[0];
    if (e.skin && e.x1 - e.x0 <= 4 && e.y1 - e.y0 <= 5) list.push(e);
  }
  list.sort((p, q) => p.x0 - q.x0);
  if (list.length > 2) list = [];
  EYES.set(a.mask, list);
  return list;
}

// ../pixelfx/src/fx/status/frozen.js
var meta33 = {
  name: "Frozen",
  desc: "Chilled to the bone: frost ferns creep over the body, icicles hang from chin and hands and drip, breath steams, snow settles, a shiver every second, frost spreads underfoot.",
  tags: ["status", "ice", "freeze", "frozen", "cold", "chill", "debuff", "loop"],
  size: [72, 64],
  origin: [36, 54],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], seed: 4 }
};
var STIFF = { turn: 0.9, crouch: 1, fx: -6, fy: -15, bx: 7, by: -15, ffx: -2, fbx: 3 };
var act11 = {
  onBody: true,
  poses: [[0, { ...STIFF, crouch: 2 }], [0.22, STIFF], [1, STIFF], [1, { ...STIFF, crouch: 2 }, "snap"], [1.22, STIFF], [2, { ...STIFF, crouch: 2 }]]
};
var D14 = meta33.duration;
var SHIVER = 1;
var since = (t) => (t % SHIVER + SHIVER) % SHIVER;
var actorAlpha2 = () => 0;
var shake2 = (t) => since(t) < 0.22 ? Math.floor(t * 50) % 2 ? 1 : -1 : 0;
var PLANS = /* @__PURE__ */ new WeakMap();
function plan(a, seed) {
  let m = PLANS.get(a.mask);
  if (!m) PLANS.set(a.mask, m = /* @__PURE__ */ new Map());
  if (m.has(seed)) return m.get(seed);
  const S = shape(a), H4 = S.h, W7 = S.w, R4 = new Rng(seed * 11 + 1);
  const ferns = [];
  const roots = S.side.filter(([, y]) => y > H4 * 0.2 && y < H4 * 0.85).sort(() => R4.next() - 0.5).slice(0, 6);
  roots.forEach(([x0, y0, dir], i) => {
    let x = x0, y = y0, ang = dir < 0 ? -0.5 : Math.PI + 0.5;
    ang += R4.range(-0.4, 0.4);
    for (let s = 0; s < 9; s++) {
      x += Math.cos(ang) * 1.1;
      y += Math.sin(ang) * 1.1;
      const px = Math.round(x), py = Math.round(y);
      if (!S.on(px, py)) break;
      ferns.push([px, py, s / 9, i]);
      if (s % 2 === 1)
        for (const side of [-1, 1]) {
          const ba = ang + side * 1.05, L4 = 1 + Math.round(R4.range(0, 2) * (1 - s / 9));
          for (let k = 1; k <= L4; k++) {
            const bx = Math.round(x + Math.cos(ba) * k), by = Math.round(y + Math.sin(ba) * k);
            if (S.on(bx, by)) ferns.push([bx, by, (s + k * 0.6) / 9, i]);
          }
        }
      ang += R4.range(-0.25, 0.25);
    }
  });
  const clear = (x, y) => {
    let n = 0;
    while (n < 7 && y + 1 + n < H4 && !S.on(x, y + 1 + n)) n++;
    return n;
  };
  const hangs = S.body.filter(([x, y]) => !S.on(x, y + 1) && S.on(x, y - 1) && y < H4 * 0.72 && y > 4).map(([x, y]) => [x, y, clear(x, y)]).filter(([, , c]) => c >= 4);
  const best = (f, key) => hangs.filter(f).sort(key)[0];
  const icicles = [
    best(([, y]) => y < H4 * 0.36, (p, q) => p[0] - q[0]),
    best(([, y]) => y < H4 * 0.36, (p, q) => q[0] - p[0]),
    best(([x, y]) => y >= H4 * 0.36 && y < H4 * 0.5 && x < W7 / 2, (p, q) => q[0] - p[0]),
    best(([x, y]) => y >= H4 * 0.36 && y < H4 * 0.5 && x >= W7 / 2, (p, q) => p[0] - q[0]),
    best(([x, y]) => y >= H4 * 0.5 && x < W7 / 2, (p, q) => p[0] - q[0]),
    best(([x, y]) => y >= H4 * 0.5 && x >= W7 / 2, (p, q) => q[0] - p[0])
  ].filter(Boolean).map(([x, y, c], i) => ({ x, y: y + 1, len: Math.min(c - 1, R4.range(3, 5.5)), phase: R4.next(), period: i % 2 ? 1 : 2 }));
  const snow = S.up.filter(([, y]) => y < H4 * 0.6).map(([x, y]) => [x, y, 1 + (rand(x, seed, 3) < 0.45 ? 1 : 0)]);
  const E = eyes(a), mouth = E.length === 2 ? [(E[0].x1 + E[1].x0 + 1) / 2, Math.max(E[0].y1, E[1].y1) + 2] : [W7 / 2, H4 * 0.38];
  const out = { ferns, icicles, snow, mouth };
  m.set(seed, out);
  return out;
}
function frost2(p, C5, t, reach) {
  for (let x = -Math.ceil(reach) - 1; x <= reach + 1; x++) {
    const q = Math.abs(x + 0.5) / reach, h = rand(x, 17), k = 1 - q * q;
    if (q > 1 + h * 0.15) continue;
    const tw = Math.sin(t / D14 * TAU * 2 + rand(x, 3) * TAU) > 0.94;
    p.px(x, 0, tw || h < 0.3 ? C5[7] : q > 0.85 ? C5[5] : C5[6]);
    if (h < 0.3 * k) p.px(x, -1, C5[6]);
    for (let j = 1; j <= 1 + Math.round(2 * k); j++) p.dot(x, j, j === 1 ? C5[5] : C5[4], (1.05 - j / 4) * 0.85);
  }
}
function drawBack11(p, t, o) {
  const C5 = fit(o.palette, 8), reach = 13 + 3.5 * Math.sin(t / D14 * TAU);
  p.shade(-28, -3, 28, 6, (x, y, out) => {
    const d = Math.hypot(x / 24, (y - 0.5) / 4);
    if (d < 1) out.l = C5[4], out.k = 0.24 * (1 - d) * (1 - d);
  });
  frost2(p, C5, t, reach);
}
function draw13(p, t, o) {
  const C5 = fit(o.palette, 8), a = o.actor, S = shape(a), H4 = S.h, P3 = plan(a, o.seed), dx = shake2(t), ph = since(t);
  const X = (mx) => a.x + mx + dx, Y = (my) => a.y + my;
  for (const [mx, my] of S.body) {
    const c = colorAt(a, mx, my), ice = C5[clamp(1 + Math.round(luma(c) * 5.6), 1, 7)];
    const rim = !S.on(mx - 1, my) || !S.on(mx, my - 1) || !S.on(mx + 1, my);
    p.px(X(mx), Y(my), rim && luma(c) < 0.3 ? my < H4 * 0.5 || !S.on(mx - 1, my) ? C5[5] : C5[3] : mix(c, ice, 0.38));
  }
  const grow = 0.2 + 0.65 * smooth(0.05, 0.95, ph);
  for (const [x, y, u] of P3.ferns) if (u < grow) p.px(X(x), Y(y), u > grow - 0.1 ? WHITE : rand(x, y, 5) < 0.5 ? C5[6] : C5[5]);
  for (const [x, y, d] of P3.snow) {
    p.px(X(x), Y(y) - 1, C5[7]);
    if (d > 1) p.px(X(x), Y(y) - 2, rand(x, y, 9) < 0.5 ? C5[7] : C5[6]);
  }
  for (const ic of P3.icicles) {
    const per = ic.period, u = ((t / per + ic.phase) % 1 + 1) % 1, L4 = ic.len * (0.55 + 0.45 * smooth(0, 0.7, u)), x = X(ic.x), y0 = Y(ic.y);
    for (let j = 0; j < L4; j++) {
      const v = j / L4;
      p.px(x, y0 + j, v > 0.75 ? WHITE : v < 0.3 ? C5[7] : C5[6]);
      if (v < 0.5) p.px(x + 1, y0 + j, C5[4]);
    }
    if (u > 0.7 && u < 0.86) p.px(x, y0 + L4, C5[6]);
    else if (u >= 0.86) {
      const f = (u - 0.86) * per, y = y0 + L4 + 0.5 * 760 * f * f;
      if (y < -1) p.px(x, y, C5[6]), p.px(x, y - 1, C5[5]);
    }
    p.glow(x, y0 + L4 * 0.6, 4, C5[5], 0.18);
  }
  const [mx0, my0] = P3.mouth;
  for (let i = 0; i < 4; i++) {
    const age = ph - 0.35 - i * 0.05;
    if (age < 0 || age > 0.65) continue;
    const u = age / 0.65, x = X(mx0) + 1 + travel2(16, 0, 2.2, age) + i, y = Y(my0) - travel2(6, 3, 1, age) - i * 0.5, rad2 = 0.8 + 2.4 * Math.sqrt(u);
    p.disc(x, y, rad2, C5[7], 0.5 * (1 - u) * Math.min(1, u * 8));
    p.disc(x - rad2 * 0.2, y - rad2 * 0.3, rad2 * 0.5, WHITE, 0.4 * (1 - u));
  }
  cycle(t, D14, 9, o.seed + 2, (r) => r.range(1.2, 1.8), (age, life, r) => {
    const x = r.range(-14, 14) + Math.sin(age * 3 + r.next() * TAU) * 1.5, y = a.y - 16 + age * 14;
    if (y > a.y + 2) return;
    p.dot(x, y, r.next() < 0.5 ? WHITE : C5[6], Math.min(1, age * 4));
  });
  if (ph < 0.5)
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1, vx = side * (20 + 30 * rand(i, 4)), vy = -(20 + 30 * rand(i, 5)), x = side * (6 + 6 * rand(i, 6)) + vx * ph, y = a.y + 3 * rand(i, 7) + vy * ph + 0.5 * 300 * ph * ph;
      p.dot(x, y, i % 3 ? C5[6] : WHITE, 1.2 - ph * 2);
    }
  if (ph < 0.25) sparkle(p, X(Math.round(S.w * 0.3)), Y(4), Math.round(3 * (1 - ph / 0.25)), C5[6], C5[5], 0.4);
  p.glow(0, a.y + H4 * 0.45, 30, C5[4], 0.2 + 0.12 * Math.exp(-ph / 0.2));
  p.glow(0, a.y + 2, 16, C5[5], 0.1);
}

// ../pixelfx/src/fx/status/burning.js
var burning_exports = {};
__export(burning_exports, {
  act: () => act12,
  actorAlpha: () => actorAlpha3,
  draw: () => draw14,
  drawBack: () => drawBack12,
  meta: () => meta34
});
var meta34 = {
  name: "Burning",
  desc: "Burning over time: small flames lick from four hot spots, trailing sparks and thin smoke; every 0.6 s they flare, the body flashes white then orange, scorch marks spread.",
  tags: ["status", "fire", "burn", "dot", "debuff", "loop"],
  size: [72, 80],
  origin: [36, 70],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    char: ["#120c0a", "#2a1a14", "#4a2c1c"],
    smoke: "#5b5566",
    seed: 3
  }
};
var A_ = { turn: 1, crouch: 2, lean: 2, fx: -13, fy: -38, bx: 12, by: -17, ffx: -3, ffy: -7, fbx: 5 };
var B_ = { turn: 0.9, crouch: 3, lean: -2, fx: -12, fy: -17, bx: 13, by: -38, ffx: -4, fbx: 4, fby: -7 };
var act12 = {
  onBody: true,
  poses: [[0, A_], [0.15, B_, "snap"], [0.3, A_, "snap"], [0.45, B_, "snap"], [0.6, A_, "snap"], [0.75, B_, "snap"], [0.9, A_, "snap"], [1.05, B_, "snap"], [1.2, A_, "snap"]]
};
var D15 = meta34.duration;
var TICK = 0.6;
var WIND3 = -14;
var since2 = (t) => (t % TICK + TICK) % TICK;
var flare3 = (t) => Math.exp(-since2(t) / 0.12);
var actorAlpha3 = (t) => since2(t) < 0.034 ? 0 : 1;
var SPOTS = /* @__PURE__ */ new WeakMap();
function spots(a, seed) {
  let s = SPOTS.get(a.mask);
  if (!s) SPOTS.set(a.mask, s = /* @__PURE__ */ new Map());
  if (s.has(seed)) return s.get(seed);
  const S = shape(a), H4 = S.h, W7 = S.w, R4 = new Rng(seed * 13 + 5);
  const at8 = (q, side) => {
    const my = Math.round(H4 * q), [l, r] = S.rows[my];
    return [side < 0 ? l : r, my];
  };
  const hair = S.up.filter(([x]) => x < W7 * 0.42).sort((p, q) => p[1] - q[1] || p[0] - q[0])[0];
  const shoulder = S.up.filter(([x, y]) => x > W7 / 2 && y > H4 * 0.4 && y < H4 * 0.62).sort((p, q) => p[1] - q[1])[0] ?? at8(0.5, 1);
  const list = [
    { at: hair, side: -1, n: 3, h: 4.5 },
    { at: shoulder, side: 1, n: 2, h: 4 },
    { at: at8(0.62, -1), side: -1, n: 2, h: 3.5 },
    { at: at8(0.6, 1), side: 1, n: 2, h: 3.5 }
  ].map((sp, i) => ({ ...sp, x: a.x + sp.at[0] + 0.5, y: a.y + sp.at[1] + 1.5, tongues: Array.from({ length: sp.n }, (_, j) => ({ dx: (j - (sp.n - 1) / 2) * 1.6 + R4.range(-0.4, 0.4), h: sp.h * R4.range(0.8, 1.2), n: i * 17 + j * 5 + seed })) }));
  const scorch3 = [0, 1].map((tick) => [0, 1].map((k) => {
    const sp = list[(tick * 2 + k + 1) % list.length], lum = (x2, y2) => luma(colorAt(a, x2, y2));
    let cand = S.body.filter(([x2, y2]) => Math.hypot(a.x + x2 + 0.5 - sp.x, a.y + y2 + 0.5 - sp.y) < 9 && y2 > H4 * 0.42 && lum(x2, y2) > 0.3 && lum(x2, y2) < 0.6);
    if (!cand.length) cand = S.body.filter(([, y2]) => y2 > H4 * 0.45);
    const [x, y] = cand[Math.floor(R4.next() * cand.length)];
    return { x: a.x + x + 0.5, y: a.y + y + 0.5, r: R4.range(3.2, 4.4) };
  }));
  const out = { list, scorch: scorch3 };
  s.set(seed, out);
  return out;
}
function drawBack12(p, t, o) {
  const F = fit(o.palette, 9).reverse(), a = o.actor, fl = flare3(t), flick2 = 0.8 + 0.2 * tnoise(t, D15, 7.5, 3);
  p.shade(-30, -3, 30, 7, (x, y, out) => {
    const d = Math.hypot(x / 26, (y - 0.5) / 4.5);
    if (d < 1) out.l = mix(F[3], F[4], 0.5), out.k = (0.16 + 0.22 * fl) * flick2 * (1 - d) * (1 - d);
  });
  const smokeC = mix(hex(o.smoke), F[6], 0.2), { list } = spots(a, o.seed);
  cycle(t, D15, 16, o.seed + 4, (r) => r.range(0.8, 1.2), (age, life, r, i) => {
    const sp = list[i % list.length], x = sp.x + travel2(WIND3 * 0.6, WIND3 * 0.5, 0.8, age) + Math.sin(age * 4 + i) * 1.2, y = sp.y - 3 - travel2(18, 6, 1, age);
    smoke(p, x, y, r.range(1.1, 1.9), age / life, smokeC, 0.9);
  });
}
function draw14(p, t, o) {
  const F = fit(o.palette, 9).reverse(), CH = fit(o.char, 3), a = o.actor, S = shape(a), { list, scorch: scorch3 } = spots(a, o.seed);
  const ph = since2(t), tick = Math.floor(t / TICK) % 2, fl = flare3(t);
  if (ph < 0.034) for (const [mx, my] of S.body) p.px(a.x + mx, a.y + my, WHITE);
  else if (ph < 0.22) {
    const k = 1 - (ph - 0.034) / 0.186;
    for (const [mx, my] of S.body) p.blend(a.x + mx, a.y + my, F[4], 0.55 * k);
  }
  for (const sc of scorch3[tick]) {
    const grow = clamp(ph / 0.14), fade = 1 - clamp((ph - 0.25) / 0.33), r = sc.r * (0.4 + 0.6 * grow);
    if (fade <= 0) continue;
    for (const [mx, my] of S.body) {
      const x = a.x + mx + 0.5, y = a.y + my + 0.5, d = Math.hypot(x - sc.x, (y - sc.y) * 1.2) + rand(mx, my, 7) * 0.9;
      if (d > r) continue;
      const edge = d > r - 1;
      if (edge) p.dot(x - 0.5, y - 0.5, rand(mx, my, Math.floor(t * 20)) < 0.5 ? F[3] : F[4], fade * 1.2);
      else p.dot(x - 0.5, y - 0.5, d < r * 0.5 ? CH[0] : CH[1], fade * 1.1);
    }
    p.glow(sc.x, sc.y, 6, F[4], 0.3 * fade);
  }
  for (const sp of list) {
    for (const tg of sp.tongues) {
      const h = tg.h * (0.85 + 0.25 * tnoise(t, D15, 5, tg.n)) * (1 + 1.6 * fl);
      tongue3(p, sp.x + tg.dx, sp.y, h, 1.1 + 0.3 * fl, WIND3 * 0.08 * h / 4 + tnoise(t, D15, 3, tg.n + 9) * 0.8, F, t, D15, tg.n);
    }
    p.glow(sp.x, sp.y - 2, 9 + 6 * fl, F[4], 0.22 + 0.35 * fl);
  }
  cycle(t, D15, 20, o.seed + 6, (r) => r.range(0.5, 0.9), (age, life, r, i) => {
    const sp = list[i % list.length], x = sp.x + r.range(-1.5, 1.5) + travel2(WIND3 + r.range(-10, 6), WIND3 * 0.6, 1.2, age) + Math.sin(age * 9 + i) * 1.2 * age;
    const y = sp.y - 2 + travel2(-r.range(25, 55), -18, 1.4, age);
    ember2(p, x, y, age / life, [F[1], F[3], F[5]], age + i);
  });
  if (ph < 0.3)
    for (const [k, sp] of list.entries())
      for (let j = 0; j < 4; j++) {
        const an = -Math.PI / 2 + (rand(k, j, tick) - 0.5) * 2.2, v = 50 + 50 * rand(k, j, 2), x = sp.x + Math.cos(an) * travel2(v, 0, 3, ph), y = sp.y - 2 + Math.sin(an) * travel2(v, 0, 3, ph) + 60 * ph * ph;
        p.px(x, y, ph < 0.12 ? F[1] : F[3]);
        p.light(x, y, F[3], 0.4 * (1 - ph / 0.3));
      }
}

// ../pixelfx/src/fx/status/stunned.js
var stunned_exports = {};
__export(stunned_exports, {
  act: () => act13,
  draw: () => draw15,
  drawBack: () => drawBack13,
  meta: () => meta35
});
var meta35 = {
  name: "Stunned",
  desc: "Seeing stars: three spinning stars and two little birds circle the head on a tilted ring, ducking behind it and sweeping round in front, trailing glitter.",
  tags: ["status", "stun", "dizzy", "daze", "stars", "birds", "debuff", "loop"],
  size: [60, 64],
  origin: [30, 56],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#3a1e0c", "#8a4a12", "#d88a1c", "#f5c030", "#ffe36e", "#fff6c8", "#ffffff"],
    birds: ["#1a1422", "#6a7fae", "#b8c8e8", "#f4f8ff"],
    beak: "#ffae35",
    seed: 2
  }
};
var DAZE = { turn: 1, fx: -7, fy: -15, bx: 8, by: -15, ffx: -3, fbx: 4 };
var act13 = {
  onBody: true,
  poses: [
    [0, { ...DAZE, x: -1, lean: -3, hx: -1 }],
    [0.5, { ...DAZE, x: 0, lean: 0, crouch: 2, hy: 1, ffx: -2 }],
    [1, { ...DAZE, x: 1, lean: 3, hx: 1 }],
    [1.5, { ...DAZE, x: 0, lean: 0, crouch: 2, hy: 1, fbx: 3 }],
    [2, { ...DAZE, x: -1, lean: -3, hx: -1 }]
  ]
};
var D16 = meta35.duration;
var TURNS = 2;
var N4 = 5;
var STAR7 = ["...#...", "..###..", "#######", ".#####.", "..###..", ".##.##.", ".#...#."];
var BIRD = [true, false].map((up) => (dx, dy) => {
  const x = dx + 0.5, y = dy + 0.5;
  if (dx === 3 && dy === -2) return "e";
  if ((dx === 5 || dx === 4) && dy === -1) return dx === 5 ? "b" : "#";
  const wing = up ? [[-1, -1], [-1, -2], [-2, -2], [-2, -3], [-3, -3], [-3, -4]] : [[-1, 1], [-1, 2], [-2, 2], [-2, 3], [0, 1]];
  if (wing.some(([a, b]) => a === dx && b === dy)) return "w";
  if ((x / 3.3) ** 2 + ((y - 0.6) / 1.9) ** 2 <= 1 || (x - 2.8) ** 2 + (y + 1.2) ** 2 <= 1.7 ** 2) return "#";
  if (dx === -4 && (dy === -1 || dy === 0) || dx === -5 && dy === -1) return "#";
  return "";
});
var STAR = shaped.bind(null, starShape(0.44));
function ring3(t, a) {
  const cy = a.y + 2, rx = a.w * 0.62, ry = 4.5;
  return Array.from({ length: N4 }, (_, i) => {
    const th = TAU * (TURNS * t / D16 + i / N4), s = Math.sin(th);
    return { i, th, x: Math.cos(th) * rx, y: cy + s * ry, near: s >= 0, depth: 0.5 + 0.5 * s, bird: i % 2 === 1, rx, ry, cy };
  });
}
function draw1(p, t, o, layer) {
  const C5 = fit(o.palette, 7), Bd = fit(o.birds, 4), a = o.actor, far = layer === "back";
  const dim = (c) => far ? mix(c, Bd[0], 0.3) : c;
  for (const it of ring3(t, a)) {
    if (it.near === far) continue;
    if (!it.bird)
      for (let k = 1; k <= 12; k++) {
        const th = it.th - k * 0.085, x = Math.cos(th) * it.rx, y = it.cy - 1 + Math.sin(th) * it.ry;
        if (Math.sin(th) >= 0 === far || rand(it.i, k, Math.floor((t / D16 * TURNS + k * 0.37) * 9)) < 0.25) continue;
        p.dot(x, y, dim(k < 4 ? C5[6] : k < 8 ? C5[5] : C5[4]), 1.1 - k / 13);
        if (k < 6) p.light(x, y, C5[4], 0.3 * (1 - k / 6));
      }
    if (it.bird) {
      const up = Math.floor(t * 8 + it.i * 0.5) % 2 === 0, bob2 = Math.sin(t / D16 * TAU * 4 + it.i) * 0.7, flip = it.near;
      const f = BIRD[up ? 0 : 1], ins = flip ? (dx, dy) => f(-dx, dy) : f;
      icon(p, it.x, it.y - 3 + bob2, 7, ins, [Bd[0], dim(Bd[1]), dim(Bd[2]), dim(Bd[3])], 1, { e: Bd[0], b: dim(hex(o.beak)), w: dim(Bd[1]) });
    } else {
      const spin = t / D16 * TAU * 3 + it.i, R4 = [C5[0], dim(C5[3]), dim(C5[4]), dim(C5[5])];
      if (it.depth > 0.55) icon(p, it.x, it.y - 1, 7, STAR(4 + 0.8 * it.depth, spin), R4);
      else icon(p, it.x, it.y - 1, 5, bitmap(STAR7), R4);
      p.px(it.x, it.y - 1, far ? C5[5] : C5[6]);
      p.glow(it.x, it.y - 1, 11, C5[4], 0.24 + 0.3 * it.depth);
      p.glow(it.x, it.y - 1, 4, C5[6], 0.3 * it.depth);
      const fr = Math.exp(-((Math.atan2(Math.sin(it.th - Math.PI / 2), Math.cos(it.th - Math.PI / 2)) / 0.32) ** 2));
      if (!far && fr > 0.08) flare(p, it.x, it.y - 1, 9 * fr, fr, [C5[3], C5[4], C5[5], C5[6]]);
    }
  }
}
function drawBack13(p, t, o) {
  draw1(p, t, o, "back");
}
function draw15(p, t, o) {
  const C5 = fit(o.palette, 7), a = o.actor;
  draw1(p, t, o, "front");
  cycle(t, D16, 14, o.seed + 3, (r) => r.range(0.25, 0.5), (age, life, r) => {
    const th = r.range(0, TAU), u = age / life, x = Math.cos(th) * a.w * r.range(0.45, 0.95), y = a.y + 1 + Math.sin(th) * 7 - r.range(0, 9);
    const arm = Math.round(r.range(1, 2.6) * Math.sin(Math.PI * u));
    if (arm < 1) p.dot(x, y, C5[6], Math.sin(Math.PI * u) * 1.4);
    sparkle(p, x, y, arm, C5[5], C5[4], 0.35 * Math.sin(Math.PI * u));
  });
  p.glow(0, a.y + 1, 26, C5[4], 0.13);
}

// ../pixelfx/src/fx/projectiles/plasma-shot.js
var plasma_shot_exports = {};
__export(plasma_shot_exports, {
  draw: () => draw16,
  meta: () => meta36
});

// ../pixelfx/src/fx/projectiles/_lib.js
function beat(t, period, n, seed, life, fn) {
  for (let i = 0; i < n; i++) {
    const L4 = typeof life === "function" ? life(rng(seed, i, 911)) : life;
    for (let age = wrap(t - i * period / n + 1e-7, period); age < L4; age += period) fn(age, L4, rng(seed, i), i);
  }
}
function wake(x, y, vx, vy, age, V, k, g = 0) {
  const e = Math.exp(-k * age), f = (1 - e) / k, vt = g / k;
  return [x + vx * f - V * age, y + vt * age + (vy - vt) * f, vx * e - V, vt + (vy - vt) * e];
}
function spark2(p, x, y, vx, vy, k, S, glow = 0.45, stretch = 0.022, max = 9) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len2 = Math.min(max, 1 + sp * stretch);
  const head4 = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2];
  p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.4, y - uy * len2 * 0.4, k > 0.5 ? head4 : S[3]);
  p.line(x - ux * len2 * 0.45, y - uy * len2 * 0.45, x, y, head4);
  p.glow(x, y, 3, head4, glow * k);
}

// ../pixelfx/src/fx/projectiles/plasma-shot.js
var meta36 = {
  name: "Plasma shot",
  desc: "A glowing plasma blob: hot knots churning in its core, a corona crackling over its skin, its tail necking into droplets that tear off, cool and wink out behind.",
  tags: ["projectile", "plasma", "energy", "sci-fi", "directional", "loop"],
  size: [144, 60],
  origin: [108, 30],
  duration: 0.8,
  loop: true,
  fps: 30,
  bg: "sky",
  options: {
    palette: ["#061a1c", "#0b3b34", "#0f6a4a", "#18a05a", "#3fd46a", "#8cf57e", "#d6ffc4", "#ffffff"],
    size: 6,
    speed: 200,
    seed: 3
  }
};
function draw16(p, t, o) {
  const C5 = fit(o.palette, 8), R4 = o.size, V = o.speed, S = o.seed, D17 = meta36.duration, w = TAU * t / D17;
  const fr = Math.floor(t * 30 + 1e-6), left = -meta36.origin[0] + 2;
  const T02 = -R4 * 3.2, tail = (x) => Math.sin(x * 0.2 + w * 2) * (0.3 + (T02 - x) / 44 * 1.8);
  for (let x = T02; x > T02 - 44; x -= 1) {
    const u = (T02 - x) / 44, y = tail(x);
    p.dot(x, y, u < 0.2 ? C5[6] : u < 0.45 ? C5[5] : C5[4], u < 0.55 ? 1 : (1 - u) / 0.45);
    if (u < 0.3) p.px(x, y + 1, u < 0.15 ? C5[5] : C5[4]);
  }
  const balls = [{ x: 0, y: 0, r: R4, h: 1, core: 0.8 }];
  for (let i = 0; i < 3; i++) {
    const a = w * [2, -3, 5][i] + i * TAU / 3, d = R4 * (0.5 + 0.1 * Math.sin(w * 3 + i * 2));
    balls.push({ x: Math.cos(a) * d - 0.4, y: Math.sin(a) * d * 0.8, r: R4 * 0.32, h: 1, core: 1 });
  }
  for (let i = 1; i <= 6; i++) {
    const x = -R4 * (0.5 + i * 0.42), wag = Math.sin(w * 2 - i * 0.9) * (0.3 + i * 0.28), r = R4 * (0.62 - i * 0.08);
    balls.push({ x, y: wag, r, h: 0.96 - i * 0.05, core: Math.sqrt((5.2 - i * 0.65) * 0.3) / r });
  }
  const drops = [];
  cycle(t, D17, 11, S, (r) => r.range(0.34, 0.5), (age, life, r) => {
    const k = age / life, pull = r.range(450, 800), x = -R4 * 2.9 - 0.5 * pull * age * age - r.range(0, 16) * age;
    const y = Math.sin(w * 2 - 5.4 + age * 12) * 2 + r.range(-30, 30) * age * (0.4 + age);
    const rad2 = R4 * r.range(0.3, 0.48) * (1 - k * 0.6);
    drops.push({ x, y, r: rad2, h: 0.97 * (1 - k * 0.75), core: Math.sqrt(Math.max(0, 1 - k * 1.3) * 7 * 0.3) / rad2, k });
  });
  const all = balls.concat(drops);
  p.shade(-R4 * 2.6 - 60, -R4 * 2 - 8, R4 * 1.6, R4 * 2 + 8, (x, y) => {
    let f = 0, heat2 = 0, hh = 0;
    for (const b of all) {
      const dx = x - b.x, dy = y - b.y, d2 = dx * dx + dy * dy, q = d2 / (4 * b.r * b.r);
      if (q < 1) {
        const c = (1 - q) * (1 - q) / 0.5625;
        f += c;
        heat2 += c * b.h;
      }
      if (b.core) hh += b.core * b.core * b.r * b.r / (d2 + 0.3);
    }
    if (f < 1) return;
    const lvl = hh > 10 ? 7 : hh > 4.6 ? 6 : hh > 2.2 ? 5 : f > 1.4 ? 4 : 3, cap = Math.round(2 + heat2 / f * 5.4);
    return C5[Math.max(2, Math.min(x > R4 * 0.3 && lvl < 5 ? lvl + 1 : lvl, cap))];
  });
  for (let j = 0; j < 3; j++) {
    const g = rng(fr, j, S), a0 = g.range(-2.3, 2.3), span = g.range(0.45, 0.9) * g.sign(), n = 6, hgt = g.range(1.5, 3.5);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + span * i / n, rr = R4 + 0.6 + hgt * Math.sin(Math.PI * i / n) + (i % n ? g.range(-0.5, 0.5) : 0);
      pts.push([Math.cos(a) * rr - 0.4, Math.sin(a) * rr * 0.92]);
    }
    p.polyline(pts, j ? C5[5] : C5[6]);
    p.px(pts[3][0], pts[3][1], WHITE);
    p.glow(pts[3][0], pts[3][1], 6, C5[5], 0.4);
  }
  for (let j = 0; j < 4; j++) {
    const g = rng(fr, j + 9, S), a = g.range(-2.2, 2.2), l = g.range(1.5, 4), r0 = R4 + 1;
    const x0 = Math.cos(a) * r0 - 0.4, y0 = Math.sin(a) * r0 * 0.92;
    p.line(x0, y0, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l, j % 2 ? C5[4] : C5[5]);
  }
  const SP = [WHITE, C5[6], C5[5], C5[3]];
  beat(t, D17, 14, S + 5, (r) => r.range(0.12, 0.3), (age, life, r) => {
    const a = r.range(-2.4, 2.4), sp = r.range(60, 130), [x, y, vx, vy] = wake(Math.cos(a) * (R4 + 1), Math.sin(a) * (R4 + 1), Math.cos(a) * sp, Math.sin(a) * sp, age, V * 0.7, 4, 0);
    if (x > left + 4 && Math.abs(y) < 26) spark2(p, x, y, vx, vy, 1 - age / life, SP, 0.4, 0.015, 6);
  });
  const pulse2 = 0.85 + 0.15 * Math.sin(w * 4);
  p.glow(-2, 0, 34, C5[3], 0.8 * pulse2);
  p.glow(0, 0, 16, C5[4], 0.35 * pulse2);
  p.glow(1, 0, 7, C5[6], 0.3 * pulse2);
  p.glowLine(-R4, 0, -R4 * 4.6, 0, 7, C5[3], 0.3);
  for (const d of drops) {
    if (d.x < left + 4) continue;
    if (d.k < 0.6 && d.x < -R4 * 3.5) p.px(d.x, d.y, d.k < 0.3 ? C5[7] : C5[6]);
    p.glow(d.x, d.y, 3 + d.r * 2, C5[2], 0.6 * (1 - d.k));
  }
}

// ../pixelfx/src/fx/pickups/heart-pickup.js
var heart_pickup_exports = {};
__export(heart_pickup_exports, {
  draw: () => draw17,
  drawBack: () => drawBack14,
  meta: () => meta37
});

// ../pixelfx/src/fx/pickups/_lib.js
var Layer = class {
  constructor(w = 64, h = 64) {
    this.f = createFrame(w, h);
    this.q = new Painter(this.f);
    this.tmp = new Uint32Array(w * h);
  }
  /** Clear it and put its top-left at local (x0, y0). Returns the layer's painter. */
  begin(x0, y0) {
    const f = this.f;
    f.ox = Math.floor(x0);
    f.oy = Math.floor(y0);
    f.color.fill(0);
    f.light.fill(0);
    return this.q.reset().place(0, 0);
  }
  idx(x, y) {
    const f = this.f, i = Math.floor(x) - f.ox, j = Math.floor(y) - f.oy;
    return i < 0 || j < 0 || i >= f.w || j >= f.h ? -1 : j * f.w + i;
  }
  get(x, y) {
    const i = this.idx(x, y);
    return i < 0 ? 0 : this.f.color[i];
  }
  set(x, y, c) {
    const i = this.idx(x, y);
    if (i >= 0) this.f.color[i] = c;
  }
  /** Fill each pixel from fn(x, y) at the pixel's center (x + 0.5, y + 0.5): return a color or 0. */
  fill(x0, y0, x1, y1, fn) {
    for (let y = Math.floor(y0); y <= y1; y++)
      for (let x = Math.floor(x0); x <= x1; x++) {
        const c = fn(x + 0.5, y + 0.5);
        if (c) this.set(x, y, c);
      }
  }
  /** A 1 px outline around everything drawn: c is a color or fn(x, y, neighbour color). corners adds diagonals. */
  outline(c, corners = false) {
    const f = this.f, C5 = f.color, T4 = this.tmp, w = f.w, h = f.h;
    T4.fill(0);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        if (C5[k]) continue;
        let n = i > 0 && C5[k - 1] || i < w - 1 && C5[k + 1] || j > 0 && C5[k - w] || j < h - 1 && C5[k + w];
        if (!n && corners) n = i > 0 && j > 0 && C5[k - w - 1] || i < w - 1 && j > 0 && C5[k - w + 1] || i > 0 && j < h - 1 && C5[k + w - 1] || i < w - 1 && j < h - 1 && C5[k + w + 1];
        if (n) T4[k] = typeof c === "function" ? c(i + f.ox, j + f.oy, n) : c;
      }
    for (let k = 0; k < w * h; k++) if (T4[k]) C5[k] = T4[k];
    return this;
  }
  /** Recolor every drawn pixel: fn(x, y, c) returns the new color. */
  map(fn) {
    const f = this.f, C5 = f.color;
    for (let k = 0; k < C5.length; k++) if (C5[k]) C5[k] = fn(k % f.w + f.ox, Math.floor(k / f.w) + f.oy, C5[k]) || C5[k];
    return this;
  }
  /** Stamp the layer onto p, offset by (dx, dy), at alpha a (dithered); clip [x0, x1] keeps x0 <= x < x1. */
  draw(p, dx = 0, dy = 0, a = 1, clip = null) {
    const f = this.f, C5 = f.color;
    for (let k = 0; k < C5.length; k++) {
      if (!C5[k]) continue;
      const x = k % f.w + f.ox + dx;
      if (clip && (x < clip[0] || x >= clip[1])) continue;
      p.dot(x, Math.floor(k / f.w) + f.oy + dy, C5[k], a);
    }
    return this;
  }
};
var SHADOW = hex("#100e17");
function pillow(L4, x0, y0, x1, y1, sdf, color, { bevel = 3, light = [-0.5, -0.6, 0.62], clip = null } = {}) {
  L4.fill(x0, y0, x1, y1, (x, y) => {
    const d = sdf(x, y);
    if (d > 0 || clip && clip(x, y)) return 0;
    const e = -d;
    let gx = sdf(x + 0.5, y) - sdf(x - 0.5, y), gy = sdf(x, y + 0.5) - sdf(x, y - 0.5);
    const gl = Math.hypot(gx, gy) || 1;
    gx /= gl;
    gy /= gl;
    const k = Math.max(0, 1 - e / bevel) * 1.25, sn = Math.sin(k), cs = Math.cos(k);
    return color(gx * sn * light[0] + gy * sn * light[1] + cs * light[2], e, x, y);
  });
}
function heartSdf(x, y, cx, cy, w, h = w) {
  const S = w / 1.14, X = (x - cx) / S, Y = -(y - cy) / (h / 1.14) + 0.12;
  const q = X * X + Y * Y - 1, f = q * q * q - X * X * Y * Y * Y;
  const gx = 6 * X * q * q - 2 * X * Y * Y * Y, gy = 6 * Y * q * q - 3 * X * X * Y * Y;
  return f / Math.max(Math.hypot(gx, gy), 0.6) * S;
}
var INK3 = hex("#0b0814");
function blobShadow(p, x, rx, k = 1, y = 0) {
  if (rx < 0.8 || k <= 0) return;
  for (let i = Math.floor(x - rx); i <= Math.ceil(x + rx); i++) {
    const u = Math.abs(i + 0.5 - x) / rx;
    if (u > 1) continue;
    const a = k * (1 - u * u);
    p.dot(i, y, INK3, a * 1.1);
    if (u < 0.6) p.dot(i, y + 1, INK3, a * 0.6);
  }
}
function glint(p, x, y, arm, c, k = 0.4, tip = scale(c, 0.8)) {
  const n = Math.round(arm), X = Math.floor(x), Y = Math.floor(y);
  if (n < 0) return;
  for (let d = 1; d <= n; d++) {
    const cc = d === n && n > 1 ? tip : c;
    p.px(X + d, Y, cc), p.px(X - d, Y, cc), p.px(X, Y + d, cc), p.px(X, Y - d, cc);
  }
  p.px(X, Y, n > 0 ? WHITE : c);
  p.glow(X + 0.5, Y + 0.5, 3 + n * 2.5, c, k);
}
function pool2(p, x, y, rx, ry, c, k) {
  if (k <= 4e-3 || rx < 1) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}

// ../pixelfx/src/fx/pickups/heart-pickup.js
var meta37 = {
  name: "Heart pickup",
  desc: "A plump glossy heart hovering over its shadow beats lub-dub: a big squash and stretch, a smaller echo, light and a thin ring pulsing out, tiny hearts drifting off.",
  tags: ["pickup", "heart", "health", "life", "loop"],
  size: [56, 60],
  origin: [28, 52],
  duration: 1.2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a0408", "#4a0a14", "#8a1222", "#d02436", "#ff4a56", "#ff8a8e", "#ffd0cc", "#ffffff"], seed: 4 }
};
var L = new Layer(40, 40);
var HOVER = 18;
var W6 = 7.2;
var INK4 = hex("#12060c");
var MINI2 = [".a.a.", "abbba", ".aba.", "..a.."];
var LUB = 0.04;
var DUB = 0.24;
var beat2 = (ph, at8, s) => {
  const u = ph - at8;
  if (u < 0 || u > 0.3) return 0;
  return s * Math.exp(-u * 16) * Math.cos(u * 34);
};
var pulse = (ph) => beat2(ph, LUB, 1) + beat2(ph, DUB, 0.55) + beat2(ph + 1, LUB, 1);
function drawBack14(p, t, o) {
  const C5 = fit(o.palette, 8), ph = t / meta37.duration, y = -HOVER - 1.2 * Math.sin(ph * TAU);
  blobShadow(p, 0, 8 + 1.5 * pulse(ph), 0.8);
  cycle(t, meta37.duration, 4, o.seed, 0.95, (age, life, r, i) => {
    const side = i % 2 ? 1 : -1, k = age / life;
    const x = side * (r.range(2, 5) + age * r.range(9, 15)) + Math.sin(age * 7 + r.range(0, TAU)) * 1.5, yy = y - 5 - age * r.range(14, 19);
    const a = Math.min(1, age / 0.12) * (1 - k * k);
    p.sprite(MINI2, { a: k < 0.5 ? C5[5] : C5[4], b: k < 0.3 ? WHITE : C5[6] }, Math.round(x - 2.5), Math.round(yy - 2), { a: a * 1.3 });
    p.glow(x, yy, 5, C5[4], 0.3 * a);
  });
}
function draw17(p, t, o) {
  const C5 = fit(o.palette, 8), ph = t / meta37.duration, y = -HOVER - 1.2 * Math.sin(ph * TAU), b = pulse(ph);
  const sx = 1 + 0.16 * b, sy = 1 - 0.13 * b, cy = Math.round(y);
  p.glow(0, cy, 22 + 6 * Math.max(0, b), C5[4], 0.26 + 0.3 * Math.max(0, b));
  L.begin(-20, cy - 20);
  pillow(L, -12, cy - 11, 12, cy + 11, (x, yy) => heartSdf(x, yy, 0, cy, W6 * sx, W6 * sy), (lt, e) => {
    if (lt > 0.92 && e > 1.2) return WHITE;
    return lt > 0.8 ? C5[6] : lt > 0.6 ? C5[5] : lt > 0.38 ? C5[4] : lt > 0.12 ? C5[3] : C5[2];
  }, { bevel: 3.6 });
  L.outline(INK4).draw(p);
  const u = ((ph - LUB) % 1 + 1) % 1;
  if (u < 0.28) {
    const k = u / 0.28, r = 9 + 8 * (1 - (1 - k) ** 3);
    p.ring(0, cy, r, 1, k < 0.2 ? C5[6] : C5[5], 0.85 * (1 - k));
    p.glowRing(0, cy, r, 4, C5[4], 0.25 * (1 - k));
  }
  const g = ((ph - LUB - 0.08) % 0.5 + 0.5) % 0.5;
  if (g < 0.12) glint(p, -3.5, cy - 4, 2.6 * Math.sin(g / 0.12 * Math.PI), WHITE, 0.45);
}

// ../pixelfx/src/fx/pickups/potion.js
var potion_exports = {};
__export(potion_exports, {
  draw: () => draw18,
  drawBack: () => drawBack15,
  meta: () => meta38
});
var meta38 = {
  name: "Potion",
  desc: "A round glass flask of glowing brew rocks in the air: the brew sloshes behind the rock, bubbles rise and pop, light glows through the glass, wisps curl off the cork.",
  tags: ["pickup", "potion", "flask", "brew", "magic", "loop"],
  size: [56, 72],
  origin: [28, 64],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"], seed: 5 }
};
var RB = 7;
var HOVER2 = 17;
var NECK = 2;
var LIP = -12;
var CORK_TOP = -16;
var INK5 = hex("#120d1a");
var GLASS = hex("#2a2236");
var CORK = ["#2a160c", "#4e2c16", "#7a4a26", "#a8703a", "#d09a5a"].map(hex);
var L2 = new Layer(40, 44);
var pose3 = (ph) => ({ y: -HOVER2 - 1.4 * Math.sin(ph * TAU), tilt: 0.13 * Math.sin(ph * TAU + 0.4) });
var surface = (x, ph) => -0.5 + 0.17 * Math.sin(ph * TAU - 0.9) * x + 0.45 * Math.sin(x * 0.85 + ph * TAU * 3);
function flask(p, C5, t, ph, cy, tilt, seed) {
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  L2.begin(-20, Math.floor(cy) - 22);
  L2.fill(-20, Math.floor(cy) - 22, 19, Math.floor(cy) + 12, (px, py) => {
    const wx = px, wy = py - cy, fx = wx * ct + wy * st, fy = -wx * st + wy * ct, d = Math.hypot(fx, fy);
    if (fy < LIP - 0.5 && fy >= CORK_TOP && Math.abs(fx) <= NECK + 0.2) return CORK[fy < CORK_TOP + 1 ? 4 : fx < -0.6 ? 3 : fx > 1 ? 1 : 2];
    if (fy >= LIP - 0.5 && fy < LIP + 1 && Math.abs(fx) <= NECK + 1.4) return fx < 0 ? mix(WHITE, C5[6], 0.4) : mix(GLASS, C5[5], 0.45);
    const inNeck = fy >= LIP + 1 && fy < -RB + 2 && Math.abs(fx) <= NECK + 0.6;
    if (d > RB && !inNeck) return 0;
    const wall = inNeck ? Math.abs(fx) > NECK - 0.5 : d > RB - 1;
    const s = surface(wx, ph), depth = wy - s;
    if (!wall && !inNeck && depth > 0) {
      const core = 1 - Math.hypot(wx * 0.85, wy - 1.8) / RB;
      if (depth < 0.9) return wx < -1.5 && wx > -4.5 ? WHITE : C5[6];
      let k = core > 0.62 ? 5 : core > 0.38 ? 4 : core > 0.18 ? 3 : 2;
      if (depth < 1.9 && k < 5) k++;
      if (wx > 1.5 && wy > 2) k--;
      return C5[Math.max(2, Math.min(6, k))];
    }
    if (wall) {
      const lit = (-fx * 0.75 - fy * 0.66) / Math.max(1, d);
      if (inNeck) return fx < 0 ? mix(GLASS, C5[6], 0.55) : mix(GLASS, C5[5], 0.3);
      if (lit > 0.82) return mix(WHITE, C5[6], 0.3);
      if (lit > 0.3) return mix(GLASS, C5[6], 0.5);
      return depth > 0 ? C5[3] : mix(GLASS, C5[5], 0.28);
    }
    return GLASS;
  });
  L2.outline(INK5).draw(p);
  for (let a = 3.45; a < 4.35; a += 0.04) {
    const lx = Math.cos(a + tilt) * (RB - 2.2), ly = Math.sin(a + tilt) * (RB - 2.2);
    p.px(lx, cy + ly, a > 3.7 && a < 4.1 ? WHITE : mix(WHITE, C5[6], 0.5));
  }
  p.px(Math.round(2 * Math.cos(tilt) + 3 * Math.sin(tilt)), Math.round(cy - 3), WHITE);
  cycle(t, meta38.duration, 10, seed, (g) => g.range(0.7, 1.3), (age, life, r) => {
    const x0 = r.range(-4, 4), r0 = r.range(0.6, 1.7), vy = r.range(7, 13);
    const x = x0 + Math.sin(age * r.range(5, 9) + r.range(0, TAU)) * 0.7, y = cy + 5.5 - vy * age, ph2 = (t + age) / meta38.duration;
    const top = cy + surface(x, ph2);
    if (y > top + 0.8) {
      const rr = r0 * (0.7 + 0.5 * (age / life));
      if (Math.hypot(x, y - cy) > RB - 1.5) return;
      if (rr < 0.95) p.px(x, y, C5[6]);
      else {
        p.px(x, y, C5[3]), p.px(x + 1, y, C5[6]), p.px(x, y - 1, WHITE), p.px(x + 1, y - 1, C5[6]);
        if (rr > 1.4) p.px(x - 1, y, C5[5]), p.px(x, y + 1, C5[4]);
      }
      p.glow(x + 0.5, y, 3, C5[6], 0.15);
    } else {
      const k = clamp((top + 0.8 - y) / 3);
      if (k >= 1) return;
      for (let a = Math.PI; a < TAU; a += 0.6) p.dot(x + Math.cos(a) * (1 + k * 2), top - 0.5 + Math.sin(a) * (1 + k * 2) * 0.5, k < 0.5 ? WHITE : C5[6], 1.2 - k);
      p.dot(x - 1, top - 1.5 - k * 3, C5[6], 1 - k), p.dot(x + 1.5, top - 2 - k * 4, WHITE, 1 - k);
    }
  });
}
function drawBack15(p, t, o) {
  const C5 = fit(o.palette, 8), ph = t / meta38.duration, { y } = pose3(ph);
  blobShadow(p, 0, 7.5, 0.8 - (-y - HOVER2 + 1.4) * 0.06);
  pool2(p, 0, 0.5, 18, 3, C5[5], 0.3);
  cycle(t, meta38.duration, 7, o.seed + 1, (g) => g.range(1.2, 1.8), (age, life, r) => {
    const side = r.sign(), f = r.range(3, 4.5), ph0 = r.range(0, TAU), vy = r.range(11, 16), x0 = r.range(-1, 1);
    const at8 = (a) => [x0 + Math.sin(a * f + ph0) * (0.8 + a * 3.2) * side, y + CORK_TOP - 1 - a * vy];
    for (let i = 0; i < 9; i++) {
      const a = age - i * 0.04;
      if (a < 0) break;
      const [x, yy] = at8(a), k = (1 - a / life) * Math.min(1, a / 0.15) * (1 - i / 9);
      p.dot(x, yy, i === 0 ? WHITE : i < 3 ? C5[6] : C5[5], k * 1.4);
      if (i === 0) p.glow(x, yy, 4, C5[5], 0.3 * k);
    }
  });
}
function draw18(p, t, o) {
  const C5 = fit(o.palette, 8), ph = t / meta38.duration, { y, tilt } = pose3(ph);
  p.glow(0, y + 1.5, 26, C5[4], 0.22);
  flask(p, C5, t, ph, y, tilt, o.seed);
  p.glow(0, y + 2, 10, C5[5], 0.38 + 0.08 * Math.sin(ph * TAU * 2));
  const g = (ph + 0.2) % 0.5 / 0.5;
  if (g < 0.16) glint(p, -4, y - 4, 2.6 * Math.sin(g / 0.16 * Math.PI), WHITE, 0.4);
}

// ../pixelfx/src/fx/pickups/xp-orb.js
var xp_orb_exports = {};
__export(xp_orb_exports, {
  draw: () => draw19,
  drawBack: () => drawBack16,
  meta: () => meta39
});
var meta39 = {
  name: "XP orb",
  desc: "A small glowing orb races a figure-eight, a comet tail tapering behind it along its path, flecks shed from the tail winking out, its light following it over the floor.",
  tags: ["pickup", "xp", "orb", "experience", "energy", "loop"],
  size: [72, 56],
  origin: [36, 48],
  duration: 1.8,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: ["#0c1806", "#1e3a0a", "#36620e", "#5c9614", "#8cd024", "#c4f060", "#effcc0", "#ffffff"], seed: 2 }
};
var A = 16;
var B2 = 9;
var HOVER3 = 20;
var TAIL = 0.48;
var INK6 = hex("#0a1406");
var at7 = (t) => {
  const a = t / meta39.duration * TAU;
  return [A * Math.sin(a), -HOVER3 + B2 * Math.sin(a) * Math.cos(a) - 1.2 * Math.cos(a * 2)];
};
function drawBack16(p, t, o) {
  const C5 = fit(o.palette, 8), [x, y] = at7(t);
  blobShadow(p, x, 3.5, 0.55);
  pool2(p, x, 0.5, 14, 3, C5[5], 0.3);
  cycle(t, meta39.duration, 16, o.seed, (g) => g.range(0.35, 0.7), (age, life, r) => {
    const [fx, fy] = at7(t - age), k = 1 - age / life, tw = Math.sin(age * r.range(20, 30) + r.range(0, TAU));
    const x2 = fx + r.range(-2, 2) + age * r.range(-6, 6), y2 = fy + r.range(-2, 2) + age * r.range(4, 10);
    if (tw * k > -0.2) p.px(x2, y2, tw > 0.6 && k > 0.5 ? WHITE : k > 0.5 ? C5[6] : C5[5]);
    p.glow(x2 + 0.5, y2 + 0.5, 3, C5[5], 0.3 * k);
  });
}
function draw19(p, t, o) {
  const C5 = fit(o.palette, 8), [x, y] = at7(t), beat3 = 0.5 + 0.5 * Math.sin(t / meta39.duration * TAU * 3);
  const n = 60;
  for (let i = n; i >= 1; i--) {
    const u = i / n, [tx, ty] = at7(t - u * TAIL), r = 3.1 * Math.pow(1 - u, 1.1);
    const c = u < 0.25 ? C5[5] : u < 0.55 ? C5[4] : C5[3];
    if (r > 0.6) p.circle(tx, ty, r, c, u < 0.7 ? 1 : (1 - u) * 3.3);
    else p.dot(tx, ty, c, (1 - u) * 3);
    if (i % 6 === 0) p.glow(tx, ty, 7 * (1 - u) + 2, C5[5], 0.24 * (1 - u));
  }
  for (let i = Math.floor(n * 0.6); i >= 1; i--) {
    const u = i / n, [tx, ty] = at7(t - u * TAIL);
    p.dot(tx, ty, u < 0.2 ? WHITE : C5[6], (0.6 - u) * 4);
  }
  const X = Math.round(x), Y = Math.round(y);
  p.circle(X, Y, 4.4, INK6);
  p.circle(X, Y, 3.6, (d, a) => d > 0.72 ? Math.cos(a + 2.4) > 0.3 ? C5[5] : C5[3] : d > 0.4 ? Math.cos(a + 2.4) > -0.2 ? C5[6] : C5[5] : WHITE);
  p.px(X - 2, Y - 2, WHITE), p.px(X - 1, Y - 2, C5[7]);
  p.glow(x, y, 16 + 3 * beat3, C5[5], 0.36 + 0.14 * beat3);
  const g = t / meta39.duration * 3 % 1;
  if (g < 0.12) glint(p, X - 2, Y - 2, 2.4 * Math.sin(g / 0.12 * Math.PI), WHITE, 0.4);
}

// ../pixelfx/src/fx/pickups/collect-burst.js
var collect_burst_exports = {};
__export(collect_burst_exports, {
  create: () => create21,
  meta: () => meta40
});
var meta40 = {
  name: "Collect burst",
  desc: "The moment of pickup: a white flash and a cross of light, a thin ring snapping out ahead of a softer one, twinkles thrown wide on curving paths that brake, hang and wink out.",
  tags: ["pickup", "collect", "burst", "sparkle", "reward", "one-shot"],
  size: [112, 108],
  origin: [56, 94],
  duration: 1.35,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"], seed: 3 }
};
var CY5 = -30;
function create21(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), lights = new Lights();
  lights.add(0, CY5, 36, C5[5], 0.85, 0.32);
  lights.add(0, CY5, 14, WHITE, 0.75, 0.08);
  const stars2 = Array.from({ length: 14 }, (_, i) => {
    const a = i / 14 * TAU + R4.range(-0.2, 0.2), sp = R4.range(145, 225) * (i % 3 === 0 ? 1.12 : 0.85);
    return { x: 0, y: CY5, a, sp, turn: (i % 2 ? 1 : -1) * R4.range(2.5, 5), life: R4.range(0.75, 1.15), age: 0, size: i % 3 === 0 ? 2.6 : R4.range(1.2, 2), tr: [], c: i % 4 === 0 ? WHITE : i % 2 ? C5[6] : C5[5], ph: R4.range(0, TAU) };
  });
  const motes3 = Array.from({ length: 7 }, () => ({ x: R4.range(-8, 8), y: CY5 + R4.range(-4, 6), vy: -R4.range(12, 30), life: R4.range(0.5, 0.9), d: R4.range(0.05, 0.25), w: R4.range(0, TAU) }));
  let t = 0;
  return {
    update(dt) {
      t += dt;
      for (const s of stars2) {
        if (s.age > s.life) continue;
        s.age += dt;
        s.tr.unshift([s.x, s.y]);
        if (s.tr.length > 4) s.tr.pop();
        s.a += s.turn * dt * Math.max(0, 1 - s.age * 1.5);
        s.sp -= s.sp * 4.3 * dt;
        s.x += Math.cos(s.a) * s.sp * dt;
        s.y += Math.sin(s.a) * s.sp * dt + 6 * s.age * dt;
        if (s.y > -2) s.y = -2, s.a = -Math.abs(s.a), s.sp *= 0.5;
      }
      lights.update(dt);
    },
    draw(p) {
      if (t < 0.07) p.circle(0, CY5, 5.5 * (1 - t / 0.07) + 1, WHITE);
      if (t < 0.16) {
        const k = 1 - t / 0.16, L4 = 26 * ease.outCubic(Math.min(1, t / 0.03 + 0.4)) * k;
        for (const [dx, dy, l] of [[1, 0, 1], [-1, 0, 1], [0, 1, 0.6], [0, -1, 0.6]])
          p.line(0, CY5, dx * L4 * l, CY5 + dy * L4 * l, (u) => u < 0.3 ? WHITE : u < 0.65 ? C5[6] : C5[5], (u) => (u < 0.5 ? 1 : (1 - u) * 2) * (0.5 + k));
        p.glow(0, CY5, 20 * k + 4, C5[5], 0.6 * k);
      }
      const u1 = t / 0.32;
      if (u1 < 1) {
        const r = 3 + 23 * ease.outExpo(u1);
        p.ring(0, CY5, r, 1, u1 < 0.3 ? WHITE : C5[6], 1.3 - u1 * 1.2);
        p.glowRing(0, CY5, r, 4, C5[5], 0.4 * (1 - u1));
      }
      const u2 = (t - 0.04) / 0.5;
      if (u2 > 0 && u2 < 1) {
        const r = 2 + 16 * ease.outCubic(u2);
        p.ring(0, CY5, r, Math.max(1, 2.6 * (1 - u2)), C5[5], 1 - u2);
      }
      for (const s of stars2) {
        if (s.age > s.life) continue;
        const k = 1 - s.age / s.life, tw = 0.65 + 0.35 * Math.sin(s.age * 26 + s.ph);
        s.tr.forEach(([x, y], i) => i > 0 && p.dot(x, y, i < 2 ? C5[5] : C5[4], (1 - i / 4) * k * 1.4));
        if (k < 0.3 && Math.sin(s.age * 40 + s.ph) < 0) continue;
        glint(p, s.x, s.y, Math.round(s.size * tw * Math.min(1, k * 2.5)), s.c, 0.45 * k);
      }
      for (const m of motes3) {
        const a = t - m.d;
        if (a < 0 || a > m.life) continue;
        const k = 1 - a / m.life, x = m.x + Math.sin(a * 6 + m.w) * 1.5, y = m.y + m.vy * a;
        p.dot(x, y, k > 0.5 ? C5[6] : C5[5], k * 1.5);
        p.glow(x + 0.5, y + 0.5, 3, C5[5], 0.3 * k);
      }
      lights.draw(p);
    }
  };
}

// src/data.js
var FX = {
  swordSlash: sword_slash_exports,
  doubleSlash: double_slash_exports,
  heavyCleave: heavy_cleave_exports,
  scytheReap: scythe_reap_exports,
  fireball: fireball_exports,
  meteor: meteor_exports,
  frostNova: frost_nova_exports,
  lightningStrike: lightning_strike_exports,
  thunderclap: thunderclap_exports,
  healAoe: heal_aoe_exports,
  blessing: blessing_exports,
  divineShield: divine_shield_exports,
  hitSpark: hit_spark_exports,
  critHit: crit_hit_exports,
  smallExplosion: small_explosion_exports,
  poof: poof_exports,
  shatterDeath: shatter_death_exports,
  spawnPortal: spawn_portal_exports,
  levelUp: level_up_exports,
  runeCircle: rune_circle_exports,
  manaBurst: mana_burst_exports,
  frozen: frozen_exports,
  burning: burning_exports,
  stunned: stunned_exports,
  plasmaShot: plasma_shot_exports,
  heartPickup: heart_pickup_exports,
  potionPickup: potion_exports,
  xpOrb: xp_orb_exports,
  collectBurst: collect_burst_exports
};
var HERO_LOOK = "ember-duelist";
var BOSS_LOOK = "styx-warden";
var STAGES = [
  {
    act: "\u7B2C\u4E00\u5E55",
    name: "\u82D4\u75D5\u9057\u8FF9",
    sub: "\u6708\u4E0B\u7684\u65E7\u5723\u6240",
    chapter: "I",
    actEn: "STAGE I",
    nameEn: "MOSSY RUINS",
    subEn: "THE OLD SANCTUM",
    map: mossy_ruins_exports,
    palette: "#8fd88a",
    waves: [
      [
        { type: "slime", x: 126, y: 150 },
        { type: "slime", x: 218, y: 158 },
        { type: "snake", x: 268, y: 146 }
      ],
      [
        { type: "frog", x: 116, y: 160 },
        { type: "slime", x: 178, y: 144 },
        { type: "snake", x: 236, y: 160 },
        { type: "slime", x: 288, y: 150 }
      ]
    ]
  },
  {
    act: "\u7B2C\u4E8C\u5E55",
    name: "\u5E7D\u706B\u6CBC\u6CFD",
    sub: "\u4EA1\u8005\u7684\u706F",
    chapter: "II",
    actEn: "STAGE II",
    nameEn: "WISP MARSH",
    subEn: "LANTERNS OF THE DEAD",
    map: wisp_marsh_exports,
    palette: "#8ed7bf",
    waves: [
      [
        { type: "bat", x: 116, y: 142 },
        { type: "wisp", x: 214, y: 148 },
        { type: "bat", x: 272, y: 158 }
      ],
      [
        { type: "ghost", x: 122, y: 154 },
        { type: "wisp", x: 184, y: 140 },
        { type: "ghost", x: 236, y: 160 },
        { type: "wisp", x: 288, y: 150 }
      ]
    ]
  },
  {
    act: "\u7B2C\u4E09\u5E55",
    name: "\u7194\u5CA9\u6DF1\u7A9F",
    sub: "\u4F59\u70EC\u7684\u6E90\u5934",
    chapter: "III",
    actEn: "STAGE III",
    nameEn: "EMBER DEPTHS",
    subEn: "THE SOURCE OF ASH",
    map: ember_depths_exports,
    palette: "#ff9a5c",
    waves: [
      [
        { type: "bat", x: 118, y: 144 },
        { type: "eyeball", x: 206, y: 150 },
        { type: "flying-skull", x: 268, y: 158 },
        { type: "bat", x: 298, y: 148 }
      ],
      [
        { type: "boss", x: 258, y: 152 }
      ]
    ]
  }
];
var ENEMY_TYPES = {
  slime: {
    mod: slime_exports,
    name: "\u82D4\u6CE5",
    hp: 34,
    speed: 15,
    dmg: 8,
    reach: 30,
    want: 17,
    windup: 0.55,
    cd: 1.9,
    xp: 10,
    barH: 44,
    w: 14,
    fly: false,
    deathFx: poof_exports
  },
  snake: {
    mod: snake_exports,
    name: "\u8349\u86C7",
    hp: 24,
    speed: 35,
    dmg: 7,
    reach: 32,
    want: 18,
    windup: 0.32,
    cd: 1.35,
    xp: 9,
    barH: 34,
    w: 16,
    fly: false,
    deathFx: poof_exports
  },
  frog: {
    mod: frog_exports,
    name: "\u6CBC\u86D9",
    hp: 32,
    speed: 22,
    dmg: 9,
    reach: 32,
    want: 18,
    windup: 0.46,
    cd: 1.7,
    xp: 12,
    barH: 36,
    w: 14,
    fly: false,
    deathFx: poof_exports
  },
  bat: {
    mod: bat_exports,
    name: "\u591C\u8760",
    hp: 19,
    speed: 48,
    dmg: 6,
    reach: 28,
    want: 16,
    windup: 0.26,
    cd: 1.15,
    xp: 8,
    barH: 44,
    w: 12,
    fly: true,
    deathFx: poof_exports
  },
  wisp: {
    mod: wisp_exports,
    name: "\u9B3C\u706B",
    hp: 23,
    speed: 20,
    dmg: 7,
    reach: 105,
    want: 78,
    windup: 0.68,
    cd: 2.4,
    xp: 12,
    barH: 58,
    w: 13,
    fly: true,
    ranged: true,
    shot: { speed: 82, r: 5, color: "#7cf0d8", palette: ["#061a1f", "#0d3b3f", "#14707e", "#1fa8a8", "#4fe0c8", "#a8fff0", "#ffffff"] },
    deathFx: poof_exports
  },
  ghost: {
    mod: ghost_exports,
    name: "\u6E38\u9B42",
    hp: 40,
    speed: 18,
    dmg: 10,
    reach: 34,
    want: 20,
    windup: 0.5,
    cd: 2.1,
    xp: 15,
    barH: 52,
    w: 15,
    fly: true,
    deathFx: poof_exports
  },
  eyeball: {
    mod: eyeball_exports,
    name: "\u7AA5\u89C6\u8005",
    hp: 27,
    speed: 14,
    dmg: 8,
    reach: 125,
    want: 92,
    windup: 0.82,
    cd: 2.9,
    xp: 14,
    barH: 64,
    w: 14,
    fly: true,
    ranged: true,
    shot: { speed: 92, r: 5, color: "#ff6a7a", palette: ["#1a0410", "#4a1020", "#8a1830", "#c9264a", "#f2526a", "#ff9aa2", "#ffe0e2"] },
    deathFx: poof_exports
  },
  "flying-skull": {
    mod: flying_skull_exports,
    name: "\u711A\u9885",
    hp: 46,
    speed: 27,
    dmg: 11,
    reach: 34,
    want: 21,
    windup: 0.54,
    cd: 1.85,
    xp: 18,
    barH: 70,
    w: 17,
    fly: true,
    deathFx: poof_exports
  },
  boss: {
    mod: null,
    name: "\u51A5\u6CB3\u5B88\u536B",
    nameEn: "THE WARDEN",
    hp: 360,
    speed: 23,
    dmg: 15,
    reach: 40,
    want: 27,
    windup: 0.8,
    cd: 2.1,
    xp: 120,
    barH: 0,
    w: 30,
    fly: false,
    boss: true,
    deathFx: shatter_death_exports,
    look: "styx-warden"
  }
};
var LOOT = [
  { p: 0.12, kind: "heart", mod: heart_pickup_exports, label: "HP +18", color: "#ff7a8a" },
  { p: 0.13, kind: "potion", mod: potion_exports, label: "MP +24", color: "#ff86e6" },
  { p: 0.5, kind: "xp", mod: xp_orb_exports, label: "XP +8", color: "#c4f060" }
];
var SKILL_META = [
  { id: "j", key: "J", name: "\u661F\u5203\u65A9", nameEn: "SLASH", icon: "slash", glyph: "\u65A9", cost: 0, cd: 0.26, tint: "#ffe0a0", glow: "rgba(255, 190, 90, .55)", note: "\u4E09\u6BB5\u8FDE\u65A9 \xB7 \u65E0\u6D88\u8017" },
  { id: "k", key: "K", name: "\u70C8\u7130\u672F", nameEn: "FIRE", icon: "fire", glyph: "\u706B", cost: 10, cd: 1.1, tint: "#ffb05a", glow: "rgba(255, 120, 40, .6)", note: "\u706B\u7403 \xB7 \u7206\u70B8\u707C\u70E7" },
  { id: "l", key: "L", name: "\u971C\u73AF", nameEn: "FROST", icon: "frost", glyph: "\u971C", cost: 18, cd: 5, tint: "#b8ecff", glow: "rgba(120, 210, 255, .6)", note: "\u8EAB\u5468\u51B0\u73AF \xB7 \u51BB\u7ED3" },
  { id: "u", key: "U", name: "\u96F7\u7F5A", nameEn: "BOLT", icon: "bolt", glyph: "\u96F7", cost: 22, cd: 6, tint: "#d8c8ff", glow: "rgba(170, 140, 255, .65)", note: "\u843D\u96F7 \xB7 \u7729\u6655" },
  { id: "i", key: "I", name: "\u5723\u6108", nameEn: "MEND", icon: "mend", glyph: "\u6108", cost: 26, cd: 11, tint: "#c8ffb0", glow: "rgba(150, 240, 120, .55)", note: "\u6CBB\u7597 \xB7 \u62A4\u76FE" },
  { id: "o", key: "O", name: "\u9668\u661F", nameEn: "METEOR", icon: "meteor", glyph: "\u9668", cost: 40, cd: 15, tint: "#ffcf6a", glow: "rgba(255, 160, 50, .8)", note: "\u4E09\u91CD\u9668\u77F3 \xB7 \u5927\u8303\u56F4" }
];

// src/hero.js
var GUARD2 = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
var IDLE = { ...GUARD2, fx: 10, fy: -20, bx: 7, by: -19, crouch: 1 };
var IDLE_B = { ...IDLE, crouch: 2, fx: 9, fy: -19, lean: -0.5 };
var WIND4 = { ...GUARD2, x: -8, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
var CUT2 = { ...GUARD2, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -10, ghost: 1 };
var DOWN2 = { ...GUARD2, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true };
var HIGH3 = { ...GUARD2, x: -7, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
var LOW2 = { ...GUARD2, x: 3, crouch: 6, lean: 6, fx: 22, fy: -20, sa: 0.62, bx: -8, by: -24, ffx: 13, fbx: -10, toeB: true };
var UP2 = { ...LOW2, x: 5, crouch: 3, lean: 5, fx: 22, fy: -28, sa: 0.1, by: -18, toeB: true };
var REST = { ...GUARD2, x: -4, crouch: 2 };
var OVER2 = { ...GUARD2, x: -4, crouch: 2, lean: -2, fx: 1, fy: -42, sa: -2.45, ffx: 8, fbx: -7 };
var FLOOR3 = { ...GUARD2, x: 0, crouch: 7, lean: 6, fx: 17, fy: -21, sa: 0.72, ffx: 11, fbx: -10, toeB: true };
var HOLD3 = { ...GUARD2, crouch: 4, lean: 2, fx: 16, fy: -30, sa: -1.1, bx: 2, by: -20 };
var THROW = { ...GUARD2, x: 2, crouch: 4, lean: 6, fx: 19, fy: -30, sa: -1.3, bx: -6, by: -24, ffx: 11, fbx: -10 };
var HEAVEN = { ...GUARD2, crouch: 0, lean: -3, fx: -5, fy: -43, bx: 8, by: -43, sa: -2, ffx: -4, fbx: 5 };
var SLAM2 = { ...GUARD2, crouch: 8, lean: 3, fx: -8, fy: -10, bx: 10, by: -10, sa: 0.4, ffx: -7, fbx: 8 };
var HURT = { turn: 0.9, x: -5, crouch: 4, lean: -6, fx: -6, fy: -30, bx: 5, by: -28, ffx: 6, fbx: -6, weapon: "sword", sa: 0.3 };
var DOWNED = { turn: 1.25, crouch: 12, lean: 8, fx: -9, fy: -5, bx: 4, by: -6, weapon: "sword", sa: 0.1 };
var WALK = [
  [0, { ...IDLE, ffx: 10, ffy: -2, fbx: -9, fby: -4, fx: 13, fy: -22, bx: 2, by: -18, crouch: 2, lean: 1 }],
  [0.16, { ...IDLE, ffx: 3, ffy: -8, fbx: -3, fby: -2, fx: 9, fy: -19, bx: 7, by: -21, crouch: 3, lean: 1.5 }],
  [0.32, { ...IDLE, ffx: -9, ffy: -4, fbx: 10, fby: -2, fx: 3, fy: -18, bx: 13, by: -22, crouch: 2, lean: 1 }],
  [0.48, { ...IDLE, ffx: 3, ffy: -8, fbx: -3, fby: -2, fx: 9, fy: -19, bx: 7, by: -21, crouch: 3, lean: 1.5 }],
  [0.64, { ...IDLE, ffx: 10, ffy: -2, fbx: -9, fby: -4, fx: 13, fy: -22, bx: 2, by: -18, crouch: 2, lean: 1 }]
];
var TRACKS = {
  idle: [[0, IDLE], [1.4, IDLE_B], [2.8, IDLE]],
  walk: WALK,
  attack1: [[0, WIND4], [0.06, CUT2, "snap"], [0.1, DOWN2, "snap"], [0.32, DOWN2], [0.5, GUARD2]],
  attack2: [[0, HIGH3], [0.02, { ...HIGH3, crouch: 5 }], [0.08, CUT2, "snap"], [0.12, LOW2, "snap"], [0.18, UP2, "snap"], [0.24, { ...UP2, fy: -38 }], [0.5, { ...LOW2, crouch: 3, lean: 3, fx: 18, fy: -36, sa: -1.05 }], [0.72, GUARD2]],
  attack3: [[0, REST], [0.14, OVER2], [0.2, { ...OVER2, crouch: 3 }], [0.28, FLOOR3, "snap"], [0.62, FLOOR3], [0.95, REST], [1.15, GUARD2]],
  castK: [[0, GUARD2], [0.09, HOLD3], [0.18, THROW, "snap"], [0.38, THROW], [0.55, GUARD2]],
  castL: [[0, GUARD2], [0.14, HEAVEN], [0.42, SLAM2, "snap"], [0.7, SLAM2], [1, GUARD2]],
  castU: [[0, GUARD2], [0.16, HEAVEN], [0.5, HEAVEN], [0.78, GUARD2]],
  castI: [[0, GUARD2], [0.18, HEAVEN], [0.55, HEAVEN], [0.95, GUARD2]],
  castO: [[0, GUARD2], [0.22, HEAVEN], [0.85, HEAVEN], [1.15, GUARD2]],
  hurt: [[0, HURT], [0.22, HURT], [0.42, IDLE]],
  dead: [[0, DOWNED], [1.4, DOWNED]]
};
var XP_STEPS = [0, 50, 130, 250, 420, 640, 900];
var P2 = {
  shadow: hex("#05040a"),
  white: 4294967295
};
var Hero = class {
  constructor() {
    this.look = HERO_LOOK;
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
  spawn(x, y) {
    this.x = x;
    this.y = y;
    this.anim = { kind: "idle", t: 0, track: TRACKS.idle, loop: true, dur: 2.8 };
  }
  get alive() {
    return !this.dead && this.hp > 0;
  }
  startAnim(kind, track, loop = false) {
    this.anim = { kind, t: 0, track, loop, dur: track[track.length - 1][0] };
  }
  pose() {
    const a = this.anim;
    return poseAt(a.track, a.loop ? a.t % a.dur : Math.min(a.t, a.dur));
  }
  update(g, dt, keys) {
    for (const k in this.cd) this.cd[k] = Math.max(0, this.cd[k] - dt);
    this.invuln = Math.max(0, this.invuln - dt);
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
    let ix = 0, iy = 0;
    if (g.state === "playing") {
      ix = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
      iy = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0);
    }
    const len2 = Math.hypot(ix, iy) || 1;
    ix /= len2;
    iy /= len2;
    const moving = !!(ix || iy);
    const busy = this.anim.kind.startsWith("cast") ? 0.42 : this.anim.kind.startsWith("attack") ? 0.76 : this.anim.kind === "hurt" ? 0.2 : 1;
    const sp = this.speed * busy;
    if (moving) {
      this.x += ix * sp * dt + this.vx * dt;
      this.y += iy * sp * 0.56 * dt + this.vy * dt;
      if (ix) this.facing = ix > 0 ? 1 : -1;
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
    this.x = clamp(this.x, 18, 302);
    this.y = clamp(this.y, 134, 170);
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
    const pose4 = this.pose();
    const r = posed(pose4, this.look);
    const flip = this.facing < 0;
    p.ellipse(x, y - 1, 10, 3, P2.shadow, 0.55);
    p.ellipse(x, y - 1, 12, 3.4, hex("#ff9a4a"), 0.13 + 0.04 * Math.sin(performance.now() / 420));
    if (this.shield > 0) p.ellipse(x, y - 1, 14, 4, hex("#ffe9a0"), 0.35);
    const blink = this.invuln > 0 && this.hitFlash <= 0 && Math.floor(this.invuln * 22) % 2 === 0;
    const a = this.dead ? 0.55 : blink ? 0.45 : 1;
    const white = this.hitFlash > 0;
    for (let i = 0; i < r.n; i++) {
      const sx = x + (flip ? -r.xs[i] : r.xs[i]);
      const sy = y + r.ys[i];
      p.dot(sx, sy, white ? P2.white : r.color[i], a);
    }
  }
  // ---- damage, healing, progression
  hurt(g, amount, opts = {}) {
    if (!this.alive || this.invuln > 0) return false;
    let dmg = Math.max(1, Math.round(amount));
    if (this.shield > 0) {
      const absorb = Math.min(this.shield, dmg);
      this.shield -= absorb;
      dmg -= absorb;
      if (this.shield <= 0) {
        this.shieldT = 0;
        g.addFx(g.fx.manaBurst, { x: this.x, y: this.y, light: 0.8 });
      }
      g.number(this.x, this.y - 46, "\u62A4\u76FE -" + absorb, { color: "#ffe9a0", small: true });
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
    if (this.hp <= 1e-3) {
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
      this.dmgMul = 1 + (this.level - 1) * 0.12;
      g.addFx(g.fx.levelUp, { x: this.x, y: this.y, light: 1 });
      g.banner("LEVEL UP", `\u7B49\u7EA7 ${this.level} \xB7 \u751F\u547D\u4E0E\u6CD5\u529B\u63D0\u5347`, "LEVEL");
      g.flashScreen("#ffe6a0", 0.25);
      g.audio.play("level");
    }
  }
  /** Warm the pose cache so the first swing does not hitch. */
  static prepare() {
    for (const track of Object.values(TRACKS)) for (const [, pose4] of track) posed(pose4, HERO_LOOK);
  }
};

// src/enemies.js
var C2 = {
  ink: hex("#07060d"),
  white: 4294967295,
  barBack: hex("#1a0d18"),
  bar: hex("#d8422f"),
  barLit: hex("#ff9a6a"),
  warn: hex("#ff5a3c"),
  warnLit: hex("#ffd36a"),
  shadow: hex("#05040a"),
  boss: hex("#c39bff"),
  bossLit: hex("#f0d4ff")
};
var rnd = (a, b) => a + Math.random() * (b - a);
function dotRing(p, x, y, r, color, a, count = 18) {
  for (let i = 0; i < count; i++) {
    const ang = i / count * TAU;
    p.dot(x + Math.cos(ang) * r, y + Math.sin(ang) * r * 0.3, color, a);
  }
}
var Enemy = class {
  constructor(g, typeId, x, y, opts = {}) {
    this.typeId = typeId;
    this.type = ENEMY_TYPES[typeId];
    const t = this.type;
    this.name = t.name;
    this.x = x;
    this.y = y;
    this.maxHp = Math.round(t.hp * (opts.hpScale ?? 1));
    this.hp = this.maxHp;
    this.speed = t.speed;
    this.reach = t.reach;
    this.dmg = Math.round(t.dmg * (opts.dmgScale ?? 1));
    this.xp = t.xp;
    this.w = t.w;
    this.facing = -1;
    this.vx = 0;
    this.vy = 0;
    this.state = "spawn";
    this.timer = 0.45;
    this.atkCd = rnd(0.5, 1.2);
    this.stun = 0;
    this.freeze = 0;
    this.burn = 0;
    this.burnTick = 0;
    this.burnDmg = 0;
    this.slow = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.spawnT = 0.45;
    this.auras = {};
    this.seed = opts.seed ?? Math.floor(Math.random() * 9999);
    this.fx = createFx(t.mod, { x, y, flip: true, seed: this.seed, ...opts.fxOptions ?? {} });
    this.portal = g.addFx(g.fx.spawnPortal, { x, y, seed: this.seed, light: 0.8 }, { layer: "ground", life: 0.8 });
    g.audio.play("spawn");
  }
  get alive() {
    return !this.dead && this.hp > 0 && this.state !== "spawn";
  }
  get boss() {
    return false;
  }
  addStatus(g, key, time) {
    if (key === "freeze") {
      this.freeze = Math.max(this.freeze, time);
      this.state = "chase";
      this.timer = 0;
    } else if (key === "stun") {
      this.stun = Math.max(this.stun, time);
      this.state = "chase";
      this.timer = 0;
    } else if (key === "burn") {
      this.burn = Math.max(this.burn, time);
      this.burnDmg = Math.max(this.burnDmg, 3);
    } else if (key === "slow") this.slow = Math.max(this.slow, time);
    if (!this.auras[key]) {
      const mod = key === "freeze" ? g.fx.frozen : key === "stun" ? g.fx.stunned : key === "burn" ? g.fx.burning : null;
      if (mod) {
        const inst = createFx(mod, { x: this.x, y: this.y, seed: this.seed + 11 });
        inst.stopT = 0;
        this.auras[key] = inst;
      }
    }
  }
  updateAuras(g, dt) {
    for (const [key, inst] of Object.entries(this.auras)) {
      const live = key === "freeze" ? this.freeze > 0 : key === "stun" ? this.stun > 0 : key === "burn" ? this.burn > 0 : this.slow > 0;
      inst.options.x = this.x;
      inst.options.y = this.y;
      if (!live) inst.stop();
      inst.update(dt);
      if (inst.done()) delete this.auras[key];
    }
  }
  update(g, dt) {
    if (this.dead) return;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.updateAuras(g, dt);
    if (this.burn > 0) {
      this.burn -= dt;
      this.burnTick -= dt;
      if (this.burnTick <= 0) {
        this.burnTick = 0.5;
        this.hurt(g, this.burnDmg, { silent: true, dot: true, crit: false });
        if (this.dead) return;
      }
    }
    if (this.state === "spawn") {
      this.timer -= dt;
      this.spawnT -= dt;
      if (this.timer <= 0) this.setState("chase");
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= Math.max(0, 1 - 8 * dt);
      this.vy *= Math.max(0, 1 - 8 * dt);
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - 7 * dt);
    this.vy *= Math.max(0, 1 - 7 * dt);
    const hero = g.hero;
    if (hero.alive) {
      const hx = this.x - hero.x, hy = this.y - hero.y;
      if (Math.abs(hx) < 12 && Math.abs(hy) < 10) {
        this.x += Math.sign(hx || 1) * 24 * dt;
        this.y += Math.sign(hy || 1) * 14 * dt;
      }
    }
    if (!hero.alive) {
      this.setState("chase");
      return;
    }
    const dx = hero.x - this.x, dy = hero.y - this.y;
    const dist = Math.hypot(dx, dy * 1.3);
    if (dx) this.facing = dx > 0 ? 1 : -1;
    if (this.freeze > 0 || this.stun > 0) return;
    if (this.state === "windup") {
      this.timer -= dt;
      if (this.timer <= 0) this.strike(g, dx, dy, dist);
      this.clampPos();
      return;
    }
    if (this.state === "recover") {
      this.timer -= dt;
      if (this.timer <= 0) this.setState("chase");
      this.clampPos();
      return;
    }
    this.atkCd -= dt * (this.slow > 0 ? 0.55 : 1);
    const slowK = this.slow > 0 ? 0.5 : 1;
    const canHit = this.type.ranged ? dist < this.reach && Math.abs(dy) < 26 : Math.abs(dx) < this.reach && Math.abs(dy) < 17;
    if (this.atkCd <= 0 && canHit) {
      this.setState("windup");
      this.timer = this.type.windup;
      this.atkCd = this.type.cd + rnd(0, 0.35);
      return;
    }
    const want = this.type.want ?? 18;
    const wantDx = this.type.ranged ? want : want - 2;
    if (Math.abs(dx) > wantDx) this.x += Math.sign(dx) * this.speed * slowK * dt;
    if (Math.abs(dy) > 7) this.y += Math.sign(dy) * this.speed * slowK * 0.55 * dt;
    this.clampSeparation(g);
    this.clampPos();
  }
  clampPos() {
    this.x = clamp(this.x, 20, 300);
    this.y = clamp(this.y, 136, 169);
  }
  clampSeparation(g) {
    for (const o of g.enemies) {
      if (o === this || !o.alive) continue;
      const dx = this.x - o.x, dy = this.y - o.y;
      if (Math.abs(dx) < 13 && Math.abs(dy) < 9) {
        this.x += Math.sign(dx || 1) * 8 * (1 / 60);
        this.y += Math.sign(dy || 1) * 4 * (1 / 60);
      }
    }
  }
  setState(s) {
    this.state = s;
    if (s === "chase") this.timer = 0;
  }
  strike(g, dx, dy, dist) {
    const hero = g.hero;
    if (this.type.ranged) {
      this.setState("recover");
      this.timer = 0.45;
      this.y = clamp(this.y, 136, 169);
      g.enemyShot(this, hero);
      g.audio.play("cast");
      return;
    }
    this.setState("recover");
    this.timer = 0.42;
    this.vx = this.facing * 85;
    g.after(0.07, () => {
      if (!this.alive) return;
      const ddx = hero.x - this.x, ddy = hero.y - this.y;
      if (Math.abs(ddx) < this.reach + 12 && Math.abs(ddy) < 19) {
        if (hero.hurt(g, this.dmg, { fromX: this.x })) {
          g.addFx(g.fx.hitSpark, { x: hero.x, y: hero.y - 20, flip: ddx < 0, light: 0.9 });
          g.hitStop = Math.max(g.hitStop, 0.045);
          g.shake(2.4, 0.2);
          g.audio.play("hit");
        }
      }
    });
  }
  hurt(g, amount, opts = {}) {
    if (!this.alive) return 0;
    let dmg = Math.max(1, Math.round(amount));
    const crit = opts.crit ?? Math.random() < 0.12;
    if (crit) dmg = Math.round(dmg * 1.65);
    this.hp -= dmg;
    this.hitFlash = 0.14;
    const dir = Math.sign(this.x - g.hero.x) || 1;
    this.vx += (opts.knock ?? 26) * dir;
    if (opts.status) this.addStatus(g, opts.status, opts.statusTime ?? 2);
    if (!opts.silent) {
      g.comboAdd();
      g.number(this.x, this.y - this.type.barH - 6, String(dmg), {
        color: opts.dot ? "#ff9a6a" : crit ? "#ffd36a" : "#fff0d0",
        crit
      });
      if (opts.dot) {
        g.dust(this.x, this.y - 8, 2, 0, "#ff8a3a");
      } else {
        g.addFx(crit ? g.fx.critHit : g.fx.hitSpark, {
          x: this.x,
          y: this.y - 18,
          flip: g.hero.x > this.x,
          light: crit ? 1.2 : 0.9
        });
        g.audio.play(crit ? "crit" : "hit");
      }
    }
    if (this.hp <= 0) this.die(g);
    return dmg;
  }
  die(g) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    const frozen = this.freeze > 0;
    g.addFx(frozen ? g.fx.shatterDeath : this.type.deathFx, {
      x: this.x,
      y: this.y,
      light: 0.8,
      seed: this.seed,
      ...frozen ? {} : {}
    });
    g.addFx(g.fx.poof, { x: this.x, y: this.y - 8, seed: this.seed + 3, light: 0.5 });
    g.kills++;
    g.hero.gainXp(g, this.xp);
    g.dropLoot(this.x, this.y, this.typeId);
    g.audio.play("death");
    g.shake(1.6, 0.12);
  }
  draw(g, p) {
    if (this.dead) return;
    const x = Math.round(this.x), y = Math.round(this.y);
    this.fx.options.x = this.x;
    this.fx.options.y = this.y;
    this.fx.options.flip = g.hero.x < this.x;
    if (this.state !== "spawn" || this.spawnT < 0.32) {
      this.fx.draw(g.frame);
      p = painterFor(g.frame);
    }
    if (this.hitFlash > 0) {
      p.glow(x, y - this.type.barH * 0.45, this.type.barH * 0.45, C2.white, 0.28);
    }
    if (this.state === "windup") {
      const k = 1 - this.timer / this.type.windup;
      const r = this.type.ranged ? 16 + k * 8 : this.reach * 0.9;
      dotRing(p, x, y - 1, r, k > 0.55 ? C2.warnLit : C2.warn, 0.55 + 0.35 * k, this.type.ranged ? 14 : 16);
      if (this.type.ranged) {
        const hy = g.hero.y - 22;
        for (let i = 1; i < 9; i++) {
          const u = i / 9;
          p.dot(x + (g.hero.x - x) * u, y - 22 + (hy - (y - 22)) * u, C2.warn, 0.22 + 0.4 * k * (1 - u));
        }
      }
    }
    if (this.hp < this.maxHp) {
      const top = y - this.type.barH - 2, w = Math.max(14, this.type.w);
      p.rect(x - w / 2 - 1, top - 1, w + 2, 3, C2.ink, 0.85);
      p.rect(x - w / 2, top, Math.max(1, Math.round(w * (this.hp / this.maxHp))), 1, this.hp / this.maxHp > 0.4 ? C2.bar : C2.barLit);
    }
    for (const inst of Object.values(this.auras)) inst.draw(g.frame);
    painterFor(g.frame);
  }
};
var B_IDLE = { ...STAND, weapon: "staff", sa: 0.18, fx: 10, fy: -21, bx: 6, by: -20, crouch: 1 };
var B_RAISE = { ...B_IDLE, crouch: 0, lean: -3, fx: -4, fy: -43, bx: 9, by: -41, sa: -2.2, ffx: -3, fbx: 4 };
var B_SWEEP = { ...B_IDLE, crouch: 4, lean: 5, fx: 21, fy: -26, sa: 0.85, bx: -8, by: -22, ffx: 12, fbx: -10, toeB: true };
var B_WIDE = { turn: 1.15, crouch: 4, fx: -14, fy: -33, bx: 15, by: -33, sa: -1.3, ffx: -6, fbx: 7 };
var B_SLAM = { ...B_IDLE, crouch: 8, lean: 4, fx: -8, fy: -9, bx: 10, by: -9, sa: 0.4, ffx: -8, fbx: 9 };
var B_WALK = [
  [0, { ...B_IDLE, ffx: 9, fbx: -8, crouch: 2, lean: 1 }],
  [0.3, { ...B_IDLE, ffx: 2, ffy: -7, fbx: -2, crouch: 3 }],
  [0.6, { ...B_IDLE, ffx: -8, fbx: 9, crouch: 2, lean: 1 }],
  [0.9, { ...B_IDLE, ffx: 2, ffy: -7, fbx: -2, crouch: 3 }],
  [1.2, { ...B_IDLE, ffx: 9, fbx: -8, crouch: 2, lean: 1 }]
];
var B_TRACKS = {
  idle: [[0, B_IDLE], [1.6, { ...B_IDLE, crouch: 2, fx: 9, fy: -20 }], [3.2, B_IDLE]],
  walk: B_WALK,
  sweep: [[0, B_IDLE], [0.3, { ...B_SWEEP, x: -5, fx: -4, fy: -40, sa: -1.6 }], [0.55, B_SWEEP, "snap"], [1, B_SWEEP], [1.25, B_IDLE]],
  cast: [[0, B_IDLE], [0.24, B_RAISE], [0.7, B_RAISE], [0.95, { ...B_SLAM, sa: 0.4 }], [1.3, B_IDLE]],
  wide: [[0, B_IDLE], [0.3, B_RAISE], [0.6, B_WIDE, "snap"], [1, B_WIDE], [1.3, B_IDLE]],
  summon: [[0, B_IDLE], [0.35, B_RAISE], [0.8, { ...B_RAISE, x: -2, fx: -10, fy: -38 }], [1.2, B_RAISE], [1.5, B_IDLE]]
};
var Boss = class {
  constructor(g, x, y) {
    const t = ENEMY_TYPES.boss;
    this.typeId = "boss";
    this.type = t;
    this.name = "\u51A5\u6CB3\u5B88\u536B \xB7 \u963F\u523B\u620E";
    this.nameEn = "THE WARDEN";
    this.x = x;
    this.y = y;
    this.maxHp = t.hp;
    this.hp = t.hp;
    this.speed = t.speed;
    this.reach = t.reach;
    this.dmg = t.dmg;
    this.xp = t.xp;
    this.w = 34;
    this.facing = -1;
    this.vx = 0;
    this.vy = 0;
    this.state = "spawn";
    this.timer = 1.3;
    this.atkCd = 1.4;
    this.phase = 1;
    this.phaseLock = 1.4;
    this.stun = 0;
    this.freeze = 0;
    this.burn = 0;
    this.burnTick = 0;
    this.burnDmg = 4;
    this.slow = 0;
    this.hitFlash = 0;
    this.dead = false;
    this.auras = {};
    this.anim = { t: 0, track: B_TRACKS.idle, loop: true, dur: 3.2 };
    this.seal = createFx(g.fx.runeCircle, { x, y, seed: 9, light: 0.7 });
    this.portal = g.addFx(g.fx.spawnPortal, { x, y, seed: 7, light: 1 }, { layer: "ground", life: 1.4 });
  }
  get alive() {
    return !this.dead && this.hp > 0 && this.state !== "spawn";
  }
  get boss() {
    return true;
  }
  startAnim(track, loop = false) {
    this.anim = { t: 0, track, loop, dur: track[track.length - 1][0] };
  }
  addStatus(g, key, time) {
    if (key === "freeze") {
      this.freeze = Math.max(this.freeze, time * 0.45);
      this.slow = Math.max(this.slow, time);
    } else if (key === "stun") this.stun = Math.max(this.stun, time * 0.3);
    else if (key === "burn") {
      this.burn = Math.max(this.burn, time);
      this.burnDmg = Math.max(this.burnDmg, 5);
    } else if (key === "slow") this.slow = Math.max(this.slow, time);
    if (!this.auras[key]) {
      const mod = key === "freeze" ? g.fx.frozen : key === "stun" ? g.fx.stunned : key === "burn" ? g.fx.burning : null;
      if (mod) this.auras[key] = createFx(mod, { x: this.x, y: this.y, seed: 19 });
    }
  }
  updateAuras(g, dt) {
    for (const [key, inst] of Object.entries(this.auras)) {
      const live = key === "freeze" ? this.freeze > 0 : key === "stun" ? this.stun > 0 : key === "burn" ? this.burn > 0 : this.slow > 0;
      inst.options.x = this.x;
      inst.options.y = this.y;
      if (!live) inst.stop();
      inst.update(dt);
      if (inst.done()) delete this.auras[key];
    }
  }
  update(g, dt) {
    if (this.dead) return;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.slow = Math.max(0, this.slow - dt);
    this.phaseLock = Math.max(0, this.phaseLock - dt);
    this.updateAuras(g, dt);
    this.seal.options.x = this.x;
    this.seal.options.y = this.y - 1;
    this.seal.update(dt);
    this.anim.t += dt;
    if (this.burn > 0) {
      this.burn -= dt;
      this.burnTick -= dt;
      if (this.burnTick <= 0) {
        this.burnTick = 0.5;
        this.hurt(g, this.burnDmg, { silent: true, dot: true, crit: false });
        if (this.dead) return;
      }
    }
    if (this.state === "spawn") {
      this.timer -= dt;
      if (this.timer <= 0) this.state = "chase";
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - 6 * dt);
    this.vy *= Math.max(0, 1 - 6 * dt);
    const hero = g.hero;
    if (!hero.alive) return;
    const dx = hero.x - this.x;
    if (dx) this.facing = dx > 0 ? 1 : -1;
    if (this.freeze > 0 || this.stun > 0) return;
    if (this.phaseLock > 0) return;
    if (this.state === "windup") {
      this.timer -= dt;
      if (this.timer <= 0) this.execute(g);
      this.clampPos();
      return;
    }
    if (this.state === "recover") {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = "chase";
        this.atkCd = Math.max(0.7, 2.3 - this.phase * 0.35) + rnd(0, 0.4);
      }
      this.clampPos();
      return;
    }
    this.atkCd -= dt * (this.slow > 0 ? 0.6 : 1);
    const dist = Math.abs(dx);
    if (this.atkCd <= 0 && dist < 128) {
      this.chooseAttack(g);
      return;
    }
    if (dist > 46) this.x += Math.sign(dx) * this.speed * (this.slow > 0 ? 0.5 : 1) * dt;
    if (Math.abs(hero.y - this.y) > 10) this.y += Math.sign(hero.y - this.y) * this.speed * 0.35 * dt;
    if (Math.abs(dx) > 50) {
      if (this.anim.track !== B_TRACKS.walk) this.startAnim(B_TRACKS.walk, true);
    } else if (this.anim.track !== B_TRACKS.idle) {
      this.startAnim(B_TRACKS.idle, true);
    }
    this.clampPos();
  }
  clampPos() {
    this.x = clamp(this.x, 44, 290);
    this.y = clamp(this.y, 140, 166);
  }
  chooseAttack(g) {
    const pool3 = this.phase === 1 ? ["sweep", "thunder", "sweep"] : this.phase === 2 ? ["sweep", "thunder", "wide", "summon"] : ["sweep", "thunder", "wide", "meteor", "thunder"];
    this.pattern = pool3[Math.floor(Math.random() * pool3.length)];
    this.state = "windup";
    const windup = { sweep: 0.7, thunder: 1.05, wide: 1.15, summon: 0.85, meteor: 1.3 }[this.pattern];
    this.timer = windup;
    this.startAnim(this.pattern === "sweep" ? B_TRACKS.sweep : this.pattern === "wide" ? B_TRACKS.wide : this.pattern === "summon" ? B_TRACKS.summon : B_TRACKS.cast);
    g.audio.play("cast");
    this.seal.options.light = 1.4;
  }
  execute(g) {
    const hero = g.hero;
    this.state = "recover";
    this.timer = 0.7;
    this.seal.options.light = 0.7;
    if (this.pattern === "sweep") {
      g.addFx(g.fx.scytheReap, { x: this.x - this.facing * 6, y: this.y, flip: this.facing < 0, light: 1.1 });
      g.audio.play("cleave");
      g.after(0.16, () => {
        const dx = hero.x - this.x, dy = hero.y - this.y;
        if (dx * this.facing > -10 && Math.abs(dx) < 74 && Math.abs(dy) < 24) {
          if (hero.hurt(g, this.dmg + (this.phase - 1) * 3, { fromX: this.x })) {
            g.addFx(g.fx.critHit, { x: hero.x, y: hero.y - 24, flip: dx < 0, light: 1.1 });
            g.shake(5, 0.4);
            g.hitStop = Math.max(g.hitStop, 0.07);
          }
        }
      });
    } else if (this.pattern === "thunder") {
      const tx = hero.x, ty = clamp(hero.y, 138, 168);
      g.telegraph(tx, ty, 34, 0.9, "#c9a8ff");
      g.addFx(g.fx.lightningStrike, { x: tx, y: ty, light: 1.2 });
      g.audio.play("thunder");
      g.after(0.76, () => {
        const near = Math.hypot(hero.x - tx, (hero.y - ty) * 1.4);
        if (near < 38) hero.hurt(g, this.dmg + 4, { fromX: tx });
        g.shake(6, 0.45);
        g.flashScreen("#c9a8ff", 0.16);
      });
    } else if (this.pattern === "wide") {
      g.addFx(g.fx.thunderclap, { x: this.x, y: this.y, light: 1.2 });
      g.audio.play("thunder");
      g.after(0.12, () => {
        const near = Math.hypot(hero.x - this.x, (hero.y - this.y) * 1.5);
        if (near < 82) {
          hero.hurt(g, this.dmg + 2, { fromX: this.x });
          hero.vx += Math.sign(hero.x - this.x) * 90;
        }
        g.shake(7, 0.5);
        g.flashScreen("#e8d8ff", 0.22);
      });
    } else if (this.pattern === "summon") {
      g.audio.play("spawn");
      g.after(0.25, () => {
        const spots2 = [[clamp(this.x - 58, 30, 292), 150], [clamp(this.x + 58, 30, 292), 156]];
        for (const [x, y] of spots2) if (g.enemies.filter((e) => e.alive && !e.boss).length < 5) g.spawnEnemy("wisp", x, y, { seed: 400 + Math.floor(Math.random() * 99) });
      });
    } else if (this.pattern === "meteor") {
      const tx = hero.x, ty = hero.y;
      const spots2 = [[tx, ty], [clamp(tx - 46, 28, 292), clamp(ty + 6, 140, 168)], [clamp(tx + 46, 28, 292), clamp(ty - 6, 140, 168)]];
      spots2.forEach(([x, y], i) => {
        g.telegraph(x, y, 34, 1 + i * 0.14, "#ff9a5c");
        g.after(0.18 + i * 0.16, () => {
          g.addFx(g.fx.meteor, { x, y, light: 1.3, seed: 20 + i });
          g.audio.play("meteor");
          g.shake(5, 0.35);
          g.flashScreen("#ffb060", 0.18);
          g.after(0.62, () => {
            const near = Math.hypot(hero.x - x, (hero.y - y) * 1.3);
            if (near < 48) hero.hurt(g, this.dmg + 6, { fromX: x });
            g.shake(7, 0.5);
          });
        });
      });
    }
  }
  hurt(g, amount, opts = {}) {
    if (!this.alive || this.phaseLock > 0) return 0;
    let dmg = Math.max(1, Math.round(amount));
    const crit = opts.crit ?? Math.random() < 0.1;
    if (crit) dmg = Math.round(dmg * 1.6);
    this.hp -= dmg;
    this.hitFlash = 0.12;
    this.vx += (opts.knock ?? 8) * Math.sign(this.x - g.hero.x || 1);
    if (opts.status) this.addStatus(g, opts.status, opts.statusTime ?? 2);
    if (!opts.silent) {
      g.comboAdd();
      g.number(this.x, this.y - 82, String(dmg), { color: crit ? "#ffd36a" : "#ffe8ff", crit });
      g.addFx(crit ? g.fx.critHit : g.fx.hitSpark, { x: this.x, y: this.y - 40, flip: g.hero.x > this.x, light: 1 });
      g.audio.play(crit ? "crit" : "hit");
    }
    if (this.hp <= 0) {
      this.die(g);
      return dmg;
    }
    const pct = this.hp / this.maxHp;
    if (this.phase === 1 && pct < 0.66) this.transition(g, 2);
    else if (this.phase === 2 && pct < 0.33) this.transition(g, 3);
    return dmg;
  }
  transition(g, phase) {
    this.phase = phase;
    this.phaseLock = 1.25;
    g.banner(phase === 2 ? "PHASE II" : "PHASE III", "THE WARDEN", phase === 2 ? "THE RIVER SEAL OPENS" : "ASH CONSUMES HIM");
    g.flashScreen(phase === 2 ? "#c9a8ff" : "#ff9a5c", 0.3);
    g.shake(6, 0.6);
    g.audio.play("phase");
    g.addFx(g.fx.manaBurst, { x: this.x, y: this.y - 30, light: 1.2 });
    g.after(0.35, () => {
      g.addFx(g.fx.thunderclap, { x: this.x, y: this.y, light: 1 });
      const hero = g.hero;
      if (Math.hypot(hero.x - this.x, (hero.y - this.y) * 1.5) < 74) hero.hurt(g, 12, { fromX: this.x });
    });
    if (phase === 2) {
      g.spawnEnemy("wisp", clamp(this.x - 62, 30, 292), 150, { seed: 511 });
      g.spawnEnemy("wisp", clamp(this.x + 62, 30, 292), 156, { seed: 512 });
    }
  }
  die(g) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    g.addFx(g.fx.shatterDeath, { x: this.x, y: this.y, light: 1.2 });
    g.addFx(g.fx.manaBurst, { x: this.x, y: this.y - 30, light: 1.4 });
    g.addFx(g.fx.poof, { x: this.x, y: this.y - 20, light: 1 });
    g.flashScreen("#fff2e0", 0.5);
    g.shake(9, 1);
    g.hitStop = Math.max(g.hitStop, 0.16);
    g.audio.play("death");
    g.audio.play("meteor");
    g.kills++;
    g.hero.gainXp(g, this.xp);
    g.bossDefeated = true;
    g.bossRef = null;
    g.hold = 2.4;
    g.banner("GUARDIAN FALLEN", "THE WARDEN IS ASH", "");
    g.after(0.5, () => {
      for (const e of g.enemies) if (e !== this && !e.dead && !e.boss) e.hurt(g, 9999, { silent: true, crit: false });
    });
  }
  draw(g, p) {
    if (this.dead) return;
    const x = Math.round(this.x), y = Math.round(this.y);
    this.seal.draw(g.frame);
    p = painterFor(g.frame);
    p.ellipse(x, y - 1, 20, 5, C2.shadow, 0.6);
    if (this.state === "spawn") {
      p.glow(x, y - 40, 44, C2.boss, 0.35);
      return;
    }
    const r = posed(poseAt(this.anim.track, this.anim.loop ? this.anim.t % this.anim.dur : Math.min(this.anim.t, this.anim.dur)), BOSS_LOOK);
    const flip = this.facing < 0;
    const tinted = this.hitFlash > 0;
    const scale3 = 2;
    for (let i = 0; i < r.n; i++) {
      const dx = r.xs[i] * scale3;
      const sx = x + (flip ? -dx - scale3 : dx);
      const sy = y + r.ys[i] * scale3;
      p.rect(sx, sy, scale3, scale3, tinted ? C2.white : r.color[i]);
    }
    p.glow(x, y - 40, 34, this.phase === 3 ? hex("#ff7a3c") : C2.boss, 0.22);
    if (this.phaseLock > 0) p.glow(x, y - 40, 42, C2.white, 0.25);
    if (this.state === "windup") {
      const k = 1 - this.timer / { sweep: 0.7, thunder: 1.05, wide: 1.15, summon: 0.85, meteor: 1.3 }[this.pattern];
      const color = this.pattern === "meteor" || this.pattern === "sweep" ? C2.warnLit : C2.bossLit;
      dotRing(p, x, y - 1, this.pattern === "wide" ? 82 : 70, color, 0.35 + 0.4 * k, 26);
      if (this.pattern === "sweep") {
        for (let i = 1; i <= 8; i++) p.dot(x + this.facing * i * 9, y - 2, C2.warn, 0.5 * (1 - i / 10));
      }
      p.text(this.pattern === "sweep" ? "!" : this.pattern === "thunder" ? "!" : "!!", x, y - 96, color, { font: "big", align: "center", outline: C2.ink });
    }
    for (const inst of Object.values(this.auras)) inst.draw(g.frame);
    painterFor(g.frame);
  }
};
function spawnEnemy(g, typeId, x, y, opts = {}) {
  const e = typeId === "boss" ? new Boss(g, x, y) : new Enemy(g, typeId, x, y, opts);
  g.enemies.push(e);
  return e;
}

// src/skills.js
var SKILLS = SKILL_META.map((s) => ({ ...s, cast: null }));
function faceTo(hero, x) {
  if (Math.abs(x - hero.x) > 2) hero.facing = x > hero.x ? 1 : -1;
}
function nearest(g, maxDist = 220) {
  const h = g.hero;
  let best = null, bd = maxDist;
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - h.x, (e.y - h.y) * 1.25);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}
function aimPoint(g, maxDist = 220) {
  const h = g.hero;
  const t = nearest(g, maxDist);
  if (t) return { x: t.x, y: t.y, target: t };
  return { x: clamp(h.x + h.facing * 66, 24, 296), y: h.y, target: null };
}
function inFront(g, e, range, dy = 20) {
  const h = g.hero;
  const dx = (e.x - h.x) * h.facing;
  return dx > -8 && dx < range && Math.abs(e.y - h.y) < dy;
}
function rollCrit(extra = 0) {
  return Math.random() < 0.1 + extra;
}
function castJ(g) {
  const h = g.hero;
  const c = h.comboIndex;
  const t = nearest(g, 70);
  if (t) faceTo(h, t.x);
  const mods = [FX.swordSlash, FX.doubleSlash, FX.heavyCleave];
  const tracks = [TRACKS.attack1, TRACKS.attack2, TRACKS.attack3];
  const dmg = [11, 14, 24][c];
  const range = [60, 68, 80][c];
  const knock = [18, 28, 52][c];
  h.startAnim("attack" + (c + 1), tracks[c], false);
  h.comboIndex = (c + 1) % 3;
  h.comboTimer = 0.95;
  h.vx += h.facing * [18, 26, 44][c];
  g.addFx(mods[c], { x: h.x, y: h.y, flip: h.facing < 0, light: c === 2 ? 1.15 : 0.95 });
  g.audio.play(c === 2 ? "cleave" : c === 1 ? "slash2" : "slash");
  g.after(0.06 + c * 0.02, () => {
    const hit = g.hitEnemies((e) => inFront(g, e, range, 21), { dmg: dmg * h.dmgMul, knock, crit: rollCrit(c === 2 ? 0.05 : 0) });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, [0.045, 0.06, 0.11][c]);
      g.shake([1.8, 2.4, 4.6][c], [0.16, 0.2, 0.32][c]);
      if (c === 2) {
        g.flashScreen("#ffd36a", 0.1);
        g.addFx(FX.smallExplosion, { x: h.x + h.facing * 40, y: h.y, size: 0.42, light: 0.8 });
      }
    }
  });
}
function castK(g) {
  const h = g.hero;
  const aim = aimPoint(g, 210);
  faceTo(h, aim.x);
  h.startAnim("castK", TRACKS.castK, false);
  g.audio.play("cast");
  g.after(0.18, () => {
    if (!h.alive) return;
    const sx = h.x + h.facing * 12, sy = h.y - 24;
    const dx = aim.x - sx, dy = aim.y - sy;
    const len2 = Math.hypot(dx, dy) || 1;
    const speed = 178;
    const inst = createFx(FX.fireball, { x: sx, y: sy, flip: dx < 0, seed: 31 + Math.floor(Math.random() * 9) });
    g.projectiles.push({
      x: sx,
      y: sy,
      vx: dx / len2 * speed,
      vy: dy / len2 * speed,
      r: 8,
      dmg: 19 * h.dmgMul,
      team: "hero",
      fx: inst,
      life: 1.5,
      kind: "fireball",
      color: "#ff9a4a"
    });
    g.audio.play("fire");
  });
}
function explodeFireball(g, p) {
  g.addFx(FX.smallExplosion, { x: p.x, y: p.y + 8, size: 0.6, light: 1.1, seed: 12 });
  g.addFx(FX.hitSpark, { x: p.x, y: p.y, light: 1 });
  const hit = g.hitEnemies((e) => Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) < 30, {
    dmg: p.dmg,
    knock: 34,
    status: "burn",
    statusTime: 3.2,
    crit: rollCrit()
  });
  if (hit) {
    g.hitStop = Math.max(g.hitStop, 0.06);
    g.shake(3.2, 0.28);
  }
  g.flashScreen("#ff9a4a", 0.09);
}
function castL(g) {
  const h = g.hero;
  h.startAnim("castL", TRACKS.castL, false);
  g.addFx(FX.frostNova, { x: h.x, y: h.y, light: 1, seed: 44 + Math.floor(Math.random() * 7) }, { layer: "ground" });
  g.audio.play("ice");
  g.after(0.45, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - h.x, (e.y - h.y) * 1.4) < 74, {
      dmg: 20 * h.dmgMul,
      knock: 10,
      status: "freeze",
      statusTime: 2.1,
      crit: rollCrit()
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.055);
      g.shake(3.8, 0.35);
      g.flashScreen("#9ee6ff", 0.12);
    }
  });
}
function castU(g) {
  const h = g.hero;
  const aim = aimPoint(g, 230);
  faceTo(h, aim.x);
  h.startAnim("castU", TRACKS.castU, false);
  g.audio.play("cast");
  const tx = clamp(aim.x, 26, 294), ty = clamp(aim.y, 138, 168);
  g.telegraph(tx, ty, 40, 0.95, "#c9a8ff");
  g.after(0.18, () => {
    g.addFx(FX.lightningStrike, { x: tx, y: ty, light: 1.25, seed: 51 + Math.floor(Math.random() * 11) });
    g.audio.play("thunder");
  });
  g.after(0.18 + 0.76, () => {
    const hit = g.hitEnemies((e) => Math.hypot(e.x - tx, (e.y - ty) * 1.4) < 43, {
      dmg: 34 * h.dmgMul,
      knock: 30,
      status: "stun",
      statusTime: 1.6,
      crit: rollCrit(0.08)
    });
    if (hit) {
      g.hitStop = Math.max(g.hitStop, 0.08);
      g.shake(6.5, 0.45);
      g.flashScreen("#d8c8ff", 0.2);
    }
  });
}
function castI(g) {
  const h = g.hero;
  h.startAnim("castI", TRACKS.castI, false);
  g.addFx(FX.healAoe, { x: h.x, y: h.y, light: 0.9, seed: 61 }, { layer: "ground" });
  g.addFx(FX.blessing, { x: h.x, y: h.y - 12, seed: 62, light: 0.8 }, { life: 3.4, follow: () => h });
  g.audio.play("heal");
  g.after(0.18, () => {
    h.heal(g, Math.min(48, h.maxHp * 0.32), { big: true, linger: 4 });
    h.addShield(g, 30, 6.5);
    g.addFx(FX.divineShield, { x: h.x, y: h.y, light: 1, seed: 63 }, { life: 6.5, follow: () => h });
    g.audio.play("shield");
    g.flashScreen("#c8ffb0", 0.1);
  });
}
function castO(g) {
  const h = g.hero;
  const aim = aimPoint(g, 240);
  faceTo(h, aim.x);
  h.startAnim("castO", TRACKS.castO, false);
  h.invuln = Math.max(h.invuln, 0.9);
  const tx = clamp(aim.x, 40, 280), ty = clamp(aim.y, 140, 166);
  const spots2 = [
    [tx, ty],
    [clamp(tx - 46, 35, 285), clamp(ty + 5, 142, 166)],
    [clamp(tx + 46, 35, 285), clamp(ty - 5, 142, 166)]
  ];
  spots2.forEach(([x, y], i) => {
    g.telegraph(x, y, 38, 1.15 + i * 0.16, "#ffa050");
    g.after(0.22 + i * 0.15, () => {
      g.addFx(FX.meteor, { x, y, light: 1.35, seed: 70 + i });
      g.audio.play("meteor");
      g.after(0.62, () => {
        const hit = g.hitEnemies((e) => Math.hypot(e.x - x, (e.y - y) * 1.3) < 52, {
          dmg: (i === 0 ? 46 : 30) * h.dmgMul,
          knock: 60,
          status: "burn",
          statusTime: 4,
          crit: rollCrit(0.06)
        });
        if (hit) {
          g.hitStop = Math.max(g.hitStop, 0.1);
          g.shake(8, 0.55);
          g.flashScreen("#ffb060", 0.2);
        }
      });
    });
  });
}
var CASTS = { j: castJ, k: castK, l: castL, u: castU, i: castI, o: castO };
for (const s of SKILLS) s.cast = CASTS[s.id];
function castSkill(g, id) {
  const sk = SKILLS.find((s) => s.id === id);
  if (!sk || g.state !== "playing" || !g.hero.alive || g.hero.dead) return false;
  const h = g.hero;
  if (h.cd[id] > 0) {
    g.audio.play("deny");
    return false;
  }
  if (h.mp < sk.cost) {
    g.audio.play("deny");
    g.ui.deny(id);
    return false;
  }
  h.mp -= sk.cost;
  h.cd[id] = sk.cd;
  sk.cast(g);
  g.ui.pulseSkill(id);
  return true;
}

// ../pixelfx/src/fx/ui/panel.js
var meta41 = {
  name: "HUD panel",
  desc: "A reusable pixel HUD plate: dark rounded body, lit rim, shaded base, a thin gold inner frame and two corner brackets. Sized from options, it backs bars, hotbars and dialog cards.",
  tags: ["ui", "panel", "frame", "hud", "plate", "loop"],
  size: [340, 100],
  origin: [170, 50],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { width: 320, height: 60, title: "", palette: UI_GOLD, ornament: true, shine: true, seed: 1 }
};
function draw20(p, t, o) {
  const G3 = fit(o.palette ?? UI_GOLD, 8), w = clamp(Math.round(o.width ?? 320), 8, 338), h = clamp(Math.round(o.height ?? 60), 8, 98);
  const x = -w / 2, y = -h / 2;
  const sh = o.shine === false ? null : t / meta41.duration % 1 * (w + 40) - 20 - w / 2;
  panel(p, x, y, w, h, UI_INK, { r: Math.min(5, Math.floor(h / 4)), shine: sh });
  p.rect(x + 2, y + 2, w - 4, 1, G3[3]);
  p.rect(x + 2, y + h - 3, w - 4, 1, UI_INK.low);
  const L4 = Math.min(7, Math.floor(w / 4));
  p.rect(x + 3, y + 3, L4, 1, G3[2]);
  p.rect(x + 3, y + 3, 1, L4, G3[2]);
  p.rect(x + w - 3 - L4, y + 3, L4, 1, G3[2]);
  p.rect(x + w - 4, y + 3, 1, L4, G3[2]);
  p.rect(x + 3, y + h - 4, L4, 1, G3[2]);
  p.rect(x + 3, y + h - 3 - L4, 1, L4, G3[2]);
  p.rect(x + w - 3 - L4, y + h - 4, L4, 1, G3[2]);
  p.rect(x + w - 4, y + h - 3 - L4, 1, L4, G3[2]);
  if (o.ornament) {
    const cx = 0, cy = y + 3;
    p.px(cx, cy - 1, G3[5]);
    p.px(cx, cy + 1, G3[5]);
    p.px(cx - 1, cy, G3[4]);
    p.px(cx + 1, cy, G3[4]);
    p.px(cx, cy, G3[7]);
    p.px(cx - 2, cy, G3[2]);
    p.px(cx + 2, cy, G3[2]);
  }
  if (o.title) {
    p.text(o.title, x + 8, y + 6, G3[6], { outline: UI_INK.outline });
  }
  p.glow(0, y + 2, w * 0.45, G3[3], 0.035);
}

// ../pixelfx/src/fx/ui/status-bar.js
var meta42 = {
  name: "HUD status bar",
  desc: "A segmented HUD bar: dark outline, hard ramp fill, lit rim, cell dividers, white-hot leading edge. Label and value sit inside; tone picks the hp, mp, xp, boss or gold ramp.",
  tags: ["ui", "bar", "hud", "health", "mana", "xp", "boss", "loop"],
  size: [320, 24],
  origin: [160, 12],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    label: "HP",
    value: 0.72,
    text: "72 / 100",
    tone: "hp",
    width: 130,
    height: 9,
    cells: 10,
    seed: 3
  }
};
var toneOf = (o) => o.palette ? fit(o.palette, 8) : fit(UI_TONES[o.tone] ?? UI_TONES.hp, 8);
function draw21(p, t, o) {
  const C5 = toneOf(o), w = clamp(Math.round(o.width), 12, 318), h = clamp(Math.round(o.height), 4, 18);
  const x = -w / 2, y = -h / 2;
  bar(p, x, y, w, h, o.value, C5, { cells: o.cells });
  const fw = Math.round(w * clamp(o.value, 0, 1));
  if (fw > 8) {
    const u = t / meta42.duration % 1, gx = x + 2 + Math.round((fw - 4) * u);
    p.rect(gx, y + 1, 1, h - 2, C5[7], 0.55);
    p.glow(gx, y + h / 2, 5, C5[5], 0.08);
  }
  const ty = Math.round(y + (h - 5) / 2);
  if (o.label) p.text(o.label, x + 2, ty, C5[6], { outline: UI_INK.outline });
  if (o.text) p.text(o.text, x + w - 2, ty, C5[7], { align: "right", outline: UI_INK.outline });
  if (!o.value && !o.label && !o.text) p.text("EMPTY", 0, ty, hex("#8a8098"), { align: "center" });
}

// ../pixelfx/src/fx/ui/skill-slot.js
var meta43 = {
  name: "HUD skill slot",
  desc: "A pixel hotbar slot: HUD plate, gold keycap, 10x10 spell icon, name, dithered cooldown curtain and a no-mana state. One shared frame; only the icon palette changes.",
  tags: ["ui", "skill", "hotbar", "cooldown", "hud", "loop"],
  size: [52, 60],
  origin: [26, 30],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    key: "J",
    name: "SLASH",
    icon: "slash",
    cooldown: 0,
    cdText: "",
    mana: true,
    flash: false,
    deny: false,
    width: 40,
    height: 46,
    seed: 2
  }
};
var ICONS = {
  slash: [
    ".........#",
    "........##",
    ".......##.",
    "......##..",
    ".....##...",
    "....##....",
    "...##.....",
    "..##......",
    ".##.......",
    "#........."
  ],
  fire: [
    "....#.....",
    "...###....",
    "..##o##...",
    ".########.",
    ".########.",
    "..######..",
    "...####...",
    "....##....",
    "..........",
    ".........."
  ],
  frost: [
    "....#.....",
    "..#.#.#...",
    "...###....",
    ".#######..",
    ".#######..",
    "...###....",
    "..#.#.#...",
    "....#.....",
    "..........",
    ".........."
  ],
  bolt: [
    "....##....",
    "...##.....",
    "..##......",
    ".#####....",
    "...##.....",
    "..##......",
    ".##.......",
    "##........",
    "..........",
    ".........."
  ],
  mend: [
    "....##....",
    "....##....",
    "....##....",
    "##########",
    "##########",
    "....##....",
    "....##....",
    "....##....",
    "..........",
    ".........."
  ],
  meteor: [
    "........#.",
    ".......###",
    "......####",
    ".....####.",
    "....####..",
    "...###....",
    "..##......",
    ".#........",
    "..........",
    ".........."
  ]
};
var PALS = {
  slash: { "#": "#fff4be", g: "#ffd36a", o: "#ff9a4a" },
  fire: { "#": "#fff3a6", o: "#ff7a3c", r: "#e0481c" },
  frost: { "#": "#dcfbff", c: "#8fdcff", b: "#3a8bd8" },
  bolt: { "#": "#ffffff", v: "#d8c8ff", p: "#9a6cff" },
  mend: { "#": "#f0ffd0", g: "#a8e09a", d: "#6aa85a" },
  meteor: { "#": "#fff3a6", o: "#ffb05a", r: "#e0481c" }
};
function draw22(p, t, o) {
  const w = clamp(Math.round(o.width), 28, 50), h = clamp(Math.round(o.height), 34, 58);
  const x = -w / 2, y = -h / 2;
  const G3 = fit(UI_GOLD, 8), rows = ICONS[o.icon] ?? ICONS.slash, pal = PALS[o.icon] ?? PALS.slash;
  const accent = Object.values(pal)[0] ?? G3[6];
  const cd = clamp(o.cooldown ?? 0, 0, 1);
  panel(p, x, y, w, h, UI_INK, { r: 3 });
  p.rect(x + 2, y + 2, w - 4, 1, G3[3]);
  p.rect(x + 2, y + h - 3, w - 4, 1, UI_INK.low);
  const ks = Math.min(11, Math.floor(w / 3));
  panel(p, x + 2, y + 2, ks, ks, { outline: G3[0], rim: G3[6], top: G3[3], body: G3[2], low: G3[1] }, { r: 2 });
  p.text(o.key ?? "", x + 2 + ks / 2, y + 3, UI_INK.outline, { align: "center" });
  const ix = Math.round(-5), iy = Math.round(-6);
  p.sprite(rows, Object.fromEntries(Object.keys(pal).map((k) => [k, UI_INK.outline])), ix + 1, iy + 1);
  p.sprite(rows, pal, ix, iy);
  p.glow(0, -2, 9, hex(accent), 0.14);
  const nameColor = o.mana === false ? hex("#8a6070") : cd > 1e-3 ? hex("#8d829a") : G3[6];
  p.text(o.name ?? "", 0, y + h - 8, nameColor, { align: "center", outline: UI_INK.outline });
  if (cd <= 1e-3 && o.mana !== false) {
    const u = t / meta43.duration % 1;
    if (u < 0.22) {
      const sx = x + 2 + Math.round((w - 4) * (u / 0.22));
      p.rect(sx, y + 2, 1, h - 4, hex("#fff4c8"), 0.6);
    }
  }
  if (cd > 1e-3) {
    const ch = Math.max(1, Math.round((h - 2) * cd));
    p.rect(x + 1, y + 1, w - 2, ch, UI_INK.outline, 0.72);
    p.rect(x + 1, y + 1 + ch, w - 2, 1, G3[3]);
    if (o.cdText) p.text(String(o.cdText), 0, 2, G3[7], { font: "big", align: "center", outline: UI_INK.outline });
  }
  if (o.flash) {
    p.rect(x + 1, y + 1, w - 2, 1, hex("#ffffff"));
    p.rect(x + 1, y + h - 2, w - 2, 1, hex("#fff4c8"));
    p.glow(0, 0, 18, G3[5], 0.18);
  }
  if (o.deny) {
    p.rect(x + 1, y + 1, w - 2, 1, hex("#ff5a4a"));
    p.rect(x + 1, y + h - 2, w - 2, 1, hex("#ff5a4a"));
  }
  if (o.mana === false) {
    p.rect(x + 1, y + 1, w - 2, 1, hex("#ff5a4a"));
    p.rect(x + 1, y + h - 2, w - 2, 1, hex("#ff5a4a"));
    p.rect(x + 1, y + 1, 1, h - 2, hex("#ff5a4a"));
    p.rect(x + w - 2, y + 1, 1, h - 2, hex("#ff5a4a"));
    p.px(x + w - 4, y + 4, hex("#ff8a7a"));
    p.px(x + w - 5, y + 4, hex("#ff8a7a"));
  }
}

// ../pixelfx/src/fx/ui/dialog.js
var meta44 = {
  name: "HUD dialog",
  desc: "A pixel dialog card: dark plate, gold frame, corner brackets, a big pixel-font title, divider, small lines and a blinking prompt. One card for title, pause, defeat, victory.",
  tags: ["ui", "dialog", "modal", "menu", "title", "loop"],
  size: [300, 190],
  origin: [150, 95],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    kicker: "PAUSED",
    title: "PAUSED",
    subtitle: "THE EMBERS REST",
    lines: ["KILLS 12", "LEVEL 3", "TIME 2:41"],
    prompt: "ESC RESUME",
    width: 250,
    height: 150,
    tone: "gold",
    seed: 4
  }
};
function draw23(p, t, o) {
  const w = clamp(Math.round(o.width ?? 250), 160, 298), h = clamp(Math.round(o.height ?? 150), 100, 188);
  const x = -w / 2, y = -h / 2;
  const G3 = fit(o.tone === "blood" ? UI_TONES.hp : UI_GOLD, 8);
  const sh = t / meta44.duration % 1 * (w + 40) - w / 2 - 20;
  panel(p, x, y, w, h, UI_INK, { r: 5, shine: sh });
  p.rect(x + 3, y + 3, w - 6, 1, G3[3]);
  p.rect(x + 3, y + h - 4, w - 6, 1, UI_INK.low);
  const L4 = 8;
  for (const [cx, cy, sx, sy] of [[x + 4, y + 4, 1, 1], [x + w - 5, y + 4, -1, 1], [x + 4, y + h - 5, 1, -1], [x + w - 5, y + h - 5, -1, -1]]) {
    p.rect(cx, cy, L4 * sx, 1, G3[2]);
    p.rect(cx, cy, 1, L4 * sy, G3[2]);
  }
  const oy = y + 2;
  p.px(0, oy - 1, G3[5]);
  p.px(0, oy + 1, G3[5]);
  p.px(-1, oy, G3[4]);
  p.px(1, oy, G3[4]);
  p.px(0, oy, G3[7]);
  p.px(-2, oy, G3[2]);
  p.px(2, oy, G3[2]);
  if (o.kicker) p.text(o.kicker, 0, y + 14, G3[5], { align: "center", outline: UI_INK.outline });
  const word = spell(o.title ?? "", "big");
  const s = word.w * 2 <= w - 28 ? 2 : 1;
  const tw = word.w * s, titleY = y + 24;
  const items = word.letters.filter((Lt) => Lt.g).map((Lt) => ({
    g: Lt.g,
    x: -tw / 2 + Lt.x * s,
    y: titleY,
    sx: s,
    sy: s
  }));
  drawWord(p, items, {
    fill: [G3[3], G3[4], G3[5], G3[6]],
    edge: G3[7],
    under: G3[2],
    outline: UI_INK.outline,
    shadow: UI_INK.low,
    shine: t % 2.4 < 0.55 ? -w / 2 + t % 2.4 / 0.55 * (w + 20) : null,
    shineY: titleY,
    glint: G3[7]
  });
  p.glow(0, titleY + 7, tw * 0.55, G3[4], 0.1);
  const dy = titleY + 22;
  p.rect(x + 16, dy, w - 32, 1, G3[3]);
  p.px(0, dy - 1, G3[6]);
  p.px(-1, dy, G3[5]);
  p.px(1, dy, G3[5]);
  p.px(0, dy, G3[7]);
  if (o.subtitle) p.text(o.subtitle, 0, dy + 7, G3[6], { align: "center", outline: UI_INK.outline });
  const lines = Array.isArray(o.lines) ? o.lines : [];
  lines.forEach((line, i) => p.text(String(line), 0, dy + 18 + i * 8, hex("#d8d4e6"), { align: "center", outline: UI_INK.outline }));
  if (o.prompt) {
    const a = 0.5 + 0.5 * Math.abs(Math.sin(t * 3.2));
    p.text(o.prompt, 0, y + h - 16, G3[6], { align: "center", outline: UI_INK.outline, a, font: "big" });
  }
  p.glow(0, y + 1, w * 0.4, G3[3], 0.035);
}

// ../pixelfx/src/fx/ui/banner.js
var banner_exports = {};
__export(banner_exports, {
  draw: () => draw24,
  meta: () => meta45
});
var meta45 = {
  name: "HUD banner",
  desc: "A stage or wave banner: a dark plate with a gold rim, a small kicker, a big pixel-font title and a sub-line. It slides in with a shine, holds, then slides away and ends empty.",
  tags: ["ui", "banner", "stage", "wave", "boss", "one-shot"],
  size: [240, 70],
  origin: [120, 35],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { kicker: "STAGE I", text: "MOSSY RUINS", sub: "THE OLD SANCTUM", seed: 5 }
};
function draw24(p, t, o) {
  const ain = seg(t, 0, 0.16), aout = seg(t, 2.12, 2.3);
  const a = Math.min(ain, 1 - aout);
  if (a <= 0.01) return;
  const G3 = fit(UI_GOLD, 8);
  const x = Math.round((1 - ease.outCubic(ain)) * 26 - ease.inCubic(aout) * 26);
  const y = 0;
  const sh = seg(t, 0.3, 0.8) > 0 && seg(t, 0.3, 0.8) < 1 ? -90 + 180 * ease.inOutSine(seg(t, 0.3, 0.8)) + x : null;
  panel(p, x - 104, y - 13, 208, 30, UI_INK, { r: 4, a, shine: sh });
  p.rect(x - 101, y - 10, 202, 1, G3[3], a);
  p.rect(x - 101, y + 14, 202, 1, UI_INK.low, a);
  p.px(x - 100, y - 4, G3[4], a);
  p.px(x + 100, y - 4, G3[4], a);
  if (o.kicker) p.text(o.kicker, x, y - 22, G3[5], { align: "center", outline: UI_INK.outline, a });
  const word = spell(o.text ?? "", "big");
  const s = word.w * 2 <= 176 ? 2 : 1, tw = word.w * s;
  const items = word.letters.filter((L4) => L4.g).map((L4) => ({
    g: L4.g,
    x: x - tw / 2 + L4.x * s,
    y: y - 7,
    sx: s,
    sy: s,
    a
  }));
  drawWord(p, items, {
    fill: [G3[3], G3[4], G3[5], G3[6]],
    edge: G3[7],
    under: G3[2],
    outline: UI_INK.outline,
    shadow: UI_INK.low,
    shine: sh === null ? null : sh,
    shineY: y - 8,
    glint: G3[7]
  });
  if (o.sub) p.text(o.sub, x, y + 18, hex("#c8c0d8"), { align: "center", outline: UI_INK.outline, a });
  p.glow(x, y - 12, 70, G3[4], 0.08 * a);
}

// ../pixelfx/src/fx/ui/toast.js
var toast_exports = {};
__export(toast_exports, {
  draw: () => draw25,
  meta: () => meta46
});
var meta46 = {
  name: "HUD toast",
  desc: "A small pickup or status toast: a dark pixel plate, a gold rim, one mini-font line. It slides in, holds, slides out and ends empty.",
  tags: ["ui", "toast", "pickup", "status", "one-shot"],
  size: [180, 30],
  origin: [90, 15],
  duration: 1.7,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { text: "HP +18", tone: "gold", seed: 6 }
};
function draw25(p, t, o) {
  const ain = seg(t, 0, 0.12), aout = seg(t, 1.42, 1.62);
  const a = Math.min(ain, 1 - aout);
  if (a <= 0.01) return;
  const G3 = UI_TONES[o.tone] ? UI_TONES[o.tone].map((c) => hex(c)) : UI_GOLD.map((c) => hex(c));
  const x = Math.round((1 - ease.outCubic(ain)) * 20 + ease.inCubic(aout) * 20), y = 0;
  panel(p, x - 70, y - 9, 140, 18, UI_INK, { r: 3, a });
  p.rect(x - 67, y - 7, 134, 1, G3[4], a);
  p.px(x - 64, y, G3[6], a);
  p.px(x - 63, y, G3[5], a);
  p.text(o.text ?? "", x + 2, y - 2, G3[7], { align: "center", outline: UI_INK.outline, a });
  p.glow(x, y, 50, G3[4], 0.08 * a);
}

// ../pixelfx/src/fx/ui/quest-complete.js
var quest_complete_exports = {};
__export(quest_complete_exports, {
  create: () => create22,
  meta: () => meta47
});
var meta47 = {
  name: "Quest complete",
  desc: "A stitched ribbon unrolls from the middle, QUEST COMPLETE types on letter by letter, a gold seal stamps down and ticks, stars pop; then it all rolls away.",
  tags: ["ui", "quest", "banner", "reward", "text", "one-shot"],
  size: [204, 92],
  origin: [102, 46],
  duration: 2.6,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#2a1405", "#5c3008", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"],
    ribbon: ["#1e0608", "#45101a", "#7a1a26", "#ad2632", "#d8433f", "#f27a5e", "#ffb79a"],
    text: "QUEST COMPLETE",
    seed: 8
  }
};
var L3 = 66;
var BH2 = 8;
var OPEN3 = 0.32;
var TYPE = 0.2;
var STEP = 0.036;
var STAMP = 0.95;
var SX = 64;
var SY5 = 4;
var POPSEAL = 2;
var ROLL2 = 2.08;
function ribbon(p, Rb, G3, l, tails, t) {
  if (l < 1) return;
  if (tails > 0.02)
    for (const s of [-1, 1]) {
      const drop = 6 * tails, x0 = s * (l - 8), x1 = s * (l + 16 * tails);
      p.shade(Math.min(x0, x1) - 1, -BH2 + drop - 1, Math.max(x0, x1) + 1, BH2 + drop + 1, (x, y) => {
        const u = (x - x0) / (x1 - x0), v = y - drop;
        if (u < 0 || u > 1 || Math.abs(v) > BH2) return;
        if (u > 1 - 0.3 * (BH2 - Math.abs(v)) / BH2) return;
        const e = Math.min(BH2 - Math.abs(v), (1 - u) * (x1 - x0) * s);
        if (e < 1 || u < 0.02) return Rb[0];
        return v < -BH2 + 2 ? Rb[3] : v < 0 ? Rb[2] : Rb[1];
      });
      p.tri(s * (l - 8), BH2, s * (l - 1), BH2, s * (l - 8), BH2 + drop, Rb[0]);
    }
  p.shade(-l - 1, -BH2 - 1, l + 1, BH2 + 1, (x, y) => {
    const ax = Math.abs(x), v = y;
    if (ax > l || Math.abs(v) > BH2) return;
    const e = Math.min(l - ax, BH2 - Math.abs(v));
    if (e < 1) return Rb[0];
    if (v < -BH2 + 2) return Rb[5];
    if (v > BH2 - 2) return Rb[1];
    if ((Math.abs(v + BH2 - 2.5) < 0.5 || Math.abs(v - BH2 + 3.5) < 0.5) && Math.floor(x + 0.5) % 3 !== 0 && ax < l - 3) return G3[3];
    return v < -1 ? Rb[4] : Rb[3];
  });
  if (tails < 0.02)
    for (const s of [-1, 1]) {
      const x = s * l;
      p.rect(Math.round(x) - 2, -BH2 - 2, 4, BH2 * 2 + 4, Rb[0]);
      p.rect(Math.round(x) - 1, -BH2 - 1, 1, BH2 * 2 + 2, Rb[4]);
      p.rect(Math.round(x), -BH2 - 1, 1, BH2 * 2 + 2, Rb[2]);
      p.px(Math.round(x) - 1, -BH2 - 1, Rb[6]);
    }
}
function seal(p, G3, x, y, r, sx, sy, white, k) {
  const M2 = r * 1.25 + 2;
  p.shade(x - M2 * sx, y - M2 * sy, x + M2 * sx, y + M2 * sy, (px, py) => {
    const dx = (px - x) / sx, dy = (py - y) / sy, d = Math.hypot(dx, dy), an = Math.atan2(dy, dx), edge = r * (1 + 0.09 * Math.cos(an * 14));
    if (d > edge) return;
    if (white) return edge - d < 1 ? G3[5] : WHITE;
    if (edge - d < 1) return G3[0];
    const l = -(dx * 0.6 + dy * 0.8) / r;
    if (edge - d < 3) return l > 0.3 ? G3[6] : l > -0.3 ? G3[5] : G3[3];
    if (Math.abs(d - r * 0.66) < 0.5) return l > 0 ? G3[3] : G3[2];
    return l > 0.45 ? G3[7] : l > 0.1 ? G3[6] : l > -0.35 ? G3[5] : G3[4];
  });
  if (white || k <= 0) return;
  const pts = [[-5, 0], [-1.5, 3.5], [5.5, -4.5]].map(([a, b]) => [x + a * sx, y + b * sy]);
  const len1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), len2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  const done = k * (len1 + len2), segs = [[pts[0], pts[1], Math.min(1, done / len1)], [pts[1], pts[2], clamp((done - len1) / len2)]];
  for (const [w, c] of [[4.2, G3[0]], [2.4, WHITE]])
    for (const [a, b, u] of segs) if (u > 0) p.beam(a[0], a[1], a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, w, c);
}
function create22(o) {
  const G3 = fit(o.palette, 8), Rb = fit(o.ribbon, 7), R4 = new Rng(o.seed);
  const ps = new Particles({ rng: R4, sparks: [G3[7], G3[6], G3[5], G3[3]] }), lights = new Lights();
  const word = spell(o.text, "mini"), TS = 2, TW2 = word.w * TS, TX = -TW2 / 2 - 4, TY2 = -5;
  const glyphs = word.letters.filter((Lt) => Lt.g);
  const sats = Array.from({ length: 7 }, (_, i) => ({ x: (i / 6 - 0.5) * 140 + R4.range(-6, 6), y: (i % 2 ? 1 : -1) * R4.range(15, 22), t0: STAMP + 0.12 + i * 0.12 + R4.range(0, 0.04), dur: R4.range(0.3, 0.45), L: R4.range(3, 6) }));
  let t = 0, stamped = false, popped = false;
  const end = meta47.duration - 0.05;
  return {
    update(dt) {
      t += dt;
      if (!stamped && t >= STAMP) {
        stamped = true;
        lights.add(SX, SY5, 40, G3[5], 0.7, 0.35);
        lights.add(SX, SY5, 18, WHITE, 0.7, 0.1);
        for (let i = 0; i < 12; i++) {
          const an = i / 12 * TAU + R4.range(-0.2, 0.2), sp = R4.range(40, 80) * (Math.cos(an) > 0 ? 0.6 : 1);
          ps.spawn(P.STAR, SX + Math.cos(an) * 11, SY5 + Math.sin(an) * 11, Math.cos(an) * sp, Math.sin(an) * sp * 0.7, R4.range(0.25, 0.45), R4.pick([G3[7], G3[6], G3[5]]), i % 3 ? 0.6 : R4.range(1.2, 1.8));
        }
      }
      if (t > STAMP && t < POPSEAL && R4.chance(0.08)) ps.spawn(P.STAR, R4.range(-L3, L3), R4.range(-BH2, BH2), R4.range(-5, 5), -R4.range(8, 20), Math.min(R4.range(0.4, 0.8), end - t), R4.pick([G3[6], G3[5]]), 0.6);
      if (!popped && t >= POPSEAL + 0.05) {
        popped = true;
        lights.add(SX, SY5, 30, G3[6], 0.6, 0.2);
        for (let i = 0; i < 8; i++) {
          const an = R4.range(0, TAU), sp = R4.range(40, 90);
          ps.spawn(P.STAR, SX + Math.cos(an) * 6, SY5 + Math.sin(an) * 6, Math.cos(an) * sp, Math.sin(an) * sp, Math.min(R4.range(0.25, 0.4), end - t), R4.pick([G3[7], G3[6]]), i % 2 ? 0.6 : 1.5);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const [jx, jy] = shake(t, 2, STAMP, 0.18, o.seed);
      const l = L3 * (t < ROLL2 ? ease.outCubic(seg(t, 0, OPEN3)) : 1 - ease.inCubic(seg(t, ROLL2, ROLL2 + 0.26)));
      const tails = seg(t, OPEN3 - 0.02, OPEN3 + 0.12) * (t < ROLL2 ? 1 : 0);
      const sh = seg(t, 1.2, 1.5), shine = sh > 0 && sh < 1 ? -L3 - 10 + (2 * L3 + 20) * sh : null;
      ribbon(p, Rb, G3, l, ease.outBack(tails, 2), t);
      if (shine !== null)
        for (let y = -BH2 + 1; y < BH2; y++) {
          const x = shine + (y + BH2) * 0.6;
          if (Math.abs(x) < l - 2) p.px(x, y, Rb[6]), p.px(x + 1, y, Rb[5]);
        }
      const items = [];
      glyphs.forEach((Lt, i) => {
        const u = t - (TYPE + i * STEP), x = TX + Lt.x * TS + jx;
        if (u < 0 || Math.abs(x + Lt.w) > l - 3) return;
        const s = u < 0.035 ? 2.6 : TS;
        items.push({ g: Lt.g, x: x - (s - TS) * Lt.w / 2, y: TY2 + jy - (s - TS) * 5 / 2, sx: s, sy: s, flash: u < 0.07 ? 1 : 0 });
      });
      drawWord(p, items, { fill: [G3[4], G3[5], G3[6], G3[7]], edge: WHITE, under: G3[3], outline: Rb[0], shadow: Rb[1] });
      const dk = seg(t, STAMP - 0.12, STAMP), pk = t - POPSEAL;
      if (dk > 0 && pk < 0.08) {
        const fall = 1 - ease.inQuad(dk), sq = Math.exp(-(t - STAMP) * 30) * (t >= STAMP ? 1 : 0);
        let s = 1 + 0.8 * fall, sx = s * (1 + 0.2 * sq), sy = s * (1 - 0.2 * sq);
        if (pk > 0) sx = sy = 1 + 0.3 * (pk / 0.08);
        const white = t >= STAMP && t < STAMP + 0.05 || pk > 0;
        if (dk < 1) p.ellipse(SX, SY5 + 12, 10 * (1 - 0.3 * fall), 2, Rb[0], 0.5 * dk);
        seal(p, G3, SX + jx, SY5 - 14 * fall + jy, 11, sx, sy, white, seg(t, STAMP + 0.08, STAMP + 0.24));
        p.glow(SX, SY5, 22, G3[5], 0.3 + (white ? 0.4 : 0));
      }
      const rk = (t - STAMP) / 0.3;
      const rr = 12 + 13 * ease.outCubic(rk);
      if (rk > 0 && rk < 1) p.ellipse(SX, SY5, rr * 1.15, rr, rk < 0.3 ? WHITE : G3[5], (d) => d > 1 - 1.4 / rr ? 1.2 - rk : 0);
      for (const s of sats) {
        const u = (t - s.t0) / s.dur;
        if (u > 0 && u < 1) sparkle(p, s.x, s.y, s.L * Math.pow(Math.sin(u * Math.PI), 0.7), G3[6], G3[5], 0.5);
      }
      ps.draw(p);
      p.glow(0, 0, 76, G3[4], 0.2 * seg(t, 0.2, 0.5) * (1 - seg(t, ROLL2, ROLL2 + 0.2)));
      lights.draw(p);
    }
  };
}

// ../pixelfx/src/fx/ui/combo-counter.js
var combo_counter_exports = {};
__export(combo_counter_exports, {
  create: () => create23,
  meta: () => meta48
});
var meta48 = {
  name: "Combo counter",
  desc: "x5 COMBO rockets in on streaming speed lines, smearing, and slams to a stop: a white flash, a ring, sparks; it pulses while a timer bar drains, then whooshes out.",
  tags: ["ui", "combo", "counter", "combat", "text", "one-shot"],
  size: [208, 100],
  origin: [104, 50],
  duration: 1.45,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"], count: 5, label: "COMBO", seed: 6 }
};
var HIT4 = 0.1;
var BEAT = 0.5;
var OUT2 = 1.1;
function speedLines(p, C5, t, k, dir) {
  if (k <= 0.02) return;
  const f = Math.floor(t * 30);
  for (let i = 0; i < 18; i++) {
    if (rand(f, i, 3) > k) continue;
    const y = Math.round((rand(f, i, 1) - 0.5) * 60), L4 = 16 + rand(f, i, 2) * 50, x = (rand(f, i, 4) - 0.5) * 190;
    const x0 = Math.max(-100, x - L4 / 2), x1 = Math.min(100, x + L4 / 2);
    p.line(x0, y, x1, y, (u) => (dir > 0 ? u : 1 - u) > 0.75 ? WHITE : (dir > 0 ? u : 1 - u) > 0.35 ? C5[6] : C5[4], (u) => (dir > 0 ? u : 1 - u) < 0.25 ? 0.6 : 1);
  }
}
function create23(o) {
  const C5 = fit(o.palette, 8), R4 = new Rng(o.seed), SHADOW2 = scale(C5[0], 0.5);
  const ps = new Particles({ rng: R4, sparks: [C5[7], C5[6], C5[5], C5[3]] }), lights = new Lights();
  const big = spell("x" + Math.round(o.count)), lab = spell(o.label);
  const BS = 4, LS = 2, W7 = big.w * BS + 4 + lab.w * LS, X0 = -W7 / 2, BASE = 12;
  const spikes2 = Array.from({ length: 10 }, (_, i) => [i / 10 * TAU + R4.range(-0.15, 0.15), R4.range(14, 24)]);
  let t = 0, hit = false, out = false;
  const xAt = (t2) => {
    t2 = Math.max(0, t2);
    if (t2 < HIT4) return -32 * Math.pow(1 - t2 / HIT4, 2);
    if (t2 < OUT2) return 7 * Math.exp(-(t2 - HIT4) * 18) * Math.sin((t2 - HIT4) * 34);
    const u = seg(t2, OUT2, OUT2 + 0.2);
    return u < 0.3 ? -4 * ease.outQuad(u / 0.3) : -4 + 24 * ease.inQuad((u - 0.3) / 0.7);
  };
  return {
    update(dt) {
      t += dt;
      if (!hit && t >= HIT4) {
        hit = true;
        lights.add(0, 0, 70, C5[5], 0.7, 0.4);
        lights.add(-20, 0, 34, WHITE, 0.8, 0.1);
        for (let i = 0; i < 26; i++) {
          const an = R4.range(-1.2, 1.2) + (R4.chance(0.3) ? Math.PI : 0), sp = R4.range(120, 300);
          ps.spawn(P.SPARK, R4.range(-20, 20), R4.range(-8, 8), Math.cos(an) * sp, Math.sin(an) * sp * 0.6 - 20, R4.range(0.12, 0.3));
        }
      }
      if (t > BEAT && t < OUT2 && R4.chance(0.1)) {
        const x = X0 + R4.range(0, big.w * BS), y = BASE - R4.range(0, 30);
        ps.spawn(P.STAR, x, y, R4.range(-10, 10), -R4.range(5, 20), R4.range(0.25, 0.45), R4.pick([C5[7], C5[6]]), R4.chance(0.3) ? 1.6 : 0.6);
      }
      if (!out && t >= OUT2 + 0.06) {
        out = true;
        for (let i = 0; i < 10; i++) ps.spawn(P.MOTE, R4.range(-50, 30), R4.range(-14, 10), R4.range(220, 320), R4.range(-10, 10), R4.range(0.06, 0.14), R4.pick([C5[7], C5[6]]), 1);
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const [sx, sy] = shake(t, 3, HIT4, 0.25, o.seed);
      speedLines(p, C5, t, t < HIT4 ? 1 : t < OUT2 ? Math.max(0, 1 - (t - HIT4) / 0.35) * 0.9 : seg(t, OUT2 + 0.04, OUT2 + 0.12) * (1 - seg(t, OUT2 + 0.18, OUT2 + 0.3)), t >= OUT2 ? -1 : 1);
      const hk = t - HIT4;
      if (hk >= 0 && hk < 0.07) {
        const cx = X0 + big.w * BS / 2, k = hk < 0.035 ? 1 : 1.3;
        for (const [an, L4] of spikes2) {
          const ca = Math.cos(an) * 1.4, sa = Math.sin(an);
          if (k === 1) p.beam(cx, 0, cx + ca * L4, sa * L4, 3, (u) => u < 0.5 ? WHITE : C5[6]);
          else p.line(cx + ca * L4 * 0.5, sa * L4 * 0.5, cx + ca * L4 * k, sa * L4 * k, C5[5]);
        }
      }
      const rk = (t - HIT4) / 0.32;
      if (rk > 0 && rk < 1) {
        const r = 20 + 34 * ease.outCubic(rk);
        p.ellipse(sx, sy, r * 1.5, r * 0.75, rk < 0.3 ? WHITE : C5[5], (d) => d > 1 - 1.5 / (r * 0.75) ? 1.25 - rk : 0);
      }
      ps.draw(p);
      const x = xAt(t), moving = t < HIT4 || t > OUT2 + 0.06, stretch = moving ? t < HIT4 ? 1.22 : 1.12 : 1;
      const pulse2 = Math.exp(-(((t - BEAT) / 0.05) ** 2)), flash = t >= HIT4 && t < HIT4 + 0.07 || pulse2 > 0.6 ? 1 : 0;
      const a = t > OUT2 ? 1 - seg(t, OUT2 + 0.08, OUT2 + 0.2) : t < 0.035 ? 0.5 : 1;
      const layout = (dx) => {
        const bs = BS * (1 + 0.12 * pulse2), items = [];
        const bx = X0 + dx - big.w * BS * (stretch - 1) / 2, by = BASE - 7 * bs;
        big.letters.forEach((L4) => L4.g && items.push({ g: L4.g, x: bx + L4.x * BS * stretch, y: by, sx: BS * stretch, sy: bs, slant: 1, flash, a }));
        const lx = X0 + dx + big.w * BS * stretch + 4;
        lab.letters.forEach((L4) => L4.g && items.push({ g: L4.g, x: lx + L4.x * LS * stretch, y: BASE - 7 * LS, sx: LS * stretch, sy: LS, slant: 0.5, flash, a }));
        return items;
      };
      if (moving && a > 0) {
        for (const [lag, c] of [[0.03, C5[2]], [0.015, C5[3]]]) {
          const items = layout(xAt(t - (t < HIT4 ? lag : -lag)) + sx);
          drawWord(p, items.map((it) => ({ ...it, flash: 0 })), { fill: [c], edge: c, under: c, outline: 0, shadow: 0 });
        }
      }
      if (a > 0) {
        const sh = seg(t, 0.62, 0.86), items = layout(x + sx);
        drawWord(p, items.map((it) => ({ ...it, y: it.y + sy })), { fill: [C5[4], C5[5], C5[6], C5[7]], edge: WHITE, under: C5[3], outline: C5[0], ow: 2, shadow: SHADOW2, shine: sh > 0 && sh < 1 ? X0 - 10 + (W7 + 24) * sh : null, shineY: BASE - 28, glint: C5[6] });
        const bk = seg(t, HIT4 + 0.1, HIT4 + 0.2) * (t > OUT2 ? 0 : 1);
        if (bk > 0) {
          const bw = W7 * bk, left = 1 - seg(t, HIT4 + 0.2, OUT2), bx = X0 + x + sx, by = BASE + 5 + sy;
          p.rect(bx - 1, by - 1, bw + 2, 4, C5[0]);
          p.rect(bx, by, bw, 2, C5[1]);
          if (left > 0) p.rect(bx, by, bw * left, 2, C5[5]), p.rect(bx, by, bw * left, 1, C5[6]), p.px(bx + bw * left - 1, by, WHITE);
        }
      }
      p.glow(sx - 20, 0, 60, C5[4], 0.2 * a + (t >= HIT4 && t < HIT4 + 0.15 ? 0.5 * (1 - (t - HIT4) / 0.15) : 0) + 0.25 * pulse2);
      const g = (t - 0.86) / 0.22;
      if (g > 0 && g < 1) sparkle(p, X0 + W7 - 2, BASE - 14, 6 * Math.sin(g * Math.PI), C5[7], C5[5], 0.5);
      lights.draw(p);
    }
  };
}

// src/ui.js
var SW = 320;
var SH = 240;
var C3 = {
  ink: hex("#07060d"),
  gold: hex("#ffd36a"),
  gold2: hex("#fff2b8"),
  text: hex("#efe6d4"),
  muted: hex("#9a8fae"),
  boss: hex("#d9a6ff"),
  red: hex("#ff6a5a")
};
var fmtTime = (t) => {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};
var withPlace = (p, x, y, fn) => {
  p.place(x, y, false, 0);
  fn();
  p.place(0, 0, false, 0);
};
function plate2(p, t, x, y, w, h, opts = {}) {
  withPlace(p, x, y, () => draw20(p, t, {
    width: w,
    height: h,
    title: "",
    ornament: false,
    shine: false,
    ...opts
  }));
}
function meter(p, t, x, y, opts) {
  withPlace(p, x, y, () => draw21(p, t, opts));
}
function slot(p, t, x, y, opts) {
  withPlace(p, x, y, () => draw22(p, t, opts));
}
function card(p, t, x, y, opts) {
  withPlace(p, x, y, () => draw23(p, t, opts));
}
var UI2 = class {
  constructor(game2) {
    this.g = game2;
    this.t = 0;
    this.fx = [];
    this.pulse = {};
    this.deny = {};
  }
  reset() {
    this.t = 0;
    this.fx = [];
    this.pulse = {};
    this.deny = {};
  }
  update(dt) {
    this.t += dt;
    for (const k in this.pulse) this.pulse[k] = Math.max(0, this.pulse[k] - dt);
    for (const k in this.deny) this.deny[k] = Math.max(0, this.deny[k] - dt);
    for (const inst of this.fx) inst.update(dt);
    this.fx = this.fx.filter((inst) => !inst.done());
  }
  // screen-space pixelfx UI effects
  play(mod, opts) {
    this.fx.push(createFx(mod, opts));
  }
  banner(kicker, text, sub2 = "") {
    this.play(banner_exports, { x: 160, y: 86, kicker, text, sub: sub2 });
  }
  toast(text, tone = "gold") {
    this.play(toast_exports, { x: 160, y: 154, text, tone });
  }
  stageClear() {
    this.play(quest_complete_exports, { x: 160, y: 96, text: "STAGE CLEAR", palette: UI_GOLD });
  }
  comboMilestone(n) {
    this.play(combo_counter_exports, { x: 214, y: 104, count: n, label: "COMBO", palette: UI_GOLD });
  }
  pulseSkill(id) {
    this.pulse[id] = 0.26;
  }
  deny(id) {
    this.deny[id] = 0.22;
  }
  draw(g, p, frame3) {
    const t = this.t;
    if (g.state === "title") {
      this.drawMenu(g, p, 0.58);
      return;
    }
    this.drawHud(g, p, t);
    this.drawCommand(g, p, t);
    for (const inst of this.fx) inst.draw(frame3);
    p = painterFor(frame3);
    if (g.state === "paused") this.drawMenu(g, p, 0.62);
    else if (g.state === "gameover") this.drawMenu(g, p, 0.7);
    else if (g.state === "victory") this.drawMenu(g, p, 0.7);
  }
  drawHud(g, p, t) {
    const h = g.hero;
    plate2(p, t, 62, 24, 116, 40);
    p.text("DUELIST", 8, 8, C3.gold, { outline: C3.ink });
    p.text("LV " + h.level, 116, 8, C3.gold2, { align: "right", outline: C3.ink });
    meter(p, t, 64, 21, { label: "HP", value: h.hp / h.maxHp, text: `${Math.ceil(h.hp)}/${h.maxHp}`, tone: "hp", width: 108, height: 9, cells: 10 });
    meter(p, t, 64, 32, { label: "MP", value: h.mp / h.maxMp, text: `${Math.floor(h.mp)}/${h.maxMp}`, tone: "mp", width: 108, height: 8, cells: 10 });
    meter(p, t, 64, 41, { label: "", value: h.xp / h.xpNext, text: "", tone: "xp", width: 108, height: 3, cells: 10 });
    plate2(p, t, 186, 24, 120, 40);
    p.text(g.stage.actEn, 186, 8, C3.gold, { align: "center", outline: C3.ink });
    p.text(g.stage.nameEn, 186, 15, C3.gold2, { align: "center", font: "big", outline: C3.ink });
    const boss = g.bossRef && !g.bossRef.dead;
    p.text(boss ? "BOSS" : `WAVE ${g.waveIndex + 1}/${g.stage.waves.length}`, 186, 27, C3.muted, { align: "center", outline: C3.ink });
    for (let i = 0; i < 3; i++) {
      const x = 178 + i * 8, y = 36, on = i === g.stageIndex;
      p.px(x, y - 1, on ? C3.gold2 : C3.muted);
      p.px(x, y + 1, on ? C3.gold2 : C3.muted);
      p.px(x - 1, y, on ? C3.gold : C3.muted);
      p.px(x + 1, y, on ? C3.gold : C3.muted);
      p.px(x, y, on ? C3.gold2 : C3.muted);
    }
    plate2(p, t, 290, 24, 44, 40);
    p.text("KILLS", 290, 9, C3.gold, { align: "center", outline: C3.ink });
    p.text(String(g.kills), 290, 18, C3.gold2, { align: "center", font: "big", outline: C3.ink });
    if (boss) {
      p.text(g.bossRef.nameEn ?? "THE WARDEN", 160, 46, C3.boss, { align: "center", outline: C3.ink });
      p.text(["PHASE I", "PHASE II", "PHASE III"][g.bossRef.phase - 1] ?? "", 312, 46, C3.boss, { align: "right", outline: C3.ink });
      meter(p, t, 160, 57, { label: "", value: g.bossRef.hp / g.bossRef.maxHp, text: "", tone: "boss", width: 200, height: 9, cells: 20 });
    }
  }
  drawCommand(g, p, t) {
    plate2(p, t, 160, 210, 320, 60, { ornament: true });
    p.rect(0, 181, 320, 1, C3.gold, 0.5);
    const h = g.hero;
    SKILL_META.forEach((s, i) => {
      const left = h.cd[s.id] ?? 0, cd = left / s.cd;
      slot(p, t, 52 + i * 44, 204, {
        key: s.key,
        name: s.nameEn,
        icon: s.icon,
        cooldown: cd,
        cdText: left > 1e-3 ? left >= 1 ? String(Math.ceil(left)) : left.toFixed(1) : "",
        mana: h.mp >= s.cost,
        width: 40,
        height: 46,
        flash: (this.pulse[s.id] ?? 0) > 0,
        deny: (this.deny[s.id] ?? 0) > 0
      });
    });
    if (g.combo.count >= 2 && g.combo.timer > 0) {
      p.text("x" + g.combo.count, 16, 192, C3.gold2, { align: "center", font: "big", outline: C3.ink });
      p.text("COMBO", 16, 204, C3.muted, { align: "center", outline: C3.ink });
    }
    p.text(`WASD MOVE   ESC PAUSE   M SOUND ${g.audio.muted ? "OFF" : "ON"}`, 160, 233, C3.muted, { align: "center", outline: C3.ink });
  }
  drawMenu(g, p, dim) {
    p.rect(0, 0, SW, SH, C3.ink, dim);
    const s = g.stats();
    if (g.state === "title") {
      card(p, this.t, 160, 120, {
        kicker: "A PIXEL ACTION RPG",
        title: "EMBER ECHO",
        subtitle: "THE EMBERS NEVER DIE",
        lines: [
          "WASD MOVE",
          "J SLASH   K FIRE   L FROST",
          "U BOLT    I MEND   O METEOR",
          `ESC PAUSE   ${g.audio.muted ? "M SOUND OFF" : "M SOUND ON"}`
        ],
        prompt: "PRESS ENTER",
        width: 272,
        height: 140,
        tone: "gold"
      });
    } else if (g.state === "paused") {
      card(p, this.t, 160, 120, {
        kicker: "PAUSED",
        title: "PAUSED",
        subtitle: "THE EMBERS REST",
        lines: [`KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ESC RESUME   R RESTART",
        width: 240,
        height: 130
      });
    } else if (g.state === "gameover") {
      card(p, this.t, 160, 120, {
        kicker: "DEFEAT",
        title: "YOU FELL",
        subtitle: "THE EMBER WENT OUT",
        lines: [`STAGE ${s.stage}`, `KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ENTER TRY AGAIN",
        width: 240,
        height: 140,
        tone: "blood"
      });
    } else if (g.state === "victory") {
      card(p, this.t, 160, 120, {
        kicker: "VICTORY",
        title: "EMBER STILL BURNS",
        subtitle: "THE WARDEN IS ASH",
        lines: [`KILLS ${s.kills}`, `LEVEL ${s.level}`, `TIME ${fmtTime(s.time)}`],
        prompt: "ENTER AGAIN",
        width: 260,
        height: 130
      });
    }
  }
};

// src/audio.js
var AudioEngine = class {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noiseBuf = null;
    this.pad = null;
  }
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.62;
    this.master.connect(this.ctx.destination);
    const n = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, n, n);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.startPad();
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.62, this.ctx.currentTime, 0.03);
  }
  get now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }
  // A soft, slow drone under the fight. Two detuned sines and a filtered breath of noise.
  startPad() {
    const c = this.ctx;
    const bus = c.createGain();
    bus.gain.value = 0.055;
    bus.connect(this.master);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;
    lp.Q.value = 0.6;
    lp.connect(bus);
    const notes = [55, 82.5, 110];
    const oscs = notes.map((f, i) => {
      const o = c.createOscillator();
      o.type = i === 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = i === 1 ? 6 : -4;
      const g = c.createGain();
      g.gain.value = i === 2 ? 0.12 : 0.3;
      o.connect(g).connect(lp);
      o.start();
      return { o, g };
    });
    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.055;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.028;
    lfo.connect(lfoGain).connect(bus.gain);
    lfo.start();
    this.pad = { bus, lp, oscs };
  }
  tone({ f = 440, f2 = null, dur = 0.15, type = "sine", vol = 0.1, attack = 5e-3, delay = 0, filter = null }) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f), t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(1e-4, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(2e-4, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
    let node = o;
    if (filter) {
      const bq = c.createBiquadFilter();
      bq.type = filter.type ?? "lowpass";
      bq.frequency.setValueAtTime(filter.f ?? 800, t0);
      if (filter.f2) bq.frequency.exponentialRampToValueAtTime(filter.f2, t0 + dur);
      bq.Q.value = filter.q ?? 0.8;
      node.connect(bq);
      node = bq;
    }
    node.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  noise({ dur = 0.15, vol = 0.12, type = "highpass", f = 800, f2 = null, q = 0.7, delay = 0, attack = 4e-3 }) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t0 = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const bq = c.createBiquadFilter();
    bq.type = type;
    bq.frequency.setValueAtTime(f, t0);
    if (f2) bq.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + dur);
    bq.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(1e-4, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(2e-4, vol), t0 + attack);
    g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
    src.connect(bq).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }
  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "slash":
        this.noise({ dur: 0.13, vol: 0.14, type: "highpass", f: 1800, f2: 320, q: 1.2 });
        this.tone({ f: 520, f2: 180, dur: 0.09, type: "square", vol: 0.035 });
        break;
      case "slash2":
        this.noise({ dur: 0.12, vol: 0.15, type: "highpass", f: 2400, f2: 500, q: 1.4 });
        this.tone({ f: 700, f2: 240, dur: 0.1, type: "square", vol: 0.03 });
        break;
      case "cleave":
        this.noise({ dur: 0.28, vol: 0.2, type: "lowpass", f: 1600, f2: 180, q: 0.9 });
        this.tone({ f: 120, f2: 46, dur: 0.3, type: "sawtooth", vol: 0.12 });
        break;
      case "hit":
        this.noise({ dur: 0.08, vol: 0.2, type: "lowpass", f: 1200, f2: 220, q: 0.7 });
        this.tone({ f: 150, f2: 80, dur: 0.08, type: "triangle", vol: 0.1 });
        break;
      case "crit":
        this.noise({ dur: 0.16, vol: 0.22, type: "bandpass", f: 2600, f2: 600, q: 0.9 });
        this.tone({ f: 880, f2: 220, dur: 0.18, type: "square", vol: 0.07 });
        break;
      case "fire":
        this.noise({ dur: 0.5, vol: 0.24, type: "lowpass", f: 900, f2: 120, q: 0.8 });
        this.tone({ f: 130, f2: 44, dur: 0.5, type: "sawtooth", vol: 0.16, filter: { type: "lowpass", f: 500, f2: 90 } });
        break;
      case "cast":
        this.tone({ f: 220, f2: 520, dur: 0.2, type: "sine", vol: 0.06 });
        this.noise({ dur: 0.18, vol: 0.05, type: "highpass", f: 1200 });
        break;
      case "ice":
        this.noise({ dur: 0.45, vol: 0.16, type: "highpass", f: 1600, f2: 3400, q: 1.5 });
        this.tone({ f: 1400, f2: 2200, dur: 0.3, type: "sine", vol: 0.05 });
        this.tone({ f: 90, f2: 50, dur: 0.4, type: "triangle", vol: 0.1, delay: 0.06 });
        break;
      case "thunder":
        this.noise({ dur: 0.12, vol: 0.3, type: "highpass", f: 2600, q: 0.6 });
        this.noise({ dur: 0.9, vol: 0.26, type: "lowpass", f: 700, f2: 80, q: 0.6, delay: 0.03 });
        this.tone({ f: 70, f2: 32, dur: 0.9, type: "sawtooth", vol: 0.12, delay: 0.03 });
        break;
      case "heal":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone({ f, dur: 0.55, type: "sine", vol: 0.055, delay: i * 0.075, attack: 0.02 }));
        this.noise({ dur: 0.6, vol: 0.03, type: "highpass", f: 3e3 });
        break;
      case "shield":
        this.tone({ f: 330, f2: 660, dur: 0.5, type: "triangle", vol: 0.06 });
        this.tone({ f: 495, f2: 990, dur: 0.5, type: "sine", vol: 0.04, delay: 0.05 });
        break;
      case "meteor":
        this.noise({ dur: 1.2, vol: 0.32, type: "lowpass", f: 1400, f2: 90, q: 0.8 });
        this.tone({ f: 55, f2: 26, dur: 1.1, type: "sawtooth", vol: 0.2 });
        this.noise({ dur: 0.2, vol: 0.2, type: "highpass", f: 2200, delay: 0.08 });
        break;
      case "hurt":
        this.tone({ f: 240, f2: 90, dur: 0.2, type: "square", vol: 0.08, filter: { f: 900, f2: 300 } });
        this.noise({ dur: 0.14, vol: 0.12, type: "lowpass", f: 800 });
        break;
      case "pickup":
        this.tone({ f: 880, dur: 0.09, type: "square", vol: 0.045 });
        this.tone({ f: 1320, dur: 0.12, type: "square", vol: 0.04, delay: 0.06 });
        break;
      case "level":
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ f, dur: 0.4, type: "triangle", vol: 0.06, delay: i * 0.08 }));
        break;
      case "death":
        this.noise({ dur: 0.35, vol: 0.18, type: "lowpass", f: 1800, f2: 200 });
        this.tone({ f: 300, f2: 70, dur: 0.35, type: "sawtooth", vol: 0.05 });
        break;
      case "boss":
        this.tone({ f: 55, f2: 41, dur: 1.4, type: "sawtooth", vol: 0.12, filter: { f: 180 } });
        this.noise({ dur: 1, vol: 0.08, type: "lowpass", f: 300, f2: 100 });
        break;
      case "deny":
        this.tone({ f: 180, f2: 120, dur: 0.08, type: "square", vol: 0.04 });
        break;
      case "phase":
        this.tone({ f: 65, f2: 98, dur: 1.2, type: "sawtooth", vol: 0.12, filter: { f: 400, f2: 900 } });
        this.noise({ dur: 0.5, vol: 0.14, type: "highpass", f: 1200 });
        break;
      case "ui":
        this.tone({ f: 660, dur: 0.06, type: "square", vol: 0.035 });
        break;
      case "spawn":
        this.tone({ f: 160, f2: 380, dur: 0.3, type: "triangle", vol: 0.05 });
        this.noise({ dur: 0.3, vol: 0.05, type: "bandpass", f: 900 });
        break;
      default:
        break;
    }
  }
};

// src/game.js
var SW2 = 320;
var SH2 = 240;
var BH3 = 180;
var C4 = {
  ink: hex("#07060d"),
  white: 4294967295,
  bg: hex("#05060c"),
  warn: hex("#ff8a5a"),
  warnLit: hex("#ffd36a"),
  gold: hex("#ffd36a"),
  green: hex("#a8ff9a")
};
var Game = class {
  constructor(canvas2) {
    this.canvas = canvas2;
    this.ctx = canvas2.getContext("2d", { alpha: false });
    this.frame = createFrame(SW2, SH2);
    this.uiFrame = createFrame(SW2, SH2);
    this.img = this.ctx.createImageData(SW2, SH2);
    this.audio = new AudioEngine();
    this.fx = FX;
    this.ui = new UI2(this);
    this.hero = new Hero();
    this.keys = /* @__PURE__ */ new Set();
    this.state = "title";
    this.time = 0;
    this.runTime = 0;
    this.hitStop = 0;
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
    this.kills = 0;
    this.combo = { count: 0, timer: 0 };
    this.shakeState = { amp: 0, t: 0, dur: 0 };
    this.flashState = { color: C4.white, a: 0, max: 0.3 };
    this.fade = 0;
    this.stageIndex = 0;
    this.waveIndex = 0;
    this.phase = "title";
    this.phaseT = 0;
    this.clearT = 0;
    this.hold = 0;
    this.bossRef = null;
    this.bossDefeated = false;
    this.deathT = 0;
    this.stage = STAGES[0];
    this.mapFx = null;
    this.spawnQueue = [];
    this.loadStage(2, true);
  }
  // ------------------------------------------------------------------ setup
  loadStage(index, title = false) {
    this.stageIndex = index;
    this.stage = STAGES[index];
    this.mapFx = createFx(this.stage.map, { x: 0, y: 0, seed: 3 + index });
    this.ui.reset();
    this.hero.spawn(this.stage.map.map.spawns.hero[0], this.stage.map.map.spawns.hero[1]);
    this.enemies = [];
    this.effects = [];
    this.projectiles = [];
    this.pickups = [];
    this.numbers = [];
    this.motes = [];
    this.telegraphs = [];
    this.timers = [];
    this.spawnQueue = [];
    this.bossRef = null;
    this.bossDefeated = false;
    this.waveIndex = 0;
    this.phaseT = 0;
    this.clearT = 0;
    this.hold = 0;
    this.deathT = 0;
    this.combo = { count: 0, timer: 0 };
    this.phase = title ? "title" : "intro";
    this.state = title ? "title" : "playing";
    this.fade = title ? 0 : 1;
    if (!title) {
      this.banner(this.stage.actEn, this.stage.nameEn, this.stage.subEn, "STAGE");
      this.audio.play("ui");
    }
  }
  startRun() {
    this.audio.unlock();
    this.hero.reset();
    this.kills = 0;
    this.runTime = 0;
    this.loadStage(0, false);
  }
  restart() {
    this.startRun();
  }
  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.shakeState = { amp: 0, t: 0, dur: 0 };
    } else if (this.state === "paused") {
      this.state = "playing";
    }
  }
  // ------------------------------------------------------------------ tick
  tick(dt) {
    this.time += dt;
    if (this.state === "paused") return;
    if (this.state === "title") {
      this.mapFx.update(dt * 0.8);
      this.hero.update(this, dt, this.keys);
      this.updateEffects(dt);
      return;
    }
    if (this.state === "gameover" || this.state === "victory") {
      this.mapFx.update(dt * 0.5);
      this.updateMotes(dt);
      this.updateNumbers(dt);
      return;
    }
    this.runTime += dt;
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      this.mapFx.update(dt);
      this.updateShake(dt);
      this.updateFlash(dt);
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
    this.mapFx.update(dt);
    this.hero.update(this, dt, this.keys);
    for (const e of this.enemies) e.update(this, dt);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.updateEffects(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateMotes(dt);
    this.updateNumbers(dt);
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
      }
    }
  }
  updateFlow(dt) {
    if (this.hold > 0) {
      this.hold -= dt;
      return;
    }
    this.phaseT += dt;
    if (this.phase === "intro") {
      if (this.phaseT > 1.45) this.startWave(0);
    } else if (this.phase === "fight") {
      const busy = this.enemies.length > 0 || this.spawnQueue.length > 0;
      if (!busy) {
        this.clearT += dt;
        if (this.clearT > 0.85) {
          if (this.waveIndex + 1 < this.stage.waves.length) this.startWave(this.waveIndex + 1);
          else this.stageClear();
        }
      } else this.clearT = 0;
    } else if (this.phase === "clear") {
      if (this.phaseT > 2.8) {
        if (this.stageIndex + 1 < STAGES.length) {
          this.fade = 1;
          this.loadStage(this.stageIndex + 1, false);
        } else this.victory();
      }
    }
  }
  startWave(i) {
    this.waveIndex = i;
    this.phase = "fight";
    this.phaseT = 0;
    this.clearT = 0;
    const wave = this.stage.waves[i] ?? [];
    wave.forEach((spec, n) => this.spawnQueue.push({ ...spec, delay: n * 0.28 }));
    if (i > 0) {
      const boss = wave.some((s) => s.type === "boss");
      if (boss) this.banner("BOSS", "THE WARDEN", "ACHERON");
      else this.banner("WAVE " + (i + 1), this.stage.nameEn, "MORE SHADOWS GATHER");
    }
  }
  updateSpawns(dt) {
    if (!this.spawnQueue.length) return;
    for (const q of this.spawnQueue) q.delay -= dt;
    const ready = this.spawnQueue.filter((q) => q.delay <= 0);
    this.spawnQueue = this.spawnQueue.filter((q) => q.delay > 0);
    for (const q of ready) this.spawnEnemy(q.type, q.x, q.y, { seed: 100 + this.kills * 13 + Math.floor(this.time * 9) });
  }
  spawnEnemy(type, x, y, opts = {}) {
    const e = spawnEnemy(this, type, x, y, opts);
    if (e instanceof Boss) {
      this.bossRef = e;
      this.audio.play("boss");
    }
    return e;
  }
  stageClear() {
    this.phase = "clear";
    this.phaseT = 0;
    this.ui.stageClear();
    this.audio.play("level");
    this.hero.heal(this, Math.round(this.hero.maxHp * 0.22), { big: true });
    this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 24);
    this.projectiles = [];
    this.spawnQueue = [];
  }
  victory() {
    if (this.state === "victory") return;
    this.state = "victory";
    this.audio.play("level");
  }
  stats() {
    return {
      kills: this.kills,
      level: this.hero.level,
      time: this.runTime,
      stage: this.stageIndex + 1
    };
  }
  // ------------------------------------------------------------------ fx / entities
  addFx(mod, opts = {}, cfg = {}) {
    const inst = createFx(mod, opts);
    this.effects.push({
      inst,
      layer: cfg.layer ?? "front",
      age: 0,
      life: cfg.life ?? 0,
      follow: cfg.follow ?? null,
      offsetY: cfg.offsetY ?? 0
    });
    return inst;
  }
  updateEffects(dt) {
    for (const ef of this.effects) {
      ef.age += dt;
      if (ef.follow) {
        const p = ef.follow();
        ef.inst.options.x = p.x;
        ef.inst.options.y = p.y + ef.offsetY;
      }
      if (ef.life && ef.age >= ef.life) ef.inst.stop();
      ef.inst.update(dt);
    }
    this.effects = this.effects.filter((ef) => !ef.inst.done());
  }
  updateProjectiles(dt) {
    const hero = this.hero;
    for (const p of this.projectiles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.fx.options.x = p.x;
      p.fx.options.y = p.y;
      p.fx.options.flip = p.vx < 0;
      p.fx.update(dt);
      if (p.team === "hero") {
        let hit = null;
        for (const e of this.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - p.x, (e.y - 16 - p.y) * 0.75) < 10 + e.w * 0.4) {
            hit = e;
            break;
          }
        }
        if (hit) {
          explodeFireball(this, p);
          p.fx.stop();
          p.dead = true;
        }
      } else if (hero.alive && Math.hypot(hero.x - p.x, (hero.y - 22 - p.y) * 0.8) < 11) {
        if (hero.hurt(this, p.dmg, { fromX: p.x })) {
          this.addFx(FX.hitSpark, { x: p.x, y: p.y, flip: p.vx < 0, light: 0.9 });
          this.audio.play("hit");
          this.hitStop = Math.max(this.hitStop, 0.04);
        }
        p.fx.stop();
        p.dead = true;
      }
      if (p.x < 4 || p.x > SW2 - 4 || p.y < 0 || p.y > BH3 || p.life <= 0) {
        p.fx.stop();
        p.dead = true;
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }
  enemyShot(enemy, hero) {
    const sx = enemy.x + enemy.facing * 10, sy = enemy.y - 20;
    const tx = hero.x, ty = hero.y - 22;
    const dx = tx - sx, dy = ty - sy;
    const len2 = Math.hypot(dx, dy) || 1;
    const speed = enemy.type.shot?.speed ?? 85;
    const inst = createFx(FX.plasmaShot, {
      x: sx,
      y: sy,
      flip: dx < 0,
      seed: enemy.seed + 7,
      palette: enemy.type.shot?.palette,
      size: enemy.type.shot?.r ?? 5
    });
    this.projectiles.push({
      x: sx,
      y: sy,
      vx: dx / len2 * speed,
      vy: dy / len2 * speed,
      r: enemy.type.shot?.r ?? 5,
      dmg: enemy.dmg,
      team: "enemy",
      fx: inst,
      life: 2.6,
      color: enemy.type.shot?.color ?? "#ff7a6a"
    });
  }
  hitEnemies(pred, opts = {}) {
    let hits = 0;
    for (const e of this.enemies) {
      if (!e.alive || !pred(e)) continue;
      e.hurt(this, opts.dmg, { knock: opts.knock ?? 22, status: opts.status, statusTime: opts.statusTime, crit: opts.crit });
      hits++;
    }
    return hits;
  }
  number(x, y, text, opts = {}) {
    this.numbers.push({
      x: x + (Math.random() * 8 - 4),
      y,
      text,
      t: 0,
      life: opts.crit ? 1.05 : 0.8,
      color: hex(opts.color ?? "#fff0d0"),
      crit: !!opts.crit,
      small: !!opts.small,
      vy: opts.crit ? -34 : -24
    });
  }
  updateNumbers(dt) {
    for (const n of this.numbers) {
      n.t += dt;
      n.y += n.vy * dt;
      n.vy += 26 * dt;
    }
    this.numbers = this.numbers.filter((n) => n.t < n.life);
  }
  dust(x, y, count = 2, dir = 0, color = "#b8a890") {
    for (let i = 0; i < count; i++) {
      this.motes.push({
        x,
        y,
        vx: (Math.random() * 2 - 1) * 20 + dir * 12,
        vy: -Math.random() * 16 - 4,
        t: 0,
        life: 0.3 + Math.random() * 0.35,
        color: hex(color)
      });
    }
  }
  updateMotes(dt) {
    for (const m of this.motes) {
      m.t += dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vy += 18 * dt;
    }
    this.motes = this.motes.filter((m) => m.t < m.life);
  }
  telegraph(x, y, r, dur, color) {
    this.telegraphs.push({ x, y, r, t: 0, dur, color: hex(color) });
  }
  updateTelegraphs(dt) {
    for (const t of this.telegraphs) t.t += dt;
    this.telegraphs = this.telegraphs.filter((t) => t.t < t.dur + 0.15);
  }
  shake(amp, dur) {
    if (amp >= this.shakeState.amp * (1 - this.shakeState.t / Math.max(0.01, this.shakeState.dur))) {
      this.shakeState = { amp, t: 0, dur };
    }
  }
  updateShake(dt) {
    this.shakeState.t += dt;
    if (this.shakeState.t > this.shakeState.dur) this.shakeState.amp = 0;
  }
  flashScreen(color, a) {
    if (a >= this.flashState.a) this.flashState = { color: hex(color), a, max: a };
  }
  updateFlash(dt) {
    if (this.flashState.a > 0) this.flashState.a = Math.max(0, this.flashState.a - dt * 2.2);
  }
  after(sec, fn) {
    this.timers.push({ t: sec, fn });
  }
  banner(kicker, title, sub2, kind) {
    this.ui.banner(kicker, title, sub2, kind);
  }
  toggleMute() {
    this.audio.unlock();
    this.audio.setMuted(!this.audio.muted);
  }
  /** Test/debug: run a skill by id without the keyboard. */
  cast(id) {
    return castSkill(this, id);
  }
  comboAdd() {
    this.combo.count++;
    this.combo.timer = 2.4;
    if (this.combo.count > 0 && this.combo.count % 10 === 0) this.ui.comboMilestone(this.combo.count);
  }
  dropLoot(x, y, typeId) {
    if (typeId === "boss") return;
    const r = Math.random();
    let loot = null, acc = 0;
    for (const l of LOOT) {
      acc += l.p;
      if (r < acc) {
        loot = l;
        break;
      }
    }
    if (!loot) return;
    const fx = createFx(loot.mod, { x, y, seed: 200 + Math.floor(Math.random() * 400) });
    this.pickups.push({ x, y, kind: loot.kind, mod: loot.mod, label: loot.label, color: loot.color, fx, age: 0, dead: false });
  }
  updatePickups(dt) {
    const hero = this.hero;
    for (const p of this.pickups) {
      p.age += dt;
      p.fx.options.x = p.x;
      p.fx.options.y = p.y - Math.sin(p.age * 3) * 1.5;
      p.fx.update(dt);
      const dx = hero.x - p.x, dy = hero.y - 8 - p.y;
      const d = Math.hypot(dx, dy);
      const magnet = p.kind === "xp" ? 62 : 34;
      if (d < magnet && hero.alive) {
        const sp = p.kind === "xp" ? 150 : 90;
        p.x += dx / (d || 1) * sp * dt;
        p.y += dy / (d || 1) * sp * 0.7 * dt;
      }
      if (d < 10 && hero.alive) {
        this.collect(p);
        p.dead = true;
      }
      if (p.age > 26) p.dead = true;
    }
    this.pickups = this.pickups.filter((p) => !p.dead);
  }
  collect(p) {
    this.addFx(FX.collectBurst, { x: p.x, y: p.y, light: 0.9, seed: 90 + Math.floor(Math.random() * 20) });
    this.audio.play("pickup");
    if (p.kind === "heart") this.hero.heal(this, 18, { big: true });
    else if (p.kind === "potion") {
      const n = Math.min(24, this.hero.maxMp - this.hero.mp);
      this.hero.mp += n;
      this.number(p.x, p.y - 20, "+" + Math.round(n) + " MP", { color: "#8fd0ff", small: true });
    } else this.hero.gainXp(this, 8);
    this.ui.toast(p.label);
  }
  // ------------------------------------------------------------------ render
  render() {
    const f = this.frame;
    const sh = this.shakeState;
    let sx = 0, sy = 0;
    if (sh.amp > 0 && sh.t < sh.dur) {
      const k = 1 - sh.t / sh.dur;
      sx = Math.sin(sh.t * 93) * sh.amp * k;
      sy = Math.cos(sh.t * 71) * sh.amp * 0.55 * k;
    }
    f.ox = -Math.round(sx);
    f.oy = -Math.round(sy);
    clearFrame(f);
    if (this.mapFx) {
      this.mapFx.options.x = 0;
      this.mapFx.options.y = 0;
      this.mapFx.draw(f);
    }
    let p = painterFor(f);
    for (const t of this.telegraphs) this.drawTelegraph(p, t);
    for (const ef of this.effects) if (ef.layer === "ground") {
      ef.inst.draw(f);
      p = painterFor(f);
    }
    const actors = [...this.pickups.filter((q) => !q.dead).map((q) => ({ y: q.y, kind: "pickup", ref: q }))];
    for (const e of this.enemies) if (!e.dead) actors.push({ y: e.y, kind: "enemy", ref: e });
    actors.push({ y: this.hero.y, kind: "hero", ref: this.hero });
    actors.sort((a, b) => a.y - b.y || (a.kind === "hero" ? 1 : -1));
    for (const a of actors) {
      if (a.kind === "pickup") {
        a.ref.fx.draw(f);
        p = painterFor(f);
      } else if (a.kind === "enemy") {
        a.ref.draw(this, painterFor(f));
      } else {
        this.hero.draw(this, painterFor(f));
      }
    }
    for (const ef of this.effects) if (ef.layer !== "ground") {
      ef.inst.draw(f);
      p = painterFor(f);
    }
    for (const pr of this.projectiles) {
      pr.fx.draw(f);
      p = painterFor(f);
    }
    for (const m of this.motes) {
      const a = 1 - m.t / m.life;
      p.dot(m.x, m.y, m.color, a * 0.9);
    }
    for (const n of this.numbers) {
      const a = 1 - n.t / n.life;
      p.text(n.text, n.x, n.y, n.color, {
        font: n.crit ? "big" : "mini",
        scale: n.crit ? 1 : 1,
        align: "center",
        outline: C4.ink,
        a: Math.min(1, a * 1.6)
      });
    }
    f.ox = 0;
    f.oy = 0;
    const uf = this.uiFrame;
    uf.ox = 0;
    uf.oy = 0;
    clearFrame(uf);
    let up = painterFor(uf);
    this.ui.draw(this, up, uf);
    mergeUI(f, uf);
    p = painterFor(f);
    if (this.flashState.a > 0) {
      p.rect(0, 0, SW2, SH2, this.flashState.color, Math.min(1, this.flashState.a / Math.max(1e-3, this.flashState.max)));
    }
    if (this.fade > 1e-3) {
      p.rect(0, 0, SW2, SH2, hex("#050409"), this.fade);
      this.fade = Math.max(0, this.fade - 0.035);
    }
    composite(f, this.img.data, C4.bg);
    this.ctx.putImageData(this.img, 0, 0);
  }
  drawTelegraph(p, t) {
    const left = t.dur - t.t;
    const k = clamp(t.t / t.dur, 0, 1);
    const pulse2 = 0.35 + 0.3 * Math.sin(t.t * (left < 0.35 ? 34 : 12));
    for (let i = 0; i < 22; i++) {
      const a = i / 22 * TAU;
      p.dot(t.x + Math.cos(a) * t.r, t.y + Math.sin(a) * t.r * 0.3, t.color, Math.max(0.15, pulse2));
    }
    const q = t.r * (1 - k * 0.25);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      p.dot(t.x + ax * q, t.y + ay * q * 0.3, t.color, 0.8);
      p.dot(t.x + ax * (q - 2), t.y + ay * (q - 2) * 0.3, t.color, 0.5);
    }
    p.dot(t.x, t.y, C4.warnLit, left < 0.3 ? 0.9 : 0.5);
  }
};
function mergeUI(f, u) {
  const n = f.w * f.h, C5 = f.color, L4 = f.light, UC = u.color, UL = u.light;
  for (let i = 0; i < n; i++) {
    const c = UC[i], a = c >>> 24;
    if (a === 255) {
      C5[i] = c;
      L4[i] = UL[i];
    } else if (a) {
      const d = C5[i], k = a / 255;
      const ch = (s) => (c >>> s & 255) * k + (d >>> s & 255) * (1 - k) | 0;
      C5[i] = 255 << 24 | ch(16) << 16 | ch(8) << 8 | ch(0);
      const dl = L4[i], ul = UL[i];
      if (ul) {
        const lr = Math.min(255, (dl & 255) + (ul & 255));
        const lg = Math.min(255, (dl >>> 8 & 255) + (ul >>> 8 & 255));
        const lb = Math.min(255, (dl >>> 16 & 255) + (ul >>> 16 & 255));
        L4[i] = 255 << 24 | lb << 16 | lg << 8 | lr;
      }
    } else if (UL[i]) {
      const dl = L4[i], ul = UL[i];
      const lr = Math.min(255, (dl & 255) + (ul & 255));
      const lg = Math.min(255, (dl >>> 8 & 255) + (ul >>> 8 & 255));
      const lb = Math.min(255, (dl >>> 16 & 255) + (ul >>> 16 & 255));
      L4[i] = 255 << 24 | lb << 16 | lg << 8 | lr;
    }
  }
}
function boot() {
  const canvas2 = document.querySelector("#game");
  const game2 = new Game(canvas2);
  window.__EMBER__ = game2;
  Hero.prepare();
  return game2;
}

// src/main.js
var game = boot();
var canvas = document.querySelector("#game");
var MOVE = /* @__PURE__ */ new Set(["w", "a", "s", "d"]);
var SKILL = { j: "j", k: "k", l: "l", u: "u", i: "i", o: "o" };
function unlock() {
  game.audio.unlock();
}
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) {
    game.keys.add(key);
    e.preventDefault();
    return;
  }
  if (key === "escape") {
    e.preventDefault();
    unlock();
    if (game.state === "playing" || game.state === "paused") {
      game.togglePause();
      game.audio.play("ui");
    }
    return;
  }
  if (key === "enter") {
    e.preventDefault();
    unlock();
    if (game.state === "title" || game.state === "gameover" || game.state === "victory") game.startRun();
    else if (game.state === "paused") game.togglePause();
    return;
  }
  if (key === "r" && (game.state === "paused" || game.state === "gameover" || game.state === "victory")) {
    e.preventDefault();
    unlock();
    game.startRun();
    return;
  }
  if (key === "m") {
    e.preventDefault();
    unlock();
    game.toggleMute();
    game.audio.play("ui");
    return;
  }
  if (SKILL[key] && !e.repeat) {
    e.preventDefault();
    unlock();
    if (game.state === "title") return;
    castSkill(game, SKILL[key]);
  }
});
window.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  if (MOVE.has(key)) game.keys.delete(key);
});
window.addEventListener("blur", () => game.keys.clear());
canvas.addEventListener("click", () => {
  unlock();
  if (game.state === "title" || game.state === "gameover" || game.state === "victory") game.startRun();
  else if (game.state === "paused") game.togglePause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.state === "playing") game.togglePause();
});
game.cast = (id) => castSkill(game, id);
game.begin = () => game.startRun();
window.__EMBER__ = game;
var last = performance.now();
function frame2(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
  last = now;
  game.ui.update(dt);
  game.tick(dt);
  game.render();
  requestAnimationFrame(frame2);
}
requestAnimationFrame(frame2);
game.render();
