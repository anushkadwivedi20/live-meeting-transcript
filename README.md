# Live Meeting Transcript Viewer

A React and TypeScript viewer for a live meeting. Captions arrive over a WebSocket with speaker names; microphone dictation can be added in the browser, and a side panel turns the transcript into action items you can accept, edit, or dismiss. Each item stays linked to the caption it came from.

This is the application baseline: the UI, the local caption server, unit tests, and a Playwright flow. It is not deployed yet.

## What you can do

- Watch speaker-labeled captions stream in, with automatic reconnect if the socket drops.
- Dictate with the Web Speech API in browsers that provide it (Chrome).
- Load a 10,000 line demo and search it. The list is virtualized, so the page only renders the rows on screen.
- Generate action items, then accept, edit, or dismiss them. Choosing an item scrolls to its source line.
- Press `/` to focus search and `Escape` to clear it.

## Stack

- React 19 and TypeScript, built with Vite
- A small Node server (`ws`) for the caption stream and summary API
- `@tanstack/react-virtual` for the transcript list
- Jest and React Testing Library for unit tests
- Playwright for the browser flow

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Vite serves the app and proxies `/api` to the summary server on port 8787. Captions connect directly to `ws://localhost:8788`.

On connect, the server plays a short scripted meeting, one caption every 900ms. **Load 10,000 lines** fills the viewer locally so you can try search and scrolling without waiting for a live stream.

## Summaries

**Generate action items** sends the latest captions to `POST /api/summarize`.

- With `ANTHROPIC_API_KEY` set, the server asks Claude (`ANTHROPIC_MODEL`, default `claude-sonnet-4-5`) for JSON action items and shows them as drafted by Claude.
- Without a key, or if that request fails, the server uses a local extractor that pulls next-step sentences and still links each one to a transcript line. The panel labels that pass as drafted locally.

Copy `.env.example` to `.env` if you want the Claude path. The key stays on the server.

Accepted items are kept when you generate again. Dismissed items leave the list. Edits are saved in the browser for this session.

## WebSocket messages

Each caption is one JSON text frame:

```json
{
  "type": "caption",
  "id": "live-1",
  "speakerName": "Jordan Lee",
  "text": "I'll update the API contract and send it to mobile by tomorrow.",
  "startedAt": 1760000000000,
  "isFinal": true
}
```

If the socket closes, the client waits 500ms, then 1s, 2s, and so on, up to 15s, and tries again. A successful connection resets that delay.

Override the URL with `VITE_WS_URL` at build time.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | App and local caption/summary server |
| `npm test` | Jest and React Testing Library |
| `npm run test:e2e` | Playwright against the dev server |
| `npm run build` | Typecheck and production bundle in `dist/` |

## Accessibility and performance

The layout uses a skip link, labeled controls, visible focus, and a polite live region for one caption at a time. Text colors are chosen for contrast on the cream background. The transcript window virtualizes rows so a 10,000 line meeting does not create 10,000 DOM nodes. Lighthouse has not been measured in this baseline.

## Production target

The intended host is a static build on Amazon S3, fronted by CloudFront. `npm run build` writes that static site to `dist/`. The caption socket and `/api/summarize` need a separate host; S3 cannot run the Node server. That deploy is not set up in this repo yet.
# live-meeting-transcript
