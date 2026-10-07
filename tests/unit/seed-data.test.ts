import { describe, expect, it } from "vitest";
import {
  artifacts,
  courses,
  museums,
  sampleInscriptions,
  tourRepository,
  artifactRepository,
  hieroglyphRepository,
  museumRepository,
  globalSearch,
} from "@/lib/data";

/**
 * Cross-reference integrity tests (spec §62).
 *
 * Seed data that points at rooms which do not exist, or
 * lessons referencing signs that are absent, would surface as
 * broken pages. These tests make that impossible to ship.
 */

describe("museums", () => {
  it("includes at least three museums", () => {
    expect(museums.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique ids and slugs", () => {
    const ids = museums.map((museum) => museum.id);
    const slugs = museums.map((museum) => museum.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every museum at least one floor with rooms", () => {
    for (const museum of museums) {
      expect(museum.floors.length).toBeGreaterThan(0);
      for (const floor of museum.floors) {
        expect(floor.rooms.length).toBeGreaterThan(0);
      }
    }
  });

  it("uses the 0–1000 plan coordinate space consistently", () => {
    for (const museum of museums) {
      for (const floor of museum.floors) {
        expect(floor.planWidth).toBe(1000);
        expect(floor.planHeight).toBe(1000);
        for (const room of floor.rooms) {
          expect(room.x).toBeGreaterThanOrEqual(0);
          expect(room.y).toBeGreaterThanOrEqual(0);
          expect(room.x + room.width).toBeLessThanOrEqual(1000);
          expect(room.y + room.height).toBeLessThanOrEqual(1000);
          expect(room.width).toBeGreaterThan(0);
          expect(room.height).toBeGreaterThan(0);
        }
      }
    }
  });

  it("has unique room ids within each museum", () => {
    for (const museum of museums) {
      const ids = museum.floors.flatMap((floor) =>
        floor.rooms.map((room) => room.id),
      );
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("gives every museum a cover image", () => {
    for (const museum of museums) {
      expect(museum.coverImage).toBeTruthy();
    }
  });
});

describe("artifacts", () => {
  it("includes at least 20 objects", () => {
    expect(artifacts.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique ids and slugs", () => {
    const ids = artifacts.map((artifact) => artifact.id);
    const slugs = artifacts.map((artifact) => artifact.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("references a museum that exists", () => {
    const museumIds = new Set(museums.map((museum) => museum.id));
    for (const artifact of artifacts) {
      expect(
        museumIds.has(artifact.museumId),
        `${artifact.name} references unknown museum ${artifact.museumId}`,
      ).toBe(true);
    }
  });

  it("references a room that exists in its museum", () => {
    for (const artifact of artifacts) {
      const museum = museums.find(
        (entry) => entry.id === artifact.museumId,
      );
      expect(museum, `${artifact.name}: unknown museum`).toBeDefined();
      const roomIds = new Set(
        museum!.floors.flatMap((floor) =>
          floor.rooms.map((room) => room.id),
        ),
      );
      expect(
        roomIds.has(artifact.locationRoomId ?? ""),
        `${artifact.name} references unknown room ${artifact.locationRoomId}`,
      ).toBe(true);
    }
  });

  it("gives every artifact at least one image and a source", () => {
    for (const artifact of artifacts) {
      expect(artifact.images.length).toBeGreaterThan(0);
      expect(artifact.images[0]).toBeTruthy();
      expect(artifact.sources.length).toBeGreaterThan(0);
    }
  });

  it("references related artifacts that exist", () => {
    const ids = new Set(artifacts.map((artifact) => artifact.id));
    for (const artifact of artifacts) {
      for (const related of artifact.relatedArtifactIds) {
        expect(ids.has(related), `${artifact.name} → ${related}`).toBe(true);
      }
    }
  });

  it("references inscription signs that exist", () => {
    for (const artifact of artifacts) {
      for (const code of artifact.inscription?.signIds ?? []) {
        expect(
          hieroglyphRepository.get(code),
          `${artifact.name} → unknown sign ${code}`,
        ).toBeDefined();
      }
    }
  });

  it("spreads objects across more than one museum", () => {
    const withObjects = new Set(
      artifacts.map((artifact) => artifact.museumId),
    );
    expect(withObjects.size).toBeGreaterThan(1);
  });

  it("marks data provenance as demo", () => {
    for (const artifact of artifacts) {
      expect(artifact.metadata.provenance).toContain("Demo");
    }
  });
});

describe("learning content", () => {
  it("has at least 10 lessons", () => {
    const lessonCount = courses.reduce(
      (total, course) => total + course.lessons.length,
      0,
    );
    expect(lessonCount).toBeGreaterThanOrEqual(10);
  });

  it("has unique lesson ids and slugs", () => {
    const lessons = courses.flatMap((course) => course.lessons);
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length);
  });

  it("references signs that exist in the database", () => {
    for (const course of courses) {
      for (const lesson of course.lessons) {
        for (const code of lesson.signIds) {
          expect(
            hieroglyphRepository.get(code),
            `${lesson.title} → unknown sign ${code}`,
          ).toBeDefined();
        }
        for (const section of lesson.content) {
          for (const code of section.signIds ?? []) {
            expect(
              hieroglyphRepository.get(code),
              `${lesson.title} section → unknown sign ${code}`,
            ).toBeDefined();
          }
        }
      }
    }
  });

  it("references quiz signs that exist", () => {
    for (const course of courses) {
      for (const lesson of course.lessons) {
        for (const question of lesson.quiz?.questions ?? []) {
          if (question.signId) {
            expect(
              hieroglyphRepository.get(question.signId),
              `${lesson.title} quiz → unknown sign ${question.signId}`,
            ).toBeDefined();
          }
        }
      }
    }
  });

  it("has quizzes whose correctIndex points at a real option", () => {
    for (const course of courses) {
      for (const lesson of course.lessons) {
        for (const question of lesson.quiz?.questions ?? []) {
          expect(question.options.length).toBeGreaterThan(1);
          expect(question.correctIndex).toBeGreaterThanOrEqual(0);
          expect(question.correctIndex).toBeLessThan(
            question.options.length,
          );
          expect(question.explanation.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("keeps lesson order unique within a course", () => {
    for (const course of courses) {
      const orders = course.lessons.map((lesson) => lesson.order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});

describe("tours", () => {
  const tours = tourRepository.list();

  it("includes at least 5 tours", () => {
    expect(tours.length).toBeGreaterThanOrEqual(5);
  });

  it("references a museum and artifacts that exist", () => {
    const museumIds = new Set(museums.map((museum) => museum.id));
    const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
    for (const tour of tours) {
      expect(museumIds.has(tour.museumId), `${tour.title} museum`).toBe(true);
      for (const stop of tour.stops) {
        // A stop may mark a room or a viewpoint instead of an
        // object, so artifactId is optional by design. Every
        // stop in the seed data does point at an object, and
        // each of those must resolve.
        if (!stop.artifactId) continue;
        expect(
          artifactIds.has(stop.artifactId),
          `${tour.title} → ${stop.artifactId}`,
        ).toBe(true);
      }
    }
  });

  it("gives every stop something to point at", () => {
    // A stop with neither an object nor a room has no meaning.
    for (const tour of tours) {
      for (const stop of tour.stops) {
        expect(
          Boolean(stop.artifactId) || Boolean(stop.roomId),
          `${tour.title} stop ${stop.order} points at nothing`,
        ).toBe(true);
      }
    }
  });

  it("keeps stops in the same museum as the tour", () => {
    for (const tour of tours) {
      for (const stop of tour.stops) {
        if (!stop.artifactId) continue;
        const artifact = artifacts.find(
          (entry) => entry.id === stop.artifactId,
        );
        expect(artifact).toBeDefined();
        expect(
          artifact!.museumId,
          `${tour.title} stop ${stop.id} is in another museum`,
        ).toBe(tour.museumId);
      }
    }
  });

  it("numbers stops from 1 without gaps", () => {
    for (const tour of tours) {
      const orders = tour.stops.map((stop) => stop.order).sort((a, b) => a - b);
      expect(orders).toEqual(
        orders.map((_, index) => index + 1),
      );
    }
  });

  it("gives every stop a narration", () => {
    for (const tour of tours) {
      for (const stop of tour.stops) {
        expect(stop.narration.length).toBeGreaterThan(20);
        expect(stop.durationSeconds).toBeGreaterThan(0);
      }
    }
  });
});

describe("sample inscriptions", () => {
  const samples = sampleInscriptions();

  it("provides at least 10 samples", () => {
    expect(samples.length).toBeGreaterThanOrEqual(10);
  });

  it("only references signs that exist", () => {
    for (const sample of samples) {
      for (const code of sample.signIds) {
        expect(
          hieroglyphRepository.get(code),
          `${sample.label} → ${code}`,
        ).toBeDefined();
      }
    }
  });

  it("renders a glyph for every sign", () => {
    for (const sample of samples) {
      expect(sample.glyphs.length).toBeGreaterThan(0);
      for (const glyph of sample.glyphs.split(" ")) {
        expect(glyph.codePointAt(0)!).toBeGreaterThanOrEqual(0x13000);
      }
    }
  });

  it("encodes the drawn signs into the image so the demo reading agrees", () => {
    // The attribute travels percent-encoded inside the data
    // URL, so "=" may appear as %3D.
    for (const sample of samples) {
      expect(sample.image).toMatch(/data-signs(?:=|%3D)/);
      expect(decodeURIComponent(sample.image)).toContain(
        `data-signs="${sample.signIds.join(",")}"`,
      );
    }
  });
});

describe("globalSearch", () => {
  it("finds artifacts by name", () => {
    const results = globalSearch("rosetta");
    expect(results.some((result) => result.kind === "artifact")).toBe(true);
  });

  it("finds signs by Gardiner code", () => {
    const results = globalSearch("G017");
    expect(results.some((result) => result.kind === "hieroglyph")).toBe(true);
  });

  it("finds museums by city", () => {
    const results = globalSearch("London");
    expect(results.some((result) => result.kind === "museum")).toBe(true);
  });

  it("returns nothing for a very short query", () => {
    expect(globalSearch("a")).toEqual([]);
  });

  it("respects the limit", () => {
    expect(globalSearch("e", 3).length).toBeLessThanOrEqual(3);
  });
});

describe("repositories", () => {
  it("resolves an artifact by id and by slug", () => {
    const artifact = artifacts[0];
    expect(artifactRepository.get(artifact.id)?.id).toBe(artifact.id);
    expect(artifactRepository.get(artifact.slug)?.id).toBe(artifact.id);
  });

  it("returns featured artifacts", () => {
    expect(artifactRepository.featured().length).toBeGreaterThan(0);
    expect(
      artifactRepository.featured().every((artifact) => artifact.featured),
    ).toBe(true);
  });

  it("places artifacts on the museum plan", () => {
    const positions = museums.flatMap((museum) =>
      museumRepository.artifactPositions(museum.id),
    );
    expect(positions.length).toBe(artifacts.length);
    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThanOrEqual(1000);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThanOrEqual(1000);
    }
  });

  it("resolves every artifact to a room on its floor", () => {
    for (const museum of museums) {
      const resolved = museumRepository.artifactPositions(museum.id);
      expect(resolved.length).toBeGreaterThan(0);
      for (const entry of resolved) {
        const floor = museum.floors.find((candidate) =>
          candidate.rooms.some(
            (room) =>
              entry.x >= room.x &&
              entry.x <= room.x + room.width &&
              entry.y >= room.y &&
              entry.y <= room.y + room.height,
          ),
        );
        expect(floor, `${entry.artifact.name} sits outside every room`).toBeDefined();
      }
    }
  });
});