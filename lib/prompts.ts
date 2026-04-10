export function buildExtractionPrompt(input: string) {
  return `You are an expert at analyzing hackathon slides and challenge briefs.
Extract the most important information from the content below.
Reply with raw JSON only: no markdown fences, no commentary before or after the JSON.
Return strictly valid JSON with this exact shape:
{
  "theme": "string",
  "requirements": ["string"],
  "criteria": ["string"],
  "summary": "string"
}
Rules:
- Make the theme concise.
- Requirements should be specific and action-oriented.
- Criteria should be normalized into short judging dimensions.
- If the input is noisy, infer the most likely hackathon brief.

Hackathon content:
${input}`;
}

export function buildIdeaPrompt(input: { theme: string; criteria: string[]; extraContext?: string }) {
  return `You are a creative hackathon participant who turns hackathon constraints into strong MVP concepts.
Reply with raw JSON only: no markdown fences, no commentary before or after the JSON.
Return strictly valid JSON with this exact shape:
{
  "ideas": [
    {
      "title": "string",
      "problem": "string",
      "solution": "string",
      "mvpScope": "string"
    }
  ]
}
Rules:
- Return exactly 3 ideas.
- Make each idea distinct.
- Optimize for demo value, speed to build, and alignment with the judging criteria.
- Keep each field concise but concrete.

Theme: ${input.theme}
Judging criteria: ${input.criteria.join(", ")}
Additional context: ${input.extraContext?.trim() || "None"}`;
}

export function buildJudgePrompt(input: { idea: string; criteria: string[] }) {
  return `You are a strict hackathon judge.
Evaluate the submitted idea against the judging criteria below.
Reply with raw JSON only: no markdown fences, no commentary before or after the JSON.
Return strictly valid JSON with this exact shape:
{
  "scores": {
    "innovation": 0,
    "feasibility": 0,
    "impact": 0
  },
  "justification": "string",
  "improvements": ["string", "string"],
  "improvedIdea": "string"
}
Rules:
- Scores must be integers from 0 to 10.
- Always provide exactly 2 actionable improvements.
- The improvedIdea should be a tighter, better version of the original idea.
- Use the judging criteria as context, but keep the three score keys exactly as listed.

Judging criteria: ${input.criteria.join(", ")}
Idea description:
${input.idea}`;
}
