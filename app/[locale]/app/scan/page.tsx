import { getTranslations, setRequestLocale } from "next-intl/server";
import { Translator } from "@/components/translator/translator";
import { manualSignPalette } from "@/lib/data/sign-refs";
import { sampleInscriptions } from "@/lib/data";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

/** In-gallery scanner (spec §16, §23). */
export default async function ScanPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "app" });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-papyrus">
          {t("nav.scan")}
        </h1>
        <p className="mt-2 text-sm text-sandstone">{t("subtitle")}</p>
      </header>

      <Translator samples={sampleInscriptions()} palette={manualSignPalette()} />
    </div>
  );
}