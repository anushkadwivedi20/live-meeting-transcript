import { backoffDelay } from "./backoff";

test("backs off exponentially and caps the delay", () => {
  expect(backoffDelay(0)).toBe(500);
  expect(backoffDelay(1)).toBe(1000);
  expect(backoffDelay(2)).toBe(2000);
  expect(backoffDelay(3)).toBe(4000);
  expect(backoffDelay(10)).toBe(15_000);
});
