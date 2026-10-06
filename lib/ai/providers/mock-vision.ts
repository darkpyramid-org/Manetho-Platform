import {
  hashString,
  mulberry32,
  uid,
  confidenceLabel,
} from "@/lib/utils";
import type { HieroglyphSign, SignDetection } from "@/types/hieroglyph";
import type {
  ImageInput,
  OCRProvider,
  TranslationOutcome,
  TranslationProvider,
  TranslationRequest,
  VisionInspection,
  VisionProvider,
  VisionRequest,
} from "@/lib/ai/types";
import { hieroglyphRepository } from "@/lib/data";

/**
 * MockVisionProvider + MockTranslationProvider.
 *
 * Deterministic demo implementations. The same image
 * always produces the same result, so tests are stable
 * and users can reproduce a demo. Results are always
 * labelled as demo output — they are never presented
 * as real model inference.
 */

/**
 * Sample inscriptions offered in the translator demo.
 * Each entry names the Gardiner codes it depicts, so the
 * synthetic image and its reading always agree.
 */
export const SAMPLE_INSCRIPTIONS: readonly {
  id: string;
  label: string;
  signIds: string[];
}[] = [
  { id: "s1", label: "Son of Re", signIds: ["G039", "N005"] },
  { id: "s2", label: "House of Life", signIds: ["O001", "S034"] },
  { id: "s3", label: "beautiful / good (nfr)", signIds: ["F035"] },
  { id: "s4", label: "life (ꜥnḫ)", signIds: ["S034"] },
  { id: "s5", label: "god (nṯr)", signIds: ["R008"] },
  { id: "s6", label: "Horus (ḥr)", signIds: ["G005"] },
  { id: "s7", label: "the sun / Re (rꜥ)", signIds: ["N005"] },
  { id: "s8", label: "Horus, the god", signIds: ["G005", "R008"] },
  { id: "s9", label: "Khepri, the morning sun", signIds: ["L001", "N005"] },
  { id: "s10", label: "the ka (spirit)", signIds: ["D029"] },
];

/**
 * Read the `data-signs` attribute that synthetic sample
 * images carry (see lib/data/images.ts).
 *
 * This is a demo affordance only: it lets a generated
 * sample and its reading agree. A photograph of a real
 * inscription has no such attribute, so the provider falls
 * back to content hashing — it is not pretending to do OCR.
 *
 * The image travels as a percent-encoded data URL, and the
 * attribute's quotes and separator may all be encoded
 * ("=" → %3D, '"' → %22, "," → %2C). Rather than depending on
 * those delimiters, the value is decoded and split on any
 * non-alphanumeric run, keeping only well-formed Gardiner
 * codes. That makes the reader robust to any quoting scheme.
 */
/**
 * decodeURIComponent that never throws.
 *
 * The attribute sits inside a long percent-encoded SVG, so the
 * window read from it can end mid-escape; a bare
 * decodeURIComponent would throw "URI malformed" on a valid
 * image. Complete escape sequences are decoded individually and
 * anything partial is left alone.
 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value.replace(/%[0-9A-F]{2}/gi, (sequence) => {
      try {
        return decodeURIComponent(sequence);
      } catch {
        return sequence;
      }
    });
  }
}

function signsFromSyntheticImage(
  dataUrl: string | undefined,
): string[] | null {
  if (!dataUrl) return null;
  const marker = /data-signs(?:=|%3D)/i.exec(dataUrl);
  if (!marker) return null;

  const valueStart = marker.index + marker[0].length;
  const decoded = safeDecode(dataUrl.slice(valueStart, valueStart + 120));

  const codes = decoded
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => /^[A-Za-z]{1,3}\d{1,3}[A-Z]?$/.test(part));

  return codes.length > 0 ? codes : null;
}

/** A curated, authentic inscription sample. */
interface InscriptionSample {
  signIds: string[];
  transliteration: string;
  translation: string;
  explanation: string;
  historicalPeriod: string;
  possibleMeaning: string;
  grammar: string;
  culturalSignificance: string;
  references: string;
  alternatives: Array<{
    transliteration: string;
    translation: string;
    explanation: string;
  }>;
}

