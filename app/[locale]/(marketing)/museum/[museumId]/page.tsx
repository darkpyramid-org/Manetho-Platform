import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Accessibility,
  BookOpen,
  Clock,
  ExternalLink,
  MapPin,
  Route,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { MuseumFloorPlan } from "@/components/museums/museum-floor-plan";
import { ArtifactGrid } from "@/components/artifacts/artifact-card";
import {
  artifactsByMuseum,
  findMuseum,
  museumCover,
  museums,
  tourRepository,
} from "@/lib/data";
import { routing, type Locale } from "@/i18n.config";

/**
 * Every param must be returned for a nested dynamic route.
 * Returning only the locale leaves the [museumId] segment
 * unresolved, so Next cannot prerender these pages and falls
 * back to on-demand rendering — which then fails with
 * DYNAMIC_SERVER_USAGE.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    museums.map((museum) => ({ locale, museumId: museum.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; museumId: string }>;
}): Promise<Metadata> {
  const { museumId } = await params;
  const museum = findMuseum(museumId);
  if (!museum) return {};
  return {
    title: museum.name,
    description: museum.description.slice(0, 160),
  };
}

/** Museum detail: map, objects, tours (spec §14, §15). */
export default async function MuseumPage({
  params,
}: {
  params: Promise<{ locale: Locale; museumId: string }>;
}) {
  const { locale, museumId } = await params;
  setRequestLocale(locale);

  const museum = findMuseum(museumId);
  if (!museum) notFound();

  const t = await getTranslations({ locale, namespace: "museums" });
  const ta = await getTranslations({ locale, namespace: "artifact" });

  const objects = artifactsByMuseum(museum.id);
  const tours = tourRepository.byMuseum(museum.id);
  const roomCount = museum.floors.reduce(
    (total, floor) => total + floor.rooms.length,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="relative mb-10 overflow-hidden rounded-xl border border-ash/70">
        <div className="relative aspect-3/1 bg-obsidian">
          <Image
            src={museum.coverImage ?? museumCover(museum.slug, museum.name)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/70 to-transparent"
          />
        </div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {museum.city}, {museum.country}
            </Badge>
            <Badge tone="neutral">
              {t("objectsCount", { count: objects.length })}
            </Badge>
            <Badge tone="neutral">
              {museum.floors.length} {t("floor")} · {roomCount}{" "}
              {t("galleries")}
            </Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl text-papyrus sm:text-4xl">
            {museum.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sandstone">
            {museum.description}
          </p>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-sandstone/60">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {t("openingHours")}
              </dt>
              <dd className="mt-1 text-papyrus">{museum.openingHours}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-sandstone/60">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {t("address")}
              </dt>
              <dd className="mt-1 text-papyrus">{museum.address}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-sandstone/60">
                <Accessibility className="h-3 w-3" aria-hidden="true" />
                {t("accessibility")}
              </dt>
              <dd className="mt-1 text-papyrus">
                {museum.floors
                  .flatMap((floor) => floor.rooms)
                  .every((room) => room.accessibility)
                  ? t("accessibilityFull")
                  : t("accessibilityPartial")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-sandstone/60">
                {t("website")}
              </dt>
              <dd className="mt-1">
                {museum.website ? (
                  <a
                    href={museum.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gold hover:underline"
                  >
                    {museum.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-sandstone/60">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">{t("floorPlan")}</TabsTrigger>
          <TabsTrigger value="objects">{t("showObjects")}</TabsTrigger>
          <TabsTrigger value="tours">{t("tours")}</TabsTrigger>
        </TabsList>

        {/* Floor plan */}
        <TabsContent value="map">
          <MuseumFloorPlan museum={museum} artifacts={objects} />
        </TabsContent>

        {/* Objects */}
        <TabsContent value="objects">
          <section aria-labelledby="objects-title" className="space-y-5">
            <h2 id="objects-title" className="sr-only">
              {t("showObjects")}
            </h2>
            {museum.floors.map((floor) => {
              const floorObjects = objects.filter(
                (artifact) =>
                  floor.rooms.some(
                    (room) => room.id === artifact.locationRoomId,
                  ),
              );
              if (floorObjects.length === 0) return null;
              return (
                <div key={floor.id} className="space-y-3">
                  <h3 className="font-display text-xl text-papyrus">
                    {floor.name}
                  </h3>
                  <ArtifactGrid
                    artifacts={floorObjects}
                    emptyLabel={t("noObjects")}
                  />
                </div>
              );
            })}
          </section>
        </TabsContent>

        {/* Tours */}
        <TabsContent value="tours">
          {tours.length === 0 ? (
            <p className="text-sm text-sandstone/70">{t("noTours")}</p>
          ) : (
            <ul className="grid gap-5 md:grid-cols-2">
              {tours.map((tour) => (
                <li key={tour.id}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">
                          <Route className="h-3 w-3" aria-hidden="true" />
                          {t("tourStops", { count: tour.stops.length })}
                        </Badge>
                        <Badge tone="neutral">
                          {t("tourDuration", {
                            minutes: tour.durationMinutes,
                          })}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{tour.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed text-sandstone/85">
                        {tour.description}
                      </p>
                      <ol className="space-y-1.5">
                        {tour.stops.map((stop) => {
                          const artifact = objects.find(
                            (entry) => entry.id === stop.artifactId,
                          );
                          return (
                            <li
                              key={stop.id}
                              className="flex items-center gap-2 text-xs text-sandstone/75"
                            >
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gold/40 text-[0.6rem] text-gold">
                                {stop.order}
                              </span>
                              <span className="truncate">
                                {artifact?.name ?? stop.title}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/app/tours?tour=${tour.id}`}>
                          {t("startTour")}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      {/* Records */}
      <section className="mt-14" aria-labelledby="sources-title">
        <h2
          id="sources-title"
          className="flex items-center gap-2 font-display text-lg text-papyrus"
        >
          <BookOpen className="h-4 w-4 text-gold" aria-hidden="true" />
          {ta("sourcesTitle")}
        </h2>
        <ul className="mt-3 space-y-1.5">
          {museum.sources.map((source) => (
            <li
              key={source.id}
              className="text-xs leading-relaxed text-sandstone/70"
            >
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  {source.citationText}
                </a>
              ) : (
                source.citationText
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}