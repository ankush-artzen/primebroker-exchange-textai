import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { isAdmin, propertyScope } from "@/lib/access";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  listingFromBody,
  optionalText,
  photoUrlsFrom,
} from "@/lib/property-listing";
import { ownerNames, serializeProperty } from "@/lib/records";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const properties = await prisma.property.findMany({
      where: propertyScope(user),
      orderBy: { updatedAt: "desc" },
    });
    const names = isAdmin(user)
      ? await ownerNames(properties.map((property) => property.userId))
      : null;

    return Response.json(
      properties.map((property) => ({
        ...serializeProperty(property, false),
        ...(names
          ? { ownerName: names.get(property.userId) ?? null }
          : {}),
      })),
    );
  } catch (error) {
    console.error("get properties error:", error);
    return Response.json(
      { error: "Failed to fetch properties" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (isAdmin(user)) {
    return Response.json(
      { error: "Only brokers can add properties" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = optionalText(body.title);
    const location = optionalText(body.location);
    const price = optionalText(body.price);

    if (!title || !location || !price) {
      return Response.json(
        { error: "Title, location, and price are required" },
        { status: 400 },
      );
    }

    const property = await prisma.property.create({
      data: {
        userId: user.id,
        title,
        location,
        price,
        configuration: optionalText(body.configuration),
        area: optionalText(body.area),
        availability: optionalText(body.availability),
        notes: optionalText(body.notes),
        photoUrls: photoUrlsFrom(body.photoUrls),
        listing: listingFromBody(body) as Prisma.InputJsonObject,
      },
    });

    return Response.json(serializeProperty(property, false));
  } catch (error) {
    console.error("create property error:", error);
    return Response.json(
      { error: "Failed to create property" },
      { status: 500 },
    );
  }
}