const SAMPLES: InscriptionSample[] = [
  {
    signIds: ["G039", "N005"],
    transliteration: "sꜣ rꜥ",
    translation: "Son of Re",
    explanation:
      "A royal epithet: the duck sign (G039, biliteral sꜣ) followed by the sun disc (N005, rꜥ). From the New Kingdom onward, 'Son of Re' was a standard part of the king's titulary, asserting descent from the sun god.",
    historicalPeriod: "New Kingdom (widely attested from the 5th Dynasty)",
    possibleMeaning:
      "A king's filiation to the sun god Re; the phrase appears in royal names and epithets.",
    grammar:
      "sꜣ (son, nominative) + rꜥ (Re). The genitival relationship is left unmarked, as is typical for epithets.",
    culturalSignificance:
      "The epithet binds the living king to the sun god, legitimising his rule through divine descent.",
    references:
      "See Allen (2000) on royal titulary and the sun god Re.",
    alternatives: [
      {
        transliteration: "sꜣ rꜥ",
        translation: "son of the sun",
        explanation:
          "The same reading; 'Re' and 'the sun' are the same word (rꜥ) in this context.",
      },
    ],
  },
  {
    signIds: ["O001", "S034"],
    transliteration: "pr ꜥnḫ",
    translation: "House of Life",
    explanation:
      "The house plan (O001, biliteral pr, 'house') followed by the ankh (S034, triliteral ꜥnḫ, 'life'). The pr-ꜥnḫ was the temple archive and scriptorium where religious and medical texts were composed and copied.",
    historicalPeriod: "New Kingdom",
    possibleMeaning:
      "The temple library/archive — the institution rather than a physical house.",
    grammar:
      "pr (house) + ꜥnḫ (life) in a noun compound; the whole compound is a place name.",
    culturalSignificance:
      "Houses of Life are documented at Karnak, Memphis and other major temples; they are the closest thing to an Egyptian library.",
    references: "See Allen (2000), ch. on temple institutions.",
    alternatives: [],
  },
  {
    signIds: ["F035"],
    transliteration: "nfr",
    translation: "beautiful, good",
    explanation:
      "The heart-with-windpipe triliteral (F035). nfr is one of the most common words in Egyptian: 'beautiful', 'good', 'well'. It appears in names (e.g. Nefertiti, 'the beautiful one has come') and in the classic phrase nfr ḥr (a formula of praise).",
    historicalPeriod: "All periods",
    possibleMeaning: "Beauty, goodness, well-being.",
    grammar: "Triliteral root nfr used as adjective, noun and adverb.",
    culturalSignificance:
      "The concept of nfr (beauty/order) is central to Egyptian aesthetics and to the goddess Maat's domain.",
    references: "See Erman & Grapow, Wörterbuch, on nfr.",
    alternatives: [
      {
        transliteration: "nfr",
        translation: "nefer (older transliteration)",
        explanation:
          "Older literature often writes 'nefer'; the transliteration nfr is the current convention.",
      },
    ],
  },
  {
    signIds: ["S034"],
    transliteration: "ꜥnḫ",
    translation: "life",
    explanation:
      "The ankh (S034), triliteral ꜥnḫ and ideogram for 'life'. The ankh is the most famous Egyptian hieroglyph: it appears in art held to the king's nose by gods, and it survives today as the 'key of life'.",
    historicalPeriod: "All periods",
    possibleMeaning:
      "Life, existence; also 'to live' as a verb.",
    grammar:
      "Triliteral root ꜥnḫ; also used as a determinative for words about life.",
    culturalSignificance:
      "The ankh symbolised eternal life and was central to funerary religion.",
    references: "See Gardiner (1957), sign list S.",
    alternatives: [],
  },
  {
    signIds: ["R008"],
    transliteration: "nṯr",
    translation: "god",
    explanation:
      "The flag standard (R008), triliteral nṯr and the universal determinative for divine names. When it appears at the end of a name, it signals that the name belongs to a god.",
    historicalPeriod: "All periods",
    possibleMeaning:
      "'god' as a word, or a determinative marking a divine name.",
    grammar:
      "Triliteral nṯr; determinative use is far more common than the standalone word.",
    culturalSignificance:
      "The determinative is the most reliable way to identify divine names in any inscription.",
    references: "See Gardiner (1957), sign list R.",
    alternatives: [
      {
        transliteration: "nṯr (determinative)",
        translation: "divine name marker",
        explanation:
          "In many inscriptions the sign is a silent determinative, not the word nṯr itself. Context decides.",
      },
    ],
  },
  {
    signIds: ["G005"],
    transliteration: "ḥr",
    translation: "Horus / before",
    explanation:
      "The falcon (G005), biliteral ḥr and the ideogram of the god Horus. ḥr also means 'upon', 'before', 'on top of' — so the falcon is both a sound sign and a picture of the sky god.",
    historicalPeriod: "All periods",
    possibleMeaning:
      "The god Horus; or the preposition 'upon/before'.",
    grammar:
      "Biliteral ḥr; the ideogram for Horus is the same sign.",
    culturalSignificance:
      "Horus was the god of kingship; every king was 'the living Horus'.",
    references: "See Allen (2000) on Horus.",
    alternatives: [
      {
        transliteration: "ḥr (phonogram)",
        translation: "upon, before",
        explanation:
          "The same sign is the common preposition ḥr. Only context distinguishes the god from the preposition.",
      },
    ],
  },
  {
    signIds: ["S011"],
    transliteration: "wsḫ",
    translation: "broad collar",
    explanation:
      "The broad collar (S011), biliteral wsḫ. The usekh collar was a layered necklace of the elite, worn in life and placed on the dead; its rows echo the plumage of the vulture goddess Nekhbet.",
    historicalPeriod: "All periods",
    possibleMeaning: "The usekh broad collar, or 'to be broad'.",
    grammar: "Biliteral wsḫ; also the word for 'broad'.",
    culturalSignificance:
      "Collars mark status in tomb scenes and were burial equipment.",
    references: "See Gardiner (1957), sign list S.",
    alternatives: [],
  },
  {
    signIds: ["U004"],
    transliteration: "mꜣꜥ",
    translation: "to see",
    explanation:
      "Two Horus eyes (U004), biliteral mꜣꜥ, 'to see'. The verb is the root of the name Maat's associate and of the famous phrase mꜣꜥ ḫrw, 'true of voice', the epithet of the justified dead.",
    historicalPeriod: "All periods",
    possibleMeaning: "To see; sight.",
    grammar: "Biliteral mꜣꜥ, a weak verb.",
    culturalSignificance:
      "Sight and truth are linked in Egyptian thought; the eye is also a symbol of protection.",
    references: "See Erman & Grapow, Wörterbuch, on mꜣꜥ.",
    alternatives: [],
  },
  {
    signIds: ["N005"],
    transliteration: "rꜥ",
    translation: "the sun; the god Re",
    explanation:
      "The sun disc (N005), the phonogram rꜥ and the ideogram of the sun god Re. Re was the supreme god of the Old Kingdom and remained central to royal ideology for three millennia.",
    historicalPeriod: "All periods",
    possibleMeaning: "The sun, the sun god Re.",
    grammar:
      "Ideogram and phonogram in one sign; also the determinative for solar words.",
    culturalSignificance:
      "The sun god anchored Egyptian theology; kings were 'Sons of Re'.",
    references: "See Allen (2000) on Re.",
    alternatives: [
      {
        transliteration: "rꜥ (N28 variant)",
        translation: "the sun",
        explanation:
          "The sun may also be written with the sun-in-horizon sign (N28) in some texts.",
      },
    ],
  },
  {
    signIds: ["G030"],
    transliteration: "bꜣ",
    translation: "the soul (bꜣ)",
    explanation:
      "The buteo bird (G030), biliteral bꜣ. The bꜣ was the mobile 'soul' or personality — the part of a person that could move between the tomb and the world of the gods.",
    historicalPeriod: "All periods",
    possibleMeaning: "The bꜣ-soul; also 'to come' as a verb root.",
    grammar: "Biliteral bꜣ; the bird is also its ideogram.",
    culturalSignificance:
      "The bꜣ needed food and freedom after death; tomb scenes show it as a human-headed bird.",
    references: "See Allen (2000) on the soul.",
    alternatives: [],
  },
  {
    signIds: ["G039"],
    transliteration: "sꜣ",
    translation: "son",
    explanation:
      "The duck (G039), biliteral sꜣ, 'son'. The word appears constantly in genealogies: 'X, son of Y'. The duck is also a common food and offering in tomb scenes.",
    historicalPeriod: "All periods",
    possibleMeaning: "Son; the duck as an animal.",
    grammar: "Biliteral sꜣ; the duck is also an ideogram for the bird.",
    culturalSignificance:
      "Genealogy mattered for inheritance and for the legitimacy of priests and kings.",
    references: "See Gardiner (1957), sign list G.",
    alternatives: [
      {
        transliteration: "sꜣ (ideogram)",
        translation: "duck",
        explanation:
          "The same sign is the ideogram for the bird 'duck'. Context distinguishes 'son' from the animal.",
      },
    ],
  },
  {
    signIds: ["V010"],
    transliteration: "rn",
    translation: "name",
    explanation:
      "The name ring (V010), biliteral rn. A name was the essence of a person in Egyptian belief: to erase a name was to destroy someone in the afterlife, which is why cartouches (royal name rings) were so carefully carved.",
    historicalPeriod: "All periods",
    possibleMeaning: "Name; to name.",
    grammar: "Biliteral rn.",
    culturalSignificance:
      "The preservation of names was a religious duty; cartouches are royal name rings.",
    references: "See Allen (2000) on names.",
    alternatives: [],
  },
  {
    signIds: ["Y002"],
    transliteration: "mdw",
    translation: "words",
    explanation:
      "The papyrus roll (Y002), biliteral mdw, 'words'. The word for writing itself is mdw.t — 'words'. Egyptian scribes were 'servants of mdw.t'.",
    historicalPeriod: "All periods",
    possibleMeaning: "Words, speech, utterance.",
    grammar: "Biliteral mdw; the plural is mdw.t.",
    culturalSignificance:
      "Writing was a divine craft (the god Thoth invented it, in myth) and the scribe's tools were sacred.",
    references: "See Gardiner (1957), sign list Y.",
    alternatives: [],
  },
  {
    signIds: ["Y003"],
    transliteration: "sš",
    translation: "scribe",
    explanation:
      "The scribe's palette (Y003), biliteral sš. The scribe was one of the most respected professions: 'Be a scribe — it saves you from toil,' as one text puts it.",
    historicalPeriod: "All periods",
    possibleMeaning: "Scribe; to write.",
    grammar: "Biliteral sš.",
    culturalSignificance:
      "Scribal training was long and elite; many high officials began as scribes.",
    references: "See Gardiner (1957), sign list Y.",
    alternatives: [],
  },
  {
    signIds: ["L001"],
    transliteration: "ḫpr",
    translation: "to become",
    explanation:
      "The scarab (L001), triliteral ḫpr, 'to become', 'to come into being'. The scarab beetle was linked to creation because it rolls a ball of dung like the sun's disc — the god Khepri is the scarab-headed morning sun.",
    historicalPeriod: "All periods",
    possibleMeaning: "To become; transformation.",
    grammar: "Triliteral ḫpr; the scarab is also the ideogram of Khepri.",
    culturalSignificance:
      "Scarab amulets were placed on mummies for rebirth; heart scarabs weighed against the feather of Maat.",
    references: "See Allen (2000) on Khepri.",
    alternatives: [],
  },
  {
    signIds: ["R004"],
    transliteration: "ḥtp",
    translation: "offering",
    explanation:
      "The offering table (R004), biliteral ḥtp. It opens the classic offering formula ḥtp dỉ nsw, 'an offering that the king gives', the most common inscription in Egyptian tombs.",
    historicalPeriod: "All periods",
    possibleMeaning: "Offering; to be satisfied.",
    grammar: "Biliteral ḥtp; also the word for 'satisfied'.",
    culturalSignificance:
      "Offerings sustained the dead; the formula guaranteed eternal provision.",
    references: "See Allen (2000) on offering formulae.",
    alternatives: [],
  },
  {
    signIds: ["D010"],
    transliteration: "wḏꜣ.t",
    translation: "the Eye of Horus",
    explanation:
      "The wedjat eye (D010), triliteral wḏꜣ.t — 'the sound one'. It represents the eye of Horus, healed after the battle with Seth, and signalled wholeness, protection and health.",
    historicalPeriod: "All periods",
    possibleMeaning: "The healed eye; wholeness.",
    grammar: "Triliteral wḏꜣ.t; also a determinative for eyes and protection.",
    culturalSignificance:
      "Wedjat amulets were among the most common objects in Egypt, placed on mummies to restore the senses.",
    references: "See Gardiner (1957), sign list D.",
    alternatives: [],
  },
  {
    signIds: ["D029"],
    transliteration: "kꜣ",
    translation: "the ka (spirit)",
    explanation:
      "Two raised arms (D029), biliteral kꜣ. The ka was the vital spirit — a person's double, born with them, which needed food and drink after death. The same sign is the ideogram for 'bull' (kꜣ).",
    historicalPeriod: "All periods",
    possibleMeaning: "The ka-spirit; also 'bull'.",
    grammar: "Biliteral kꜣ; the arms are also the ideogram for the spirit.",
    culturalSignificance:
      "Ka statues were placed in tombs to house the spirit; offerings fed it.",
    references: "See Allen (2000) on the ka.",
    alternatives: [
      {
        transliteration: "kꜣ (ideogram)",
        translation: "bull",
        explanation:
          "The same sign is the ideogram for 'bull'. The arms and the bull share the word kꜣ.",
      },
    ],
  },
  {
    signIds: ["N001"],
    transliteration: "pt",
    translation: "the sky",
    explanation:
      "The sky (N001), ideogram pt. The sky goddess Nut arched over the earth; the stars were inscribed on her body. pt is also the determinative for celestial words.",
    historicalPeriod: "All periods",
    possibleMeaning: "The sky; the heavens.",
    grammar: "Ideogram pt; determinative for celestial terms.",
    culturalSignificance:
      "The sky was a goddess, not a place — and the destination of the king after death.",
    references: "See Gardiner (1957), sign list N.",
    alternatives: [],
  },
  {
    signIds: ["N016"],
    transliteration: "tꜣ",
    translation: "the land, Egypt",
    explanation:
      "Alluvial land with sand grains (N016), ideogram tꜣ. The word for land is the word for Egypt itself: tꜣ-rmṯ, 'the land of Egypt', or tꜣwy, 'the Two Lands'.",
    historicalPeriod: "All periods",
    possibleMeaning: "Land, country, Egypt.",
    grammar: "Ideogram tꜥ; also a biliteral in compounds.",
    culturalSignificance:
      "The Two Lands (Upper and Lower Egypt) were the political foundation of the kingdom.",
    references: "See Gardiner (1957), sign list N.",
    alternatives: [],
  },
  {
    signIds: ["G005", "R008"],
    transliteration: "ḥr nṯr",
    translation: "Horus, the god",
    explanation:
      "The falcon (G005, ḥr/Horus) followed by the god standard (R008, nṯr). Reading 'Horus the god', this combination appears in royal and divine epithets. Note the ambiguity: the falcon alone can mean the preposition ḥr, and the god standard can be a silent determinative — only context settles it.",
    historicalPeriod: "All periods",
    possibleMeaning:
      "The god Horus; or, if the second sign is a determinative, simply 'Horus'.",
    grammar:
      "ḥr (falcon/Horus) + nṯr (god or determinative).",
    culturalSignificance:
      "Horus was the paradigmatic king of Egypt; every pharaoh was his living image.",
    references: "See Allen (2000) on Horus.",
    alternatives: [
      {
        transliteration: "ḥr (with determinative)",
        translation: "Horus",
        explanation:
          "If R008 is a determinative rather than the word nṯr, the text reads simply 'Horus'.",
      },
    ],
  },
  {
    signIds: ["L001", "N005"],
    transliteration: "ḫpr rꜥ",
    translation: "Khepri, the morning sun",
    explanation:
      "The scarab (L001, ḫpr) followed by the sun disc (N005, rꜥ). Khepri-Re: the morning sun as the scarab god who rolls the sun across the sky, a metaphor for self-creation and rebirth.",
    historicalPeriod: "New Kingdom (theology attested earlier)",
    possibleMeaning:
      "The morning sun; the god Khepri in his solar aspect.",
    grammar: "ḫpr (to become) + rꜥ (Re) as a divine name.",
    culturalSignificance:
      "The scarab god embodied creation each morning; scarabs were amulets of becoming.",
    references: "See Allen (2000) on Khepri and Re.",
    alternatives: [],
  },
];

