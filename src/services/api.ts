export interface EmergencyRequest {
  text?: string;
  imageBase64?: string;
  language: string;
  coords?: { lat: number; lng: number } | null;
}

export interface ProtocolStep {
  step_number: number;
  title: string;
  action: string;
}

export interface EmergencyResponse {
  incident_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  translated_warning: string;
  steps: ProtocolStep[];
  offline?: boolean;
}

type LangMap = Record<string, { warning: string; steps: ProtocolStep[] }>;

const MULTI_LANG_PROTOCOLS: Record<string, Record<string, { warning: string; steps: ProtocolStep[] }>> = {
  "CHEMICAL SPLASH": {
    en: {
      warning: "Flush chemical off skin immediately with clean running water.",
      steps: [
        { step_number: 1, title: "FLUSH WITH WATER", action: "Rinse affected area under cool running water continuously for 20 minutes. Do not scrub." },
        { step_number: 2, title: "REMOVE CONTAMINATED CLOTHING", action: "Peel off or cut away clothing and jewelry contaminated with chemical while rinsing." },
        { step_number: 3, title: "COVER LOOSELY & SEEK HELP", action: "Cover area loosely with a sterile non-adherent dressing. Call emergency services immediately." },
      ],
    },
    hi: {
      warning: "रसायन को त्वचा से तुरंत ठंडे पानी से धोएं।",
      steps: [
        { step_number: 1, title: "पानी से धोएं", action: "प्रभावित स्थान या आंख को 20 मिनट तक लगातार ठंडे बहते पानी से धोएं। रगड़ें नहीं।" },
        { step_number: 2, title: "दूषित कपड़े हटाएं", action: "रसायन से भीगे हुए कपड़ों और गहनों को सावधानीपूर्वक काटकर या उतारकर अलग करें।" },
        { step_number: 3, title: "ढकें और मदद लें", action: "स्थान को साफ कपड़े या पट्टी से ढीला ढकें। तुरंत आपातकालीन चिकित्सा सहायता बुलाएं।" },
      ],
    },
    ta: {
      warning: "இரசாயனத்தை உடனடியாக தோலில் இருந்து ஓடும் நீரால் கழுவவும்.",
      steps: [
        { step_number: 1, title: "நீரால் கழுவவும்", action: "பாதிக்கப்பட்ட பகுதியை 20 நிமிடங்கள் தொடர்ந்து குளிர்ந்த ஓடும் நீரில் கழுவவும்." },
        { step_number: 2, title: "ஆடைகளை அகற்று", action: "இரசாயனம் பட்ட ஆடைகள் மற்றும் நகைகளை எச்சரிக்கையுடன் அகற்றவும்." },
        { step_number: 3, title: "துணியால் மூடவும்", action: "சுத்தமான துணியால் தளர்வாக மூடி, மருத்துவ உதவியை உடனடியாக அழைக்கவும்." },
      ],
    },
  },
  "THERMAL BURN": {
    en: {
      warning: "Cool the burn with running water. Do not apply ice.",
      steps: [
        { step_number: 1, title: "COOL THE BURN", action: "Hold burn under cool running water for 20 minutes. Never use ice, butter, or ointments." },
        { step_number: 2, title: "REMOVE TIGHT ITEMS", action: "Take off rings, watches, belts, and tight clothing near burn area before swelling begins." },
        { step_number: 3, title: "COVER WITH CLEAN FILM", action: "Cover loosely with clean plastic cling film or sterile non-fluffy dressing." },
      ],
    },
    hi: {
      warning: "जलन को बहते पानी से ठंडा करें। बर्फ न लगाएं।",
      steps: [
        { step_number: 1, title: "जलन को ठंडा करें", action: "जली हुई त्वचा को 20 मिनट तक बहते पानी के नीचे रखें। बर्फ या मक्खन का प्रयोग न करें।" },
        { step_number: 2, title: "कसे हुए सामान हटाएं", action: "सूजन आने से पहले अंगूठी, घड़ी और कसे कपड़ों को धीरे से उतारें।" },
        { step_number: 3, title: "साफ पट्टी से ढकें", action: "जली त्वचा को साफ प्लास्टिक फिल्म या कीटाणुरहित पट्टी से ढीला ढकें।" },
      ],
    },
    ta: {
      warning: "தீக்காயத்தை ஓடும் நீரில் குளிர்விக்கவும். பனிக்கட்டி வேண்டாம்.",
      steps: [
        { step_number: 1, title: "குளிர்விக்கவும்", action: "தீக்காயத்தை 20 நிமிடங்கள் ஓடும் நீரில் வைக்கவும். ஐஸ் வைக்க வேண்டாம்." },
        { step_number: 2, title: "நகைகளை அகற்றவும்", action: "வீக்கம் தொடங்குவதற்கு முன் மோதிரங்கள் மற்றும் கடிகாரங்களை அகற்றவும்." },
        { step_number: 3, title: "மூடவும்", action: "சுத்தமான நெகிழிப் பையினால் அல்லது துணியினால் தளர்வாக மூடவும்." },
      ],
    },
  },
  "DEEP CUT": {
    en: {
      warning: "Apply firm direct pressure to stop bleeding. Do not remove embedded objects.",
      steps: [
        { step_number: 1, title: "APPLY DIRECT PRESSURE", action: "Press clean cloth or sterile pad firmly onto wound for 10 continuous minutes." },
        { step_number: 2, title: "ELEVATE INJURED AREA", action: "Raise injured limb above heart level to slow down blood flow." },
        { step_number: 3, title: "BANDAGE AND SECURE", action: "Wrap bandage firmly around dressing. Seek immediate medical help if bleeding continues." },
      ],
    },
    hi: {
      warning: "खून रोकने के लिए घाव पर मजबूती से दबाव डालें।",
      steps: [
        { step_number: 1, title: "सीधा दबाव डालें", action: "साफ कपड़े या पट्टी को घाव पर 10 मिनट तक बिना उठाए मजबूती से दबाकर रखें।" },
        { step_number: 2, title: "अंग को ऊपर उठाएं", action: "खून का बहाव कम करने के लिए चोटिल हाथ या पैर को दिल के स्तर से ऊपर उठाएं।" },
        { step_number: 3, title: "पट्टी बांधें", action: "कपड़े के ऊपर मजबूती से पट्टी बांधें। यदि खून रुकना बंद न हो तो तुरंत डॉक्टर के पास जाएं।" },
      ],
    },
    ta: {
      warning: "இரத்தப்போக்கை நிறுத்த காயத்தின் மீது பலமாக அழுத்தம் கொடுக்கவும்.",
      steps: [
        { step_number: 1, title: "அழுத்தம் கொடுக்கவும்", action: "சுத்தமான துணியை காயத்தின் மீது 10 நிமிடங்கள் தொடர்ந்து அழுத்தவும்." },
        { step_number: 2, title: "உயர்த்தவும்", action: "இரத்தப்போக்கைக் குறைக்க காயம்பட்ட பகுதியை இதய மட்டத்திற்கு மேல் உயர்த்தவும்." },
        { step_number: 3, title: "கட்டு போடவும்", action: "துணியைச் சுற்றி இறுக்கமாகக் கட்டு போடவும். மருத்துவரின் உதவியை உடனடியாக நாடவும்." },
      ],
    },
  },
};

