import { NextRequest } from "next/server";
import { isSuperAdmin } from "@/lib/access";
import { forbidden, getAuthUser, unauthorized } from "@/lib/api-auth";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  countCreatedUsers,
  parseUserLimit,
  parseUsername,
  serializeUser,
} from "@/lib/user";
import { isValidPersonName, normalizeIndianPhone } from "@/lib/utils";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

function isObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const actor = await getAuthUser(request);
  if (!actor) return unauthorized();
  if (!isSuperAdmin(actor)) return forbidden();

  const { id } = await params;
  if (!isObjectId(id)) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "SUPERADMIN") {
      return Response.json(
        { error: "Super admin accounts can't be changed here" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const data: {
      name?: string;
      phone?: string;
      username?: string;
      passwordHash?: string;
      userLimit?: number;
      canAddUsers?: boolean;
      disabled?: boolean;
    } = {};

    if (typeof body.disabled === "boolean") {
      data.disabled = body.disabled;
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return Response.json({ error: "Name is required" }, { status: 400 });
      }
      if (!isValidPersonName(name)) {
        return Response.json(
          { error: "Name can only contain letters" },
          { status: 400 },
        );
      }
      data.name = name;
    }

    if (body.userLimit !== undefined) {
      if (target.role !== "ADMIN") {
        return Response.json(
          { error: "Only admin accounts have a user limit" },
          { status: 400 },
        );
      }
      const userLimit = parseUserLimit(body.userLimit);
      if (userLimit === null) {
        return Response.json(
          { error: "Enter how many users this admin can add (0–500)" },
          { status: 400 },
        );
      }
      data.userLimit = userLimit;
      data.canAddUsers = userLimit > 0;
    }

    if (body.phone !== undefined) {
      if (target.role !== "USER") {
        return Response.json(
          { error: "Only broker accounts use a phone number" },
          { status: 400 },
        );
      }
      const phone = normalizeIndianPhone(String(body.phone));
      if (phone.length !== 10) {
        return Response.json(
          { error: "Enter a valid 10-digit phone number" },
          { status: 400 },
        );
      }
      const phoneTaken = await prisma.user.findUnique({ where: { phone } });
      if (phoneTaken && phoneTaken.id !== id) {
        return Response.json(
          { error: "This phone number is already registered" },
          { status: 409 },
        );
      }
      data.phone = phone;
    }

    if (body.username !== undefined) {
      if (target.role !== "ADMIN") {
        return Response.json(
          { error: "Only admin accounts use a username" },
          { status: 400 },
        );
      }
      const username = parseUsername(body.username);
      if (!username) {
        return Response.json(
          { error: "Username must be 3–32 letters, numbers, dots, or dashes" },
          { status: 400 },
        );
      }
      const usernameTaken = await prisma.user.findFirst({ where: { username } });
      if (usernameTaken && usernameTaken.id !== id) {
        return Response.json(
          { error: "This username is already taken" },
          { status: 409 },
        );
      }
      data.username = username;
    }

    if (body.password !== undefined && String(body.password).length > 0) {
      if (target.role !== "ADMIN") {
        return Response.json(
          { error: "Only admin accounts use a password" },
          { status: 400 },
        );
      }
      const password = String(body.password);
      if (password.length < 8) {
        return Response.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 },
        );
      }
      data.passwordHash = hashPassword(password);
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id }, data });
    const usersCreated =
      updated.role === "ADMIN" ? await countCreatedUsers(id) : 0;
    const creator = updated.createdById
      ? await prisma.user.findUnique({
          where: { id: updated.createdById },
          select: { name: true },
        })
      : null;

    return Response.json(
      serializeUser(updated, undefined, usersCreated, creator?.name ?? null),
    );
  } catch (error) {
    console.error("update user error:", error);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const actor = await getAuthUser(request);
  if (!actor) return unauthorized();
  if (!isSuperAdmin(actor)) return forbidden();

  const { id } = await params;
  if (!isObjectId(id)) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (target.id === actor.id || target.role === "SUPERADMIN") {
      return Response.json(
        { error: "This account can't be deleted" },
        { status: 400 },
      );
    }

    const properties = await prisma.property.findMany({
      where: { userId: id },
      select: { photoUrls: true },
    });
    const photoUrls = properties.flatMap((property) => property.photoUrls);
    if (target.profilePictureUrl) photoUrls.push(target.profilePictureUrl);
    await deleteCloudinaryImages(photoUrls);
    await prisma.lead.deleteMany({ where: { userId: id } });
    await prisma.property.deleteMany({ where: { userId: id } });
    await prisma.user.updateMany({
      where: { createdById: id },
      data: { createdById: null },
    });
    await prisma.user.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("delete user error:", error);
    return Response.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
