"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ActionButton, GhostButton, Panel, SectionLabel, TextArea, TextInput } from "@/components/ui";
import { ChatPanel } from "@/components/chat-panel";
import type { ExtractedRequirements, GeneratedIdeas, JudgeResult } from "@/lib/types";

type TabId = "extract" | "generate" | "judge" | "prompt";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "extract", label: "Extract" },
  { id: "generate", label: "Generate" },
  { id: "judge", label: "Judge" },
  { id: "prompt", label: "Prompt" },
];

async function ocrImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ocr", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { text?: string; error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error || "OCR failed on the server.");
  }

  return data.text ?? "";
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("extract");
  const [slideText, setSlideText] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [extractBusy, setExtractBusy] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [judgeBusy, setJudgeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedRequirements | null>(null);
  const [generatorTheme, setGeneratorTheme] = useState("");
  const [generatorCriteria, setGeneratorCriteria] = useState("");
  const [generatorContext, setGeneratorContext] = useState("");
  const [ideas, setIdeas] = useState<GeneratedIdeas | null>(null);
  const [judgeIdea, setJudgeIdea] = useState("");
  const [judgeCriteria, setJudgeCriteria] = useState("");
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [notes, setNotes] = useState("");
  const [promptIdea, setPromptIdea] = useState("");
  const [promptModel, setPromptModel] = useState<"primary" | "secondary">("primary");
  const [promptBusy, setPromptBusy] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrAbortRef = useRef(false);

  const combinedExtractInput = useMemo(
    () => [slideText.trim(), ocrText.trim()].filter(Boolean).join("\n\n"),
    [slideText, ocrText],
  );

  const chatContext = useMemo(() => {
    const parts: string[] = [];

    if (extracted) {
      parts.push(
        `EXTRACTED REQUIREMENTS:\nTheme: ${extracted.theme}\nRequirements: ${extracted.requirements.join("; ")}\nCriteria: ${extracted.criteria.join(", ")}\nSummary: ${extracted.summary}`,
      );
    }

    if (ideas) {
      const ideaSummaries = ideas.ideas
        .map((i, idx) => `Idea ${idx + 1}: "${i.title}" — Problem: ${i.problem} — Solution: ${i.solution} — MVP: ${i.mvpScope}`)
        .join("\n");
      parts.push(`GENERATED IDEAS:\n${ideaSummaries}`);
    }

    if (judgeResult) {
      parts.push(
        `JUDGE RESULTS:\nInnovation: ${judgeResult.scores.innovation}/10, Feasibility: ${judgeResult.scores.feasibility}/10, Impact: ${judgeResult.scores.impact}/10\nJustification: ${judgeResult.justification}\nImprovements: ${judgeResult.improvements.join("; ")}\nImproved idea: ${judgeResult.improvedIdea}`,
      );
    }

    if (notes.trim()) {
      parts.push(`HACKATHON NOTES:\n${notes.trim()}`);
    }

    return parts.join("\n\n---\n\n");
  }, [extracted, ideas, judgeResult, notes]);

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1200);
  }

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setStagedFiles((prev) => [...prev, ...Array.from(files)]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (ocrBusy) return;

      const files = Array.from(event.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length > 0) {
        setStagedFiles((prev) => [...prev, ...files]);
      }
    },
    [ocrBusy],
  );

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function removeFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleOcrSubmit() {
    if (stagedFiles.length === 0) return;

    setError(null);
    setOcrBusy(true);
    ocrAbortRef.current = false;
    setOcrProgress(`Processing 0 / ${stagedFiles.length}...`);

    const results: string[] = [];

    for (let i = 0; i < stagedFiles.length; i++) {
      if (ocrAbortRef.current) {
        setOcrProgress(`Stopped after ${i} / ${stagedFiles.length}`);
        break;
      }

      setOcrProgress(`Processing ${i + 1} / ${stagedFiles.length}...`);

      try {
        const text = await ocrImageFile(stagedFiles[i]);
        if (text) results.push(text);
      } catch (uploadError) {
        const name = stagedFiles[i].name;
        results.push(`[OCR failed for ${name}: ${uploadError instanceof Error ? uploadError.message : "unknown error"}]`);
      }
    }

    setOcrText((prev) => [prev.trim(), ...results].filter(Boolean).join("\n\n"));
    setStagedFiles([]);
    setOcrBusy(false);
    setOcrProgress("");
  }

  function handleOcrStop() {
    ocrAbortRef.current = true;
  }

  async function handleExtract() {
    setExtractBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: combinedExtractInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Extraction failed.");
      }

      setExtracted(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Extraction failed.");
    } finally {
      setExtractBusy(false);
    }
  }

  async function handleGenerate() {
    setGenerateBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: generatorTheme,
          criteria: generatorCriteria
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          extraContext: generatorContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Idea generation failed.");
      }

      setIdeas(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Idea generation failed.");
    } finally {
      setGenerateBusy(false);
    }
  }

  async function handleJudge() {
    setJudgeBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: judgeIdea,
          criteria: judgeCriteria
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Judging failed.");
      }

      setJudgeResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Judging failed.");
    } finally {
      setJudgeBusy(false);
    }
  }

  function applyExtractedData() {
    if (!extracted) return;

    setGeneratorTheme(extracted.theme);
    setGeneratorCriteria(extracted.criteria.join("\n"));
    setJudgeCriteria(extracted.criteria.join("\n"));
    setGeneratorContext(extracted.summary);
    setActiveTab("generate");
  }

  function openJudgeWithIdea(ideaText: string) {
    setJudgeIdea(ideaText);
    if (extracted && !judgeCriteria.trim()) {
      setJudgeCriteria(extracted.criteria.join("\n"));
    }
    setActiveTab("judge");
  }

  function appendToNotes(text: string) {
    setNotes((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${text}` : text;
    });
  }

  function clearExtractInputs() {
    setStagedFiles([]);
    setOcrText("");
    setSlideText("");
  }

  async function handleGeneratePrompt() {
    if (!promptIdea.trim()) return;

    setPromptBusy(true);
    setError(null);

    try {
      const judgeContext = judgeResult
        ? `Innovation: ${judgeResult.scores.innovation}/10, Feasibility: ${judgeResult.scores.feasibility}/10, Impact: ${judgeResult.scores.impact}/10. ${judgeResult.justification} Improvements: ${judgeResult.improvements.join("; ")}. Improved idea: ${judgeResult.improvedIdea}`
        : undefined;

      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: promptIdea,
          theme: extracted?.theme,
          requirements: extracted?.requirements,
          criteria: extracted?.criteria,
          judgeResult: judgeContext,
          model: promptModel,
        }),
      });

      const data = (await response.json()) as { prompt?: string; error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error || "Prompt generation failed.");
      }

      setGeneratedPrompt(data.prompt || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Prompt generation failed.");
    } finally {
      setPromptBusy(false);
    }
  }

  function openPromptWithIdea(ideaText: string) {
    setPromptIdea(ideaText);
    setActiveTab("prompt");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-blue-300">Hackathon MVP</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Hackathon Copilot</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Extract rules from hackathon slides, generate sharper ideas, and stress-test them with a GLM-5.1 AI judge.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-100">
            Demo flow: Extract → Generate → Judge → Prompt
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTab === tab.id ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_0.8fr]">
        <div className="space-y-6">
          {activeTab === "extract" ? (
            <Panel
              title="1. Extract Requirements"
              description="Upload slide images for OCR, paste text from the brief, then turn it into structured requirements."
            >
              <div className="space-y-5">
                <div>
                  <SectionLabel>Upload slide images</SectionLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={ocrBusy ? undefined : openFilePicker}
                    className={`flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-slate-950/50 px-4 py-6 text-center transition hover:border-blue-400/40 hover:bg-slate-950/70 ${ocrBusy ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-slate-400">
                      Click to browse or drag &amp; drop images here
                    </p>
                    <p className="text-xs text-slate-500">
                      PNG, JPG, WEBP — select multiple files at once or add more later
                    </p>
                  </div>

                  {stagedFiles.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-300">{stagedFiles.length} file{stagedFiles.length > 1 ? "s" : ""} staged</p>
                      {stagedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${index}`}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            disabled={ocrBusy}
                            className="ml-2 shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <ActionButton
                          onClick={handleOcrSubmit}
                          busy={ocrBusy}
                          disabled={stagedFiles.length === 0}
                        >
                          Run OCR on {stagedFiles.length} image{stagedFiles.length > 1 ? "s" : ""}
                        </ActionButton>
                        {ocrBusy ? (
                          <button
                            type="button"
                            onClick={handleOcrStop}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-400"
                          >
                            Stop
                          </button>
                        ) : (
                          <GhostButton onClick={openFilePicker}>
                            Add more files
                          </GhostButton>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-2 text-xs text-slate-400">
                    {ocrBusy
                      ? ocrProgress
                      : "Select one or more slide images, then press Run OCR. Text from all images is combined."}
                  </p>
                </div>

                <div>
                  <SectionLabel>OCR text</SectionLabel>
                  <TextArea
                    value={ocrText}
                    onChange={(event) => setOcrText(event.target.value)}
                    placeholder="OCR output will appear here after upload."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <SectionLabel>Hackathon brief text</SectionLabel>
                  <TextArea
                    value={slideText}
                    onChange={(event) => setSlideText(event.target.value)}
                    placeholder="Example: Build an AI-powered tool for student teams. Judging is based on innovation, feasibility, and potential impact."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionButton onClick={handleExtract} busy={extractBusy} disabled={!combinedExtractInput.trim()}>
                    Extract
                  </ActionButton>
                  {combinedExtractInput.trim() ? (
                    <GhostButton onClick={() => appendToNotes(combinedExtractInput)}>
                      Add to Notes
                    </GhostButton>
                  ) : null}
                  <GhostButton onClick={clearExtractInputs}>
                    Clear inputs
                  </GhostButton>
                  <GhostButton
                    onClick={() => {
                      setSlideText("");
                      setOcrText("");
                      setStagedFiles([]);
                      setExtracted(null);
                    }}
                  >
                    Reset all
                  </GhostButton>
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "generate" ? (
            <Panel
              title="2. Generate Ideas"
              description="Start from the extracted theme and criteria, then generate three demo-ready ideas."
            >
              <div className="space-y-5">
                <div>
                  <SectionLabel>Theme</SectionLabel>
                  <TextInput
                    value={generatorTheme}
                    onChange={(event) => setGeneratorTheme(event.target.value)}
                    placeholder="Example: AI for hackathon productivity"
                  />
                </div>

                <div>
                  <SectionLabel>Judging criteria (one per line)</SectionLabel>
                  <TextArea
                    value={generatorCriteria}
                    onChange={(event) => setGeneratorCriteria(event.target.value)}
                    placeholder={"Innovation\nFeasibility\nImpact"}
                    className="min-h-[110px]"
                  />
                </div>

                <div>
                  <SectionLabel>Additional user input</SectionLabel>
                  <TextArea
                    value={generatorContext}
                    onChange={(event) => setGeneratorContext(event.target.value)}
                    placeholder="Optional context, user segment, or preferred tech stack."
                    className="min-h-[110px]"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionButton onClick={handleGenerate} busy={generateBusy} disabled={!generatorTheme.trim()}>
                    Generate Ideas
                  </ActionButton>
                  <GhostButton
                    onClick={() => {
                      setGeneratorTheme("");
                      setGeneratorCriteria("");
                      setGeneratorContext("");
                      setIdeas(null);
                    }}
                  >
                    Clear
                  </GhostButton>
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "judge" ? (
            <Panel
              title="3. AI Judge"
              description="Evaluate one idea against the judging criteria and get sharper next-step suggestions."
            >
              <div className="space-y-5">
                <div>
                  <SectionLabel>Idea description</SectionLabel>
                  <TextArea
                    value={judgeIdea}
                    onChange={(event) => setJudgeIdea(event.target.value)}
                    placeholder="Paste one idea here for evaluation."
                    className="min-h-[180px]"
                  />
                </div>

                <div>
                  <SectionLabel>Judging criteria (one per line)</SectionLabel>
                  <TextArea
                    value={judgeCriteria}
                    onChange={(event) => setJudgeCriteria(event.target.value)}
                    placeholder={"Innovation\nFeasibility\nImpact"}
                    className="min-h-[110px]"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionButton onClick={handleJudge} busy={judgeBusy} disabled={!judgeIdea.trim()}>
                    Evaluate
                  </ActionButton>
                  <GhostButton
                    onClick={() => {
                      setJudgeIdea("");
                      setJudgeResult(null);
                    }}
                  >
                    Clear
                  </GhostButton>
                </div>
              </div>
            </Panel>
          ) : null}

          {activeTab === "prompt" ? (
            <Panel
              title="4. Vibe-Code Prompt"
              description="Generate a comprehensive prompt from your idea that you can paste into any AI coding tool to build the MVP."
            >
              <div className="space-y-5">
                <div>
                  <SectionLabel>Idea to build</SectionLabel>
                  <TextArea
                    value={promptIdea}
                    onChange={(event) => setPromptIdea(event.target.value)}
                    placeholder="Paste or select an idea from the Generate tab. The more detail, the better the prompt."
                    className="min-h-[180px]"
                  />
                </div>

                {ideas ? (
                  <div>
                    <SectionLabel>Quick-fill from generated ideas</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {ideas.ideas.map((idea) => {
                        const text = `${idea.title}\n\nProblem: ${idea.problem}\n\nSolution: ${idea.solution}\n\nMVP scope: ${idea.mvpScope}`;
                        return (
                          <GhostButton key={idea.title} onClick={() => setPromptIdea(text)}>
                            {idea.title}
                          </GhostButton>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div>
                  <SectionLabel>Model</SectionLabel>
                  <select
                    value={promptModel}
                    onChange={(event) => setPromptModel(event.target.value as "primary" | "secondary")}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white"
                  >
                    <option value="primary">GLM-5.1 (Primary)</option>
                    <option value="secondary">Gemini 3.1 Pro (Secondary)</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    onClick={handleGeneratePrompt}
                    busy={promptBusy}
                    disabled={!promptIdea.trim()}
                    className="bg-emerald-500 hover:bg-emerald-400"
                  >
                    Generate Prompt
                  </ActionButton>
                  <GhostButton
                    onClick={() => {
                      setPromptIdea("");
                      setGeneratedPrompt("");
                    }}
                  >
                    Clear
                  </GhostButton>
                </div>

                {generatedPrompt ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SectionLabel>Generated prompt</SectionLabel>
                      <div className="flex gap-2">
                        <GhostButton onClick={() => copyText("prompt", generatedPrompt)}>
                          {copied === "prompt" ? "Copied!" : "Copy prompt"}
                        </GhostButton>
                        <GhostButton onClick={() => appendToNotes(`--- Vibe-Code Prompt ---\n${generatedPrompt}`)}>
                          Add to Notes
                        </GhostButton>
                      </div>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{generatedPrompt}</pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel title="Output" description="Structured results stay visible while you move through the tabs.">
            {!extracted && !ideas && !judgeResult ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-slate-400">
                Run an extraction, idea generation, or judging action to see results here.
              </div>
            ) : null}

            <div className="space-y-4">
              {extracted ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">Extracted brief</h3>
                      <p className="mt-1 text-sm text-slate-400">Theme, requirements, and judging criteria from the slide content.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GhostButton onClick={() => copyText("extract", JSON.stringify(extracted, null, 2))}>
                        {copied === "extract" ? "Copied" : "Copy JSON"}
                      </GhostButton>
                      <GhostButton
                        onClick={() =>
                          appendToNotes(
                            `--- Extracted Brief ---\nTheme: ${extracted.theme}\nRequirements:\n${extracted.requirements.map((r) => `- ${r}`).join("\n")}\nCriteria: ${extracted.criteria.join(", ")}\nSummary: ${extracted.summary}`,
                          )
                        }
                      >
                        Add to Notes
                      </GhostButton>
                      <ActionButton onClick={applyExtractedData}>Use extracted data</ActionButton>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-200">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Theme</p>
                      <p className="mt-1">{extracted.theme}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Requirements</p>
                      <ul className="mt-1 space-y-1 text-slate-300">
                        {extracted.requirements.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Judging criteria</p>
                      <ul className="mt-1 space-y-1 text-slate-300">
                        {extracted.criteria.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Summary</p>
                      <p className="mt-1 text-slate-300">{extracted.summary}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {ideas ? (
                <div className="space-y-3">
                  {ideas.ideas.map((idea) => {
                    const combined = `${idea.title}\n\nProblem: ${idea.problem}\n\nSolution: ${idea.solution}\n\nMVP scope: ${idea.mvpScope}`;

                    return (
                      <div key={idea.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-base font-semibold text-white">{idea.title}</h3>
                            <p className="mt-1 text-sm text-slate-400">AI-generated hackathon concept</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <GhostButton onClick={() => copyText(idea.title, combined)}>
                              {copied === idea.title ? "Copied" : "Copy"}
                            </GhostButton>
                            <GhostButton onClick={() => appendToNotes(`--- Idea: ${idea.title} ---\n${combined}`)}>
                              Add to Notes
                            </GhostButton>
                            <ActionButton onClick={() => openJudgeWithIdea(combined)}>Judge this</ActionButton>
                            <ActionButton onClick={() => openPromptWithIdea(combined)} className="bg-emerald-500 hover:bg-emerald-400">Prompt</ActionButton>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm text-slate-300">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Problem</p>
                            <p className="mt-1">{idea.problem}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Solution</p>
                            <p className="mt-1">{idea.solution}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">MVP scope</p>
                            <p className="mt-1">{idea.mvpScope}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {judgeResult ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-white">Judge verdict</h3>
                      <p className="mt-1 text-sm text-slate-400">Scores out of 10 plus targeted improvements.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GhostButton onClick={() => copyText("judge", JSON.stringify(judgeResult, null, 2))}>
                        {copied === "judge" ? "Copied" : "Copy JSON"}
                      </GhostButton>
                      <GhostButton
                        onClick={() =>
                          appendToNotes(
                            `--- Judge Verdict ---\nInnovation: ${judgeResult.scores.innovation}/10 | Feasibility: ${judgeResult.scores.feasibility}/10 | Impact: ${judgeResult.scores.impact}/10\n${judgeResult.justification}\nImprovements:\n${judgeResult.improvements.map((i) => `- ${i}`).join("\n")}\nImproved idea: ${judgeResult.improvedIdea}`,
                          )
                        }
                      >
                        Add to Notes
                      </GhostButton>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.entries(judgeResult.scores).map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</p>
                        <p className="mt-2 text-3xl font-semibold text-white">{value}/10</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Justification</p>
                      <p className="mt-1">{judgeResult.justification}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Actionable improvements</p>
                      <ul className="mt-1 space-y-1">
                        {judgeResult.improvements.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Improved idea</p>
                      <p className="mt-1">{judgeResult.improvedIdea}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Hackathon Notes" description="Free-form notes that persist across all tabs. Add outputs or type freely.">
            <div className="flex flex-col gap-3">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Your notes will appear here. Use &quot;Add to Notes&quot; buttons to append outputs, or type anything you like."
                className="min-h-[500px] w-full resize-y rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500"
              />
              <div className="flex flex-wrap gap-2">
                <GhostButton onClick={() => copyText("notes", notes)} disabled={!notes.trim()}>
                  {copied === "notes" ? "Copied" : "Copy notes"}
                </GhostButton>
                <GhostButton
                  onClick={() => setNotes("")}
                  disabled={!notes.trim()}
                >
                  Clear notes
                </GhostButton>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <ChatPanel sessionContext={chatContext} />
    </main>
  );
}
