import { actionReducer, initialActionState } from "./actionItems";

const draft = { text: "Send the contract", sourceLineIds: ["demo-1"] };

test("accepts, edits, and dismisses an action item", () => {
  const replaced = actionReducer(initialActionState, { type: "replace", items: [draft] });
  const id = replaced.items[0].id;

  const accepted = actionReducer(replaced, { type: "accept", id });
  expect(accepted.items[0].status).toBe("accepted");

  const edited = actionReducer(accepted, { type: "edit", id, text: " Send the contract tomorrow " });
  expect(edited.items[0].text).toBe("Send the contract tomorrow");
  expect(edited.items[0].status).toBe("accepted");

  const dismissed = actionReducer(edited, { type: "dismiss", id });
  expect(dismissed.items[0].status).toBe("dismissed");
});

test("keeps accepted items when a new draft set arrives", () => {
  const first = actionReducer(initialActionState, { type: "replace", items: [draft] });
  const accepted = actionReducer(first, { type: "accept", id: first.items[0].id });
  const next = actionReducer(accepted, {
    type: "replace",
    items: [{ text: "Write the test", sourceLineIds: ["demo-4"] }],
  });

  expect(next.items.map((item) => item.text)).toEqual(["Send the contract", "Write the test"]);
  expect(next.items[0].status).toBe("accepted");
  expect(next.items[1].status).toBe("pending");
});
