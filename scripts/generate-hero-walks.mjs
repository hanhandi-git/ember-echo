// Rebuild all eight native pixel walk cycles; no image service or runtime warping.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { composite } from "../../pixelfx/src/core/index.js";
import { encodePNG } from "../../pixelfx/tools/lib/png.mjs";
import { HERO_PIXEL_DATA } from "../src/hero-pixel-data.js";
import { decodeWalkSource, renderWalkCycleFrame } from "../src/art/hero-walk-cycle.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "assets/heroes/walk");
const config = JSON.parse(readFileSync(join(out, "rigs.json"), "utf8"));
const looks = JSON.parse(readFileSync(join(root, "assets/heroes/manifest.json"), "utf8"));
const [w, h] = config.canvas, columns = 4, rows = Math.ceil(config.frames / columns);
const manifest = {};
mkdirSync(join(root, "output/hero-previews/walk"), { recursive: true });
for (const [id, rig] of Object.entries(config.heroes)) {
  if (id === "hatsune-miku") rig.hairColor = "cyan";
  const source = decodeWalkSource(HERO_PIXEL_DATA[id], rig.baseFrame);
  const look = looks.find((item) => item.id === id);
  const atlas = new Uint8Array(w * columns * h * rows * 4), frames = [];
  for (let i = 0; i < config.frames; i++) {
    const { frame, feet } = renderWalkCycleFrame(source, rig, i / config.frames, config.canvas, config.origin);
    const rgba = new Uint8ClampedArray(w * h * 4);
    composite(frame, rgba);
    const x = i % columns * w, y = Math.floor(i / columns) * h;
    for (let row = 0; row < h; row++) atlas.set(rgba.subarray(row * w * 4, (row + 1) * w * 4), ((y + row) * w * columns + x) * 4);
    frames.push({ crop: [x, y, w, h], origin: config.origin, feet,
      pixelSha256: createHash("sha256").update(rgba).digest("hex") });
  }
  const path = `assets/heroes/walk/${id}.png`;
  writeFileSync(join(root, path), encodePNG(w * columns, h * rows, atlas));
  manifest[id] = { path, canvas: config.canvas, origin: config.origin,
    seconds: 4 * rig.stride / (look.density * look.weapon.speed), frames,
    sourceFrame: rig.baseFrame, sourcePixelSha256: createHash("sha256").update(Buffer.from(source.pixels.buffer)).digest("hex"),
    method: "Native pixel cutout rig with two-bone leg articulation, independent shoes, arm swing and cloth/hair follow-through." };
  process.stdout.write(`${id}: ${frames.length} newly rendered walk frames\n`);
}
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
