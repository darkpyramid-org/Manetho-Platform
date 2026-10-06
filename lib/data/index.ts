import type {
  Museum,
  MuseumFloor,
  MuseumRoom,
  MuseumTour,
  Artifact,
} from "@/types/museum";
import type { HieroglyphSign } from "@/types/hieroglyph";
import type { LearningCourse, LearningLesson } from "@/types/learning";
import { inscriptionSampleImage } from "./images";
import {
  museums,
  findMuseum,
  findRoom,
  floorForRoom,
  scholarlySources,
} from "./museums";
import {
  artifacts,
  findArtifact,
  artifactsByMuseum,
  featuredArtifacts,
} from "./artifacts";
import { hieroglyphSigns, searchSigns, uniliterals, findSignByGardiner, findSignByUnicode } from "./hieroglyphs";
import { courses, allLessons, findLesson } from "./lessons";
import { tours, toursByMuseum } from "./tours";

/* ── Re-exports: the convenience helpers callers expect ── */
export {
  allLessons,
  artifacts,
  artifactsByMuseum,
  courses,
  featuredArtifacts,
  findArtifact,
  findLesson,
  findMuseum,
  findRoom,
  floorForRoom,
  findSignByGardiner,
  findSignByUnicode,
  hieroglyphSigns,
  museums,
  scholarlySources,
  searchSigns,
  tours,
  uniliterals,
  toursByMuseum,
};
export { ALL_SOURCES, GARDINER, ALLEN, ERMAN, BUDGE, TYLDESLEY } from "./sources";
export { artifactImage, generatedImage, inscriptionSampleImage, museumCover } from "./images";

/**
 * Data repository layer.
 *
 * The in-memory repository below is the development
 * implementation. When DATABASE_URL is set, a
 * Prisma-backed repository implements the same
 * interfaces (see server/repositories) — services
 * never talk to the storage directly.
 */

export interface MuseumRepository {
  list(): Museum[];
  get(slugOrId: string): Museum | undefined;
  floors(museumId: string): MuseumFloor[];
  rooms(museumId: string): MuseumRoom[];
  tours(museumId: string): MuseumTour[];
  artifacts(museumId: string): Artifact[];
  artifactPositions(
    museumId: string,
    floorLevel?: number,
  ): Array<{ artifact: Artifact; x: number; y: number }>;
}

export interface ArtifactRepository {
  list(): Artifact[];
  get(slugOrId: string): Artifact | undefined;
  featured(): Artifact[];
  byMuseum(museumId: string): Artifact[];
  related(artifact: Artifact): Artifact[];
  search(query: string): Artifact[];
}

export interface HieroglyphRepository {
  list(): HieroglyphSign[];
  get(gardinerCode: string): HieroglyphSign | undefined;
  search(query: string): HieroglyphSign[];
  uniliterals(): HieroglyphSign[];
}

export interface LearningRepository {
  courses(): LearningCourse[];
  lessons(): LearningLesson[];
  lesson(slugOrId: string): LearningLesson | undefined;
}

export interface TourRepository {
  list(): MuseumTour[];
  byMuseum(museumId: string): MuseumTour[];
}

/** Compute an artifact's marker position from its room. */
function artifactPosition(
  artifact: Artifact,
  museum: Museum,
): { x: number; y: number } {
  if (artifact.mapPosition) return artifact.mapPosition;
  const room = findRoom(museum, artifact.locationRoomId);
  if (room) {
    return {
      x: room.x + room.width / 2,
      y: room.y + room.height / 2,
    };
  }
  return { x: 500, y: 500 };
}

export const museumRepository: MuseumRepository = {
  list: () => museums,
  get: (slugOrId) =>
    museums.find((m) => m.slug === slugOrId || m.id === slugOrId),
  floors: (museumId) => {
    const museum = museums.find((m) => m.id === museumId);
    return museum?.floors ?? [];
  },
  rooms: (museumId) => {
    const museum = museums.find((m) => m.id === museumId);
    return museum ? museum.floors.flatMap((f) => f.rooms) : [];
  },
  tours: (museumId) => toursByMuseum(museumId),
  artifacts: (museumId) => artifactsByMuseum(museumId),
  artifactPositions: (museumId, floorLevel) => {
    const museum = museums.find((m) => m.id === museumId);
    if (!museum) return [];
    return artifacts
      .filter((a) => a.museumId === museumId)
      .map((artifact) => {
        const pos = artifactPosition(artifact, museum);
        const room = findRoom(museum, artifact.locationRoomId);
        const floor = room ? floorForRoom(museum, room.id) : undefined;
        return {
          artifact,
          x: pos.x,
          y: pos.y,
          floor: floor?.level,
        };
      })
      .filter(
        (item) =>
          floorLevel === undefined ||
          (item as { floor?: number }).floor === floorLevel,
      ) as Array<{ artifact: Artifact; x: number; y: number }>;
  },
};

