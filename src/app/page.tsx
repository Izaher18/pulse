import Link from "next/link";

const features = [
  {
    title: "Scheduled checks",
    body: "Every monitor is polled on its own interval with per-request timeouts, so a slow endpoint never blocks the rest of the queue.",
  },
  {
    title: "Incident history",
    body: "Each check is recorded with its status code and response time, which is what turns raw pings into uptime percentages.",
  },
  {
    title: "Public status pages",
    body: "Share a read-only page for your users. No account required to view it, and nothing internal leaks.",
  },
];

// Placeholder shape for the landing preview. Real check data lands in a later milestone.
const previewBars = [
  99.9, 99.8, 100, 100, 99.4, 100, 100, 98.2, 100, 100, 99.9, 100, 100, 100,
  99.7, 100, 100, 100, 99.9, 100, 100, 96.5, 100, 100, 100, 99.8, 100, 100,
  100, 100,
];

function barTone(uptime: number) {
  if (uptime >= 99.5) return "bg-emerald-500";
  if (uptime >= 98) return "bg-amber-400";
  return "bg-rose-500";
}

// Spread the 95-100% range across the full bar so small dips stay visible.
function barHeight(uptime: number) {
  const scaled = ((uptime - 95) / 5) * 100;
  return Math.min(100, Math.max(20, scaled));
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Pulse
        </span>
        <nav className="flex items-center gap-6 text-sm text-zinc-400">
          <a className="transition-colors hover:text-zinc-100" href="#preview">
            Preview
          </a>
          <Link className="transition-colors hover:text-zinc-100" href="/dashboard">
            Dashboard
          </Link>
          <a
            className="transition-colors hover:text-zinc-100"
            href="https://github.com/Izaher18"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="pt-16 pb-20 sm:pt-24">
          <p className="text-sm font-medium text-emerald-400">Uptime monitoring</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Know your service is down before your users tell you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
            Pulse polls your endpoints on a schedule, records every response, and
            publishes the results to a status page you can hand to your users.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#preview"
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              See what it looks like
            </a>
            <a
              href="https://github.com/Izaher18"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
            >
              Read the source
            </a>
          </div>
        </section>

        <section
          id="preview"
          className="scroll-mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-medium">api.example.com</h2>
            <span className="text-sm text-zinc-500">last 30 days</span>
          </div>
          <div className="mt-4 flex h-12 items-end gap-1">
            {previewBars.map((uptime, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${barTone(uptime)}`}
                style={{ height: `${barHeight(uptime)}%` }}
                title={`${uptime}% uptime`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Sample rendering. Live check data arrives with the monitoring engine.
          </p>
        </section>

        <section className="grid gap-6 py-20 sm:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-zinc-500">
          Built by{" "}
          <a
            className="text-zinc-300 transition-colors hover:text-zinc-100"
            href="https://github.com/Izaher18"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ilias Zaher
          </a>
        </div>
      </footer>
    </div>
  );
}
