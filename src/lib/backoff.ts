const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 15_000;

/** Delay before the next WebSocket reconnect. `attempt` is zero-based. */
export function backoffDelay(attempt: number): number {
  const safeAttempt = Math.max(0, Math.floor(attempt));
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** safeAttempt);
}
