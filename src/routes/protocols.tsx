import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  listProtocols,
  type LanguageCode,
  type ProtocolEntry,
} from "@/lib/triage";

export const Route = createFileRoute("/protocols")({
  head: () => ({
    meta: [
      { title: "Protocol Library — RescuAI" },
      {
        name: "description",
        content:
          "Offline-first standard first-aid protocols: chemical splash, thermal burn and deep cut, with translated warnings in English, Hindi and Tamil.",
      },
      { property: "og:title", content: "Protocol Library — RescuAI" },
      {
        property: "og:description",
        content:
          "Standard first-aid protocols cached on-device, readable in three languages even with no signal.",
      },
    ],
  }),
  component: Protocols,
});

const LANGS: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "ENGLISH" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
];

function SeverityTag({ severity }: { severity: ProtocolEntry["severity"] }) {
  return (
    <span
      className={`px-2 py-1 font-mono text-[10px] font-bold tracking-widest ${
        severity === "HIGH SEVERITY"
          ? "bg-primary text-primary-foreground"
          : severity === "MEDIUM SEVERITY"
            ? "bg-warning text-warning-foreground"
            : "bg-success text-success-foreground"
      }`}
    >
      {severity}
    </span>
  );
}

function Protocols() {
  const [lang, setLang] = useState<LanguageCode>("en");
  const [open, setOpen] = useState<string | null>(null);
  const entries = listProtocols();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col border-x border-border">
        <header className="sticky top-0 z-10 border-b border-border bg-surface">
          <div className="h-1 w-full scanline" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link
              to="/"
              className="font-mono text-xs font-bold tracking-widest text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              [ ← BACK TO TRIAGE ]
            </Link>
            <label className="flex shrink-0 items-center gap-2">
              <span className="sr-only">Protocol language</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageCode)}
                className="border border-border bg-background px-2 py-1.5 font-mono text-xs font-bold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-primary px-4 py-2">
            <h1 className="font-mono text-xs font-bold tracking-[0.25em] text-primary-foreground">
              PROTOCOL LIBRARY
            </h1>
            <span className="font-mono text-[10px] tracking-widest text-primary-foreground">
              OFFLINE READY
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <p className="border border-success/50 bg-success/10 px-4 py-3 font-mono text-[11px] leading-relaxed tracking-tight text-success">
            [ THESE PROTOCOLS ARE CACHED ON-DEVICE · READABLE WITH ZERO SIGNAL ]
          </p>

          {entries.map((entry) => {
            const expanded = open === entry.hazard;
            return (
              <section
                key={entry.hazard}
                className="border border-border bg-surface"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : entry.hazard)}
                  className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-sm font-bold tracking-widest text-foreground">
                      {entry.hazard}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {entry.steps.length} STEPS · TAP TO {expanded ? "COLLAPSE" : "EXPAND"}
                    </span>
                  </div>
                  <SeverityTag severity={entry.severity} />
                </button>

                {expanded && (
                  <div className="flex flex-col gap-3 border-t border-border p-4">
                    <p className="border-l-4 border-warning bg-warning/15 px-3 py-3 text-base font-black leading-snug text-warning">
                      {entry.warning[lang]}
                    </p>
                    <ol className="flex flex-col gap-2">
                      {entry.steps.map((s, i) => (
                        <li
                          key={s.title}
                          className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border border-border bg-background p-3"
                        >
                          <span className="shrink-0 font-mono text-xl font-bold leading-none text-primary">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <h2 className="text-base font-black leading-tight tracking-tight text-foreground">
                              {s.title}
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {s.directive}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>
            );
          })}

          <Link
            to="/"
            className="mt-2 flex min-h-[56px] items-center justify-center bg-primary font-black tracking-wide text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            START TRIAGE NOW
          </Link>
        </div>
      </div>
    </main>
  );
}
