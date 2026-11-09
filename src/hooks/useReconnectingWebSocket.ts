import { useEffect, useRef, useState } from "react";
import { backoffDelay } from "../lib/backoff";
import type { ConnectionStatus } from "../types";

type UseReconnectingWebSocketOptions = {
  url: string;
  onMessage: (data: string) => void;
};

export function useReconnectingWebSocket({ url, onMessage }: UseReconnectingWebSocketOptions): {
  status: ConnectionStatus;
  attempt: number;
} {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [attempt, setAttempt] = useState(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let stopped = false;
    let retry = 0;
    let timer = 0;

    const connect = () => {
      if (stopped) return;
      setStatus(retry === 0 ? "connecting" : "reconnecting");
      setAttempt(retry);
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (stopped) return;
        retry = 0;
        setAttempt(0);
        setStatus("connected");
      };

      socket.onmessage = (event) => {
        if (stopped) return;
        onMessageRef.current(String(event.data));
      };

      socket.onclose = () => {
        if (stopped) return;
        const delay = backoffDelay(retry);
        retry += 1;
        setAttempt(retry);
        setStatus("reconnecting");
        timer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      socket?.close();
    };
  }, [url]);

  return { status, attempt };
}
