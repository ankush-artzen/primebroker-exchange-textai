import { NextRequest } from "next/server";
import { isAdmin, leadOwned } from "@/lib/access";
import { getAuthUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ownerNames, serializeLead } from "@/lib/records";
import { parseFollowUpMoment } from "@/lib/utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const lead = await prisma.lead.findFirst({
      where: leadOwned(user, id),
    });
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const names = isAdmin(user) ? await ownerNames([lead.userId]) : null;
    return Response.json({
      ...serializeLead(lead, false),
      ...(names ? { ownerName: names.get(lead.userId) ?? null } : {}),
    });
  } catch (error) {
    console.error("get lead error:", error);
    return Response.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.lead.findFirst({
      where: leadOwned(user, id),
    });
    if (!existing) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name.trim();
    if (body.phone !== undefined) data.phone = body.phone.trim();
    if (body.requirement !== undefined)
      data.requirement = body.requirement?.trim() || null;
    if (body.location !== undefined)
      data.location = body.location?.trim() || null;
    if (body.budget !== undefined) data.budget = body.budget?.trim() || null;
    if (body.source !== undefined) data.source = body.source?.trim() || null;
    if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
    if (body.status !== undefined) data.status = body.status?.trim() || "new";
    if (body.followUpDone !== undefined) data.followUpDone = body.followUpDone;
    if (body.followUpDate !== undefined) {
      data.followUpDate = body.followUpDate
        ? parseFollowUpMoment(body.followUpDate)
        : null;
    }

    const lead = await prisma.lead.update({ where: { id }, data });

    return Response.json({
      ...lead,
      followUpDate: lead.followUpDate?.toISOString() ?? null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("update lead error:", error);
    return Response.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.lead.findFirst({
      where: leadOwned(user, id),
    });
    if (!existing) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("delete lead error:", error);
    return Response.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
