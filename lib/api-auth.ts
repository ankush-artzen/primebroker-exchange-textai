import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionToken } from "@/lib/session";

export function getUserId(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return readSessionToken(header.slice(7).trim());
}

let userDefaults: Promise<unknown> | null = null;

function ensureUserDefaults() {
  userDefaults ??= prisma
    .$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { canAddUsers: { $exists: false } },
          u: { $set: { canAddUsers: false } },
          multi: true,
        },
        {
          q: { userLimit: { $exists: false } },
          u: { $set: { userLimit: 0 } },
          multi: true,
        },
        {
          q: { disabled: { $exists: false } },
          u: { $set: { disabled: false } },
          multi: true,
        },
      ],
    })
    .catch((error) => {
      userDefaults = null;
      console.error("user defaults error:", error);
    });

  return userDefaults;
}

export async function getAuthUser(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return null;

  try {
    await ensureUserDefaults();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.disabled) return null;
    return user;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
