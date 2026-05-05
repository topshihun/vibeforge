// Build script — auto-discovers subprojects from projects.json.
// Simple projects: concatenates JS files from <script src="...">, copies CSS.
// Built projects (package.json with "build" script): runs bun install + bun run build, copies dist/.

const { write, file, $ } = Bun;
const { mkdirSync, rmSync, readFileSync, existsSync, cpSync } = require("fs");
const path = require("path");

// ===== Helpers =====
function hasBuildScript(projectDir) {
  const pkgPath = path.join(projectDir, "package.json");
  if (!existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return typeof pkg.scripts?.build === "string";
  } catch { return false; }
}

// ===== Clean dist =====
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

// ===== Read project list from projects.json =====
const projectsJson = JSON.parse(readFileSync("components/projects.json", "utf-8"));
const projectIds = projectsJson.projects.map(p => p.id);

// Collect built projects for _redirects generation
const builtProjects = [];

// ===== Process each subproject =====
for (const pid of projectIds) {
  const projectDir = pid;
  if (!existsSync(projectDir)) {
    console.warn(`  ⚠  Skipping "${pid}" — directory not found`);
    continue;
  }

  const isBuilt = hasBuildScript(projectDir);

  if (isBuilt) {
    // ---- Built project (React/TS etc.) ----
    builtProjects.push(pid);
    console.log(`  📦 ${pid} — installing & building...`);
    await $`cd ${projectDir} && bun install --frozen-lockfile`.quiet();
    await $`cd ${projectDir} && bun run build`.quiet();

    const srcDist = path.join(projectDir, "dist");
    if (existsSync(srcDist)) {
      cpSync(srcDist, path.join("dist", projectDir), { recursive: true });
    } else {
      console.warn(`  ⚠  ${pid}: no dist/ after build`);
    }
    continue;
  }

  // ---- Simple project (vanilla JS) ----
  const htmlPath = path.join(projectDir, "index.html");
  if (!existsSync(htmlPath)) {
    console.warn(`  ⚠  Skipping "${pid}" — no index.html`);
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
    let combinedJs = "";
    for (const src of scriptSrcs) {
      const jsPath = path.join(projectDir, src);
      if (existsSync(jsPath)) {
        combinedJs += readFileSync(jsPath, "utf-8") + "\n";
      } else {
        console.warn(`  ⚠  Missing: ${jsPath}`);
      }
    }

    const jsOutDir = path.join("dist", projectDir, "js");
    mkdirSync(jsOutDir, { recursive: true });
    write(path.join(jsOutDir, "app.js"), combinedJs);

    html = html.replace(/<script\s+src="[^"]+"><\/script>\s*/g, "");
    html = html.replace(
      "</body>",
      '<!-- JS (combined) -->\n<script src="js/app.js"></script>\n</body>'
    );

    console.log(`  📦 ${pid} — ${scriptSrcs.length} JS files → 1 bundle`);
  }

  const htmlOutDir = path.join("dist", projectDir);
  mkdirSync(htmlOutDir, { recursive: true });
  write(path.join(htmlOutDir, "index.html"), html);

  const cssPath = path.join(projectDir, "style.css");
  if (existsSync(cssPath)) {
    write(path.join(htmlOutDir, "style.css"), file(cssPath));
  }
}

// ===== Generate _redirects =====
let redirects = "# Cloudflare Pages redirects\n\n";
for (const pid of projectIds) {
  redirects += `/${pid}    /${pid}/    301\n`;
}
if (builtProjects.length > 0) {
  redirects += "\n# SPA fallback for built projects\n";
  for (const pid of builtProjects) {
    redirects += `/${pid}/*    /${pid}/index.html    200\n`;
  }
}
write("dist/_redirects", redirects);

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
  // _redirects is already generated above
  if (f === "_redirects") continue;
  mkdirSync(path.dirname(`dist/${f}`), { recursive: true });
  write(`dist/${f}`, file(f));
}

console.log(`\n  ✅ Build complete — ${projectIds.length} subproject(s), dist/ ready`);