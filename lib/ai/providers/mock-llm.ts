import { uid } from "@/lib/utils";
import type {
  AssistantMessage,
  AssistantRequest,
  LLMProvider,
  LLMStreamChunk,
} from "@/lib/ai/types";
import type { AssistantMode } from "@/types/common";
import type { Artifact } from "@/types/museum";
import type {
  HieroglyphSign,
  SignDetection,
} from "@/types/hieroglyph";
import { hieroglyphRepository } from "@/lib/data";

/** Resolve a Gardiner code to a full sign record, if known. */
function lookupSign(code: string) {
  return hieroglyphRepository.get(code.toUpperCase());
}

/**
 * MockLLMProvider.
 *
 * A deterministic demo Egyptology assistant. It composes
 * responses from a small, sourced knowledge base and the
 * request context. It never invents facts: when a topic
 * is outside the knowledge base it says so, and it always
 * distinguishes established knowledge from interpretation.
 */

/**
 * A citation attached to an assistant answer
 * (spec §75: answers must cite their sources).
 */
interface Citation {
  sourceId?: string;
  title: string;
  author?: string;
  year?: string;
  url?: string;
  type: string;
}

interface Fact {
  id: string;
  topics: string[];
  visitor: string;
  educational: string;
  research: string;
  sources: Citation[];
}

const GARDINER_CITE: Citation = {
  title:
    "Egyptian Grammar: Being an Introduction to the Study of Hieroglyphs (3rd ed.)",
  author: "Gardiner, Alan H.",
  year: "1957",
  type: "BOOK",
};

const ALLEN_CITE: Citation = {
  title:
    "Middle Egyptian: An Introduction to the Language and Culture of Hieroglyphs",
  author: "Allen, James P.",
  year: "2000",
  type: "BOOK",
};

const CARTER_CITE: Citation = {
  title: "The Tomb of Tutankhamun",
  author: "Carter, H. & Mace, A.",
  year: "1923–1933",
  type: "BOOK",
};

const CHAMPOLLION_CITE: Citation = {
  title: "Lettre à M. Dacier relative à l'alphabet des hiéroglyphes phonétiques",
  author: "Champollion, J.-F.",
  year: "1822",
  type: "PAPER",
};

const BM_CITE: Citation = {
  title: "The British Museum — collection records",
  year: "2026",
  type: "MUSEUM",
  url: "https://www.britishmuseum.org",
};

