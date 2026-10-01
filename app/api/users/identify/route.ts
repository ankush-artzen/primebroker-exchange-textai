import { NextRequest } from "next/server";
import { readOtpToken } from "@/lib/otp-token";
import { prisma } from "@/lib/prisma";
import {
  formatPhone,
  isValidPersonName,
  normalizeIndianPhone,
} from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, verificationToken } = await request.json();

    if (!phone?.trim() || !verificationToken?.trim()) {
      return Response.json(
        { error: "Phone verification is required" },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizeIndianPhone(formatPhone(phone));
    const verifiedPhone = readOtpToken(verificationToken);

    if (!verifiedPhone || verifiedPhone !== normalizedPhone) {
      return Response.json(
        { error: "Verify the OTP sent to your phone first" },
        { status: 401 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      return Response.json({
        id: existing.id,
        name: existing.name,
        phone: existing.phone,
        profilePictureUrl: existing.profilePictureUrl,
        createdAt: existing.createdAt.toISOString(),
      });
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    if (!isValidPersonName(trimmedName)) {
      return Response.json(
        { error: "Name can only contain letters" },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        phone: normalizedPhone,
      },
    });

    return Response.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      profilePictureUrl: user.profilePictureUrl,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("identify error:", error);
    return Response.json({ error: "Failed to identify user" }, { status: 500 });
  }
}
