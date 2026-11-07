import { createFrame, clearFrame, painterFor, clamp, hex, TAU } from "../../../../pixelfx/src/core/index.js";
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

  drawMapTiles(frame) {
    for (let i = 0; i < this.mapFxTiles.length; i++) {
      const fx = this.mapFxTiles[i], tile = this.mapTileFrames[i];
      clearFrame(tile);
      tile.ox = 0;
      tile.oy = 0;
      fx.options.x = 0;
      fx.options.y = 0;
      fx.draw(tile);
      const worldX = i * 320;
      const screenX = Math.round(worldX - frame.ox);
      const screenY = -frame.oy;
      const x0 = Math.max(0, -screenX), x1 = Math.min(tile.w, frame.w - screenX);
      const y0 = Math.max(0, -screenY), y1 = Math.min(tile.h, frame.h - screenY);
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
    }
  },

  drawScaledFx(fx, x, y, scale = 1) {
    if (scale >= 0.999) {
      fx.options.x = x;
      fx.options.y = y;
      fx.draw(this.frame);
      return;
    }
    const [w, h] = fx.meta.size ?? [160, 140];
    const [anchorX, anchorY] = fx.meta.origin ?? [w / 2, h * 0.75];
    const ox = Math.ceil(Math.max(anchorX, w - anchorX)) + 8;
    const oy = Math.ceil(Math.max(anchorY, h - anchorY)) + 8;
    const cache = this.fxScratchFrames ??= new Map();
    const key = `${ox}:${oy}`;
    if (!cache.has(key)) cache.set(key, createFrame(ox * 2, oy * 2));
    const scratch = cache.get(key);
    clearFrame(scratch);
    const oldX = fx.options.x, oldY = fx.options.y;
    fx.options.x = ox;
    fx.options.y = oy;
    fx.draw(scratch);
    fx.options.x = oldX;
    fx.options.y = oldY;
    const dst = this.frame, offsetX = dst.ox, offsetY = dst.oy;
    const p = painterFor(dst);
    const x0 = Math.max(0, Math.floor(x - ox * scale - offsetX));
    const y0 = Math.max(0, Math.floor(y - oy * scale - offsetY));
    const x1 = Math.min(dst.w, Math.ceil(x + ox * scale - offsetX));
    const y1 = Math.min(dst.h, Math.ceil(y + oy * scale - offsetY));
    for (let dy = y0; dy < y1; dy++) {
      const sy = Math.floor((dy + offsetY + 0.5 - y) / scale + oy);
      if (sy < 0 || sy >= scratch.h) continue;
      for (let dx = x0; dx < x1; dx++) {
        const sx = Math.floor((dx + offsetX + 0.5 - x) / scale + ox);
        if (sx < 0 || sx >= scratch.w) continue;
        const si = sy * scratch.w + sx;
        const di = dy * dst.w + dx;
        const color = scratch.color[si], alpha = color >>> 24;
        if (alpha === 255) dst.color[di] = color;
        else if (alpha) p.blendPx(dx + offsetX, dy + offsetY, color, alpha / 255);
        const light = scratch.light[si];
        if (light) p.add(dx + offsetX, dy + offsetY, light);
      }
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
