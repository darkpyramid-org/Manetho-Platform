import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Client bundle audit.
 *
 * Answers one question per route: which chunks does the browser
 * actually download, and has server-only data leaked into them?
 * A "First Load JS" figure in a build log is route-local and easy
 * to misread; this reports the bytes a visitor receives.
 *
 * Chunk membership is read from app-build-manifest.json rather
 * than inferred from prerendered HTML, because most of this app's
 * marketing routes are server-rendered and have no .html on disk
 * to scrape.
 *
 * Run with: npx tsx scripts/audit-bundle.ts
 */

const ROOT = process.cwd();
const STATIC = path.join(ROOT, ".next", "static");

/**
 * URL -> app-build-manifest key.
 *
 * The manifest is keyed by source path, not by route, so the
 * route groups and the [locale] segment have to be spelled out.
 * A missing key is reported rather than silently skipped: a
 * silently empty audit is worse than no audit.
 */
const ROUTES: Array<[url: string, key: string]> = [
  ["/en", "/[locale]/(marketing)/page"],
  ["/ar", "/[locale]/(marketing)/page"],
  ["/en/translator", "/[locale]/(marketing)/translator/page"],
  ["/en/discover", "/[locale]/(marketing)/discover/page"],
  ["/en/assistant", "/[locale]/(marketing)/assistant/page"],
  ["/en/learn", "/[locale]/(marketing)/learn/page"],
  ["/en/learn/lesson", "/[locale]/(marketing)/learn/[lessonSlug]/page"],
  ["/en/museums", "/[locale]/(marketing)/museums/page"],
  ["/en/museum/one", "/[locale]/(marketing)/museum/[museumId]/page"],
  ["/en/artifact/one", "/[locale]/(marketing)/artifact/[artifactId]/page"],
  ["/en/app", "/[locale]/app/page"],
  ["/en/app/scan", "/[locale]/app/scan/page"],
  ["/en/app/map", "/[locale]/app/map/page"],
  ["/en/admin", "/[locale]/admin/page"],
  ["/en/admin/hieroglyphs", "/[locale]/admin/hieroglyphs/page"],
];

/**
 * Strings that exist only in the full curated dataset.
 *
 * These must be discriminators, not merely dataset-flavoured
 * words. An earlier version of this audit flagged
 * "biliteral" and "triliteral", which are values of signType and
 * therefore appear in any correctly projected payload — it
 * reported discover as leaking data when discover was in fact
 * the one route doing the projection properly. Each string below
 * appears only in the source dataset and not in a projection.
 */
const DATASET_SIGNALS = [
  "Egyptian vulture", // a sign name
  "Gardiner", // only in prose fields the client never renders
  "mdc", // the MdC field, stripped from projections
  "variants", // stripped from projections
];

/** Packages identified by a string unique to their bundle. */
const LIB_SIGNALS: Record<string, string> = {
  WebGLRenderer: "three.js",
  PerspectiveCamera: "three.js",
  "@radix-ui": "radix",
  lucide: "lucide-react",
  "next-intl": "next-intl",
};

const manifest = JSON.parse(
  readFileSync(path.join(ROOT, ".next", "app-build-manifest.json"), "utf8"),
) as { pages: Record<string, string[]> };

const BASE = path.join(ROOT, ".next");

/**
 * Resolve a manifest entry to a file.
 *
 * Manifest paths are relative to .next ("static/chunks/x.js"), not
 * to .next/static. Getting this wrong made every route report
 * 0 KB, and because the failure was swallowed the audit cheerfully
 * printed "clean" for every route — a false all-clear, which is
 * worse than a crash. An unreadable chunk is now a hard error.
 */
function readChunk(rel: string): string {
  try {
    return readFileSync(path.join(BASE, rel), "utf8");
  } catch {
    throw new Error(
      `Cannot read chunk ${rel} (looked in ${path.join(BASE, rel)}). ` +
        `Run a production build first, and fix this rather than reading the ` +
        `result as a clean bill of health.`,
    );
  }
}

interface Row {
  route: string;
  files: number;
  rawKb: number;
  dataset: string[];
  libs: string[];
  fontsPreloaded: number;
}

const rows: Row[] = [];

for (const [route, key] of ROUTES) {
  const chunks = manifest.pages[key];
  if (!chunks) {
    console.log(`${route}: no manifest entry for ${key}`);
    continue;
  }

  let rawKb = 0;
  let fontsPreloaded = 0;
  const dataset = new Set<string>();
  const libs = new Set<string>();

  for (const chunk of chunks) {
    if (chunk.endsWith(".css")) continue;
    const content = readChunk(chunk);
    rawKb += Buffer.byteLength(content) / 1024;
    for (const signal of DATASET_SIGNALS) {
      if (content.includes(signal)) dataset.add(signal);
    }
    for (const [needle, label] of Object.entries(LIB_SIGNALS)) {
      if (content.includes(needle)) libs.add(label);
    }
  }

  // Font preloads come from the prerendered HTML when it exists,
  // otherwise from the CSS, which is where next/font emits the
  // preloadable file list.
  const cssFiles = chunks.filter((c) => c.endsWith(".css"));
  for (const css of cssFiles) {
    const sheet = readChunk(css);
    for (const match of sheet.matchAll(/url\(([^)]+\.woff2)\)/g)) {
      const name = match[1].split("/").pop() ?? "";
      if (name.includes("-s.p.woff2")) fontsPreloaded += 1;
    }
  }

  rows.push({
    route,
    files: chunks.filter((c) => c.endsWith(".js")).length,
    rawKb: Math.round(rawKb),
    dataset: [...dataset],
    libs: [...libs],
    fontsPreloaded,
  });
}

rows.sort((a, b) => b.rawKb - a.rawKb);

console.log(`\nClient JS requested per route (uncompressed, excludes CSS)\n`);
let leaks = 0;
for (const row of rows) {
  const flag = row.dataset.length ? "DATASET SHIPPED" : "clean";
  if (row.dataset.length) leaks += 1;
  console.log(
    `${row.route.padEnd(22)} ${String(row.files).padStart(2)} chunks  ${String(row.rawKb).padStart(4)} KB  ${flag}`,
  );
  if (row.dataset.length) {
    console.log(`      leaked: ${row.dataset.join(", ")}`);
  }
  if (row.libs.length) console.log(`      libs: ${row.libs.join(", ")}`);
}

// A route measuring 0 KB is a broken measurement, not a fast
// page. Saying so is the whole point of an audit.
const bogus = rows.filter((r) => r.rawKb === 0);
if (bogus.length) {
  console.log(
    `\n${bogus.length} route(s) measured 0 KB. That is a measurement failure, not a result.`,
  );
  process.exitCode = 1;
}
console.log(`\n${rows.length - leaks}/${rows.length} routes free of server data`);
console.log();