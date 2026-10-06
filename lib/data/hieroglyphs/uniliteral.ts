import type { HieroglyphCategory, HieroglyphSign } from "@/types/hieroglyph";

/**
 * Uniliteral signs — the 24 consonantal phonemes of Middle Egyptian.
 * Gardiner codes, Unicode code points and phonetic values follow the
 * Unicode Egyptian Hieroglyphs block (U+13000–U+1342F) and standard
 * Egyptological transliteration (Gardiner 1957; Allen 2000).
 */

export type SignRecord = [
  gardinerCode: string,
  unicodeHex: string,
  glyph: string,
  name: string,
  category: HieroglyphCategory,
  signType: HieroglyphSign["signType"],
  phoneticValues: string[],
  ideographicMeaning: string | undefined,
  determinativeMeaning: string | undefined,
  description: string,
  era: string | undefined,
  mdc: string | undefined,
  variants: string[] | undefined,
];

const era = "Middle Egyptian";

export const uniliteralRecords: SignRecord[] = [
  ["G001", "1313F", "𓄿", "Egyptian vulture", "G", "uniliteral", ["ꜣ"], undefined, undefined,
    "Egyptological alef. The vulture is also the ideogram for the goddess Nekhbet and for the word 'mother'.", era, "A", []],
  ["M017", "131CB", "𓇋", "Flowering reed", "M", "uniliteral", ["j"], undefined, undefined,
    "Egyptological yod. A flowering reed leaf; also the ideogram for 'reed' and for the verb 'to come'.", era, "i", []],
  ["M017A", "131CC", "𓇌", "Pair of reeds", "M", "uniliteral", ["y"], undefined, undefined,
    "Two reed leaves; a second sign with the value y. Variant of M017.", era, "y", ["M017"]],
  ["Z004", "133ED", "𓏭", "Pair of strokes", "Z", "uniliteral", ["y"], undefined, undefined,
    "Dual classifier formed of two strokes; carries the value y in dual forms.", era, "y", []],
  ["D036", "1309D", "𓂝", "Forearm", "D", "uniliteral", ["ꜥ"], undefined, undefined,
    "Egyptological ayin. A forearm; the sign for the pharyngeal consonant ꜥ.", era, "a", []],
  ["G043", "13171", "𓅱", "Quail chick", "G", "uniliteral", ["w"], undefined, undefined,
    "A quail chick; the sign for w (wau). Frequently abbreviated in hieratic.", era, "w", []],
  ["D058", "130C0", "𓃀", "Lower leg", "D", "uniliteral", ["b"], undefined, undefined,
    "A lower leg; the sign for b.", era, "b", []],
  ["Q003", "132AA", "𓊪", "Reed mat", "Q", "uniliteral", ["p"], undefined, undefined,
    "A reed mat or stool; the sign for p.", era, "p", []],
  ["I009", "13191", "𓆑", "Horned viper", "I", "uniliteral", ["f"], undefined, undefined,
    "A horned viper (Cerastes); the sign for f.", era, "f", []],
  ["G017", "13153", "𓅓", "Owl", "G", "uniliteral", ["m"], undefined, undefined,
    "An owl; the sign for m. One of the most common signs in any inscription.", era, "m", []],
  ["N035", "13216", "𓈖", "Ripple of water", "N", "uniliteral", ["n"], undefined, undefined,
    "A ripple of water; the sign for n. Used wherever the water ideogram appears.", era, "n", []],
  ["D021", "1308B", "𓂋", "Mouth", "D", "uniliteral", ["r"], undefined, undefined,
    "A mouth; the sign for r (also l in later stages).", era, "r", []],
  ["O004", "13254", "𓉔", "Reed shelter", "O", "uniliteral", ["h"], undefined, undefined,
    "A reed shelter or hut; the sign for h.", era, "h", []],
  ["V028", "1339B", "𓎛", "Twisted wick", "V", "uniliteral", ["ḥ"], undefined, undefined,
    "A twisted wick; the sign for ḥ (second H).", era, "H", []],
  ["Aa001", "1340D", "𓐍", "Sieve / placenta", "Aa", "uniliteral", ["ḫ"], undefined, undefined,
    "A sieve or placenta; the sign for ḫ (third H). Carried in the unclassified group (Aa).", era, "x", []],
  ["F032", "13121", "𓄡", "Animal belly and tail", "F", "uniliteral", ["ẖ"], undefined, undefined,
    "An animal's belly and tail; the sign for ẖ (fourth H).", era, "X", []],
  ["O034", "13283", "𓊃", "Door bolt", "O", "uniliteral", ["z"], undefined, undefined,
    "A door bolt; the sign for z (also s in some conventions).", era, "z", []],
  ["S029", "132F4", "𓋴", "Folded cloth", "S", "uniliteral", ["s"], undefined, undefined,
    "A fold of cloth; the sign for s (also ś).", era, "s", []],
  ["N037", "13219", "𓈙", "Garden pool", "N", "uniliteral", ["š"], undefined, undefined,
    "A garden pool; the sign for š (shin).", era, "S", []],
  ["N029", "1320E", "𓈎", "Hill slope", "N", "uniliteral", ["q"], undefined, undefined,
    "A hill slope; the sign for q (ḳ, dotted k).", era, "q", []],
  ["V031", "133A1", "𓎡", "Basket with handle", "V", "uniliteral", ["k"], undefined, undefined,
    "A basket with handle; the sign for k.", era, "k", []],
  ["W011", "133BC", "𓎼", "Jar stand", "W", "uniliteral", ["g"], undefined, undefined,
    "A jar stand; the sign for g.", era, "g", []],
  ["X001", "133CF", "𓏏", "Bread loaf", "X", "uniliteral", ["t"], undefined, undefined,
    "A bread loaf; the sign for t. Among the most frequent signs after the owl.", era, "t", []],
  ["V013", "1337F", "𓍿", "Tethering rope", "V", "uniliteral", ["ṯ"], undefined, undefined,
    "A tethering rope or hobble; the sign for ṯ (second T).", era, "T", []],
  ["D046", "130A7", "𓂧", "Hand", "D", "uniliteral", ["d"], undefined, undefined,
    "A hand; the sign for d (also ṭ).", era, "d", []],
  ["I010", "13193", "𓆓", "Cobra in repose", "I", "uniliteral", ["ḏ"], undefined, undefined,
    "A cobra at rest; the sign for ḏ (second D).", era, "D", []],
];
