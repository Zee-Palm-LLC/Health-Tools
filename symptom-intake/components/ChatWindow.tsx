"use client";

import { useEffect, useRef, useState } from "react";

import IntakeSummaryCard from "@/components/IntakeSummaryCard";
import { sendChat } from "@/lib/chatClient";
import type { IntakeRecord } from "@/lib/intakeSchema";
import type { ChatMessage } from "@/lib/types";

const PLACEHOLDER = "Describe your symptom…";

const SUGGESTIONS = [
  "I've had a headache and felt tired since yesterday",
  "Sharp stomach pain for two days, getting worse",
  "Sore throat and a mild fever since Monday",
];

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-msg-in ${isUser ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[86%] whitespace-pre-wrap px-4 py-2.5 text-[0.9rem] leading-relaxed shadow-bubble ${
          isUser
            ? "rounded-[1.1rem] rounded-br-md bg-accent text-white"
            : "rounded-[1.1rem] rounded-bl-md border border-hairline bg-white text-ink"
        }`}
      >
        {message.content}
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex animate-msg-in justify-start" aria-live="polite" aria-label="Assistant is typing">
      <span className="flex items-center gap-1.5 rounded-[1.1rem] rounded-bl-md border border-hairline bg-white px-4 py-3.5 shadow-bubble">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-blink rounded-full bg-accent"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<IntakeRecord | null>(null);
  const scrollAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, record]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendChat(nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      if (result.extracted) setRecord(result.extracted);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void send(input);
  }

  // Explicit rather than implicit form submission, so IME composition doesn't submit early.
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(input);
    }
  }

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`scrollbar-slim flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-2xl border border-hairline bg-white/60 p-4 sm:p-5 ${
          isEmpty ? "min-h-[19rem]" : "min-h-[8rem]"
        }`}
      >
        {isEmpty ? (
          <div className="m-auto w-full max-w-sm text-center">
            <p className="text-[0.9rem] font-medium text-ink">What&apos;s bothering you?</p>
            <p className="mt-1.5 text-[0.82rem] leading-relaxed text-ink-muted">
              Start with a symptom, or try one of these:
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-left text-[0.82rem] leading-snug text-ink-muted transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`${index}-${message.role}`} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={scrollAnchor} />
      </div>

      {record && <IntakeSummaryCard record={record} />}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-[#F0D2CC] bg-[#FBEBE8] px-3.5 py-2.5 text-[0.85rem] text-[#8C2F22]"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="symptom-input" className="sr-only">
          Describe your symptoms
        </label>
        <input
          id="symptom-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDER}
          disabled={isLoading}
          autoComplete="off"
          className="h-12 flex-1 rounded-xl border border-hairline bg-white px-4 text-[0.9rem] text-ink shadow-bubble outline-none transition-colors placeholder:text-ink-faint focus:border-accent/40 focus:ring-4 focus:ring-accent/10 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          aria-label="Send message"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-bubble transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:bg-ink-faint/40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
}
