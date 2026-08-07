import { z } from "zod";

export const severityLevels = ["mild", "moderate", "severe", "unknown"] as const;

export const intakeRecordSchema = z.object({
  symptom: z.string().min(1),
  duration: z.string().min(1),
  severity: z.enum(severityLevels),
  associated_symptoms: z.array(z.string()),
  red_flags: z.array(z.string()),
});

export const chatResponseSchema = z.object({
  reply: z.string().min(1),
  extracted: intakeRecordSchema.nullable(),
});

export type Severity = (typeof severityLevels)[number];
export type IntakeRecord = z.infer<typeof intakeRecordSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
