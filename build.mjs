// Bundle the demo into one self-contained game.js (no ../ imports at runtime).
//   node build.mjs           one-shot build
//   node build.mjs --watch   rebuild on source change
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
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

const COMMON = [
  "--bundle",
  "--format=esm",
  "--platform=browser",
  "--target=es2020",
  "--loader:.js=js",
  "--loader:.json=json",
  "--log-level=warning",
];

function bundle(entry, outfile, minify, watch) {
  const args = [
    entry,
    ...COMMON,
    "--outfile=" + outfile,
    ...(minify ? ["--minify"] : []),
    ...(watch ? ["--watch"] : []),
  ];
  execFileSync(ESBUILD, args, { stdio: "inherit", cwd: HERE });
}

// The app entry code-splits: hero pixel payloads become hashed chunks fetched on demand.
function bundleApp(minify, watch) {
  const args = [
    join(HERE, "src/main.js"),
    ...COMMON,
    "--outdir=" + HERE,
    "--outbase=" + join(HERE, "src"),
    "--entry-names=game",
    "--chunk-names=chunks/[name]-[hash]",
    "--splitting",
    ...(minify ? ["--minify"] : []),
    ...(watch ? ["--watch"] : []),
  ];
  execFileSync(ESBUILD, args, { stdio: "inherit", cwd: HERE });
}

const watch = process.argv.includes("--watch");
const CHUNKS = join(HERE, "chunks");
console.log("bundling with", ESBUILD);
execFileSync(process.execPath, [join(HERE, "scripts/build-ui-frames.mjs")], { stdio: "inherit", cwd: HERE });
if (!watch) {
  // Hashed chunk names change every build; drop leftovers from previous runs.
  rmSync(CHUNKS, { recursive: true, force: true });
}
mkdirSync(CHUNKS, { recursive: true });
bundleApp(!watch, watch);
if (!watch) bundle(join(HERE, "src/game/battle-map-worker.mjs"), join(HERE, "battle-map-worker.js"), true, false);
else {
  console.warn("watch mode: restart build once to refresh battle-map-worker.js after worker-only edits");
}
console.log("game.js + battle-map-worker.js ready — run `node server.mjs` and open http://127.0.0.1:8123/");
