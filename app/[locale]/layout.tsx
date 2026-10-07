import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing } from "@/i18n.config";
import { localeDirection } from "@/lib/i18n/navigation";
import { isDemoMode } from "@/lib/features";
import { fontVariables } from "@/lib/fonts";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

/** Pre-render both locales. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  // Both themes declare a browser-chrome colour, so the address
  // bar is not obsidian on a light page or vice versa.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e7" },
    { media: "(prefers-color-scheme: dark)", color: "#09090d" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: t("title"),
      template: `%s · ${t("title")}`,
    },
    description: t("description"),
    keywords: t("keywords"),
    applicationName: "Manetho",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Manetho",
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: "website",
      siteName: "Manetho",
      title: t("title"),
      description: t("description"),
      locale: locale === "ar" ? "ar_EG" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    icons: {
      icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icons/icon.svg" }],
    },
    other: {
      "x-demo-mode": isDemoMode() ? "true" : "false",
    },
  };
}

/**
 * Root layout (spec §4).
 * Renders <html>/<body> with the correct text direction so
 * Arabic is right-to-left from the very first paint.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  const dir = localeDirection(locale);
  // Messages are loaded once here and shared with every
  // client component, so useTranslations works in both
  // server and client components (spec §5).
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={dir}
      className={fontVariables(locale)}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-obsidian text-papyrus antialiased">
        {/* Applies the stored or system theme before first
            paint, so there is no flash of the wrong theme. */}
        <ThemeScript />
        <NextIntlClientProvider
          locale={locale}
          timeZone="UTC"
          messages={messages}
        >
          {children}
          <ServiceWorkerRegistration />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}