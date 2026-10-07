-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'RESEARCHER', 'MUSEUM_EDITOR', 'MUSEUM_ADMIN', 'CONTENT_EDITOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'LOW_CONFIDENCE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('BOOK', 'PAPER', 'MUSEUM', 'DATABASE', 'WEBSITE', 'CATALOG', 'ARCHIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumGrant" (
    "userId" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,

    CONSTRAINT "MuseumGrant_pkey" PRIMARY KEY ("userId","museumId")
);

-- CreateTable
CREATE TABLE "Museum" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameOriginal" TEXT,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "coverImage" TEXT,
    "openingHours" TEXT,
    "website" TEXT,
    "timezone" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Museum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumFloor" (
    "id" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "planWidth" INTEGER NOT NULL DEFAULT 1000,
    "planHeight" INTEGER NOT NULL DEFAULT 1000,
    "planData" JSONB,

    CONSTRAINT "MuseumFloor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumRoom" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "accessibility" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MuseumRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuseumZone" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" JSONB NOT NULL,
    "theme" TEXT,

    CONSTRAINT "MuseumZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "roomId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "dynasty" TEXT,
    "dateFrom" TEXT,
    "dateTo" TEXT,
    "material" TEXT,
    "dimensions" TEXT,
    "creator" TEXT,
    "culture" TEXT,
    "inventoryNumber" TEXT NOT NULL,
    "images" TEXT[],
    "tags" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtifactLink" (
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "ArtifactLink_pkey" PRIMARY KEY ("fromId","toId")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "transliteration" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "signIds" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model3D" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "scale" DOUBLE PRECISION,
    "format" TEXT NOT NULL DEFAULT 'glb',

    CONSTRAINT "Model3D_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioGuide" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "transcript" TEXT,

    CONSTRAINT "AudioGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArExperience" (
    "id" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "artifactId" TEXT,
    "name" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,
    "markerScale" DOUBLE PRECISION,
    "metadata" JSONB,

    CONSTRAINT "ArExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HieroglyphSign" (
    "id" TEXT NOT NULL,
    "gardinerCode" TEXT NOT NULL,
    "unicode" TEXT NOT NULL,
    "glyph" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "signType" TEXT NOT NULL,
    "phoneticValues" TEXT[],
    "mdc" TEXT,
    "ideographicMeaning" TEXT,
    "determinativeMeaning" TEXT,
    "era" TEXT,
    "variants" TEXT[],

    CONSTRAINT "HieroglyphSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "artifactId" TEXT,
    "imageKey" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "overallConfidence" DOUBLE PRECISION,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "requestId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationSign" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "signId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "confidenceLevel" TEXT NOT NULL,
    "transliteration" TEXT,

    CONSTRAINT "TranslationSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationFeedback" (
    "id" TEXT NOT NULL,
    "translationId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranslationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'visitor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "context" JSONB,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "coverImage" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSign" (
    "lessonId" TEXT NOT NULL,
    "signId" TEXT NOT NULL,

    CONSTRAINT "LessonSign_pkey" PRIMARY KEY ("lessonId","signId")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'multiple_choice',
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "signId" TEXT,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "museumId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "theme" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "accessibility" TEXT NOT NULL DEFAULT 'full',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourStop" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "artifactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "narration" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,

    CONSTRAINT "TourStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "url" TEXT,
    "publicationDate" TEXT,
    "citationText" TEXT NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationSource" (
    "translationId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "TranslationSource_pkey" PRIMARY KEY ("translationId","sourceId")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "translationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MuseumToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MuseumToSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Museum_slug_key" ON "Museum"("slug");

-- CreateIndex
CREATE INDEX "Museum_city_idx" ON "Museum"("city");

-- CreateIndex
CREATE INDEX "MuseumFloor_museumId_level_idx" ON "MuseumFloor"("museumId", "level");

-- CreateIndex
CREATE INDEX "MuseumRoom_floorId_idx" ON "MuseumRoom"("floorId");

-- CreateIndex
CREATE UNIQUE INDEX "Artifact_slug_key" ON "Artifact"("slug");

-- CreateIndex
CREATE INDEX "Artifact_museumId_idx" ON "Artifact"("museumId");

-- CreateIndex
CREATE INDEX "Artifact_period_idx" ON "Artifact"("period");

-- CreateIndex
CREATE INDEX "Artifact_status_idx" ON "Artifact"("status");

-- CreateIndex
CREATE INDEX "Inscription_artifactId_idx" ON "Inscription"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "Model3D_artifactId_key" ON "Model3D"("artifactId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioGuide_artifactId_key" ON "AudioGuide"("artifactId");

-- CreateIndex
CREATE INDEX "ArExperience_museumId_idx" ON "ArExperience"("museumId");

-- CreateIndex
CREATE UNIQUE INDEX "HieroglyphSign_gardinerCode_key" ON "HieroglyphSign"("gardinerCode");

-- CreateIndex
CREATE UNIQUE INDEX "HieroglyphSign_unicode_key" ON "HieroglyphSign"("unicode");

-- CreateIndex
CREATE INDEX "HieroglyphSign_category_idx" ON "HieroglyphSign"("category");

-- CreateIndex
CREATE INDEX "HieroglyphSign_signType_idx" ON "HieroglyphSign"("signType");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_requestId_key" ON "Translation"("requestId");

-- CreateIndex
CREATE INDEX "Translation_status_idx" ON "Translation"("status");

-- CreateIndex
CREATE INDEX "Translation_artifactId_idx" ON "Translation"("artifactId");

-- CreateIndex
CREATE INDEX "TranslationSign_translationId_idx" ON "TranslationSign"("translationId");

-- CreateIndex
CREATE INDEX "AssistantMessage_conversationId_idx" ON "AssistantMessage"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");

-- CreateIndex
CREATE INDEX "Lesson_courseId_order_idx" ON "Lesson"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_lessonId_key" ON "Quiz"("lessonId");

-- CreateIndex
CREATE INDEX "Tour_museumId_idx" ON "Tour"("museumId");

-- CreateIndex
CREATE UNIQUE INDEX "TourStop_tourId_order_key" ON "TourStop"("tourId", "order");

-- CreateIndex
CREATE INDEX "Source_type_idx" ON "Source"("type");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_translationId_idx" ON "AuditEvent"("translationId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "_MuseumToSource_B_index" ON "_MuseumToSource"("B");

-- AddForeignKey
ALTER TABLE "MuseumGrant" ADD CONSTRAINT "MuseumGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuseumGrant" ADD CONSTRAINT "MuseumGrant_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuseumFloor" ADD CONSTRAINT "MuseumFloor_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuseumRoom" ADD CONSTRAINT "MuseumRoom_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "MuseumFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MuseumZone" ADD CONSTRAINT "MuseumZone_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "MuseumFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MuseumRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactLink" ADD CONSTRAINT "ArtifactLink_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtifactLink" ADD CONSTRAINT "ArtifactLink_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Model3D" ADD CONSTRAINT "Model3D_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioGuide" ADD CONSTRAINT "AudioGuide_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArExperience" ADD CONSTRAINT "ArExperience_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Translation" ADD CONSTRAINT "Translation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationSign" ADD CONSTRAINT "TranslationSign_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationSign" ADD CONSTRAINT "TranslationSign_signId_fkey" FOREIGN KEY ("signId") REFERENCES "HieroglyphSign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationFeedback" ADD CONSTRAINT "TranslationFeedback_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSign" ADD CONSTRAINT "LessonSign_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSign" ADD CONSTRAINT "LessonSign_signId_fkey" FOREIGN KEY ("signId") REFERENCES "HieroglyphSign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tour" ADD CONSTRAINT "Tour_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourStop" ADD CONSTRAINT "TourStop_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourStop" ADD CONSTRAINT "TourStop_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "Artifact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationSource" ADD CONSTRAINT "TranslationSource_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranslationSource" ADD CONSTRAINT "TranslationSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MuseumToSource" ADD CONSTRAINT "_MuseumToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Museum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MuseumToSource" ADD CONSTRAINT "_MuseumToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

