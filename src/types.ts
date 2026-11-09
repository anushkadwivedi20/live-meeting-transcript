export type CaptionSource = "websocket" | "microphone" | "demo";

export type TranscriptLine = {
  id: string;
  speakerName: string;
  text: string;
  startedAt: number;
  isFinal: boolean;
  source: CaptionSource;
};

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

export type ActionStatus = "pending" | "accepted" | "dismissed";

export type ActionDraft = {
  text: string;
  sourceLineIds: string[];
};

export type ActionItem = ActionDraft & {
  id: string;
  status: ActionStatus;
};

export type SummaryEngine = "claude" | "local";

export type CaptionMessage = {
  type: "caption";
  id: string;
  speakerName: string;
  text: string;
  startedAt: number;
  isFinal: boolean;
};
