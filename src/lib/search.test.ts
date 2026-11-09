import { buildDemoTranscript } from "./demoTranscript";
import { filterLines, highlightSegments } from "./search";

test("filters by speaker or phrase without case sensitivity", () => {
  const lines = buildDemoTranscript(12);
  expect(filterLines(lines, "checklist")).toHaveLength(1);
  const jordan = filterLines(lines, "JORDAN");
  expect(jordan.some((line) => line.speakerName === "Jordan Lee")).toBe(true);
  expect(jordan.some((line) => line.speakerName === "Priya Shah")).toBe(true);
  expect(filterLines(lines, "   ")).toHaveLength(12);
});

test("splits matched text for highlighting", () => {
  expect(highlightSegments("Freeze the checklist", "check")).toEqual([
    { text: "Freeze the ", match: false },
    { text: "check", match: true },
    { text: "list", match: false },
  ]);
});
