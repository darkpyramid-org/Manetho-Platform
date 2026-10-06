import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Accessibility, Clock, Route } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { artifactsByMuseum, museums, museumCover, tourRepository } from "@/lib/data";
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
  const t = await getTranslations({ locale, namespace: "museums" });
  return { title: t("title"), description: t("subtitle") };
}

/** Museums index (spec §18). */
export default async function MuseumsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "museums" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl text-papyrus sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-sandstone">{t("subtitle")}</p>
      </header>

      <ul className="grid gap-6 md:grid-cols-2">
        {museums.map((museum) => {
          const objectCount = artifactsByMuseum(museum.id).length;
          const tourCount = tourRepository.byMuseum(museum.id).length;

          return (
            <li key={museum.id}>
              <Card className="h-full overflow-hidden">
                <Link
                  href={`/museum/${museum.slug}`}
                  className="flex h-full flex-col focus-visible:outline-none"
                >
                  <div className="relative aspect-3/1 overflow-hidden bg-obsidian">
                    <Image
                      src={museum.coverImage ?? museumCover(museum.slug, museum.name)}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                      unoptimized
                    />
                  </div>
                  <CardContent className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="gold">
                        <MapPin
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        {museum.city}
                      </Badge>
                      <Badge tone="neutral">
                        {t("objectsCount", { count: objectCount })}
                      </Badge>
                      {tourCount > 0 ? (
                        <Badge tone="info">
                          <Route className="h-3 w-3" aria-hidden="true" />
                          {tourCount}
                        </Badge>
                      ) : null}
                    </div>

                    <h2 className="mt-3 font-display text-2xl text-papyrus">
                      {museum.name}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-sandstone/85">
                      {museum.description}
                    </p>

                    <dl className="mt-4 space-y-1.5 text-xs text-sandstone/65">
                      <div className="flex items-center gap-2">
                        <Clock
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">{t("openingHours")}</dt>
                        <dd>{museum.openingHours}</dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <Accessibility
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">{t("accessibility")}</dt>
                        <dd>
                          {museum.floors
                            .flatMap((floor) => floor.rooms)
                            .every((room) => room.accessibility)
                            ? t("accessibilityFull")
                            : t("accessibilityPartial")}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-sandstone/60">
                        {museum.floors.length} {t("floor")} ·{" "}
                        {museum.floors.reduce(
                          (total, floor) => total + floor.rooms.length,
                          0,
                        )}{" "}
                        {t("galleries")}
                      </span>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/museum/${museum.slug}`}>
                          {t("showObjects")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}