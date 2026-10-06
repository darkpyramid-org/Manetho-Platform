import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Clock, GraduationCap, Layers } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Glyph } from "@/components/hieroglyph/sign-display";
import { courses, generatedImage, hieroglyphRepository } from "@/lib/data";
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
  const t = await getTranslations({ locale, namespace: "learn" });
  return { title: t("title"), description: t("subtitle") };
}

/** Learning index (spec §45). */
export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "learn" });

  const levelTone = {
    beginner: "success",
    intermediate: "info",
    advanced: "gold",
  } as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-3xl text-papyrus sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-sandstone">{t("subtitle")}</p>
      </header>

      {courses.length === 0 ? (
        <p className="text-sm text-sandstone/70">{t("emptyCourses")}</p>
      ) : (
        <ul className="space-y-8">
          {courses.map((course) => {
            const totalMinutes = course.lessons.reduce(
              (total, lesson) => total + lesson.durationMinutes,
              0,
            );
            // A representative sign from the course, drawn from
            // the real database.
            const sampleSigns = course.lessons[0]?.signIds
              .slice(0, 3)
              .map((code) => hieroglyphRepository.get(code))
              .filter((sign): sign is NonNullable<typeof sign> => Boolean(sign));

            return (
              <li key={course.id}>
                <Card className="overflow-hidden">
                  <div className="grid gap-0 md:grid-cols-[18rem_1fr]">
                    <div className="relative aspect-3/2 bg-obsidian md:aspect-auto">
                      <Image
                        src={
                          course.coverImage ??
                          generatedImage({
                            seed: course.id,
                            label: course.title,
                            accent: "gold",
                            width: 1200,
                            height: 630,
                          })
                        }
                        alt=""
                        fill
                        sizes="(min-width: 768px) 18rem, 100vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex flex-col">
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={levelTone[course.level]}>
                            <GraduationCap
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            {t(`level${course.level.charAt(0).toUpperCase()}${course.level.slice(1)}`)}
                          </Badge>
                          <Badge tone="neutral">
                            <Layers className="h-3 w-3" aria-hidden="true" />
                            {course.lessons.length} {t("lessons")}
                          </Badge>
                          <Badge tone="neutral">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {totalMinutes} min
                          </Badge>
                        </div>
                        <CardTitle className="mt-2 text-2xl">
                          {course.title}
                        </CardTitle>
                        <p className="mt-1.5 text-sm leading-relaxed text-sandstone/85">
                          {course.description}
                        </p>
                      </CardHeader>

                      <CardContent className="flex-1 space-y-4">
                        {sampleSigns.length > 0 ? (
                          <p className="hiero flex gap-2 text-2xl text-gold">
                            {sampleSigns.map((sign) => (
                              <Glyph
                                key={sign.gardinerCode}
                                glyph={sign.glyph}
                                label={sign.name}
                                size="sm"
                              />
                            ))}
                          </p>
                        ) : null}

                        <ol className="space-y-1.5">
                          {course.lessons.map((lesson) => (
                            <li key={lesson.id}>
                              <Link
                                href={`/learn/${lesson.slug}`}
                                className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-slate/60"
                              >
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-ash text-xs text-sandstone group-hover:border-gold group-hover:text-gold">
                                  {lesson.order}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-papyrus group-hover:text-gold-bright">
                                    {lesson.title}
                                  </span>
                                  <span className="block truncate text-xs text-sandstone/60">
                                    {lesson.summary}
                                  </span>
                                </span>
                                <span className="shrink-0 text-xs text-sandstone/50">
                                  {t("duration", {
                                    minutes: lesson.durationMinutes,
                                  })}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ol>

                        <Button asChild variant="outline" size="sm">
                          <Link href={`/learn/${course.lessons[0].slug}`}>
                            <BookOpen className="h-4 w-4" aria-hidden="true" />
                            {t("start")}
                          </Link>
                        </Button>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}