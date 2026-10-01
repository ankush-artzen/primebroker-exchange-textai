import { NextRequest } from "next/server";
import { actorMayAddUsers, isSuperAdmin } from "@/lib/access";
import { forbidden, getAuthUser, unauthorized } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { parseUserLimit, parseUsername, serializeUser } from "@/lib/user";
import { isValidPersonName, normalizeIndianPhone } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!isSuperAdmin(user) && !actorMayAddUsers(user)) return forbidden();

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
      ,
      
    });
    const createdCounts = new Map<string, number>();
    const namesById = new Map(users.map((entry) => [entry.id, entry.name]));
    for (const entry of users) {
      if (entry.createdById && entry.role === "USER") {
        createdCounts.set(
          entry.createdById,
          (createdCounts.get(entry.createdById) ?? 0) + 1,
        );
      }
    }

    return Response.json(
      users.map((entry) =>
        serializeUser(
          entry,
          undefined,
          createdCounts.get(entry.id) ?? 0,
          entry.createdById ? (namesById.get(entry.createdById) ?? null) : null,
        ),
      ),
    );
  } catch (error) {
    console.error("list users error:", error);
    return Response.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const actor = await getAuthUser(request);
  if (!actor) return unauthorized();
  if (!actorMayAddUsers(actor)) return forbidden();

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const role = body.role === "ADMIN" ? "ADMIN" : "USER";

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    if (!isValidPersonName(name)) {
      return Response.json(
        { error: "Name can only contain letters" },
        { status: 400 },
      );
    }

    if (role === "ADMIN") {
      if (!isSuperAdmin(actor)) {
        return Response.json(
          { error: "Only a super admin can add an admin" },
          { status: 403 },
        );
      }

      const username = parseUsername(body.username);
      const password = String(body.password ?? "");
      const userLimit = parseUserLimit(body.userLimit);
      if (!username) {
        return Response.json(
          { error: "Username must be 3–32 letters, numbers, dots, or dashes" },
          { status: 400 },
        );
      }
      if (password.length < 8) {
        return Response.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 },
        );
      }
      if (userLimit === null) {
        return Response.json(
          { error: "Enter how many users this admin can add (0–500)" },
          { status: 400 },
        );
      }

      const usernameTaken = await prisma.user.findFirst({ where: { username } });
      if (usernameTaken) {
        return Response.json(
          { error: "This username is already taken" },
          { status: 409 },
        );
      }

      const created = await prisma.user.create({
        data: {
          name,
          username,
          passwordHash: hashPassword(password),
          role: "ADMIN",
          userLimit,
          canAddUsers: userLimit > 0,
        },
      });

      return Response.json(serializeUser(created, undefined, 0), { status: 201 });
    }

    const phone = normalizeIndianPhone(String(body.phone ?? ""));
    if (phone.length !== 10) {
      return Response.json(
        { error: "Enter a valid 10-digit phone number" },
        { status: 400 },
      );
    }

    if (actor.role === "ADMIN") {
      const limit = actor.userLimit ?? 0;
      const createdCount = await prisma.user.count({
        where: { createdById: actor.id, role: "USER" },
      });
      if (createdCount >= limit) {
        return Response.json(
          {
            error: `You can add ${limit} user${limit === 1 ? "" : "s"}. Ask a super admin to raise the limit.`,
          },
          { status: 403 },
        );
      }
    }

    const phoneTaken = await prisma.user.findUnique({ where: { phone } });
    if (phoneTaken) {
      return Response.json(
        { error: "This phone number is already registered" },
        { status: 409 },
      );
    }

    const created = await prisma.user.create({
      data: {
        name,
        phone,
        role: "USER",
        canAddUsers: false,
        userLimit: 0,
        createdById: actor.id,
      },
    });

    return Response.json(serializeUser(created), { status: 201 });
  } catch (error) {
    console.error("create user error:", error);
    return Response.json({ error: "Failed to add user" }, { status: 500 });
  }
}
