import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmergencyRequest {
  text?: string;
  imageBase64?: string;
  language?: string;
  coords?: {
    lat: number;
    lng: number;
  };
}

interface StepItem {
  step_number: number;
  title: string;
  action: string;
}

interface EmergencyResponse {
  incident_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  translated_warning: string;
  steps: StepItem[];
}

function sanitizeLanguage(lang?: string): string {
  if (!lang || typeof lang !== "string") return "en";
  const clean = lang.trim().toLowerCase();
  if (/^[a-z]{2,5}(-[a-z]{2,5})?$/i.test(clean)) {
    return clean;
  }
  return "en";
}

function sanitizeText(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.trim().slice(0, 500);
}

function getFallbackProtocol(
  inputStr?: string,
  lang: string = "en"
): EmergencyResponse {
  const text = (inputStr || "").toLowerCase();
  let hazard = "CHEMICAL SPLASH";

  if (
    text.includes("burn") ||
    text.includes("fire") ||
    text.includes("heat") ||
    text.includes("scald")
  ) {
    hazard = "THERMAL BURN";
  } else if (
    text.includes("cut") ||
    text.includes("bleed") ||
    text.includes("wound") ||
    text.includes("blood")
  ) {
    hazard = "DEEP CUT";
  }

  const fallbacks: Record<string, EmergencyResponse> = {
    "CHEMICAL SPLASH": {
      incident_type: "CHEMICAL SPLASH",
      severity: "HIGH",
      translated_warning:
        lang === "hi"
          ? "रसायन को त्वचा से तुरंत धोएं।"
          : lang === "ta"
          ? "இரசாயனத்தை உடனடியாக தோலில் இருந்து கழுவவும்."
          : "Flush chemical off skin immediately with clean running water.",
      steps: [
        {
          step_number: 1,
          title: "FLUSH WITH WATER",
          action:
            "Rinse affected skin or eyes under cool running water continuously for 20 minutes. Do not scrub.",
        },
        {
          step_number: 2,
          title: "REMOVE CONTAMINATED CLOTHING",
          action:
            "Carefully peel off or cut away clothing and jewelry contaminated with chemical while continuing to rinse.",
        },
        {
          step_number: 3,
          title: "COVER LOOSELY & SEEK HELP",
          action:
            "Cover the affected area loosely with a sterile non-adherent dressing. Call emergency services immediately.",
        },
      ],
    },
    "THERMAL BURN": {
      incident_type: "THERMAL BURN",
      severity: "HIGH",
      translated_warning:
        lang === "hi"
          ? "जलन को बहते पानी से ठंडा करें। बर्फ न लगाएं।"
          : lang === "ta"
          ? "தீக்காயத்தை ஓடும் நீரில் குளிர்விக்கவும். பனிக்கட்டி வேண்டாம்."
          : "Cool the burn with running water. Do not apply ice.",
      steps: [
        {
          step_number: 1,
          title: "COOL THE BURN",
          action:
            "Hold burn under cool running water for 20 minutes. Never apply ice, butter, or ointments.",
        },
        {
          step_number: 2,
          title: "REMOVE TIGHT ITEMS",
          action:
            "Gently take off rings, watches, belts, and non-sticking clothing near burn area before swelling begins.",
        },
        {
          step_number: 3,
          title: "COVER WITH CLEAN FILM",
          action:
            "Cover loosely with clean plastic cling film or a sterile non-fluffy dressing.",
        },
      ],
    },
    "DEEP CUT": {
      incident_type: "DEEP CUT",
      severity: "MEDIUM",
      translated_warning:
        lang === "hi"
          ? "मजबूती से दबाव डालें। धँसी वस्तु न निकालें।"
          : lang === "ta"
          ? "உறுதியாக அழுத்தம் கொடுக்கவும். புதைந்த பொருளை அகற்ற வேண்டாம்."
          : "Apply firm direct pressure to stop bleeding. Do not remove embedded objects.",
      steps: [
        {
          step_number: 1,
          title: "APPLY DIRECT PRESSURE",
          action:
            "Press a clean cloth or sterile pad firmly onto the wound for 10 continuous minutes without lifting.",
        },
        {
          step_number: 2,
          title: "ELEVATE INJURED AREA",
          action:
            "Raise the injured limb above heart level to slow down blood flow if no broken bones are suspected.",
        },
        {
          step_number: 3,
          title: "BANDAGE FIRMLY",
          action:
            "Wrap a clean bandage firmly around dressing. If blood soaks through, add another pad on top without removing original.",
        },
      ],
    },
  };

  return fallbacks[hazard] || fallbacks["CHEMICAL SPLASH"];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let requestData: EmergencyRequest = {};
  try {
    requestData = await req.json();
  } catch {
    // Empty or malformed payload -> safe fallback
  }

  const rawText = requestData.text;
  const rawImage = requestData.imageBase64;
  const targetLanguage = sanitizeLanguage(requestData.language);
  const cleanText = sanitizeText(rawText);

  // Validate image base64 length (max 10MB data URL limit)
  let cleanBase64 = "";
  let mimeType = "image/jpeg";
  if (typeof rawImage === "string" && rawImage.length <= 14 * 1024 * 1024) {
    if (rawImage.startsWith("data:")) {
      const matches = rawImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        cleanBase64 = matches[2];
      }
    } else {
      cleanBase64 = rawImage;
    }
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    console.warn("GEMINI_API_KEY missing from environment. Serving pre-compiled emergency protocol.");
    const fallback = getFallbackProtocol(cleanText, targetLanguage);
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are RescuAI, an emergency first-aid AI operating under a 10-second life-safety SLA for panic situations.
Analyze the provided emergency hazard (text description and/or image).
Provide a precise first-aid response formatted strictly according to the JSON schema.
- incident_type: Identify emergency (e.g. CHEMICAL SPLASH, THERMAL BURN, DEEP CUT).
- severity: "LOW", "MEDIUM", or "HIGH".
- translated_warning: A single urgent warning sentence localized into language code: "${targetLanguage}".
- steps: Array of EXACTLY 3 objects with fields step_number (1, 2, 3), title (short uppercase action line, max 4-5 words), and action (clear, direct first-aid instruction, max 25 words).`;

    const contents: any[] = [];
    if (cleanBase64) {
      contents.push({ inlineData: { mimeType, data: cleanBase64 } });
    }

    if (cleanText) {
      contents.push({ text: `Hazard details: ${cleanText}` });
    } else if (contents.length === 0) {
      contents.push({ text: "Hazard photo provided for emergency first-aid triage." });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        incident_type: {
          type: Type.STRING,
          description: "Name or type of the hazard identified",
        },
        severity: {
          type: Type.STRING,
          enum: ["LOW", "MEDIUM", "HIGH"],
          description: "Severity level of the emergency hazard",
        },
        translated_warning: {
          type: Type.STRING,
          description: "Immediate critical warning translated into target language",
        },
        steps: {
          type: Type.ARRAY,
          description: "Exactly 3 step-by-step immediate first-aid instructions",
          items: {
            type: Type.OBJECT,
            properties: {
              step_number: { type: Type.INTEGER },
              title: {
                type: Type.STRING,
                description: "Short uppercase action-oriented title",
              },
              action: {
                type: Type.STRING,
                description: "Clear, direct first-aid instruction",
              },
            },
            required: ["step_number", "title", "action"],
          },
        },
      },
      required: ["incident_type", "severity", "translated_warning", "steps"],
    };

    // 4-second strict execution window timeout race
    const geminiCall = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const timeoutLimit = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Gemini API call exceeded 4s execution window")),
        4000
      )
    );

    const response: any = await Promise.race([geminiCall, timeoutLimit]);
    const responseText = response.text;

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsed: EmergencyResponse = JSON.parse(responseText);

    if (!parsed.steps || parsed.steps.length !== 3) {
      throw new Error("Gemini response did not produce exactly 3 action steps");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const errorMsg = err?.message ? String(err.message) : "Unknown error";
    console.error("Edge function triage error:", errorMsg);
    const fallback = getFallbackProtocol(cleanText, targetLanguage);
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
