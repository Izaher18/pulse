import type { DayUptime } from "@/lib/days";
import { formatDay, formatUptime } from "@/lib/format";

function tone(uptime: number | null): string {
  if (uptime === null) return "bg-zinc-800";
  if (uptime >= 100) return "bg-emerald-500";
  if (uptime >= 99) return "bg-emerald-600";
  if (uptime >= 95) return "bg-amber-400";
  return "bg-rose-500";
}

function label(day: DayUptime): string {
  if (day.uptime === null) {
    return `${formatDay(day.day)} · no checks`;
  }

  return `${formatDay(day.day)} · ${formatUptime(day.uptime)} of ${day.total} ${
    day.total === 1 ? "check" : "checks"
  }`;
}

export function UptimeBars({ days }: { days: DayUptime[] }) {
  const first = days.at(0);
  const last = days.at(-1);

  return (
    <div>
      <div className="flex h-10 items-stretch gap-[3px]">
        {days.map((day) => (
          <div
            key={day.day}
            title={label(day)}
            className={`flex-1 rounded-sm ${tone(day.uptime)}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{first ? formatDay(first.day) : null}</span>
        <span>{last ? "Today" : null}</span>
      </div>
    </div>
  );
}
