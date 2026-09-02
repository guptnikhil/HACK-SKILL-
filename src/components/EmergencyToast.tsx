import { useEffect, useState } from "react";

interface EmergencyToastProps {
  coords?: { lat: number; lng: number } | null;
  dispatchState?: "sending" | "sent";
}

const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

export function EmergencyToast({ coords, dispatchState = "sent" }: EmergencyToastProps) {
  const [isSending, setIsSending] = useState(dispatchState === "sending");

  useEffect(() => {
    if (dispatchState === "sending") {
      setIsSending(true);
      const timer = setTimeout(() => setIsSending(false), 1200);
      return () => clearTimeout(timer);
    } else {
      setIsSending(false);
    }
  }, [dispatchState]);

  const activeCoords = coords || DEFAULT_COORDS;
  const locationTag = `GPS: [${activeCoords.lat.toFixed(4)}°, ${activeCoords.lng.toFixed(4)}°]`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 border border-emerald-500/60 bg-emerald-950/40 px-3.5 py-2.5 shadow-sm"
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 ${
          isSending ? "animate-ping" : ""
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0 font-mono text-xs font-semibold leading-tight tracking-tight text-emerald-400">
        {isSending
          ? "[ AUTO-DISPATCHING SMS ALERT TO CAMPUS SECURITY… ]"
          : `[ SMS ALERT DISPATCHED TO CAMPUS SECURITY · ${locationTag} ]`}
      </span>
    </div>
  );
}
