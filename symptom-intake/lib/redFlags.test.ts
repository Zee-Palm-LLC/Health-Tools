import { describe, expect, it } from "vitest";

import type { IntakeRecord } from "./intakeSchema";
import {
  MODERATE_PLUS_DURATION_DAYS,
  PERSISTENT_DURATION_DAYS,
  buildEscalationFlags,
  enrichIntakeRecord,
  estimateDurationDays,
  parseFeverReading,
} from "./redFlags";

const base: IntakeRecord = {
  symptom: "stomach pain",
  duration: "5 days",
  severity: "moderate",
  associated_symptoms: [],
  red_flags: [],
};

describe("estimateDurationDays", () => {
  it.each([
    ["5 days", 5],
    ["about 3 days", 3],
    ["2 weeks", 14],
    ["1 week", 7],
    ["a week", 7],
    ["since yesterday", 1],
    ["several days", 4],
    ["a few days", 3],
    ["12 hours", 0.5],
  ])("parses %s → %s days", (input, expected) => {
    expect(estimateDurationDays(input)).toBe(expected);
  });

  it("returns null for unparseable phrases", () => {
    expect(estimateDurationDays("on and off")).toBeNull();
  });
});

describe("parseFeverReading", () => {
  it("detects high Fahrenheit fever", () => {
    expect(parseFeverReading("fever of 103")).toEqual({
      label: "High fever (103°F)",
      high: true,
    });
  });

  it("detects high Celsius fever", () => {
    expect(parseFeverReading("39.5°C")).toEqual({
      label: "High fever (39.5°C)",
      high: true,
    });
  });

  it("detects plain fever wording", () => {
    expect(parseFeverReading("fever")).toEqual({ label: "Fever", high: false });
  });
});

describe("buildEscalationFlags", () => {
  it("flags moderate symptoms lasting at the duration threshold", () => {
    expect(buildEscalationFlags(base)).toEqual([
      "Moderate stomach pain lasting 5 days",
    ]);
  });

  it("normalizes awkward 'since N days' duration phrasing in flags", () => {
    expect(
      buildEscalationFlags({
        ...base,
        duration: "since 6 days",
      }),
    ).toEqual(["Moderate stomach pain lasting 6 days"]);
  });

  it("flags severe symptoms even without a long duration", () => {
    expect(
      buildEscalationFlags({
        ...base,
        duration: "since this morning",
        severity: "severe",
      }),
    ).toEqual(["Severe stomach pain"]);
  });

  it("flags severe + multi-day with both severe and duration signals", () => {
    expect(
      buildEscalationFlags({
        ...base,
        duration: "4 days",
        severity: "severe",
      }),
    ).toEqual([
      "Severe stomach pain",
      "Severe stomach pain lasting 4 days",
    ]);
  });

  it("flags high fever reported as an associated symptom", () => {
    expect(
      buildEscalationFlags({
        ...base,
        severity: "severe",
        associated_symptoms: ["fever of 103"],
      }),
    ).toEqual([
      "Severe stomach pain",
      "Severe stomach pain lasting 5 days",
      "High fever (103°F)",
    ]);
  });

  it("flags plain fever with moderate multi-day symptoms", () => {
    expect(
      buildEscalationFlags({
        ...base,
        associated_symptoms: ["fever"],
      }),
    ).toEqual(["Moderate stomach pain lasting 5 days", "Fever"]);
  });

  it("does not flag mild short symptoms", () => {
    expect(
      buildEscalationFlags({
        ...base,
        duration: "1 day",
        severity: "mild",
      }),
    ).toEqual([]);
  });

  it("flags mild symptoms that persist past the persistence threshold", () => {
    expect(
      buildEscalationFlags({
        ...base,
        duration: `${PERSISTENT_DURATION_DAYS} days`,
        severity: "mild",
      }),
    ).toEqual([`Persistent stomach pain lasting ${PERSISTENT_DURATION_DAYS} days`]);
  });

  it(`uses ${MODERATE_PLUS_DURATION_DAYS}+ days as the moderate threshold`, () => {
    expect(
      buildEscalationFlags({
        ...base,
        duration: `${MODERATE_PLUS_DURATION_DAYS} days`,
      }),
    ).toHaveLength(1);

    expect(
      buildEscalationFlags({
        ...base,
        duration: `${MODERATE_PLUS_DURATION_DAYS - 1} days`,
      }),
    ).toEqual([]);
  });
});

describe("enrichIntakeRecord", () => {
  it("merges escalation flags without duplicating model flags", () => {
    const enriched = enrichIntakeRecord({
      ...base,
      red_flags: ["Moderate stomach pain lasting 5 days", "Fever"],
    });

    expect(enriched.red_flags).toEqual([
      "Moderate stomach pain lasting 5 days",
      "Fever",
    ]);
  });

  it("adds escalation when the model left red_flags empty", () => {
    expect(enrichIntakeRecord(base).red_flags).toEqual([
      "Moderate stomach pain lasting 5 days",
    ]);
  });

  it("covers the severe stomach pain + 103 fever case", () => {
    expect(
      enrichIntakeRecord({
        symptom: "stomach pain",
        duration: "5 days",
        severity: "severe",
        associated_symptoms: ["fever of 103"],
        red_flags: [],
      }).red_flags,
    ).toEqual([
      "Severe stomach pain",
      "Severe stomach pain lasting 5 days",
      "High fever (103°F)",
    ]);
  });
});
