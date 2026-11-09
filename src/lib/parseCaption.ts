import type { CaptionMessage, TranscriptLine } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseCaptionMessage(raw: string): TranscriptLine | null {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(payload) || payload.type !== "caption") return null;
  if (typeof payload.id !== "string" || typeof payload.speakerName !== "string") return null;
  if (typeof payload.text !== "string" || typeof payload.startedAt !== "number") return null;

  const message: CaptionMessage = {
    type: "caption",
    id: payload.id,
    speakerName: payload.speakerName,
    text: payload.text,
    startedAt: payload.startedAt,
    isFinal: payload.isFinal !== false,
  };

  return {
    id: message.id,
    speakerName: message.speakerName,
    text: message.text,
    startedAt: message.startedAt,
    isFinal: message.isFinal,
    source: "websocket",
  };
}
