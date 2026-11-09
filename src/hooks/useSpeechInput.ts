import { useEffect, useRef, useState } from "react";

type SpeechHandlers = {
  onFinal: (transcript: string) => void;
  onInterim: (transcript: string) => void;
};

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechInput({ onFinal, onInterim }: SpeechHandlers): {
  supported: boolean;
  listening: boolean;
  error: string;
  start: () => void;
  stop: () => void;
} {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);
  const handlers = useRef({ onFinal, onInterim });
  handlers.current = { onFinal, onInterim };
  const listeningRef = useRef(false);

  useEffect(() => {
    setSupported(recognitionConstructor() !== null);
  }, []);

  useEffect(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor || !listening) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() ?? "";
        if (!transcript) continue;
        if (result.isFinal) handlers.current.onFinal(transcript);
        else interim = transcript;
      }
      handlers.current.onInterim(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was blocked."
          : "Microphone captions stopped unexpectedly.",
      );
      listeningRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      if (!listeningRef.current) return;
      try {
        recognition.start();
      } catch {
        setError("Microphone captions could not restart.");
        listeningRef.current = false;
        setListening(false);
      }
    };

    try {
      recognition.start();
    } catch {
      setError("Microphone captions could not start.");
      listeningRef.current = false;
      setListening(false);
    }

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, [listening]);

  const start = () => {
    setError("");
    listeningRef.current = true;
    setListening(true);
  };

  const stop = () => {
    listeningRef.current = false;
    setListening(false);
    handlers.current.onInterim("");
  };

  return { supported, listening, error, start, stop };
}
