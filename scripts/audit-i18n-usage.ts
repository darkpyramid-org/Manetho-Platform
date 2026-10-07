import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Translation usage audit.
 *
 * The catalogue audit checks the files; this checks the code that
 * reads them. Three ways a key can be wrong without the catalogue
 * noticing:
 *
 *  1. A key used in a component but absent from the catalogue.
 *     next-intl falls back to rendering the key path itself, so
 *     this is visible as "errors.boundary.title" on screen rather
 *     than as an exception.
 *  2. A key that exists in both catalogues but nothing renders --
 *     dead weight that a translator will dutifully maintain.
 *  3. A component asking for one namespace while a key it needs
 *     lives in another, which is the usual cause of (1).
 *
 * Run with: npx tsx scripts/audit-i18n-usage.ts
 */

const ROOT = process.cwd();

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
    else if (/\.(tsx?|mjs)$/.test(full)) out.push(full);
  }
  return out;
}

function readJson(p: string): Record<string, unknown> {
  const raw = readFileSync(p, "utf8");
  return JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw) as Record<string, unknown>;
}

const en = readJson(path.join(ROOT, "messages", "en.json"));
const ar = readJson(path.join(ROOT, "messages", "ar.json"));

function flatten(node: unknown, prefix: string, out: Map<string, string>) {
  if (node === null || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") flatten(value, full, out);
    else out.set(full, value as string);
  }
}

const enMessages = new Map<string, string>();
const arMessages = new Map<string, string>();
flatten(en, "", enMessages);
flatten(ar, "", arMessages);

// ── Collect t("key") usage ──────────────────────────────────────
const files = [
  ...walk(path.join(ROOT, "app")),
  ...walk(path.join(ROOT, "components")),
  ...walk(path.join(ROOT, "lib")),
];

/**
 * Keys referenced through the translator.
 *
 * The identifier is matched as "anything ending in t", not a
 * literal `t(`. This codebase binds several translators per file
 * -- t, tc, ta, tm, te, tq -- and matching only `t(` reported 154
 * perfectly ordinary keys as unused on the first run.
 *
 * A literal, t("retry"), and a template with no interpolation,
 * t(`nav.scan`). A template containing ${...} is deliberately
 * skipped: its final key cannot be known without evaluating the
 * expression.
 */
/**
 * Translator identifiers in this codebase are t, tc, te and tn --
 * short names beginning with t. Matching "anything ending in t"
 * also matched get("q") and split("devourer"), reporting eight
 * nonexistent translation keys. Matching a bare t( under-reported
 * 154 real ones as unused. The name is therefore constrained to
 * t plus at most three letters, and the leading lookbehind keeps
 * method calls such as obj.tSomething() out.
 */
const TRANSLATOR = "(?<![.\\w$])t[a-zA-Z]{0,3}";
const LITERAL_KEY = new RegExp(
  `\\b${TRANSLATOR}\\s*\\(\\s*["']([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)*)["']`,
  "g",
);
const TEMPLATE_KEY = new RegExp(
  `\\b${TRANSLATOR}\\s*\\(\\s*\`([^\`$]*)\``,
  "g",
);

const references: Array<{ file: string; key: string; namespaces: string[] }> = [];

/**
 * Namespaces a file binds, from useTranslations("x") and
 * getTranslations({ namespace: "x" }).
 *
 * A file may bind several, and the earlier single-namespace model
 * reported the rest as missing. Collecting all of them still finds
 * the real defect: a key that resolves under none of the
 * namespaces its own file declared. That is exactly what
 * assistant.demoMode and translate.demoMode did -- the keys lived
 * in `common`, those files bound only their own namespace, and the
 * build logged MISSING_MESSAGE for both locales.
 */
