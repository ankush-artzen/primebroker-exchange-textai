import { NextRequest } from "next/server";
import { getUserId, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  try {
    const properties = await prisma.property.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(
      properties.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
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
  const userId = getUserId(request);
  if (!userId) return unauthorized();

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
        userId,
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
