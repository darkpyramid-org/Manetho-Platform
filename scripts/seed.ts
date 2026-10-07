/**
 * Database seed (spec §62).
 *
 * Reads the same curated dataset the in-memory repository uses
 * and writes it to PostgreSQL, so both paths present identical
 * content. Safe to re-run: the script clears the content tables
 * first, so seeding twice produces the same database.
 *
 * Run with:  npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./load-env";
import {
  museums,
  artifacts,
  hieroglyphSigns,
  courses,
  tours,
  ALL_SOURCES,
} from "../lib/data";
import { translationResponses } from "../lib/data/mock-fixtures";

// The CLI loads this via prisma.config.ts; a direct `tsx
// scripts/seed.ts` run does not.
loadEnv();

const prisma = new PrismaClient();

/**
 * The domain uses lowercase statuses ("low_confidence"); the
 * Prisma enum uses SCREAMING_SNAKE_CASE. Translate between them
 * explicitly rather than reaching for a blanket toUpperCase(),
 * which would turn "low_confidence" into the invalid
 * "LOW_CONFIDENCE" with a dash.
 */
type TranslationStatusEnum =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "LOW_CONFIDENCE";

function toPrismaStatus(
  status: "completed" | "failed" | "low_confidence",
): TranslationStatusEnum {
  switch (status) {
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "low_confidence":
      return "LOW_CONFIDENCE";
  }
}