const FACTS: Fact[] = [
  {
    id: "f-horus",
    topics: ["horus", "falcon god", "god of kingship"],
    visitor:
      "Horus is the falcon-headed god of kingship. Every living king was called 'the living Horus'. The falcon sign 𓅃 (G005) is both his picture and the sound ḥr.",
    educational:
      "Horus is the falcon-headed god of kingship. The king was 'the living Horus', and the falcon sign 𓅃 (G005) is both the god's picture and the biliteral sound ḥr. In the myth, Horus avenged his father Osiris and became the model for every king. Try the 'Gods, Pharaohs and Mythology' course to see the signs.",
    research:
      "Horus (Egyptian ḥr) is the falcon deity of kingship; the king is 'the living Horus' (ḥr ꜥnḫ). The falcon sign G005 is simultaneously the biliteral ḥr and the god's ideogram — a classic case where context determines whether a sign is phonetic or semantic. The Horus name is the oldest element of the royal titulary, attested from the Early Dynastic period. The Horus–Seth conflict is known mainly from later narrative sources (e.g. Plutarch), so its Egyptian 'canon' is reconstructed rather than documented.",
    sources: [ALLEN_CITE, GARDINER_CITE],
  },
  {
    id: "f-osiris",
    topics: ["osiris", "god of the dead", "afterlife god"],
    visitor:
      "Osiris is the god of the dead and of resurrection. His emblem is the djed pillar 𓊽 (R011), meaning 'endure'. Egyptians hoped to 'become Osiris' after death.",
    educational:
      "Osiris rules the land of the dead and embodies resurrection. His emblem is the djed pillar 𓊽 (R011), biliteral ḏd, 'endure'. The djed was raised at festivals as a symbol of life renewed. Our fullest narrative of his myth comes from Plutarch, a Greek author writing centuries later — so treat any complete retelling as an interpretation.",
    research:
      "Osiris (wsjr) is the god of the dead and of regeneration; the deceased aspires to 'become Osiris' (sšm wsjr). His emblem, the djed pillar (R011, biliteral ḏd 'endure'), is raised ritually in the Old Kingdom Pyramid Texts. The narrative of his murder and resurrection survives primarily in Plutarch (1st–2nd c. CE), a late Greek source; Egyptian sources allude through ritual rather than a single canonical text. The etymology of wsjr remains uncertain.",
    sources: [ALLEN_CITE, GARDINER_CITE],
  },
  {
    id: "f-re",
    topics: ["re", "ra", "sun god", "sun disc"],
    visitor:
      "Re is the sun god, written with the sun disc 𓇳 (N005). He was the supreme god of the Old Kingdom, and kings were called 'Sons of Re'.",
    educational:
      "Re is the sun god, written with the sun disc 𓇳 (N005), which is both the word rꜥ ('sun') and the god's name. Re sailed across the sky by day and through the underworld by night. From the 5th Dynasty, kings added 'Son of Re' (sꜣ rꜥ) to their titles.",
    research:
      "Re (rꜥ) is the sun god, written with the sun disc N005 — the sign is simultaneously the phonogram rꜥ, the ideogram for the sun, and the god's name. Re's prominence peaks in the Old Kingdom (the sun temples of the 5th Dynasty) and persists through the New Kingdom (Amun-Re of Thebes). The solar barque and the underworld books (Amduat, Book of Gates) describe his nightly journey. The variant N28 (sun in horizon) also writes rꜥ.",
    sources: [ALLEN_CITE],
  },
  {
    id: "f-hieroglyphs",
    topics: ["hieroglyph", "hieroglyphs", "writing", "script"],
    visitor:
      "Hieroglyphs are Egypt's monumental writing system, used for over 3,500 years. They mix sound signs, word signs and silent 'determinatives'.",
    educational:
      "Hieroglyphs are Egypt's monumental script, used from c. 3200 BCE to 394 CE. They mix three kinds of sign: phonograms (sound signs, like the owl 𓅓 = m), ideograms (word signs, like the sun disc 𓇳 = 'sun'), and determinatives (silent signs that clarify meaning, like the god standard 𓊹 after divine names). Champollion deciphered the script in 1822 using the Rosetta Stone.",
    research:
      "The hieroglyphic script (mdw.w-ntr, 'god's words') attested from c. 3200 BCE to the Philae graffito of 394 CE. It is a mixed system: 24 uniliteral phonograms, biliterals, triliterals, ideograms and determinatives, written without vowels or punctuation. Decipherment was achieved by Champollion (1822), building on Young's work, via the Rosetta Stone's three scripts. Middle Egyptian is the classical stage; the script later evolved into hieratic and demotic. Transliteration conventions (ꜣ, ḥ, ẖ, ḫ, ṯ, ḏ) represent consonants English lacks.",
    sources: [CHAMPOLLION_CITE, ALLEN_CITE, GARDINER_CITE],
  },
  {
    id: "f-rosetta",
    topics: ["rosetta stone", "rosetta"],
    visitor:
      "The Rosetta Stone is a granodiorite stele from 196 BCE with the same decree in hieroglyphic, Demotic and Greek. It was the key that unlocked hieroglyphs.",
    educational:
      "The Rosetta Stone (British Museum, EA 24) is a granodiorite stele from 196 BCE. It records a decree of Ptolemy V in three scripts: hieroglyphic, Demotic and Greek. Because scholars could read Greek, Champollion used it to decipher the hieroglyphs in 1822. The decree itself records the cult of the living king.",
    research:
      "The Rosetta Stone (BM EA 24) is a granodiorite stele of 196 BCE bearing the Memphis decree of Ptolemy V in hieroglyphic, Demotic and Greek. Its decipherment by Champollion (Lettre à M. Dacier, 1822), building on T. Young's observations, established that hieroglyphs were a mixed phonetic-semantic system rather than a purely ideographic one. The text is a priestly decree affirming the royal cult; its historical value is political rather than narrative.",
    sources: [CHAMPOLLION_CITE, BM_CITE],
  },
  {
    id: "f-tutankhamun",
    topics: ["tutankhamun", "tutankhamen", "king tut", "kv62", "carter"],
    visitor:
      "Tutankhamun was a young 18th-Dynasty king whose tomb (KV62) was found almost intact in 1922. His golden mask is among the most famous objects in the world.",
    educational:
      "Tutankhamun ruled c. 1332–1323 BCE, as a boy king of the 18th Dynasty. His tomb (KV62) was discovered by Howard Carter in 1922, nearly intact — the only royal tomb found so complete. His gold funerary mask, 54 cm tall, bears a spell from Chapter 151 of the Book of the Dead. He restored the traditional gods after the Amarna revolution of his father Akhenaten.",
    research:
      "Tutankhamun (r. c. 1332–1323 BCE) was a late 18th-Dynasty king, likely the son of Akhenaten (the 'KV55 mummy' attribution remains debated). Tomb KV62, found by Howard Carter in 1922, was the first royal tomb discovered substantially intact — over 5,000 objects, including the gold mask (CG 25026) with the Chapter 151 spell. His reign marks the restoration of the Amun cult after Akhenaten's Atenist revolution; the 'restoration stela' is a key text. Much of his iconography was produced posthumously in accelerated form, so tomb art is not a simple biography.",
    sources: [CARTER_CITE],
  },
  {
    id: "f-book-of-the-dead",
    topics: ["book of the dead", "weighing of the heart", "ammit"],
    visitor:
      "The Book of the Dead is a collection of spells to guide the dead through the underworld. Its most famous scene weighs the heart against the feather of Maat.",
    educational:
      "The Book of the Dead (the 'Book of Coming Forth by Day') is a collection of spells placed with the dead. In its most famous scene, the heart of the deceased is weighed against the feather of Maat, truth and justice. If they balance, the dead enter the Field of Reeds; if not, the monster Ammit devours the heart. The Book of the Dead of Hunefer (British Museum, EA 9901) is the finest surviving example.",
    research:
      "The Book of the Dead (rw nw prt m hrw, 'book of coming forth by day') is a corpus of spells (chapters 1–192+) attested from the New Kingdom, descending from the Coffin Texts and Pyramid Texts. The 'negative confession' (ch. 125) culminates in the weighing of the heart against the feather of Maat before Osiris and the forty-two judges, with Ammit ('devourer') in attendance. Manuscripts are individualised — no two are identical. The Book of the Dead of Hunefer (BM EA 9901) is the standard exemplar.",
    sources: [BM_CITE, ALLEN_CITE],
  },
  {
    id: "f-dynasties",
    topics: ["dynasty", "dynasties", "chronology", "kingdom", "old kingdom", "middle kingdom", "new kingdom"],
    visitor:
      "Egyptian history is divided into 30 dynasties — a framework from the historian Manetho — grouped into the Old, Middle and New Kingdoms with intermediate periods between them.",
    educational:
      "Egyptian history is divided into 30 dynasties, a framework from Manetho, a 3rd-century-BCE priest whose history survives only in later summaries. Egyptologists group the dynasties into the Old Kingdom (pyramids, c. 2686–2181 BCE), the Middle Kingdom (c. 2055–1650 BCE) and the New Kingdom (empire, c. 1550–1069 BCE), with Intermediate Periods between. Dates before c. 1000 BCE carry scholarly uncertainty — different chronologies differ by decades.",
    research:
      "The 30-dynasty framework derives from Manetho of Sebennytos (Aegyptiaca, 3rd c. BCE), surviving only in epitome (Africanus, Eusebius) and partly contradictory. Modern periodisation: Predynastic (to c. 3100), Early Dynastic (c. 3100–2686), Old Kingdom (c. 2686–2181), First Intermediate (c. 2181–2055), Middle Kingdom (c. 2055–1650), Second Intermediate (c. 1650–1550, including the Hyksos 15th Dynasty), New Kingdom (c. 1550–1069), Third Intermediate and Late Period to 332 BCE. Absolute dating before the New Kingdom is contested; the 'low', 'middle' and 'high' chronologies differ by up to several decades.",
    sources: [ALLEN_CITE],
  },
  {
    id: "f-mummification",
    topics: ["mummy", "mummification", "mummify", "embalming", "canopic"],
    visitor:
      "Mummification preserved the body for the afterlife. The organs were removed into four canopic jars, and the body was dried with natron salt for 40 days.",
    educational:
      "Mummification prepared the body for the afterlife, because the soul (bꜣ and kꜣ) needed a body to return to. The brain was removed through the nose; the liver, lungs, stomach and intestines went into four canopic jars (guarded by the four sons of Horus); the heart stayed in the body — it would be weighed against the feather of Maat. The body was dried with natron for about 40 days, then wrapped.",
    research:
      "Mummification is documented from the Old Kingdom (earlier natural mummification at Gebelein predates it). The viscera (liver, lungs, stomach, intestines) were preserved in canopic jars under the protection of Imsety, Hapy, Duamutef and Qebehsenuef; the heart (ib/ꜥb) remained in situ as the seat of intelligence weighed in the Judgment of Osiris. Natron desiccation lasted ~40 days (the '70 days' of Herodotus II.86–88 includes wrapping). Embalming recipes vary by period and are reconstructed from residues and texts; Herodotus' three-price account is a Greek outsider's summary.",
    sources: [BM_CITE, ALLEN_CITE],
  },
  {
    id: "f-gods-general",
    topics: ["god", "gods", "goddess", "pantheon", "deity"],
    visitor:
      "Egyptian religion had hundreds of gods, often linked to specific towns. The most prominent include Re (sun), Osiris (dead), Isis (magic), Horus (kingship), Anubis (embalming) and Thoth (writing).",
    educational:
      "Egyptian religion was local and flexible: the same god could have different names in different towns. Major deities include Re (sun), Osiris (the dead), Isis (magic and motherhood), Horus (kingship), Anubis (embalming, a jackal), Thoth (writing, an ibis), Bastet (cats), Seth (chaos and storms), and Maat (truth and justice). The word for god, nṯr, is written with the flag standard 𓊹 (R008), which also marks divine names.",
    research:
      "The Egyptian pantheon was syncretic and local: deities were fused (Amun-Re, Ptah-Sokar-Osiris) and the same name could denote different local beings. The word nṯr (R008) doubles as the determinative for divine names. Major attested deities include Re, Osiris, Isis, Horus, Seth, Anubis (inpw), Thoth (ḏḥwty), Bastet, Sobek, Ptah, Amun, Neith, and Maat (mꜣꜥ.t). 'The pantheon' as a fixed list is a modern convenience; Egyptian theology was situational.",
    sources: [ALLEN_CITE, GARDINER_CITE],
  },
  {
    id: "f-temples",
    topics: ["temple", "temples", "karnak", "luxor"],
    visitor:
      "Egyptian temples were 'houses of the gods', not places where ordinary people worshipped. Only priests entered the inner sanctuaries.",
    educational:
      "Egyptian temples were 'mansions of the gods' (ḥwt-nṯr) — literal houses for divine statues. Ordinary people worshipped in the outer courts; only priests entered the inner rooms. The greatest temple complex, Karnak, grew over 2,000 years. Temple walls record rituals, royal annals and offering scenes — a primary source for Egyptian history.",
    research:
      "The temple was the ḥwt-nṯr ('mansion of the god'), the literal dwelling of the divine statue; the god was 'serviced' daily (washing, clothing, feeding — see the ritual of the divine cult). The public participated only in outer courts and festivals. Temple layouts follow an axial plan: pylon, open court, hypostyle hall, sanctuary. Temple walls are primary historical sources (annals, festal calendars, decrees like that on the Rosetta Stone). Karnak (Ipet-sut) is the largest religious complex ever built.",
    sources: [ALLEN_CITE],
  },
  {
    id: "f-narmer",
    topics: ["narmer", "unification", "menes"],
    visitor:
      "The Narmer Palette (c. 3100 BCE) shows a king in the White Crown of Upper Egypt and the Red Crown of Lower Egypt. It is often cited as evidence of Egypt's unification — though scholars debate exactly what it records.",
    educational:
      "The Narmer Palette (Egyptian Museum, Cairo, JE 32169) is one of the earliest works of Egyptian narrative art, c. 3100 BCE from Hierakonpolis. One side shows the king smiting a captive in the White Crown; the other shows him in procession in the Red Crown. It is often cited as evidence of the unification of Egypt, though the historical reading is debated: it may record a ceremony rather than a single conquest.",
    research:
      "The Narmer Palette (JE 32169, Hierakonpolis, Naqada III) depicts the king in the White Crown (Upper Egypt) smiting a captive, and in the Red Crown (Lower Egypt) in procession. Its relation to the unification of Egypt is debated: some scholars read it as a record of conquest, others as an ideological or ceremonial object. The identification of Narmer with Menes (the unifier of later king lists) is an inference, not a documented fact. See Gardiner's sign list for the early writing conventions.",
    sources: [GARDINER_CITE, ALLEN_CITE],
  },
  {
    id: "f-manetho",
    topics: ["manetho", "manethon"],
    visitor:
      "Manetho was an Egyptian priest and historian of the 3rd century BCE who wrote a history of Egypt in Greek. His division of kings into 30 dynasties is still used today — and gave this platform its name.",
    educational:
      "Manetho of Sebennytos was an Egyptian priest and historian (3rd century BCE) who wrote the Aegyptiaca, a history of Egypt in Greek. His division of kings into 30 dynasties is still the standard framework — and is the namesake of Manetho. His work survives only in later summaries, so details are uncertain.",
    research:
      "Manetho of Sebennytos (fl. early 3rd c. BCE), a priest of Ra at Heliopolis, wrote the Aegyptiaca in Greek for the Ptolemaic court. The work is lost and survives only in epitome (Julius Africanus, Eusebius) and excerpts (Josephus). His dynastic framework remains standard, but the epitomes disagree on details, and his king lists cannot be checked directly against contemporary records. The name 'Manetho' is the namesake of this platform.",
    sources: [ALLEN_CITE],
  },
  {
    id: "f-maat",
    topics: ["maat", "truth", "justice", "order", "feather"],
    visitor:
      "Maat is the goddess of truth, justice and cosmic order. Her feather was weighed against the heart of the dead in the Judgment of Osiris.",
    educational:
      "Maat is the goddess of truth, justice and cosmic order — the principle that kept the universe running. Her feather was weighed against the heart of the dead in the Judgment of Osiris: if the heart balanced, the dead entered the afterlife. Kings claimed to 'live on Maat', and her feather sign is a determinative for the concept.",
    research:
      "Maat (mꜣꜥ.t) is the goddess and the concept of truth, justice and cosmic order. The 'weighing of the heart' (Book of the Dead ch. 125) balances the heart against her feather before Osiris and the forty-two judges. The phrase mꜣꜥ ḫrw ('true of voice') is the standard epithet of the justified dead. Kings are 'beloved of Maat' and live 'on Maat' (mꜣꜥ.t), the ideological basis of royal justice.",
    sources: [ALLEN_CITE],
  },
  {
    id: "f-anubis",
    topics: ["anubis", "jackal", "god of embalming"],
    visitor:
      "Anubis is the jackal-headed god of embalming and guardian of the necropolis. Jackals haunted the desert edge where Egyptians buried their dead — so the god who watched over them took their form.",
    educational:
      "Anubis (inpw) is the jackal-headed god of embalming and guardian of the necropolis. Jackals haunted the desert cemeteries, so the protector of the dead took the jackal's form. He presides over mummification and guides the dead to the Judgment of Osiris. In Tutankhamun's tomb, a gilded shrine topped by a recumbent jackal guarded the treasury.",
    research:
      "Anubis (inpw) is the jackal deity of embalming and the necropolis; his association derives from jackals frequenting desert cemeteries. In the New Kingdom he is 'foremost of the embalmers' and guide of the dead; the 'Coffin Texts' spell 161 invokes him. The gilded Anubis shrine (JE 61444) from KV62 is the best-known image. His Greek name Anubis derives from Egyptian inpw; the hieroglyphic writing uses the jackal/collar signs.",
    sources: [CARTER_CITE, ALLEN_CITE],
  },
  {
    id: "f-thoth",
    topics: ["thoth", "god of writing", "ibis"],
    visitor:
      "Thoth is the ibis-headed god of writing, wisdom and the moon. Egyptians believed he invented writing, and scribes were his servants.",
    educational:
      "Thoth (ḏḥwty) is the ibis-headed god of writing, wisdom and the moon. Egyptians believed he invented writing, and scribes were 'servants of Thoth'. The word for writing, mdw.t, is written with the papyrus roll 𓏝 (Y002). His main cult centre was Hermopolis.",
    research:
      "Thoth (ḏḥwty) is the god of writing, wisdom and the moon, usually depicted as an ibis or baboon. The scribal palettes carry his emblem; scribes were 'servants of ḏḥwty'. He was credited with inventing writing (mdw.t) and with recording the Judgment of Osiris. His cult centre was Hermopolis Magna (Khmunu). The etymology of ḏḥwty is debated (possibly 'he who is like the ibis').",
    sources: [ALLEN_CITE],
  },
];

