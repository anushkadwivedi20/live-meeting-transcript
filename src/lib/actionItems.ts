import type { ActionDraft, ActionItem, ActionStatus } from "../types";

export type ActionState = {
  items: ActionItem[];
};

export type ActionEvent =
  | { type: "replace"; items: ActionDraft[] }
  | { type: "accept"; id: string }
  | { type: "dismiss"; id: string }
  | { type: "edit"; id: string; text: string };

export const initialActionState: ActionState = { items: [] };

function withStatus(item: ActionItem, status: ActionStatus): ActionItem {
  return { ...item, status };
}

export function actionReducer(state: ActionState, event: ActionEvent): ActionState {
  switch (event.type) {
    case "replace": {
      const accepted = state.items.filter((item) => item.status === "accepted");
      const fresh = event.items
        .filter((item) => item.text.trim().length > 0)
        .map((item, index) => ({
          id: `pending-${index}-${item.sourceLineIds[0] ?? "none"}`,
          text: item.text.trim(),
          sourceLineIds: item.sourceLineIds,
          status: "pending" as const,
        }));
      return { items: [...accepted, ...fresh] };
    }
    case "accept":
      return {
        items: state.items.map((item) =>
          item.id === event.id ? withStatus(item, "accepted") : item,
        ),
      };
    case "dismiss":
      return {
        items: state.items.map((item) =>
          item.id === event.id ? withStatus(item, "dismissed") : item,
        ),
      };
    case "edit": {
      const text = event.text.trim();
      if (!text) return state;
      return {
        items: state.items.map((item) =>
          item.id === event.id ? { ...item, text } : item,
        ),
      };
    }
    default:
      return state;
  }
}
