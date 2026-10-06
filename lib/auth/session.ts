import type { UserRole } from "@/types/common";

/**
 * Authentication and RBAC (spec §47).
 *
 * The MVP runs in guest mode: every visitor is a USER with
 * no persistence. The interface is the seam where a real
 * identity provider plugs in — nothing else in the app talks
 * to a session directly.
 *
 * Roles are ordered by capability. Each role's permissions are
 * derived, so adding a role means adding one entry rather than
 * auditing every check site.
 */

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Institutions this user may edit, empty for global roles. */
  museumIds: string[];
  createdAt: string;
}

/** Capability → roles that hold it. */
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

/** True when the session's role holds the permission. */
export function can(
  session: Session | null,
  permission: Permission,
): boolean {
  if (!session) return false;
  const roles: readonly UserRole[] = PERMISSIONS[permission];
  return roles.includes(session.role);
}

/** The anonymous guest session used in guest mode. */
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

/**
 * Resolve the current session.
 *
 * With no identity provider configured, this returns the
 * guest session. A deployment with a real IdP would read the
 * session cookie here instead — the rest of the app is
 * unchanged.
 */
export async function getSession(): Promise<Session> {
  if (!process.env.DATABASE_URL && !process.env.AUTH_SECRET) {
    return guestSession();
  }
  // Guest mode until an IdP is wired in: no session cookie
  // is trusted, so the visitor remains a USER.
  return guestSession();
}

/** Require a permission or return an error response. */
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

/** Human-readable role list for the admin UI. */
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