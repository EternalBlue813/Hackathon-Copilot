export type ExtractedRequirements = {
  theme: string;
  requirements: string[];
  criteria: string[];
  summary: string;
};

export type HackathonIdea = {
  title: string;
  problem: string;
  solution: string;
  mvpScope: string;
};

export type GeneratedIdeas = {
  ideas: HackathonIdea[];
};

export type JudgeResult = {
  scores: {
    innovation: number;
    feasibility: number;
    impact: number;
  };
  justification: string;
  improvements: string[];
  improvedIdea: string;
};
