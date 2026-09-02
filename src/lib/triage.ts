// Integration boundary for the RescuAI triage backend.
// The browser NEVER talks to Gemini directly and holds no credentials.
// All hazard parsing happens server-side (Supabase Edge Function `triage`).

export type Severity = "HIGH SEVERITY" | "MEDIUM SEVERITY" | "LOW SEVERITY";

export type ProtocolStep = {
  title: string;
  directive: string;
};

export type TriageResult = {
  hazard: string;
  severity: Severity;
  translatedWarning: string;
  steps: ProtocolStep[];
  offline: boolean;
};

export type LanguageCode = "en" | "hi" | "ta";

export type TriageRequest = {
  text?: string;
  imageBase64?: string;
  language: LanguageCode;
  coords?: { lat: number; lng: number } | null;
};

const TRIAGE_ENDPOINT = "/functions/v1/triage";

const WARNINGS: Record<string, Record<LanguageCode, string>> = {
  "CHEMICAL SPLASH": {
    en: "Flush the chemical off the skin immediately.",
    hi: "रसायन को त्वचा से तुरंत धोएं।",
    ta: "இரசாயனத்தை உடனடியாக தோலில் இருந்து கழுவவும்.",
  },
  "THERMAL BURN": {
    en: "Cool the burn with running water. Do not apply ice.",
    hi: "जलन को बहते पानी से ठंडा करें। बर्फ न लगाएं।",
    ta: "தீக்காயத்தை ஓடும் நீரில் குளிர்விக்கவும். பனிக்கட்டி வேண்டாம்.",
  },
  "DEEP CUT": {
    en: "Apply firm pressure. Do not remove embedded objects.",
    hi: "मजबूती से दबाव डालें। धँसी वस्तु न निकालें।",
    ta: "உறுதியாக அழுத்தம் கொடுக்கவும். புதைந்த பொருளை அகற்ற வேண்டாம்.",
  },
};

const STATIC_PROTOCOLS: Record<string, { severity: Severity; steps: ProtocolStep[] }> = {
  "CHEMICAL SPLASH": {
    severity: "HIGH SEVERITY",
    steps: [
      { title: "FLUSH WITH WATER", directive: "Rinse the area under cool running water for a full 20 minutes. Do not scrub." },
      { title: "REMOVE CONTAMINATED CLOTHING", directive: "Cut away or peel off soaked clothing and jewellery while still rinsing." },
      { title: "COVER LOOSELY", directive: "Cover with a clean sterile dressing. Do not apply creams or ointments." },
    ],
  },
  "THERMAL BURN": {
    severity: "HIGH SEVERITY",
    steps: [
      { title: "COOL THE BURN", directive: "Hold under cool running water for 20 minutes. Never use ice or butter." },
      { title: "REMOVE TIGHT ITEMS", directive: "Take off rings, watches and belts near the burn before swelling starts." },
      { title: "COVER WITH CLING FILM", directive: "Lay clean cling film or a sterile non-fluffy dressing loosely over the burn." },
    ],
  },
  "DEEP CUT": {
    severity: "MEDIUM SEVERITY",
    steps: [
      { title: "APPLY DIRECT PRESSURE", directive: "Press a clean cloth firmly on the wound for 10 minutes without lifting it." },
      { title: "RAISE THE LIMB", directive: "Lift the injured area above heart level to slow the bleeding." },
      { title: "BANDAGE AND MONITOR", directive: "Bandage over the cloth. Seek medical help if bleeding soaks through." },
    ],
  },
};

function matchHazard(input: string): string {
  const t = input.toLowerCase();
  if (/(acid|chemical|splash|solvent|alkali|reagent|eye)/.test(t)) return "CHEMICAL SPLASH";
  if (/(burn|scald|hot|steam|fire|flame)/.test(t)) return "THERMAL BURN";
  return "DEEP CUT";
}

export function fallbackProtocol(input: string, language: LanguageCode): TriageResult {
  const hazard = matchHazard(input);
  const base = STATIC_PROTOCOLS[hazard] ?? STATIC_PROTOCOLS["DEEP CUT"]!;
  const warning = WARNINGS[hazard] ?? WARNINGS["DEEP CUT"]!;
  return {
    hazard,
    severity: base.severity,
    translatedWarning: warning[language],
    steps: base.steps,
    offline: true,
  };
}


export async function requestTriage(req: TriageRequest): Promise<TriageResult> {
  const label = req.text ?? "hazard photo";
  try {
    const res = await fetch(TRIAGE_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as TriageResult;
    if (!data?.steps?.length) throw new Error("empty protocol");
    return { ...data, offline: false };
  } catch {
    // Network down or model timeout -> pre-cached standard protocol.
    return fallbackProtocol(label, req.language);
  }
}
