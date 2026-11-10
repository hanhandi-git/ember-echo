// Bake the two static pixelfx UI frames used by the HTML camp panel. Generating
// them at runtime cost ~110ms on the loading screen, so the build writes them
// once to assets/ui and installUiFrames only points CSS at the files.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createFrame, painterFor, composite } from "../../pixelfx/src/core/index.js";
import * as panel from "../../pixelfx/src/fx/ui/loadout-panel.js";
import { cutPlate, tone } from "../../pixelfx/src/fx/ui/_ember.js";
import { encodePNG } from "../../pixelfx/tools/lib/png.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "assets/ui");
mkdirSync(out, { recursive: true });

function rgba(frame) {
  const img = new Uint8ClampedArray(frame.w * frame.h * 4);
  composite(frame, img, null);
  return new Uint8Array(img.buffer);
}

// --frame-steel: the outer panel border, cropped exactly like the runtime path.
const source = createFrame(...panel.meta.size);
panel.draw(painterFor(source).place(...panel.meta.origin), 0, panel.meta.options);
const sourceBytes = rgba(source), cropW = 328, cropH = 224, crop = new Uint8Array(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) {
  const from = ((y + 14) * source.w + 12) * 4;
  crop.set(sourceBytes.subarray(from, from + cropW * 4), y * cropW * 4);
}
writeFileSync(join(out, "frame-steel.png"), encodePNG(cropW, cropH, crop));

// --frame-selected: the highlighted bag plate used by item cards.
const selected = createFrame(80, 80);
cutPlate(painterFor(selected), 0, 0, 80, 80, tone("bag"), true);
writeFileSync(join(out, "frame-selected.png"), encodePNG(80, 80, rgba(selected)));

console.log("ui frames ready:", join(out, "frame-steel.png"), join(out, "frame-selected.png"));
