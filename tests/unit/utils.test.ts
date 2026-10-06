import { describe, expect, it } from "vitest";
import {
  cn,
  clamp,
  confidenceLabel,
  escapeHtml,
  formatConfidence,
  hashString,
  mulberry32,
  uid,
} from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("lets later classes win, which is what tailwind-merge gives us", () => {
    // tailwind-merge resolves conflicts so the last one wins.
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("confidenceLabel", () => {
  it("uses the documented thresholds: high ≥ 0.85, medium ≥ 0.6", () => {
    expect(confidenceLabel(0.95)).toBe("high");
    expect(confidenceLabel(0.85)).toBe("high");
    expect(confidenceLabel(0.84)).toBe("medium");
    expect(confidenceLabel(0.7)).toBe("medium");
    expect(confidenceLabel(0.6)).toBe("medium");
    expect(confidenceLabel(0.59)).toBe("low");
    expect(confidenceLabel(0.1)).toBe("low");
  });

  it("handles the boundaries of the range", () => {
    expect(confidenceLabel(1)).toBe("high");
    expect(confidenceLabel(0)).toBe("low");
  });
});

describe("formatConfidence", () => {
  it("returns a word, not a fabricated number", () => {
    // Reporting "88%" would imply a precision the model does
    // not have; the label is deliberately coarser.
    expect(formatConfidence(0.876)).toBe("High");
    expect(formatConfidence(0.7)).toBe("Medium");
    expect(formatConfidence(0.125)).toBe("Low");
  });

  it("is derived from confidenceLabel", () => {
    for (const value of [0, 0.3, 0.6, 0.8, 0.9, 1]) {
      const label = confidenceLabel(value);
      expect(formatConfidence(value)).toMatch(
        new RegExp(`^${label[0].toUpperCase()}${label.slice(1)}$`),
      );
    }
  });
});

describe("clamp", () => {
  it("keeps values inside the range", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("𓅓")).toBe(hashString("𓅓"));
  });

  it("separates different inputs", () => {
    expect(hashString("𓅓")).not.toBe(hashString("𓈖"));
  });

  it("returns an unsigned 32-bit integer", () => {
    const value = hashString("anything");
    expect(value).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(value)).toBe(true);
  });

  it("handles the empty string", () => {
    expect(Number.isInteger(hashString(""))).toBe(true);
  });
});

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const first = [a(), a(), a(), a()];
    const second = [b(), b(), b(), b()];
    expect(first).toEqual(second);
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("stays within the unit interval", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("uid", () => {
  it("prefixes and produces unique values", () => {
    const a = uid("req");
    const b = uid("req");
    expect(a).not.toBe(b);
    expect(a.startsWith("req")).toBe(true);
  });

  it("defaults its prefix", () => {
    expect(uid().startsWith("mth")).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("escapes the dangerous characters", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands and single quotes", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });
});