export function getLocalFallback(input?: string, lang: string = "en"): EmergencyResponse {
  const query = (input || "").toLowerCase();
  let hazard = "CHEMICAL SPLASH";
  let severity: "LOW" | "MEDIUM" | "HIGH" = "HIGH";

  if (query.includes("burn") || query.includes("fire") || query.includes("heat") || query.includes("scald")) {
    hazard = "THERMAL BURN";
    severity = "HIGH";
  } else if (query.includes("cut") || query.includes("bleed") || query.includes("wound") || query.includes("blood")) {
    hazard = "DEEP CUT";
    severity = "MEDIUM";
  }

  const langKey = (lang === "hi" || lang === "ta") ? lang : "en";
  const hazardGroup = MULTI_LANG_PROTOCOLS[hazard] || MULTI_LANG_PROTOCOLS["CHEMICAL SPLASH"];
  const localizedData = hazardGroup[langKey] || hazardGroup["en"];

  return {
    incident_type: hazard,
    severity,
    translated_warning: localizedData.warning,
    steps: JSON.parse(JSON.stringify(localizedData.steps)),
    offline: true,
  };
}

export async function processEmergency(req: EmergencyRequest): Promise<EmergencyResponse> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const endpoint = baseUrl
    ? `${baseUrl.replace(/\/$/, "")}/functions/v1/process-emergency`
    : "/functions/v1/process-emergency";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as EmergencyResponse;
    if (!data.steps || data.steps.length !== 3) {
      throw new Error("Invalid response format received");
    }

    return { ...data, offline: false };
  } catch (err) {
    console.warn("API request failed or timed out. Engaging client-side fallback protocol.", err);
    return getLocalFallback(req.text, req.language);
  }
}
