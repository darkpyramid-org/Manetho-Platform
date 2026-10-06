import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { MuseumFloorPlan } from "@/components/museums/museum-floor-plan";
import { artifactsByMuseum, museums } from "@/lib/data";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

/** Museum map browser (spec §14, §16). */
export default async function MapPage({
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
          {t("floorPlan")}
        </h1>
        <p className="mt-2 text-sm text-sandstone">{t("subtitle")}</p>
      </header>

      <div className="space-y-8">
        {museums.map((museum) => (
          <section
            key={museum.id}
            aria-labelledby={`map-${museum.id}`}
            className="space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id={`map-${museum.id}`}
                  className="flex items-center gap-2 font-display text-lg text-papyrus"
                >
                  <MapPin
                    className="h-4 w-4 text-gold"
                    aria-hidden="true"
                  />
                  {museum.name}
                </h2>
                <p className="mt-0.5 text-xs text-sandstone/60">
                  {museum.city}, {museum.country} ·{" "}
                  {t("objectsCount", {
                    count: artifactsByMuseum(museum.id).length,
                  })}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/museum/${museum.slug}`}>
                  {t("galleries")}
                </Link>
              </Button>
            </div>

            <MuseumFloorPlan
              museum={museum}
              artifacts={artifactsByMuseum(museum.id)}
            />
          </section>
        ))}
      </div>
    </div>
  );
}