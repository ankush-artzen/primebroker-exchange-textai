import { NextRequest } from "next/server";
import { isAdmin, propertyScope } from "@/lib/access";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
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
    const body = await request.json();
    const {
      title,
      location,
      price,
      configuration,
      area,
      availability,
      notes,
      photoUrls,
    } = body;

    if (!title?.trim() || !location?.trim() || !price?.trim()) {
      return Response.json(
        { error: "Title, location, and price are required" },
        { status: 400 },
      );
    }

    const property = await prisma.property.create({
      data: {
        userId: user.id,
        title: title.trim(),
        location: location.trim(),
        price: price.trim(),
        configuration: configuration?.trim() || null,
        area: area?.trim() || null,
        availability: availability?.trim() || null,
        notes: notes?.trim() || null,
        photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
      },
    });

    return Response.json({
      ...property,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("create property error:", error);
    return Response.json(
      { error: "Failed to create property" },
      { status: 500 },
    );
  }
}
