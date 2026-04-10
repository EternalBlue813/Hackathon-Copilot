"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatPanel({ sessionContext }: { sessionContext: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm your Hackathon Copilot assistant. Ask me anything about the extracted requirements, generated ideas, or judge results visible in this session.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: trimmed };
      const pendingId = `a-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: pendingId, role: "assistant", content: "Thinking..." },
      ]);
      setInput("");
      setBusy(true);

      try {
        const history = [...messages, userMsg]
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            context: sessionContext,
          }),
        });

        const data = (await response.json()) as { reply?: string; error?: string };
        const reply = data.reply || data.error || "Sorry, I couldn't generate a response.";

        setMessages((prev) =>
          prev.map((m) => (m.id === pendingId ? { ...m, content: reply } : m)),
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId ? { ...m, content: "Network error — please try again." } : m,
          ),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, sessionContext],
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-400 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open ? (
        <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Copilot Chat</h3>
              <p className="text-xs text-slate-400">Ask about your session data</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    content: "Chat cleared. Ask me anything about your hackathon session!",
                  },
                ]);
              }}
              className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "border border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
