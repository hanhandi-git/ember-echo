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

const args = [
  join(HERE, "src/main.js"),
  "--bundle",
  "--format=esm",
  "--platform=browser",
  "--target=es2020",
  "--outfile=" + join(HERE, "game.js"),
  "--loader:.js=js",
  "--log-level=warning",
  ...(process.argv.includes("--watch") ? ["--watch"] : []),
];

console.log("bundling with", ESBUILD);
execFileSync(ESBUILD, args, { stdio: "inherit", cwd: HERE });
console.log("game.js ready — run `node server.mjs` and open http://127.0.0.1:8123/");
