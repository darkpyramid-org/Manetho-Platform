import { getTranslations, setRequestLocale } from "next-intl/server";
import { ScanLine, Route, Map as MapIcon } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfflineNote } from "@/components/app/app-shell";
import { artifacts, featuredArtifacts, museums, tours } from "@/lib/data";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].map((locale) => ({ locale }));
}

/** Workspace overview (spec §16). */
export default async function AppHomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "app" });
  const tm = await getTranslations({ locale, namespace: "museums" });

  const featured = featuredArtifacts().slice(0, 3);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl text-papyrus">{t("title")}</h1>
        <p className="mt-2 text-sm text-sandstone">{t("subtitle")}</p>
      </header>

      <OfflineNote />

      {/* Primary actions */}
      <ul className="grid gap-3 sm:grid-cols-3">
        <li>
          <Link
            href="/app/scan"
            className="flex h-full flex-col rounded-lg border border-gold/40 bg-charcoal p-4 transition-colors hover:border-gold"
          >
            <ScanLine className="h-6 w-6 text-gold" aria-hidden="true" />
            <span className="mt-3 font-display text-base text-papyrus">
              {t("nav.scan")}
            </span>
            <span className="mt-1 text-xs text-sandstone/70">
              {tm("subtitle")}
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/app/tours"
            className="flex h-full flex-col rounded-lg border border-ash/70 bg-charcoal p-4 transition-colors hover:border-gold/40"
          >
            <Route className="h-6 w-6 text-gold" aria-hidden="true" />
            <span className="mt-3 font-display text-base text-papyrus">
              {t("nav.tours")}
            </span>
            <span className="mt-1 text-xs text-sandstone/70">
              {tours.length}
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/app/map"
            className="flex h-full flex-col rounded-lg border border-ash/70 bg-charcoal p-4 transition-colors hover:border-gold/40"
          >
            <MapIcon className="h-6 w-6 text-gold" aria-hidden="true" />
            <span className="mt-3 font-display text-base text-papyrus">
              {t("nav.map")}
            </span>
            <span className="mt-1 text-xs text-sandstone/70">
              {museums.length}
            </span>
          </Link>
        </li>
      </ul>

      {/* Recent scans — placeholder for persisted history */}
      <section aria-labelledby="recent-scans">
        <h2
          id="recent-scans"
          className="font-display text-lg text-papyrus"
        >
          {t("recentScans")}
        </h2>
        <Card className="mt-4 border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-sandstone/80">{t("noScans")}</p>
            <p className="mt-1.5 text-xs text-sandstone/60">
              {t("noScansBody")}
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href="/app/scan">{t("nav.scan")}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Featured objects */}
      <section aria-labelledby="featured">
        <h2
          id="featured"
          className="font-display text-lg text-papyrus"
        >
          {tm("title")}
        </h2>
        <ul className="mt-4 space-y-2">
          {featured.map((artifact) => (
            <li key={artifact.id}>
              <Link
                href={`/artifact/${artifact.slug}`}
                className="flex items-center gap-3 rounded-md border border-ash/70 bg-charcoal p-3 transition-colors hover:border-gold/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-papyrus">
                    {artifact.name}
                  </span>
                  <span className="block truncate text-xs text-sandstone/60">
                    {artifact.period} · {artifact.dynasty}
                  </span>
                </span>
                <Badge tone="gold">{artifact.inventoryNumber}</Badge>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-sandstone/50">
          {artifacts.length} objects indexed
        </p>
      </section>
    </div>
  );
}