import Link from "next/link";

// An unpublished monitor and a made-up slug land here the same way, so this
// page cannot be used to probe which monitors exist.
export default function StatusNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
      <div>
        <p className="text-sm font-medium text-emerald-400">404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          No public status page here
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          This address does not match a published monitor.
        </p>
        <Link
          href="/status"
          className="mt-6 inline-block rounded-lg border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
        >
          See all status pages
        </Link>
      </div>
    </div>
  );
}
