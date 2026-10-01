import { NextRequest } from "next/server";
import type { SpeechLanguage } from "@/lib/types";

const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";
const MAX_BYTES = 8 * 1024 * 1024;

function sarvamOptions(language: string): {
  languageCode: string;
  mode: "transcribe" | "codemix";
} {
  if (language === "hinglish") {
    return { languageCode: "hi-IN", mode: "codemix" };
  }

  const languageCode: SpeechLanguage =
    language === "en-IN" || language === "pa-IN" || language === "hi-IN"
      ? language
      : "hi-IN";

  return { languageCode, mode: "transcribe" };
}

/** Sarvam rejects parameters such as `audio/webm;codecs=opus`. */
function sarvamMime(mime: string): string {
  const base = mime.split(";")[0]?.trim().toLowerCase() || "audio/webm";
  if (base === "video/webm") return "audio/webm";
  return base;
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac")) {
    return "m4a";
  }
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "webm";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY?.trim();
    if (!apiKey) {
      return Response.json(
        { error: "Speech service not configured. Add SARVAM_API_KEY." },
        { status: 503 },
      );
    }

    const incoming = await request.formData();
    const file = incoming.get("file");
    const language = String(incoming.get("language") ?? "hi-IN");

    if (!(file instanceof Blob) || file.size === 0) {
      return Response.json({ error: "Audio is required" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: "Recording is too long. Keep it under 30 seconds." },
        { status: 413 },
      );
    }

    const { languageCode, mode } = sarvamOptions(language);
    const mime = sarvamMime(file.type || "audio/webm");
    const bytes = await file.arrayBuffer();
    const audio = new Blob([bytes], { type: mime });

    const body = new FormData();
    body.append("file", audio, `speech.${extensionFor(mime)}`);
    body.append("model", "saaras:v4");
    body.append("mode", mode);
    body.append("language_code", languageCode);

    const sarvam = await fetch(SARVAM_STT_URL, {
      method: "POST",
      headers: { "api-subscription-key": apiKey },
      body,
    });

    const payload = (await sarvam.json().catch(() => null)) as {
      transcript?: string;
      language_code?: string | null;
      error?: { message?: string } | string;
    } | null;

    if (!sarvam.ok) {
      console.error("Sarvam STT error:", sarvam.status, payload);
      if (sarvam.status === 401 || sarvam.status === 403) {
        return Response.json(
          { error: "Speech service misconfigured. Check SARVAM_API_KEY." },
          { status: 503 },
        );
      }
      if (sarvam.status === 429) {
        return Response.json(
          { error: "Speech service is busy. Try again in a moment." },
          { status: 429 },
        );
      }
      if (sarvam.status === 422) {
        return Response.json(
          {
            error:
              "Couldn't process that recording. Speak for under 30 seconds and try again.",
          },
          { status: 422 },
        );
      }
      return Response.json(
        { error: "Couldn't transcribe speech" },
        { status: 502 },
      );
    }

    const transcript =
      typeof payload?.transcript === "string" ? payload.transcript.trim() : "";

    if (!transcript) {
      return Response.json(
        { error: "Didn't catch any words. Try again." },
        { status: 422 },
      );
    }

    return Response.json({
      transcript,
      languageCode: payload?.language_code ?? languageCode,
    });
  } catch (error) {
    console.error("transcribe error:", error);
    return Response.json(
      { error: "Couldn't transcribe speech" },
      { status: 500 },
    );
  }
}
