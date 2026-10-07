import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession, can } from "@/lib/auth/session";
import { courses, hieroglyphRepository } from "@/lib/data";
import { routing, type Locale } from "@/i18n.config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const LEVEL_TONE = {
  beginner: "success",
  intermediate: "info",
  advanced: "gold",
} as const;

/** Learning content management (spec §47). */
export default async function AdminLessonsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tl = await getTranslations({ locale, namespace: "learn" });
  const session = await getSession();

  if (!can(session, "content:read")) {
    return (
      <Card className="border-warning/40">
        <CardContent className="p-5">
          <p className="text-sm text-sandstone">
            {t("roleRequired")}{" "}
            {t("roleRequiredBody", { role: "CONTENT_EDITOR" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const lessonTotal = courses.reduce(
    (total, course) => total + course.lessons.length,
    0,
  );

  return (
    <section aria-labelledby="lessons-title">
      <AdminSectionHeader
        title={t("nav.lessons")}
        count={lessonTotal}
        description={t("lessonsDescription")}
      />

      <div className="space-y-5">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-papyrus">
                    {course.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-sandstone/60">
                    {course.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={LEVEL_TONE[course.level]}>
                    {tl(
                      `level${course.level.charAt(0).toUpperCase()}${course.level.slice(1)}`,
                    )}
                  </Badge>
                  <Badge tone={course.status === "PUBLISHED" ? "success" : "neutral"}>
                    {t(course.status.toLowerCase())}
                  </Badge>
                </div>
              </div>

              <ol className="space-y-1.5">
                {course.lessons.map((lesson) => {
                  // Every referenced sign must resolve, or the
                  // lesson renders broken glyph pills.
                  const missing = lesson.signIds.filter(
                    (code) => !hieroglyphRepository.get(code),
                  );
                  const quizCount = lesson.quiz?.questions.length ?? 0;

                  return (
                    <li
                      key={lesson.id}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-ash text-[0.65rem] text-sandstone">
                        {lesson.order}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-papyrus">
                        {lesson.title}
                      </span>
                      <Badge tone="neutral">
                        {lesson.signIds.length} {tl("lessons")}
                      </Badge>
                      <Badge tone="neutral">
                        {tl("quiz")} {quizCount}
                      </Badge>
                      <span className="text-xs text-sandstone/55">
                        {tl("duration", {
                          minutes: lesson.durationMinutes,
                        })}
                      </span>
                      {missing.length > 0 ? (
                        <Badge tone="danger">
                          {missing.length} missing
                        </Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}