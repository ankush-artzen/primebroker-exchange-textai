import { NextRequest } from "next/server";
import { isAdmin, leadScope } from "@/lib/access";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ownerNames, serializeLead } from "@/lib/records";
import { endOfToday, startOfToday } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const startToday = startOfToday();
    const endToday = endOfToday();

    const leads = await prisma.lead.findMany({
      where: leadScope(user, {
        followUpDone: false,
        followUpDate: {
          gte: startToday,
          lte: endToday,
        },
      }),
      orderBy: { followUpDate: "asc" },
    });
    const names = isAdmin(user)
      ? await ownerNames(leads.map((lead) => lead.userId))
      : null;

    return Response.json(
      leads.map((lead) => ({
        ...serializeLead(lead, false),
        ...(names ? { ownerName: names.get(lead.userId) ?? null } : {}),
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
