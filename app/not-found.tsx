import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n.config";

/**
 * Root not-found (spec §34).
 * Sends visitors to the default locale's home page, since a
 * localized 404 would need to know which locale was lost.
 */
export default async function NotFound() {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "common",
  });

  return (
    <html lang={routing.defaultLocale} dir="ltr">
      <body className="grid min-h-dvh place-items-center bg-obsidian px-4 text-papyrus">
        <main className="max-w-md text-center">
          <p
            aria-hidden="true"
            className="hiero text-7xl leading-none text-gold/40"
          >
            𓂀
          </p>
          <h1 className="mt-6 font-display text-3xl">
            {t("notFound")}
          </h1>
          <p className="mt-3 text-sandstone">
            {t("notFoundDescription")}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-11 items-center rounded-md bg-gold px-6 text-sm font-medium text-obsidian transition-colors hover:bg-gold-bright"
          >
            {t("goHome")}
          </Link>
        </main>
      </body>
    </html>
  );
}