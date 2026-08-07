import type { IntakeRecord, Severity } from "./intakeSchema";

export const MODERATE_PLUS_DURATION_DAYS = 3;
export const PERSISTENT_DURATION_DAYS = 14;
export const HIGH_FEVER_FAHRENHEIT = 103;
export const HIGH_FEVER_CELSIUS = 39.4;

export const CLASSIC_RED_FLAG_EXAMPLES = [
  "chest pain",
  "difficulty breathing",
  "fainting or loss of consciousness",
  "sudden severe headache",
  "confusion or altered mental status",
  "uncontrolled bleeding",
  "high fever (103°F / 39.4°C or higher)",
  "fever with severe symptoms",
  "stiff neck with fever",
  "blood in vomit or stool",
  "one-sided weakness or trouble speaking",
  "suicidal thoughts",
] as const;

export const RED_FLAG_PROMPT_SECTION = `## Red flags (routing signals)

red_flags is an array of features that intake protocols commonly escalate. Listing one is a routing signal, not a diagnosis — never explain what it might mean.

Include a red flag when the person reports any of these (examples, not exhaustive): ${CLASSIC_RED_FLAG_EXAMPLES.join("; ")}.

Also escalate from severity, duration, and associated findings once those fields are known — do not wait for the person to label them as "red flags":
- severity is "severe" → include a flag such as "Severe <symptom>"
- severity is "moderate" or "severe" and duration is about ${MODERATE_PLUS_DURATION_DAYS}+ days (or longer) → include a flag such as "Moderate <symptom> lasting <duration>" (use the actual severity and duration wording)
- any stated severity lasting about ${PERSISTENT_DURATION_DAYS}+ days → include a flag such as "Persistent <symptom> lasting <duration>"
- fever at or above ${HIGH_FEVER_FAHRENHEIT}°F / ${HIGH_FEVER_CELSIUS}°C → include "High fever (<value>)"
- any fever with severity "severe", or fever with moderate+ symptoms lasting ${MODERATE_PLUS_DURATION_DAYS}+ days → include "Fever" (or the reported fever phrasing)
- Put escalating features in red_flags even if you also list them under associated_symptoms

List only what follows from what the person reported (including duration, severity, and associated symptoms they gave). Use short concrete phrases. Empty array when nothing qualifies.`;

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

const FEVER_WORD = /\bfevers?\b/i;
const FEVER_F = /(?:fever\s*(?:of\s*)?)?(\d{2,3}(?:\.\d+)?)\s*°?\s*F\b/i;
const FEVER_C = /(?:fever\s*(?:of\s*)?)?(\d{2}(?:\.\d+)?)\s*°?\s*C\b/i;
const FEVER_OF = /\bfever\s*(?:of\s*)?(\d{2,3}(?:\.\d+)?)\b/i;

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

export function formatDurationForFlag(duration: string): string {
  const trimmed = duration.trim();
  const sinceMatch = trimmed.match(
    /^since\s+(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)\b/i,
  );
  if (sinceMatch) {
    return `${sinceMatch[1]} ${sinceMatch[2].toLowerCase()}`;
  }
  return trimmed;
}

function isHighFeverFahrenheit(value: number): boolean {
  return value >= HIGH_FEVER_FAHRENHEIT && value <= 115;
}

function isHighFeverCelsius(value: number): boolean {
  return value >= HIGH_FEVER_CELSIUS && value <= 45;
}

export function parseFeverReading(text: string): {
  label: string;
  high: boolean;
} | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fMatch = trimmed.match(FEVER_F);
  if (fMatch) {
    const value = Number(fMatch[1]);
    if (Number.isFinite(value)) {
      return {
        label: `High fever (${value}°F)`,
        high: isHighFeverFahrenheit(value),
      };
    }
  }

  const cMatch = trimmed.match(FEVER_C);
  if (cMatch) {
    const value = Number(cMatch[1]);
    if (Number.isFinite(value)) {
      return {
        label: `High fever (${value}°C)`,
        high: isHighFeverCelsius(value),
      };
    }
  }

  const ofMatch = trimmed.match(FEVER_OF);
  if (ofMatch) {
    const value = Number(ofMatch[1]);
    if (Number.isFinite(value)) {
      if (isHighFeverFahrenheit(value)) {
        return { label: `High fever (${value}°F)`, high: true };
      }
      if (isHighFeverCelsius(value)) {
        return { label: `High fever (${value}°C)`, high: true };
      }
    }
  }

  if (FEVER_WORD.test(trimmed)) {
    return { label: "Fever", high: false };
  }

  return null;
}

function buildFeverFlags(record: IntakeRecord): string[] {
  const flags: string[] = [];
  const days = estimateDurationDays(record.duration);
  const isModeratePlus = record.severity === "moderate" || record.severity === "severe";
  const feverEscalates =
    record.severity === "severe" ||
    (isModeratePlus && days !== null && days >= MODERATE_PLUS_DURATION_DAYS);

  const sources = [record.symptom, ...record.associated_symptoms];
  let sawFever = false;
  let sawHigh = false;

  for (const source of sources) {
    const reading = parseFeverReading(source);
    if (!reading) continue;
    sawFever = true;
    if (reading.high) {
      sawHigh = true;
      flags.push(reading.label);
    }
  }

  if (sawHigh) return flags;
  if (sawFever && feverEscalates) flags.push("Fever");
  return flags;
}

export function buildEscalationFlags(record: IntakeRecord): string[] {
  const flags: string[] = [];
  const days = estimateDurationDays(record.duration);
  const { symptom, severity } = record;
  const durationLabel = formatDurationForFlag(record.duration);

  if (severity === "severe") {
    flags.push(`Severe ${symptom}`);
  }

  const isModeratePlus = severity === "moderate" || severity === "severe";

  if (isModeratePlus && days !== null && days >= MODERATE_PLUS_DURATION_DAYS) {
    flags.push(`${titleSeverity(severity)} ${symptom} lasting ${durationLabel}`);
  } else if (severity === "mild" && days !== null && days >= PERSISTENT_DURATION_DAYS) {
    flags.push(`Persistent ${symptom} lasting ${durationLabel}`);
  }

  flags.push(...buildFeverFlags(record));
  return flags;
}

export function enrichIntakeRecord(record: IntakeRecord): IntakeRecord {
  return {
    ...record,
    red_flags: mergeUnique(record.red_flags, buildEscalationFlags(record)),
  };
}
