import { clearFrame, clamp, TAU } from "../../../../pixelfx/src/core/index.js";
import { SW, PALETTE as C } from "../constants.js";

export function mergeUI(f, u) {
  const n = f.w * f.h, C = f.color, L = f.light, UC = u.color, UL = u.light;
  for (let i = 0; i < n; i++) {
    const c = UC[i], a = c >>> 24;
    if (a === 255) {
      C[i] = c;
      L[i] = UL[i];
    } else if (a) {
      const d = C[i], k = a / 255;
      const ch = (s) => ((((c >>> s) & 255) * k + ((d >>> s) & 255) * (1 - k)) | 0);
      C[i] = (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
      const dl = L[i], ul = UL[i];
      if (ul) {
        const lr = Math.min(255, (dl & 255) + (ul & 255));
        const lg = Math.min(255, ((dl >>> 8) & 255) + ((ul >>> 8) & 255));
        const lb = Math.min(255, ((dl >>> 16) & 255) + ((ul >>> 16) & 255));
        L[i] = (255 << 24) | (lb << 16) | (lg << 8) | lr;
      }
    } else if (UL[i]) {
      const dl = L[i], ul = UL[i];
      const lr = Math.min(255, (dl & 255) + (ul & 255));
      const lg = Math.min(255, ((dl >>> 8) & 255) + ((ul >>> 8) & 255));
      const lb = Math.min(255, ((dl >>> 16) & 255) + ((ul >>> 16) & 255));
      L[i] = (255 << 24) | (lb << 16) | (lg << 8) | lr;
    }
  }
}

export const worldRenderSystem = {
  clampX(x, pad = 18) {
    return clamp(x, pad, this.worldW - pad);
  },

  updateCamera() {
    const target = clamp(this.hero.x - SW * 0.5, 0, this.worldW - SW);
    this.cameraX += (target - this.cameraX) * 0.12;
  },

  blitMapTile(frame, tile, worldX) {
    const screenX = Math.round((worldX - frame.ox) * frame.density);
    const screenY = Math.round(-frame.oy * frame.density);
    const x0 = Math.max(0, -screenX), x1 = Math.min(tile.w, frame.w - screenX);
    const y0 = Math.max(0, -screenY), y1 = Math.min(tile.h, frame.h - screenY);
    if (x1 <= x0 || y1 <= y0) return;
    for (let y = y0; y < y1; y++) {
      const dstRow = (screenY + y) * frame.w + screenX;
      const srcRow = y * tile.w;
      for (let x = x0; x < x1; x++) {
        const c = tile.color[srcRow + x];
        if (c) frame.color[dstRow + x] = c;
        const l = tile.light[srcRow + x];
        if (l) frame.light[dstRow + x] = l;
      }
    }
  },

  blitStaticMapTile(frame, tile, worldX) {
    const screenX = Math.round((worldX - frame.ox) * frame.density);
    const screenY = Math.round(-frame.oy * frame.density);
    const x0 = Math.max(0, -screenX), x1 = Math.min(tile.w, frame.w - screenX);
    const y0 = Math.max(0, -screenY), y1 = Math.min(tile.h, frame.h - screenY);
    const width = x1 - x0;
    if (width <= 0 || y1 <= y0) return;
    for (let y = y0; y < y1; y++) {
      const dst = (screenY + y) * frame.w + screenX + x0;
      const src = y * tile.w + x0;
      frame.color.set(tile.color.subarray(src, src + width), dst);
      frame.light.set(tile.light.subarray(src, src + width), dst);
    }
  },

  drawMapTiles(frame) {
    if (this.battleMapWorkers?.drawMap(frame)) return;
    for (let i = 0; i < this.mapFxTiles.length; i++) {
      const fx = this.mapFxTiles[i], tile = this.mapTileFrames[i];
      if (fx.staticLayer) {
        this.blitStaticMapTile(frame, fx.staticLayer, i * 320);
        continue;
      }
      clearFrame(tile);
      tile.ox = 0;
      tile.oy = 0;
      fx.options.x = 0;
      fx.options.y = 0;
      fx.draw(tile);
      this.blitMapTile(frame, tile, i * 320);
    }
  },

  drawScaledFx(fx, x, y, scale = 1, layer) {
    // Draw geometry directly at the output resolution. A low-resolution scratch image used to
    // discard eyes, thin blades and spark trails before the final canvas could display them.
    fx.options.x = x;
    fx.options.y = y;
    const previous = fx.options.renderScale;
    fx.options.renderScale = scale;
    try { fx.draw(this.frame, layer); }
    finally {
      if (previous === undefined) delete fx.options.renderScale;
      else fx.options.renderScale = previous;
    }
  },

  drawTelegraph(p, t) {
    const left = t.dur - t.t;
    const k = clamp(t.t / t.dur, 0, 1);
    const pulse = 0.35 + 0.3 * Math.sin(t.t * (left < 0.35 ? 34 : 12));
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU;
      p.dot(t.x + Math.cos(a) * t.r, t.y + Math.sin(a) * t.r * 0.3, t.color, Math.max(0.15, pulse));
    }
    const q = t.r * (1 - k * 0.25);
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      p.dot(t.x + ax * q, t.y + ay * q * 0.3, t.color, 0.8);
      p.dot(t.x + ax * (q - 2), t.y + ay * (q - 2) * 0.3, t.color, 0.5);
    }
    p.dot(t.x, t.y, C.warnLit, left < 0.3 ? 0.9 : 0.5);
  },
};
