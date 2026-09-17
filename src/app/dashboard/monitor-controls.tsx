"use client";

import { useState, useTransition } from "react";
import {
  checkMonitorNow,
  deleteMonitor,
  toggleMonitor,
  toggleVisibility,
} from "./actions";

const buttonClass =
  "rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 disabled:opacity-50";

type Action = "check" | "toggle" | "publish" | "delete";

export function MonitorControls({
  monitorId,
  enabled,
  isPublic,
  showDelete = false,
}: {
  monitorId: string;
  enabled: boolean;
  isPublic: boolean;
  showDelete?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  // useTransition only says "something is running", so the clicked button is
  // tracked separately to keep the spinner on the button the user pressed.
  const [running, setRunning] = useState<Action | null>(null);

  function run(action: Action, work: () => Promise<void>) {
    setRunning(action);
    startTransition(async () => {
      await work();
      setRunning(null);
    });
  }

  function label(action: Action, idle: string, busy = "Working…") {
    return pending && running === action ? busy : idle;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run("check", () => checkMonitorNow(monitorId))}
        className={buttonClass}
      >
        {label("check", "Check now", "Checking…")}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => run("toggle", () => toggleMonitor(monitorId))}
        className={buttonClass}
      >
        {label("toggle", enabled ? "Pause" : "Resume")}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            isPublic ||
            window.confirm(
              "Publish a status page for this monitor? Anyone with the link will see its uptime and outage history.",
            )
          ) {
            run("publish", () => toggleVisibility(monitorId));
          }
        }}
        className={buttonClass}
      >
        {label("publish", isPublic ? "Unpublish" : "Publish")}
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
              run("delete", () => deleteMonitor(monitorId));
            }
          }}
          className="rounded-lg border border-rose-900/60 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:border-rose-800 hover:text-rose-300 disabled:opacity-50"
        >
          {label("delete", "Delete", "Deleting…")}
        </button>
      ) : null}
    </div>
  );
}
