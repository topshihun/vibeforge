// Build script — concatenate JS files, copy static files as-is.
const { write, file } = Bun;
const { mkdirSync, rmSync, readFileSync } = require("fs");
const path = require("path");

// Clean dist
rmSync("dist", { recursive: true, force: true });

// ===== JS: concatenate in order =====
const jsFiles = [
  "snake/js/constants.js",
  "snake/js/game.js",
  "snake/js/renderer.js",
  "snake/js/input.js",
  "snake/js/app.js",
];
mkdirSync("dist/snake/js", { recursive: true });
let fullJs = "";
for (const f of jsFiles) {
  fullJs += readFileSync(f, "utf-8") + "\n";
}
write("dist/snake/js/app.js", fullJs);

// ===== snake/index.html: replace 5 script tags with 1 =====
let snakeHtml = readFileSync("snake/index.html", "utf-8");
snakeHtml = snakeHtml.replace(
  /<!-- JS 模块.*?-->[\s\S]*?<\/body>/,
  '<!-- JS (combined in build) -->\n<script src="js/app.js"></script>\n</body>'
);
// Remove <base> tag since all paths become relative to /snake/ (Cloudflare)
// and the server.ts / snake/ URL always works with proper trailing slash
write("dist/snake/index.html", snakeHtml);

// ===== Copy other static files =====
const staticFiles = [
  "index.html",
  "components/base.css.html",
  "components/footer.html",
  "components/header.html",
  "components/projects.json",
  "snake/style.css",
  "_redirects",
];

for (const f of staticFiles) {
  mkdirSync(path.dirname(`dist/${f}`), { recursive: true });
  write(`dist/${f}`, file(f));
}

console.log("✅ Build complete — dist/ is ready for static hosting");
console.log("   JS: concatenated (5 files → 1)");
console.log("   HTML/CSS/JSON: copied as-is");