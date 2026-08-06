import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";

import { chatResponseSchema } from "@/lib/intakeSchema";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const runtime = "nodejs";

const MODEL = "claude-opus-5";
const MAX_TOKENS = 8192;
const MAX_TURNS = 40;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(MAX_TURNS),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return errorResponse("Server is not configured with an Anthropic API key.", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return errorResponse("Expected a non-empty array of {role, content} messages.", 400);
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: parsedBody.data.messages,
      output_config: {
        effort: "low",
        format: zodOutputFormat(chatResponseSchema),
      },
    });

    if (response.stop_reason === "refusal") {
      return errorResponse("That request couldn't be processed. Please rephrase it.", 422);
    }

    const result = response.parsed_output;
    if (!result) {
      return errorResponse("The model returned an unexpected response. Please try again.", 502);
    }

    return NextResponse.json({ reply: result.reply, extracted: result.extracted });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse("The assistant is busy right now. Please try again in a moment.", 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return errorResponse("The configured Anthropic API key was rejected.", 500);
    }
    if (error instanceof Anthropic.APIError) {
      return errorResponse("The assistant is unavailable right now.", 502);
    }
    return errorResponse("Something went wrong handling that message.", 500);
  }
}
