import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

/**
 * Message catalog integrity (spec §5).
 *
 * A key present in English but missing in Arabic renders as the
 * raw key name in that locale — or throws in a server
 * component, which takes the page down. Both failures are
 * invisible until someone opens the site in Arabic, so they are
 * asserted here instead.
 */

/** Flatten a nested catalog into dotted key paths. */
function keyPaths(
  value: unknown,
  prefix = "",
): Set<string> {
  const paths = new Set<string>();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    paths.add(prefix);
    return paths;
  }
  for (const [key, child] of Object.entries(value)) {
    for (const path of keyPaths(child, prefix ? `${prefix}.${key}` : key)) {
      paths.add(path);
    }
  }
  return paths;
}

const enKeys = keyPaths(en);
const arKeys = keyPaths(ar);

describe("message catalogs", () => {
  it("define the same namespaces", () => {
    expect([...enKeys].sort()).toEqual([...arKeys].sort());
  });

  it("have no English-only keys", () => {
    const missingInArabic = [...enKeys].filter((key) => !arKeys.has(key));
    expect(
      missingInArabic,
      `missing from ar.json: ${missingInArabic.join(", ")}`,
    ).toEqual([]);
  });

  it("have no Arabic-only keys", () => {
    const extraInArabic = [...arKeys].filter((key) => !enKeys.has(key));
    expect(
      extraInArabic,
      `not in en.json: ${extraInArabic.join(", ")}`,
    ).toEqual([]);
  });

  it("leave no empty strings", () => {
    const walk = (
      value: unknown,
      path: string,
    ): Array<string> => {
      if (typeof value === "string") {
        return value.trim().length === 0 ? [path] : [];
      }
      if (typeof value !== "object" || value === null) return [];
      return Object.entries(value).flatMap(([key, child]) =>
        walk(child, path ? `${path}.${key}` : key),
      );
    };
    expect([...walk(en, ""), ...walk(ar, "")]).toEqual([]);
  });

  /**
   * Keys the code reads that are easy to get wrong because
   * they look like they belong to another namespace.
   */
  const REQUIRED: string[] = [
    "common.inventory",
    "common.confidence",
    "common.sources",
    "common.demoBadge",
    "artifact.inventoryWarning",
    "artifact.inscription",
    "artifact.askAbout",
    "translate.failureTitle",
    "translate.disclaimer",
    "translate.demoProviderNotice",
    "assistant.disclaimer",
    "assistant.demoNotice",
    "errors.boundaries.title",
    "nav.skipToContent",
    "footer.noFakeAi",
    "footer.demoNotice",
    "learn.quiz",
    "museums.floorPlan",
    "museums.tourStops",
    "discover.resultCount",
    "admin.roleRequired",
  ];

  it.each(REQUIRED)("defines %s in both locales", (key) => {
    expect(enKeys.has(key), `en.json missing ${key}`).toBe(true);
    expect(arKeys.has(key), `ar.json missing ${key}`).toBe(true);
  });

  it("translates the honesty statements rather than copying them", () => {
    // These are the product's core promises. If they appear
    // verbatim in both files, the Arabic site is showing
    // English — which passes every structural check above.
    expect(ar.footer.noFakeAi).not.toBe(en.footer.noFakeAi);
    expect(ar.errors.boundaries.title).not.toBe(en.errors.boundaries.title);
    expect(ar.translate.disclaimer).not.toBe(en.translate.disclaimer);
    expect(ar.assistant.disclaimer).not.toBe(en.assistant.disclaimer);
  });

  it("contains Arabic script in the Arabic catalog", () => {
    const hasArabic = /\p{Script=Arabic}/u;
    const walk = (value: unknown): string[] => {
      if (typeof value === "string") return [value];
      if (typeof value !== "object" || value === null) return [];
      return Object.values(value).flatMap(walk);
    };
    const strings = walk(ar);
    const withArabic = strings.filter((s) => hasArabic.test(s));
    // Arabic is a full translation, not a stub: nearly every
    // string should contain Arabic script.
    expect(withArabic.length / strings.length).toBeGreaterThan(0.9);
  });
});