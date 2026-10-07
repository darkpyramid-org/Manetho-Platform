import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  BookOpen,
  Info,
  MapPin,
  MessageSquareText,
  Package,
  Ruler,
  Brush,
  Landmark,
  CalendarDays,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArtifactCard } from "@/components/artifacts/artifact-card";
import { Glyph } from "@/components/hieroglyph/sign-display";
import {
  artifactRepository,
  artifacts,
  findArtifact,
  findMuseum,
  findRoom,
  floorForRoom,
  hieroglyphRepository,
} from "@/lib/data";
import { routing, type Locale } from "@/i18n.config";

/**
 * Every param must be returned for a nested dynamic route.
 * Returning only the locale leaves the [artifactId] segment
 * unresolved, so Next cannot prerender these pages and falls
 * back to on-demand rendering — which then fails with
 * DYNAMIC_SERVER_USAGE.
 */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    artifacts.map((artifact) => ({ locale, artifactId: artifact.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; artifactId: string }>;
}): Promise<Metadata> {
  const { artifactId } = await params;
  const artifact = findArtifact(artifactId);
  if (!artifact) return {};
  return {
    title: artifact.name,
    description: artifact.description.slice(0, 160),
  };
}

/** Artifact detail (spec §19). */
export default async function ArtifactPage({
  params,
}: {
  params: Promise<{ locale: Locale; artifactId: string }>;
}) {
  const { locale, artifactId } = await params;
  setRequestLocale(locale);

  const artifact = findArtifact(artifactId);
  if (!artifact) notFound();

  const t = await getTranslations({ locale, namespace: "artifact" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tm = await getTranslations({ locale, namespace: "museums" });

  const museum = findMuseum(artifact.museumId);
  const room = museum ? findRoom(museum, artifact.locationRoomId) : undefined;
  const floor = museum
    ? floorForRoom(museum, artifact.locationRoomId ?? "")
    : undefined;
  const related = artifactRepository.related(artifact);

  const inscriptionSigns = (artifact.inscription?.signIds ?? [])
    .map((code) => hieroglyphRepository.get(code))
    .filter((sign): sign is NonNullable<typeof sign> => Boolean(sign));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-sandstone/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/museums" className="hover:text-gold">
              {tm("title")}
            </Link>
          </li>
          {museum ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/museum/${museum.slug}`}
                  className="hover:text-gold"
                >
                  {museum.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li className="text-papyrus">{artifact.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
        {/* Images */}
        <div className="space-y-4">
          {artifact.images.map((image, index) => (
            <div
              key={image}
              className="relative aspect-square overflow-hidden rounded-xl border border-ash/70 bg-obsidian"
            >
              <Image
                src={image}
                alt={
                  index === 0
                    ? `${artifact.name} — ${t("imageDescription")}`
                    : ""
                }
                fill
                priority={index === 0}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
          ))}

          {artifact.model3D ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-sandstone">{t("view3d")}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Record */}
        <div className="space-y-6">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">{artifact.period}</Badge>
              <Badge tone="neutral">{artifact.dynasty}</Badge>
              {artifact.featured ? <Badge tone="gold">✦</Badge> : null}
            </div>
            <h1 className="mt-3 font-display text-3xl text-papyrus sm:text-4xl">
              {artifact.name}
            </h1>
            <p className="mt-4 leading-relaxed text-sandstone/90">
              {artifact.description}
            </p>
          </header>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field
                  icon={Landmark}
                  label={tm("title")}
                  value={
                    museum ? (
                      <Link
                        href={`/museum/${museum.slug}`}
                        className="text-gold hover:underline"
                      >
                        {museum.name}
                      </Link>
                    ) : (
                      "—"
                    )
                  }
                />
                <Field
                  icon={MapPin}
                  label={t("gallery")}
                  value={
                    room
                      ? `${floor?.name ?? ""} — ${room.name}`
                      : "—"
                  }
                />
                <Field
                  icon={CalendarDays}
                  label={tc("date")}
                  value={`${artifact.dateFrom}${
                    artifact.dateTo !== artifact.dateFrom
                      ? ` – ${artifact.dateTo}`
                      : ""
                  }`}
                />
                <Field
                  icon={Package}
                  label={tc("material")}
                  value={artifact.material}
                />
                <Field
                  icon={Ruler}
                  label={tc("dimensions")}
                  value={artifact.dimensions}
                />
                <Field
                  icon={Info}
                  label={tc("inventory")}
                  value={artifact.inventoryNumber}
                />
                <Field
                  icon={Brush}
                  label={t("creator")}
                  value={artifact.creator}
                />
                <Field
                  icon={Info}
                  label={t("culture")}
                  value={artifact.culture}
                />
              </dl>

              {artifact.metadata.provenance ? (
                <div className="mt-4 border-t border-ash/60 pt-4">
                  <p className="text-xs uppercase tracking-wide text-sandstone/60">
                    {t("provenance")}
                  </p>
                  <p className="mt-1 text-sm text-sandstone">
                    {artifact.metadata.provenance}
                  </p>
                </div>
              ) : null}

              {artifact.inventoryNumber.includes("verify") ? (
                <p className="mt-4 rounded-md border border-gold/30 bg-gold/8 p-3 text-xs leading-relaxed text-gold-bright">
                  {t("inventoryWarning")}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Inscription */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("inscription")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {artifact.inscription ? (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    {inscriptionSigns.map((sign) => (
                      <Glyph
                        key={sign.gardinerCode}
                        glyph={sign.glyph}
                        label={sign.name}
                        size="lg"
                      />
                    ))}
                  </div>
                  <p
                    dir="ltr"
                    className="font-mono text-xl text-gold-bright"
                  >
                    {artifact.inscription.transliteration}
                  </p>
                  <p className="text-sandstone">
                    {artifact.inscription.translation}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/translator">{t("transliterate")}</Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-sandstone/70">
                  {t("noInscription")}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/assistant?artifact=${artifact.id}`}>
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                {t("askAbout")}
              </Link>
            </Button>
          </div>

          {/* Tags */}
          {artifact.tags.length > 0 ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-sandstone/60">
                {t("tags")}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {artifact.tags.map((tag) => (
                  <li key={tag}>
                    <Badge tone="neutral">{tag}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sources */}
      <section className="mt-14" aria-labelledby="artifact-sources">
        <h2
          id="artifact-sources"
          className="flex items-center gap-2 font-display text-lg text-papyrus"
        >
          <BookOpen className="h-4 w-4 text-gold" aria-hidden="true" />
          {t("sourcesTitle")}
        </h2>
        <ul className="mt-3 space-y-1.5">
          {artifact.sources.map((source) => (
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

      {/* Related */}
      {related.length > 0 ? (
        <section className="mt-14" aria-labelledby="related-title">
          <h2
            id="related-title"
            className="font-display text-2xl text-papyrus"
          >
            {t("relatedObjects")}
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((entry) => (
              <li key={entry.id}>
                <ArtifactCard artifact={entry} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Info;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-sandstone/60">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-papyrus">{value}</dd>
    </div>
  );
}