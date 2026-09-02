import { ProtocolStep } from "../services/api";

interface ProtocolCardsProps {
  steps: ProtocolStep[];
  severity?: "LOW" | "MEDIUM" | "HIGH";
  translatedWarning?: string;
}

export function ProtocolCards({ steps, severity = "HIGH", translatedWarning }: ProtocolCardsProps) {
  const displaySteps = steps.slice(0, 3);

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case "HIGH":
        return "bg-red-600 text-white";
      case "MEDIUM":
        return "bg-amber-500 text-black";
      default:
        return "bg-green-600 text-white";
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {translatedWarning && (
        <div className="border-l-4 border-amber-500 bg-amber-950/40 p-4">
          <p className="font-mono text-xs font-bold tracking-widest text-amber-400 uppercase mb-1">
            CRITICAL WARNING
          </p>
          <p className="text-xl font-black leading-snug text-amber-300">
            {translatedWarning}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <span className="font-mono text-xs tracking-widest text-zinc-400">
          ACTION PROTOCOL · 3 STEPS
        </span>
        <span className={`px-2.5 py-1 font-mono text-xs font-bold tracking-widest uppercase ${getSeverityBadgeClass(severity)}`}>
          {severity} SEVERITY
        </span>
      </div>

      <ol className="flex flex-col gap-3">
        {displaySteps.map((step, idx) => {
          const stepNumStr = String(step.step_number || idx + 1).padStart(2, "0");
          return (
            <li
              key={stepNumStr}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border border-zinc-800 bg-zinc-950 p-4 transition-colors hover:border-zinc-700"
            >
              <span className="shrink-0 font-mono text-3xl font-extrabold leading-none text-red-500">
                {stepNumStr}
              </span>
              <div className="min-w-0 flex flex-col justify-center">
                <h3 className="font-mono text-lg font-black tracking-tight text-zinc-100 uppercase">
                  {step.title}
                </h3>
                <p className="mt-1.5 font-sans text-sm leading-relaxed text-zinc-300">
                  {step.action}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
