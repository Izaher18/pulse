import {
  fillDays,
  percent,
  startOfUtcDay,
  type DayCount,
  type DayUptime,
} from "@/lib/days";
import { prisma } from "@/lib/prisma";

export type PublicIncident = {
  id: string;
  openedAt: Date;
  resolvedAt: Date | null;
};

export type PublicState = "up" | "down" | "paused" | "unknown";

/// What a stranger is allowed to see. No URL, no status codes, and no error
/// text: those describe internal infrastructure. Only "was it reachable".
export type PublicStatus = {
  name: string;
  slug: string;
  state: PublicState;
  lastCheckedAt: Date | null;
  responseTimeMs: number | null;
  uptime24h: number | null;
  uptime7d: number | null;
  uptime30d: number | null;
  days: DayUptime[];
  incidents: PublicIncident[];
};

export type PublicMonitorCard = {
  name: string;
  slug: string;
  state: PublicState;
  uptime30d: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

type WindowCounts = {
  total24h: number;
  ok24h: number;
  total7d: number;
  ok7d: number;
  total30d: number;
  ok30d: number;
};

function stateOf(
  enabled: boolean,
  lastCheckOk: boolean | undefined,
): PublicState {
  if (!enabled) return "paused";
  if (lastCheckOk === undefined) return "unknown";
  return lastCheckOk ? "up" : "down";
}

export async function getDailyUptime(
  monitorId: string,
  days = WINDOW_DAYS,
  now = new Date(),
): Promise<DayUptime[]> {
  const since = startOfUtcDay(now, days - 1);

  const rows = await prisma.$queryRaw<DayCount[]>`
    SELECT date_trunc('day', "checkedAt") AS day,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE "ok")::int AS ok
    FROM "Check"
    WHERE "monitorId" = ${monitorId}
      AND "checkedAt" >= ${since}
    GROUP BY 1
    ORDER BY 1
  `;

  return fillDays(rows, days, now);
}

/// All three windows come off one index scan of the last 30 days instead of six
/// separate COUNT queries.
async function getWindowCounts(
  monitorId: string,
  now: Date,
): Promise<WindowCounts> {
  const day1 = new Date(now.getTime() - DAY_MS);
  const day7 = new Date(now.getTime() - 7 * DAY_MS);
  const day30 = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);

  const [row] = await prisma.$queryRaw<WindowCounts[]>`
    SELECT
      COUNT(*) FILTER (WHERE "checkedAt" >= ${day1})::int AS "total24h",
      COUNT(*) FILTER (WHERE "checkedAt" >= ${day1} AND "ok")::int AS "ok24h",
      COUNT(*) FILTER (WHERE "checkedAt" >= ${day7})::int AS "total7d",
      COUNT(*) FILTER (WHERE "checkedAt" >= ${day7} AND "ok")::int AS "ok7d",
      COUNT(*)::int AS "total30d",
      COUNT(*) FILTER (WHERE "ok")::int AS "ok30d"
    FROM "Check"
    WHERE "monitorId" = ${monitorId}
      AND "checkedAt" >= ${day30}
  `;

  return row;
}

export async function getPublicStatus(
  slug: string,
  now = new Date(),
): Promise<PublicStatus | null> {
  const monitor = await prisma.monitor.findFirst({
    where: { slug, isPublic: true },
    include: {
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
        select: { ok: true, responseTimeMs: true, checkedAt: true },
      },
      incidents: {
        orderBy: { openedAt: "desc" },
        take: 10,
        select: { id: true, openedAt: true, resolvedAt: true },
      },
    },
  });

  if (!monitor) {
    return null;
  }

  const [windows, days] = await Promise.all([
    getWindowCounts(monitor.id, now),
    getDailyUptime(monitor.id, WINDOW_DAYS, now),
  ]);

  const lastCheck = monitor.checks[0];

  return {
    name: monitor.name,
    slug: monitor.slug,
    state: stateOf(monitor.enabled, lastCheck?.ok),
    lastCheckedAt: lastCheck?.checkedAt ?? null,
    responseTimeMs: lastCheck?.responseTimeMs ?? null,
    uptime24h: percent(windows.ok24h, windows.total24h),
    uptime7d: percent(windows.ok7d, windows.total7d),
    uptime30d: percent(windows.ok30d, windows.total30d),
    days,
    incidents: monitor.incidents,
  };
}

/// Backs the landing page preview, so the marketing copy shows real numbers
/// instead of a hardcoded sample.
export async function getFeaturedStatus(
  now = new Date(),
): Promise<PublicStatus | null> {
  const monitor = await prisma.monitor.findFirst({
    where: { isPublic: true },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });

  return monitor ? getPublicStatus(monitor.slug, now) : null;
}

export async function listPublicMonitors(
  now = new Date(),
): Promise<PublicMonitorCard[]> {
  const monitors = await prisma.monitor.findMany({
    where: { isPublic: true },
    orderBy: { name: "asc" },
    include: {
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
        select: { ok: true },
      },
    },
  });

  return Promise.all(
    monitors.map(async (monitor) => {
      const windows = await getWindowCounts(monitor.id, now);

      return {
        name: monitor.name,
        slug: monitor.slug,
        state: stateOf(monitor.enabled, monitor.checks[0]?.ok),
        uptime30d: percent(windows.ok30d, windows.total30d),
      };
    }),
  );
}
