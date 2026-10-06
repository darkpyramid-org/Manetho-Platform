import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Route } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { artifacts, museums, tours } from "@/lib/data";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

/** Guided tours list (spec §15). */
export default async function ToursPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "museums" });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-papyrus">
          {t("tours")}
        </h1>
        <p className="mt-2 text-sm text-sandstone">{t("subtitle")}</p>
      </header>

      {tours.length === 0 ? (
        <p className="text-sm text-sandstone/70">{t("noTours")}</p>
      ) : (
        <ul className="space-y-4">
          {tours.map((tour) => {
            const museum = museums.find(
              (entry) => entry.id === tour.museumId,
            );
            return (
              <li key={tour.id}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">
                        <Route className="h-3 w-3" aria-hidden="true" />
                        {t("tourStops", { count: tour.stops.length })}
                      </Badge>
                      <Badge tone="neutral">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {t("tourDuration", {
                          minutes: tour.durationMinutes,
                        })}
                      </Badge>
                      {museum ? (
                        <Badge tone="gold">{museum.name}</Badge>
                      ) : null}
                    </div>
                    <CardTitle className="mt-2">{tour.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-sandstone/85">
                      {tour.description}
                    </p>
                    <ol className="space-y-2">
                      {tour.stops.map((stop) => {
                        const artifact = artifacts.find(
                          (entry) => entry.id === stop.artifactId,
                        );
                        return (
                          <li
                            key={stop.id}
                            className="flex gap-3 text-sm text-sandstone/80"
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gold/40 text-[0.65rem] text-gold">
                              {stop.order}
                            </span>
                            <span>
                              {artifact ? (
                                <Link
                                  href={`/artifact/${artifact.slug}`}
                                  className="text-papyrus hover:text-gold-bright"
                                >
                                  {artifact.name}
                                </Link>
                              ) : (
                                stop.title
                              )}
                              <span className="block text-xs text-sandstone/60">
                                {artifact?.period}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    <Button asChild size="sm">
                      <Link href={`/app/tours?tour=${tour.id}`}>
                        {t("startTour")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}