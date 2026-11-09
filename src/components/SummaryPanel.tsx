import { useState } from "react";
import type { ActionItem, SummaryEngine, TranscriptLine } from "../types";

type SummaryPanelProps = {
  items: ActionItem[];
  engine: SummaryEngine | null;
  busy: boolean;
  disabled: boolean;
  error: string;
  findLine: (id: string) => TranscriptLine | undefined;
  onGenerate: () => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onJump: (id: string) => void;
};

export function SummaryPanel({
  items,
  engine,
  busy,
  disabled,
  error,
  findLine,
  onGenerate,
  onAccept,
  onDismiss,
  onEdit,
  onJump,
}: SummaryPanelProps) {
  const visible = items.filter((item) => item.status !== "dismissed");

  return (
    <aside className="summary" aria-labelledby="summary-heading">
      <div className="panel-head">
        <div>
          <h2 id="summary-heading">Action items</h2>
          <p className="meta">
            {engine === "claude"
              ? "Drafted by Claude"
              : engine === "local"
                ? "Drafted locally"
                : "Linked back to the caption they came from"}
          </p>
        </div>
        <button type="button" onClick={onGenerate} disabled={disabled || busy}>
          {busy ? "Generating…" : "Generate action items"}
        </button>
      </div>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="summary-list">
        {visible.length === 0 ? (
          <p className="empty">
            Generate a pass over the transcript, then accept, edit, or dismiss each item.
          </p>
        ) : (
          visible.map((item) => (
            <ActionCard
              key={item.id}
              item={item}
              source={findLine(item.sourceLineIds[0] ?? "")}
              onAccept={onAccept}
              onDismiss={onDismiss}
              onEdit={onEdit}
              onJump={onJump}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function ActionCard({
  item,
  source,
  onAccept,
  onDismiss,
  onEdit,
  onJump,
}: {
  item: ActionItem;
  source: TranscriptLine | undefined;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onJump: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  const save = () => {
    onEdit(item.id, draft);
    setEditing(false);
  };

  return (
    <article className={item.status === "accepted" ? "action is-accepted" : "action"}>
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label htmlFor={`edit-${item.id}`}>Edit action item</label>
          <textarea
            id={`edit-${item.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="row">
            <button type="submit">Save</button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setDraft(item.text);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <h3>{item.text}</h3>
          {source ? (
            <button type="button" className="source" onClick={() => onJump(source.id)}>
              View source from {source.speakerName}: {source.text}
            </button>
          ) : null}
          <div className="row">
            <button
              type="button"
              aria-pressed={item.status === "accepted"}
              onClick={() => onAccept(item.id)}
            >
              {item.status === "accepted" ? "Accepted" : "Accept"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setDraft(item.text);
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button type="button" className="ghost" onClick={() => onDismiss(item.id)}>
              Dismiss
            </button>
          </div>
        </>
      )}
    </article>
  );
}
