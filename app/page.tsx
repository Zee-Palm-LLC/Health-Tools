import ChatWindow from "@/components/ChatWindow";
import { DISCLAIMER } from "@/lib/systemPrompt";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Symptom Intake Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">
          Describe a symptom in plain language. It asks a question or two, then produces a
          structured intake record.
        </p>
      </header>

      <ChatWindow />

      <footer className="mt-auto pt-4 text-xs text-slate-500">{DISCLAIMER}</footer>
    </main>
  );
}
