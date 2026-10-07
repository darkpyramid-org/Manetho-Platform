import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Restore specific keys from the last committed catalogue.
 *
 * Pruning is only as good as the scanner deciding what is unused,
 * and a source scanner cannot see a key computed from a value:
 * t(status.toLowerCase()) or t(cond ? "a" : "b"). The first prune
 * removed six such keys and the build then logged 164
 * MISSING_MESSAGE lines. This puts them back from git without
 * reverting the 120 genuinely dead ones.
 *
 * Usage: npx tsx scripts/restore-keys.ts ns.key [ns.key ...]
 */

const ROOT = process.cwd();
const wanted = process.argv.slice(2);

if (wanted.length === 0) {
  console.error("Pass at least one dotted key, e.g. admin.published");
  process.exit(1);
}

function fromGit(file: string): Record<string, unknown> {
  const text = execFileSync("git", ["show", `HEAD:${file}`], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text) as Record<
    string,
    unknown
  >;
}

function readCurrent(file: string): Record<string, unknown> {
  const raw = readFileSync(path.join(ROOT, file), "utf8");
  return JSON.parse(
    raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw,
  ) as Record<string, unknown>;
}

function get(source: Record<string, unknown>, dotted: string): unknown {
  let node: unknown = source;
  for (const part of dotted.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function set(
  target: Record<string, unknown>,
  dotted: string,
  value: unknown,
): void {
  const parts = dotted.split(".");
  let node = target;
  for (const part of parts.slice(0, -1)) {
    if (node[part] === null || typeof node[part] !== "object") {
      node[part] = {};
    }
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

const missingInBaseline: string[] = [];
const restored: string[] = [];

for (const file of ["messages/en.json", "messages/ar.json"]) {
  const baseline = fromGit(file);
  const current = readCurrent(file);

  for (const key of wanted) {
    if (get(current, key) !== undefined) continue;
    const value = get(baseline, key);
    if (value === undefined) {
      missingInBaseline.push(`${file}:${key}`);
      continue;
    }
    set(current, key, value);
    restored.push(`${file}:${key}`);
  }

  writeFileSync(
    path.join(ROOT, file),
    `${JSON.stringify(current, null, 2)}\n`,
    "utf8",
  );
}

if (missingInBaseline.length) {
  console.error(
    `\nNot in the committed catalogue either, so not restored automatically:\n  ${missingInBaseline.join("\n  ")}\n`,
  );
  console.error("Add these by hand before claiming the catalogue is clean.");
  process.exit(1);
}

console.log(`\nRestored ${restored.length} value(s):`);
for (const item of restored) console.log(`  ${item}`);
console.log();