/**
 * Match a topic against the message.
 *
 * Whole-word matching is essential: short topic keys such as
 * "re" and "ra" would otherwise match inside unrelated words
 * ("attested pharaoh…") and produce a confident answer to a
 * question nobody asked.
 */
function topicMatches(text: string, topic: string): boolean {
  const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu").test(
    text,
  );
}

/** Classify the intent of a message, deterministically. */
function classifyIntent(
  message: string,
  hasContext: boolean,
): {
  intent:
    | "greeting"
    | "who"
    | "what"
    | "when"
    | "where"
    | "why"
    | "how"
    | "child"
    | "research"
    | "translate"
    | "artifact"
    | "fact"
    | "fallback";
  fact?: Fact;
} {
  const text = message.toLowerCase();

  if (/^(hi|hello|hey|greetings|marhaba|مرحبا|shalom)\b/.test(text)) {
    return { intent: "greeting" };
  }
  if (
    /(explain|like a child|for a kid|for my (kid|child)|simple|eli5|five year old|beginner)/i.test(
      text,
    )
  ) {
    return { intent: "child" };
  }
  if (
    /(research|scholar|academic|references|citation|grammar|transliterat|source|detailed)/i.test(
      text,
    )
  ) {
    return { intent: "research" };
  }

  // An object the visitor is currently looking at takes
  // precedence when the question demonstrably refers to it
  // ("what is this made of?"), but not for a general
  // knowledge question ("who was Tutankhamun?").
  if (
    hasContext &&
    /\b(this|it|these|those|here|object|artifact|piece|statue|mask|stele)\b/i.test(
      text,
    )
  ) {
    return { intent: "artifact" };
  }

  // Topic lookup runs before question-word classification so
  // that "Who was Tutankhamun?" still reaches the knowledge
  // base instead of falling through to a generic answer.
  const fact = FACTS.find((entry) =>
    entry.topics.some((topic) => topicMatches(text, topic)),
  );
  if (fact) return { intent: "fact", fact };

  if (/\bwho\b/.test(text)) return { intent: "who" };
  if (/\bwhen\b|\bhow old\b|\bdat(e|ed)\b|\bperiod\b|\bdynasty\b|\byear\b/.test(text)) {
    return { intent: "when" };
  }
  if (/\bwhere\b/.test(text)) return { intent: "where" };
  if (/\bwhy\b/.test(text)) return { intent: "why" };
  if (/\bhow\b/.test(text)) return { intent: "how" };
  if (
    /(translat|read|inscription|hieroglyph|sign|garde|decipher)/i.test(
      text,
    )
  ) {
    return { intent: "translate" };
  }

  if (hasContext) return { intent: "artifact" };
  return { intent: "fallback" };
}

