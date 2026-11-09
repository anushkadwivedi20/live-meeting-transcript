const SPEAKER_COLORS = ["#0f6e56", "#9a3412", "#1d4e89", "#6b21a8", "#3f6212", "#9f1239"];

export function speakerColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index) * (index + 1)) % 997;
  }
  return SPEAKER_COLORS[hash % SPEAKER_COLORS.length];
}

export function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}
