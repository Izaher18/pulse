import { prisma } from "@/lib/prisma";

export async function getUptimePercent(
  monitorId: string,
  since: Date,
): Promise<number | null> {
  const [total, ok] = await Promise.all([
    prisma.check.count({
      where: { monitorId, checkedAt: { gte: since } },
    }),
    prisma.check.count({
      where: { monitorId, ok: true, checkedAt: { gte: since } },
    }),
  ]);

  if (total === 0) {
    return null;
  }

  return (ok / total) * 100;
}
