import { describe, expect, it } from "vitest";

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
});
