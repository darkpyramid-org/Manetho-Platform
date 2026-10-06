export const site = {
  name: "Manetho",
  tagline: "Ancient Egypt, understood through AI.",
  statement: "Decode the past. Understand civilization.",
  description:
    "Manetho is an AI-powered cultural heritage platform that transforms ancient artifacts, hieroglyphic inscriptions, museums, and historical knowledge into interactive digital experiences.",
  url: process.env.APP_URL ?? "http://localhost:3000",
  localeDefault: "en",
  locales: ["en", "ar"] as const,
  year: 2026,
} as const;

export const brand = {
  /** Gardiner G001 — Egyptian vulture, the alef sign. Manetho's mark. */
  mark: "𓄿",
  markUnicode: "U+1313F",
  markGardiner: "G001",
} as const;

export const social = {
  twitter: "https://twitter.com/manetho",
  github: "https://github.com/manetho",
} as const;
