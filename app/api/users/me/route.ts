import { NextRequest } from "next/server";
import { getUserId, unauthorized } from "@/lib/api-auth";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/utils";

function serializeUser(user: {
  id: string;
  name: string;
  phone: string;
  profilePictureUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    profilePictureUrl: user.profilePictureUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(serializeUser(user));
  } catch (error) {
    console.error("get profile error:", error);
    return Response.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
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

    if (body.phone !== undefined) {
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

    return Response.json(serializeUser(user));
  } catch (error) {
    console.error("update profile error:", error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
