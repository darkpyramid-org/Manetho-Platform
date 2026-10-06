import type {
  LearningCourse,
  LearningLesson,
} from "@/types/learning";
import { generatedImage } from "./images";

/**
 * Seed learning content (spec §62).
 *
 * Sign references point at real Gardiner codes in the
 * hieroglyph database. Content is introductory and
 * written for a general audience; scholarly claims
 * are kept conservative and sourced.
 */

function lesson(
  p: Omit<LearningLesson, "content" | "quiz" | "signIds"> & {
    sections: LearningLesson["content"];
    quiz?: LearningLesson["quiz"];
    signIds: string[];
  },
): LearningLesson {
  return {
    ...p,
    content: p.sections,
    quiz: p.quiz,
    signIds: p.signIds,
  };
}

export const courses: LearningCourse[] = [
  {
    id: "course-hiero",
    title: "Introduction to Hieroglyphs",
    slug: "introduction-to-hieroglyphs",
    description:
      "Learn how Egyptian writing actually works — from the 24 consonant signs to determinatives — using real Gardiner signs from the Manetho database.",
    level: "beginner",
    coverImage: generatedImage({
      seed: "course-hiero",
      label: "Introduction to Hieroglyphs",
      accent: "gold",
      width: 1200,
      height: 630,
    }),
    lessons: [
      lesson({
        id: "l-hiero-intro",
        courseId: "course-hiero",
        order: 1,
        title: "What Are Hieroglyphs?",
        slug: "what-are-hieroglyphs",
        summary:
          "How Egyptian writing combines sound signs, meaning signs and classifiers.",
        durationMinutes: 8,
        signIds: ["N005", "D021", "G017", "X001"],
        sections: [
          {
            heading: "Three kinds of sign",
            kind: "prose",
            body: "Hieroglyphic writing is not purely alphabetic. A single inscription can mix three kinds of sign: phonograms (signs that stand for sounds), ideograms (signs that stand for whole words or concepts), and determinatives (silent signs that clarify meaning). For example, the owl 𓅓 (G017) is a phonogram with the value m, while the sun disc 𓇳 (N005) is both a phonogram rꜥ and the ideogram for the sun and the god Re.",
          },
          {
            heading: "A living script",
            kind: "prose",
            body: "Hieroglyphs were used for over 3,500 years, from c. 3200 BCE until the last known inscription at Philae in 394 CE. The script was deciphered in 1822 by Jean-François Champollion, using the Rosetta Stone's three parallel scripts.",
          },
          {
            heading: "Try it yourself",
            kind: "signs",
            body: "These four signs appear in the first lesson. Use the sign database to explore each one.",
            signIds: ["N005", "D021", "G017", "X001"],
          },
          {
            heading: "Keep in mind",
            kind: "note",
            body: "There is no punctuation in the modern sense, and vowels were not written. Transliteration adds conventions (ꜣ, ḥ, ẖ, ḫ) to represent consonants that have no exact English equivalent.",
          },
        ],
        quiz: {
          id: "q-hiero-intro",
          questions: [
            {
              id: "qh1",
              prompt:
                "The owl sign 𓅓 (G017) represents which consonant?",
              kind: "multiple_choice",
              options: ["m", "n", "r", "t"],
              correctIndex: 0,
              explanation:
                "The owl is the uniliteral sign for m — one of the most common signs in any inscription.",
              signId: "G017",
            },
            {
              id: "qh2",
              prompt:
                "What is a determinative?",
              kind: "multiple_choice",
              options: [
                "A sign that adds a vowel sound",
                "A silent sign that clarifies a word's meaning",
                "A numeral",
                "A royal name ring",
              ],
              correctIndex: 1,
              explanation:
                "Determinatives carry no phonetic value; they sit at the end of a word to show its semantic category — e.g. the god sign 𓊹 after divine names.",
              signId: "R008",
            },
          ],
        },
      }),
      lesson({
        id: "l-hiero-uniliteral",
        courseId: "course-hiero",
        order: 2,
        title: "The 24 Consonant Signs",
        slug: "the-24-consonant-signs",
        summary:
          "The uniliteral alphabet — the foundation of every hieroglyphic word.",
        durationMinutes: 15,
        signIds: [
          "G001", "M017", "M017A", "Z004", "D036", "G043", "D058",
          "Q003", "I009", "G017", "N035", "D021", "O004", "V028",
          "Aa001", "F032", "O034", "S029", "N037", "N029", "V031",
          "W011", "X001", "V013", "D046", "I010",
        ],
        sections: [
          {
            heading: "The uniliteral alphabet",
            kind: "prose",
            body: "Middle Egyptian has 24 consonantal phonemes, each written with a uniliteral sign. Egyptologists use a special transliteration alphabet to represent them: ꜣ (alef), j (yod), y, ꜥ (ayin), w, b, p, f, m, n, r, h, ḥ, ḫ, ẖ, z, s, š, q, k, g, t, ṯ, d, ḏ. Learn these 24 signs and you can read the skeleton of any word.",
          },
          {
            heading: "Four H sounds",
            kind: "prose",
            body: "Egyptian distinguishes four h-like sounds, which English merges. They are written with different signs: h (reed shelter, O004), ḥ (twisted wick, V028), ḫ (sieve, Aa001) and ẖ (animal belly and tail, F032). Getting these right matters — ḥ and ḫ can distinguish otherwise identical words.",
          },
          {
            heading: "The full set",
            kind: "signs",
            body: "All 24 uniliteral signs from the Manetho database, in conventional order.",
            signIds: [
              "G001", "M017", "M017A", "Z004", "D036", "G043", "D058",
              "Q003", "I009", "G017", "N035", "D021", "O004", "V028",
              "Aa001", "F032", "O034", "S029", "N037", "N029", "V031",
              "W011", "X001", "V013", "D046", "I010",
            ],
          },
        ],
        quiz: {
          id: "q-hiero-uniliteral",
          questions: [
            {
              id: "qu1",
              prompt:
                "Which sign represents the consonant ꜥ (ayin)?",
              kind: "multiple_choice",
              options: [
                "The forearm 𓂝 (D036)",
                "The mouth 𓂋 (D021)",
                "The bread loaf 𓏏 (X001)",
                "The owl 𓅓 (G017)",
              ],
              correctIndex: 0,
              explanation:
                "The forearm 𓂝 is the uniliteral sign for the pharyngeal consonant ꜥ (ayin).",
              signId: "D036",
            },
            {
              id: "qu2",
              prompt:
                "How many h-like consonants does Middle Egyptian distinguish?",
              kind: "multiple_choice",
              options: ["One", "Two", "Four", "Six"],
              correctIndex: 2,
              explanation:
                "Four: h, ḥ, ḫ and ẖ, each with its own sign and transliteration.",
              signId: "V028",
            },
            {
              id: "qu3",
              prompt:
                "The ripple of water 𓈖 (N035) has which value?",
              kind: "multiple_choice",
              options: ["r", "n", "m", "l"],
              correctIndex: 1,
              explanation:
                "The water ripple is the uniliteral sign for n.",
              signId: "N035",
            },
          ],
        },
      }),
      lesson({
        id: "l-hiero-biliteral",
        courseId: "course-hiero",
        order: 3,
        title: "Biliterals and Triliterals",
        slug: "biliterals-and-triliterals",
        summary:
          "Signs that stand for two or three consonants at once.",
        durationMinutes: 12,
        signIds: ["G005", "R008", "S034", "O001", "F035", "L001", "R011", "D010"],
        sections: [
          {
            heading: "Grouped consonants",
            kind: "prose",
            body: "Beyond the 24 uniliterals, Egyptian uses biliteral signs (two consonants) and triliteral signs (three consonants). The falcon 𓅃 (G005) is the biliteral ḥr; the god standard 𓊹 (R008) is the triliteral nṯr; the ankh 𓋺 (S034) is the triliteral ꜥnḫ.",
          },
          {
            heading: "Signs that are also words",
            kind: "prose",
            body: "Many biliterals and triliterals are simultaneously common words. The house plan 𓉐 (O001) is the biliteral pr and the word 'house' itself. The heart-with-windpipe 𓄤 (F035) is the triliteral nfr and the word 'beautiful'.",
          },
          {
            heading: "Key signs",
            kind: "signs",
            body: "Eight of the most important biliterals and triliterals.",
            signIds: ["G005", "R008", "S034", "O001", "F035", "L001", "R011", "D010"],
          },
        ],
        quiz: {
          id: "q-hiero-biliteral",
          questions: [
            {
              id: "qb1",
              prompt:
                "The god standard 𓊹 (R008) is which triliteral?",
              kind: "multiple_choice",
              options: ["nṯr", "pr", "nfr", "ḫpr"],
              correctIndex: 0,
              explanation:
                "R008 is the triliteral nṯr, 'god', and doubles as the determinative for divine names.",
              signId: "R008",
            },
            {
              id: "qb2",
              prompt:
                "The ankh 𓋺 (S034) means…",
              kind: "multiple_choice",
              options: [
                "'death'",
                "'life'",
                "'king'",
                "'water'",
              ],
              correctIndex: 1,
              explanation:
                "The ankh is the triliteral ꜥnḫ and the ideogram for 'life' — one of the most famous Egyptian signs.",
              signId: "S034",
            },
          ],
        },
      }),
      lesson({
        id: "l-hiero-determinatives",
        courseId: "course-hiero",
        order: 4,
        title: "Determinatives and Ideograms",
        slug: "determinatives-and-ideograms",
        summary:
          "The silent signs that make Egyptian readable.",
        durationMinutes: 10,
        signIds: ["N001", "N005", "N016", "M001", "E001", "F034", "R008", "N025"],
        sections: [
          {
            heading: "Silent guides",
            kind: "prose",
            body: "Determinatives carry no sound. They are placed at the end of a word to signal its category: the god sign 𓊹 after divine names, the foreign-land sign 𓈉 after names of foreign places, the sky sign 𓇯 after celestial words. They are essential for dividing words in an unpunctuated script.",
          },
          {
            heading: "Ideograms",
            kind: "prose",
            body: "An ideogram represents the word itself rather than its sounds. The sun disc 𓇳 can be read as the phonogram rꜥ or directly as the word 'sun'. The heart 𓣣 (F034) is the ideogram ꜥb, 'heart, mind'.",
          },
          {
            heading: "Explore",
            kind: "signs",
            body: "Ideograms and determinatives from the database.",
            signIds: ["N001", "N005", "N016", "M001", "E001", "F034", "R008", "N025"],
          },
        ],
        quiz: {
          id: "q-hiero-determinatives",
          questions: [
            {
              id: "qd1",
              prompt:
                "Which sign follows the names of gods?",
              kind: "multiple_choice",
              options: [
                "The god standard 𓊹 (R008)",
                "The owl 𓅓 (G017)",
                "The bread loaf 𓏏 (X001)",
                "The water ripple 𓈖 (N035)",
              ],
              correctIndex: 0,
              explanation:
                "The triliteral nṯr (R008) doubles as the determinative for divine names.",
              signId: "R008",
            },
            {
              id: "qd2",
              prompt:
                "Determinatives are…",
              kind: "multiple_choice",
              options: [
                "Vowel signs",
                "Silent signs that clarify meaning",
                "Numerals",
                "Royal names",
              ],
              correctIndex: 1,
              explanation:
                "Determinatives have no phonetic value; they classify the word they follow.",
              signId: "N025",
            },
          ],
        },
      }),
    ],
  },
  {
    id: "course-culture",
    title: "Gods, Pharaohs and Mythology",
    slug: "gods-pharaohs-and-mythology",
    description:
      "The pantheon, the king and the great myths — the world that hieroglyphs describe.",
    level: "beginner",
    coverImage: generatedImage({
      seed: "course-culture",
      label: "Gods, Pharaohs and Mythology",
      accent: "terracotta",
      width: 1200,
      height: 630,
    }),
    lessons: [
      lesson({
        id: "l-gods-pantheon",
        courseId: "course-culture",
        order: 1,
        title: "The Egyptian Pantheon",
        slug: "the-egyptian-pantheon",
        summary:
          "Re, Osiris, Isis, Horus, Seth and the many-formed divine world.",
        durationMinutes: 10,
        signIds: ["R008", "N005", "E020", "G005", "I010", "S034"],
        sections: [
          {
            heading: "A flexible pantheon",
            kind: "prose",
            body: "Egyptian religion was local and flexible: the same god could have different names and forms in different towns. Re, the sun god (written with the sun disc 𓇳, N005), was central to royal ideology. Horus (falcon, 𓅃, G005) was the god of kingship. Seth (the Set animal, 𓃪, E020) was both a chaotic force and a protective companion of Re.",
          },
          {
            heading: "Gods and their signs",
            kind: "prose",
            body: "The word for god itself, nṯr, is written with the flag standard 𓊹 (R008), which also serves as the determinative after every divine name. The cobra 𓆓 (I010) represents the uraeus — the protective snake on the royal brow.",
          },
          {
            heading: "Explore the signs",
            kind: "signs",
            body: "Signs connected with the gods.",
            signIds: ["R008", "N005", "E020", "G005", "I010", "S034"],
          },
          {
            heading: "Scholarly caution",
            kind: "note",
            body: "Egyptian mythology survives in fragments — temple texts, coffins and papyri. Modern 'retellings' often fill gaps with invention. Where sources are silent, Manetho says so rather than guessing.",
          },
        ],
        quiz: {
          id: "q-gods-pantheon",
          questions: [
            {
              id: "qg1",
              prompt:
                "The sun disc 𓇳 (N005) represents which god?",
              kind: "multiple_choice",
              options: ["Osiris", "Re", "Anubis", "Thoth"],
              correctIndex: 1,
              explanation:
                "The sun disc is the ideogram rꜥ — the sun and the sun god Re.",
              signId: "N005",
            },
            {
              id: "qg2",
              prompt:
                "The Set animal 𓃪 (E020) is associated with…",
              kind: "multiple_choice",
              options: [
                "The god Seth",
                "The god Osiris",
                "The goddess Isis",
                "The god Thoth",
              ],
              correctIndex: 0,
              explanation:
                "The Set animal is the ideogram stš, the god Seth — a complex figure of chaos and protection.",
              signId: "E020",
            },
          ],
        },
      }),
      lesson({
        id: "l-myth-osiris",
        courseId: "course-culture",
        order: 2,
        title: "The Myth of Osiris",
        slug: "the-myth-of-osiris",
        summary:
          "Death, resurrection and the first mummy — the central Egyptian myth.",
        durationMinutes: 10,
        signIds: ["R011", "S034", "R008", "D010", "N005"],
        sections: [
          {
            heading: "The core story",
            kind: "prose",
            body: "Our main source is Plutarch (1st–2nd century CE), writing centuries after the events he describes, so his version must be read with care. In it, Seth kills Osiris, who becomes ruler of the dead. Isis gathers her husband's body and conceives Horus, who avenges his father and becomes the model for every living king.",
          },
          {
            heading: "The djed pillar",
            kind: "prose",
            body: "The djed pillar 𓊽 (R011), biliteral ḏd, is the emblem of Osiris and means 'endure'. Raised at festivals, it symbolised stability and resurrection. The wedjat eye 𓂀 (D010) — the healed Eye of Horus — signalled wholeness restored.",
          },
          {
            heading: "Explore the signs",
            kind: "signs",
            body: "Signs bound up with the Osiris myth.",
            signIds: ["R011", "S034", "R008", "D010", "N005"],
          },
          {
            heading: "Source note",
            kind: "note",
            body: "Egyptian sources describe the myth through ritual and allusion rather than a single canonical text. Plutarch's account is a late Greek source. Treat any 'complete' version of the myth as an interpretation.",
          },
        ],
        quiz: {
          id: "q-myth-osiris",
          questions: [
            {
              id: "qm1",
              prompt:
                "The djed pillar 𓊽 (R011) is the emblem of…",
              kind: "multiple_choice",
              options: ["Osiris", "Re", "Seth", "Anubis"],
              correctIndex: 0,
              explanation:
                "The djed pillar is the emblem of Osiris and the biliteral ḏd, 'endure'.",
              signId: "R011",
            },
            {
              id: "qm2",
              prompt:
                "Our most complete narrative of the Osiris myth comes from…",
              kind: "multiple_choice",
              options: [
                "Plutarch, a Greek author of the 1st–2nd century CE",
                "The Pyramid Texts",
                "The Rosetta Stone",
                "Howard Carter's notebooks",
              ],
              correctIndex: 0,
              explanation:
                "Plutarch wrote in Greek centuries after the myth's Egyptian heyday — a late, outside source to read with care.",
              signId: "R008",
            },
          ],
        },
      }),
      lesson({
        id: "l-pharaohs-dynasties",
        courseId: "course-culture",
        order: 3,
        title: "Dynasties and Chronology",
        slug: "dynasties-and-chronology",
        summary:
          "How Egyptologists divide 3,000 years into kingdoms and dynasties.",
        durationMinutes: 9,
        signIds: ["M004", "M023", "M025", "N001", "M012"],
        sections: [
          {
            heading: "The framework",
            kind: "prose",
            body: "The division into 30 dynasties comes from the 3rd-century-BCE priest Manetho — the namesake of this platform — whose history survives only in later summaries. Modern Egyptology groups dynasties into the Predynastic, Early Dynastic, Old, Middle and New Kingdoms, plus intermediate periods.",
          },
          {
            heading: "Reading the evidence",
            kind: "prose",
            body: "The king is written with the sedge 𓇓 (M023) and the bee, and 'year' with the palm rib 𓆳 (M004). Chronicle comes from king lists, annals and astronomical observations — all of which leave gaps and disagreements. Absolute dates before c. 1000 BCE carry scholarly uncertainty.",
          },
          {
            heading: "Explore the signs",
            kind: "signs",
            body: "Signs of time and kingship.",
            signIds: ["M004", "M023", "M025", "N001", "M012"],
          },
        ],
        quiz: {
          id: "q-pharaohs-dynasties",
          questions: [
            {
              id: "qp1",
              prompt:
                "The 30-dynasty framework comes from…",
              kind: "multiple_choice",
              options: [
                "Manetho, a 3rd-century-BCE priest",
                "Champollion",
                "Howard Carter",
                "The Rosetta Stone",
              ],
              correctIndex: 0,
              explanation:
                "Manetho of Sebennytos divided Egyptian history into 30 dynasties; his work survives only in later summaries.",
              signId: "M004",
            },
            {
              id: "qp2",
              prompt:
                "The sedge 𓇓 (M023) represents…",
              kind: "multiple_choice",
              options: [
                "The king of Upper Egypt",
                "The king of Lower Egypt",
                "The god Amun",
                "The harvest",
              ],
              correctIndex: 0,
              explanation:
                "The sedge plant is the ideogram n(.y)-sw.t, 'king of Upper Egypt'; the bee represents Lower Egypt.",
              signId: "M023",
            },
          ],
        },
      }),
    ],
  },
  {
    id: "course-world",
    title: "Temples, Tombs and Daily Life",
    slug: "temples-tombs-and-daily-life",
    description:
      "The monuments, the dead and the living — the world the inscriptions record.",
    level: "intermediate",
    coverImage: generatedImage({
      seed: "course-world",
      label: "Temples, Tombs and Daily Life",
      accent: "nile",
      width: 1200,
      height: 630,
    }),
    lessons: [
      lesson({
        id: "l-temples-tombs",
        courseId: "course-world",
        order: 1,
        title: "Temples and Tombs",
        slug: "temples-and-tombs",
        summary:
          "Houses of the gods and eternal homes of the dead.",
        durationMinutes: 11,
        signIds: ["O001", "P001", "R004", "S034", "N024"],
        sections: [
          {
            heading: "The temple",
            kind: "prose",
            body: "Egyptian temples were 'mansions of the gods' — literal houses for divine statues, not gathering places for worshippers. The word for house, pr, is written with the house plan 𓉐 (O001). Temples grew in pylon courts and hypostyle halls, their walls carved with offering scenes and royal annals.",
          },
          {
            heading: "The tomb",
            kind: "prose",
            body: "Tombs were eternal homes: the Old Kingdom mastaba, the pyramid, and the rock-cut tombs of the Valley of the Kings. The boat 𓊛 (P001), biliteral ḫnt, appears in funerary contexts — the solar barque that carried Re through the sky and the underworld.",
          },
          {
            heading: "The Nile",
            kind: "prose",
            body: "Everything sat on the river. The riverbank 𓈄 (N024) is the ideogram wḏb. Egypt's calendar, agriculture and festivals all followed the inundation.",
          },
          {
            heading: "Explore the signs",
            kind: "signs",
            body: "Signs of temples, tombs and the river.",
            signIds: ["O001", "P001", "R004", "S034", "N024"],
          },
        ],
        quiz: {
          id: "q-temples-tombs",
          questions: [
            {
              id: "qt1",
              prompt:
                "Egyptian temples were primarily…",
              kind: "multiple_choice",
              options: [
                "Houses for divine statues",
                "Public meeting halls",
                "Markets",
                "Fortresses",
              ],
              correctIndex: 0,
              explanation:
                "Temples were 'mansions of the gods', served by priests; the public gathered in the outer courts.",
              signId: "O001",
            },
            {
              id: "qt2",
              prompt:
                "The boat sign 𓊛 (P001) is the biliteral…",
              kind: "multiple_choice",
              options: ["ḫnt", "pr", "nṯr", "wḏb"],
              correctIndex: 0,
              explanation:
                "The boat prow is the biliteral ḫnt, 'foremost, chief'.",
              signId: "P001",
            },
          ],
        },
      }),
      lesson({
        id: "l-daily-life",
        courseId: "course-world",
        order: 2,
        title: "Daily Life in Ancient Egypt",
        slug: "daily-life-in-ancient-egypt",
        summary:
          "Bread, beer, ploughs and scribes — the economy of the Nile valley.",
        durationMinutes: 10,
        signIds: ["X001", "W021", "W022", "U001", "U006", "M008", "T017", "Y002"],
        sections: [
          {
            heading: "The staples",
            kind: "prose",
            body: "The Egyptian diet rested on bread 𓏏 (X001) and beer 𓏊 (W022), with wine 𓏉 (W021) for feasts. Agriculture was organised around the inundation: the plough 𓌳 (U001) and ploughshare 𓌸 (U006) appear throughout the corpus, and grain 𓆷 (M008) was both food and tax.",
          },
          {
            heading: "Scribes and soldiers",
            kind: "prose",
            body: "The scribe 𓏞 (Y003), biliteral sš, held a privileged place — 'the scribe' was a career, not just a job. The chariot 𓌝 (T017), biliteral wrr.t, arrived in the New Kingdom and transformed warfare and hunting. The word for 'words' itself, mdw, is written with the papyrus roll 𓏝 (Y002).",
          },
          {
            heading: "Explore the signs",
            kind: "signs",
            body: "Signs of daily life.",
            signIds: ["X001", "W021", "W022", "U001", "U006", "M008", "T017", "Y002"],
          },
        ],
        quiz: {
          id: "q-daily-life",
          questions: [
            {
              id: "qd3",
              prompt:
                "Which two staples anchored the Egyptian diet?",
              kind: "multiple_choice",
              options: [
                "Bread and beer",
                "Rice and fish",
                "Meat and wine",
                "Dates and milk",
              ],
              correctIndex: 0,
              explanation:
                "Bread (X001) and beer (W022) were the daily staples for all classes.",
              signId: "X001",
            },
            {
              id: "qd4",
              prompt:
                "The scribe 𓏞 (Y003) is the biliteral…",
              kind: "multiple_choice",
              options: ["sš", "mdw", "wrr.t", "ḫnt"],
              correctIndex: 0,
              explanation:
                "The scribe's palette is the biliteral sš, 'scribe'.",
              signId: "Y003",
            },
          ],
        },
      }),
    ],
  },
  {
    id: "course-reading",
    title: "Advanced Reading",
    slug: "advanced-reading",
    description:
      "Read real formulae and understand how scholars interpret uncertain texts.",
    level: "advanced",
    coverImage: generatedImage({
      seed: "course-reading",
      label: "Advanced Reading",
      accent: "fayum",
      width: 1200,
      height: 630,
    }),
    lessons: [
      lesson({
        id: "l-offering-formula",
        courseId: "course-reading",
        order: 1,
        title: "Reading an Offering Formula",
        slug: "reading-an-offering-formula",
        summary:
          "The ḥtp-dỉ-nsw formula — the most common text in Egyptian art.",
        durationMinutes: 14,
        signIds: ["R004", "D051", "O001", "R008", "N005", "S034"],
        sections: [
          {
            heading: "The formula",
            kind: "prose",
            body: "The offering formula ḥtp dỉ nsw ('an offering that the king gives') opens most tomb inscriptions. It begins with the offering table 𓊵 (R004), biliteral ḥtp, followed by the hand taking 𓂷 (D051), biliteral ṯꜣꜥ — the verb 'to give' — then the royal name and the recipient, often Osiris or a local god.",
          },
          {
            heading: "A worked example",
            kind: "prose",
            body: "A typical short form reads: ḥtp dỉ nsw wsjr nb Ḏdw — 'an offering that the king gives to Osiris lord of Busiris'. Each element is phonetic: the formula is a fixed phrase whose signs carry both sound and meaning. The ankh 𓋺 (S034) often appears at the end, wishing the recipient 'life'.",
          },
          {
            heading: "How scholars read it",
            kind: "prose",
            body: "Because the formula is so regular, it is a training text for students. But damaged or abbreviated forms are common, and readings of badly weathered signs are hypotheses. Manetho's recognition results always show per-sign confidence so you can see which parts of a reading are secure.",
          },
          {
            heading: "Explore the signs",
            kind: "signs",
            body: "The core signs of the offering formula.",
            signIds: ["R004", "D051", "O001", "R008", "N005", "S034"],
          },
        ],
        quiz: {
          id: "q-offering-formula",
          questions: [
            {
              id: "qo1",
              prompt:
                "The offering formula ḥtp dỉ nsw means…",
              kind: "multiple_choice",
              options: [
                "'An offering that the king gives'",
                "'The king is justified'",
                "'Life, prosperity, health'",
                "'The gods are satisfied'",
              ],
              correctIndex: 0,
              explanation:
                "ḥtp dỉ nsw is the standard offering formula that opens most tomb inscriptions.",
              signId: "R004",
            },
            {
              id: "qo2",
              prompt:
                "The verb 'to give' in the formula is written with…",
              kind: "multiple_choice",
              options: [
                "The hand taking 𓂷 (D051)",
                "The mouth 𓂋 (D021)",
                "The water ripple 𓈖 (N035)",
                "The owl 𓅓 (G017)",
              ],
              correctIndex: 0,
              explanation:
                "D051 is the biliteral ṯꜣꜥ, 'to give' — the verb in the offering formula.",
              signId: "D051",
            },
          ],
        },
      }),
    ],
  },
];

export function findLesson(slugOrId: string): LearningLesson | undefined {
  for (const course of courses) {
    const found = course.lessons.find(
      (l) => l.slug === slugOrId || l.id === slugOrId,
    );
    if (found) return found;
  }
  return undefined;
}

export function allLessons(): LearningLesson[] {
  return courses.flatMap((c) => c.lessons);
}
