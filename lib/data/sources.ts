import type { Source } from "@/types/common";

/**
 * Bibliographic sources used across the Manetho knowledge base.
 * These are the references the AI assistant cites when answers
 * rely on standard Egyptological literature.
 */

export const GARDINER: Source = {
  id: "src-gardiner",
  title:
    "Egyptian Grammar: Being an Introduction to the Study of Hieroglyphs (3rd ed.)",
  author: "Gardiner, Alan H.",
  publisher: "Griffith Institute, Oxford",
  publicationDate: "1957",
  type: "BOOK",
  citationText:
    "Gardiner, A.H. (1957). Egyptian Grammar (3rd ed.). Oxford: Griffith Institute.",
};

export const UNICODE: Source = {
  id: "src-unicode",
  title:
    "The Unicode Standard — Egyptian Hieroglyphs, block U+13000–U+1342F",
  author: "The Unicode Consortium",
  publicationDate: "2026",
  type: "DATABASE",
  citationText:
    "Unicode Consortium (2026). Egyptian Hieroglyphs, U+13000–U+1342F. The Unicode Standard.",
};

export const ALLEN: Source = {
  id: "src-allen",
  title:
    "Middle Egyptian: An Introduction to the Language and Culture of Hieroglyphs",
  author: "Allen, James P.",
  publisher: "Cambridge University Press",
  publicationDate: "2000",
  type: "BOOK",
  citationText:
    "Allen, J.P. (2000). Middle Egyptian. Cambridge: Cambridge University Press.",
};

export const ERMAN: Source = {
  id: "src-erman",
  title: "Wörterbuch der aegyptischen Sprache",
  author: "Erman, A. & Grapow, H.",
  publisher: "Akademie-Verlag, Berlin",
  publicationDate: "1926–1961",
  type: "BOOK",
  citationText:
    "Erman, A. & Grapow, H. (1926–1961). Wörterbuch der aegyptischen Sprache. Berlin.",
};

export const BUDGE: Source = {
  id: "src-budge",
  title: "The Egyptian Book of the Dead (The Book of Going Forth by Day)",
  author: "Budge, E.A. Wallis (trans.)",
  publisher: "Chronicle Books",
  publicationDate: "1994",
  type: "BOOK",
  citationText:
    "Budge, E.A.W. (1994). The Egyptian Book of the Dead. San Francisco: Chronicle Books.",
};

export const TYLDESLEY: Source = {
  id: "src-tyldesley",
  title: "Egypt: How a Lost Civilization Was Rediscovered",
  author: "Tyldesley, Joyce",
  publisher: "Thames & Hudson",
  publicationDate: "2005",
  type: "BOOK",
  citationText:
    "Tyldesley, J. (2005). Egypt: How a Lost Civilization Was Rediscovered. London: Thames & Hudson.",
};

export const STANDING_SOURCES: Source[] = [GARDINER, UNICODE];

export const ALL_SOURCES: Source[] = [
  GARDINER,
  UNICODE,
  ALLEN,
  ERMAN,
  BUDGE,
  TYLDESLEY,
];
