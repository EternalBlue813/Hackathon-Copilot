import { NextResponse } from "next/server";
import { callGLMChat, type ChatMessage } from "@/lib/glm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: Array<{ role: string; content: string }>;
      context?: string;
    };

    const userMessages = body.messages;
    if (!Array.isArray(userMessages) || userMessages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const systemPrompt = `You are Hackathon Copilot's built-in assistant. You help users understand and act on the information visible in this portal — extracted hackathon requirements, generated ideas, and AI judge results.

Be concise, helpful, and specific. Reference the session data when answering. If the user asks something outside of the portal's data, answer briefly but steer them back to actionable hackathon advice.

Current session data:
${body.context || "No data has been generated yet. Suggest the user start by extracting requirements from a hackathon brief."}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...userMessages.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as ChatMessage["role"],
        content: m.content,
      })),
    ];

    try {
      const reply = await callGLMChat(messages);
      return NextResponse.json({ reply });
    } catch {
      return NextResponse.json({
        reply: "I'm having trouble connecting to the AI service right now. Please check your GLM_API_KEY in .env.local and try again.",
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
