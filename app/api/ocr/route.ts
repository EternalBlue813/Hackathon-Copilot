import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_BASE_URL = process.env.GLM_BASE_URL2 || "https://generativelanguage.googleapis.com/v1beta/openai";
const GEMINI_MODEL = process.env.GLM_MODEL2 || "google/gemini-3.1-pro-preview";

function geminiCompletionsUrl(): string {
  const base = GEMINI_BASE_URL.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) {
    return base;
  }
  return `${base}/chat/completions`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GLM_API_KEY2;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GLM_API_KEY2 is not set. Configure it in .env.local for Gemini vision OCR." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const mimeType = file.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const response = await fetch(geminiCompletionsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all visible text from this image. Return only the raw extracted text, preserving the original structure and line breaks. Do not add any commentary, labels, or formatting.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: `Gemini vision request failed (${response.status}): ${detail}` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OCR failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
