import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession, can } from "@/lib/auth/session";
import { artifacts, museums, tourRepository } from "@/lib/data";
import { routing, type Locale } from "@/i18n.config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Tour management (spec §47). */
export default async function AdminToursPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tm = await getTranslations({ locale, namespace: "museums" });
  const session = await getSession();

  if (!can(session, "content:write")) {
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

  const tours = tourRepository.list();
  const museumName = new Map(museums.map((m) => [m.id, m.name]));
  const artifactName = new Map(artifacts.map((a) => [a.id, a.name]));

  return (
    <section aria-labelledby="tours-title">
      <AdminSectionHeader
        title={t("nav.tours")}
        count={tours.length}
        description={t("toursDescription")}
      />

      <div className="space-y-4">
        {tours.map((tour) => {
          // A stop pointing at an object in another museum
          // would send a visitor on a walk that cannot happen.
          const misplaced = tour.stops.filter((stop) => {
            const artifact = artifacts.find((a) => a.id === stop.artifactId);
            return artifact && artifact.museumId !== tour.museumId;
          }).length;

          return (
            <Card key={tour.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg text-papyrus">
                      {tour.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-sandstone/60">
                      {museumName.get(tour.museumId) ?? "—"}
                      {tour.theme ? ` · ${tour.theme}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="info">
                      {tm("tourStops", { count: tour.stops.length })}
                    </Badge>
                    <Badge tone="neutral">
                      {tm("tourDuration", {
                        minutes: tour.durationMinutes,
                      })}
                    </Badge>
                    <Badge
                      tone={
                        tour.accessibility === "full"
                          ? "success"
                          : "warning"
                      }
                    >
                      {tour.accessibility === "full"
                        ? tm("accessibilityFull")
                        : tm("accessibilityPartial")}
                    </Badge>
                    <Badge
                      tone={tour.status === "PUBLISHED" ? "success" : "neutral"}
                    >
                      {t(tour.status.toLowerCase())}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-sandstone/85">
                  {tour.description}
                </p>

                <ol className="flex flex-wrap gap-1.5">
                  {tour.stops.map((stop) => (
                    <li
                      key={stop.id}
                      className="rounded border border-ash/60 bg-obsidian px-2 py-1 text-xs text-sandstone/80"
                    >
                      <span className="text-gold">{stop.order}</span>{" "}
                      {stop.artifactId
                        ? (artifactName.get(stop.artifactId) ?? stop.title)
                        : stop.title}
                    </li>
                  ))}
                </ol>

                {misplaced > 0 ? (
                  <p className="text-xs text-danger">
                    {misplaced} stop(s) reference an object outside this
                    museum
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}