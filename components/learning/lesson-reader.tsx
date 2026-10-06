"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Glyph } from "@/components/hieroglyph/sign-display";
import type { LearningLesson, Quiz } from "@/types/learning";
import { hieroglyphRepository } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Lesson reader (spec §45).
 *
 * Renders lesson sections and a quiz that always explains
 * its answers — including the ones you got wrong.
 */
export function LessonReader({ lesson }: { lesson: LearningLesson }) {
  const t = useTranslations("learn");

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-gold">
          {t("lessons")} {lesson.order}
        </p>
        <h1 className="mt-2 font-display text-3xl text-papyrus sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-3 text-sandstone">{lesson.summary}</p>
        <p className="mt-3 text-xs text-sandstone/60">
          {t("duration", { minutes: lesson.durationMinutes })}
        </p>
      </header>

      <div className="space-y-6">
        {lesson.content.map((section, index) => (
          <section key={`${lesson.id}-${index}`}>
            {section.heading ? (
              <h2 className="font-display text-xl text-papyrus">
                {section.heading}
              </h2>
            ) : null}

            <div
              className={cn(
                "mt-2.5 text-[0.95rem] leading-[1.75] text-sandstone/90",
                section.kind === "note" &&
                  "rounded-md border-s-2 border-gold/50 bg-gold/5 p-4",
                section.kind === "signs" &&
                  "rounded-md border border-ash/70 bg-charcoal p-4",
              )}
            >
              {section.kind === "note" ? (
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gold">
                  {t("sections")}
                </p>
              ) : null}
              <p className="whitespace-pre-line">{section.body}</p>

              {section.signIds && section.signIds.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {section.signIds.map((code) => (
                    <SignPill key={code} gardinerCode={code} />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {lesson.quiz ? <Quiz quiz={lesson.quiz} /> : null}
    </article>
  );
}

function SignPill({ gardinerCode }: { gardinerCode: string }) {
  const sign = signLookup(gardinerCode);
  if (!sign) return null;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border border-gold/25 bg-obsidian px-2.5 py-1.5"
      title={`${sign.gardinerCode} — ${sign.name}`}
    >
      <Glyph glyph={sign.glyph} label={sign.name} size="sm" />
      <span className="font-mono text-[0.7rem] text-gold">
        {sign.gardinerCode}
      </span>
    </span>
  );
}

/** Quiz with per-question explanations (spec §45). */
function Quiz({ quiz }: { quiz: Quiz }) {
  const t = useTranslations("learn");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () =>
      quiz.questions.filter(
        (question) => answers[question.id] === question.correctIndex,
      ).length,
    [answers, quiz.questions],
  );

  const allAnswered = quiz.questions.every(
    (question) => answers[question.id] !== undefined,
  );

  return (
    <section className="mt-12" aria-labelledby="quiz-title">
      <h2
        id="quiz-title"
        className="font-display text-2xl text-papyrus"
      >
        {t("quiz")}
      </h2>

      <ol className="mt-5 space-y-5">
        {quiz.questions.map((question, index) => {
          const selected = answers[question.id];
          const correct = selected === question.correctIndex;

          return (
            <li key={question.id}>
              <Card>
                <CardContent className="space-y-3">
                  <p className="font-medium text-papyrus">
                    <span className="me-2 text-gold">
                      {t("quizQuestion", {
                        index: index + 1,
                        total: quiz.questions.length,
                      })}
                    </span>
                    {question.prompt}
                  </p>

                  {question.signId ? (
                    <SignPill gardinerCode={question.signId} />
                  ) : null}

                  <ul className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selected === optionIndex;
                      const isCorrectOption =
                        optionIndex === question.correctIndex;

                      return (
                        <li key={option}>
                          <button
                            type="button"
                            onClick={() =>
                              submitted
                                ? undefined
                                : setAnswers((current) => ({
                                    ...current,
                                    [question.id]: optionIndex,
                                  }))
                            }
                            disabled={submitted}
                            aria-pressed={isSelected}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md border px-3.5 py-2.5 text-start text-sm transition-colors",
                              submitted && isCorrectOption
                                ? "border-success/60 bg-success/10 text-papyrus"
                                : submitted && isSelected && !isCorrectOption
                                  ? "border-danger/60 bg-danger/10 text-papyrus"
                                  : isSelected
                                    ? "border-gold bg-gold/10 text-papyrus"
                                    : "border-ash text-sandstone hover:border-gold/40",
                            )}
                          >
                            <span className="flex-1">{option}</span>
                            {submitted && isCorrectOption ? (
                              <Check
                                className="h-4 w-4 shrink-0 text-success"
                                aria-hidden="true"
                              />
                            ) : null}
                            {submitted && isSelected && !isCorrectOption ? (
                              <X
                                className="h-4 w-4 shrink-0 text-danger"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {submitted ? (
                    <div
                      className={cn(
                        "rounded-md border p-3 text-sm",
                        correct
                          ? "border-success/40 bg-success/8"
                          : "border-danger/40 bg-danger/8",
                      )}
                      role="status"
                    >
                      <p className="flex items-center gap-2 font-medium text-papyrus">
                        {correct ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <X className="h-4 w-4" aria-hidden="true" />
                        )}
                        {correct ? t("correct") : t("incorrect")}
                      </p>
                      <p className="mt-1.5 text-sandstone/90">
                        <span className="me-1 font-medium text-gold">
                          {t("explanation")}:
                        </span>
                        {question.explanation}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <Button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
          >
            {t("checkAnswer")}
          </Button>
        ) : (
          <>
            <p
              className="text-sm text-papyrus"
              role="status"
              aria-live="polite"
            >
              {t("score", {
                score,
                total: quiz.questions.length,
              })}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              {t("tryAgain")}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

/** Local sign lookup (the data layer is pure and browser-safe). */
function signLookup(code: string) {
  return hieroglyphRepository.get(code);
}