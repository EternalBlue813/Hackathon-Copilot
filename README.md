# Hackathon Copilot

> **Your AI-powered co-pilot for winning hackathons — from slide to pitch-ready code in minutes.**

Hackathon Copilot is a lightweight web app that turns raw hackathon briefs into structured requirements, generates strong MVP ideas, stress-tests them with an AI judge, and produces a ready-to-paste vibe-coding prompt — all in one seamless flow. Built for speed, clarity, and demo-readiness.

---

## The Problem

Singapore has become one of the most hackathon-dense countries in the world, with dozens of hackathons running every year across universities, enterprises, and government agencies. With so many events, participants often find themselves jumping from one hackathon to the next — and every time, the same bottleneck appears: teams scramble to read dense slide decks, align on what the judges actually want, brainstorm under pressure, and hope their idea holds up during evaluation. Hours are wasted before a single line of code is written.

## Our Solution

Hackathon Copilot compresses that entire process into a guided four-step pipeline powered by frontier LLMs:

### 1. Extract — Slide to Structure

Upload hackathon slide images or paste brief text. Gemini 3.1 Pro reads the images via multimodal vision, and GLM-5.1 parses the content into:

- **Theme** — what the hackathon is about
- **Requirements** — specific constraints and deliverables
- **Judging Criteria** — what judges will score on

Features drag-and-drop multi-image upload with progress tracking and a stop button for long batches.

### 2. Generate — Requirements to Ideas

One click auto-fills the extracted theme and criteria. GLM-5.1 generates **3 distinct MVP concepts**, each with:

- **Problem** — the pain point being addressed
- **Solution** — the proposed approach
- **MVP Scope** — what to build in the time available

### 3. Judge — Idea to Verdict

Select any idea and run it through an AI judge. GLM-5.1 returns:

- **Scores** — Innovation, Feasibility, and Impact (out of 10)
- **Justification** — why those scores were given
- **2 Actionable Improvements** — concrete next steps
- **Improved Idea** — a tighter rewrite of the original concept

### 4. Prompt — Idea to Vibe-Code Prompt

Turn any idea into a comprehensive, ready-to-paste prompt for your preferred AI coding tool (Cursor, Windsurf, Bolt, Lovable, v0, Claude, ChatGPT, etc.). The generated prompt includes:

- Project title and tech stack
- Complete feature list broken into build phases
- UI/UX layout descriptions
- API routes and data models
- Step-by-step build instructions with a "DO NOT STOP" rule
- Error handling and polish phase

Choose between **GLM-5.1** or **Gemini 3.1 Pro** for prompt generation via a model dropdown.

### + Information Summarizer

A persistent middle panel that displays all structured results — extracted briefs, generated ideas, and judge verdicts — with **Copy** (markdown format) and **Add to Notes** buttons on every card.

### + Copilot Chat

A floating AI assistant that has full context of your session — extracted requirements, generated ideas, judge results, and your notes. Ask it anything: _"Which idea scored highest?"_, _"Summarize the requirements"_, _"What tech stack fits idea 2?"_

### + Hackathon Notes

A persistent, free-form notepad on the right side of the screen. Append any output with one click, edit freely, and keep your thinking organized across all tabs.

---

## Demo Flow

```
Upload slides → Extract requirements → Generate 3 ideas → Judge the best one → Generate vibe-code prompt → Build
```

The entire pipeline runs in under 60 seconds with live API keys.

---

## Tech Stack

| Layer        | Technology                                                     |
| ------------ | -------------------------------------------------------------- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4             |
| **Backend**  | Next.js API Routes (serverless functions)                      |
| **Language** | TypeScript (strict mode)                                       |
| **Styling**  | Tailwind CSS with dark theme, glassmorphism panels             |
| **Build**    | Turbopack (dev), Next.js production build                      |
| **Linting**  | ESLint 9 (flat config) + eslint-config-next                    |

### LLM Models

| Task                          | Model                          | Why                                                        |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------- |
| **Image OCR**                 | Google Gemini 3.1 Pro Preview  | Multimodal vision — reads slide layouts, diagrams, text    |
| **Requirement Extraction**    | GLM-5.1 (FP8)                 | Strong structured JSON output from noisy text              |
| **Idea Generation**           | GLM-5.1 (FP8)                 | Creative yet constrained — 3 distinct ideas per call       |
| **AI Judging**                | GLM-5.1 (FP8)                 | Consistent scoring with actionable feedback                |
| **Vibe-Code Prompt**          | GLM-5.1 or Gemini 3.1 Pro     | User-selectable — thorough prompt with build instructions  |
| **Copilot Chat**              | GLM-5.1 (FP8)                 | Multi-turn conversation with full session context          |

All models are accessed through a unified **OpenAI-compatible chat completions API**, making it trivial to swap providers.

---

## Architecture

```
app/
├── api/
│   ├── ocr/route.ts          # Gemini vision — image → text
│   ├── extract/route.ts       # GLM-5.1 — text → structured brief
│   ├── generate/route.ts      # GLM-5.1 — brief → 3 MVP ideas
│   ├── judge/route.ts         # GLM-5.1 — idea → scores + feedback
│   ├── prompt/route.ts        # GLM-5.1 or Gemini — idea → vibe-code prompt
│   └── chat/route.ts          # GLM-5.1 — multi-turn assistant
├── globals.css                # Tailwind + dark theme
├── layout.tsx                 # Root layout with metadata
└── page.tsx                   # Single-page tabbed UI

components/
├── ui.tsx                     # Reusable Panel, Button, Input components
└── chat-panel.tsx             # Floating chatbot with message history

lib/
├── glm.ts                     # callGLM() + callGLMChat() — API client
├── prompts.ts                 # Prompt templates for extract, generate, judge
├── json.ts                    # Resilient JSON parser for LLM output
├── fallbacks.ts               # Graceful fallback data when API is down
└── types.ts                   # Shared TypeScript types
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Run the dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

## Environment Variables

| Variable         | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `GLM_API_KEY`    | API key for GLM-5.1 (extraction, ideas, judging, chat)   |
| `GLM_BASE_URL`   | Base URL for GLM endpoint                                 |
| `GLM_MODEL`      | Model identifier (e.g. `zai-org/GLM-5.1-FP8`)            |
| `GLM_API_KEY2`   | API key for Gemini (OCR + optional prompt generation)     |
| `GLM_BASE_URL2`  | Base URL for Gemini endpoint                              |
| `GLM_MODEL2`     | Model identifier (e.g. `google/gemini-3.1-pro-preview`)  |

If API keys are missing, the app returns **smart fallback responses** so the full UI flow still works for demos.

---

*Built with speed and clarity at a hackathon, for hackathons.*
