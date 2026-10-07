import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Translator } from "@/components/translator/translator";
import { manualSignPalette } from "@/lib/data/sign-refs";
import { DemoBadge } from "@/components/ui/badge";
import { sampleInscriptions } from "@/lib/data";
import { isDemoMode } from "@/lib/features";
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
  const t = await getTranslations({ locale, namespace: "translate" });
  return { title: t("title"), description: t("subtitle") };
}

/** Translator page (spec §20). */
export default async function TranslatorPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "translate" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const samples = sampleInscriptions();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-papyrus sm:text-4xl">
            {t("title")}
          </h1>
          {isDemoMode() ? <DemoBadge label={tc("demoMode")} /> : null}
        </div>
        <p className="mt-3 max-w-2xl text-sandstone">
          {t("subtitle")}
        </p>
        {/* Spec §86: state plainly where a reading came from.
            This string existed in both catalogues and was never
            rendered, so the page claimed demo mode with a badge
            while never explaining what "demo" means. */}
        {isDemoMode() ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sandstone/75">
            {t("demoProviderNotice")}
          </p>
        ) : null}
      </header>

      <Translator samples={samples} palette={manualSignPalette()} />
    </div>
  );
}