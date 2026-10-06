"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Compass,
  Home,
  Map as MapIcon,
  Route,
  ScanLine,
  MessageSquareText,
  WifiOff,
  Download,
} from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", key: "home", icon: Home, exact: true },
  { href: "/app/scan", key: "scan", icon: ScanLine, exact: false },
  { href: "/app/tours", key: "tours", icon: Route, exact: false },
  { href: "/app/map", key: "map", icon: MapIcon, exact: false },
  { href: "/assistant", key: "assistant", icon: MessageSquareText, exact: false },
] as const;

/**
 * Workspace shell (spec §16).
 *
 * Bottom navigation on phones, a rail on larger screens. The
 * connection indicator and install prompt support the offline
 * and PWA requirements (spec §73).
 */
export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const t = useTranslations("app");
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col bg-obsidian">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-ash/60 bg-obsidian/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded border border-gold/40 bg-charcoal font-hiero text-sm leading-none text-gold"
            >
              <span className="hiero">𓂀</span>
            </span>
            <span className="font-display text-base text-papyrus">
              {title}
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-2">
            {!online ? (
              <span
                className="flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[0.7rem] text-warning"
                role="status"
              >
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                {t("offline")}
              </span>
            ) : null}
            {installable ? (
              <InstallButton setInstallable={setInstallable} />
            ) : null}
          </div>
        </div>

        {!online ? (
          <p className="border-t border-ash/60 bg-charcoal px-4 py-2 text-xs leading-relaxed text-sandstone/80">
            {t("offlineBody")}
          </p>
        ) : null}
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6">
        {children}
      </main>

      {/* Bottom navigation (mobile-first) */}
      <nav
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ash/60 bg-obsidian/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:inset-x-auto md:border-e md:border-t-0 md:pe-0 md:ps-4"
      >
        <ul className="mx-auto flex max-w-5xl items-stretch justify-around md:h-full md:max-w-56 md:flex-col md:items-stretch md:justify-start md:gap-1 md:py-6">
          {NAV.map((entry) => {
            const active = isActive(entry.href, entry.exact);
            return (
              <li key={entry.key} className="flex-1 md:flex-none">
                <Link
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 text-[0.7rem] md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm",
                    "transition-colors",
                    active
                      ? "text-gold"
                      : "text-sandstone hover:text-papyrus",
                  )}
                >
                  <entry.icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{t(`nav.${entry.key}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** PWA install prompt (spec §73). */
function InstallButton({
  setInstallable,
}: {
  setInstallable: (value: boolean) => void;
}) {
  const t = useTranslations("app");

  const install = async () => {
    // The browser only fires beforeinstallprompt once, so the
    // event is captured here and the deferred prompt reused.
    const event = await new Promise<{
      prompt: () => Promise<void>;
    } | null>((resolve) => {
      window.addEventListener(
        "beforeinstallprompt",
        (next) => resolve(next as unknown as { prompt: () => Promise<void> }),
        { once: true },
      );
      // If the event already fired, fall back to instructions.
      setTimeout(() => resolve(null), 800);
    });
    if (event) {
      await event.prompt();
      return;
    }
    setInstallable(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={() => void install()}>
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      {t("installButton")}
    </Button>
  );
}

/** Compact offline badge used inside workspace pages. */
export function OfflineNote() {
  const t = useTranslations("app");
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <p className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      {t("offlineBody")}
    </p>
  );
}

/** Compass glyph used in workspace headers. */
export function WorkspaceMark() {
  return (
    <Compass className="h-5 w-5 text-gold" aria-hidden="true" />
  );
}