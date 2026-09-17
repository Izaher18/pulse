import { prisma } from "@/lib/prisma";

export type MonitorInput = {
  name: string;
  url: string;
  intervalSeconds: number;
  timeoutMs: number;
};

export type MonitorSummary = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  intervalSeconds: number;
  timeoutMs: number;
  lastCheck: {
    ok: boolean;
    statusCode: number | null;
    responseTimeMs: number | null;
    error: string | null;
    checkedAt: Date;
  } | null;
  openIncidentSince: Date | null;
  uptime24h: number | null;
  checkCount24h: number;
};

const MIN_INTERVAL_SECONDS = 30;
const MAX_INTERVAL_SECONDS = 86_400;
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 60_000;

export function parseMonitorInput(form: FormData):
  | { ok: true; value: MonitorInput }
  | { ok: false; error: string } {
  const name = String(form.get("name") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const intervalSeconds = Number(form.get("intervalSeconds") ?? 60);
  const timeoutMs = Number(form.get("timeoutMs") ?? 10_000);

  if (!name) {
    return { ok: false, error: "Name is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "Enter a full URL, like https://example.com." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "URL must start with http:// or https://." };
  }

  if (
    !Number.isFinite(intervalSeconds) ||
    intervalSeconds < MIN_INTERVAL_SECONDS ||
    intervalSeconds > MAX_INTERVAL_SECONDS
  ) {
    return {
      ok: false,
      error: `Interval must be between ${MIN_INTERVAL_SECONDS} and ${MAX_INTERVAL_SECONDS} seconds.`,
    };
  }

  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs < MIN_TIMEOUT_MS ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    return {
      ok: false,
      error: `Timeout must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS} ms.`,
    };
  }

  return {
    ok: true,
    value: {
      name,
      url: parsed.toString(),
      intervalSeconds: Math.round(intervalSeconds),
      timeoutMs: Math.round(timeoutMs),
    },
  };
}

export async function listMonitorSummaries(
  now = new Date(),
): Promise<MonitorSummary[]> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
      },
      incidents: {
        where: { resolvedAt: null },
        orderBy: { openedAt: "desc" },
        take: 1,
      },
    },
  });

  return Promise.all(
    monitors.map(async (monitor) => {
      const [total, ok] = await Promise.all([
        prisma.check.count({
          where: { monitorId: monitor.id, checkedAt: { gte: since } },
        }),
        prisma.check.count({
          where: { monitorId: monitor.id, ok: true, checkedAt: { gte: since } },
        }),
      ]);

      const lastCheck = monitor.checks[0];

      return {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        enabled: monitor.enabled,
        intervalSeconds: monitor.intervalSeconds,
        timeoutMs: monitor.timeoutMs,
        lastCheck: lastCheck
          ? {
              ok: lastCheck.ok,
              statusCode: lastCheck.statusCode,
              responseTimeMs: lastCheck.responseTimeMs,
              error: lastCheck.error,
              checkedAt: lastCheck.checkedAt,
            }
          : null,
        openIncidentSince: monitor.incidents[0]?.openedAt ?? null,
        uptime24h: total === 0 ? null : (ok / total) * 100,
        checkCount24h: total,
      };
    }),
  );
}

export async function getMonitorDetail(id: string) {
  return prisma.monitor.findUnique({
    where: { id },
    include: {
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 40,
      },
      incidents: {
        orderBy: { openedAt: "desc" },
        take: 10,
      },
    },
  });
}
