import twilio from "twilio";
import { toE164India } from "@/lib/utils";

/** Local testing only. Never set SKIP_OTP in production. */
export function isOtpBypass(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.SKIP_OTP === "1";
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

function getVerifyClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error("Twilio Verify is not configured");
  }

  return {
    client: twilio(accountSid, authToken),
    serviceSid,
  };
}

export function twilioUserMessage(error: unknown, fallback: string): string {
  const err = error as { code?: number; message?: string } | null;
  const code = err?.code;
  const message = err?.message ?? "";

  if (code === 20003) {
    return "Twilio authentication failed. Check Account SID and Auth Token.";
  }
  if (code === 20404) {
    return "No OTP was sent to this number. Request a new code.";
  }
  if (code === 60200 || code === 21211) {
    return "Enter a valid 10-digit mobile number.";
  }
  if (code === 60202) {
    return "Too many incorrect attempts. Request a new code.";
  }
  if (code === 60203) {
    return "Too many OTP requests. Please wait a few minutes.";
  }
  if (code === 21608 || /unverified/i.test(message) || /trial/i.test(message)) {
    return "only verified numbers can be used for verification";
  }

  return fallback;
}

export async function sendVerificationSms(phone: string) {
  const { client, serviceSid } = getVerifyClient();
  return client.verify.v2.services(serviceSid).verifications.create({
    to: toE164India(phone),
    channel: "sms",
  });
}

export async function checkVerificationSms(phone: string, code: string) {
  const { client, serviceSid } = getVerifyClient();
  const result = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({
      to: toE164India(phone),
      code,
    });

  return result.status === "approved";
}
