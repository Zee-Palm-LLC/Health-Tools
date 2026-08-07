import { z } from "zod";

export const MAX_TURNS = 40;
export const MAX_MESSAGE_LENGTH = 4000;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_TURNS),
});
