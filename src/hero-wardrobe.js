// Optional palette overrides for the 64 editable swatches exposed by heroPalette().
export const HERO_PIXEL_EDITS = {};

export const HERO_COLOR_PRESETS = [
  { id: "original", name: { zh: "原色", en: "Original", ja: "元の色" }, hue: null },
  { id: "ember", name: { zh: "赤焰", en: "Ember", ja: "紅焔" }, hue: 12 },
  { id: "frost", name: { zh: "冰蓝", en: "Frost", ja: "氷青" }, hue: 205 },
  { id: "jade", name: { zh: "翠玉", en: "Jade", ja: "翠玉" }, hue: 155 },
  { id: "violet", name: { zh: "紫晶", en: "Violet", ja: "紫晶" }, hue: 275 },
];

export function normalizeAppearance(value) {
  const palette = {};
  for (const [key, color] of Object.entries(value?.palette ?? {})) {
    if (/^[\da-f]{2}$/i.test(key) && /^#[\da-f]{6}([\da-f]{2})?$/i.test(color)) palette[key.toLowerCase()] = color.toLowerCase();
  }
  return { preset: HERO_COLOR_PRESETS.some((item) => item.id === value?.preset) ? value.preset : "original", palette };
}

// Recolor chromatic materials while retaining their value ramp, skin, and neutral outlines.
export function presetColor(color, preset) {
  const hue = HERO_COLOR_PRESETS.find((item) => item.id === preset)?.hue;
  if (hue == null) return color;
  const channels = [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16) / 255);
  const [r, g, b] = channels, max = Math.max(...channels), min = Math.min(...channels), delta = max - min;
  if (delta < 0.08 || max < 0.12) return color;
  const h = delta === 0 ? 0 : ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 + 360) % 360;
  // Warm skin and gold remain legible; the explicit palette editor can recolor those too.
  if (h >= 15 && h <= 65) return color;
  const s = delta / max, c = max * s, x = c * (1 - Math.abs(hue / 60 % 2 - 1)), m = max - c;
  const rgb = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("") + color.slice(7);
}
