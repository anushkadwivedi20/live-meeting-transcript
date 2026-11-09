import type { TranscriptLine } from "../types";

export const DEMO_BEATS: { speakerName: string; text: string }[] = [
  {
    speakerName: "Priya Shah",
    text: "We need to freeze the launch checklist before Friday.",
  },
  {
    speakerName: "Jordan Lee",
    text: "I'll update the API contract and send it to mobile by tomorrow.",
  },
  {
    speakerName: "Sam Okonkwo",
    text: "Let's revise the empty state so the first caption is easier to read.",
  },
  {
    speakerName: "Priya Shah",
    text: "Can you follow up with support about the export bug?",
  },
  {
    speakerName: "Jordan Lee",
    text: "I will add a regression test for the WebSocket reconnect path.",
  },
  {
    speakerName: "Sam Okonkwo",
    text: "We should document the action-item review flow in the README.",
  },
  {
    speakerName: "Priya Shah",
    text: "Please confirm CloudFront caching rules before we deploy.",
  },
  {
    speakerName: "Jordan Lee",
    text: "I'll take the virtualized list performance check.",
  },
  {
    speakerName: "Sam Okonkwo",
    text: "Let's schedule a dry run with a 10,000 line transcript.",
  },
  {
    speakerName: "Priya Shah",
    text: "Action item: Jordan owns the summary prompt, Sam owns the empty state.",
  },
  {
    speakerName: "Jordan Lee",
    text: "I'll ping design once the contract diff is up.",
  },
  {
    speakerName: "Sam Okonkwo",
    text: "We need to verify keyboard access on the search field.",
  },
];

const START = Date.UTC(2026, 9, 12, 16, 0, 0);

export function buildDemoTranscript(count: number): TranscriptLine[] {
  const total = Math.max(0, Math.floor(count));
  const lines: TranscriptLine[] = [];

  for (let index = 0; index < total; index += 1) {
    const beat = DEMO_BEATS[index % DEMO_BEATS.length];
    lines.push({
      id: `demo-${index}`,
      speakerName: beat.speakerName,
      text: beat.text,
      startedAt: START + index * 8_000,
      isFinal: true,
      source: "demo",
    });
  }

  return lines;
}
