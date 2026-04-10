import { NextResponse } from "next/server";
import { buildFallbackIdeas } from "@/lib/fallbacks";
import { callGLM } from "@/lib/glm";
import { parseJsonResponse } from "@/lib/json";
import { buildIdeaPrompt } from "@/lib/prompts";
import type { GeneratedIdeas } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      theme?: string;
      criteria?: string[];
      extraContext?: string;
    };

    const theme = body.theme?.trim();
    const criteria = Array.isArray(body.criteria) ? body.criteria.filter(Boolean) : [];

    if (!theme) {
      return NextResponse.json({ error: "Theme is required to generate ideas." }, { status: 400 });
    }

    const payload = {
      theme,
      criteria,
      extraContext: body.extraContext?.trim(),
    };

    try {
      const raw = await callGLM(buildIdeaPrompt(payload));
      const parsed = parseJsonResponse<GeneratedIdeas>(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(buildFallbackIdeas(payload));
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