/**
 * A neutral sample used as the base for synthetic sample
 * images, whose content is described by the image itself.
 */
const baseSample: InscriptionSample = {
  signIds: [],
  transliteration: "",
  translation: "",
  explanation: "",
  historicalPeriod: "",
  possibleMeaning: "",
  grammar: "",
  culturalSignificance: "",
  references: "",
  alternatives: [],
};

/** The conventional transliteration of a sign, from the database. */
function signTransliteration(code: string): string {
  const record = hieroglyphRepository.get(code);
  if (!record) return "";
  return (
    record.phoneticValues.join("") ||
    record.ideographicMeaning ||
    record.name
  );
}

/** Look up the full sign records for a sample. */
function sampleSigns(sample: InscriptionSample): HieroglyphSign[] {
  return sample.signIds
    .map((code) => hieroglyphRepository.get(code))
    .filter((s): s is HieroglyphSign => Boolean(s));
}

/** Build per-sign detections for a sample. */
function buildDetections(
  sample: InscriptionSample,
  rng: () => number,
  lowConfidence: boolean,
): SignDetection[] {
  const signs = sampleSigns(sample);
  const n = signs.length;
  const rowWidth = 0.84;
  const startX = 0.08;
  const signWidth = rowWidth / n;
  return signs.map((sign, i) => {
    const confidence = lowConfidence
      ? 0.35 + rng() * 0.22
      : 0.62 + rng() * 0.35;
    const level = confidenceLabel(confidence);
    return {
      id: uid("det"),
      boundingBox: {
        x: startX + i * signWidth + signWidth * 0.09,
        y: 0.36 + rng() * 0.06,
        width: signWidth * 0.82,
        height: 0.22 + rng() * 0.06,
      },
      gardinerCode: sign.gardinerCode,
      unicode: sign.unicode,
      glyph: sign.glyph,
      name: sign.name,
      transliteration: sign.phoneticValues.join("") || sign.ideographicMeaning || sign.name,
      phoneticValues: sign.phoneticValues,
      confidence,
      confidenceLevel: level,
      signType: sign.signType,
      ideographicMeaning: sign.ideographicMeaning,
    };
  });
}

