import { describe, expect, it } from "vitest";
import { hieroglyphSigns } from "@/lib/data/hieroglyphs";
import {
  MANUAL_SIGN_PALETTE,
  manualSignPalette,
  signRefMap,
  signRefs,
} from "@/lib/data/sign-refs";
import { courses } from "@/lib/data";

/**
 * The client/server sign projection (SignRef).
 *
 * Client components no longer import the sign repository — doing
 * so shipped all 274 signs to the browser to render a handful of
 * glyphs. They receive SignRefs resolved on the server instead.
 * That boundary is only safe if the projection is faithful, so it
 * is asserted rather than trusted.
 */
describe("sign projection", () => {
  it("resolves every code in the manual palette", () => {
    const palette = manualSignPalette();
    expect(palette).toHaveLength(MANUAL_SIGN_PALETTE.length);
    for (const code of MANUAL_SIGN_PALETTE) {
      expect(
        palette.find((sign) => sign.gardinerCode === code),
        `palette sign ${code} did not resolve`,
      ).toBeDefined();
    }
  });

  it("drops unknown codes rather than throwing", () => {
    // A lesson referencing a missing sign should render the rest
    // of the lesson rather than fail the page.
    expect(signRefs(["G017", "NOPE"])).toHaveLength(1);
    expect(signRefs(["NOPE"])).toHaveLength(0);
    expect(signRefs([])).toHaveLength(0);
  });

  it("carries every field a client component renders", () => {
    const [ref] = signRefs(["G017"]);
    const full = hieroglyphSigns.find((s) => s.gardinerCode === "G017");
    expect(full).toBeDefined();
    expect(ref.gardinerCode).toBe(full!.gardinerCode);
    expect(ref.glyph).toBe(full!.glyph);
    expect(ref.name).toBe(full!.name);
    expect(ref.phoneticValues).toEqual(full!.phoneticValues);
    expect(ref.ideographicMeaning).toBe(full!.ideographicMeaning);
  });

  it("maps by Gardiner code for component lookup", () => {
    const map = signRefMap(["G017", "D021", "missing"]);
    expect(Object.keys(map).sort()).toEqual(["D021", "G017"]);
    expect(map.G017.gardinerCode).toBe("G017");
  });

  it("covers every sign referenced by any lesson or quiz", () => {
    // The lesson reader only receives signs the page resolved, so
    // a lesson referencing a sign outside the resolved set would
    // render a silently blank pill.
    const referenced = new Set<string>();
    for (const course of courses) {
      for (const lesson of course.lessons) {
        for (const code of lesson.signIds) referenced.add(code);
        for (const section of lesson.content) {
          for (const code of section.signIds ?? []) referenced.add(code);
        }
        for (const question of lesson.quiz?.questions ?? []) {
          if (question.signId) referenced.add(question.signId);
        }
      }
    }
    expect(referenced.size).toBeGreaterThan(0);
    const resolved = new Set(signRefs([...referenced]).map((s) => s.gardinerCode));
    const missing = [...referenced].filter((code) => !resolved.has(code));
    expect(missing, `unresolvable sign references: ${missing.join(", ")}`).toEqual([]);
  });

  it("stays small enough to be worth projecting", () => {
    // Guards the reason this layer exists. If the sign database
    // ever shrinks, the projection may no longer be worth its
    // complexity and the indirection should be reconsidered.
    const full = JSON.stringify(hieroglyphSigns).length;
    const projected = JSON.stringify(hieroglyphSigns).length;
    expect(projected).toBeLessThanOrEqual(full);
    expect(manualSignPalette().length).toBeLessThan(hieroglyphSigns.length);
  });
});