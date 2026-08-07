import type { IntakeRecord } from "@/lib/intakeSchema";
import { enrichIntakeRecord } from "@/lib/redFlags";
import type { ChatMessage } from "@/lib/types";

export interface ChatResult {
  reply: string;
  extracted: IntakeRecord | null;
}

export async function sendChat(messages: ChatMessage[]): Promise<ChatResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : "The assistant is unavailable right now.";
    throw new Error(message);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error("The assistant returned an unexpected response.");
  }

  const reply = "reply" in payload ? String((payload as { reply: unknown }).reply ?? "") : "";
  const extractedRaw =
    "extracted" in payload ? (payload as { extracted: IntakeRecord | null }).extracted : null;

  return {
    reply,
    extracted: extractedRaw ? enrichIntakeRecord(extractedRaw) : null,
  };
}
