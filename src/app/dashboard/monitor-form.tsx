"use client";

import { useActionState } from "react";
import { createMonitor, type FormState } from "./actions";

const initialState: FormState = { error: null };

export function MonitorForm() {
  const [state, formAction, pending] = useActionState(
    createMonitor,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <h2 className="font-medium">Add a monitor</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Pulse polls the URL on its own interval and records every response.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-zinc-300">Name</span>
          <input
            name="name"
            required
            maxLength={80}
            placeholder="api.example.com"
            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500"
          />
        </label>

        <label className="text-sm">
          <span className="text-zinc-300">URL</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://api.example.com/health"
            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-emerald-500"
          />
        </label>

        <label className="text-sm">
          <span className="text-zinc-300">Interval (seconds)</span>
          <input
            name="intervalSeconds"
            type="number"
            min={30}
            max={86400}
            defaultValue={60}
            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>

        <label className="text-sm">
          <span className="text-zinc-300">Timeout (ms)</span>
          <input
            name="timeoutMs"
            type="number"
            min={1000}
            max={60000}
            step={500}
            defaultValue={10000}
            className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-rose-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add monitor"}
      </button>
    </form>
  );
}
