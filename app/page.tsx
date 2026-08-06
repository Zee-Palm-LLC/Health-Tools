import ChatWindow from "@/components/ChatWindow";
import { DISCLAIMER } from "@/lib/systemPrompt";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-7 px-5 py-12 sm:py-16">
      <header className="flex items-start gap-3.5">
        <span
          aria-hidden
          className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-bubble"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <path d="M3 12h3.5l2-6 4 12 2.5-6H21" />
          </svg>
        </span>
        <div>
          <h1 className="text-[1.4rem] font-semibold leading-tight tracking-[-0.02em]">
            Symptom Intake
          </h1>
          <p className="mt-1 text-[0.9rem] leading-relaxed text-ink-muted">
            Describe how you feel in plain language. A question or two later, you get a
            structured intake record.
          </p>
        </div>
      </header>

      <ChatWindow />

      <footer className="mt-auto flex items-start gap-2 border-t border-hairline pt-5 text-xs leading-relaxed text-ink-faint">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="mt-px h-3.5 w-3.5 shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
        <span>{DISCLAIMER}</span>
      </footer>
    </main>
  );
}
