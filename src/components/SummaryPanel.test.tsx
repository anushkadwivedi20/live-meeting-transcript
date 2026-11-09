import { fireEvent, render, screen } from "@testing-library/react";
import type { ActionItem, TranscriptLine } from "../types";
import { SummaryPanel } from "./SummaryPanel";

const line: TranscriptLine = {
  id: "demo-1",
  speakerName: "Jordan Lee",
  text: "I'll update the API contract and send it to mobile by tomorrow.",
  startedAt: Date.UTC(2026, 9, 12, 16, 0, 8),
  isFinal: true,
  source: "demo",
};

const item: ActionItem = {
  id: "pending-0-demo-1",
  text: line.text,
  sourceLineIds: [line.id],
  status: "pending",
};

function renderPanel(overrides: Partial<ActionItem> = {}) {
  const onAccept = jest.fn();
  const onDismiss = jest.fn();
  const onEdit = jest.fn();
  const onJump = jest.fn();
  const onGenerate = jest.fn();

  render(
    <SummaryPanel
      items={[{ ...item, ...overrides }]}
      engine="local"
      busy={false}
      disabled={false}
      error=""
      findLine={(id) => (id === line.id ? line : undefined)}
      onGenerate={onGenerate}
      onAccept={onAccept}
      onDismiss={onDismiss}
      onEdit={onEdit}
      onJump={onJump}
    />,
  );

  return { onAccept, onDismiss, onEdit, onJump, onGenerate };
}

test("accepts, edits, dismisses, and jumps to the source line", () => {
  const handlers = renderPanel();

  expect(screen.getByText("Drafted locally")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Generate action items" }));
  fireEvent.click(screen.getByRole("button", { name: /View source from Jordan Lee/ }));
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

  expect(handlers.onGenerate).toHaveBeenCalledTimes(1);
  expect(handlers.onJump).toHaveBeenCalledWith("demo-1");
  expect(handlers.onAccept).toHaveBeenCalledWith(item.id);
  expect(handlers.onDismiss).toHaveBeenCalledWith(item.id);

  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Edit action item"), {
    target: { value: "Send the updated contract tomorrow." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(handlers.onEdit).toHaveBeenCalledWith(item.id, "Send the updated contract tomorrow.");
});

test("hides dismissed items", () => {
  renderPanel({ status: "dismissed" });
  expect(screen.queryByRole("heading", { name: line.text })).not.toBeInTheDocument();
});
