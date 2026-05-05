import { serve } from "bun";
import { join, extname } from "path";

const port = 8080;
const rootDir = import.meta.dir;
const distDir = join(rootDir, "dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".txt":  "text/plain; charset=utf-8",
};

async function tryServe(baseDir: string, pathname: string): Promise<Bun.BunFile | null> {
  const relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const filePath = join(baseDir, relativePath);

  try {
    if (await Bun.file(filePath).exists()) return Bun.file(filePath);
    const indexPath = join(filePath, "index.html");
    if (await Bun.file(indexPath).exists()) return Bun.file(indexPath);
  } catch {}

  return null;
}

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname === "/") pathname = "/index.html";

    // Try dist/ first (built output), then root (sources)
    let file = await tryServe(distDir, pathname);
    if (!file) file = await tryServe(rootDir, pathname);
    if (!file) {
      return new Response(`404: ${pathname}`, { status: 404, headers: { "Content-Type": "text/plain" } });
    }

    const ext = extname(file.name ?? "");
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(file, { headers: { "Content-Type": mimeType } });
  },
});

console.log(`\n  VibeForge Dev Server\n`);
console.log(`  Open: http://localhost:${port}\n`);
console.log(`  Serving: root/ + dist/ (built projects)\n`);