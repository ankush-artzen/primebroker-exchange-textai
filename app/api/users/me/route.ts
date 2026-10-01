import { NextRequest } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { countCreatedUsers, serializeUser } from "@/lib/user";
import { formatPhone } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const usersCreated =
    user.role === "ADMIN" ? await countCreatedUsers(user.id) : 0;
  return Response.json(serializeUser(user, undefined, usersCreated));
}

export async function PATCH(request: NextRequest) {
  const userId = (await getAuthUser(request))?.id;
  if (!userId) return unauthorized();

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: {
      name?: string;
      phone?: string;
      profilePictureUrl?: string | null;
    } = {};

    if (body.name !== undefined) {
      const name = body.name?.trim();
      if (!name) {
        return Response.json({ error: "Name is required" }, { status: 400 });
      }
      data.name = name;
    }

    if (body.phone !== undefined && existing.role === "USER") {
      const normalizedPhone = formatPhone(body.phone);

      if (!normalizedPhone || !/^\d{10}$/.test(normalizedPhone)) {
        return Response.json(
          { error: "Enter a valid 10-digit phone number" },
          { status: 400 },
        );
      }

      const phoneTaken = await prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });

      if (phoneTaken && phoneTaken.id !== userId) {
        return Response.json(
          { error: "This phone number is already registered" },
          { status: 409 },
        );
      }

      data.phone = normalizedPhone;
    }

    if (body.profilePictureUrl !== undefined) {
      const nextUrl = body.profilePictureUrl?.trim() || null;

      if (
        existing.profilePictureUrl &&
        existing.profilePictureUrl !== nextUrl
      ) {
        await deleteCloudinaryImages([existing.profilePictureUrl]);
      }

      data.profilePictureUrl = nextUrl;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const usersCreated =
      user.role === "ADMIN" ? await countCreatedUsers(user.id) : 0;
    return Response.json(serializeUser(user, undefined, usersCreated));
  } catch (error) {
    console.error("update profile error:", error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
