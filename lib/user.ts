import { prisma } from "@/lib/prisma";
import { mayAddUsers, normalizeRole } from "@/lib/roles";

export function parseUsername(value: unknown): string | null {
  const username = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9._-]{3,32}$/.test(username) ? username : null;
}

/** Blank means 0. Returns null when the value is not a whole number from 0 to 500. */
export function parseUserLimit(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return 0;
  const limit = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(limit) || limit < 0 || limit > 500) return null;
  return limit;
}

export function countCreatedUsers(userId: string) {
  return prisma.user.count({
    where: { createdById: userId, role: "USER" },
  });
}

export function serializeUser(
  user: {
    id: string;
    name: string;
    phone: string | null;
    username?: string | null;
    role?: string | null;
    canAddUsers?: boolean | null;
    userLimit?: number | null;
    disabled?: boolean | null;
    profilePictureUrl: string | null;
    createdAt: Date;
  },
  sessionToken?: string,
  usersCreated = 0,
  createdByName: string | null = null,
) {
  const role = normalizeRole(user.role);
  const userLimit = user.userLimit ?? 0;

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    username: user.username ?? null,
    role,
    userLimit,
    usersCreated,
    disabled: user.disabled === true,
    createdByName,
    canAddUsers: mayAddUsers(role, userLimit),
    profilePictureUrl: user.profilePictureUrl,
    createdAt: user.createdAt.toISOString(),
    ...(sessionToken ? { sessionToken } : {}),
  };
}
