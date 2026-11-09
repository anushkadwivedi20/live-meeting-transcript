import type { TranscriptLine } from "../types";

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function lineMatches(line: TranscriptLine, query: string): boolean {
  const needle = normalizeQuery(query);
  if (!needle) return true;
  return (
    line.text.toLowerCase().includes(needle) ||
    line.speakerName.toLowerCase().includes(needle)
  );
}

export function filterLines(lines: TranscriptLine[], query: string): TranscriptLine[] {
  const needle = normalizeQuery(query);
  if (!needle) return lines;
  return lines.filter((line) => lineMatches(line, needle));
}

export type TextSegment = { text: string; match: boolean };

export function highlightSegments(text: string, query: string): TextSegment[] {
  const needle = normalizeQuery(query);
  if (!needle) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const segments: TextSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const found = lower.indexOf(needle, cursor);
    if (found === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }
    if (found > cursor) {
      segments.push({ text: text.slice(cursor, found), match: false });
    }
    segments.push({ text: text.slice(found, found + needle.length), match: true });
    cursor = found + needle.length;
  }

  return segments.filter((segment) => segment.text.length > 0);
}
