import { z } from "zod";

export const severityLevels = ["mild", "moderate", "severe", "unknown"] as const;

export const intakeRecordSchema = z.object({
  symptom: z.string().describe("The primary complaint."),
  duration: z.string().describe("How long it has been going on, as the person described it."),
  severity: z.enum(severityLevels),
  associated_symptoms: z.array(z.string()).describe("Other symptoms mentioned alongside the main one."),
  red_flags: z.array(z.string()).describe("Reported features that intake protocols flag for urgent review."),
});

export const chatResponseSchema = z.object({
  reply: z.string().describe("The message shown to the person in the chat."),
  extracted: intakeRecordSchema.nullable().describe("The structured record, or null if more information is needed."),
});

export type Severity = (typeof severityLevels)[number];
export type IntakeRecord = z.infer<typeof intakeRecordSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
