import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import { DEMO_BEATS } from "../src/lib/demoTranscript";
import { extractActions } from "../src/lib/extractActions";
import type { ActionDraft, SummaryEngine, TranscriptLine } from "../src/types";
import { WebSocketServer } from "ws";

loadEnvFile(".env");

const apiPort = Number(process.env.API_PORT ?? 8787);
const wsPort = Number(process.env.WS_PORT ?? 8788);
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

type IncomingLine = { id: string; speakerName: string; text: string };

const api = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/summarize") {
    void handleSummarize(req, res);
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

api.listen(apiPort, () => {
  console.log(`summary api http://localhost:${apiPort}`);
});

const sockets = new WebSocketServer({ port: wsPort });
sockets.on("listening", () => {
  console.log(`caption stream ws://localhost:${wsPort}`);
});

sockets.on("connection", (socket) => {
  let index = 0;
  const started = Date.now();
  const timer = setInterval(() => {
    if (socket.readyState !== socket.OPEN) return;
    if (index >= DEMO_BEATS.length) {
      clearInterval(timer);
      return;
    }
    const beat = DEMO_BEATS[index];
    const message = {
      type: "caption",
      id: `live-${started}-${index}`,
      speakerName: beat.speakerName,
      text: beat.text,
      startedAt: Date.now(),
      isFinal: true,
    };
    socket.send(JSON.stringify(message));
    index += 1;
  }, 900);

  socket.on("close", () => clearInterval(timer));
});

async function handleSummarize(req: http.IncomingMessage, res: http.ServerResponse) {
  try {
    const body = await readBody(req);
    const parsed = JSON.parse(body) as { lines?: unknown };
    const lines = Array.isArray(parsed.lines) ? parsed.lines.filter(isIncomingLine).slice(0, 500) : [];
    const transcript = lines.map(toTranscriptLine);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let items: ActionDraft[] = [];
    let engine: SummaryEngine = "local";

    if (apiKey) {
      try {
        items = await summarizeWithClaude(apiKey, lines);
        engine = "claude";
      } catch (error) {
        console.error("Claude summary failed; using local extractor.");
        console.error(error instanceof Error ? error.message : "Unknown summary error");
        items = extractActions(transcript);
      }
    } else {
      items = extractActions(transcript);
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ items, engine }));
  } catch {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid summary request" }));
  }
}

async function summarizeWithClaude(apiKey: string, lines: IncomingLine[]): Promise<ActionDraft[]> {
  const prompt = [
    "Extract concrete action items from this meeting transcript.",
    'Return JSON only: {"items":[{"text":"next step","sourceLineIds":["line id"]}]}',
    "Each item must cite one or more ids from the transcript. Skip vague discussion.",
    JSON.stringify(lines),
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = payload.content?.find((block) => block.type === "text")?.text ?? "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Claude did not return JSON");
  }
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { items?: ActionDraft[] };
  const known = new Set(lines.map((line) => line.id));
  return (parsed.items ?? []).flatMap((item) => {
    if (!item || typeof item.text !== "string") return [];
    const sourceLineIds = Array.isArray(item.sourceLineIds)
      ? item.sourceLineIds.filter((id) => typeof id === "string" && known.has(id))
      : [];
    if (!item.text.trim() || sourceLineIds.length === 0) return [];
    return [{ text: item.text.trim(), sourceLineIds }];
  });
}

function isIncomingLine(value: unknown): value is IncomingLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.id === "string" &&
    typeof line.speakerName === "string" &&
    typeof line.text === "string"
  );
}

function toTranscriptLine(line: IncomingLine): TranscriptLine {
  return {
    id: line.id,
    speakerName: line.speakerName,
    text: line.text,
    startedAt: Date.now(),
    isFinal: true,
    source: "websocket",
  };
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
