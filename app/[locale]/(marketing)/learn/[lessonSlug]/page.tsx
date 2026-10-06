import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { LessonReader } from "@/components/learning/lesson-reader";
import { Button } from "@/components/ui/button";
import { allLessons, findLesson, courses } from "@/lib/data";
import type { Locale } from "@/i18n.config";

export function generateStaticParams() {
  return ["en", "ar"].flatMap((locale) =>
    allLessons().map((lesson) => ({
      locale,
      lessonSlug: lesson.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; lessonSlug: string }>;
}): Promise<Metadata> {
  const { lessonSlug } = await params;
  const lesson = findLesson(lessonSlug);
  if (!lesson) return {};
  return {
    title: lesson.title,
    description: lesson.summary,
  };
}

/** Lesson page (spec §45). */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: Locale; lessonSlug: string }>;
}) {
  const { locale, lessonSlug } = await params;
  setRequestLocale(locale);

  const lesson = findLesson(lessonSlug);
  if (!lesson) notFound();

  const t = await getTranslations({ locale, namespace: "learn" });

  const course = courses.find((entry) => entry.id === lesson.courseId);
  const siblings = course?.lessons ?? [];
  const index = siblings.findIndex((entry) => entry.id === lesson.id);
  const previous = index > 0 ? siblings[index - 1] : null;
  const next = index < siblings.length - 1 ? siblings[index + 1] : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="mb-8">
        <Link href="/learn">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {t("backToCourse")}
        </Link>
      </Button>

      <LessonReader lesson={lesson} />

      <nav
        aria-label="Lesson navigation"
        className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-ash/60 pt-6"
      >
        {previous ? (
          <Button asChild variant="outline">
            <Link href={`/learn/${previous.slug}`}>
              <ArrowLeft
                className="h-4 w-4 rtl:rotate-180"
                aria-hidden="true"
              />
              {previous.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}

        {next ? (
          <Button asChild>
            <Link href={`/learn/${next.slug}`}>
              {t("nextLesson")}
              <ArrowRight
                className="h-4 w-4 rtl:rotate-180"
                aria-hidden="true"
              />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/learn">{t("lessons")}</Link>
          </Button>
        )}
      </nav>
    </div>
  );
}