import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ScanLine,
  Compass,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  BookOpen,
  MapPinned,
  Quote,
} from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, FeatureCard } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/badge";
import { featuredArtifacts } from "@/lib/data";
import { isDemoMode } from "@/lib/features";

/**
 * Landing page (spec §25).
 * The hero states plainly what the product does and what
 * it refuses to do, then leads to the three primary flows.
 */
export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const featured = featuredArtifacts().slice(0, 4);
  const demo = isDemoMode();

  const features = [
    {
      icon: ShieldCheck,
      title: t("features.confidenceTitle"),
      body: t("features.confidenceBody"),
    },
    {
      icon: Quote,
      title: t("features.sourcesTitle"),
      body: t("features.sourcesBody"),
    },
    {
      icon: Sparkles,
      title: t("features.signsTitle"),
      body: t("features.signsBody"),
    },
    {
      icon: BookOpen,
      title: t("features.learningTitle"),
      body: t("features.learningBody"),
    },
    {
      icon: MapPinned,
      title: t("features.museumTitle"),
      body: t("features.museumBody"),
    },
    {
      icon: MessageSquareText,
      title: t("features.assistantTitle"),
      body: t("features.assistantBody"),
    },
  ];

  const steps = [
    { title: t("howSteps.oneTitle"), body: t("howSteps.oneBody") },
    { title: t("howSteps.twoTitle"), body: t("howSteps.twoBody") },
    { title: t("howSteps.threeTitle"), body: t("howSteps.threeBody") },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ash/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 texture-scan opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 start-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl rtl:translate-x-1/2"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          {demo ? (
            <div className="mb-8 flex justify-center">
              <DemoBadge label={tc("demoMode")} />
            </div>
          ) : null}

          <p className="text-center font-display text-sm uppercase tracking-[0.28em] text-gold">
            {t("eyebrow")}
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-center font-display text-4xl leading-[1.1] text-papyrus sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-relaxed text-sandstone sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/translator">
                <ScanLine className="h-4 w-4" aria-hidden="true" />
                {t("ctaPrimary")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="/discover">
                <Compass className="h-4 w-4" aria-hidden="true" />
                {t("ctaSecondary")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto"
            >
              <Link href="/assistant">
                {t("ctaTertiary")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-sandstone/70">
            {t("heroNote")}
          </p>
        </div>
      </section>

      {/* ── Trust features ───────────────────────────── */}
      <section
        aria-labelledby="features-title"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <h2
            id="features-title"
            className="font-display text-3xl text-papyrus sm:text-4xl"
          >
            {t("featuresTitle")}
          </h2>
          <p className="mt-3 text-sandstone">{t("featuresSubtitle")}</p>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <li key={feature.title}>
              <FeatureCard className="h-full">
                <CardContent>
                  <feature.icon
                    className="h-6 w-6 text-gold"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 font-display text-lg text-papyrus">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-sandstone/85">
                    {feature.body}
                  </p>
                </CardContent>
              </FeatureCard>
            </li>
          ))}
        </ul>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section
        aria-labelledby="how-title"
        className="border-y border-ash/60 bg-charcoal/50"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2
              id="how-title"
              className="font-display text-3xl text-papyrus sm:text-4xl"
            >
              {t("howTitle")}
            </h2>
            <p className="mt-3 text-sandstone">{t("howSubtitle")}</p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="relative">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/50 font-display text-sm text-gold"
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-display text-lg text-papyrus">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-3 ps-12 text-sm leading-relaxed text-sandstone/85">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <Button asChild variant="outline">
              <Link href="/translator">
                {t("ctaButton")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Featured objects ─────────────────────────── */}
      <section
        aria-labelledby="featured-title"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2
              id="featured-title"
              className="font-display text-3xl text-papyrus sm:text-4xl"
            >
              {t("featuredTitle")}
            </h2>
            <p className="mt-3 text-sandstone">
              {t("featuredSubtitle")}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/discover?type=artifact">
              {t("ctaSecondary")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((artifact) => (
            <li key={artifact.id}>
              <Card className="h-full overflow-hidden transition-colors hover:border-gold/40">
                <Link
                  href={`/artifact/${artifact.slug}`}
                  className="block focus-visible:outline-none"
                >
                  <div className="relative aspect-square overflow-hidden bg-obsidian">
                    <Image
                      src={artifact.images[0]}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wider text-gold">
                      {artifact.period}
                    </p>
                    <h3 className="mt-1.5 font-display text-base leading-snug text-papyrus">
                      {artifact.name}
                    </h3>
                    <p className="mt-1 text-xs text-sandstone/70">
                      {artifact.dynasty}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Closing CTA ───────────────────────────────── */}
      <section className="border-t border-ash/60 bg-charcoal/50">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl text-papyrus">
            {t("ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sandstone">
            {t("ctaBody")}
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/translator">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}