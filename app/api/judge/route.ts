import { NextResponse } from "next/server";
import { buildFallbackJudge } from "@/lib/fallbacks";
import { callGLM } from "@/lib/glm";
import { parseJsonResponse } from "@/lib/json";
import { buildJudgePrompt } from "@/lib/prompts";
import type { JudgeResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idea?: string;
      criteria?: string[];
    };

    const idea = body.idea?.trim();
    const criteria = Array.isArray(body.criteria) ? body.criteria.filter(Boolean) : [];

    if (!idea) {
      return NextResponse.json({ error: "Idea description is required for judging." }, { status: 400 });
    }

    try {
      const raw = await callGLM(buildJudgePrompt({ idea, criteria }));
      const parsed = parseJsonResponse<JudgeResult>(raw);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(buildFallbackJudge(idea, criteria));
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
