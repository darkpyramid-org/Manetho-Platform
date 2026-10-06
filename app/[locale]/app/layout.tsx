import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Visitor workspace (spec §16).
 *
 * A distinct shell from the marketing pages: no footer, a
 * persistent bottom/side navigation, and offline-first
 * affordances for use inside a museum where connectivity is
 * poor.
 */
export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next.js types route params as plain strings; the layout
  // only needs the locale to pick the right message catalog.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "app" });

  return <AppShell title={t("title")}>{children}</AppShell>;
}