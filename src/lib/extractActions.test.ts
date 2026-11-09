import { buildDemoTranscript } from "./demoTranscript";
import { extractActions } from "./extractActions";

test("links extracted actions to their source line ids", () => {
  const lines = buildDemoTranscript(12);
  const actions = extractActions(lines);

  expect(actions.length).toBeGreaterThan(0);
  expect(actions.length).toBeLessThanOrEqual(8);
  for (const action of actions) {
    const source = lines.find((line) => line.id === action.sourceLineIds[0]);
    expect(source?.text).toBe(action.text);
  }
});
