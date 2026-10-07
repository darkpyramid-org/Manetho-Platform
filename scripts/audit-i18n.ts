import { readFileSync } from "node:fs";

/**
 * i18n catalogue audit.
 *
 * Checks the things the existing parity test cannot see, because
 * JSON.parse silently resolves a duplicate key to its last value
 * and a structurally valid catalogue can still be wrong.
 *
 * What it looks for:
 *
 *  1. Duplicate keys in the raw JSON text. JSON.parse throws these
 *     away, so a key defined twice looks fine to every other tool
 *     while one of the two strings is unreachable.
 *  2. Key parity between locales, recursively.
 *  3. Untranslated values: an Arabic entry byte-identical to its
 *     English counterpart. Some are legitimate (brand names,
 *     "AI", "PWA"); the rest are English leaking into the RTL UI.
 *  4. ICU placeholder drift: a message using {count} in one locale
 *     and {n} or nothing in the other renders the literal brace.
 *  5. Empty, whitespace-only and non-string values.
 *  6. Duplicate Arabic values across different keys, which is
 *     usually a copy-paste error rather than a real translation.
 *  7. Unescaped ampersands and raw angle brackets.
 *
 * Run with: npx tsx scripts/audit-i18n.ts
 */

const EN = "messages/en.json";
const AR = "messages/ar.json";

const problems: string[] = [];
const notes: string[] = [];

function fail(area: string, message: string) {
  problems.push(`${area}: ${message}`);
}

/**
 * Strip a leading BOM before parsing.
 *
 * These files carried a UTF-8 BOM, written by a PowerShell
 * `Set-Content -Encoding UTF8` on Windows PowerShell 5.1. A BOM is
 * not valid at the start of a JSON document per RFC 8259, and
 * JSON.parse rejects it. next-intl tolerated it, which is exactly
 * why it survived unnoticed.
 */
function readJson(path: string): { text: string; hadBom: boolean } {
  const raw = readFileSync(path, "utf8");
  const hadBom = raw.charCodeAt(0) === 0xfeff;
  return { text: hadBom ? raw.slice(1) : raw, hadBom };
}

const enFile = readJson(EN);
const arFile = readJson(AR);
const enRaw = enFile.text;
const arRaw = arFile.text;

if (enFile.hadBom) {
  fail("encoding", `${EN} starts with a UTF-8 BOM, which JSON.parse rejects`);
}
if (arFile.hadBom) {
  fail("encoding", `${AR} starts with a UTF-8 BOM, which JSON.parse rejects`);
}

// ── 1. Duplicate keys, read from the raw text ──────────────────
// A proper scan, because JSON.parse collapses duplicates silently
// and that collapse is the entire bug we are looking for.
function duplicateKeys(text: string, label: string): string[] {
  const found: string[] = [];
  const stack: Array<{ path: string[]; keys: Set<string> }> = [];
  let i = 0;
  let path: string[] = [];

  const isStringStart = text[i] === '"';
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      // Read the string literal.
      let j = i + 1;
      let value = "";
      while (j < text.length) {
        if (text[j] === "\\") {
          value += text[j + 1];
          j += 2;
          continue;
        }
        if (text[j] === '"') break;
        value += text[j];
        j += 1;
      }
      i = j + 1;

      // A string followed by ':' is a key.
      let k = i;
      while (k < text.length && /\s/.test(text[k])) k += 1;
      if (text[k] === ":") {
        const frame = stack[stack.length - 1];
        if (frame) {
          const fullPath = [...frame.path, value].join(".");
          if (frame.keys.has(value)) {
            found.push(fullPath);
          }
          frame.keys.add(value);
          path.push(value);
        }
        i = k + 1;
        continue;
      }
      void isStringStart;
      continue;
    }
    if (ch === "{") {
      stack.push({ path, keys: new Set<string>() });
      i += 1;
      continue;
    }
    if (ch === "}") {
      stack.pop();
      if (path.length > 0) path = path.slice(0, -1);
      i += 1;
      continue;
    }
    i += 1;
  }

  if (found.length) {
    fail("duplicate keys", `${label} defines ${found.length} key(s) twice: ${found.join(", ")}`);
  }
  return found;
}

