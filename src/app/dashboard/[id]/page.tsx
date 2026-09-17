import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  formatInterval,
  formatMs,
  formatRelative,
  formatUptime,
} from "@/lib/format";
import { getMonitorDetail } from "@/lib/monitors";
import { getUptimePercent } from "@/lib/uptime";
import { MonitorControls } from "../monitor-controls";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function MonitorPage({
  params,
}: PageProps<"/dashboard/[id]">) {
  const { id } = await params;
  const monitor = await getMonitorDetail(id);

  if (!monitor) {
    notFound();
  }

  const now = new Date();
  const [uptime24h, uptime7d] = await Promise.all([
    getUptimePercent(monitor.id, new Date(now.getTime() - DAY_MS)),
    getUptimePercent(monitor.id, new Date(now.getTime() - 7 * DAY_MS)),
  ]);

  const last = monitor.checks[0];
  const openIncident = monitor.incidents.find(
    (incident) => incident.resolvedAt === null,
  );

  return (
    <div className="space-y-8">
      <AutoRefresh seconds={10} />

      <div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← All monitors
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {monitor.name}
            </h1>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-sm text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {monitor.url}
              </a>
              <p className="mt-1 truncate text-sm">
                {monitor.isPublic ? (
                  <Link
                    href={`/status/${monitor.slug}`}
                    className="text-emerald-500/90 transition-colors hover:text-emerald-400"
                  >
                    Public page: /status/{monitor.slug}
                  </Link>
                ) : (
                  <span className="text-zinc-600">
                    Private · publish to open /status/{monitor.slug}
                  </span>
                )}
              </p>
            </div>
            <MonitorControls
              monitorId={monitor.id}
              enabled={monitor.enabled}
              isPublic={monitor.isPublic}
              showDelete
            />
        </div>
      </div>

      {openIncident ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          Down since {formatRelative(openIncident.openedAt, now)}
          {openIncident.cause ? ` — ${openIncident.cause}` : ""}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Uptime 24h", value: formatUptime(uptime24h) },
          { label: "Uptime 7d", value: formatUptime(uptime7d) },
          {
            label: "Last response",
            value: last ? formatMs(last.responseTimeMs) : "—",
          },
          {
            label: "Checked every",
            value: `${formatInterval(monitor.intervalSeconds)} · ${monitor.timeoutMs} ms timeout`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <dt className="text-sm text-zinc-500">{stat.label}</dt>
            <dd className="mt-1 text-sm font-medium">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="font-medium">Recent checks</h2>
        {monitor.checks.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
            No checks recorded yet. Use “Check now”, or run{" "}
            <code>npm run check:watch</code>.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/70 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Response</th>
                </tr>
              </thead>
              <tbody>
                {monitor.checks.map((check) => (
                  <tr key={check.id} className="border-t border-zinc-800/70">
                    <td className="px-4 py-2 text-zinc-400">
                      {formatRelative(check.checkedAt, now)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={check.ok ? "text-emerald-400" : "text-rose-400"}
                      >
                        {check.ok ? "Up" : (check.error ?? "Down")}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-400">
                      {check.statusCode ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-400">
                      {formatMs(check.responseTimeMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium">Incidents</h2>
        {monitor.incidents.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No downtime recorded for this monitor.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {monitor.incidents.map((incident) => (
              <li
                key={incident.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <span
                  className={
                    incident.resolvedAt ? "text-zinc-300" : "text-rose-400"
                  }
                >
                  {incident.resolvedAt ? "Resolved" : "Ongoing"}
                </span>
                <span className="text-zinc-500">
                  {" "}
                  · opened {formatRelative(incident.openedAt, now)}
                  {incident.resolvedAt
                    ? `, closed ${formatRelative(incident.resolvedAt, now)}`
                    : ""}
                  {incident.cause ? ` · ${incident.cause}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
