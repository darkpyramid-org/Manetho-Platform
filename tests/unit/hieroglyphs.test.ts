import { describe, expect, it } from "vitest";
import {
  hieroglyphSigns,
  uniliterals,
  findSignByGardiner,
  findSignByUnicode,
  findSignByGlyph,
  searchSigns,
} from "@/lib/data/hieroglyphs";

/**
 * Integrity tests for the hieroglyph database (spec §20).
 *
 * The database is the product's foundation: if a Gardiner
 * code, Unicode value or cross-reference is wrong, every
 * reading built on it is wrong. These tests fail loudly.
 */

describe("hieroglyph database", () => {
  it("has more than 100 signs", () => {
    expect(hieroglyphSigns.length).toBeGreaterThan(100);
  });

  it("has unique Gardiner codes", () => {
    const codes = hieroglyphSigns.map((sign) => sign.gardinerCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has unique Unicode values", () => {
    const codes = hieroglyphSigns.map((sign) => sign.unicode);
    const duplicates = codes.filter(
      (code, index) => codes.indexOf(code) !== index,
    );
    expect(duplicates).toEqual([]);
  });

  it("formats Unicode values correctly", () => {
    for (const sign of hieroglyphSigns) {
      expect(sign.unicode).toMatch(/^U\+[0-9A-F]{4,6}$/i);
    }
  });

  it("formats Gardiner codes correctly", () => {
    // The unclassified group is "Aa" — capital A, lowercase a —
    // so the pattern must allow mixed case.
    for (const sign of hieroglyphSigns) {
      expect(sign.gardinerCode).toMatch(/^[A-Za-z]{1,3}\d{1,3}[A-Z]?$/);
    }
  });

  it("renders each glyph from its own declared code point", () => {
    // This is the invariant that stops a sign's shape and its
    // Unicode value from drifting apart: the Extended-A
    // variants (U+13460–U+143FA) must never leak in here.
    for (const sign of hieroglyphSigns) {
      const declared = Number.parseInt(sign.unicode.slice(2), 16);
      expect(sign.glyph.codePointAt(0)).toBe(declared);
    }
  });

  it("gives every sign a single codepoint glyph", () => {
    for (const sign of hieroglyphSigns) {
      // Egyptian hieroglyphs live in the U+13000–U+1342F block.
      const codePoint = sign.glyph.codePointAt(0);
      expect(codePoint).toBeDefined();
      expect(codePoint!).toBeGreaterThanOrEqual(0x13000);
      expect(codePoint!).toBeLessThanOrEqual(0x1342f);
    }
  });

  it("gives every sign a description and at least one source", () => {
    for (const sign of hieroglyphSigns) {
      expect(sign.description.length).toBeGreaterThan(10);
      expect(sign.sources.length).toBeGreaterThan(0);
      expect(sign.era.length).toBeGreaterThan(0);
    }
  });

  it("gives phonetic signs at least one value", () => {
    for (const sign of hieroglyphSigns) {
      if (sign.signType === "uniliteral") {
        expect(sign.phoneticValues.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives ideograms or determinatives a stated meaning", () => {
    for (const sign of hieroglyphSigns) {
      if (
        sign.signType === "determinative" ||
        sign.signType === "ideogram"
      ) {
        expect(
          sign.ideographicMeaning ?? sign.determinativeMeaning,
        ).toBeTruthy();
      }
    }
  });
});

describe("the 24 uniliterals", () => {
  /**
   * The authoritative Middle Egyptian alphabet. Gardiner
   * codes and Unicode values verified against the Unicode
   * Egyptian Hieroglyphs nameslist.
   */
  const EXPECTED: Array<{
    gardinerCode: string;
    unicode: string;
    value: string;
  }> = [
    { gardinerCode: "G001", unicode: "U+1313F", value: "ꜣ" }, // alef
    { gardinerCode: "M017", unicode: "U+131CB", value: "j" }, // reed
    { gardinerCode: "D036", unicode: "U+1309D", value: "ꜥ" }, // forearm
    { gardinerCode: "G043", unicode: "U+13171", value: "w" }, // quail
    { gardinerCode: "D058", unicode: "U+130C0", value: "b" }, // leg
    { gardinerCode: "Q003", unicode: "U+132AA", value: "p" }, // mat
    { gardinerCode: "I009", unicode: "U+13191", value: "f" }, // viper
    { gardinerCode: "G017", unicode: "U+13153", value: "m" }, // owl
    { gardinerCode: "N035", unicode: "U+13216", value: "n" }, // water
    { gardinerCode: "D021", unicode: "U+1308B", value: "r" }, // mouth
    { gardinerCode: "O004", unicode: "U+13254", value: "h" }, // shelter
    { gardinerCode: "V028", unicode: "U+1339B", value: "ḥ" }, // wick
    { gardinerCode: "Aa001", unicode: "U+1340D", value: "ḫ" }, // sieve
    { gardinerCode: "F032", unicode: "U+13121", value: "ẖ" }, // belly
    { gardinerCode: "O034", unicode: "U+13283", value: "z" }, // bolt
    { gardinerCode: "S029", unicode: "U+132F4", value: "s" }, // cloth
    { gardinerCode: "N037", unicode: "U+13219", value: "š" }, // pool
    { gardinerCode: "N029", unicode: "U+1320E", value: "q" }, // slope
    { gardinerCode: "V031", unicode: "U+133A1", value: "k" }, // basket
    { gardinerCode: "W011", unicode: "U+133BC", value: "g" }, // jar stand
    { gardinerCode: "X001", unicode: "U+133CF", value: "t" }, // loaf
    { gardinerCode: "V013", unicode: "U+1337F", value: "ṯ" }, // rope
    { gardinerCode: "D046", unicode: "U+130A7", value: "d" }, // hand
    { gardinerCode: "I010", unicode: "U+13193", value: "ḏ" }, // cobra
  ];

  it.each(EXPECTED)(
    "has $gardinerCode = $value at $unicode",
    ({ gardinerCode, unicode, value }) => {
      const sign = findSignByGardiner(gardinerCode);
      expect(sign, `missing ${gardinerCode}`).toBeDefined();
      expect(sign!.unicode).toBe(unicode);
      expect(sign!.phoneticValues).toContain(value);
      expect(sign!.signType).toBe("uniliteral");
    },
  );

  it("covers all 24 consonantal phonemes", () => {
    const values = new Set(
      uniliterals.flatMap((sign) => sign.phoneticValues),
    );
    // The extra entries are the known variants (y as a pair
    // of reeds / pair of strokes), so 24 distinct phonemes
    // must all be present.
    const required = [
      "ꜣ", "j", "y", "ꜥ", "w", "b", "p", "f", "m", "n", "r",
      "h", "ḥ", "ḫ", "ẖ", "z", "s", "š", "q", "k", "g", "t",
      "ṯ", "d", "ḏ",
    ];
    for (const phoneme of required) {
      expect(values, `missing phoneme ${phoneme}`).toContain(phoneme);
    }
  });
});

describe("sign lookup", () => {
  it("finds a sign by Gardiner code, case-insensitively", () => {
    expect(findSignByGardiner("g017")?.name).toBe("Owl");
    expect(findSignByGardiner("G017")?.name).toBe("Owl");
  });

  it("finds the Aa group despite its lowercase letter", () => {
    // "Aa001".toUpperCase() is "AA001", so a naive lookup
    // silently loses the whole unclassified group.
    expect(findSignByGardiner("Aa001")?.phoneticValues).toContain("ḫ");
    expect(findSignByGardiner("aa001")?.phoneticValues).toContain("ḫ");
  });

  it("finds a sign by Unicode value", () => {
    const owl = findSignByGardiner("G017");
    expect(findSignByUnicode(owl!.unicode)?.name).toBe("Owl");
  });

  it("finds a sign by its glyph", () => {
    const owl = findSignByGardiner("G017");
    expect(findSignByGlyph(owl!.glyph)?.gardinerCode).toBe("G017");
  });

  it("returns undefined for unknown input rather than throwing", () => {
    expect(findSignByGardiner("ZZ999")).toBeUndefined();
    expect(findSignByUnicode("U+FFFFF")).toBeUndefined();
    expect(findSignByGlyph("𐩑")).toBeUndefined();
  });
});

describe("searchSigns", () => {
  it("finds the owl by name", () => {
    const results = searchSigns("owl");
    expect(results.some((sign) => sign.gardinerCode === "G017")).toBe(true);
  });

  it("finds a sign by Gardiner code", () => {
    expect(
      searchSigns("G017").some((sign) => sign.gardinerCode === "G017"),
    ).toBe(true);
  });

  it("finds a sign by phonetic value", () => {
    expect(searchSigns("ꜥ").length).toBeGreaterThan(0);
  });

  it("returns nothing for an empty query", () => {
    expect(searchSigns("")).toEqual([]);
    expect(searchSigns("   ")).toEqual([]);
  });

  it("returns nothing for a nonsense query", () => {
    expect(searchSigns("zzzzqqqqxxxx")).toEqual([]);
  });
});