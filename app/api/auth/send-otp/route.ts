import { NextRequest } from "next/server";
import {
  isTwilioConfigured,
  sendVerificationSms,
  twilioUserMessage,
} from "@/lib/twilio";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/utils";

export const runtime = "nodejs";

const RESEND_MS = 30_000;
const lastSentAt = new Map<string, number>();

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

    const { phone } = await request.json();
    const normalizedPhone = normalizeIndianPhone(phone ?? "");

    if (!isValidIndianPhone(normalizedPhone)) {
      return Response.json(
        { error: "Enter a valid 10-digit mobile number" },
        { status: 400 },
      );
    }

    const lastSent = lastSentAt.get(normalizedPhone);
    if (lastSent && Date.now() - lastSent < RESEND_MS) {
      const wait = Math.ceil((RESEND_MS - (Date.now() - lastSent)) / 1000);
      return Response.json(
        { error: `Please wait ${wait}s before requesting another code` },
        { status: 429 },
      );
    }

    await sendVerificationSms(normalizedPhone);
    lastSentAt.set(normalizedPhone, Date.now());

    return Response.json({ ok: true });
  } catch (error) {
    console.error("send-otp error:", error);
    return Response.json(
      { error: twilioUserMessage(error, "Could not send OTP. Please try again.") },
      { status: 502 },
    );
  }
}
