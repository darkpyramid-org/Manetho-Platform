import type { UUID, ContentStatus } from "./common";

export interface LearningCourse {
  id: UUID;
  title: string;
  slug: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  lessons: LearningLesson[];
  coverImage?: string;
  /** Editorial status. Mirrors the Prisma Course.status column. */
  status: ContentStatus;
}

export interface LearningLesson {
  id: UUID;
  courseId: UUID;
  order: number;
  title: string;
  slug: string;
  summary: string;
  content: LessonSection[];
  durationMinutes: number;
  quiz?: Quiz;
  signIds: string[];
}

export interface LessonSection {
  heading: string;
  body: string;
  kind: "prose" | "example" | "signs" | "quiz" | "note";
  signIds?: string[];
}

export interface Quiz {
  id: UUID;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: UUID;
  prompt: string;
  kind: "multiple_choice" | "sign_identification" | "true_false";
  options: string[];
  correctIndex: number;
  explanation: string;
  signId?: string;
}
