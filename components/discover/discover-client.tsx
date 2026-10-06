"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Glyph } from "@/components/hieroglyph/sign-display";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/primitives";
import {
  hieroglyphCategoryLabels,
  type HieroglyphCategory,
} from "@/types/hieroglyph";

interface SignRow {
  id: string;
  gardinerCode: string;
  unicode: string;
  glyph: string;
  name: string;
  description: string;
  category: HieroglyphCategory;
  signType: string;
  phoneticValues: string[];
  ideographicMeaning?: string;
  era: string;
}

interface ArtifactRow {
  id: string;
  slug: string;
  name: string;
  period: string;
  dynasty: string;
  museumId: string;
  tags: string[];
  image: string;
}

interface MuseumRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  coverImage?: string;
}

interface LessonRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  courseId: string;
}

interface CourseRow {
  id: string;
  title: string;
  level: string;
}

interface TourRow {
  id: string;
  title: string;
  description: string;
  museumId: string;
}

/**
 * Discovery client (spec §36).
 *
 * Everything is filtered in memory against the full knowledge
 * base, so search works instantly and keeps working offline
 * once the page is cached by the service worker.
 */
export function DiscoverClient({
  signs,
  artifacts,
  museums,
  lessons,
  courses,
  tours,
}: {
  signs: SignRow[];
  artifacts: ArtifactRow[];
  museums: MuseumRow[];
  lessons: LessonRow[];
  courses: CourseRow[];
  tours: TourRow[];
}) {
  const t = useTranslations("discover");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [signType, setSignType] = useState<string>("");

  const museumNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const museum of museums) map[museum.id] = museum.name;
    return map;
  }, [museums]);

  const courseTitles = useMemo(() => {
    const map: Record<string, string> = {};
    for (const course of courses) map[course.id] = course.title;
    return map;
  }, [courses]);

  const museumSlugs = useMemo(() => {
    const map: Record<string, string> = {};
    for (const museum of museums) map[museum.id] = museum.slug;
    return map;
  }, [museums]);

  const needle = query.trim().toLowerCase();

  const matchedSigns = useMemo(() => {
    return signs.filter((sign) => {
      if (category && sign.category !== category) return false;
      if (signType && sign.signType !== signType) return false;
      if (!needle) return true;
      return (
        sign.name.toLowerCase().includes(needle) ||
        sign.gardinerCode.toLowerCase().includes(needle) ||
        sign.unicode.toLowerCase().includes(needle) ||
        sign.description.toLowerCase().includes(needle) ||
        (sign.ideographicMeaning ?? "").toLowerCase().includes(needle) ||
        sign.phoneticValues.some((value) =>
          value.toLowerCase().includes(needle),
        )
      );
    });
  }, [category, needle, signType, signs]);

  const matchedArtifacts = useMemo(() => {
    if (!needle) return artifacts;
    return artifacts.filter(
      (artifact) =>
        artifact.name.toLowerCase().includes(needle) ||
        artifact.period.toLowerCase().includes(needle) ||
        artifact.dynasty.toLowerCase().includes(needle) ||
        artifact.tags.some((tag) => tag.toLowerCase().includes(needle)),
    );
  }, [artifacts, needle]);

  const matchedMuseums = useMemo(() => {
    if (!needle) return museums;
    return museums.filter(
      (museum) =>
        museum.name.toLowerCase().includes(needle) ||
        museum.city.toLowerCase().includes(needle) ||
        museum.country.toLowerCase().includes(needle),
    );
  }, [museums, needle]);

  const matchedLessons = useMemo(() => {
    if (!needle) return lessons;
    return lessons.filter(
      (lesson) =>
        lesson.title.toLowerCase().includes(needle) ||
        lesson.summary.toLowerCase().includes(needle),
    );
  }, [lessons, needle]);

  const matchedTours = useMemo(() => {
    if (!needle) return tours;
    return tours.filter(
      (tour) =>
        tour.title.toLowerCase().includes(needle) ||
        tour.description.toLowerCase().includes(needle),
    );
  }, [needle, tours]);

  const total =
    matchedSigns.length +
    matchedArtifacts.length +
    matchedMuseums.length +
    matchedLessons.length +
    matchedTours.length;

  const categories = Object.keys(hieroglyphCategoryLabels) as HieroglyphCategory[];
  const signTypes = [
    "uniliteral",
    "biliteral",
    "triliteral",
    "ideogram",
    "determinative",
    "classifier",
    "other",
  ];

  return (
    <div className="space-y-8">
      {/* Search + filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sandstone/50"
            aria-hidden="true"
          />
          <label htmlFor="discover-search" className="sr-only">
            {t("placeholder")}
          </label>
          <Input
            id="discover-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("placeholder")}
            className="h-12 ps-10 pe-10 text-base"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-sandstone/60 hover:text-papyrus"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <p className="text-xs text-sandstone/60" role="status">
          {t("resultCount", { count: total })}
        </p>
      </div>

      <Tabs defaultValue="signs">
        <TabsList>
          <TabsTrigger value="signs">
            {t("tabs.signs")} ({matchedSigns.length})
          </TabsTrigger>
          <TabsTrigger value="artifacts">
            {t("tabs.artifacts")} ({matchedArtifacts.length})
          </TabsTrigger>
          <TabsTrigger value="museums">
            {t("tabs.museums")} ({matchedMuseums.length})
          </TabsTrigger>
          <TabsTrigger value="lessons">
            {t("tabs.lessons")} ({matchedLessons.length})
          </TabsTrigger>
          <TabsTrigger value="tours">
            {t("tabs.tours")} ({matchedTours.length})
          </TabsTrigger>
        </TabsList>

        {/* Signs */}
        <TabsContent value="signs">
          <div className="mb-5 flex flex-wrap gap-3">
            <div className="min-w-48">
              <label
                htmlFor="filter-category"
                className="mb-1.5 block text-xs uppercase tracking-wide text-sandstone/60"
              >
                {t("category")}
              </label>
              <Select
                id="filter-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">{t("allCategories")}</option>
                {categories.map((entry) => (
                  <option key={entry} value={entry}>
                    {hieroglyphCategoryLabels[entry]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-48">
              <label
                htmlFor="filter-type"
                className="mb-1.5 block text-xs uppercase tracking-wide text-sandstone/60"
              >
                {t("signType")}
              </label>
              <Select
                id="filter-type"
                value={signType}
                onChange={(event) => setSignType(event.target.value)}
              >
                <option value="">{t("allTypes")}</option>
                {signTypes.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </Select>
            </div>
            {category || signType ? (
              <Button
                variant="ghost"
                size="sm"
                className="self-end"
                onClick={() => {
                  setCategory("");
                  setSignType("");
                }}
              >
                {t("allCategories")}
              </Button>
            ) : null}
          </div>

          {matchedSigns.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchedSigns.map((sign) => (
                <li key={sign.id}>
                  <div className="flex h-full gap-3 rounded-lg border border-ash/70 bg-charcoal p-3.5">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-gold/25 bg-obsidian">
                      <Glyph
                        glyph={sign.glyph}
                        label={sign.name}
                        size="lg"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-papyrus">
                        {sign.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[0.7rem] text-gold">
                        {sign.gardinerCode} · {sign.unicode}
                      </p>
                      <p className="mt-1 text-xs text-sandstone/70">
                        {sign.signType}
                        {sign.phoneticValues.length > 0
                          ? ` · ${sign.phoneticValues.join(" / ")}`
                          : ""}
                      </p>
                      {sign.ideographicMeaning ? (
                        <p className="mt-1 text-xs text-sandstone/60">
                          {sign.ideographicMeaning}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Artifacts */}
        <TabsContent value="artifacts">
          {matchedArtifacts.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchedArtifacts.map((artifact) => (
                <li key={artifact.id}>
                  <Link
                    href={`/artifact/${artifact.slug}`}
                    className="flex h-full items-center gap-3 rounded-lg border border-ash/70 bg-charcoal p-3.5 transition-colors hover:border-gold/40"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-obsidian">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artifact.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-papyrus">
                        {artifact.name}
                      </span>
                      <span className="block truncate text-xs text-sandstone/60">
                        {artifact.period} · {artifact.dynasty}
                      </span>
                      <span className="block truncate text-xs text-sandstone/50">
                        {museumNames[artifact.museumId]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Museums */}
        <TabsContent value="museums">
          {matchedMuseums.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {matchedMuseums.map((museum) => (
                <li key={museum.id}>
                  <Link
                    href={`/museum/${museum.slug}`}
                    className="flex h-full items-center gap-3 rounded-lg border border-ash/70 bg-charcoal p-4 transition-colors hover:border-gold/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-papyrus">
                        {museum.name}
                      </span>
                      <span className="block truncate text-xs text-sandstone/60">
                        {museum.city}, {museum.country}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Lessons */}
        <TabsContent value="lessons">
          {matchedLessons.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {matchedLessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={`/learn/${lesson.slug}`}
                    className="block rounded-lg border border-ash/70 bg-charcoal p-4 transition-colors hover:border-gold/40"
                  >
                    <span className="block text-sm text-papyrus">
                      {lesson.title}
                    </span>
                    <span className="mt-1 block text-xs text-sandstone/70">
                      {lesson.summary}
                    </span>
                    <span className="mt-2 block">
                      <Badge tone="neutral">
                        {courseTitles[lesson.courseId]}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Tours */}
        <TabsContent value="tours">
          {matchedTours.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {matchedTours.map((tour) => (
                <li key={tour.id}>
                  <Link
                    href={`/museum/${museumSlugs[tour.museumId] ?? ""}`}
                    className="block rounded-lg border border-ash/70 bg-charcoal p-4 transition-colors hover:border-gold/40"
                  >
                    <span className="block text-sm text-papyrus">
                      {tour.title}
                    </span>
                    <span className="mt-1 block text-xs text-sandstone/70">
                      {tour.description}
                    </span>
                    <span className="mt-2 block">
                      <Badge tone="neutral">
                        {museumNames[tour.museumId]}
                      </Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  const t = useTranslations("discover");
  return (
    <div className="rounded-lg border border-dashed border-ash p-10 text-center">
      <p className="font-display text-lg text-papyrus">{t("empty")}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-sandstone/70">
        {t("emptyBody")}
      </p>
    </div>
  );
}