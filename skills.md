# Hackathon Copilot — project requirements

You are an expert full-stack engineer building a hackathon MVP called:

**"Hackathon Copilot"**

You MUST continuously build and improve the project step-by-step without stopping. Do not ask questions. Make reasonable assumptions and proceed.

Use GLM-5.1 APIs for all AI features.

---

## PROJECT GOAL

Build a lightweight web app that helps hackathon participants:

1. Extract key requirements from hackathon slides (image or text)
2. Generate hackathon ideas based on those requirements
3. Evaluate ideas using an AI judge based on criteria

The app must be simple, fast, and demo-ready.

---

## TECH STACK

**Frontend:**

- Next.js (App Router)
- Tailwind CSS
- Minimal clean UI

**Backend:**

- Next.js API routes (or simple Node handlers)

**AI:**

- GLM-5.1 API (text + multimodal if available)

No database required. Use in-memory or local state.

---

## CORE FEATURES (MVP)

### 1. Slide → Requirements Extraction

- **Input:** image upload OR pasted text
- **Output:**
  - Theme
  - Requirements
  - Judging Criteria

### 2. Idea Generator

- **Input:**
  - Extracted theme + criteria
  - Optional user input
- **Output:**
  - 3 ideas
  - Each includes:
    - Problem
    - Solution
    - MVP scope

### 3. AI Judge

- **Input:**
  - Idea description
  - Criteria
- **Output:**
  - Scores (Innovation, Feasibility, Impact)
  - Justification
  - Improvements

---

## IMPORTANT RULES

- ALWAYS produce working code
- NEVER leave placeholders like "TODO"
- ALWAYS run and connect features end-to-end
- Keep everything minimal and functional
- Prefer simple over perfect

---

## ITERATIVE BUILD PLAN

You must follow this sequence and KEEP GOING without stopping:

### PHASE 1: PROJECT SETUP

- Initialize Next.js app
- Install Tailwind
- Create basic layout:
  - Header
  - 3 tabs:
    1. Extract
    2. Generate
    3. Judge

### PHASE 2: UI SCAFFOLD

Create simple UI components:

**Extract Page:**

- Image upload
- Text input
- "Extract" button
- Output panel

**Generate Page:**

- Input box
- "Generate Ideas" button
- Results cards

**Judge Page:**

- Idea input
- Criteria input
- "Evaluate" button
- Score display

### PHASE 3: GLM API INTEGRATION

Create reusable function:

`callGLM(prompt: string): Promise<string>`

Then implement:

1. `extractRequirements()` — Prompt: Extract theme, requirements, judging criteria
2. `generateIdeas()` — Prompt: Generate 3 ideas with structured output
3. `judgeIdea()` — Prompt: Score + feedback

### PHASE 4: CONNECT UI TO BACKEND

- Hook buttons to API routes
- Display loading states
- Render outputs cleanly

### PHASE 5: STRUCTURED OUTPUT FORMATTING

Ensure all AI outputs are JSON-like:

Example:

```json
{
  "theme": "...",
  "requirements": [...],
  "criteria": [...]
}
```

Parse and render nicely.

### PHASE 6: IMPROVE UX

- Add loading spinners
- Add copy buttons
- Add "Use extracted data" autofill
- Add error handling

### PHASE 7: AI JUDGE ENHANCEMENT

Improve judge to:

- Always return scores out of 10
- Add 2 actionable suggestions
- Add "Improved Idea" output

### PHASE 8: POLISH FOR DEMO

- Clean UI spacing
- Add titles and labels
- Add example placeholder text
- Ensure flow: Extract → Generate → Judge

---

## CONTINUOUS IMPROVEMENT LOOP

After finishing all phases:

Repeat indefinitely:

1. Refactor code for clarity
2. Improve prompts for better outputs
3. Improve UI usability
4. Reduce latency
5. Add small enhancements (but keep lightweight)

Do NOT stop. Continue improving.

---

## PROMPT TEMPLATES

Use high-quality prompts:

- **Extraction:** "You are an expert at analyzing hackathon slides..."
- **Idea Generator:** "You are a creative hackathon participant..."
- **Judge:** "You are a strict hackathon judge..."

---

## OUTPUT FORMAT

Always:

- Show file structure
- Show code changes
- Explain briefly
- Then proceed immediately to next step

DO NOT STOP BUILDING.

CONTINUE UNTIL FULL MVP IS COMPLETE AND IMPROVED.