/** Pick the mode-appropriate paragraph. */
function pickParagraph(
  fact: Fact,
  mode: AssistantMode,
): string {
  if (mode === "educational") return fact.educational;
  if (mode === "research") return fact.research;
  return fact.visitor;
}

/** Compose a response from a fact. */
function factResponse(
  fact: Fact,
  mode: AssistantMode,
): string {
  return pickParagraph(fact, mode);
}

/** Compose a response grounded in a translation result. */
function translationResponse(
  request: AssistantRequest,
  mode: AssistantMode,
  detections: SignDetection[],
  result: {
    transliteration: string;
    translation: string;
    explanation: string;
    alternatives: Array<{
      transliteration: string;
      translation: string;
      confidence: number;
      explanation: string;
    }>;
  } | null,
): { content: string; signCards: string[] } {
  const signCards = detections
    .map((d) => {
      // Prefer the database record so the sign cards carry
      // authoritative names and meanings (spec §20).
      const record = lookupSign(d.gardinerCode);
      return record ? record.id : d.gardinerCode;
    })
    .filter((id) => id.length > 0);
  const signList = detections
    .map(
      (d) =>
        `${d.glyph} ${d.gardinerCode} (${d.transliteration || d.name}) — ${d.name}`,
    )
    .join("\n");
  const confLevels = detections.map((d) => d.confidenceLevel);
  const lowCount = confLevels.filter((c) => c === "low").length;

  if (mode === "visitor") {
    let content =
      "Here is what the recognition pass found in your image.\n\n";
    if (result) {
      content += `**Transliteration:** ${result.transliteration}\n**Translation:** ${result.translation}\n\n${result.explanation}\n`;
    } else {
      content +=
        "The detected signs could not be read with confidence. Rather than risk a fabricated reading, I can only list what was tentatively detected:\n\n";
    }
    content += `\n**Detected signs:**\n${signList}\n`;
    if (lowCount > 0) {
      content += `\n⚠️ ${lowCount} of ${detections.length} signs have low confidence. A sharper, closer, better-lit photo would improve the reading.`;
    }
    content +=
      "\n\nThis is a computer recognition result — a helpful starting point, not a substitute for expert Egyptological reading.";
    return { content, signCards };
  }

  if (mode === "educational") {
    let content =
      "Let's read your inscription together, sign by sign.\n\n";
    if (result) {
      content += `The transliteration is **${result.transliteration}** and it translates as **${result.translation}**. ${result.explanation}\n\n`;
    }
    content += `**The signs:**\n${signList}\n`;
    content +=
      "\nEach sign is both a picture and a sound — that is what makes hieroglyphs a mixed script. Open the sign database to explore any sign in depth, or try the 'Introduction to Hieroglyphs' course to learn the 24 consonant signs.";
    return { content, signCards };
  }

  // research
  let content =
    "**Recognition analysis (deterministic demo pass).**\n\n";
  if (result) {
    content += `Transliteration: ${result.transliteration}\nTranslation: ${result.translation}\n\n${result.explanation}\n`;
    if (result.alternatives.length > 0) {
      content += `\n**Alternative readings:**\n`;
      for (const alt of result.alternatives) {
        content += `- ${alt.transliteration} — "${alt.translation}" (confidence ${(alt.confidence * 100).toFixed(0)}%): ${alt.explanation}\n`;
      }
    }
  } else {
    content +=
      "No confident reading was produced. The following detections are provisional and must not be cited:\n\n";
  }
  content += `\n**Per-sign data:**\n${signList}\n`;
  content += `\nConfidence distribution: ${confLevels.join(", ")}.\n`;
  content +=
    "\nCaveats: recognition confidence is not philological certainty. Sign order, damaged signs and variant readings require expert verification. Sources: Gardiner (1957); Allen (2000).";
  return { content, signCards };
}

