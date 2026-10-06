import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AssistantChat } from "@/components/assistant/assistant-chat";
import { DemoBadge } from "@/components/ui/badge";
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
  const t = await getTranslations({ locale, namespace: "assistant" });
  return { title: t("title"), description: t("subtitle") };
}

/** Assistant page (spec §74). */
export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "assistant" });
  const td = await getTranslations({ locale, namespace: "assistant" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-papyrus sm:text-4xl">
            {t("title")}
          </h1>
          {isDemoMode() ? <DemoBadge label="Demo mode" /> : null}
        </div>
        <p className="mt-3 max-w-2xl text-sandstone">{t("subtitle")}</p>
        {isDemoMode() ? (
          <p className="mt-3 max-w-2xl rounded-md border border-gold/30 bg-gold/8 p-3 text-xs leading-relaxed text-gold-bright">
            {td("demoNotice")}
          </p>
        ) : null}
      </header>

      <AssistantChat />
    </div>
  );
}