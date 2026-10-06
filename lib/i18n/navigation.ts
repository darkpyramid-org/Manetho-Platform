import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n.config";

/**
 * Locale-aware navigation (spec §5).
 *
 * `Link` and `usePathname` from next-intl automatically
 * prefix the current locale, so components never build
 * hrefs by hand and the Arabic site stays consistent.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/** Text direction for a locale — RTL is first-class (spec §5). */
export function localeDirection(
  locale: string,
): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}