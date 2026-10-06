import { describe, expect, it } from "vitest";
import {
  buildTranslationFixtures,
  translationResponses,
} from "@/lib/data/mock-fixtures";
import { TranslationResultSchema } from "@/lib/ai/schemas";
import { hieroglyphRepository, sampleInscriptions } from "@/lib/data";

/**
 * Seed-fixture tests.
 *
 * The reference readings written to PostgreSQL must satisfy the
 * same schema the live pipeline produces, and must point at signs
 * that actually exist — otherwise the seed writes rows that the
 * application would reject on its own terms.
 */

describe("translation fixtures", () => {
  const fixtures = buildTranslationFixtures();

  it("produces one fixture per sample inscription", () => {
    expect(fixtures.length).toBe(sampleInscriptions().length);
    expect(fixtures.length).toBeGreaterThanOrEqual(10);
  });

  it("exports an eagerly built array matching the builder", () => {
    expect(translationResponses.length).toBe(fixtures.length);
    expect(translationResponses[0].requestId).toBe(fixtures[0].requestId);
  });

  it("gives every fixture a unique requestId", () => {
    const ids = fixtures.map((fixture) => fixture.requestId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("produces schema-valid results", () => {
    for (const fixture of fixtures) {
      const parsed = TranslationResultSchema.safeParse(fixture.result);
      expect(
        parsed.success,
        `${fixture.requestId}: ${parsed.success ? "" : parsed.error.message}`,
      ).toBe(true);
    }
  });

  it("only references signs that exist in the database", () => {
    for (const fixture of fixtures) {
      expect(fixture.result.detections.length).toBeGreaterThan(0);
      for (const detection of fixture.result.detections) {
        expect(
          hieroglyphRepository.get(detection.gardinerCode),
          `${fixture.requestId} → ${detection.gardinerCode}`,
        ).toBeDefined();
      }
    }
  });

  it("keeps overallConfidence consistent with its detections", () => {
    for (const fixture of fixtures) {
      const mean =
        fixture.result.detections.reduce(
          (sum, detection) => sum + detection.confidence,
          0,
        ) / fixture.result.detections.length;
      expect(fixture.overallConfidence).toBeCloseTo(mean, 6);
      expect(fixture.result.overallConfidence).toBeCloseTo(mean, 6);
    }
  });

  it("stays within the confidence range and labels the level", () => {
    for (const fixture of fixtures) {
      expect(fixture.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(fixture.overallConfidence).toBeLessThanOrEqual(1);
      for (const detection of fixture.result.detections) {
        expect(detection.confidence).toBeGreaterThanOrEqual(0);
        expect(detection.confidence).toBeLessThanOrEqual(1);
        expect(["high", "medium", "low"]).toContain(
          detection.confidenceLevel,
        );
      }
    }
  });

  it("keeps bounding boxes inside the image", () => {
    for (const fixture of fixtures) {
      for (const detection of fixture.result.detections) {
        const box = detection.boundingBox;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(1.001);
        expect(box.y + box.height).toBeLessThanOrEqual(1.001);
      }
    }
  });

  it("marks every fixture as demo output and says so in prose", () => {
    for (const fixture of fixtures) {
      expect(fixture.result.isDemo).toBe(true);
      expect(fixture.result.explanation).toMatch(/not a photograph/i);
      expect(fixture.result.explanation).toMatch(/should not be cited/i);
    }
  });

  it("cites its sources", () => {
    for (const fixture of fixtures) {
      expect(fixture.result.sources.length).toBeGreaterThan(0);
      for (const source of fixture.result.sources) {
        expect(source.id).toBeTruthy();
        expect(source.citationText).toMatch(/Gardiner|Allen/);
      }
    }
  });

  it("is deterministic across calls", () => {
    const again = buildTranslationFixtures();
    expect(again.map((f) => f.result.transliteration)).toEqual(
      fixtures.map((f) => f.result.transliteration),
    );
    expect(again.map((f) => f.overallConfidence)).toEqual(
      fixtures.map((f) => f.overallConfidence),
    );
  });
});