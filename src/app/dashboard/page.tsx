import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatInterval, formatMs, formatRelative, formatUptime } from "@/lib/format";
import { listMonitorSummaries, type MonitorSummary } from "@/lib/monitors";
import { MonitorControls } from "./monitor-controls";
import { MonitorForm } from "./monitor-form";

function statusLabel(monitor: MonitorSummary): {
  text: string;
  dot: string;
  tone: string;
} {
  if (!monitor.enabled) {
    return { text: "Paused", dot: "bg-zinc-600", tone: "text-zinc-400" };
  }

  if (!monitor.lastCheck) {
    return { text: "No checks yet", dot: "bg-zinc-600", tone: "text-zinc-400" };
  }

  if (monitor.lastCheck.ok) {
    return { text: "Up", dot: "bg-emerald-500", tone: "text-emerald-400" };
  }

  return { text: "Down", dot: "bg-rose-500", tone: "text-rose-400" };
}

export default async function DashboardPage() {
  const now = new Date();
  const monitors = await listMonitorSummaries(now);

  return (
    <div className="space-y-8">
      <AutoRefresh seconds={10} />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monitors</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {monitors.length === 0
            ? "Nothing is being watched yet."
            : `${monitors.length} monitored ${monitors.length === 1 ? "endpoint" : "endpoints"}. This page refreshes every 10 seconds.`}
        </p>
      </div>

      <MonitorForm />

      {monitors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          Add your first URL above, then run <code>npm run check:watch</code> to
          start polling it.
        </p>
      ) : (
        <ul className="space-y-3">
          {monitors.map((monitor) => {
            const status = statusLabel(monitor);

            return (
              <li
                key={monitor.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${status.dot}`}
                      />
                      <Link
                        href={`/dashboard/${monitor.id}`}
                        className="truncate font-medium transition-colors hover:text-emerald-400"
                      >
                        {monitor.name}
                      </Link>
                      <span className={`text-xs ${status.tone}`}>
                        {status.text}
                      </span>
                    </div>
                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {monitor.url}
                      </p>
                      {monitor.isPublic ? (
                        <Link
                          href={`/status/${monitor.slug}`}
                          className="mt-1 inline-block truncate text-sm text-emerald-500/90 transition-colors hover:text-emerald-400"
                        >
                          /status/{monitor.slug}
                        </Link>
                      ) : null}
                    </div>

                    <MonitorControls
                      monitorId={monitor.id}
                      enabled={monitor.enabled}
                      isPublic={monitor.isPublic}
                    />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-zinc-500">Uptime 24h</dt>
                    <dd className="mt-0.5">{formatUptime(monitor.uptime24h)}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Last response</dt>
                    <dd className="mt-0.5">
                      {monitor.lastCheck
                        ? formatMs(monitor.lastCheck.responseTimeMs)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Last checked</dt>
                    <dd className="mt-0.5">
                      {monitor.lastCheck
                        ? formatRelative(monitor.lastCheck.checkedAt, now)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Every</dt>
                    <dd className="mt-0.5">
                      {formatInterval(monitor.intervalSeconds)}
                    </dd>
                  </div>
                </dl>

                {monitor.openIncidentSince ? (
                  <p className="mt-4 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
                    Down since {formatRelative(monitor.openIncidentSince, now)}
                    {monitor.lastCheck?.error
                      ? ` — ${monitor.lastCheck.error}`
                      : ""}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
