"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, Languages } from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Button, IconButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Marketing/workspace header (spec §26).
 * Mobile-first: the menu collapses behind a button below
 * the sm breakpoint and the skip link is the first focusable
 * element for keyboard users (WCAG 2.2).
 */
export function SiteHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/discover" as const, label: t("discover") },
    { href: "/translator" as const, label: t("translate") },
    { href: "/assistant" as const, label: t("assistant") },
    { href: "/museums" as const, label: t("museums") },
    { href: "/learn" as const, label: t("learn") },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-ash/60 bg-obsidian/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:text-obsidian"
      >
        {t("skipToContent")}
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={tc("appName")}
        >
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-md border border-gold/40 bg-charcoal font-hiero text-lg leading-none text-gold"
          >
            <span className="hiero">𓂀</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-wide text-papyrus">
              {tc("appName")}
            </span>
            <span className="mt-0.5 hidden text-[0.65rem] text-sandstone/70 sm:block">
              {tc("tagline")}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="mx-auto hidden items-center gap-1 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive(link.href)
                  ? "bg-gold/12 text-gold-bright"
                  : "text-sandstone hover:bg-slate/70 hover:text-papyrus",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
          <Button
            asChild
            size="sm"
            className="hidden sm:inline-flex"
            variant="outline"
          >
            <Link href="/translator">{t("translate")}</Link>
          </Button>
          <IconButton
            label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
            className="md:hidden"
          >
            {open ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </IconButton>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className="border-t border-ash/60 bg-charcoal px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2.5 text-sm",
                    isActive(link.href)
                      ? "bg-gold/12 text-gold-bright"
                      : "text-sandstone hover:bg-slate/70",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

/**
 * Language switcher (spec §5).
 * Arabic is a first-class locale, not an afterthought:
 * the switch preserves the current page.
 */
function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const tc = useTranslations("common");
  const pathname = usePathname();
  const nextLocale = currentLocale === "ar" ? "en" : "ar";
  const href =
    nextLocale === "en"
      ? pathname
      : (`/ar${pathname === "/" ? "" : pathname}` as never);

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="gap-1.5 px-2"
    >
      <Link
        href={href}
        hrefLang={nextLocale}
        aria-label={`${tc("language")}: ${nextLocale === "ar" ? tc("arabic") : tc("english")}`}
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium uppercase">
          {nextLocale}
        </span>
      </Link>
    </Button>
  );
}