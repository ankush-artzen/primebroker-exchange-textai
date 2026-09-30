import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ParsedLead } from "@/lib/types";

type AiProvider = "openai" | "anthropic";

function resolveProvider(): AiProvider | null {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (forced === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : null;
  }
  if (forced === "anthropic") {
    return process.env.ANTHROPIC_API_KEY ? "anthropic" : null;
  }
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

function extractionPrompt(text: string, langLabel: string) {
  return `You extract real-estate lead information from broker voice notes.
The speech was in ${langLabel}. Transcribed text may be Hindi, Punjabi, English, or mixed.

"""
${text.trim()}
"""

CRITICAL: Every string value you return MUST be in English only.
- Translate Hindi/Punjabi meaning into English. Do not copy Devanagari or Gurmukhi into any field.
- Names and place names: use English/Latin spelling (e.g. "Rajesh Sharma", "Mohali", "Chandigarh").
- Requirement: English (e.g. "2BHK", "shop", "plot").
- Budget: English numerals and words (e.g. "50 lakh", "1.2 crore").
- Source: English (e.g. "referral", "walk-in", "portal").
- Notes: a short English summary of anything extra.

Return ONLY valid JSON with these optional fields (use null for missing):
{
  "name": string,
  "phone": string (digits only, include country code if mentioned),
  "requirement": string (e.g. 2BHK, shop, plot),
  "location": string,
  "budget": string,
  "source": string (referral, walk-in, portal, etc.),
  "notes": string,
  "followUpDate": string (ISO date YYYY-MM-DD if a follow-up day is mentioned, else null)
}

Today is ${new Date().toISOString().split("T")[0]}. If they say "tomorrow", use tomorrow's date.`;
}

function parseLeadJson(raw: string): ParsedLead {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("NO_JSON");
  }
  return JSON.parse(jsonMatch[0]) as ParsedLead;
}

async function parseWithOpenAI(prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract lead fields. Translate any Hindi or Punjabi into English. Every JSON string value must be English/Latin script only. Return only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

async function parseWithAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("UNEXPECTED_RESPONSE");
  }
  return block.text;
}

function isAuthError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    error.status === 401
  );
}

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text?.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const provider = resolveProvider();
    if (!provider) {
      return Response.json(
        { error: "AI service not configured" },
        { status: 503 },
      );
    }

    const langLabel =
      language === "hi-IN"
        ? "Hindi"
        : language === "pa-IN"
          ? "Punjabi"
          : "English";

    const prompt = extractionPrompt(text, langLabel);
    const raw =
      provider === "openai"
        ? await parseWithOpenAI(prompt)
        : await parseWithAnthropic(prompt);

    if (!raw.trim()) {
      return Response.json({ error: "Unexpected AI response" }, { status: 500 });
    }

    try {
      return Response.json(parseLeadJson(raw));
    } catch {
      return Response.json(
        { error: "Could not parse AI response" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("parse-lead error:", error);

    if (error instanceof Error && error.message === "UNEXPECTED_RESPONSE") {
      return Response.json({ error: "Unexpected AI response" }, { status: 500 });
    }

    const status = isAuthError(error) ? 503 : 500;
    const message = isAuthError(error)
      ? "AI service misconfigured"
      : "Failed to parse lead";

    return Response.json({ error: message }, { status });
  }
}
