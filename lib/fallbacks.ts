import type { ExtractedRequirements, GeneratedIdeas, JudgeResult } from "@/lib/types";

export function buildFallbackExtraction(source: string): ExtractedRequirements {
  const text = source.trim() || "Build an AI hackathon project with strong demo value.";

  return {
    theme: "AI-powered hackathon productivity",
    requirements: [
      "Use AI to accelerate a hackathon workflow.",
      "Deliver a polished demo in a short time.",
      `Incorporate the provided context: ${text.slice(0, 140)}`,
    ],
    criteria: ["Innovation", "Feasibility", "Impact"],
    summary:
      "Fallback extraction was used because the GLM API is unavailable or misconfigured. Set GLM_API_KEY in .env.local.",
  };
}

export function buildFallbackIdeas(input: {
  theme: string;
  criteria: string[];
  extraContext?: string;
}): GeneratedIdeas {
  const context = input.extraContext?.trim();

  return {
    ideas: [
      {
        title: "Hackathon Copilot",
        problem: "Teams waste time reading rules, aligning on ideas, and preparing for judging.",
        solution: `A lightweight copilot that turns hackathon requirements into actionable ideas and judge-ready feedback around the theme "${input.theme}".${context ? ` It also uses this context: ${context.slice(0, 90)}.` : ""}`,
        mvpScope: "Requirement extraction, idea generation, AI judging, and a polished demo flow.",
      },
      {
        title: "SprintBoard AI",
        problem: "Hackathon teams struggle to choose the right MVP scope under time pressure.",
        solution:
          "An AI planner that scores feature trade-offs, recommends a 24-hour build plan, and highlights risky features early.",
        mvpScope: "Prompt-based planning, timeline generation, and feature prioritization.",
      },
      {
        title: "Pitch Polish",
        problem: "Great builds often lose because the final demo pitch is unclear.",
        solution:
          "An AI pitch coach that converts product notes into a strong demo narrative aligned with judging criteria.",
        mvpScope: "Pitch outline generation, one-click rewrites, and criteria-aligned talking points.",
      },
    ],
  };
}

export function buildFallbackJudge(idea: string, criteria: string[]): JudgeResult {
  return {
    scores: {
      innovation: 8,
      feasibility: 8,
      impact: 9,
    },
    justification: `This idea is easy to explain, aligns well with ${criteria.join(", ") || "common hackathon judging criteria"}, and has a strong demo loop.`,
    improvements: [
      "Define one user persona and a sharper core pain point.",
      "Cut the MVP to one headline workflow that can be shown in under two minutes.",
    ],
    improvedIdea: `${idea.trim()} Focus the demo on one user journey, show a measurable before/after improvement, and close with a clear judging hook.`,
  };
}
