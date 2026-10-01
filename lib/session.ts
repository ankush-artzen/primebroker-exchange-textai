import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string | null {
  return (
    process.env.SESSION_SECRET ||
    process.env.OTP_TOKEN_SECRET ||
    process.env.TWILIO_AUTH_TOKEN ||
    null
  );
}

// export function createSessionToken(userId: string, role: Role): string {
export function createSessionToken(userId: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("Session secret is not configured");
  }

  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function readSessionToken(token: string): string | null {
  try {
    const secret = getSecret();
    if (!secret) return null;

    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot <= 0) return null;

    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = createHmac("sha256", secret).update(payload).digest("hex");

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

    const userId = payload.slice(0, sep);
    const exp = Number(payload.slice(sep + 1));
    if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;

    return userId;
  } catch {
    return null;
  }
}
