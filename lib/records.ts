import { prisma } from "@/lib/prisma";

type Owned = { user?: { name: string } | null };

export async function ownerNames(userIds: string[]) {
  const ids = [...new Set(userIds)];
  if (!ids.length) return new Map<string, string>();

  const owners = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });

  return new Map(owners.map((owner) => [owner.id, owner.name]));
}

export function serializeLead<
  T extends Owned & {
    followUpDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
>(lead: T, includeOwner: boolean) {
  const { user, ...rest } = lead;
  return {
    ...rest,
    ...(includeOwner && user ? { ownerName: user.name } : {}),
    followUpDate: lead.followUpDate?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function serializeProperty<
  T extends Owned & {
    createdAt: Date;
    updatedAt: Date;
    listing?: unknown;
  },
>(property: T, includeOwner: boolean) {
  const { user, listing, ...rest } = property;
  const details =
    listing && typeof listing === "object" && !Array.isArray(listing)
      ? listing
      : {};
  return {
    ...rest,
    ...details,
    ...(includeOwner && user ? { ownerName: user.name } : {}),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}
