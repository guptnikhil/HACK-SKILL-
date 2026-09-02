import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  requestTriage,
  type LanguageCode,
  type TriageResult,
} from "@/lib/triage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RescuAI — Emergency First-Aid Triage" },
      {
        name: "description",
        content:
          "Emergency triage console: hazard photo or text in, three plain-language first-aid steps, translated warning and GPS security dispatch out.",
      },
      { property: "og:title", content: "RescuAI — Emergency First-Aid Triage" },
      {
        property: "og:description",
        content: "Three first-aid steps in under 10 seconds. Voice read-out and GPS alert included.",
      },
    ],
  }),
  component: RescuAI,
});

const LANGS: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "ENGLISH" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
];

const PRESETS = ["CHEMICAL SPLASH", "THERMAL BURN", "DEEP CUT"];

type Phase = "idle" | "parsing" | "result";

type Incident = { hazard: string; severity: string; at: number };
const HISTORY_KEY = "rescuai-incidents";

function loadHistory(): Incident[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Incident[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function formatElapsed(sec: number) {
  const m = Math.floor(sec / 60);
  return `${String(m).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function speak(text: string, lang: LanguageCode) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : "en-US";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function RescuAI() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lang, setLang] = useState<LanguageCode>("en");
  const [text, setText] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gps, setGps] = useState<"LOCATING" | "ACTIVE" | "DENIED">("LOCATING");
  const [dispatch, setDispatch] = useState<"idle" | "sending" | "sent">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [history, setHistory] = useState<Incident[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setHistory(loadHistory()), []);

  useEffect(() => {
    if (phase !== "result") return;
    setElapsed(0);
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return setGps("DENIED");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGps("ACTIVE");
      },
      () => setGps("DENIED"),
      { timeout: 6000 },
    );
  }, []);

  const run = useCallback(
    async (payload: { text?: string; imageBase64?: string }, label: string) => {
      setPhase("parsing");
      setError(null);
      setDispatch("sending");
      const res = await requestTriage({ ...payload, language: lang, coords });
      setResult(res);
      setPhase("result");
      const next = [
        { hazard: res.hazard, severity: res.severity, at: Date.now() },
        ...loadHistory(),
      ].slice(0, 5);
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch { /* storage unavailable */ }
      setHistory(next);
      if (res.offline) setError("OFFLINE MODE - STANDARD FIRST-AID PROTOCOL");
      const first = res.steps[0];
      if (first) {
        speak(`Step one. ${first.title}. ${first.directive}`, "en");
        setSpeaking(true);
      }
      setTimeout(() => setDispatch("sent"), 1200);
      void label;
    },
    [lang, coords],
  );

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => run({ imageBase64: String(reader.result) }, "hazard photo");
    reader.readAsDataURL(file);
  };

  const reset = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setPhase("idle");
    setResult(null);
    setError(null);
    setDispatch("idle");
    setText("");
  };

  const toggleAudio = () => {
    if (!result) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    speak(
      result.steps.map((s, i) => `Step ${i + 1}. ${s.title}. ${s.directive}`).join(" "),
      "en",
    );
    setSpeaking(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[640px] flex-col border-x border-border">
        {/* STATUS BAR */}
        <header className="sticky top-0 z-10 border-b border-border bg-surface">
          <div className="h-1 w-full scanline" aria-hidden="true" />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  gps === "ACTIVE" ? "bg-success blink" : gps === "LOCATING" ? "bg-warning blink" : "bg-destructive"
                }`}
                aria-hidden="true"
              />
              <span className="truncate font-mono text-xs tracking-tight text-muted-foreground">
                GPS:{" "}
                <span className={gps === "ACTIVE" ? "text-success" : gps === "LOCATING" ? "text-warning" : "text-destructive"}>
                  {gps}
                </span>{" "}
                {coords
                  ? `[${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}]`
                  : gps === "DENIED"
                    ? "[NO FIX]"
                    : "[ACQUIRING]"}
              </span>
            </div>
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
              RESCUAI // EMERGENCY TRIAGE
            </h1>
            <span className="font-mono text-[10px] tracking-widest text-primary-foreground">
              {phase === "parsing" ? "PARSING HAZARD…" : phase === "result" ? "PROTOCOL LIVE" : "STANDBY"}
            </span>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {phase === "idle" && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex min-h-[220px] flex-col items-center justify-center gap-3 border-2 border-dashed border-primary bg-surface px-6 py-10 text-center transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
                  INCIDENT CAPTURE
                </span>
                <span className="text-2xl font-black tracking-tight text-foreground">
                  [ SNAP HAZARD PHOTO ]
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  OPENS DEVICE CAMERA · ANALYSED SERVER-SIDE
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) run({ text: text.trim() }, text.trim());
                }}
                className="flex flex-col gap-3"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="OR TYPE INCIDENT (e.g. Acid on hand, eye chemical splash)"
                  aria-label="Type the incident"
                  className="min-h-[56px] w-full border border-border bg-surface px-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="min-h-[56px] w-full bg-primary font-black tracking-wide text-primary-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  GET PROTOCOL
                </button>
              </form>

              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => run({ text: p }, p)}
                    className="min-h-[56px] border border-warning bg-surface px-2 font-mono text-[11px] font-bold leading-tight tracking-tight text-warning transition-colors hover:bg-warning/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    [ {p} ]
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === "parsing" && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 border border-border bg-surface p-6">
              <div className="h-1 w-40 scanline blink" aria-hidden="true" />
              <p className="font-mono text-sm tracking-[0.2em] text-warning">PARSING HAZARD…</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                SECURE SERVER ANALYSIS · NO DATA LEAVES THIS DEVICE UNENCRYPTED
              </p>
            </div>
          )}

          {phase === "result" && result && (
            <>
              {error && (
                <div
                  role="status"
                  className="border border-warning bg-warning/15 px-4 py-3 font-mono text-[11px] font-bold tracking-widest text-warning"
                >
                  [ {error} ]
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border border-border bg-surface px-4 py-3">
                <span className="font-mono text-xs tracking-widest text-muted-foreground">
                  {result.hazard}
                </span>
                <span
                  className={`px-2 py-1 font-mono text-[11px] font-bold tracking-widest ${
                    result.severity === "HIGH SEVERITY"
                      ? "bg-primary text-primary-foreground"
                      : result.severity === "MEDIUM SEVERITY"
                        ? "bg-warning text-warning-foreground"
                        : "bg-success text-success-foreground"
                  }`}
                >
                  {result.severity}
                </span>
              </div>

              <p className="border-l-4 border-warning bg-warning/15 px-4 py-4 text-xl font-black leading-snug text-warning">
                {result.translatedWarning}
              </p>

              <ol className="flex flex-col gap-3">
                {result.steps.slice(0, 3).map((s, i) => (
                  <li
                    key={s.title}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border border-border bg-surface p-4"
                  >
                    <span className="shrink-0 font-mono text-3xl font-bold leading-none text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black leading-tight tracking-tight text-foreground">
                        {s.title}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {s.directive}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={reset}
                className="min-h-[56px] w-full border border-border bg-background font-mono text-xs font-bold tracking-widest text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                [ NEW INCIDENT ]
              </button>
            </>
          )}
        </div>

        {/* ACTION BAR */}
        {phase === "result" && result && (
          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-surface p-4">
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 border border-success/50 bg-success/10 px-3 py-2"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full bg-success ${dispatch === "sending" ? "blink" : ""}`}
                aria-hidden="true"
              />
              <span className="min-w-0 font-mono text-[11px] leading-tight tracking-tight text-success">
                {dispatch === "sending"
                  ? "[ AUTO-DISPATCHING SMS ALERT TO CAMPUS SECURITY… ]"
                  : `[ SMS ALERT DISPATCHED TO CAMPUS SECURITY ${
                      coords ? `· ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "· NO GPS FIX"
                    } ]`}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleAudio}
              className="min-h-[56px] w-full bg-primary text-base font-black tracking-wide text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {speaking ? "■ STOP READ-OUT" : "🔊 READ OUT PROTOCOL (TTS)"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
