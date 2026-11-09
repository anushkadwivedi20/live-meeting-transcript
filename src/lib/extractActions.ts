import type { ActionDraft, TranscriptLine } from "../types";

const ACTION_PATTERN =
  /\b(i'll|i will|let's|we should|we need to|need to|follow up|action item|please|can you)\b/i;

/**
 * Offline fallback used when Claude is not configured.
 * Pulls concrete next-step lines and keeps the source line id.
 */
export function extractActions(lines: TranscriptLine[], limit = 8): ActionDraft[] {
  const drafts: ActionDraft[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line.isFinal) continue;
    const text = line.text.trim();
    if (!ACTION_PATTERN.test(text)) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    drafts.push({ text, sourceLineIds: [line.id] });
    if (drafts.length >= limit) break;
  }

  return drafts;
}
