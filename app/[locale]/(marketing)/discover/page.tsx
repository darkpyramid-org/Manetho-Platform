import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DiscoverClient } from "@/components/discover/discover-client";
import {
  allLessons,
  artifacts,
  courses,
  hieroglyphSigns,
  museums,
  tours,
} from "@/lib/data";
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
  const t = await getTranslations({ locale, namespace: "discover" });
  return { title: t("title"), description: t("subtitle") };
}

/**
 * Discovery page (spec §36).
 * The whole knowledge base is loaded server-side and handed to
 * the client for instant, dependency-free filtering — search
 * stays fast and works offline once the page is cached.
 */
export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "discover" });

  const lessons = allLessons();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-3xl text-papyrus sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-sandstone">{t("subtitle")}</p>
      </header>

      <DiscoverClient
        signs={hieroglyphSigns.map((sign) => ({
          id: sign.id,
          gardinerCode: sign.gardinerCode,
          unicode: sign.unicode,
          glyph: sign.glyph,
          name: sign.name,
          description: sign.description,
          category: sign.category,
          signType: sign.signType,
          phoneticValues: sign.phoneticValues,
          ideographicMeaning: sign.ideographicMeaning,
          era: sign.era,
        }))}
        artifacts={artifacts.map((artifact) => ({
          id: artifact.id,
          slug: artifact.slug,
          name: artifact.name,
          period: artifact.period,
          dynasty: artifact.dynasty,
          museumId: artifact.museumId,
          tags: artifact.tags,
          image: artifact.images[0],
        }))}
        museums={museums.map((museum) => ({
          id: museum.id,
          slug: museum.slug,
          name: museum.name,
          city: museum.city,
          country: museum.country,
          coverImage: museum.coverImage,
        }))}
        lessons={lessons.map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          summary: lesson.summary,
          courseId: lesson.courseId,
        }))}
        courses={courses.map((course) => ({
          id: course.id,
          title: course.title,
          level: course.level,
        }))}
        tours={tours.map((tour) => ({
          id: tour.id,
          title: tour.title,
          description: tour.description,
          museumId: tour.museumId,
        }))}
      />
    </div>
  );
}