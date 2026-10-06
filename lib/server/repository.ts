import type {
  Artifact,
  Museum,
  MuseumFloor,
  MuseumRoom,
  MuseumTour,
} from "@/types/museum";
import type { HieroglyphSign } from "@/types/hieroglyph";
import type { Source, ContentStatus } from "@/types/common";
import type { LearningCourse, LearningLesson } from "@/types/learning";
import { prisma, isDatabaseConfigured } from "@/lib/server/prisma";

/**
 * Prisma-backed repository (spec §41).
 *
 * Implements the same interfaces as the in-memory repository in
 * lib/data, so services and pages do not know which one is
 * active. Enable it by setting DATABASE_URL.
 *
 * Mapping is explicit rather than structural: Prisma returns
 * nullable columns and JSON, while the domain types are strict.
 * Doing the conversion here keeps that messiness in one file.
 */

/* ── Row → domain mappers ───────────────────────────────── */

type SourceRow = {
  id: string;
  type: string;
  title: string;
  author: string | null;
  publisher: string | null;
  url: string | null;
  publicationDate: string | null;
  citationText: string;
};

function toSource(row: SourceRow): Source {
  return {
    id: row.id,
    title: row.title,
    author: row.author ?? undefined,
    publisher: row.publisher ?? undefined,
    url: row.url ?? undefined,
    publicationDate: row.publicationDate ?? undefined,
    type: row.type as Source["type"],
    citationText: row.citationText,
  };
}

type FloorRow = {
  id: string;
  name: string;
  level: number;
  planWidth: number;
  planHeight: number;
  rooms: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    category: string;
    accessibility: boolean;
  }>;
  zones: Array<{
    id: string;
    name: string;
    polygon: unknown;
    theme: string | null;
  }>;
};

function toFloor(row: FloorRow): MuseumFloor {
  return {
    id: row.id,
    name: row.name,
    level: row.level,
    planWidth: row.planWidth,
    planHeight: row.planHeight,
    rooms: row.rooms.map(
      (room): MuseumRoom => ({
        id: room.id,
        name: room.name,
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        category: room.category as MuseumRoom["category"],
        accessibility: room.accessibility,
      }),
    ),
    zones: row.zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      polygon: (zone.polygon ?? []) as Array<{ x: number; y: number }>,
      // MuseumZone.theme is a required string in the domain
      // type; an absent theme becomes empty rather than
      // undefined.
      theme: zone.theme ?? "",
    })),
  };
}

type MuseumRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  openingHours: string | null;
  website: string | null;
  timezone: string;
  status: string;
  floors: FloorRow[];
  sources: SourceRow[];
};

function toMuseum(row: MuseumRow): Museum {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    country: row.country,
    city: row.city,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    coverImage: row.coverImage ?? undefined,
    openingHours: row.openingHours ?? "",
    website: row.website ?? undefined,
    timezone: row.timezone,
    language: "en",
    status: row.status as ContentStatus,
    floors: row.floors.map(toFloor),
    tours: [],
    arExperiences: [],
    sources: row.sources.map(toSource),
  };
}

type ArtifactRow = {
  id: string;
  slug: string;
  museumId: string;
  roomId: string | null;
  name: string;
  description: string;
  period: string;
  dynasty: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  material: string | null;
  dimensions: string | null;
  creator: string | null;
  culture: string | null;
  inventoryNumber: string;
  images: string[];
  tags: string[];
  featured: boolean;
  status: string;
  metadata: unknown;
  inscriptions: Array<{
    transliteration: string;
    translation: string;
    signIds: string[];
  }>;
  linksFrom: Array<{ toId: string }>;
};

function toArtifact(row: ArtifactRow): Artifact {
  const metadata = (row.metadata ?? {}) as Artifact["metadata"];
  const inscription = row.inscriptions[0];
  return {
    id: row.id,
    museumId: row.museumId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    period: row.period,
    dynasty: row.dynasty ?? "",
    dateFrom: row.dateFrom ?? "",
    dateTo: row.dateTo ?? row.dateFrom ?? "",
    material: row.material ?? "",
    dimensions: row.dimensions ?? "",
    creator: row.creator ?? "Unknown",
    culture: row.culture ?? "Ancient Egyptian",
    locationRoomId: row.roomId ?? undefined,
    inventoryNumber: row.inventoryNumber,
    images: row.images,
    tags: row.tags,
    featured: row.featured,
    status: row.status as ContentStatus,
    metadata,
    inscription: inscription
      ? {
          transliteration: inscription.transliteration,
          translation: inscription.translation,
          signIds: inscription.signIds,
        }
      : undefined,
    relatedArtifactIds: row.linksFrom.map((link) => link.toId),
    sources: [],
  };
}

