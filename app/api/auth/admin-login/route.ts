import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/session";
import { serializeUser } from "@/lib/user";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = String(username ?? "").trim().toLowerCase();
    const plainPassword = String(password ?? "");

    if (!normalizedUsername || !plainPassword) {
      return Response.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { username: normalizedUsername },
    });

    if (
      !user?.passwordHash ||
      (user.role !== "ADMIN" && user.role !== "SUPERADMIN") ||
      !verifyPassword(plainPassword, user.passwordHash)
    ) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    if (user.disabled) {
      return Response.json(
        { error: "This account is disabled" },
        { status: 403 },
      );
    }

    return Response.json(serializeUser(user, createSessionToken(user.id)));
  } catch (error) {
    console.error("admin login error:", error);
    return Response.json({ error: "Could not sign in" }, { status: 500 });
  }
}
