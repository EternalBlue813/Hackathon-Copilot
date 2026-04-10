import { NextResponse } from "next/server";
import { buildFallbackExtraction } from "@/lib/fallbacks";
import { callGLM } from "@/lib/glm";
import { parseJsonResponse } from "@/lib/json";
import { buildExtractionPrompt } from "@/lib/prompts";
import type { ExtractedRequirements } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Provide slide text or OCR text to extract requirements." }, { status: 400 });
    }

    try {
      const raw = await callGLM(buildExtractionPrompt(content));
      const parsed = parseJsonResponse<ExtractedRequirements>(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(buildFallbackExtraction(content));
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