type SignRow = {
  gardinerCode: string;
  unicode: string;
  glyph: string;
  name: string;
  description: string;
  category: string;
  signType: string;
  phoneticValues: string[];
  mdc: string | null;
  ideographicMeaning: string | null;
  determinativeMeaning: string | null;
  era: string | null;
  variants: string[];
};

function toSign(row: SignRow): HieroglyphSign {
  return {
    id: `hiero-${row.gardinerCode.toLowerCase()}`,
    gardinerCode: row.gardinerCode,
    unicode: row.unicode,
    glyph: row.glyph,
    name: row.name,
    description: row.description,
    category: row.category as HieroglyphSign["category"],
    phoneticValues: row.phoneticValues,
    ideographicMeaning: row.ideographicMeaning ?? undefined,
    determinativeMeaning: row.determinativeMeaning ?? undefined,
    signType: row.signType as HieroglyphSign["signType"],
    mdc: row.mdc ?? undefined,
    variants: row.variants,
    era: row.era ?? "Middle Egyptian",
    sources: [],
  };
}

type TourStopRow = {
  id: string;
  order: number;
  artifactId: string;
  title: string;
  narration: string;
  durationSeconds: number;
};

type TourRow = {
  id: string;
  museumId: string;
  title: string;
  description: string;
  theme: string | null;
  durationMinutes: number;
  language: string;
  accessibility: string;
  stops: TourStopRow[];
};

function toTour(row: TourRow): MuseumTour {
  return {
    id: row.id,
    museumId: row.museumId,
    title: row.title,
    description: row.description,
    durationMinutes: row.durationMinutes,
    language: row.language,
    accessibility: row.accessibility as MuseumTour["accessibility"],
    theme: row.theme ?? "",
    stops: row.stops.map((stop) => ({
      id: stop.id,
      order: stop.order,
      artifactId: stop.artifactId,
      title: stop.title,
      narration: stop.narration,
      durationSeconds: stop.durationSeconds,
    })),
  };
}

type LessonRow = {
  id: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  content: unknown;
  durationMinutes: number;
  status: string;
  courseId: string;
};

function toLesson(row: LessonRow): LearningLesson {
  return {
    id: row.id,
    courseId: row.courseId,
    order: row.order,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: (row.content ?? []) as LearningLesson["content"],
    durationMinutes: row.durationMinutes,
    signIds: [],
  };
}

/* ── Shared include shapes ─────────────────────────────── */

const museumInclude = {
  floors: { include: { rooms: true, zones: true } },
  sources: true,
} as const;

const artifactInclude = {
  inscriptions: true,
  linksFrom: { select: { toId: true } },
} as const;

/* ── Repositories ──────────────────────────────────────── */

export const prismaMuseumRepository = {
  async list(): Promise<Museum[]> {
    const rows = await prisma.museum.findMany({
      include: museumInclude,
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toMuseum(row as unknown as MuseumRow));
  },

  async get(slugOrId: string): Promise<Museum | undefined> {
    const row = await prisma.museum.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: museumInclude,
    });
    return row ? toMuseum(row as unknown as MuseumRow) : undefined;
  },

  async artifacts(museumId: string): Promise<Artifact[]> {
    const rows = await prisma.artifact.findMany({
      where: { museumId },
      include: artifactInclude,
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toArtifact(row as unknown as ArtifactRow));
  },

  async tours(museumId: string): Promise<MuseumTour[]> {
    const rows = await prisma.tour.findMany({
      where: { museumId },
      include: { stops: { orderBy: { order: "asc" } } },
      orderBy: { title: "asc" },
    });
    return rows.map((row) => toTour(row as unknown as TourRow));
  },
};

