import type { Role } from "./types";

export function normalizeRole(role: string | null | undefined): Role {
  if (role === "ADMIN" || role === "SUPERADMIN") return role;
  return "USER";
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPERADMIN";
}

/** Superadmin always can. An admin can when their user limit is at least 1. */
export function mayAddUsers(
  role: string | null | undefined,
  userLimit?: number | null,
): boolean {
  return role === "SUPERADMIN" || (role === "ADMIN" && (userLimit ?? 0) > 0);
}

export function homePath(role: string | null | undefined): string {
  return role === "SUPERADMIN" ? "/users" : "/today";
}

export function roleLabel(role: string | null | undefined): string {
  if (role === "SUPERADMIN") return "Super admin";
  if (role === "ADMIN") return "Admin";
  return "Broker";
}
