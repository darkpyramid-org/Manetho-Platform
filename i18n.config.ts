export const routing = {
  locales: ["en", "ar"] as const,
  defaultLocale: "en",
  // Default locale (English) has no prefix: /translator
  // Other locales are prefixed: /ar/translator
  localePrefix: "as-needed",
} as const;

export type Locale = (typeof routing.locales)[number];

export default routing;
