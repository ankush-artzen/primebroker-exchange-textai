import { NextRequest } from "next/server";
import { createOtpToken } from "@/lib/otp-token";
import { prisma } from "@/lib/prisma";
import {
  checkVerificationSms,
  isOtpBypass,
  isTwilioConfigured,
  twilioUserMessage,
} from "@/lib/twilio";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!isTwilioConfigured()) {
      return Response.json(
        {
          error:
            "OTP is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID to .env",
        },
        { status: 503 },
      );
    }

    const { phone, code } = await request.json();
    const normalizedPhone = normalizeIndianPhone(phone ?? "");
    const otp = String(code ?? "").replace(/\D/g, "");

    if (!isValidIndianPhone(normalizedPhone)) {
      return Response.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return Response.json(
        { error: "Enter the 6-digit code sent to your phone" },
        { status: 400 },
      );
    }

    const approved = await checkVerificationSms(normalizedPhone, otp);
    if (!approved) {
      return Response.json(
        { error: "Invalid or expired code. Try again." },
        { status: 400 },
      );
    }

    const token = createOtpToken(normalizedPhone);
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    return Response.json({
      verified: true,
      token,
      user: user
        ? {
            id: user.id,
            name: user.name,
            phone: user.phone,
            profilePictureUrl: user.profilePictureUrl,
            createdAt: user.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return Response.json(
      {
        error: twilioUserMessage(
          error,
          "Could not verify OTP. Request a new code.",
        ),
      },
      { status: 502 },
    );
  }
}
