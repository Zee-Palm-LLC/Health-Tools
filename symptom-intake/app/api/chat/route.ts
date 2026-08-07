import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { chatResponseSchema } from "@/lib/intakeSchema";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const runtime = "nodejs";

const BASE_URL = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";
const MAX_TOKENS = 2048;
const TEMPERATURE = 0.3;
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
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return errorResponse("Server is not configured with a DeepSeek API key.", 500);
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

  const client = new OpenAI({ apiKey, baseURL: BASE_URL });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...parsedBody.data.messages],
    });

    const choice = completion.choices[0];
    if (choice?.finish_reason === "length") {
      return errorResponse("The reply was cut short. Please try again.", 502);
    }

    const content = choice?.message?.content;
    if (!content) {
      return errorResponse("The model returned an empty response. Please try again.", 502);
    }

    // JSON mode guarantees syntactic JSON but not our shape, so both are checked here.
    let payload: unknown;
    try {
      payload = JSON.parse(content);
    } catch {
      return errorResponse("The model returned malformed output. Please try again.", 502);
    }

    const result = chatResponseSchema.safeParse(payload);
    if (!result.success) {
      return errorResponse("The model returned an unexpected shape. Please try again.", 502);
    }

    return NextResponse.json({ reply: result.data.reply, extracted: result.data.extracted });
  } catch (error) {
    if (error instanceof OpenAI.AuthenticationError) {
      return errorResponse("The configured DeepSeek API key was rejected.", 500);
    }
    if (error instanceof OpenAI.RateLimitError) {
      return errorResponse("The assistant is busy right now. Please try again in a moment.", 429);
    }
    if (error instanceof OpenAI.APIError) {
      return errorResponse("The assistant is unavailable right now.", 502);
    }
    return errorResponse("Something went wrong handling that message.", 500);
  }
}
