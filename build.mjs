// Bundle the demo into one self-contained game.js (no ../ imports at runtime).
//   node build.mjs           one-shot build
//   node build.mjs --watch   rebuild on source change
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PIXELFX = resolve(HERE, "../pixelfx");
const LOCAL = join(HERE, "node_modules/.bin/esbuild");
const ESBUILD = existsSync(LOCAL)
  ? LOCAL
  : existsSync(join(PIXELFX, "node_modules/.bin/esbuild"))
    ? join(PIXELFX, "node_modules/.bin/esbuild")
    : "esbuild";

function bundle(entry, outfile, minify, watch) {
  const args = [
    entry,
    "--bundle",
    "--format=esm",
    "--platform=browser",
    "--target=es2020",
    "--outfile=" + outfile,
    "--loader:.js=js",
    "--loader:.json=json",
    "--log-level=warning",
    ...(minify ? ["--minify"] : []),
    ...(watch ? ["--watch"] : []),
  ];
  execFileSync(ESBUILD, args, { stdio: "inherit", cwd: HERE });
}

const watch = process.argv.includes("--watch");
console.log("bundling with", ESBUILD);
execFileSync(process.execPath, [join(HERE, "scripts/build-ui-frames.mjs")], { stdio: "inherit", cwd: HERE });
bundle(join(HERE, "src/main.js"), join(HERE, "game.js"), !watch, watch);
if (!watch) bundle(join(HERE, "src/game/battle-map-worker.mjs"), join(HERE, "battle-map-worker.js"), true, false);
else {
  console.warn("watch mode: restart build once to refresh battle-map-worker.js after worker-only edits");
}
console.log("game.js + battle-map-worker.js ready — run `node server.mjs` and open http://127.0.0.1:8123/");
