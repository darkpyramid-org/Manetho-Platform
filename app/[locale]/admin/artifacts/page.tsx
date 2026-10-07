import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession, can } from "@/lib/auth/session";
import { artifacts, museums } from "@/lib/data";
import { routing, type Locale } from "@/i18n.config";
import type { ContentStatus } from "@/types/common";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const TONE: Record<ContentStatus, "success" | "warning" | "neutral"> = {
  PUBLISHED: "success",
  REVIEW: "warning",
  DRAFT: "neutral",
  ARCHIVED: "neutral",
};

/** Content management: objects (spec §47). */
export default async function AdminArtifactsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const ta = await getTranslations({ locale, namespace: "artifact" });
  const tm = await getTranslations({ locale, namespace: "museums" });
  const session = await getSession();

  // Read-only view: it lists the dataset and mutates nothing,
  // so it is gated on content:read. Guest holds that.
  if (!can(session, "content:read")) {
    return (
      <Card className="border-warning/40">
        <CardContent className="p-5">
          <p className="text-sm text-sandstone">
            {t("roleRequired")}{" "}
            {t("roleRequiredBody", { role: "MUSEUM_EDITOR" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const museumName = new Map(museums.map((m) => [m.id, m.name]));

  return (
    <section aria-labelledby="artifacts-title">
      <AdminSectionHeader
        title={t("nav.artifacts")}
        count={artifacts.length}
        description={t("artifactsDescription")}
      />

      <div className="overflow-x-auto rounded-lg border border-ash/70">
        <table className="w-full min-w-[44rem] text-start text-sm">
          <caption className="sr-only">{t("nav.artifacts")}</caption>
          <thead>
            <tr className="border-b border-ash/60 bg-charcoal text-start text-xs uppercase tracking-wide text-sandstone/60">
              <th scope="col" className="px-4 py-3 text-start">
                {ta("title")}
              </th>
              <th scope="col" className="px-4 py-3 text-start">
                {t("status")}
              </th>
              <th scope="col" className="px-4 py-3 text-start">
                {tc("period")}
              </th>
              <th scope="col" className="px-4 py-3 text-start">
                {tc("inventory")}
              </th>
              <th scope="col" className="px-4 py-3 text-start">
                {tm("title")}
              </th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((artifact) => (
              <tr
                key={artifact.id}
                className="border-b border-ash/30 last:border-0"
              >
                <th
                  scope="row"
                  className="px-4 py-2.5 text-start font-normal text-papyrus"
                >
                  {artifact.name}
                </th>
                <td className="px-4 py-2.5">
                  <Badge tone={TONE[artifact.status]}>
                    {t(artifact.status.toLowerCase())}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-sandstone/80">
                  {artifact.period}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-sandstone/70">
                  {artifact.inventoryNumber}
                </td>
                <td className="px-4 py-2.5 text-sandstone/80">
                  {museumName.get(artifact.museumId) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}