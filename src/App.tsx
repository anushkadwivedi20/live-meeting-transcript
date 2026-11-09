import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { SummaryPanel } from "./components/SummaryPanel";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { useReconnectingWebSocket } from "./hooks/useReconnectingWebSocket";
import { useSpeechInput } from "./hooks/useSpeechInput";
import { actionReducer, initialActionState } from "./lib/actionItems";
import { buildDemoTranscript } from "./lib/demoTranscript";
import { parseCaptionMessage } from "./lib/parseCaption";
import { requestSummary } from "./lib/summarize";
import type { SummaryEngine, TranscriptLine } from "./types";

const DEMO_COUNT = 10_000;

export function App() {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interim, setInterim] = useState<TranscriptLine | null>(null);
  const [query, setQuery] = useState("");
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [actions, dispatch] = useReducer(actionReducer, initialActionState);
  const [engine, setEngine] = useState<SummaryEngine | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const seenIds = useRef(new Set<string>());

  const onMessage = useCallback((data: string) => {
    const line = parseCaptionMessage(data);
    if (!line || seenIds.current.has(line.id)) return;
    seenIds.current.add(line.id);
    setLines((current) => [...current, line]);
    setAnnouncement(`New caption from ${line.speakerName}.`);
  }, []);

  const { status, attempt } = useReconnectingWebSocket({
    url: import.meta.env.VITE_WS_URL ?? "ws://localhost:8788",
    onMessage,
  });

  const speech = useSpeechInput({
    onFinal: (text) => {
      const line: TranscriptLine = {
        id: `mic-${crypto.randomUUID()}`,
        speakerName: "You",
        text,
        startedAt: Date.now(),
        isFinal: true,
        source: "microphone",
      };
      setInterim(null);
      setLines((current) => [...current, line]);
      setAnnouncement("New caption from You.");
    },
    onInterim: (text) => {
      if (!text) {
        setInterim(null);
        return;
      }
      setInterim({
        id: "mic-interim",
        speakerName: "You",
        text,
        startedAt: Date.now(),
        isFinal: false,
        source: "microphone",
      });
    },
  });

  const visibleLines = useMemo(
    () => (interim ? [...lines, interim] : lines),
    [interim, lines],
  );

  const lineById = useMemo(() => {
    const map = new Map<string, TranscriptLine>();
    for (const line of lines) map.set(line.id, line);
    return map;
  }, [lines]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.key === "/" && !typing) {
        event.preventDefault();
        document.getElementById("transcript-search")?.focus();
      }
      if (event.key === "Escape") {
        setQuery("");
        setActiveLineId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadDemo = () => {
    const demo = buildDemoTranscript(DEMO_COUNT);
    seenIds.current = new Set(demo.map((line) => line.id));
    setInterim(null);
    setLines(demo);
    setQuery("");
    setActiveLineId(null);
    setAnnouncement("Loaded 10,000 transcript lines.");
  };

  const clearTranscript = () => {
    seenIds.current.clear();
    setInterim(null);
    setLines([]);
    setQuery("");
    setActiveLineId(null);
    setAnnouncement("Transcript cleared.");
  };

  const generate = async () => {
    setBusy(true);
    setSummaryError("");
    try {
      const result = await requestSummary(lines);
      dispatch({ type: "replace", items: result.items });
      setEngine(result.engine);
      if (result.items.length === 0) {
        setSummaryError("No action items were found in this transcript.");
      }
    } finally {
      setBusy(false);
    }
  };

  const connectionLabel =
    status === "connected"
      ? "Connected"
      : status === "connecting"
        ? "Connecting"
        : `Reconnecting, attempt ${attempt}`;

  return (
    <div className="app">
      <a className="skip" href="#transcript-heading">
        Skip to transcript
      </a>
      <header className="topbar">
        <div>
          <p className="eyebrow">Live meeting</p>
          <h1>Transcript viewer</h1>
        </div>
        <p className="status" role="status">
          Stream {connectionLabel.toLowerCase()}. {lines.length.toLocaleString()} saved lines.
        </p>
        <div className="toolbar">
          <button
            type="button"
            aria-pressed={speech.listening}
            disabled={!speech.supported}
            onClick={() => (speech.listening ? speech.stop() : speech.start())}
          >
            {speech.listening ? "Stop microphone" : "Start microphone"}
          </button>
          <button type="button" onClick={loadDemo}>
            Load 10,000 lines
          </button>
          <button type="button" className="ghost" onClick={clearTranscript}>
            Clear transcript
          </button>
        </div>
      </header>

      {speech.error ? (
        <p className="banner" role="alert">
          {speech.error}
        </p>
      ) : null}
      {!speech.supported ? (
        <p className="banner">
          Microphone captions need the Web Speech API. Chrome and Edge provide it; this browser does not.
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <main className="workspace">
        <TranscriptPanel
          lines={visibleLines}
          query={query}
          onQueryChange={setQuery}
          activeLineId={activeLineId}
        />
        <SummaryPanel
          items={actions.items}
          engine={engine}
          busy={busy}
          disabled={lines.length === 0}
          error={summaryError}
          findLine={(id) => lineById.get(id)}
          onGenerate={() => {
            void generate();
          }}
          onAccept={(id) => dispatch({ type: "accept", id })}
          onDismiss={(id) => dispatch({ type: "dismiss", id })}
          onEdit={(id, text) => dispatch({ type: "edit", id, text })}
          onJump={(id) => {
            setQuery("");
            setActiveLineId(id);
          }}
        />
      </main>
    </div>
  );
}
