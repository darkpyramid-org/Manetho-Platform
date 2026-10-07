import { hieroglyphSigns } from "../lib/data/hieroglyphs/index";

/**
 * Which fields of the sign database cost the most on the wire.
 *
 * Discovery ships the whole dataset so filtering is instant. That
 * is a deliberate trade, but "the whole dataset" can still be
 * reduced if some fields are never read on the client. This
 * measures per-field weight so the decision is made on numbers
 * rather than on a guess.
 *
 * Run with: npx tsx scripts/audit-dataset-weight.ts
 */

const signs = hieroglyphSigns;
const kb = (value: unknown) =>
  Math.round((JSON.stringify(value).length / 1024) * 10) / 10;

const fields = [
  "id",
  "gardinerCode",
  "unicode",
  "glyph",
  "name",
  "description",
  "category",
  "phoneticValues",
  "ideographicMeaning",
  "determinativeMeaning",
  "signType",
  "mdc",
  "variants",
  "era",
  "sources",
] as const;

console.log(`\nSign database: ${signs.length} signs\n`);
console.log("Field weight as shipped (JSON, per full dataset)\n");

const weights = fields
  .map((field) => ({
    field,
    kb: kb(signs.map((sign) => sign[field])),
  }))
  .sort((a, b) => b.kb - a.kb);

for (const { field, kb: weight } of weights) {
  const bar = "#".repeat(Math.round(weight));
  console.log(`  ${field.padEnd(20)} ${String(weight).padStart(6)} KB  ${bar}`);
}

const total = kb(signs);
const needed = new Set([
  "id",
  "gardinerCode",
  "unicode",
  "glyph",
  "name",
  "description",
  "category",
  "phoneticValues",
  "ideographicMeaning",
  "signType",
  "era",
]);

const trimmed = signs.map((sign) =>
  Object.fromEntries(
    Object.entries(sign).filter(([key]) => needed.has(key)),
  ),
);

console.log(`\nTotal as shipped       ${String(total).padStart(6)} KB`);
console.log(
  `Search fields only     ${String(kb(trimmed)).padStart(6)} KB  (saves ${Math.round((total - kb(trimmed)) * 10) / 10} KB)`,
);
console.log();