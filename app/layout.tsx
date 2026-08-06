import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Symptom Intake Assistant",
  description:
    "Turns a casual health complaint into structured intake data. Not a diagnostic tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
