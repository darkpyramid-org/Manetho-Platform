import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Font payload audit.
 *
 * Reports which font files the stylesheet makes reachable and
 * which of those are preloaded onto the critical path. next/font
 * emits every declared face into the global stylesheet, so "we
 * only need it on /ar" is a claim about usage, not about bytes.
 * This measures the bytes.
 *
 * next/font emits a "-s.p.woff2" variant for each font configured
 * with preload: true; the unprefixed "-s.woff2" is the same file
 * fetched on demand. A file with the .p. form is therefore on the
 * critical path of every page load.
 *
 * Run with: npx tsx scripts/audit-fonts.ts
 */

const ROOT = process.cwd();
const CSS_DIR = path.join(ROOT, ".next", "static", "css");
const MEDIA_DIR = path.join(ROOT, ".next", "static", "media");

interface Face {
  family: string;
  weight: string;
  file: string;
  sizeKb: number;
  preloaded: boolean;
}

function kb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}

let cssFiles: string[];
try {
  cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
} catch {
  console.error("No built CSS found. Run `npm run build` first.");
  process.exit(1);
}
if (cssFiles.length === 0) {
  console.error("No built CSS found. Run `npm run build` first.");
  process.exit(1);
}

const faces: Face[] = [];

for (const cssFile of cssFiles) {
  const css = readFileSync(path.join(CSS_DIR, cssFile), "utf8");
  // Each @font-face block: family, weight, and the src url.
  for (const block of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = block[1];
    const family = /font-family:\s*([^;]+)/.exec(body)?.[1]?.replace(/['"]/g, "").trim();
    const weight = /font-weight:\s*([^;]+)/.exec(body)?.[1]?.trim() ?? "?";
    const file = /url\(([^)]+\.woff2)\)/.exec(body)?.[1]?.split("/").pop();
    if (!family || !file) continue;

    let sizeKb = 0;
    try {
      sizeKb = kb(statSync(path.join(MEDIA_DIR, file)).size);
    } catch {
      /* not emitted in this build */
    }

    faces.push({
      family: family.replace(" Fallback", ""),
      weight,
      file,
      sizeKb,
      preloaded: file.includes("-s.p.woff2"),
    });
  }
}

if (faces.length === 0) {
  console.error("No @font-face rules found in the built CSS.");
  process.exit(1);
}

// Keep the largest file per family+weight; the .p and non-.p forms
// are the same bytes and would otherwise be double counted.
const byFamily = new Map<string, Face>();
for (const face of faces) {
  const key = `${face.family} ${face.weight}`;
  const existing = byFamily.get(key);
  if (!existing || (face.preloaded && !existing.preloaded)) {
    byFamily.set(key, face);
  }
}

const unique = [...byFamily.values()];

console.log(`\nFonts reachable from the built stylesheet\n`);
for (const family of [...new Set(unique.map((f) => f.family))].sort()) {
  const group = unique.filter((f) => f.family === family);
  const total = group.reduce((s, f) => s + f.sizeKb, 0);
  const anyPreload = group.some((f) => f.preloaded);
  console.log(
    `${family.padEnd(30)} ${String(group.length).padStart(2)} face(s)  ${String(total.toFixed(1)).padStart(6)} KB  ${anyPreload ? "PRELOADED" : "on demand"}`,
  );
}

const total = unique.reduce((s, f) => s + f.sizeKb, 0);
const preloadVariants = unique.filter((f) => f.preloaded);
const preloadKb = preloadVariants.reduce((s, f) => s + f.sizeKb, 0);
const arabic = unique
  .filter((f) => /Plex|Naskh/.test(f.family))
  .reduce((s, f) => s + f.sizeKb, 0);
const hiero = unique
  .filter((f) => /Egyptian/.test(f.family))
  .reduce((s, f) => s + f.sizeKb, 0);

console.log(`\nTotals`);
console.log(`  declared              ${total.toFixed(1).padStart(6)} KB  (upper bound;`);
console.log(`                                a page fetches only the faces it renders)`);
console.log(
  `  preload variants      ${preloadKb.toFixed(1).padStart(6)} KB  (${preloadVariants.map((f) => f.family).join(", ") || "none"})`,
);
console.log(`  hieroglyphs           ${hiero.toFixed(1).padStart(6)} KB  ${hiero && !preloadVariants.some((f) => /Egyptian/.test(f.family)) ? "not preloaded" : "PRELOADED"}`);
console.log(`  Arabic faces          ${arabic.toFixed(1).padStart(6)} KB  never referenced on /en`);

// Cross-check the preload claim against the rendered HTML rather
// than trusting the filename convention alone.
let htmlPreloads = 0;
try {
  const html = readFileSync(
    path.join(ROOT, ".next", "server", "app", "en", "app.html"),
    "utf8",
  );
  htmlPreloads = (html.match(/rel="preload"[^>]*as="font"/g) ?? []).length;
} catch {
  /* route not prerendered */
}
console.log(
  `\n  as="font" preload links in en/app.html: ${htmlPreloads}`,
);
console.log(
  htmlPreloads === 0
    ? `  NOTE: no font preload links are rendered. The .p. files are the\n` +
        `  preloadable variants next/font emits, but nothing on the critical\n` +
        `  path references them, so treat "preloaded" above as a ceiling.`
    : "",
);
console.log();