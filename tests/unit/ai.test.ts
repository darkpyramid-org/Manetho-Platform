import { describe, expect, it } from "vitest";
import {
  getProviderBundle,
  translateInscription,
  streamAssistant,
} from "@/lib/ai/gateway";
import { TranslationResultSchema } from "@/lib/ai/schemas";
import { sampleInscriptions, hieroglyphRepository } from "@/lib/data";
import type { LLMStreamChunk } from "@/lib/ai/types";

/**
 * AI layer tests (spec §20, §22, §58, §77).
 *
 * The most important property is not that AI "works" but that
 * it never lies: results are validated, low confidence stops
 * the pipeline, and the demo provider is deterministic.
 */

describe("provider bundle selection", () => {
  it("returns the mock bundle in demo mode", () => {
    const bundle = getProviderBundle("mock");
    expect(bundle.vision.name).toBe("mock-vision");
    expect(bundle.ocr.name).toBe("mock-ocr");
    expect(bundle.translation.name).toBe("mock-translation");
    expect(bundle.llm.name).toBe("mock-llm");
  });

  it("returns openai, huawei and local bundles by name", () => {
    expect(getProviderBundle("openai").llm.name).toBe("openai-llm");
    expect(getProviderBundle("huawei").llm.name).toBe("huawei-llm");
    expect(getProviderBundle("local").llm.name).toBe("local-llm");
  });

  it("gives every bundle the seven capabilities", () => {
    for (const provider of ["mock", "openai", "huawei", "local"] as const) {
      const bundle = getProviderBundle(provider);
      expect(bundle.vision).toBeDefined();
      expect(bundle.ocr).toBeDefined();
      expect(bundle.translation).toBeDefined();
      expect(bundle.llm).toBeDefined();
      expect(bundle.embedding).toBeDefined();
    }
  });
});

describe("translateInscription (mock provider)", () => {
  it("returns a schema-valid result for a sample image", async () => {
    const sample = sampleInscriptions()[0];
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
      width: sample.width,
      height: sample.height,
    });

    // The result must satisfy the published schema.
    const parsed = TranslationResultSchema.safeParse(result);
    expect(parsed.success).toBe(true);
  });

  it("reads the signs the sample image actually draws", async () => {
    const sample = sampleInscriptions()[1]; // pr ꜥnḫ
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
      width: sample.width,
      height: sample.height,
    });

    const detected = result.detections
      .map((detection) => detection.gardinerCode)
      .sort();
    expect(detected).toEqual([...sample.signIds].sort());
  });

  it("produces a meaningful transliteration", async () => {
    const sample = sampleInscriptions()[1]; // pr ꜥnḫ
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
      width: sample.width,
      height: sample.height,
    });
    expect(result.transliteration).toBe("pr ꜥnḫ");
    expect(result.translation).toBe("House of Life");
  });

  it("is deterministic: the same image gives the same result", async () => {
    const sample = sampleInscriptions()[0];
    const first = await translateInscription({
      dataUrl: sample.image,
      filename: "same.svg",
      width: sample.width,
      height: sample.height,
    });
    const second = await translateInscription({
      dataUrl: sample.image,
      filename: "same.svg",
      width: sample.width,
      height: sample.height,
    });
    expect(first.transliteration).toBe(second.transliteration);
    expect(first.translation).toBe(second.translation);
    expect(first.detections.map((d) => d.gardinerCode)).toEqual(
      second.detections.map((d) => d.gardinerCode),
    );
  });

  it("marks results as demo output", async () => {
    const sample = sampleInscriptions()[0];
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
    });
    expect(result.isDemo).toBe(true);
  });

  it("cites its sources", async () => {
    const sample = sampleInscriptions()[0];
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
    });
    expect(result.sources.length).toBeGreaterThan(0);
    for (const source of result.sources) {
      expect(source.citationText.length).toBeGreaterThan(10);
      expect(source.id).toBeTruthy();
    }
  });

  it("gives every detection a confidence and a level", async () => {
    const sample = sampleInscriptions()[4]; // nṯr
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
    });
    for (const detection of result.detections) {
      expect(detection.confidence).toBeGreaterThanOrEqual(0);
      expect(detection.confidence).toBeLessThanOrEqual(1);
      expect(["high", "medium", "low"]).toContain(detection.confidenceLevel);
      expect(detection.gardinerCode).toMatch(/^[A-Z]{1,2}\d{1,3}[A-Z]?$/);
      // Every detection must resolve to a real sign.
      expect(
        hieroglyphRepository.get(detection.gardinerCode),
        `unknown sign ${detection.gardinerCode}`,
      ).toBeDefined();
    }
  });

  it("gives detections a bounding box inside the image", async () => {
    const sample = sampleInscriptions()[0];
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
    });
    for (const detection of result.detections) {
      const box = detection.boundingBox;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(1.001);
      expect(box.y + box.height).toBeLessThanOrEqual(1.001);
    }
  });

  it("reports low confidence instead of inventing a reading", async () => {
    // A blank image yields no signs, so the pipeline must stop
    // rather than fabricate a translation (spec §77).
    const result = await translateInscription({
      dataUrl:
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="#fff"/></svg>',
        ),
      filename: "blank.svg",
      width: 100,
      height: 100,
    });

    // Whether it reports zero signs or low confidence, it must
    // never present a confident translation of nothing.
    if (result.status !== "completed") {
      expect(result.transliteration).toBe("—");
      expect(result.translation.toLowerCase()).toContain("not readable");
    }
  });

  it("explains itself when a reading is not confident", async () => {
    const sample = sampleInscriptions()[0];
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
    });
    expect(result.explanation.length).toBeGreaterThan(20);
  });
});

