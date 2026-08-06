import type { IntakeRecord, Severity } from "@/lib/intakeSchema";

const severityStyles: Record<Severity, { pill: string; dot: string }> = {
  mild: { pill: "bg-[#EAF2EA] text-[#2E5B39] ring-[#CBE0CF]", dot: "bg-[#4F8A5F]" },
  moderate: { pill: "bg-[#FBF2E2] text-[#8A5A17] ring-[#EEDCBE]", dot: "bg-[#C98A2B]" },
  severe: { pill: "bg-[#FBEBE8] text-[#8C2F22] ring-[#F0D2CC]", dot: "bg-[#C0503C]" },
  unknown: { pill: "bg-[#F2F0EC] text-[#6E6A63] ring-[#E3DFD8]", dot: "bg-[#A9A399]" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 px-5 py-4 sm:grid-cols-[9.5rem_1fr] sm:items-baseline sm:gap-4">
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </dt>
      <dd className="text-[0.9rem] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

function TagList({ items, tone }: { items: string[]; tone: "neutral" | "alert" }) {
  if (items.length === 0) {
    return <span className="text-ink-faint">None reported</span>;
  }

  const style =
    tone === "alert"
      ? "bg-[#FBEBE8] text-[#8C2F22] ring-[#F0D2CC]"
      : "bg-[#F5F3EF] text-ink-muted ring-hairline";

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-lg px-2.5 py-1 text-[0.8rem] leading-none ring-1 ${style}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function IntakeSummaryCard({ record }: { record: IntakeRecord }) {
  const severity = severityStyles[record.severity];
  const hasRedFlags = record.red_flags.length > 0;

  return (
    <section
      aria-label="Structured intake summary"
      className="animate-card-in overflow-hidden rounded-2xl border border-hairline bg-white shadow-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-hairline bg-accent-soft px-5 py-3.5">
        <div className="flex items-center gap-2 text-accent">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 4h6v2H9zM7 6h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <h2 className="text-[0.82rem] font-semibold tracking-[-0.005em] text-ink">
            Intake summary
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-medium capitalize ring-1 ${severity.pill}`}
        >
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />
          {record.severity}
        </span>
      </header>

      <dl className="divide-y divide-hairline">
        <Row label="Symptom">{record.symptom}</Row>
        <Row label="Duration">{record.duration}</Row>
        <Row label="Associated">
          <TagList items={record.associated_symptoms} tone="neutral" />
        </Row>
        <Row label="Red flags">
          <TagList items={record.red_flags} tone="alert" />
        </Row>
      </dl>

      {hasRedFlags && (
        <p className="border-t border-[#F0D2CC] bg-[#FDF5F3] px-5 py-3 text-[0.78rem] leading-relaxed text-[#8C2F22]">
          Flagged for clinician review — a routing signal, not an assessment.
        </p>
      )}
    </section>
  );
}
