export function parseJsonResponse<T>(content: string): T {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

    if (!match) {
      throw new Error("The AI response was not valid JSON.");
    }

    return JSON.parse(match[0]) as T;
  }
}
