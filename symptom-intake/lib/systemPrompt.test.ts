import { describe, expect, it } from "vitest";

import { MODERATE_PLUS_DURATION_DAYS, RED_FLAG_PROMPT_SECTION } from "./redFlags";
import { DISCLAIMER, SYSTEM_PROMPT } from "./systemPrompt";

describe("system prompt", () => {
  it("embeds the exact disclaimer the UI also renders", () => {
    expect(SYSTEM_PROMPT).toContain(DISCLAIMER);
  });

  it("states the no-diagnosis boundary", () => {
    expect(SYSTEM_PROMPT).toMatch(/do not diagnose, treat, or give medical advice/i);
  });

  it("caps the number of clarifying questions", () => {
    expect(SYSTEM_PROMPT).toMatch(/at most two clarifying questions/i);
  });

  it("forbids merging two complaints into the symptom field", () => {
    expect(SYSTEM_PROMPT).toMatch(/exactly ONE complaint/);
  });

  it("forbids repeating the primary symptom in associated_symptoms", () => {
    expect(SYSTEM_PROMPT).toMatch(/must not be repeated in associated_symptoms/i);
  });

  it("embeds the shared red-flag routing rules", () => {
    expect(SYSTEM_PROMPT).toContain(RED_FLAG_PROMPT_SECTION);
  });

  it("escalates moderate-plus symptoms by duration", () => {
    expect(SYSTEM_PROMPT).toContain(String(MODERATE_PLUS_DURATION_DAYS));
    expect(SYSTEM_PROMPT).toMatch(/severity is "moderate" or "severe"/i);
  });

  it("uses leftover clarifying questions for a safety screen", () => {
    expect(SYSTEM_PROMPT).toMatch(/brief safety screen/i);
  });

  it("requires a single JSON object response", () => {
    expect(SYSTEM_PROMPT).toMatch(/single valid json object/i);
  });
});
