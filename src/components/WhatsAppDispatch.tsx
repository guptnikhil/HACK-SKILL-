import { useState } from "react";
import { EmergencyResponse } from "../services/api";

interface WhatsAppDispatchProps {
  result: EmergencyResponse;
  coords?: { lat: number; lng: number } | null;
  defaultNursePhone?: string;
}

const DEFAULT_COORDS = { lat: 28.6139, lng: 77.2090 };

export function WhatsAppDispatch({
  result,
  coords,
  defaultNursePhone = "919876543210",
}: WhatsAppDispatchProps) {
  const [nursePhone, setNursePhone] = useState(defaultNursePhone);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const activeCoords = coords || DEFAULT_COORDS;

  const buildWhatsAppMessage = () => {
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const locationText = `https://maps.google.com/?q=${activeCoords.lat.toFixed(5)},${activeCoords.lng.toFixed(5)}`;

    const step1 = result.steps[0]
      ? `${result.steps[0].title} - ${result.steps[0].action}`
      : "See app for immediate protocol.";

    return `🚨 *RESCUAI EMERGENCY ALERT* 🚨
*Hazard:* ${result.incident_type} (${result.severity} SEVERITY)
*Time:* ${timeStr}
*GPS Location:* ${locationText} (Campus Safety Zone)

*Critical Warning:*
${result.translated_warning}

*Step 1 Immediate Action:*
${step1}

_Sent via RescuAI Emergency Console_`;
  };

  const dispatchWhatsApp = () => {
    const cleanPhone = nursePhone.replace(/[^0-9]/g, "");
    const message = buildWhatsAppMessage();
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-2 w-full border border-emerald-500/50 bg-emerald-950/30 p-3 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          CAMPUS NURSE WHATSAPP DISPATCH
        </span>
        <button
          type="button"
          onClick={() => setShowPhoneInput(!showPhoneInput)}
          className="font-mono text-[10px] text-emerald-300 underline hover:text-emerald-100"
        >
          {showPhoneInput ? "[ HIDE NUMBER ]" : "[ EDIT NURSE NUMBER ]"}
        </button>
      </div>

      {showPhoneInput && (
        <div className="flex items-center gap-2 mt-1">
          <label htmlFor="nurse-phone-input" className="sr-only">
            Nurse Phone Number
          </label>
          <input
            id="nurse-phone-input"
            type="tel"
            value={nursePhone}
            onChange={(e) => setNursePhone(e.target.value)}
            placeholder="Nurse WhatsApp (e.g. 919876543210)"
            className="w-full border border-emerald-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-emerald-200 placeholder:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      )}

      <button
        type="button"
        onClick={dispatchWhatsApp}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 bg-emerald-600 font-mono text-xs font-black tracking-widest text-white uppercase transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label="Dispatch emergency alert to Campus Nurse via WhatsApp"
      >
        <span>💬</span>
        <span>DISPATCH ALERT TO CAMPUS NURSE (WHATSAPP)</span>
      </button>
    </div>
  );
}
