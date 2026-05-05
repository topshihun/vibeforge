// Build script — auto-discovers subprojects from projects.json,
// concatenates JS files, copies static files as-is.

const { write, file } = Bun;
const { mkdirSync, rmSync, readFileSync, readdirSync, existsSync } = require("fs");
const path = require("path");

// Clean dist
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

// ===== Read project list from projects.json =====
const projectsJson = JSON.parse(readFileSync("components/projects.json", "utf-8"));
const projectIds = projectsJson.projects.map(p => p.id);

// ===== Process each subproject =====
for (const pid of projectIds) {
  const projectDir = pid;
  if (!existsSync(projectDir)) {
    console.warn(`⚠  Skipping "${pid}" — directory not found`);
    continue;
  }

  const htmlPath = path.join(projectDir, "index.html");
  if (!existsSync(htmlPath)) {
    console.warn(`⚠  Skipping "${pid}" — no index.html`);
    continue;
  }

  let html = readFileSync(htmlPath, "utf-8");

  // Extract script src paths from HTML (preserves order)
  const scriptRegex = /<script\s+src="([^"]+)"><\/script>/g;
  const scriptSrcs = [];
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptSrcs.push(match[1]);
  }

  if (scriptSrcs.length > 0) {
    // Concatenate JS files in HTML order
    let combinedJs = "";
    for (const src of scriptSrcs) {
      const jsPath = path.join(projectDir, src);
      if (existsSync(jsPath)) {
        combinedJs += readFileSync(jsPath, "utf-8") + "\n";
      } else {
        console.warn(`⚠  Missing JS file: ${jsPath}`);
      }
    }

    // Write bundled JS
    const jsOutDir = path.join("dist", projectDir, "js");
    mkdirSync(jsOutDir, { recursive: true });
    write(path.join(jsOutDir, "app.js"), combinedJs);

    // Replace all <script src="..."></script> tags with one bundled tag
    html = html.replace(/<script\s+src="[^"]+"><\/script>\s*/g, "");
    html = html.replace(
      "</body>",
      '<!-- JS (combined in build) -->\n<script src="js/app.js"></script>\n</body>'
    );

    console.log(`   📦 ${pid}: ${scriptSrcs.length} JS files → 1 bundle`);
  }

  // Write processed HTML
  const htmlOutDir = path.join("dist", projectDir);
  mkdirSync(htmlOutDir, { recursive: true });
  write(path.join(htmlOutDir, "index.html"), html);

  // Copy style.css if present
  const cssPath = path.join(projectDir, "style.css");
  if (existsSync(cssPath)) {
    write(path.join(htmlOutDir, "style.css"), file(cssPath));
  }
}

// ===== Copy root static files =====
const staticFiles = [
  "index.html",
  "components/base.css.html",
  "components/footer.html",
  "components/header.html",
  "components/projects.json",
  "_redirects",
];

for (const f of staticFiles) {
  mkdirSync(path.dirname(`dist/${f}`), { recursive: true });
  write(`dist/${f}`, file(f));
}

console.log(`✅ Build complete — ${projectIds.length} subproject(s), dist/ ready for static hosting`);
