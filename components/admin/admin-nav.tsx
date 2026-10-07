"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Admin section navigation (spec §47).
 *
 * Only sections that are actually implemented appear here. The
 * catalogue previously listed nine sections while two existed,
 * which is how a feature ends up "missing" without anyone
 * noticing — a link to a page that was never built is worse
 * than no link at all.
 *
 * A client component because usePathname is a client hook; the
 * active-section highlight needs to react to navigation.
 */
const SECTIONS = [
  { href: "/admin", key: "overview" },
  { href: "/admin/artifacts", key: "artifacts" },
  { href: "/admin/museums", key: "museums" },
  { href: "/admin/hieroglyphs", key: "hieroglyphs" },
  { href: "/admin/lessons", key: "lessons" },
  { href: "/admin/tours", key: "tours" },
  { href: "/admin/reviews", key: "reviews" },
] as const;

export function AdminNav() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <nav aria-label={t("title")} className="mb-8">
      <ul className="flex flex-wrap gap-1.5 border-b border-ash/60 pb-3">
        {SECTIONS.map((section) => {
          const active =
            section.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(section.href);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block rounded-md px-3 py-1.5 text-sm",
                  "transition-colors duration-150",
                  active
                    ? "bg-gold/12 font-medium text-gold-bright"
                    : "text-sandstone hover:bg-slate/70 hover:text-papyrus",
                )}
              >
                {t(`nav.${section.key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}