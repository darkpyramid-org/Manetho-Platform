import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ConfidenceBadge, DemoBadge } from "@/components/ui/badge";
import { getSession, can } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/features";
import { hieroglyphRepository, sampleInscriptions } from "@/lib/data";
import { listForReview } from "@/lib/server/translations";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

/**
 * AI review queue (spec §48).
 *
 * Reads the real Translation table: every reading a visitor has
 * produced, newest first, with the sign count and the confidence
 * the visitor saw. When no database is configured it falls back
 * to the seeded sample readings, so the page is never empty —
 * but the fallback says so rather than implying a live queue.
 */
export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const session = await getSession();

  if (!can(session, "ai:review")) {
    return (
      <Card className="border-warning/40">
        <CardHeader>
          <CardTitle>{t("roleRequired")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-sandstone">
            {t("roleRequiredBody", { role: "RESEARCHER" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const stored = await listForReview();
  const live = stored.length > 0;

  // With no database configured, show the seeded reference
  // readings so the queue's shape is still inspectable.
  const rows = live
    ? stored.map((entry) => ({
        key: entry.id,
        title: entry.translation,
        transliteration: entry.transliteration,
        detail: `${entry.signCount} signs · ${entry.provider}${entry.isDemo ? " (demo)" : ""}`,
        confidence: entry.overallConfidence ?? 0,
        status: entry.status,
        createdAt: entry.createdAt,
      }))
    : sampleInscriptions().map((sample) => ({
        key: sample.id,
        title: sample.label,
        transliteration: sample.signIds
          .map((code) => signTransliteration(code))
          .join(" "),
        detail: `${sample.signIds.length} signs · seed fixture`,
        confidence: 0.82,
        status: "SEED",
        createdAt: null as string | null,
      }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl text-papyrus">
          {t("nav.reviews")}
        </h2>
        {isDemoMode() ? <DemoBadge label="Demo output" /> : null}
        <Badge tone={live ? "success" : "neutral"}>
          {live ? "PostgreSQL" : "Seed fixtures"}
        </Badge>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-sandstone/70">{t("roleRequired")}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.key}>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      {row.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge
                        level={
                          row.confidence >= 0.85
                            ? "high"
                            : row.confidence >= 0.6
                              ? "medium"
                              : "low"
                        }
                        value={row.confidence}
                      />
                      <Badge tone="warning">{row.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p dir="ltr" className="font-mono text-lg text-gold">
                    {row.transliteration}
                  </p>
                  <p className="text-xs text-sandstone/60">
                    {row.detail}
                    {row.createdAt
                      ? ` · ${new Date(row.createdAt).toISOString().slice(0, 16).replace("T", " ")}`
                      : ""}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Badge tone="success">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {t("approve")}
                    </Badge>
                    <Badge tone="danger">
                      <X className="h-3 w-3" aria-hidden="true" />
                      {t("reject")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function signTransliteration(code: string): string {
  const sign = hieroglyphRepository.get(code);
  if (!sign) return code;
  return sign.phoneticValues.join("") || sign.ideographicMeaning || "";
}