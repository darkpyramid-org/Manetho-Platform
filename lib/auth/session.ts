import type { UserRole } from "@/types/common";
import { cookies } from "next/headers";
import { isWeakAuthSecret } from "@/lib/api/ai-guards";

/**
 * Authentication and RBAC (spec §47).
 *
 * Demo / MVP modes:
 * - No IdP: returns guest (USER).
 * - DEMO_ADMIN_SECRET: set cookie or header `x-manetho-admin-secret` to elevate
 *   to CONTENT_EDITOR for local/demo admin access (issue #2).
 * - Production fail-closed: when AUTH_ENABLED/REQUIRE_AUTH is true, weak
 *   AUTH_SECRET is rejected by instrumentation (issue #4).
 */

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  museumIds: string[];
  createdAt: string;
}

const PERMISSIONS = {
  "content:read": ["USER", "RESEARCHER", "MUSEUM_EDITOR", "MUSEUM_ADMIN", "CONTENT_EDITOR", "SUPER_ADMIN"],
  "content:write": ["MUSEUM_EDITOR", "MUSEUM_ADMIN", "CONTENT_EDITOR", "SUPER_ADMIN"],
  "content:publish": ["MUSEUM_ADMIN", "CONTENT_EDITOR", "SUPER_ADMIN"],
  "content:review": ["CONTENT_EDITOR", "SUPER_ADMIN"],
  "museum:manage": ["MUSEUM_ADMIN", "SUPER_ADMIN"],
  "ai:review": ["RESEARCHER", "CONTENT_EDITOR", "SUPER_ADMIN"],
  "research:mode": ["RESEARCHER", "CONTENT_EDITOR", "SUPER_ADMIN"],
  "users:manage": ["SUPER_ADMIN"],
  "system:configure": ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

const ALL_ROLES: UserRole[] = [
  "USER",
  "RESEARCHER",
  "MUSEUM_EDITOR",
  "MUSEUM_ADMIN",
  "CONTENT_EDITOR",
  "SUPER_ADMIN",
];

export function can(
  session: Session | null,
  permission: Permission,
): boolean {
  if (!session) return false;
  const roles: readonly UserRole[] = PERMISSIONS[permission];
  return roles.includes(session.role);
}

export function guestSession(): Session {
  return {
    userId: "guest",
    email: "",
    displayName: "Guest",
    role: "USER",
    museumIds: [],
    createdAt: new Date().toISOString(),
  };
}

function demoAdminSession(): Session {
  return {
    userId: "demo-admin",
    email: "admin@manetho.local",
    displayName: "Demo Admin",
    role: "CONTENT_EDITOR",
    museumIds: [],
    createdAt: new Date().toISOString(),
  };
}

export async function getSession(): Promise<Session> {
  const secret = process.env.DEMO_ADMIN_SECRET?.trim();
  if (secret && !isWeakAuthSecret(secret)) {
    try {
      const headerStore = await import("next/headers");
      const h = await headerStore.headers();
      const fromHeader = h.get("x-manetho-admin-secret");
      if (fromHeader && fromHeader === secret) {
        return demoAdminSession();
      }
      const cookieStore = await cookies();
      const fromCookie = cookieStore.get("manetho_admin")?.value;
      if (fromCookie && fromCookie === secret) {
        return demoAdminSession();
      }
    } catch {
      // cookies()/headers() unavailable outside request context
    }
  }
  return guestSession();
}

export function requirePermission(
  session: Session,
  permission: Permission,
): { ok: true } | { ok: false; code: string; message: string } {
  if (can(session, permission)) return { ok: true };
  return {
    ok: false,
    code: "FORBIDDEN",
    message: `This action requires the ${permission} permission.`,
  };
}

export function requireWriteAccess(session: Session): ReturnType<typeof requirePermission> {
  return requirePermission(session, "content:write");
}

export function roleSummaries(): Array<{
  role: UserRole;
  permissions: Permission[];
}> {
  return ALL_ROLES.map((role) => ({
    role,
    permissions: (Object.keys(PERMISSIONS) as Permission[]).filter(
      (permission) =>
        (PERMISSIONS[permission] as readonly UserRole[]).includes(role),
    ),
  }));
}
