import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const HISTORY_DAYS = 30;
const CHECK_EVERY_MS = 30 * MINUTE_MS;

/// Fake outages, placed far enough apart that the 30-day chart shows a few bad
/// days and the 24h window stays clean.
const OUTAGES = [
  { startHoursAgo: 23 * 24 + 5, minutes: 180, cause: "HTTP 503", statusCode: 503 },
  { startHoursAgo: 8 * 24 + 2, minutes: 45, cause: "request timed out", statusCode: null },
  { startHoursAgo: 26, minutes: 90, cause: "HTTP 503", statusCode: 503 },
];

function outageAt(timestamp: number, now: number) {
  return OUTAGES.find((outage) => {
    const start = now - outage.startHoursAgo * HOUR_MS;
    return timestamp >= start && timestamp < start + outage.minutes * MINUTE_MS;
  });
}

/// Deterministic wobble so reseeding produces the same response times.
function responseTime(timestamp: number): number {
  return 70 + (Math.floor(timestamp / MINUTE_MS) % 45);
}

async function main() {
  // Published, so /status/api-example-com has something to render.
  const monitor = await prisma.monitor.upsert({
    where: { url: "https://api.example.com/health" },
    update: { isPublic: true },
    create: {
      name: "api.example.com",
      slug: "api-example-com",
      url: "https://api.example.com/health",
      intervalSeconds: 60,
      timeoutMs: 5000,
      isPublic: true,
    },
  });

  await prisma.monitor.upsert({
    where: { url: "https://example.com" },
    update: {},
    create: {
      name: "example.com",
      slug: "example-com",
      url: "https://example.com",
      intervalSeconds: 60,
      timeoutMs: 5000,
    },
  });

  await prisma.check.deleteMany({ where: { monitorId: monitor.id } });
  await prisma.incident.deleteMany({ where: { monitorId: monitor.id } });

  const now = Date.now();

  const checks: {
    monitorId: string;
    ok: boolean;
    statusCode: number | null;
    responseTimeMs: number | null;
    error: string | null;
    checkedAt: Date;
  }[] = [];

  const incidents: {
    monitorId: string;
    openedAt: Date;
    resolvedAt: Date | null;
    cause: string;
  }[] = [];

  let open: (typeof incidents)[number] | null = null;

  for (
    let timestamp = now - HISTORY_DAYS * DAY_MS;
    timestamp <= now;
    timestamp += CHECK_EVERY_MS
  ) {
    const checkedAt = new Date(timestamp);
    const outage = outageAt(timestamp, now);

    if (outage) {
      checks.push({
        monitorId: monitor.id,
        ok: false,
        statusCode: outage.statusCode,
        responseTimeMs: null,
        error: outage.cause,
        checkedAt,
      });

      if (!open) {
        open = {
          monitorId: monitor.id,
          openedAt: checkedAt,
          resolvedAt: null,
          cause: outage.cause,
        };
        incidents.push(open);
      }

      continue;
    }

    checks.push({
      monitorId: monitor.id,
      ok: true,
      statusCode: 200,
      responseTimeMs: responseTime(timestamp),
      error: null,
      checkedAt,
    });

    if (open) {
      open.resolvedAt = checkedAt;
      open = null;
    }
  }

  await prisma.check.createMany({ data: checks });
  await prisma.incident.createMany({ data: incidents });

  console.log(
    `Seeded ${checks.length} checks and ${incidents.length} incidents for ${monitor.name}.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