const enDupes = duplicateKeys(enRaw, EN);
const arDupes = duplicateKeys(arRaw, AR);

// ── 2. Key parity, recursively ──────────────────────────────────
const en = JSON.parse(enRaw) as unknown;
const ar = JSON.parse(arRaw) as unknown;

type Leaf = { path: string; value: string };
const leaves: Leaf[] = [];

function collect(node: unknown, prefix: string, out: Leaf[]) {
  if (node === null || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      collect(value, full, out);
    } else {
      out.push({ path: full, value: value as string });
    }
  }
}

const enLeaves: Leaf[] = [];
const arLeaves: Leaf[] = [];
collect(en, "", enLeaves);
collect(ar, "", arLeaves);

const enMap = new Map(enLeaves.map((l) => [l.path, l.value]));
const arMap = new Map(arLeaves.map((l) => [l.path, l.value]));

const missingInAr = enLeaves.filter((l) => !arMap.has(l.path)).map((l) => l.path);
const missingInEn = arLeaves.filter((l) => !enMap.has(l.path)).map((l) => l.path);

if (missingInAr.length) {
  fail("key parity", `${missingInAr.length} key(s) in en.json have no ar.json entry: ${missingInAr.join(", ")}`);
}
if (missingInEn.length) {
  fail("key parity", `${missingInEn.length} key(s) in ar.json have no en.json entry: ${missingInEn.join(", ")}`);
}

// ── 3. Value sanity ─────────────────────────────────────────────
for (const [label, leaves] of [["en", enLeaves], ["ar", arLeaves]] as const) {
  for (const leaf of leaves) {
    if (typeof leaf.value !== "string") {
      fail("value type", `${label} ${leaf.path} is ${typeof leaf.value}, not a string`);
      continue;
    }
    if (leaf.value.trim() === "") {
      fail("empty value", `${label} ${leaf.path} is empty or whitespace only`);
    }
    if (leaf.value !== leaf.value.trim()) {
      fail("whitespace", `${label} ${leaf.path} has leading or trailing whitespace`);
    }
  }
}

// ── 4. ICU placeholder parity ───────────────────────────────────
// ICU messages can be simple ("{count} signs") or full plural
// expressions ("{count, plural, =0 {No results} one {# result}
// other {# results}}"). A naive brace scan reports every plural as
// a stray brace, which buried the two real findings under four
// false positives on the first run.
function placeholders(value: string): string[] {
  return [
    ...value.matchAll(
      /\{\s*([a-zA-Z0-9_]+)\s*(?:,\s*(?:plural|selectordinal|select)\b|[,}])/g,
    ),
  ]
    .map((m) => m[1])
    .sort();
}

