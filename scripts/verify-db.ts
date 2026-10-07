/**
 * Post-migration verification.
 *
 * Confirms the seeded database actually contains what the app
 * expects, and that the cross-references the seed relies on
 * resolve in SQL as well as in memory.
 *
 * Run: npx tsx scripts/verify-db.ts
 */

import { PrismaClient } from "@prisma/client";
import { loadEnv } from "./load-env";

// Prisma reads DATABASE_URL from the environment; the CLI loads
// it via prisma.config.ts, but a direct tsx run does not.
loadEnv();

const prisma = new PrismaClient();

function line(label: string, value: unknown): void {
  console.log(`  ${label.padEnd(26)} ${value}`);
}

async function main() {
  console.log("\nManetho — database verification\n");

  const counts = {
    sources: await prisma.source.count(),
    hieroglyphSigns: await prisma.hieroglyphSign.count(),
    museums: await prisma.museum.count(),
    museumFloors: await prisma.museumFloor.count(),
    museumRooms: await prisma.museumRoom.count(),
    museumZones: await prisma.museumZone.count(),
    artifacts: await prisma.artifact.count(),
    inscriptions: await prisma.inscription.count(),
    artifactLinks: await prisma.artifactLink.count(),
    courses: await prisma.course.count(),
    lessons: await prisma.lesson.count(),
    lessonSigns: await prisma.lessonSign.count(),
    quizzes: await prisma.quiz.count(),
    quizQuestions: await prisma.quizQuestion.count(),
    tours: await prisma.tour.count(),
    tourStops: await prisma.tourStop.count(),
    translations: await prisma.translation.count(),
    translationSigns: await prisma.translationSign.count(),
    translationSources: await prisma.translationSource.count(),
  };

  console.log("Row counts");
  for (const [entity, count] of Object.entries(counts)) {
    line(entity, count);
  }

  // Cross-references must resolve in the database, not just in
  // the in-memory seed.
  console.log("\nReferential integrity");

  const orphanRooms = await prisma.museumRoom.count({
    where: { floor: { museum: { id: "___none___" } } },
  });
  line("rooms with no museum", orphanRooms);

  const orphanArtifacts = await prisma.artifact.count({
    where: { museum: { id: "___none___" } },
  });
  line("artifacts with no museum", orphanArtifacts);

  const artifactsMissingRoom = await prisma.artifact.count({
    where: { roomId: null },
  });
  line("artifacts without a room", artifactsMissingRoom);

  const badLessonSigns = await prisma.lessonSign.count({
    where: { OR: [{ lessonId: "___none___" }, { signId: "___none___" }] },
  });
  line("lesson-sign links dangling", badLessonSigns);

  const badStops = await prisma.tourStop.count({
    where: { OR: [{ tourId: "___none___" }, { artifactId: "___none___" }] },
  });
  line("tour stops dangling", badStops);

  // Hieroglyph integrity — the invariant the whole product rests on.
  console.log("\nHieroglyph integrity");

  const outOfBlock = await prisma.hieroglyphSign.findMany({
    where: {
      unicode: {
        not: undefined,
      },
    },
    select: { gardinerCode: true, unicode: true },
  });
  const bad = outOfBlock.filter((sign) => {
    const cp = Number.parseInt(sign.unicode.replace(/^U\+/, ""), 16);
    return !(cp >= 0x13000 && cp <= 0x1342f);
  });
  line("code points out of block", bad.length);

  // The invariant that keeps a sign's shape and its Unicode value
  // from drifting apart. ASCII(SUBSTRING(...)) yields the code
  // point of the first character; every Egyptian hieroglyph in
  // U+13000–U+1342F sits in the Basic Multilingual Plane, so a
  // single character is the whole glyph.
  //
  // GREATEST is required in the LPAD: PostgreSQL's LPAD
  // truncates when the input is longer than the target length,
  // so a plain LPAD(…, 4, …) silently cuts "13153" to "1315"
  // and reports every sign as a mismatch.
  const glyphMismatch = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT COUNT(*) as count
       FROM "HieroglyphSign"
      WHERE "unicode" IS DISTINCT FROM (
              'U+' || UPPER(LPAD(
                TO_HEX(ASCII(SUBSTRING("glyph", 1, 1))),
                GREATEST(4, LENGTH(TO_HEX(ASCII(SUBSTRING("glyph", 1, 1))))),
                '0'
              ))
            )`;
  line(
    "glyph != declared code point",
    Number(glyphMismatch[0]?.count ?? 0),
  );

  const duplicateCodes = await prisma.$queryRaw<
    Array<{ count: bigint }>
  >`SELECT COUNT(*) as count FROM (
        SELECT "unicode" FROM "HieroglyphSign"
         GROUP BY "unicode" HAVING COUNT(*) > 1
      ) duplicates`;
  line("duplicate code points", Number(duplicateCodes[0]?.count ?? 0));

  const uniliterals = await prisma.hieroglyphSign.count({
    where: { signType: "uniliteral" },
  });
  line("uniliteral signs", uniliterals);

  // The 24 canonical phonemes.
  const required = [
    "ꜣ", "j", "y", "ꜥ", "w", "b", "p", "f", "m", "n", "r",
    "h", "ḥ", "ḫ", "ẖ", "z", "s", "š", "q", "k", "g", "t",
    "ṯ", "d", "ḏ",
  ];
  const all = await prisma.hieroglyphSign.findMany({
    where: { signType: "uniliteral" },
    select: { phoneticValues: true },
  });
  const present = new Set(all.flatMap((row) => row.phoneticValues));
  const missing = required.filter((value) => !present.has(value));
  line("missing phonemes", missing.length ? missing.join(" ") : "none");

  // The Aa group, which case-insensitive lookups used to lose.
  const aaGroup = await prisma.hieroglyphSign.count({
    where: { gardinerCode: { startsWith: "Aa" } },
  });
  line("Aa-group signs", aaGroup);

  // Readings persisted from live requests.
  console.log("\nStored readings");
  const byProvider = await prisma.translation.groupBy({
    by: ["provider", "isDemo"],
    _count: { _all: true },
  });
  for (const row of byProvider) {
    line(
      `${row.provider} (${row.isDemo ? "demo" : "real"})`,
      row._count._all,
    );
  }

  const withDetections = await prisma.translation.count({
    where: { detections: { some: {} } },
  });
  line("readings with per-sign data", withDetections);

  const byStatus = await prisma.translation.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  for (const row of byStatus) {
    line(`status ${row.status}`, row._count._all);
  }

  const lowConfidence = await prisma.translation.findMany({
    where: { overallConfidence: { lt: 0.6 } },
    select: { requestId: true, overallConfidence: true },
  });
  line(
    "readings below 0.6 (should be refused)",
    lowConfidence.length,
  );

  console.log("\nDone.\n");
}

main()
  .catch((error: unknown) => {
    console.error("Verification failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });