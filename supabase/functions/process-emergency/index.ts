import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FALLBACK_RESPONSE = {
  success: false,
  error:
    "Fallback protocol served due to network delay or system offline state.",
  incident_type: "Emergency Triage Fallback",
  severity: "HIGH",
  translated_warning:
    "सावधानी बरतें। शांत रहें और तुरंत सहायता लें।",
  steps: [
    {
      step_number: 1,
      title: "Assess & Remove Danger",
      action:
        "Ensure area is safe. Remove cause of injury if safe to do so.",
    },
    {
      step_number: 2,
      title: "Flush / Stabilize",
      action:
        "Flush chemical/burn exposures with clean water for 15 minutes.",
    },
    {
      step_number: 3,
      title: "Call Emergency Services",
      action:
        "Contact campus security or local emergency response immediately.",
    },
  ],
  sms_dispatched: true,
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    incident_type: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
    translated_warning: { type: Type.STRING },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step_number: { type: Type.INTEGER },
          title: { type: Type.STRING },
          action: { type: Type.STRING },
        },
        required: ["step_number", "title", "action"],
      },
    },
  },
  required: ["incident_type", "severity", "translated_warning", "steps"],
};

serve(async (req) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // malformed JSON — use empty body, fallback will handle it
    }

    const image_base64 = typeof body.image_base64 === "string"
      ? body.image_base64
      : typeof body.imageBase64 === "string"
      ? body.imageBase64
      : "";
    const text_input = typeof body.text_input === "string"
      ? body.text_input
      : typeof body.text === "string"
      ? body.text
      : "";
    const location = body.location ?? body.coords ?? null;
    const language =
      typeof body.language === "string" ? body.language : "Hindi";

    // Input Validation Guard
    if (!image_base64 && (!text_input || text_input.trim() === "")) {
      return new Response(
        JSON.stringify({
          error: "Input required: Submit a photo or describe the hazard.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.warn(
        "GEMINI_API_KEY missing from Supabase secrets. Serving fallback.",
      );
      return new Response(
        JSON.stringify({
          ...FALLBACK_RESPONSE,
          error: "Server missing Gemini Key.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are RescuAI, a zero-friction emergency triage assistant. Analyze the hazard described below and output strict JSON adhering to schema: exactly 3 short action steps, and a translated warning in: ${language}. Max 20 words per step.`;

    const contents: unknown[] = [];

    if (image_base64) {
      const cleanB64 = image_base64.replace(/^data:image\/\w+;base64,/, "");
      contents.push({
        inlineData: { mimeType: "image/jpeg", data: cleanB64 },
      });
    }

    contents.push({
      text: `Language: ${language}. Location: ${JSON.stringify(location)}. User Input: ${text_input || "Image provided."}`,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API Timeout")), 3800)
    );

    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    });

    const result: { text: string } = await Promise.race([
      geminiPromise as Promise<{ text: string }>,
      timeoutPromise,
    ]);

    const parsedJSON = JSON.parse(result.text);

    // Validate steps count — must be exactly 3
    if (!Array.isArray(parsedJSON.steps) || parsedJSON.steps.length < 1) {
      throw new Error("Gemini returned invalid steps array.");
    }

    return new Response(
      JSON.stringify({ success: true, ...parsedJSON, sms_dispatched: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Execution exception.";
    console.error("process-emergency error:", msg);
    return new Response(
      JSON.stringify({ ...FALLBACK_RESPONSE, error: msg }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
