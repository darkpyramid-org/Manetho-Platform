import { hieroglyphRepository, sampleInscriptions } from "@/lib/data";
import { hashString, mulberry32, uid } from "@/lib/utils";
import type { TranslationResult } from "@/types/hieroglyph";

/**
 * Reference translation fixtures (spec §62).
 *
 * The demo provider's readings, expressed as domain objects so
 * they can be seeded into PostgreSQL. Storing them gives the
 * admin review queue real rows to work against and exercises the
 * full schema — including per-sign confidence and alternative
 * readings — rather than leaving those tables empty.
 *
 * These are demo readings of synthetic sample images. They are
 * not readings of real monuments and must not be cited.
 */

const SOURCES = [
  {
    id: "src-gardiner",
    title:
      "Egyptian Grammar: Being an Introduction to the Study of Hieroglyphs (3rd ed.)",
    author: "Gardiner, Alan H.",
    publisher: "Griffith Institute, Oxford",
    publicationDate: "1957",
    type: "BOOK" as const,
    citationText:
      "Gardiner, A.H. (1957). Egyptian Grammar (3rd ed.). Oxford: Griffith Institute.",
  },
  {
    id: "src-allen",
    title:
      "Middle Egyptian: An Introduction to the Language and Culture of Hieroglyphs",
    author: "Allen, James P.",
    publisher: "Cambridge University Press",
    publicationDate: "2000",
    type: "BOOK" as const,
    citationText:
      "Allen, J.P. (2000). Middle Egyptian. Cambridge: Cambridge University Press.",
  },
];

/** Short glosses for the sample inscriptions. */
const GLOSSES: Record<string, { translation: string; explanation: string }> = {
  G039: {
    translation: "son",
    explanation:
      "The duck, biliteral sꜣ. Used constantly in genealogies.",
  },
  N005: {
    translation: "the sun; the god Re",
    explanation:
      "The sun disc: both the phonogram rꜥ and the god's name.",
  },
  O001: {
    translation: "house",
    explanation:
      "The house plan, biliteral pr — also the word 'house' itself.",
  },
  S034: {
    translation: "life",
    explanation:
      "The ankh, triliteral ꜥnḫ and ideogram for 'life'.",
  },
  F035: {
    translation: "beautiful, good",
    explanation:
      "The heart-and-windpipe triliteral nfr.",
  },
  R008: {
    translation: "god",
    explanation:
      "The flag standard nṯr, which also marks divine names.",
  },
  G005: {
    translation: "Horus / before",
    explanation:
      "The falcon, biliteral ḥr and the god Horus's ideogram.",
  },
  L001: {
    translation: "to become",
    explanation:
      "The scarab, triliteral ḫpr — the morning sun god Khepri.",
  },
  D029: {
    translation: "the ka",
    explanation:
      "Two raised arms, biliteral kꜣ: the vital spirit.",
  },
};

export interface TranslationFixture {
  requestId: string;
  artifactId: string | null;
  status: TranslationResult["status"];
  overallConfidence: number;
  result: TranslationResult;
}

/**
 * Build one deterministic reference reading per sample.
 * Confidence is derived from the sample id so the fixtures are
 * stable across runs and identical to what the demo pipeline
 * would report for the same image.
 */
export function buildTranslationFixtures(): TranslationFixture[] {
  return sampleInscriptions().map((sample) => {
    const seed = hashString(sample.id);
    const rng = mulberry32(seed);

    const signs = sample.signIds
      .map((code) => hieroglyphRepository.get(code))
      .filter((sign): sign is NonNullable<typeof sign> => Boolean(sign));

    const detections = signs.map((sign, index) => {
      const confidence = Math.min(
        0.97,
        0.68 + ((seed >> (index * 3)) % 24) / 100,
      );
      const cellWidth = 0.84 / Math.max(1, signs.length);
      return {
        id: uid("det"),
        boundingBox: {
          x: 0.08 + index * cellWidth + cellWidth * 0.09,
          y: 0.36 + rng() * 0.06,
          width: cellWidth * 0.82,
          height: 0.22 + rng() * 0.06,
        },
        gardinerCode: sign.gardinerCode,
        unicode: sign.unicode,
        glyph: sign.glyph,
        name: sign.name,
        transliteration:
          sign.phoneticValues.join("") || sign.ideographicMeaning || sign.name,
        phoneticValues: sign.phoneticValues,
        confidence,
        confidenceLevel:
          confidence >= 0.85
            ? ("high" as const)
            : confidence >= 0.6
              ? ("medium" as const)
              : ("low" as const),
        signType: sign.signType,
        ideographicMeaning: sign.ideographicMeaning,
      };
    });

    const meanConfidence =
      detections.reduce((sum, detection) => sum + detection.confidence, 0) /
      Math.max(1, detections.length);

    const transliteration = signs
      .map(
        (sign) =>
          sign.phoneticValues.join("") ||
          sign.ideographicMeaning ||
          sign.name,
      )
      .join(" ");

    const translation =
      signs.length === 1
        ? (GLOSSES[signs[0].gardinerCode]?.translation ?? sample.label)
        : sample.label.replace(/^[^\p{L}]+—\s*/u, "");

    const explanations = signs
      .map((sign) => GLOSSES[sign.gardinerCode]?.explanation)
      .filter((entry): entry is string => Boolean(entry));

    return {
      requestId: `seed-${sample.id}`,
      artifactId: null,
      status: "completed" as const,
      overallConfidence: meanConfidence,
      result: {
        requestId: `seed-${sample.id}`,
        imageId: `seed-image-${sample.id}`,
        status: "completed" as const,
        detections,
        transliteration,
        translation,
        alternatives: [],
        explanation:
          `Synthetic sample generated by Manetho for demonstration; it draws ${signs
            .map((sign) => `${sign.gardinerCode} (${sign.name})`)
            .join(", ")}. ${explanations.join(" ")} Not a photograph of a real inscription, so this reading should not be cited.`,
        context: {
          historicalPeriod: "All periods",
          possibleMeaning: sample.label,
          grammar:
            "Sign values are listed in reading order; grouping into words requires philological judgement.",
          culturalSignificance: "",
          references: "See Gardiner (1957); Allen (2000).",
        },
        overallConfidence: meanConfidence,
        overallConfidenceLevel:
          meanConfidence >= 0.85
            ? ("high" as const)
            : meanConfidence >= 0.6
              ? ("medium" as const)
              : ("low" as const),
        sources: SOURCES,
        isDemo: true,
        createdAt: new Date(0).toISOString(),
      },
    };
  });
}

/** Eagerly built so the seed script can import a plain array. */
export const translationResponses: TranslationFixture[] =
  buildTranslationFixtures();