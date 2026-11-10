/**
 * The walkable depth band: the screen rows a unit's feet may occupy. Side-on arenas use the legacy band;
 * belt-scroll maps export a wider `map.depth`, and authored positions are remapped into it.
 */
export const LEGACY_BAND = [134, 170];

const limit = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const bandOf = (g) => g?.walkBand ?? LEGACY_BAND;

/** Keep y inside the band, optionally inset from its far (top) and near (bottom) edges. */
export function clampDepth(g, y, top = 0, bottom = top) {
  const [y0, y1] = bandOf(g);
  return limit(y, Math.min(y0 + top, y1), Math.max(y1 - bottom, y0));
}

/** Map a row authored for the legacy band onto the current band, keeping its relative depth. */
export function mapDepth(g, y) {
  const [y0, y1] = bandOf(g), [a, b] = LEGACY_BAND;
  if (y0 === a && y1 === b) return y;
  return Math.round(y0 + limit((y - a) / (b - a), 0, 1) * (y1 - y0));
}

/**
 * Split a map into raster slots, one per 320 px tile of each layer. A layer that follows only part of the
 * camera travel needs fewer tiles; `live` layers are drawn by the host and take no slot. Maps without
 * layers keep the two full-scene tiles they always had.
 */
export function planMapSlots(layout, worldW = 480, tileW = 320) {
  const layers = layout?.layers;
  if (!Array.isArray(layers) || !layers.length) {
    return Array.from({ length: Math.ceil(worldW / tileW) }, (_, tileIndex) => ({
      layer: null, tileIndex, x: tileIndex * tileW, parallax: 1, static: false, front: false, opaque: true,
    }));
  }
  const slots = [];
  layers.forEach((layer, order) => {
    if (layer.live) return;
    const parallax = layer.parallax ?? 1;
    const span = tileW + Math.max(0, worldW - tileW) * parallax;
    for (let tileIndex = 0; tileIndex < Math.ceil(span / tileW); tileIndex++) {
      slots.push({
        layer: layer.id, tileIndex, x: tileIndex * tileW, parallax,
        static: !!layer.static, front: !!layer.front, fps: layer.fps, opaque: order === 0 && !layer.front,
      });
    }
  });
  return slots;
}