/** Plural/select category keywords actually used in a message. */
function icuCategories(value: string): string[] {
  const found = new Set<string>();
  const match = /\{\s*[a-zA-Z0-9_]+\s*,\s*(plural|selectordinal|select)\s*,/.exec(
    value,
  );
  if (!match) return [];
  const body = value.slice(match.index + match[0].length);
  for (const kw of body.matchAll(
    /(?:^|[\s{}])(=?\d+|zero|one|two|few|many|other)\s*\{/g,
  )) {
    found.add(kw[1]);
  }
  return [...found].sort();
}

/**
 * Every brace must belong to a placeholder or a plural/select
 * expression. A regex cannot decide this: ICU expressions nest
 * ("{count, plural, =0 {No results} one {# result}}"), and any
 * non-greedy pattern strips up to the first closing brace and
 * leaves the rest looking stray. This walks the string and tracks
 * nesting depth instead.
 */
function strayBraces(value: string): string[] {
  const stray: string[] = [];
  let depth = 0;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    // ICU apostrophe escape: a literal brace, not an expression.
    if (ch === "'" && value[i + 1] === "{") {
      i += 1;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      if (depth === 0) stray.push("}");
      else depth -= 1;
    }
  }
  // An unclosed expression leaves depth above zero.
  if (depth > 0) stray.push(`${depth} unclosed brace`);
  return stray;
}

let placeholderDrift = 0;
for (const leaf of enLeaves) {
  const arValue = arMap.get(leaf.path);
  if (arValue === undefined) continue;
  const enPh = placeholders(leaf.value);
  const arPh = placeholders(arValue);
  if (enPh.join("|") !== arPh.join("|")) {
    placeholderDrift += 1;
    fail(
      "placeholders",
      `${leaf.path}: en uses {${enPh.join("}, {")}} but ar uses {${arPh.join("}, {")}}`,
    );
  }
}

// A brace that is not a valid placeholder, on either side.
for (const [label, leaves] of [["en", enLeaves], ["ar", arLeaves]] as const) {
  for (const leaf of leaves) {
    const stray = strayBraces(leaf.value);
    if (stray.length) {
      fail(
        "stray brace",
        `${label} ${leaf.path} contains a brace that is not a placeholder: ${JSON.stringify(leaf.value)}`,
      );
    }
  }
}

// Plural parity. English needs one/other (+ =0 where the count can
// legitimately be zero). Arabic needs zero, one, two, few, many and
// other -- six categories, because Arabic has a dual form and three
// distinct plurals. A message translated with English's category
// set renders the raw "{count}" or picks the wrong form.
const REQUIRED_CATEGORIES: Record<string, string[]> = {
  ar: ["zero", "one", "two", "few", "many", "other"],
  en: ["one", "other"],
};

let pluralDrift = 0;
for (const leaf of enLeaves) {
  const enValue = leaf.value;
  const arValue = arMap.get(leaf.path);
  if (arValue === undefined) continue;

  const enCats = icuCategories(enValue);
  const arCats = icuCategories(arValue);

  // One locale has a plural and the other does not: real drift.
  if (enCats.length > 0 && arCats.length === 0) {
    pluralDrift += 1;
    fail("plural", `${leaf.path}: en uses a plural expression, ar does not`);
    continue;
  }
  if (enCats.length === 0 && arCats.length > 0) {
    pluralDrift += 1;
    fail("plural", `${leaf.path}: ar uses a plural expression, en does not`);
    continue;
  }
  if (arCats.length === 0) continue;

  // "=0" is an exact-match form that takes precedence over the named
  // category, so it satisfies the zero case.
  const arHas = (name: string) =>
    arCats.includes(name) || (name === "zero" && arCats.includes("=0"));

  for (const required of REQUIRED_CATEGORIES.ar) {
    if (!arHas(required)) {
      pluralDrift += 1;
      fail(
        "plural",
        `${leaf.path}: Arabic plural is missing the "${required}" category (has: ${arCats.join(", ")})`,
      );
    }
  }
  for (const required of REQUIRED_CATEGORIES.en) {
    if (!enCats.includes(required)) {
      pluralDrift += 1;
      fail(
        "plural",
        `${leaf.path}: English plural is missing the "${required}" category (has: ${enCats.join(", ")})`,
      );
    }
  }
}

// ── 5. Untranslated Arabic ──────────────────────────────────────
// Values that are legitimately identical: numerals, brand names,
// and the Arabic locale sometimes borrows a proper noun.
const ALLOWED_UNTRANSLATED = new Set([
  "Manetho",
  "AI",
  "PWA",
  "RTL",
  "OCR",
  "GLYPH",
]);

// Each locale names languages in its own script: en says
// "English"/"Arabic", ar says "English"/"العربية". An endonym is
// not an untranslated string, so these keys are exempt rather than
// reported on every run.
const ENDONYM_KEYS = new Set(["common.english", "common.arabic"]);

let untranslated = 0;
for (const leaf of enLeaves) {
  const arValue = arMap.get(leaf.path);
  if (arValue === undefined) continue;
  if (
    arValue === leaf.value &&
    !ALLOWED_UNTRANSLATED.has(leaf.value.trim()) &&
    !ENDONYM_KEYS.has(leaf.path)
  ) {
    untranslated += 1;
    fail(
      "untranslated",
      `${leaf.path}: ar.json repeats the English "${leaf.value}"`,
    );
  }
}

// Arabic values containing no Arabic letter at all, where the
// English side does have real prose to translate.
let noArabicScript = 0;
for (const leaf of arLeaves) {
  if (
    !/[\u0600-\u06FF]/.test(leaf.value) &&
    !ALLOWED_UNTRANSLATED.has(leaf.value.trim()) &&
    !ENDONYM_KEYS.has(leaf.path)
  ) {
    const enValue = enMap.get(leaf.path);
    if (enValue && enValue !== leaf.value) {
      noArabicScript += 1;
      fail(
        "untranslated",
        `${leaf.path}: ar value "${leaf.value}" contains no Arabic characters`,
      );
    }
  }
}

// ── 6. Duplicate Arabic values ──────────────────────────────────
// The same string under two keys is normally a copy-paste error,
// but sometimes two semantically distinct roles genuinely share a
// sentence. Those are listed below with the reason, so the decision
// is recorded rather than repeated on every run. Anything not
// listed is reported.
const INTENTIONAL_DUPLICATES: Record<string, string> = {
  "common.tagline,home.eyebrow":
    "One tagline, used site-wide in the header and again as the hero eyebrow. Shared wording keeps the two from drifting apart.",
  "errors.boundaries.title,translate.failureTitle":
    "The same refusal reached from two directions: the translator panel and the route error boundary. It is the app's central promise not to invent a reading, so it is worded once.",
};

const arValueIndex = new Map<string, string[]>();
for (const leaf of arLeaves) {
  const list = arValueIndex.get(leaf.value) ?? [];
  list.push(leaf.path);
  arValueIndex.set(leaf.value, list);
}

let duplicateValues = 0;
for (const [value, paths] of arValueIndex) {
  // Short labels repeat legitimately across namespaces; only
  // substantial sentences are worth a human look.
  if (paths.length < 2 || value.length <= 24) continue;
  const key = [...paths].sort().join(",");
  const reason = INTENTIONAL_DUPLICATES[key];
  if (reason) {
    notes.push(`${key} — ${reason}`);
    continue;
  }
  duplicateValues += 1;
  fail(
    "duplicate arabic value",
    `"${value}" is used by ${paths.length} keys: ${paths.join(", ")}`,
  );
}

// ── 7. Escaping ─────────────────────────────────────────────────
for (const [label, leaves] of [["en", enLeaves], ["ar", arLeaves]] as const) {
  for (const leaf of leaves) {
    if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(leaf.value)) {
      fail("escaping", `${label} ${leaf.path} has a bare "&": ${JSON.stringify(leaf.value)}`);
    }
    if (/<[a-zA-Z/]/.test(leaf.value)) {
      fail("escaping", `${label} ${leaf.path} contains raw markup: ${JSON.stringify(leaf.value)}`);
    }
  }
}