export const prismaArtifactRepository = {
  async list(): Promise<Artifact[]> {
    const rows = await prisma.artifact.findMany({
      include: artifactInclude,
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toArtifact(row as unknown as ArtifactRow));
  },

  async get(slugOrId: string): Promise<Artifact | undefined> {
    const row = await prisma.artifact.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: artifactInclude,
    });
    return row ? toArtifact(row as unknown as ArtifactRow) : undefined;
  },

  async featured(): Promise<Artifact[]> {
    const rows = await prisma.artifact.findMany({
      where: { featured: true },
      include: artifactInclude,
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toArtifact(row as unknown as ArtifactRow));
  },

  async related(artifactId: string): Promise<Artifact[]> {
    const links = await prisma.artifactLink.findMany({
      where: { fromId: artifactId },
      select: { toId: true },
    });
    if (links.length === 0) return [];
    const rows = await prisma.artifact.findMany({
      where: { id: { in: links.map((link) => link.toId) } },
      include: artifactInclude,
    });
    return rows.map((row) => toArtifact(row as unknown as ArtifactRow));
  },

  async search(query: string): Promise<Artifact[]> {
    const needle = query.trim();
    if (!needle) return [];
    const rows = await prisma.artifact.findMany({
      where: {
        OR: [
          { name: { contains: needle, mode: "insensitive" } },
          { description: { contains: needle, mode: "insensitive" } },
          { period: { contains: needle, mode: "insensitive" } },
          { dynasty: { contains: needle, mode: "insensitive" } },
          { inventoryNumber: { contains: needle, mode: "insensitive" } },
          { tags: { has: needle } },
        ],
      },
      include: artifactInclude,
      orderBy: { name: "asc" },
    });
    return rows.map((row) => toArtifact(row as unknown as ArtifactRow));
  },
};

export const prismaHieroglyphRepository = {
  async list(): Promise<HieroglyphSign[]> {
    const rows = await prisma.hieroglyphSign.findMany({
      orderBy: { gardinerCode: "asc" },
    });
    return rows.map((row) => toSign(row as unknown as SignRow));
  },

  async get(gardinerCode: string): Promise<HieroglyphSign | undefined> {
    const row = await prisma.hieroglyphSign.findUnique({
      where: { gardinerCode: gardinerCode.trim().toUpperCase() },
    });
    return row ? toSign(row as unknown as SignRow) : undefined;
  },

  async uniliterals(): Promise<HieroglyphSign[]> {
    const rows = await prisma.hieroglyphSign.findMany({
      where: { signType: "uniliteral" },
      orderBy: { gardinerCode: "asc" },
    });
    return rows.map((row) => toSign(row as unknown as SignRow));
  },

  async search(query: string): Promise<HieroglyphSign[]> {
    const needle = query.trim();
    if (!needle) return [];
    const rows = await prisma.hieroglyphSign.findMany({
      where: {
        OR: [
          { name: { contains: needle, mode: "insensitive" } },
          { gardinerCode: { contains: needle, mode: "insensitive" } },
          { unicode: { contains: needle, mode: "insensitive" } },
          { description: { contains: needle, mode: "insensitive" } },
          { ideographicMeaning: { contains: needle, mode: "insensitive" } },
          { phoneticValues: { has: needle } },
        ],
      },
      orderBy: { gardinerCode: "asc" },
    });
    return rows.map((row) => toSign(row as unknown as SignRow));
  },
};

export const prismaLearningRepository = {
  async courses(): Promise<LearningCourse[]> {
    const rows = await prisma.course.findMany({
      include: { lessons: { orderBy: { order: "asc" } } },
      orderBy: { title: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      level: row.level as LearningCourse["level"],
      coverImage: row.coverImage ?? undefined,
      status: row.status as ContentStatus,
      lessons: (row.lessons as unknown as LessonRow[]).map(toLesson),
    }));
  },

  async lessons(): Promise<LearningLesson[]> {
    const rows = await prisma.lesson.findMany({
      orderBy: [{ courseId: "asc" }, { order: "asc" }],
    });
    return rows.map((row) => toLesson(row as unknown as LessonRow));
  },

  async lesson(slugOrId: string): Promise<LearningLesson | undefined> {
    const row = await prisma.lesson.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    });
    return row ? toLesson(row as unknown as LessonRow) : undefined;
  },
};

export const prismaTourRepository = {
  async list(): Promise<MuseumTour[]> {
    const rows = await prisma.tour.findMany({
      include: { stops: { orderBy: { order: "asc" } } },
      orderBy: { title: "asc" },
    });
    return rows.map((row) => toTour(row as unknown as TourRow));
  },

  async byMuseum(museumId: string): Promise<MuseumTour[]> {
    return prismaTourRepository.list().then((all) =>
      all.filter((tour) => tour.museumId === museumId),
    );
  },
};

/** True when the Prisma repositories should be used. */
export function usePrisma(): boolean {
  return isDatabaseConfigured();
}