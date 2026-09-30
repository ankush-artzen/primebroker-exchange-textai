import { NextRequest } from "next/server";
import { getUserId, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { endOfToday, startOfToday } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return unauthorized();

  try {
    const startToday = startOfToday();
    const endToday = endOfToday();

    const leads = await prisma.lead.findMany({
      where: {
        userId,
        followUpDone: false,
        followUpDate: {
          gte: startToday,
          lte: endToday,
        },
      },
      orderBy: { followUpDate: "asc" },
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
    console.error("today leads error:", error);
    return Response.json(
      { error: "Failed to fetch today's leads" },
      { status: 500 },
    );
  }
}