/** Compose a response grounded in an artifact. */
function artifactResponse(
  artifact: Artifact,
  mode: AssistantMode,
  intent: string,
): { content: string; artifactCards: string[] } {
  const artifactCards = [artifact.id];
  const facts = [
    `${artifact.name} is a ${artifact.period} object (${artifact.dynasty}, ${artifact.dateFrom}–${artifact.dateTo}), ${artifact.material}, ${artifact.dimensions}.`,
    `It is held at ${artifact.inventoryNumber}.`,
    `${artifact.description}`,
  ];

  if (mode === "visitor") {
    let content = facts[0] + "\n\n" + facts[2];
    if (intent === "when") {
      content += `\n\n**Date:** ${artifact.dateFrom}${artifact.dateTo !== artifact.dateFrom ? ` – ${artifact.dateTo}` : ""}. Dates for this period carry scholarly uncertainty; different chronologies differ by decades.`;
    }
    content +=
      "\n\nFacts above are from museum records (demo dataset). Interpretations are marked as such.";
    return { content, artifactCards };
  }

  if (mode === "educational") {
    let content = `${facts[0]}\n\n${facts[2]}\n`;
    content += `\n**Why it matters:** ${artifact.tags.map((t) => t).join(", ")}. `;
    content +=
      "\n\nExplore the sign database to read any hieroglyphs on the object, or take the 'Gods, Pharaohs and Mythology' course for context.";
    return { content, artifactCards };
  }

  let content = `${facts[0]}\n\n${facts[2]}\n`;
  content += `\n**Inventory:** ${artifact.inventoryNumber}\n**Culture:** ${artifact.culture}\n**Creator:** ${artifact.creator}\n`;
  if (artifact.inscription) {
    content += `\n**Inscription:** ${artifact.inscription.transliteration} — ${artifact.inscription.translation}\n`;
  }
  content +=
    "\n**Sources:**\n" +
    artifact.sources
      .map((s) => `- ${s.citationText}`)
      .join("\n") +
    "\n\nNote: the attached metadata is a development dataset and must be verified against institutional records before scholarly use.";
  return { content, artifactCards };
}

