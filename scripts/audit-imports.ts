/**
 * Dead-file audit.
 *
 * Finds source files that nothing imports. Run with:
 *   npx tsx scripts/audit-imports.ts
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "types", "scripts", "tests"];
const EXTENSIONS = [".ts", ".tsx"];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (EXTENSIONS.some((ext) => full.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));

// Root-level TypeScript files (i18n.config.ts, middleware.ts,
// playwright.config.ts) are real modules that other files import.
// Leaving them out made every reference to them look unresolved.
for (const name of readdirSync(ROOT)) {
  const full = path.join(ROOT, name);
  if (statSync(full).isFile() && EXTENSIONS.some((ext) => name.endsWith(ext))) {
    files.push(full);
  }
}

const sources = new Map<string, string>();
for (const file of files) {
  sources.set(path.relative(ROOT, file).replace(/\\/g, "/"), readFileSync(file, "utf8"));
}

// Route groups like (marketing) are folders, not modules.
const ENTRY_RE = [
  /\/page\.tsx$/,
  /\/layout\.tsx$/,
  /\/route\.ts$/,
  /\/not-found\.tsx$/,
  // Anchored with an optional leading slash because these may sit
  // at the repository root, where the relative path is
  // "next.config.ts" rather than "/next.config.ts" — which made
  // every root config look like dead code.
  /(^|\/)middleware\.ts$/,
  /(^|\/)i18n\.config\.ts$/,
  /(^|\/)next\.config\.ts$/,
  /(^|\/)playwright\.config\.ts$/,
  /(^|\/)vitest\.config\.ts$/,
  /(^|\/)vitest\.setup\.ts$/,
  /(^|\/)prisma\.config\.ts$/,
  /(^|\/)next-env\.d\.ts$/,
  /scripts\/seed\.ts$/,
  /scripts\/verify-db\.ts$/,
  // Test and audit files are run by a runner, never imported.
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /scripts\/audit-[^/]+\.ts$/,
];

function isEntry(rel: string): boolean {
  return ENTRY_RE.some((re) => re.test(rel));
}

/** Everything the file itself might import, resolved by path. */
function references(rel: string, content: string): string[] {
  const dir = path.dirname(rel);
  const found: string[] = [];

  const patterns = [
    // from "@/lib/utils"
    /from\s+["'](@\/[^"']+)["']/g,
    // from "./components/ui/button"
    /from\s+["'](\.[^"']+)["']/g,
    // import("@/lib/data") inline types
    /import\(["'](@\/[^"']+)["']\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const spec = match[1];
      const base = spec.startsWith("@/")
        ? spec.slice(2)
        : path.normalize(path.join(dir, spec)).replace(/\\/g, "/");
      found.push(base);
    }
  }

  // Bare specifiers are packages or JSON assets: next-intl,
  // lucide-react, react, and messages/en.json. They resolve
  // outside this scan, so they are counted as referenced rather
  // than reported as broken. Reporting them was pure noise.
  for (const match of content.matchAll(/from\s+["']([^"'./][^"']*)["']/g)) {
    found.push(`\u0000${match[1]}`);
  }
  return found;
}

const EXTERNAL_PREFIX = "\u0000";

/** Resolve a module path to a file on disk. */
function resolve(base: string): string | null {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ];
  for (const candidate of candidates) {
    if (sources.has(candidate)) return candidate;
  }
  return null;
}

const referenced = new Set<string>();
const unresolved: Array<{ from: string; spec: string }> = [];

for (const [rel, content] of sources) {
  for (const ref of references(rel, content)) {
    if (ref.startsWith(EXTERNAL_PREFIX)) continue;
    const target = resolve(ref);
    if (target) {
      referenced.add(target);
    } else {
      unresolved.push({ from: rel, spec: ref });
    }
  }
}

const dead = [...sources.keys()]
  .filter((rel) => !referenced.has(rel) && !isEntry(rel))
  .sort();

const orphanEntries = [...sources.keys()]
  .filter((rel) => !referenced.has(rel) && isEntry(rel))
  .sort();

// JSON assets and the file's own source-regex literals would both
// be reported as unresolved imports. Neither is a finding.
const SELF_REFERENCE = "scripts/audit-imports.ts";

console.log(`\nScanned ${sources.size} source files\n`);

const realUnresolved = unresolved.filter(
  (item) =>
    !item.spec.endsWith(".json") && item.from !== SELF_REFERENCE,
);

console.log("Unresolvable imports (possible typos):");
if (realUnresolved.length === 0) {
  console.log("  none");
} else {
  for (const item of realUnresolved) {
    console.log(`  ${item.from}  ->  ${item.spec}`);
  }
}

console.log("\nEntry points nothing imports (expected — Next discovers these):");
console.log(`  ${orphanEntries.length} files`);

console.log("\nDead modules (not an entry point, imported by nothing):");
if (dead.length === 0) {
  console.log("  none");
} else {
  for (const file of dead) {
    console.log(`  ${file}`);
  }
}

console.log();