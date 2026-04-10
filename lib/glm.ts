const DEFAULT_BASE_URL = process.env.GLM_BASE_URL || "https://api.z.ai/api/paas/v4";
const DEFAULT_MODEL = process.env.GLM_MODEL || "glm-5.1";

function chatCompletionsUrl(): string {
  const base = DEFAULT_BASE_URL.replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) {
    return base;
  }
  return `${base}/chat/completions`;
}

export async function callGLM(prompt: string): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GLM_API_KEY environment variable.");
  }

  const response = await fetch(chatCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: "Return only valid JSON with no markdown fencing.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GLM API request failed with ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("GLM API returned an empty response.");
  }

  return content;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function callGLMChat(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GLM_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GLM_API_KEY environment variable.");
  }

  const response = await fetch(chatCompletionsUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.5,
      messages,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GLM API request failed with ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("GLM API returned an empty response.");
  }

  return content;
}
