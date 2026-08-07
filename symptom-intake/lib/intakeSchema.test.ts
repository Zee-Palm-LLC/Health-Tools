import { describe, expect, it } from "vitest";

import { chatResponseSchema, intakeRecordSchema } from "./intakeSchema";

const record = {
  symptom: "headache",
  duration: "since yesterday",
  severity: "moderate",
  associated_symptoms: ["fatigue"],
  red_flags: [],
};

describe("intakeRecordSchema", () => {
  it("accepts a complete record", () => {
    expect(intakeRecordSchema.safeParse(record).success).toBe(true);
  });

  it.each(["mild", "moderate", "severe", "unknown"])("accepts severity %s", (severity) => {
    expect(intakeRecordSchema.safeParse({ ...record, severity }).success).toBe(true);
  });

  it("rejects a severity outside the enum", () => {
    expect(intakeRecordSchema.safeParse({ ...record, severity: "extreme" }).success).toBe(false);
  });

  it("rejects null in place of an array", () => {
    const result = intakeRecordSchema.safeParse({ ...record, associated_symptoms: null });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const { duration, ...withoutDuration } = record;
    void duration;
    expect(intakeRecordSchema.safeParse(withoutDuration).success).toBe(false);
  });
});

describe("chatResponseSchema", () => {
  it("accepts a null record while information is still being gathered", () => {
    const result = chatResponseSchema.safeParse({ reply: "How long?", extracted: null });
    expect(result.success).toBe(true);
  });

  it("accepts a populated record", () => {
    expect(chatResponseSchema.safeParse({ reply: "Done", extracted: record }).success).toBe(true);
  });

  it("rejects a response with no reply", () => {
    expect(chatResponseSchema.safeParse({ extracted: null }).success).toBe(false);
  });

  it("rejects an empty reply", () => {
    expect(chatResponseSchema.safeParse({ reply: "", extracted: null }).success).toBe(false);
  });

  it("rejects a response missing the extracted key entirely", () => {
    expect(chatResponseSchema.safeParse({ reply: "Hello" }).success).toBe(false);
  });

  it("rejects unrelated JSON", () => {
    expect(chatResponseSchema.safeParse({ message: "hello" }).success).toBe(false);
  });
});
