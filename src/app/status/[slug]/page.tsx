import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UptimeBars } from "@/components/uptime-bars";
import {
  formatDuration,
  formatMs,
  formatUptime,
  formatUtc,
} from "@/lib/format";
import {
  getPublicStatus,
  listPublicSlugs,
  type PublicStatus,
} from "@/lib/status";

// Anyone can hit this page, and the checker is writing to the same tables, so
// serve a cached render and rebuild it once a minute.
export const revalidate = 60;

// Without this the route is rendered from scratch on every request: `revalidate`
// alone does not cache a dynamic segment. Naming the published slugs up front
// gets them prerendered and served from the cache instead.
export async function generateStaticParams() {
  try {
    const slugs = await listPublicSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // No database during the build; every page just renders on demand.
    return [];
  }
}

// The metadata and the page both need the same row; cache() collapses that into
// one set of queries per render.
const loadStatus = cache((slug: string) => getPublicStatus(slug));

const STATES = {
  up: {
    headline: "All systems operational",
    dot: "bg-emerald-500",
    tone: "text-emerald-400",
  },
  down: {
    headline: "Service disruption",
    dot: "bg-rose-500",
    tone: "text-rose-400",
  },
  paused: {
    headline: "Monitoring paused",
    dot: "bg-zinc-500",
    tone: "text-zinc-400",
  },
  unknown: {
    headline: "Waiting for the first check",
    dot: "bg-zinc-500",
    tone: "text-zinc-400",
  },
} satisfies Record<PublicStatus["state"], unknown>;

export async function generateMetadata({
  params,
}: PageProps<"/status/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const status = await loadStatus(slug);

  if (!status) {
    return { title: "Status page not found" };
  }

  return {
    title: `${status.name} status`,
    description: `Uptime and incident history for ${status.name}.`,
  };
}

export default async function StatusPage({
  params,
}: PageProps<"/status/[slug]">) {
  const { slug } = await params;
  const status = await loadStatus(slug);

  if (!status) {
    notFound();
  }

  const state = STATES[status.state];
  const now = new Date();

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <h1 className="text-2xl font-semibold tracking-tight">{status.name}</h1>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block h-3 w-3 shrink-0 rounded-full ${state.dot}`}
            />
            <p className={`font-medium ${state.tone}`}>{state.headline}</p>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            {status.lastCheckedAt
              ? `Last checked ${formatUtc(status.lastCheckedAt)}`
              : "No checks recorded yet."}
            {status.responseTimeMs !== null
              ? ` · responded in ${formatMs(status.responseTimeMs)}`
              : ""}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "24 hours", value: status.uptime24h },
            { label: "7 days", value: status.uptime7d },
            { label: "30 days", value: status.uptime30d },
          ].map((window) => (
            <div
              key={window.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <dt className="text-xs text-zinc-500">{window.label}</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight">
                {formatUptime(window.value)}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-medium">Daily uptime</h2>
            <span className="text-sm text-zinc-500">last 30 days</span>
          </div>
          <div className="mt-4">
            <UptimeBars days={status.days} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-medium">Past incidents</h2>
          {status.incidents.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
              No downtime recorded in this monitor&rsquo;s history.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-800/70 overflow-hidden rounded-xl border border-zinc-800">
              {status.incidents.map((incident) => {
                const ongoing = incident.resolvedAt === null;
                const endedAt = incident.resolvedAt ?? now;

                return (
                  <li key={incident.id} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span
                        className={ongoing ? "text-rose-400" : "text-zinc-300"}
                      >
                        {ongoing ? "Ongoing outage" : "Resolved outage"}
                      </span>
                      <span className="text-zinc-500">
                        {formatDuration(
                          endedAt.getTime() - incident.openedAt.getTime(),
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-zinc-500">
                      Started {formatUtc(incident.openedAt)}
                      {incident.resolvedAt
                        ? ` · recovered ${formatUtc(incident.resolvedAt)}`
                        : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-6 py-6 text-sm text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Monitored by Pulse · updates every minute
        </div>
      </footer>
    </div>
  );
}