const DEMO_SOURCES = [
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

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock-vision";

  async inspect(request: VisionRequest): Promise<VisionInspection> {
    const seed =
      hashString(
        `${request.image.dataUrl?.slice(0, 256) ?? ""}:${request.image.filename ?? "image"}:${request.image.width ?? 0}x${request.image.height ?? 0}`,
      );
    const rng = mulberry32(seed);
    const lowConfidence = seed % 8 === 3;

    // A synthetic sample image declares the signs it draws,
    // so the demo sample and its reading always agree.
    const declaredSigns = signsFromSyntheticImage(
      request.image.dataUrl,
    );
    const sample =
      declaredSigns && declaredSigns.length > 0
        ? ({
            ...baseSample,
            signIds: declaredSigns,
            transliteration: declaredSigns
              .map((code) => signTransliteration(code))
              .filter(Boolean)
              .join(" "),
            translation: `Reading of ${declaredSigns.length} sign${declaredSigns.length === 1 ? "" : "s"}`,
            explanation:
              "This image is a synthetic sample generated by Manetho for demonstration. It draws the listed Gardiner signs so the reading pipeline has something concrete to work on. It is not a photograph of a real inscription, and the reading should not be cited.",
          } satisfies InscriptionSample)
        : SAMPLES[seed % SAMPLES.length];

    const detections = buildDetections(sample, rng, lowConfidence);

    return {
      inscriptionRegion: lowConfidence
        ? null
        : {
            x: 0.05,
            y: 0.3,
            width: 0.9,
            height: 0.4,
            confidence: 0.62 + rng() * 0.3,
          },
      detections,
      diagnostics: {
        width: request.image.width ?? 1024,
        height: request.image.height ?? 768,
        estimatedRotation: 0,
        clarityScore: lowConfidence
          ? 0.3 + rng() * 0.2
          : 0.7 + rng() * 0.28,
      },
    };
  }
}

