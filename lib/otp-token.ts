import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 10 * 60 * 1000;

function getSecret() {
  const secret = process.env.OTP_TOKEN_SECRET || process.env.TWILIO_AUTH_TOKEN;
  if (!secret) {
    throw new Error("OTP token secret is not configured");
  }
  return secret;
}

export function createOtpToken(phone: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${phone}.${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function readOtpToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot <= 0) return null;

    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");

    const sigBuffer = Buffer.from(sig);
    const expectedBuffer = Buffer.from(expected);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const sep = payload.lastIndexOf(".");
    if (sep <= 0) return null;

    const phone = payload.slice(0, sep);
    const exp = Number(payload.slice(sep + 1));
    if (!phone || !Number.isFinite(exp) || Date.now() > exp) return null;

    return phone;
  } catch {
    return null;
  }
}
