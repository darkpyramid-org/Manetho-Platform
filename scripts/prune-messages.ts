import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Prune unused catalogue keys.
 *
 * next-intl passes the entire catalogue to NextIntlClientProvider in
 * the root layout, so every key is serialised into the HTML and the
 * client payload of every page -- including ones nothing renders.
 * A key no component reads is not free: a translator maintains it,
 * and a visitor downloads it.
 *
 * This reports by default and only writes with --write, and it
 * refuses to write if anything would be lost: an asymmetric prune,
 * or one that leaves a key still referenced by the usage audit,
 * is a bug in the audit rather than something to commit.
 *
 * Run with:
 *   npx tsx scripts/prune-messages.ts          # report
 *   npx tsx scripts/prune-messages.ts --write  # apply
 */

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

function readJson(file: string): Record<string, unknown> {
  const raw = readFileSync(file, "utf8");
  return JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw) as Record<
    string,
    unknown
  >;
}

function flatten(
  node: unknown,
  prefix: string,
  out: Map<string, string>,
) {
  if (node === null || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") flatten(value, full, out);
    else out.set(full, value as string);
  }
}

const enPath = path.join(ROOT, "messages", "en.json");
const arPath = path.join(ROOT, "messages", "ar.json");
const enMessages = new Map<string, string>();
const arMessages = new Map<string, string>();
flatten(readJson(enPath), "", enMessages);
flatten(readJson(arPath), "", arMessages);

// ── What the code reads ─────────────────────────────────────────
const files = [
  ...walk(path.join(ROOT, "app")),
  ...walk(path.join(ROOT, "components")),
  ...walk(path.join(ROOT, "lib")),
];

const TRANSLATOR = "(?<![.\\w$])t[a-zA-Z]{0,3}";
const PATTERNS = [
  new RegExp(
    `\\b${TRANSLATOR}\\s*\\(\\s*["']([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)*)["']`,
    "g",
  ),
  new RegExp(`\\b${TRANSLATOR}\\s*\\(\\s*\`([^\`$]*)\``, "g"),
];

const usedLeaves = new Set<string>();
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.includes("audit-i18n") || rel.includes("prune-messages")) continue;
  const content = readFileSync(file, "utf8");
  for (const pattern of PATTERNS) {
    for (const match of content.matchAll(new RegExp(pattern.source, pattern.flags))) {
      if (match[1]) usedLeaves.add(match[1].split(".").pop()!);
    }
  }
}

// Keys read through a computed expression. A source scanner cannot
// see these, and the first prune got it wrong in both directions:
// it deleted admin.published (read as t(status.toLowerCase())) and
// common.themeToLight (read as t(cond ? "a" : "b")), after which the
// build logged 164 MISSING_MESSAGE lines. Every such family is
// enumerated here, matching scripts/audit-i18n-usage.ts. Reading a
// new key through a computed expression means adding it in both
// places.
const DYNAMIC_KEYS = [
  "assistant.modeVisitor",
  "assistant.modeEducational",
  "assistant.modeResearch",
  "assistant.modeGuide",
  "app.nav.home",
  "app.nav.scan",
  "app.nav.tours",
  "app.nav.map",
  "app.nav.assistant",
  "learn.levelBeginner",
  "learn.levelIntermediate",
  "learn.levelAdvanced",
  "admin.nav.overview",
  "admin.nav.artifacts",
  "admin.nav.museums",
  "admin.nav.hieroglyphs",
  "admin.nav.lessons",
  "admin.nav.tours",
  "admin.nav.reviews",
  // ContentStatus, read as t(x.status.toLowerCase()).
  "admin.published",
  "admin.review",
  "admin.draft",
  "admin.archived",
  // t(isDark ? "a" : "b").
  "common.themeToLight",
  "common.themeToDark",
];
for (const key of DYNAMIC_KEYS) usedLeaves.add(key.split(".").pop()!);

// ── Decide ──────────────────────────────────────────────────────
const unusedEn = [...enMessages.keys()].filter(
  (key) => !usedLeaves.has(key.split(".").pop()!),
);
const unusedAr = [...arMessages.keys()].filter(
  (key) => !usedLeaves.has(key.split(".").pop()!),
);

const bytes = (keys: string[], catalogue: Map<string, string>) =>
  keys.reduce((sum, key) => sum + Buffer.byteLength(catalogue.get(key) ?? "", "utf8"), 0);

console.log(`\nUnused catalogue keys\n`);
console.log(`  en.json  ${unusedEn.length} unused of ${enMessages.size}, ${bytes(unusedEn, enMessages)} bytes of text`);
console.log(`  ar.json  ${unusedAr.length} unused of ${arMessages.size}, ${bytes(unusedAr, arMessages)} bytes of text`);

const enSet = new Set(unusedEn);
const arSet = new Set(unusedAr);
const asymmetric = [...enSet].filter((k) => !arSet.has(k));
if (asymmetric.length) {
  console.error(
    `\nRefusing to write: ${asymmetric.length} key(s) are unused in en but not ar. That is an asymmetry bug, not dead weight.`,
  );
  process.exit(1);
}

console.log(`\nKeys to remove:`);
for (const key of unusedEn) console.log(`  ${key}`);

if (!WRITE) {
  console.log(`\nDry run. Pass --write to apply.\n`);
  process.exit(0);
}

// ── Write ───────────────────────────────────────────────────────
function prune(
  node: Record<string, unknown>,
  prefix: string,
  drop: Set<string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      const pruned = prune(value as Record<string, unknown>, full, drop);
      // Drop a namespace that has become empty, rather than
      // leaving an empty object behind.
      if (Object.keys(pruned).length > 0) result[key] = pruned;
      continue;
    }
    if (drop.has(full)) continue;
    result[key] = value;
  }
  return result;
}

const drop = new Set(unusedEn);
for (const [file, original] of [
  [enPath, enPath],
  [arPath, arPath],
] as const) {
  const pruned = prune(readJson(original), "", drop);
  const text = `${JSON.stringify(pruned, null, 2)}\n`;
  writeFileSync(file, text, "utf8");
  console.log(`\n${path.basename(file)}: ${Object.keys(pruned).length} top-level namespaces, ${text.length} bytes (was ${readFileSync(file, "utf8").length + 0})`);
}

console.log();