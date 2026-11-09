import type { ActionDraft, SummaryEngine, TranscriptLine } from "../types";
import { extractActions } from "./extractActions";

export type SummaryResult = {
  items: ActionDraft[];
  engine: SummaryEngine;
};

export async function requestSummary(lines: TranscriptLine[]): Promise<SummaryResult> {
  const finals = lines.filter((line) => line.isFinal);
  const payload = finals.slice(-500).map((line) => ({
    id: line.id,
    speakerName: line.speakerName,
    text: line.text,
  }));

  try {
    const response = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: payload }),
    });
    if (!response.ok) {
      throw new Error(`Summary request failed (${response.status})`);
    }
    const body = (await response.json()) as Partial<SummaryResult>;
    if (!Array.isArray(body.items) || (body.engine !== "claude" && body.engine !== "local")) {
      throw new Error("Summary response was not valid");
    }
    const known = new Set(finals.map((line) => line.id));
    const items = body.items.flatMap((item) => {
      if (!item || typeof item.text !== "string") return [];
      const sourceLineIds = Array.isArray(item.sourceLineIds)
        ? item.sourceLineIds.filter((id): id is string => typeof id === "string" && known.has(id))
        : [];
      if (sourceLineIds.length === 0) return [];
      return [{ text: item.text, sourceLineIds }];
    });
    return { items, engine: body.engine };
  } catch {
    return { items: extractActions(finals), engine: "local" };
  }
}
