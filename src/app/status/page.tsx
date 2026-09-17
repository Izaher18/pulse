import type { Metadata } from "next";
import Link from "next/link";
import { formatUptime } from "@/lib/format";
import { listPublicMonitors, type PublicMonitorCard } from "@/lib/status";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Status pages",
  description: "Published uptime pages.",
};

function dot(state: PublicMonitorCard["state"]): string {
  if (state === "up") return "bg-emerald-500";
  if (state === "down") return "bg-rose-500";
  return "bg-zinc-500";
}

export default async function StatusIndexPage() {
  const monitors = await listPublicMonitors();

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Status pages</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Every service published from this Pulse instance.
        </p>

        {monitors.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
            Nothing is published yet. Monitors stay private until someone
            publishes them from the dashboard.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {monitors.map((monitor) => (
              <li key={monitor.slug}>
                <Link
                  href={`/status/${monitor.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dot(monitor.state)}`}
                    />
                    <span className="truncate font-medium">{monitor.name}</span>
                  </span>
                  <span className="shrink-0 text-sm text-zinc-400">
                    {formatUptime(monitor.uptime30d)}{" "}
                    <span className="text-zinc-600">30d</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
