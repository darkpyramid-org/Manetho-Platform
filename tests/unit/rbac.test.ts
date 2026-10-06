import { describe, expect, it } from "vitest";
import {
  can,
  guestSession,
  requirePermission,
  roleSummaries,
  type Session,
} from "@/lib/auth/session";
import { features, isFeatureEnabled, aiProvider, isDemoMode } from "@/lib/features";
import type { UserRole } from "@/types/common";

describe("RBAC (spec §47)", () => {
  const session = (role: UserRole): Session => ({
    userId: "test",
    email: "test@example.com",
    displayName: "Test",
    role,
    museumIds: [],
    createdAt: new Date().toISOString(),
  });

  it("denies everything to an anonymous visitor", () => {
    expect(can(null, "content:read")).toBe(false);
    expect(can(null, "content:write")).toBe(false);
  });

  it("gives a USER read-only access", () => {
    const user = session("USER");
    expect(can(user, "content:read")).toBe(true);
    expect(can(user, "content:write")).toBe(false);
    expect(can(user, "content:publish")).toBe(false);
    expect(can(user, "users:manage")).toBe(false);
  });

  it("lets a MUSEUM_EDITOR write but not publish", () => {
    const editor = session("MUSEUM_EDITOR");
    expect(can(editor, "content:write")).toBe(true);
    expect(can(editor, "content:publish")).toBe(false);
    expect(can(editor, "museum:manage")).toBe(false);
  });

  it("lets a MUSEUM_ADMIN publish and manage a museum", () => {
    const admin = session("MUSEUM_ADMIN");
    expect(can(admin, "content:publish")).toBe(true);
    expect(can(admin, "museum:manage")).toBe(true);
    expect(can(admin, "users:manage")).toBe(false);
  });

  it("lets a RESEARCHER review AI output but not edit content", () => {
    const researcher = session("RESEARCHER");
    expect(can(researcher, "ai:review")).toBe(true);
    expect(can(researcher, "research:mode")).toBe(true);
    expect(can(researcher, "content:write")).toBe(false);
  });

  it("lets a CONTENT_EDITOR publish and review", () => {
    const editor = session("CONTENT_EDITOR");
    expect(can(editor, "content:publish")).toBe(true);
    expect(can(editor, "content:review")).toBe(true);
    expect(can(editor, "museum:manage")).toBe(false);
  });

  it("gives SUPER_ADMIN every permission", () => {
    const superAdmin = session("SUPER_ADMIN");
    for (const entry of roleSummaries()) {
      for (const permission of entry.permissions) {
        expect(can(superAdmin, permission)).toBe(true);
      }
    }
  });

  it("never grants a permission to a role that lacks it", () => {
    for (const entry of roleSummaries()) {
      const subject = session(entry.role);
      for (const permission of entry.permissions) {
        expect(can(subject, permission)).toBe(true);
      }
    }
  });

  it("returns a typed failure from requirePermission", () => {
    expect(requirePermission(session("USER"), "content:read")).toEqual({
      ok: true,
    });
    const denied = requirePermission(session("USER"), "content:write");
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.code).toBe("FORBIDDEN");
    }
  });

  it("creates a guest session with the USER role", () => {
    expect(guestSession().role).toBe("USER");
  });
});

describe("feature flags (spec §69)", () => {
  it("exposes every flag from the specification", () => {
    for (const key of [
      "translator",
      "aiAssistant",
      "voice",
      "museumMap",
      "ar",
      "vr",
      "learning",
      "researchMode",
      "offlineMode",
    ] as const) {
      expect(typeof features[key]).toBe("boolean");
      expect(isFeatureEnabled(key)).toBe(features[key]);
    }
  });

  it("enables the core features by default", () => {
    // The process env is unset in tests, so the defaults apply.
    expect(features.translator).toBe(true);
    expect(features.aiAssistant).toBe(true);
    expect(features.learning).toBe(true);
  });

  it("keeps AR and VR off by default", () => {
    expect(features.ar).toBe(false);
    expect(features.vr).toBe(false);
  });

  it("falls back to a known provider for unknown values", () => {
    expect(["mock", "openai", "huawei", "local"]).toContain(aiProvider());
  });

  it("runs in demo mode by default", () => {
    expect(isDemoMode()).toBe(true);
  });
});