/** Compose a fallback response that admits the limits of the knowledge base. */
function fallbackResponse(
  mode: AssistantMode,
): string {
  if (mode === "visitor") {
    return "I don't have reliable information about that specific point, so I won't guess. I can help with hieroglyphs, Egyptian gods, pharaohs, tombs, temples, mummification, and the objects in the museum collection. Ask me about any of those — or upload an inscription to translate.";
  }
  if (mode === "educational") {
    return "I don't have reliable information about that specific point, and it's better to say so than to guess. What I can help with: reading hieroglyphs (try the 'Introduction to Hieroglyphs' course), the gods and mythology, pharaohs and dynasties, temples, tombs, and daily life. Which would you like to explore?";
  }
  return "No sourced information is available for that query; a fabricated answer would be worse than none. The knowledge base covers: hieroglyphic signs and transliteration, the Rosetta Stone and decipherment, major deities, royal history and chronology (with period uncertainty), mummification, the Book of the Dead, and the objects in the demo collection. Cite-worthy claims require a verified source.";
}

export class MockLLMProvider implements LLMProvider {
  readonly name = "mock-llm";

  private compose(request: AssistantRequest): AssistantMessage {
    const mode = request.mode;
    const ctx = request.context;
    const detections = ctx?.detections ?? [];
    const translationResult = (ctx?.translationResult ?? null) as {
      transliteration: string;
      translation: string;
      explanation: string;
      alternatives: Array<{
        transliteration: string;
        translation: string;
        confidence: number;
        explanation: string;
      }>;
    } | null;
    const artifact = ctx?.artifact;
    const museum = ctx?.museum;
    const tour = ctx?.tour;

    const { intent, fact } = classifyIntent(
      request.message,
      Boolean(artifact || translationResult || detections.length),
    );

    // A question about "this" resolves to the attached reading
    // when there is no object attached, so a scanned inscription
    // is never mistaken for a general question.
    const wantsReading =
      (detections.length > 0 || Boolean(translationResult)) &&
      (intent === "artifact" || intent === "translate") &&
      !artifact;

    let content = "";
    let citations: Citation[] = [];
    let artifactCards: string[] | undefined;
    let signCards: string[] | undefined;

    if (intent === "greeting") {
      content =
        "I am Manetho, your cultural heritage assistant. I can read hieroglyphic inscriptions with you, explain Egyptian gods, pharaohs, tombs and temples, and help you explore the museum collection. Ask me about an inscription, an artifact, or anything in Egyptian history.";
      citations = [ALLEN_CITE];
    } else if (intent === "translate" || wantsReading) {
      const result = translationResponse(
        request,
        mode,
        detections,
        translationResult,
      );
      content = result.content;
      signCards = result.signCards;
      citations = [GARDINER_CITE, ALLEN_CITE];
    } else if (
      (intent === "artifact" || intent === "who" || intent === "what" || intent === "when" || intent === "where" || intent === "why" || intent === "how") &&
      artifact
    ) {
      const result = artifactResponse(artifact, mode, intent);
      content = result.content;
      artifactCards = result.artifactCards;
      citations = artifact.sources.map((s) => ({
        title: s.title,
        author: s.author,
        year: s.publicationDate,
        type: s.type,
        url: s.url,
      }));
    } else if (
      intent === "who" ||
      intent === "what" ||
      intent === "when" ||
      intent === "where" ||
      intent === "why" ||
      intent === "how" ||
      intent === "child" ||
      intent === "research" ||
      intent === "fact"
    ) {
      if (fact) {
        content = factResponse(fact, mode);
        citations = fact.sources;
      } else {
        content = fallbackResponse(mode);
      }
    } else if (intent === "fallback" && museum) {
      content =
        `I can help you explore ${museum.name} in ${museum.city}. ` +
        `The museum's galleries cover ${museum.description} ` +
        "Ask me about a specific object, or start a guided tour from the museum page.";
      citations = [];
    } else if (intent === "fallback" && tour) {
      content =
        `You are on the tour "${tour.title}" — ${tour.description} ` +
        `The tour has ${tour.stops.length} stops and takes about ${tour.durationMinutes} minutes. Ask me about the current stop, or the next object on the route.`;
      citations = [];
    } else {
      content = fallbackResponse(mode);
    }

    // Demo marking (spec §86): never present mock output as a real model.
    content +=
      "\n\n---\n*Demo response — produced by the deterministic Mock provider. Configure a real LLM provider (OpenAI or Huawei Cloud) for production answers.*";

    return {
      id: uid("msg"),
      role: "assistant",
      content,
      format: "markdown",
      citations: citations.length ? citations : undefined,
      artifactCards,
      signCards,
      createdAt: new Date().toISOString(),
    };
  }

