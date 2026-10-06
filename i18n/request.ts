import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n.config";

/**
 * Per-request i18n configuration (spec §5).
 *
 * Resolves the active locale from the request and loads
 * only that locale's message catalog, so Arabic visitors
 * never download the English bundle.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as never)
    ? (requested as (typeof routing.locales)[number])
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});