"use client";

import { useTransition } from "react";
import { checkMonitorNow, deleteMonitor, toggleMonitor } from "./actions";

const buttonClass =
  "rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:opacity-50";

export function MonitorControls({
  monitorId,
  enabled,
  showDelete = false,
}: {
  monitorId: string;
  enabled: boolean;
  showDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => checkMonitorNow(monitorId))}
        className={buttonClass}
      >
        {pending ? "Working…" : "Check now"}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleMonitor(monitorId))}
        className={buttonClass}
      >
        {enabled ? "Pause" : "Resume"}
      </button>

      {showDelete ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              window.confirm(
                "Delete this monitor? Its checks and incidents go too.",
              )
            ) {
              startTransition(() => deleteMonitor(monitorId));
            }
          }}
          className="rounded-lg border border-rose-900/60 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:border-rose-800 hover:text-rose-300 disabled:opacity-50"
        >
          Delete
        </button>
      ) : null}
    </div>
  );
}
