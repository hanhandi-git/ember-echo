// A tiny static server for the demo. No dependencies, no caching, no surprises.
//   node server.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 8123);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(join(ROOT, normalize(path)));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    });
    res.end(await readFile(file));
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(String(err));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`余烬回响 · Ember Echo  →  http://127.0.0.1:${PORT}/`);
});