// ── Report ──────────────────────────────────────────────────────
console.log(`\ni18n catalogue audit\n`);
console.log(`  en.json  ${enLeaves.length} messages, ${enDupes.length} duplicate keys`);
console.log(`  ar.json  ${arLeaves.length} messages, ${arDupes.length} duplicate keys`);
console.log(`\n  key parity          ${missingInAr.length === 0 && missingInEn.length === 0 ? "ok" : "BROKEN"}`);
console.log(`  placeholder drift   ${placeholderDrift}`);
console.log(`  plural category gap  ${pluralDrift}`);
console.log(`  untranslated ar     ${untranslated + noArabicScript}`);
console.log(`  duplicate ar values ${duplicateValues} (reviewed, not automatically wrong)`);
console.log(`  empty/whitespace    ${problems.filter((p) => p.startsWith("empty") || p.startsWith("whitespace")).length}`);

if (problems.length === 0) {
  console.log(`\nNo problems found.`);
  if (notes.length) {
    console.log(`\nReviewed and accepted (${notes.length}):`);
    for (const note of notes) console.log(`  ${note}`);
  }
  console.log();
} else {
  console.log(`\n${problems.length} problem(s):\n`);
  const byArea = new Map<string, string[]>();
  for (const problem of problems) {
    const area = problem.split(":")[0];
    byArea.set(area, [...(byArea.get(area) ?? []), problem]);
  }
  for (const [area, list] of byArea) {
    console.log(`  ${area} (${list.length})`);
    for (const item of list.slice(0, 40)) console.log(`    ${item}`);
    if (list.length > 40) console.log(`    ... and ${list.length - 40} more`);
  }
  console.log();
}

// Duplicate values across namespaces are reported for review, not
// failed: reusing one sentence in two contexts is a deliberate
// choice, and the audit cannot tell that from a copy-paste error.
// Both current cases are checked by hand and are intentional.