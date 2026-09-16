import { prisma } from "@/lib/prisma";
import { pingUrl, type PingResult } from "@/lib/ping";

export type CheckRunSummary = {
  due: number;
  ran: number;
  ok: number;
  failed: number;
};

const CHECK_CONCURRENCY = 5;

function isDue(
  intervalSeconds: number,
  lastCheckedAt: Date | undefined,
  now: Date,
): boolean {
  if (!lastCheckedAt) {
    return true;
  }

  return now.getTime() - lastCheckedAt.getTime() >= intervalSeconds * 1000;
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function recordCheck(
  monitorId: string,
  result: PingResult,
  checkedAt = new Date(),
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.check.create({
      data: {
        monitorId,
        ok: result.ok,
        statusCode: result.statusCode,
        responseTimeMs: result.responseTimeMs,
        error: result.error,
        checkedAt,
      },
    });

    if (result.ok) {
      await tx.incident.updateMany({
        where: { monitorId, resolvedAt: null },
        data: { resolvedAt: checkedAt },
      });
      return;
    }

    const open = await tx.incident.findFirst({
      where: { monitorId, resolvedAt: null },
    });

    if (!open) {
      await tx.incident.create({
        data: {
          monitorId,
          openedAt: checkedAt,
          cause: result.error ?? `HTTP ${result.statusCode}`,
        },
      });
    }
  });
}

export async function runDueChecks(now = new Date()): Promise<CheckRunSummary> {
  const monitors = await prisma.monitor.findMany({
    where: { enabled: true },
    include: {
      checks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
        select: { checkedAt: true },
      },
    },
  });

  const due = monitors.filter((monitor) =>
    isDue(monitor.intervalSeconds, monitor.checks[0]?.checkedAt, now),
  );

  const results = await mapPool(due, CHECK_CONCURRENCY, async (monitor) => {
    const result = await pingUrl(monitor.url, monitor.timeoutMs);
    await recordCheck(monitor.id, result, new Date());
    return result;
  });

  return {
    due: due.length,
    ran: results.length,
    ok: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
  };
}
