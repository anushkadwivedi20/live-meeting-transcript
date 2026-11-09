import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatClock, speakerColor } from "../lib/format";
import { filterLines, highlightSegments } from "../lib/search";
import type { TranscriptLine } from "../types";

type TranscriptPanelProps = {
  lines: TranscriptLine[];
  query: string;
  onQueryChange: (query: string) => void;
  activeLineId: string | null;
};

export function TranscriptPanel({
  lines,
  query,
  onQueryChange,
  activeLineId,
}: TranscriptPanelProps) {
  const visible = filterLines(lines, query);
  const parentRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92,
    overscan: 10,
  });

  useEffect(() => {
    if (!activeLineId) return;
    const index = visible.findIndex((line) => line.id === activeLineId);
    if (index >= 0) {
      stickToBottom.current = false;
      virtualizer.scrollToIndex(index, { align: "center" });
    }
  }, [activeLineId, visible, virtualizer]);

  useEffect(() => {
    if (!stickToBottom.current || query.trim()) return;
    if (visible.length === 0) return;
    virtualizer.scrollToIndex(visible.length - 1, { align: "end" });
  }, [query, visible.length, virtualizer]);

  const matchLabel =
    query.trim().length === 0
      ? `${lines.length.toLocaleString()} lines`
      : `${visible.length.toLocaleString()} matches`;

  return (
    <section className="transcript" aria-labelledby="transcript-heading">
      <div className="panel-head">
        <div>
          <h2 id="transcript-heading">Transcript</h2>
          <p className="meta">{matchLabel}</p>
        </div>
        <div className="search">
          <label htmlFor="transcript-search">Search transcript</label>
          <input
            id="transcript-search"
            type="search"
            value={query}
            placeholder="Speaker or phrase"
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>

      <div
        ref={parentRef}
        className="scroller"
        tabIndex={0}
        aria-label="Transcript captions"
        onScroll={(event) => {
          const node = event.currentTarget;
          const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
          stickToBottom.current = distance < 96;
        }}
      >
        {visible.length === 0 ? (
          <p className="empty">
            {lines.length === 0
              ? "Captions will show up here as the meeting streams in. You can also load a 10,000 line demo."
              : "No captions match that search."}
          </p>
        ) : (
          <div className="virtual-space" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const line = visible[virtualRow.index];
              const segments = highlightSegments(line.text, query);
              return (
                <article
                  key={line.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={line.id === activeLineId ? "caption is-active" : "caption"}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <header>
                    <span className="speaker" style={{ color: speakerColor(line.speakerName) }}>
                      {line.speakerName}
                    </span>
                    <time dateTime={new Date(line.startedAt).toISOString()}>
                      {formatClock(line.startedAt)}
                    </time>
                    {line.source === "microphone" ? <span className="tag">Mic</span> : null}
                    {!line.isFinal ? <span className="tag">Live</span> : null}
                  </header>
                  <p>
                    {segments.map((segment, index) =>
                      segment.match ? (
                        <mark key={`${line.id}-${index}`}>{segment.text}</mark>
                      ) : (
                        <span key={`${line.id}-${index}`}>{segment.text}</span>
                      ),
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
