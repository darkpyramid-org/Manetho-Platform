import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession, can } from "@/lib/auth/session";
import { artifactsByMuseum, museums } from "@/lib/data";
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

/** Content management: museums and their floor plans (spec §47). */
export default async function AdminMuseumsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tm = await getTranslations({ locale, namespace: "museums" });
  const session = await getSession();

  // Read-only view of museum records and floor plans; nothing
  // here mutates anything.
  if (!can(session, "content:read")) {
    return (
      <Card className="border-warning/40">
        <CardContent className="p-5">
          <p className="text-sm text-sandstone">
            {t("roleRequired")}{" "}
            {t("roleRequiredBody", { role: "MUSEUM_ADMIN" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="museums-title">
      <AdminSectionHeader
        title={t("nav.museums")}
        count={museums.length}
        description={t("museumsDescription")}
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {museums.map((museum) => {
          const rooms = museum.floors.flatMap((floor) => floor.rooms);
          const objects = artifactsByMuseum(museum.id).length;
          const stepFree = rooms.every((room) => room.accessibility);

          return (
            <li key={museum.id}>
              <Card className="h-full">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-lg text-papyrus">
                      {museum.name}
                    </h3>
                    <Badge tone={TONE[museum.status]}>
                      {t(museum.status.toLowerCase())}
                    </Badge>
                  </div>

                  <p className="text-xs text-sandstone/60">
                    {museum.city}, {museum.country} · {museum.slug}
                  </p>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sandstone/55">
                        {tm("floor")}
                      </dt>
                      <dd className="text-papyrus">
                        {museum.floors.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sandstone/55">
                        {tm("galleries")}
                      </dt>
                      <dd className="text-papyrus">{rooms.length}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sandstone/55">
                        {tm("showObjects")}
                      </dt>
                      <dd className="text-papyrus">{objects}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-sandstone/55">
                        {tm("accessibility")}
                      </dt>
                      <dd className="text-papyrus">
                        {stepFree
                          ? tm("accessibilityFull")
                          : tm("accessibilityPartial")}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}