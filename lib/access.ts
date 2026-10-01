import type { Prisma, Role } from "@prisma/client";
import { isStaffRole, mayAddUsers } from "@/lib/roles";

type Actor = {
  id: string;
  role: Role | null;
  canAddUsers?: boolean | null;
  userLimit?: number | null;
};

export function isAdmin(user: Actor): boolean {
  return isStaffRole(user.role);
}

export function isSuperAdmin(user: Actor): boolean {
  return user.role === "SUPERADMIN";
}

export function actorMayAddUsers(user: Actor): boolean {
  return mayAddUsers(user.role, user.userLimit);
}

export function leadScope(
  user: Actor,
  extra: Prisma.LeadWhereInput = {},
): Prisma.LeadWhereInput {
  if (isAdmin(user)) return extra;
  return { ...extra, userId: user.id };
}

export function leadOwned(user: Actor, id: string): Prisma.LeadWhereInput {
  return isAdmin(user) ? { id } : { id, userId: user.id };
}

export function propertyScope(
  user: Actor,
  extra: Prisma.PropertyWhereInput = {},
): Prisma.PropertyWhereInput {
  if (isAdmin(user)) return extra;
  return { AND: [extra, { userId: user.id }] };
}

export function propertyOwned(
  user: Actor,
  id: string,
): Prisma.PropertyWhereInput {
  return isAdmin(user) ? { id } : { id, userId: user.id };
}
