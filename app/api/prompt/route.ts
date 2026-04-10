import { NextResponse } from "next/server";
import { callGLMChat, type ChatMessage } from "@/lib/glm";

const SECONDARY_BASE_URL = process.env.GLM_BASE_URL2 || "";
const SECONDARY_MODEL = process.env.GLM_MODEL2 || "";

function secondaryCompletionsUrl(): string {
  const base = SECONDARY_BASE_URL.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}

async function callSecondaryModel(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GLM_API_KEY2;

  if (!apiKey || !SECONDARY_BASE_URL) {
    throw new Error("GLM_API_KEY2 / GLM_BASE_URL2 not configured.");
  }

  const response = await fetch(secondaryCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: SECONDARY_MODEL,
      temperature: 0.5,
      messages,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Secondary model request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Secondary model returned an empty response.");
  return content;
}

const SYSTEM_PROMPT = `You are an expert prompt engineer who writes comprehensive, battle-tested prompts for AI coding assistants (Cursor, Windsurf, Bolt, Lovable, v0, Claude, ChatGPT, etc.).

Given a hackathon idea and its context, generate a single, self-contained prompt that a user can paste into their preferred vibe-coding tool. The prompt must instruct the AI to build a complete, working MVP from scratch without stopping.

The generated prompt MUST include:
1. A clear project title and one-line description
2. The exact tech stack to use (infer sensible defaults from the idea)
3. Complete feature list broken into phases
4. UI/UX requirements with specific layout descriptions
5. API routes or backend logic needed
6. Data models / types
7. Step-by-step build instructions that the AI must follow sequentially
8. A rule that says "DO NOT STOP until the full MVP is working end-to-end"
9. Error handling and edge case instructions
10. A final polish phase (clean UI, loading states, responsive design)

Format the output as a ready-to-paste prompt in plain text (not JSON). Use markdown formatting inside the prompt so it reads well when pasted. Make it thorough — 800 to 1500 words. Do not include any preamble or commentary outside the prompt itself.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idea?: string;
      theme?: string;
      requirements?: string[];
      criteria?: string[];
      judgeResult?: string;
      model?: "primary" | "secondary";
    };

    const idea = body.idea?.trim();
    if (!idea) {
      return NextResponse.json({ error: "Idea description is required." }, { status: 400 });
    }

    const contextParts: string[] = [`Hackathon Idea:\n${idea}`];

    if (body.theme) contextParts.push(`Theme: ${body.theme}`);
    if (body.requirements?.length) contextParts.push(`Requirements:\n${body.requirements.map((r) => `- ${r}`).join("\n")}`);
    if (body.criteria?.length) contextParts.push(`Judging criteria: ${body.criteria.join(", ")}`);
    if (body.judgeResult) contextParts.push(`Judge feedback:\n${body.judgeResult}`);

    const userMessage = contextParts.join("\n\n");

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ];

    try {
      let prompt: string;

      if (body.model === "secondary") {
        prompt = await callSecondaryModel(messages);
      } else {
        prompt = await callGLMChat(messages);
      }

      return NextResponse.json({ prompt });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prompt generation failed.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