const NS_PATTERN =
  /(?:useTranslations|getTranslations)\s*\(\s*(?:\{[^}]*namespace:\s*)?["']([a-zA-Z0-9_]+)["']/g;

for (const file of files) {
  const content = readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.includes("audit-i18n") || rel.includes("prune-messages")) continue;

  const namespaces = [
    ...new Set(
      [...content.matchAll(new RegExp(NS_PATTERN.source, NS_PATTERN.flags))]
        .map((m) => m[1])
        .filter((n): n is string => Boolean(n)),
    ),
  ];

  // Fresh regex objects per file. A module-level /g regex keeps its
  // lastIndex between files, so after the first match the same
  // pattern silently resumed from the previous file's offset and
  // found nothing.
  for (const pattern of [LITERAL_KEY, TEMPLATE_KEY]) {
    const scanner = new RegExp(pattern.source, pattern.flags);
    for (const match of content.matchAll(scanner)) {
      if (match[1]) {
        references.push({ file: rel, key: match[1], namespaces });
      }
    }
  }
}

// ── Check ───────────────────────────────────────────────────────
// Namespace binding is not tracked, because it cannot be tracked
// reliably from source: one file often binds several translators
// (t, tc, ta, tm), and any single-namespace model reports the rest
// as missing. A key counts as resolvable if it resolves anywhere
// in the catalogue, which is the question that matters -- next-intl
// falls back to printing the key path when it resolves nowhere.
const leafNames = new Set<string>();
for (const key of enMessages.keys()) {
  leafNames.add(key.slice(key.lastIndexOf(".") + 1));
}

const missing: string[] = [];
const seenMissing = new Set<string>();
const usedLeaves = new Set<string>();

for (const { key, file, namespaces } of references) {
  const leaf = key.slice(key.lastIndexOf(".") + 1);

  // Namespace-aware check first: this is what catches a key that
  // lives in a namespace its own file never bound.
  if (namespaces.length > 0 && !key.includes(".")) {
    const resolvable = namespaces.some((ns) => enMessages.has(`${ns}.${key}`));
    if (!resolvable) {
      const report =
        `${file}: "${key}" is not in any namespace this file binds ` +
        `(${namespaces.join(", ")}); next-intl will render the key path.`;
      if (!seenMissing.has(report)) {
        seenMissing.add(report);
        missing.push(report);
      }
      continue;
    }
  }

  if (enMessages.has(key) || leafNames.has(leaf)) {
    usedLeaves.add(leaf);
    continue;
  }
  const report = `${file}: t("${key}") resolves to no key in en.json`;
  if (!seenMissing.has(report)) {
    seenMissing.add(report);
    missing.push(report);
  }
}

/**
 * Dynamic keys.
 *
 * Four call sites build a key from a value -- t(`nav.${x}`) --
 * which a source scanner cannot resolve. They are enumerated here
 * with the values actually present in the code, so the audit
 * confirms they resolve instead of skipping them and then reporting
 * the resulting keys as dead.
 */
const DYNAMIC_KEYS: Record<string, string[]> = {
  "assistant mode": [
    "assistant.modeVisitor",
    "assistant.modeEducational",
    "assistant.modeResearch",
    "assistant.modeGuide",
  ],
  "app nav": [
    "app.nav.home",
    "app.nav.scan",
    "app.nav.tours",
    "app.nav.map",
    "app.nav.assistant",
  ],
  "course level": [
    "learn.levelBeginner",
    "learn.levelIntermediate",
    "learn.levelAdvanced",
  ],
  "admin nav": [
    "admin.nav.overview",
    "admin.nav.artifacts",
    "admin.nav.museums",
    "admin.nav.hieroglyphs",
    "admin.nav.lessons",
    "admin.nav.tours",
    "admin.nav.reviews",
  ],
  // Content status, read as t(x.status.toLowerCase()) by the four
  // admin content views. Every ContentStatus member is a key.
  "content status": [
    "admin.published",
    "admin.review",
    "admin.draft",
    "admin.archived",
  ],
  // A ternary inside the call: t(isDark ? "a" : "b").
  "theme toggle label": ["common.themeToLight", "common.themeToDark"],
};

for (const [source, keys] of Object.entries(DYNAMIC_KEYS)) {
  for (const key of keys) {
    for (const [label, catalogue] of [
      ["en", enMessages],
      ["ar", arMessages],
    ] as const) {
      if (!catalogue.has(key)) {
        missing.push(`${source}: dynamic key ${key} is missing from ${label}.json`);
      }
    }
    usedLeaves.add(key.slice(key.lastIndexOf(".") + 1));
  }
}

const unused = [...enMessages.keys()].filter(
  (key) => !usedLeaves.has(key.slice(key.lastIndexOf(".") + 1)),
);

console.log(`\ni18n usage audit\n`);
console.log(`  catalogue keys      ${enMessages.size}`);
console.log(`  t() call sites      ${references.length}`);
console.log(`  distinct keys used  ${usedLeaves.size}`);
console.log(`\n  missing from en     ${missing.length}`);
console.log(`  unused keys         ${unused.length}`);

if (missing.length) {
  console.log(`\nReferenced but not defined:`);
  for (const item of [...new Set(missing)].slice(0, 40)) console.log(`  ${item}`);
  if (new Set(missing).size > 40) {
    console.log(`  ... and ${new Set(missing).size - 40} more`);
  }
}

if (unused.length) {
  console.log(`\nDefined but never rendered:`);
  for (const key of unused.slice(0, 40)) console.log(`  ${key}`);
  if (unused.length > 40) console.log(`  ... and ${unused.length - 40} more`);
}

console.log();
if (missing.length) process.exitCode = 1;