import { NextRequest } from "next/server";
import { getUserId, unauthorized } from "@/lib/api-auth";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    const property = await prisma.property.findFirst({ where: { id, userId } });
    if (!property) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    return Response.json({
      ...property,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("get property error:", error);
    return Response.json({ error: "Failed to fetch property" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.property.findFirst({ where: { id, userId } });
    if (!existing) {
      return Response.json({ error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.location !== undefined) data.location = body.location.trim();
    if (body.price !== undefined) data.price = body.price.trim();
    if (body.configuration !== undefined)
      data.configuration = body.configuration?.trim() || null;
    if (body.area !== undefined) data.area = body.area?.trim() || null;
    if (body.availability !== undefined)
      data.availability = body.availability?.trim() || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.photoUrls !== undefined) {
      data.photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls : [];
    }

    if (body.photoUrls !== undefined) {
      const nextUrls = data.photoUrls as string[];
      const removed = existing.photoUrls.filter((url) => !nextUrls.includes(url));
      await deleteCloudinaryImages(removed);
    }

    const property = await prisma.property.update({ where: { id }, data });

    return Response.json({
      ...property,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("update property error:", error);
    return Response.json(
      { error: "Failed to update property" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.property.findFirst({ where: { id, userId } });
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
