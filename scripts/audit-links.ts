/**
 * Link audit.
 *
 * Finds every internal href the UI can produce and checks that
 * each one resolves to a real route. A dead link in a statically
 * generated site is invisible until someone clicks it.
 *
 * Run with: npx tsx scripts/audit-links.ts
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory?.()) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

const files = [
  ...walk(path.join(ROOT, "app")),
  ...walk(path.join(ROOT, "components")),
  ...walk(path.join(ROOT, "lib")),
];

/** Every page route the app serves, as concrete paths. */
const routes = new Set<string>();
for (const file of files.filter((f) => f.includes(`${path.sep}app${path.sep}`))) {
  const rel = path
    .relative(path.join(ROOT, "app"), file)
    .replace(/\\/g, "/")
    .replace(/\/page\.tsx$/, "")
    .replace(/\.(ts|tsx)$/, "");

  // [locale] becomes both concrete locales; a route group such
  // as (marketing) contributes nothing to the URL.
  const withoutLocale = rel.replace(/^\[locale\]\/?/, "");
  const segments = withoutLocale
    .split("/")
    .filter((segment) => segment && !segment.startsWith("("));

  const isIndex = !withoutLocale.replace(/\/$/, "");
  if (isIndex) {
    routes.add("/");
    routes.add("/ar");
    continue;
  }
  // Dynamic segments accept any value, so register a pattern.
  routes.add("/" + segments.join("/"));
  routes.add("/ar/" + segments.join("/"));
}

/** Link targets found in the source. */
const targets = new Map<string, Set<string>>();

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");

  const patterns = [
    /<Link[^>]*href=\{?["'`]([^"'`]+)["'`]/g, // JSX Link
    /href:\s*["'`](\/[^"'`]+)["'`]/g, // object literal
    /redirect\(\s*["'`](\/[^"'`]+)/g, // navigation
    /router\.push\(\s*["'`](\/[^"'`]+)/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const target = match[1];
      if (!target.startsWith("/")) continue;
      if (!targets.has(target)) targets.set(target, new Set());
      targets.get(target)!.add(rel);
    }
  }
}

/** Does a concrete path match a registered route pattern? */
function resolves(pathname: string): boolean {
  const clean = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (routes.has(clean)) return true;

  const candidateSegments = clean.split("/").filter(Boolean);
  for (const route of routes) {
    const routeSegments = route.split("/").filter(Boolean);
    if (routeSegments.length !== candidateSegments.length) continue;
    const matches = routeSegments.every(
      (segment, index) =>
        segment.startsWith("[") ||
        segment === candidateSegments[index],
    );
    if (matches) return true;
  }
  return false;
}

console.log(`\nAuditing ${targets.size} link targets against ${routes.size} routes\n`);

const broken: string[] = [];
for (const [target, sources] of [...targets.entries()].sort()) {
  if (resolves(target)) continue;
  broken.push(`${target}   ← ${[...sources].join(", ")}`);
}

if (broken.length === 0) {
  console.log("No broken internal links.");
} else {
  console.log("BROKEN:");
  for (const line of broken) console.log(`  ${line}`);
}

// Routes that exist but nothing links to.
const linked = new Set<string>();
for (const target of targets.keys()) {
  const clean = target.split("?")[0].replace(/\/+$/, "") || "/";
  linked.add(clean);
  linked.add(clean.replace(/^\/ar/, "") || "/");
}

const orphans = [...routes].filter((route) => {
  if (route.includes("[")) return false; // dynamic, linked by pattern
  return !linked.has(route) && !linked.has(route.replace(/^\/ar/, ""));
});

console.log("\nRoutes nothing links to (informational):");
if (orphans.length === 0) {
  console.log("  none");
} else {
  for (const route of orphans.sort()) console.log(`  ${route}`);
}

console.log();