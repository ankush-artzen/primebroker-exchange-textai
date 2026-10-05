import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdmin, propertyOwned } from "@/lib/access";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import {
  asRecord,
  listingFromBody,
  optionalText,
  photoUrlsFrom,
} from "@/lib/property-listing";
import { ownerNames, serializeProperty } from "@/lib/records";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const property = await prisma.property.findFirst({
      where: propertyOwned(user, id),
    });
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const names = isAdmin(user) ? await ownerNames([property.userId]) : null;
    return Response.json({
      ...serializeProperty(property, false),
      ...(names ? { ownerName: names.get(property.userId) ?? null } : {}),
    });
  } catch (error) {
    console.error("get property error:", error);
    return Response.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.property.findFirst({
      where: propertyOwned(user, id),
    });
    if (!existing) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const data: Prisma.PropertyUpdateInput = {};

    if ("title" in body) data.title = optionalText(body.title) ?? "";
    if ("location" in body) data.location = optionalText(body.location) ?? "";
    if ("price" in body) data.price = optionalText(body.price) ?? "";
    if ("configuration" in body) data.configuration = optionalText(body.configuration);
    if ("area" in body) data.area = optionalText(body.area);
    if ("availability" in body) data.availability = optionalText(body.availability);
    if ("notes" in body) data.notes = optionalText(body.notes);
    if ("photoUrls" in body) data.photoUrls = photoUrlsFrom(body.photoUrls);

    const listingPatch = listingFromBody(body);
    if (Object.keys(listingPatch).length > 0) {
      data.listing = {
        ...asRecord(existing.listing),
        ...listingPatch,
      } as Prisma.InputJsonObject;
    }

    if (body.photoUrls !== undefined) {
      const nextUrls = data.photoUrls as string[];
      const removed = existing.photoUrls.filter((url) => !nextUrls.includes(url));
      await deleteCloudinaryImages(removed);
    }

    const property = await prisma.property.update({ where: { id }, data });

    return Response.json(serializeProperty(property, false));
  } catch (error) {
    console.error("update property error:", error);
    return Response.json(
      { error: "Failed to update property" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.property.findFirst({
      where: propertyOwned(user, id),
    });
    if (!existing) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    await deleteCloudinaryImages(existing.photoUrls);
    await prisma.property.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("delete property error:", error);
    return Response.json(
      { error: "Failed to delete property" },
      { status: 500 },
    );
  }
}
