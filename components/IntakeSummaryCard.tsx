import type { IntakeRecord, Severity } from "@/lib/intakeSchema";

const severityStyles: Record<Severity, string> = {
  mild: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  moderate: "bg-amber-50 text-amber-700 ring-amber-200",
  severe: "bg-red-50 text-red-700 ring-red-200",
  unknown: "bg-slate-100 text-slate-600 ring-slate-200",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function TagList({ items, tone }: { items: string[]; tone: "neutral" | "alert" }) {
  if (items.length === 0) {
    return <span className="text-slate-400">None reported</span>;
  }

  const style =
    tone === "alert"
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-md px-2 py-0.5 text-xs ring-1 ${style}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function IntakeSummaryCard({ record }: { record: IntakeRecord }) {
  const hasRedFlags = record.red_flags.length > 0;

  return (
    <section
      aria-label="Structured intake summary"
      className="animate-card-in rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Intake summary</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ${
            severityStyles[record.severity]
          }`}
        >
          {record.severity}
        </span>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Symptom">{record.symptom}</Field>
        <Field label="Duration">{record.duration}</Field>
        <div className="sm:col-span-2">
          <Field label="Associated symptoms">
            <TagList items={record.associated_symptoms} tone="neutral" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Red flags">
            <TagList items={record.red_flags} tone="alert" />
          </Field>
        </div>
      </dl>

      {hasRedFlags && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-200">
          Flagged for clinician review. This is a routing signal, not an assessment.
        </p>
      )}
    </section>
  );
}
