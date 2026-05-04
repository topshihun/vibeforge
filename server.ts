import { serve } from "bun";
import { join, extname } from "path";

const port = 8080;
const publicDir = import.meta.dir;

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

serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname === "/") pathname = "/index.html";

    const relativePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    const filePath = join(publicDir, relativePath);

    let finalPath = filePath;
    try {
      const exists = await Bun.file(filePath).exists();
      if (!exists) {
        const indexPath = join(filePath, "index.html");
        if (await Bun.file(indexPath).exists()) {
          finalPath = indexPath;
        } else {
          return new Response(`404: ${pathname}`, { status: 404, headers: { "Content-Type": "text/plain" } });
        }
      }
    } catch {
      return new Response("500", { status: 500 });
    }

    const ext = extname(finalPath);
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(Bun.file(finalPath), {
      headers: { "Content-Type": mimeType },
    });
  },
});

console.log(`\n  VibeForge Dev Server\n`);
console.log(`  Open: http://localhost:${port}\n`);
console.log(`  Press Ctrl+C to stop\n`);