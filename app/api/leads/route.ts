import { NextRequest } from "next/server";
import { getUserId, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { parseFollowUpMoment } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  try {
    const leads = await prisma.lead.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(
      leads.map((l) => ({
        ...l,
        followUpDate: l.followUpDate?.toISOString() ?? null,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("get leads error:", error);
    return Response.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json();
    const {
      name,
      phone,
      requirement,
      location,
      budget,
      source,
      notes,
      followUpDate,
      status,
    } = body;

    if (!name?.trim() || !phone?.trim()) {
      return Response.json(
        { error: "Name and phone are required" },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone.trim(),
        requirement: requirement?.trim() || null,
        location: location?.trim() || null,
        budget: budget?.trim() || null,
        source: source?.trim() || null,
        notes: notes?.trim() || null,
        followUpDate: followUpDate ? parseFollowUpMoment(followUpDate) : null,
        status: status?.trim() || "new",
      },
    });

    return Response.json({
      ...lead,
      followUpDate: lead.followUpDate?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("create lead error:", error);
    return Response.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