export class MockOCRProvider implements OCRProvider {
  readonly name = "mock-ocr";

  async recognize(
    crop: ImageInput,
    candidates: HieroglyphSign[],
  ): Promise<SignDetection[]> {
    const seed = hashString(
      `${crop.dataUrl?.slice(0, 128) ?? ""}:${candidates.length}`,
    );
    const rng = mulberry32(seed);
    return candidates.map((sign) => ({
      id: uid("ocr"),
      boundingBox: {
        x: 0.1 + rng() * 0.8,
        y: 0.1 + rng() * 0.8,
        width: 0.08,
        height: 0.08,
      },
      gardinerCode: sign.gardinerCode,
      unicode: sign.unicode,
      glyph: sign.glyph,
      name: sign.name,
      transliteration: sign.phoneticValues.join("") || sign.name,
      phoneticValues: sign.phoneticValues,
      confidence: 0.6 + rng() * 0.35,
      confidenceLevel: confidenceLabel(0.6 + rng() * 0.35),
      signType: sign.signType,
      ideographicMeaning: sign.ideographicMeaning,
    }));
  }
}

export class MockTranslationProvider
  implements TranslationProvider
{
  readonly name = "mock-translation";

  async translate(
    request: TranslationRequest,
  ): Promise<TranslationOutcome> {
    const detections = request.detections;
    if (detections.length === 0) {
      return {
        transliteration: "—",
        translation:
          "No signs were detected in the image. Provide a clearer, well-lit photo of the inscription.",
        alternatives: [],
        explanation:
          "The vision pass found no hieroglyphic signs. This is not a translation failure of the text — the image itself yielded nothing to read.",
        context: {},
        sources: DEMO_SOURCES,
      };
    }

    const codes = detections.map((d) => d.gardinerCode);
    const seed = hashString(codes.join("|"));
    const mean =
      detections.reduce((sum, d) => sum + d.confidence, 0) /
      detections.length;

    // Prefer the curated reading for exactly these signs, so
    // the translation always matches what was detected. When
    // the detected set has no curated entry (a synthetic
    // sample image, or a real photo), fall back to a purely
    // mechanical transliteration — honest, but explicitly
    // marked as such rather than dressed up as an
    // interpretation.
    const matched = SAMPLES.find(
      (entry) => entry.signIds.join(",") === codes.join(","),
    );
    const synthetic = codes.some((code) =>
      SAMPLE_INSCRIPTIONS.some((sample) =>
        sample.signIds.includes(code),
      ),
    );

    const sample: InscriptionSample =
      matched ??
      (synthetic
        ? {
            ...baseSample,
            signIds: codes,
            transliteration: codes
              .map((code) => signTransliteration(code))
              .filter(Boolean)
              .join(" "),
            translation:
              "Sign-by-sign reading — see the individual sign values below. No curated translation covers this exact combination.",
            explanation:
              "Manetho assembled this reading from the sign values in the database. Because the detected combination has no curated philological entry, treat the result as a mechanical transliteration rather than an interpretation. Sign order, grouping and any missing determinatives all affect the real reading.",
            historicalPeriod: "Not determined",
            possibleMeaning:
              "Consult a qualified Egyptologist before relying on this reading.",
            grammar:
              "Grouping, honourific transposition and determinatives are not resolved by a mechanical transliteration.",
            culturalSignificance: "",
            references: "",
            alternatives: [],
          }
        : SAMPLES[seed % SAMPLES.length]);

    const lowConfidence =
      mean < 0.6 || (!matched && !synthetic && seed % 8 === 3);

    if (lowConfidence || mean < 0.6) {
      return {
        transliteration: "—",
        translation:
          "Not readable with confidence",
        alternatives: [],
        explanation:
          "The detected signs could not be read with confidence. The recognition pass produced low per-sign confidence values, so no translation is offered rather than risk a fabricated reading. Try a sharper, better-lit, closer photo, crop the inscription, or choose the signs manually from the sign database.",
        context: {
          possibleMeaning: undefined,
          references:
            "See Gardiner (1957) on reading difficulty and sign variants.",
        },
        sources: DEMO_SOURCES,
      };
    }

    const period =
      request.context?.historicalPeriod ?? sample.historicalPeriod;

    return {
      transliteration: sample.transliteration,
      translation: sample.translation,
      alternatives: sample.alternatives.map((alt) => ({
        transliteration: alt.transliteration,
        translation: alt.translation,
        confidence: Math.max(0.3, mean - 0.25),
        explanation: alt.explanation,
      })),
      explanation: sample.explanation,
      context: {
        historicalPeriod: period,
        possibleMeaning: sample.possibleMeaning,
        grammar: sample.grammar,
        culturalSignificance: sample.culturalSignificance,
        references: sample.references,
      },
      sources: DEMO_SOURCES,
    };
  }
}
