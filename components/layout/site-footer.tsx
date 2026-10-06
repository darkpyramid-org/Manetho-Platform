import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";

/**
 * Site footer (spec §34).
 * The demo-data notice and the no-fabricated-AI statement
 * live here permanently, not as a dismissible toast —
 * they are part of the product's honesty (spec §86).
 */
export function SiteFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

  const product = [
    { href: "/translator" as const, label: t("translate") },
    { href: "/assistant" as const, label: t("assistant") },
    { href: "/museums" as const, label: t("museums") },
    { href: "/learn" as const, label: t("learn") },
  ];

  const resources = [
    { href: "/discover?type=sign" as const, label: t("signs") },
    { href: "/discover" as const, label: t("docs") },
  ];

  return (
    <footer className="mt-24 border-t border-ash/60 bg-charcoal">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-md border border-gold/40 bg-obsidian font-hiero text-lg leading-none text-gold"
              >
                <span className="hiero">𓂀</span>
              </span>
              <span className="font-display text-lg text-papyrus">
                {t("tagline")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-sandstone/80">
              {t("noFakeAi")}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-sandstone/60">
              {t("demoNotice")}
            </p>
          </div>

          <nav aria-labelledby="footer-product">
            <h2
              id="footer-product"
              className="font-display text-sm uppercase tracking-widest text-gold"
            >
              {t("product")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-sandstone transition-colors hover:text-gold-bright"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-resources">
            <h2
              id="footer-resources"
              className="font-display text-sm uppercase tracking-widest text-gold"
            >
              {t("resources")}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {resources.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-sandstone transition-colors hover:text-gold-bright"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-sandstone/50">
              <Link
                href="/admin"
                className="transition-colors hover:text-sandstone"
              >
                {tn("admin")}
              </Link>
            </p>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ash/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-sandstone/60">
            {t("rights", { year: new Date().getFullYear() })}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-sandstone/60">
            <li>{t("privacy")}</li>
            <li>{t("terms")}</li>
            <li>{t("accessibility")}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}