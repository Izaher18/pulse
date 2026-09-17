export function formatRelative(date: Date, now = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatUptime(uptime: number | null): string {
  if (uptime === null) return "—";
  return `${uptime.toFixed(uptime === 100 ? 0 : 2)}%`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  return `${ms} ms`;
}

export function formatInterval(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const leftoverMinutes = minutes % 60;
  if (hours < 24) {
    return leftoverMinutes ? `${hours}h ${leftoverMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const leftoverHours = hours % 24;
  return leftoverHours ? `${days}d ${leftoverHours}h` : `${days}d`;
}

// Status pages are read by strangers in unknown timezones, and they get cached
// for a minute, so absolute UTC beats "2m ago" going stale in the cached HTML.
export function formatUtc(date: Date): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDay(dayKey: string): string {
  return dayFormatter.format(new Date(`${dayKey}T00:00:00Z`));
}
