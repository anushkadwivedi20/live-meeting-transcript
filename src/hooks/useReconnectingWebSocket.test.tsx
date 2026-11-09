import { act, renderHook } from "@testing-library/react";
import { useReconnectingWebSocket } from "./useReconnectingWebSocket";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  close() {
    this.onclose?.();
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

test("reconnects after the socket closes", () => {
  jest.useFakeTimers();
  const onMessage = jest.fn();
  const { result } = renderHook(() =>
    useReconnectingWebSocket({ url: "ws://localhost:8788", onMessage }),
  );

  const first = MockWebSocket.instances[0];
  act(() => first.onopen?.());
  expect(result.current.status).toBe("connected");

  act(() => first.onclose?.());
  expect(result.current.status).toBe("reconnecting");
  expect(result.current.attempt).toBe(1);

  act(() => {
    jest.advanceTimersByTime(500);
  });
  expect(MockWebSocket.instances).toHaveLength(2);
  expect(MockWebSocket.instances[1].url).toBe("ws://localhost:8788");
  jest.useRealTimers();
});
