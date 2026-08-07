import type { IntakeRecord, Severity } from "./intakeSchema";

/** Days of moderate+ symptoms that warrant clinician routing. */
export const MODERATE_PLUS_DURATION_DAYS = 3;

/** Days of any stated severity that counts as persistent / lingering. */
export const PERSISTENT_DURATION_DAYS = 14;

/**
 * Classic urgent features the model should copy into red_flags when reported.
 * Kept as plain language so the prompt and tests share one list.
 */
export const CLASSIC_RED_FLAG_EXAMPLES = [
  "chest pain",
  "difficulty breathing",
  "fainting or loss of consciousness",
  "sudden severe headache",
  "confusion or altered mental status",
  "uncontrolled bleeding",
  "stiff neck with fever",
  "blood in vomit or stool",
  "one-sided weakness or trouble speaking",
  "suicidal thoughts",
] as const;

/**
 * Prompt section: single source of truth for how the model fills red_flags.
 * Deterministic enrichment in enrichIntakeRecord still applies after the model responds.
 */
export const RED_FLAG_PROMPT_SECTION = `## Red flags (routing signals)

red_flags is an array of features that intake protocols commonly escalate. Listing one is a routing signal, not a diagnosis — never explain what it might mean.

Include a red flag when the person reports any of these (examples, not exhaustive): ${CLASSIC_RED_FLAG_EXAMPLES.join("; ")}.

Also escalate from severity and duration once those fields are known — do not wait for the person to label them as "red flags":
- severity is "severe" → include a flag such as "Severe <symptom>"
- severity is "moderate" or "severe" and duration is about ${MODERATE_PLUS_DURATION_DAYS}+ days (or longer) → include a flag such as "Moderate <symptom> lasting <duration>" (use the actual severity and duration wording)
- any stated severity lasting about ${PERSISTENT_DURATION_DAYS}+ days → include a flag such as "Persistent <symptom> lasting <duration>"

List only what follows from what the person reported (including duration and severity they gave). Use short concrete phrases. Empty array when nothing qualifies.`;

const DAY_PATTERNS: Array<{ pattern: RegExp; toDays: (n: number) => number }> = [
  { pattern: /(\d+(?:\.\d+)?)\s*(?:day|days)\b/i, toDays: (n) => n },
  { pattern: /(\d+(?:\.\d+)?)\s*(?:week|weeks)\b/i, toDays: (n) => n * 7 },
  { pattern: /(\d+(?:\.\d+)?)\s*(?:month|months)\b/i, toDays: (n) => n * 30 },
  { pattern: /(\d+(?:\.\d+)?)\s*(?:hour|hours)\b/i, toDays: (n) => n / 24 },
];

const PHRASE_DAYS: Array<{ pattern: RegExp; days: number }> = [
  { pattern: /\bsince\s+yesterday\b/i, days: 1 },
  { pattern: /\byesterday\b/i, days: 1 },
  { pattern: /\bsince\s+this\s+morning\b/i, days: 0.5 },
  { pattern: /\ba\s+few\s+days\b/i, days: 3 },
  { pattern: /\bseveral\s+days\b/i, days: 4 },
  { pattern: /\ba\s+week\b/i, days: 7 },
  { pattern: /\bover\s+a\s+week\b/i, days: 8 },
  { pattern: /\ba\s+month\b/i, days: 30 },
  { pattern: /\bfor\s+weeks\b/i, days: 14 },
  { pattern: /\bfor\s+months\b/i, days: 60 },
];

/** Best-effort duration → days. Returns null when the phrase can't be estimated. */
export function estimateDurationDays(duration: string): number | null {
  const trimmed = duration.trim();
  if (!trimmed) return null;

  for (const { pattern, toDays } of DAY_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return toDays(value);
    }
  }

  for (const { pattern, days } of PHRASE_DAYS) {
    if (pattern.test(trimmed)) return days;
  }

  return null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function mergeUnique(existing: string[], extras: string[]): string[] {
  const seen = new Set(existing.map(normalizeKey));
  const merged = [...existing];
  for (const item of extras) {
    const key = normalizeKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function titleSeverity(severity: Exclude<Severity, "unknown">): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

/**
 * Deterministic escalation flags derived from symptom + duration + severity.
 * Ensures cases like "moderate stomach pain for 5 days" always route for review.
 */
export function buildEscalationFlags(record: IntakeRecord): string[] {
  const flags: string[] = [];
  const days = estimateDurationDays(record.duration);
  const { symptom, duration, severity } = record;

  if (severity === "severe") {
    flags.push(`Severe ${symptom}`);
  }

  const isModeratePlus = severity === "moderate" || severity === "severe";

  if (isModeratePlus && days !== null && days >= MODERATE_PLUS_DURATION_DAYS) {
    flags.push(`${titleSeverity(severity)} ${symptom} lasting ${duration}`);
  } else if (
    severity === "mild" &&
    days !== null &&
    days >= PERSISTENT_DURATION_DAYS
  ) {
    flags.push(`Persistent ${symptom} lasting ${duration}`);
  }

  return flags;
}

/** Merge model-reported red_flags with deterministic escalation flags. */
export function enrichIntakeRecord(record: IntakeRecord): IntakeRecord {
  return {
    ...record,
    red_flags: mergeUnique(record.red_flags, buildEscalationFlags(record)),
  };
}