  async complete(request: AssistantRequest): Promise<AssistantMessage> {
    return this.compose(request);
  }

  async stream(
    request: AssistantRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
  ): Promise<void> {
    const message = this.compose(request);
    const words = message.content.split(/(\s+)/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      onChunk({ type: "delta", delta: word });
      // Simulate latency honestly — the content is still
      // deterministic and clearly labelled as demo output.
      if (i % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 12));
      }
    }
    onChunk({ type: "done", message });
  }
}

/**
 * Mock embedding provider. Deterministic bag-of-signs
 * embeddings — adequate for the demo search index.
 */
export class MockEmbeddingProvider {
  readonly name = "mock-embedding";

  async embed(request: {
    text: string;
  }): Promise<{ vector: number[]; model: string }> {
    // 64-dim deterministic vector from character trigrams.
    const vector = new Array<number>(64).fill(0);
    const normalized = request.text
      .toLowerCase()
      .replace(/[^a-zꜣḥẖḫṯḏ]/g, " ");
    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      if (code > 0) {
        vector[code % 64] += 1;
        if (i + 1 < normalized.length) {
          vector[
            (code + normalized.charCodeAt(i + 1)) % 64
          ] += 0.5;
        }
      }
    }
    const norm = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );
    return {
      vector: norm > 0 ? vector.map((value) => value / norm) : vector,
      model: "mock-embedding",
    };
  }
}

/**
 * Mock STT/TTS providers. They do not fabricate audio:
 * they return a clear error so the caller falls back to
 * the browser speech APIs (the default for MVP).
 */
export class MockSTTProvider {
  readonly name = "mock-stt";

  async transcribe(): Promise<never> {
    throw new Error(
      "STT_NOT_CONFIGURED: no speech-to-text provider is configured. Use the browser speech API (SpeechRecognition) in development.",
    );
  }
}

export class MockTTSProvider {
  readonly name = "mock-tts";

  async synthesize(): Promise<never> {
    throw new Error(
      "TTS_NOT_CONFIGURED: no text-to-speech provider is configured. Use the browser speech API (speechSynthesis) in development.",
    );
  }
}

export const mockKnowledge = { FACTS };
export type { HieroglyphSign };