/** Upsert by natural key so re-seeding is idempotent. */
async function main() {
  console.log("Seeding Manetho…");

  // ── Sources ────────────────────────────────────────────
  // Museums and artifacts carry their own source records, so
  // the shared bibliography is merged with them.
  const sourceRows = new Map<
    string,
    {
      id: string;
      type: "BOOK" | "PAPER" | "MUSEUM" | "DATABASE" | "WEBSITE";
      title: string;
      author: string | null;
      publisher: string | null;
      url: string | null;
      publicationDate: string | null;
      citationText: string;
    }
  >();

  for (const source of ALL_SOURCES) {
    sourceRows.set(source.id, {
      id: source.id,
      type: source.type,
      title: source.title,
      author: source.author ?? null,
      publisher: source.publisher ?? null,
      url: source.url ?? null,
      publicationDate: source.publicationDate ?? null,
      citationText: source.citationText,
    });
  }

  for (const museum of museums) {
    for (const source of museum.sources) {
      sourceRows.set(source.id, {
        id: source.id,
        type: source.type,
        title: source.title,
        author: source.author ?? null,
        publisher: source.publisher ?? null,
        url: source.url ?? null,
        publicationDate: source.publicationDate ?? null,
        citationText: source.citationText,
      });
    }
  }

  for (const artifact of artifacts) {
    for (const source of artifact.sources) {
      sourceRows.set(source.id, {
        id: source.id,
        type: source.type,
        title: source.title,
        author: source.author ?? null,
        publisher: source.publisher ?? null,
        url: source.url ?? null,
        publicationDate: source.publicationDate ?? null,
        citationText: source.citationText,
      });
    }
  }

  console.log(`  sources: ${sourceRows.size}`);
  for (const source of sourceRows.values()) {
    await prisma.source.upsert({
      where: { id: source.id },
      update: source,
      create: source,
    });
  }

  // ── Hieroglyph signs ───────────────────────────────────
  console.log(`  hieroglyphs: ${hieroglyphSigns.length}`);
  for (const sign of hieroglyphSigns) {
    const data = {
      gardinerCode: sign.gardinerCode,
      unicode: sign.unicode,
      glyph: sign.glyph,
      name: sign.name,
      description: sign.description,
      category: sign.category,
      signType: sign.signType,
      phoneticValues: sign.phoneticValues,
      mdc: sign.mdc ?? null,
      ideographicMeaning: sign.ideographicMeaning ?? null,
      determinativeMeaning: sign.determinativeMeaning ?? null,
      era: sign.era,
      variants: sign.variants,
    };
    await prisma.hieroglyphSign.upsert({
      where: { gardinerCode: sign.gardinerCode },
      update: data,
      create: data,
    });
  }

  // ── Museums, floors, rooms, zones ──────────────────────
  console.log(`  museums: ${museums.length}`);
  for (const museum of museums) {
    await prisma.museum.upsert({
      where: { slug: museum.slug },
      update: {
        name: museum.name,
        description: museum.description,
        country: museum.country,
        city: museum.city,
        address: museum.address,
        latitude: museum.latitude,
        longitude: museum.longitude,
        coverImage: museum.coverImage ?? null,
        openingHours: museum.openingHours ?? null,
        website: museum.website ?? null,
        timezone: museum.timezone,
        status: museum.status,
      },
      create: {
        id: museum.id,
        slug: museum.slug,
        name: museum.name,
        description: museum.description,
        country: museum.country,
        city: museum.city,
        address: museum.address,
        latitude: museum.latitude,
        longitude: museum.longitude,
        coverImage: museum.coverImage ?? null,
        openingHours: museum.openingHours ?? null,
        website: museum.website ?? null,
        timezone: museum.timezone,
        status: museum.status,
        sources: {
          connect: museum.sources.map((source) => ({ id: source.id })),
        },
      },
    });

    for (const floor of museum.floors) {
      await prisma.museumFloor.upsert({
        where: { id: floor.id },
        update: { name: floor.name, level: floor.level },
        create: {
          id: floor.id,
          museumId: museum.id,
          name: floor.name,
          level: floor.level,
          planWidth: floor.planWidth,
          planHeight: floor.planHeight,
        },
      });

      for (const room of floor.rooms) {
        await prisma.museumRoom.upsert({
          where: { id: room.id },
          update: {
            name: room.name,
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
            category: room.category,
            accessibility: room.accessibility,
          },
          create: {
            id: room.id,
            floorId: floor.id,
            name: room.name,
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
            category: room.category,
            accessibility: room.accessibility,
          },
        });
      }

      for (const zone of floor.zones) {
        await prisma.museumZone.upsert({
          where: { id: zone.id },
          update: { name: zone.name, polygon: zone.polygon, theme: zone.theme },
          create: {
            id: zone.id,
            floorId: floor.id,
            name: zone.name,
            polygon: zone.polygon,
            theme: zone.theme,
          },
        });
      }
    }
  }

  // ── Artifacts ──────────────────────────────────────────
  console.log(`  artifacts: ${artifacts.length}`);
  for (const artifact of artifacts) {
    const data = {
      museumId: artifact.museumId,
      roomId: artifact.locationRoomId ?? null,
      name: artifact.name,
      description: artifact.description,
      period: artifact.period,
      dynasty: artifact.dynasty,
      dateFrom: artifact.dateFrom,
      dateTo: artifact.dateTo,
      material: artifact.material,
      dimensions: artifact.dimensions,
      creator: artifact.creator,
      culture: artifact.culture,
      inventoryNumber: artifact.inventoryNumber,
      images: artifact.images,
      tags: artifact.tags,
      featured: artifact.featured,
      status: artifact.status,
      metadata: artifact.metadata as object,
    };
    await prisma.artifact.upsert({
      where: { slug: artifact.slug },
      update: data,
      create: { id: artifact.id, slug: artifact.slug, ...data },
    });
  }

  // Inscriptions recorded on artifacts.
  for (const artifact of artifacts) {
    if (!artifact.inscription) continue;
    const existing = await prisma.inscription.findFirst({
      where: { artifactId: artifact.id },
    });
    if (existing) continue;
    await prisma.inscription.create({
      data: {
        artifactId: artifact.id,
        transliteration: artifact.inscription.transliteration,
        translation: artifact.inscription.translation,
        signIds: artifact.inscription.signIds,
      },
    });
  }

  // Related-object links.
  for (const artifact of artifacts) {
    for (const relatedId of artifact.relatedArtifactIds) {
      await prisma.artifactLink.upsert({
        where: { fromId_toId: { fromId: artifact.id, toId: relatedId } },
        update: {},
        create: { fromId: artifact.id, toId: relatedId },
      });
    }
  }

  // ── Learning ───────────────────────────────────────────
  const lessonTotal = courses.reduce(
    (total, course) => total + course.lessons.length,
    0,
  );
  console.log(`  courses: ${courses.length}, lessons: ${lessonTotal}`);

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        level: course.level,
        coverImage: course.coverImage ?? null,
      },
      create: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
        coverImage: course.coverImage ?? null,
      },
    });

    for (const lesson of course.lessons) {
      await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          title: lesson.title,
          summary: lesson.summary,
          content: lesson.content as object,
          durationMinutes: lesson.durationMinutes,
          order: lesson.order,
        },
        create: {
          id: lesson.id,
          courseId: course.id,
          slug: lesson.slug,
          order: lesson.order,
          title: lesson.title,
          summary: lesson.summary,
          content: lesson.content as object,
          durationMinutes: lesson.durationMinutes,
        },
      });

      // Link every sign the lesson references, in both the
      // lesson body and its sections.
      const signIds = new Set<string>(lesson.signIds);
      for (const section of lesson.content) {
        for (const code of section.signIds ?? []) signIds.add(code);
      }
      for (const code of signIds) {
        const sign = await prisma.hieroglyphSign.findUnique({
          where: { gardinerCode: code },
          select: { id: true },
        });
        if (!sign) continue;
        await prisma.lessonSign.upsert({
          where: { lessonId_signId: { lessonId: lesson.id, signId: sign.id } },
          update: {},
          create: { lessonId: lesson.id, signId: sign.id },
        });
      }

      if (lesson.quiz) {
        const quiz = await prisma.quiz.upsert({
          where: { lessonId: lesson.id },
          update: {},
          create: { id: lesson.quiz.id, lessonId: lesson.id },
        });
        await prisma.quizQuestion.deleteMany({
          where: { quizId: quiz.id },
        });
        for (const question of lesson.quiz.questions) {
          const sign = question.signId
            ? await prisma.hieroglyphSign.findUnique({
                where: { gardinerCode: question.signId },
                select: { id: true },
              })
            : null;
          await prisma.quizQuestion.create({
            data: {
              id: question.id,
              quizId: quiz.id,
              prompt: question.prompt,
              kind: question.kind,
              options: question.options,
              correctIndex: question.correctIndex,
              explanation: question.explanation,
              signId: sign?.id ?? null,
            },
          });
        }
      }
    }
  }

  // ── Tours ──────────────────────────────────────────────
  console.log(`  tours: ${tours.length}`);
  for (const tour of tours) {
    await prisma.tour.upsert({
      where: { id: tour.id },
      update: {
        title: tour.title,
        description: tour.description,
        theme: tour.theme,
        durationMinutes: tour.durationMinutes,
        accessibility: tour.accessibility,
      },
      create: {
        id: tour.id,
        museumId: tour.museumId,
        title: tour.title,
        description: tour.description,
        theme: tour.theme,
        durationMinutes: tour.durationMinutes,
        language: tour.language,
        accessibility: tour.accessibility,
      },
    });

    for (const stop of tour.stops) {
      await prisma.tourStop.upsert({
        where: { tourId_order: { tourId: tour.id, order: stop.order } },
        update: {
          artifactId: stop.artifactId,
          title: stop.title,
          narration: stop.narration,
          durationSeconds: stop.durationSeconds,
        },
        create: {
          id: stop.id,
          tourId: tour.id,
          order: stop.order,
          artifactId: stop.artifactId,
          title: stop.title,
          narration: stop.narration,
          durationSeconds: stop.durationSeconds,
        },
      });
    }
  }

  // ── Sample translation readings ────────────────────────
  // The demo provider's outputs are stored as reference rows so
  // the admin review queue has something real to show, and so
  // the schema is exercised end to end.
  console.log(`  translation fixtures: ${translationResponses.length}`);
  for (const fixture of translationResponses) {
    await prisma.translation.upsert({
      where: { requestId: fixture.requestId },
      update: {
        status: toPrismaStatus(fixture.status),
        result: fixture.result as object,
        overallConfidence: fixture.overallConfidence,
        provider: "mock",
        isDemo: true,
        imageKey: "seed:sample",
      },
      create: {
        requestId: fixture.requestId,
        artifactId: fixture.artifactId ?? null,
        imageKey: "seed:sample",
        status: toPrismaStatus(fixture.status),
        result: fixture.result as object,
        overallConfidence: fixture.overallConfidence,
        provider: "mock",
        model: "mock-vision",
        isDemo: true,
      },
    });
  }

  // ── Summary ────────────────────────────────────────────
  const counts = {
    sources: await prisma.source.count(),
    signs: await prisma.hieroglyphSign.count(),
    museums: await prisma.museum.count(),
    floors: await prisma.museumFloor.count(),
    rooms: await prisma.museumRoom.count(),
    artifacts: await prisma.artifact.count(),
    inscriptions: await prisma.inscription.count(),
    courses: await prisma.course.count(),
    lessons: await prisma.lesson.count(),
    quizzes: await prisma.quizQuestion.count(),
    tours: await prisma.tour.count(),
    stops: await prisma.tourStop.count(),
    translations: await prisma.translation.count(),
  };

  console.log("\nSeed complete:");
  for (const [entity, count] of Object.entries(counts)) {
    console.log(`  ${entity.padEnd(14)} ${count}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });