import { useEffect, useState } from "react";
import { ProtocolStep } from "../services/api";

interface AudioPlayerProps {
  step: ProtocolStep;
  allSteps?: ProtocolStep[];
  autoPlay?: boolean;
  language?: string;
}

export function AudioPlayer({ step, allSteps, autoPlay = true, language = "en" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : "en-US";
    utterance.rate = 0.95;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Auto-vocalize Step 1 directive on mount / change if autoPlay is true
  useEffect(() => {
    if (autoPlay && step) {
      const textToSpeak = `Step one. ${step.title}. ${step.action}`;
      speakText(textToSpeak);
    }
    return () => {
      stopAudio();
    };
  }, [step?.title, step?.action, autoPlay]);

  const toggleAllAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      const fullProtocolText = (allSteps && allSteps.length > 0)
        ? allSteps.map((s, i) => `Step ${i + 1}. ${s.title}. ${s.action}`).join(". ")
        : `Step 1. ${step.title}. ${step.action}`;
      speakText(fullProtocolText);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={toggleAllAudio}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 bg-red-600 px-4 text-base font-black tracking-wide text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        aria-label={isPlaying ? "Stop audio read-out" : "Read out emergency protocol"}
      >
        <span aria-hidden="true">{isPlaying ? "■" : "🔊"}</span>
        <span>{isPlaying ? "STOP READ-OUT" : "READ OUT PROTOCOL (TTS)"}</span>
      </button>
    </div>
  );
}