export const artifactRepository: ArtifactRepository = {
  list: () => artifacts,
  get: (slugOrId) => findArtifact(slugOrId),
  featured: () => featuredArtifacts(),
  byMuseum: (museumId) => artifactsByMuseum(museumId),
  related: (artifact) =>
    artifact.relatedArtifactIds
      .map((id) => artifacts.find((a) => a.id === id))
      .filter((a): a is Artifact => Boolean(a)),
  search: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return artifacts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.period.toLowerCase().includes(q) ||
        a.dynasty.toLowerCase().includes(q),
    );
  },
};

export const hieroglyphRepository: HieroglyphRepository = {
  list: () => hieroglyphSigns,
  get: (gardinerCode) =>
    findSignByGardiner(gardinerCode),
  search: (query) => searchSigns(query),
  uniliterals: () => uniliterals,
};

export const learningRepository: LearningRepository = {
  courses: () => courses,
  lessons: () => allLessons(),
  lesson: (slugOrId) => findLesson(slugOrId),
};

export const tourRepository: TourRepository = {
  list: () => tours,
  byMuseum: (museumId) => toursByMuseum(museumId),
};

/** Global search across the whole knowledge base (spec §36). */
export interface GlobalSearchResult {
  kind: "artifact" | "hieroglyph" | "museum" | "lesson" | "tour";
  refId: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
}

export function globalSearch(query: string, limit = 20): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const results: GlobalSearchResult[] = [];

  for (const a of artifacts) {
    if (
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.inventoryNumber.toLowerCase().includes(q)
    ) {
      results.push({
        kind: "artifact",
        refId: a.id,
        title: a.name,
        subtitle: `${a.period} · ${a.dynasty}`,
        thumbnail: a.images[0],
      });
    }
  }

  for (const s of hieroglyphSigns) {
    if (
      s.name.toLowerCase().includes(q) ||
      s.gardinerCode.toLowerCase().includes(q) ||
      s.unicode.toLowerCase().includes(q) ||
      (s.ideographicMeaning ?? "").toLowerCase().includes(q) ||
      s.phoneticValues.some((p) => p.toLowerCase().includes(q))
    ) {
      results.push({
        kind: "hieroglyph",
        refId: s.gardinerCode,
        title: `${s.gardinerCode} — ${s.name}`,
        subtitle: s.signType,
        thumbnail: undefined,
      });
    }
  }

  for (const m of museums) {
    if (
      m.name.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.country.toLowerCase().includes(q)
    ) {
      results.push({
        kind: "museum",
        refId: m.id,
        title: m.name,
        subtitle: `${m.city}, ${m.country}`,
        thumbnail: m.coverImage,
      });
    }
  }

  for (const l of allLessons()) {
    if (l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q)) {
      results.push({
        kind: "lesson",
        refId: l.id,
        title: l.title,
        subtitle: "Lesson",
      });
    }
  }

  for (const t of tours) {
    if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
      results.push({
        kind: "tour",
        refId: t.id,
        title: t.title,
        subtitle: "Museum tour",
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Sample inscriptions for the translator demo (spec §62).
 *
 * Each sample is a synthetic image that genuinely draws the
 * Gardiner signs it names, so the demo reading and the
 * image always agree. Real photographs never appear here.
 */
export interface SampleInscription {
  id: string;
  label: string;
  signIds: string[];
  glyphs: string;
  image: string;
  width: number;
  height: number;
}

const SAMPLE_SIGN_SETS: Array<{
  id: string;
  label: string;
  signIds: string[];
}> = [
  { id: "s1", label: "sꜣ rꜥ — Son of Re", signIds: ["G039", "N005"] },
  { id: "s2", label: "pr ꜥnḫ — House of Life", signIds: ["O001", "S034"] },
  { id: "s3", label: "nfr — beautiful, good", signIds: ["F035"] },
  { id: "s4", label: "ꜥnḫ — life", signIds: ["S034"] },
  { id: "s5", label: "nṯr — god", signIds: ["R008"] },
  { id: "s6", label: "ḥr — Horus", signIds: ["G005"] },
  { id: "s7", label: "rꜥ — the sun; Re", signIds: ["N005"] },
  { id: "s8", label: "ḥr nṯr — Horus, the god", signIds: ["G005", "R008"] },
  { id: "s9", label: "ḫpr rꜥ — Khepri, morning sun", signIds: ["L001", "N005"] },
  { id: "s10", label: "kꜣ — the ka", signIds: ["D029"] },
];

export function sampleInscriptions(): SampleInscription[] {
  return SAMPLE_SIGN_SETS.map((entry) => {
    const signs = entry.signIds
      .map((code) => hieroglyphRepository.get(code))
      .filter((sign): sign is HieroglyphSign => Boolean(sign));
    return {
      id: entry.id,
      label: entry.label,
      signIds: entry.signIds,
      glyphs: signs.map((sign) => sign.glyph).join(" "),
      image: inscriptionSampleImage({
        signIds: entry.signIds,
        glyphs: signs.map((sign) => sign.glyph),
        label: entry.label,
      }),
      width: 1200,
      height: 700,
    };
  });
}

export const data = {
  museums,
  artifacts,
  hieroglyphSigns,
  courses,
  tours,
  museumRepository,
  artifactRepository,
  hieroglyphRepository,
  learningRepository,
  tourRepository,
  globalSearch,
  sampleInscriptions,
};