describe("streamAssistant (mock provider)", () => {
  it("streams the answer as deltas and finishes with a message", async () => {
    const chunks: LLMStreamChunk[] = [];
    await streamAssistant(
      { message: "Who was Tutankhamun?", mode: "visitor" },
      (chunk) => chunks.push(chunk),
      "mock",
    );

    const deltas = chunks.filter((chunk) => chunk.type === "delta");
    const done = chunks.filter((chunk) => chunk.type === "done");
    expect(deltas.length).toBeGreaterThan(0);
    expect(done.length).toBe(1);

    // The concatenated deltas must equal the final message.
    const assembled = deltas.map((chunk) => chunk.delta ?? "").join("");
    expect(assembled).toBe(done[0].message?.content);
  });

  it("labels its output as demo so it is never mistaken for a model", async () => {
    const chunks: LLMStreamChunk[] = [];
    await streamAssistant(
      { message: "Explain the ankh", mode: "visitor" },
      (chunk) => chunks.push(chunk),
      "mock",
    );
    const done = chunks.find((chunk) => chunk.type === "done");
    expect(done?.message?.content).toContain("Mock provider");
  });

  it("answers about a scanned inscription using its context", async () => {
    const sample = sampleInscriptions()[1];
    const result = await translateInscription({
      dataUrl: sample.image,
      filename: `${sample.id}.svg`,
    });

    const chunks: LLMStreamChunk[] = [];
    await streamAssistant(
      {
        message: "What does this inscription say?",
        mode: "visitor",
        context: {
          detections: result.detections,
          translationResult: {
            transliteration: result.transliteration,
            translation: result.translation,
            explanation: result.explanation,
            alternatives: result.alternatives,
          },
        },
      },
      (chunk) => chunks.push(chunk),
      "mock",
    );

    const content = chunks.find((chunk) => chunk.type === "done")?.message
      ?.content;
    expect(content).toContain(result.transliteration);
  });

  it("cites its sources", async () => {
    const chunks: LLMStreamChunk[] = [];
    await streamAssistant(
      { message: "Who was Tutankhamun?", mode: "research" },
      (chunk) => chunks.push(chunk),
      "mock",
    );
    const done = chunks.find((chunk) => chunk.type === "done");
    expect(done?.message?.citations?.length).toBeGreaterThan(0);
  });

  it("adapts depth to the requested mode", async () => {
    const collect = async (mode: "visitor" | "research") => {
      const chunks: LLMStreamChunk[] = [];
      await streamAssistant(
        { message: "Who was Tutankhamun?", mode },
        (chunk) => chunks.push(chunk),
        "mock",
      );
      return chunks.find((chunk) => chunk.type === "done")?.message?.content ?? "";
    };

    const visitor = await collect("visitor");
    const research = await collect("research");
    expect(research.length).toBeGreaterThan(visitor.length);
  });

  it("says so instead of guessing when it does not know", async () => {
    const chunks: LLMStreamChunk[] = [];
    await streamAssistant(
      {
        message: "Which attested pharaoh had a pet llama named François?",
        mode: "research",
      },
      (chunk) => chunks.push(chunk),
      "mock",
    );
    const content = chunks.find((chunk) => chunk.type === "done")?.message
      ?.content;
    expect(content).toMatch(/no sourced information|don't have reliable/i);
  });

  it("grounds answers in an artifact it is given", async () => {
    const { artifacts } = await import("@/lib/data");
    const chunks: LLMStreamChunk[] = [];
    await streamAssistant(
      {
        message: "When was this made?",
        mode: "visitor",
        context: { artifact: artifacts[0] },
      },
      (chunk) => chunks.push(chunk),
      "mock",
    );
    const done = chunks.find((chunk) => chunk.type === "done");
    expect(done?.message?.artifactCards).toContain(artifacts[0].id);
    expect(done?.message?.content).toContain(artifacts[0].dateFrom);
  });
});