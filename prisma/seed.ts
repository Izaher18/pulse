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

const HOUR_MS = 60 * 60 * 1000;

async function main() {
  const monitor = await prisma.monitor.upsert({
    where: { url: "https://api.example.com/health" },
    update: {},
    create: {
      name: "api.example.com",
      url: "https://api.example.com/health",
      intervalSeconds: 60,
      timeoutMs: 5000,
    },
  });

  await prisma.check.deleteMany({ where: { monitorId: monitor.id } });
  await prisma.incident.deleteMany({ where: { monitorId: monitor.id } });

  const now = Date.now();
  const results = [
    ...Array.from({ length: 18 }, () => ({ ok: true, statusCode: 200 as number | null, error: null as string | null })),
    { ok: false, statusCode: 503, error: "Service Unavailable" },
    { ok: false, statusCode: 503, error: "Service Unavailable" },
    { ok: false, statusCode: null, error: "request timed out" },
    ...Array.from({ length: 9 }, () => ({ ok: true, statusCode: 200 as number | null, error: null as string | null })),
  ];

  let openIncidentId: string | null = null;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const checkedAt = new Date(now - (results.length - 1 - i) * HOUR_MS);

    await prisma.check.create({
      data: {
        monitorId: monitor.id,
        ok: result.ok,
        statusCode: result.statusCode,
        responseTimeMs: result.ok ? 80 + (i % 40) : null,
        error: result.error,
        checkedAt,
      },
    });

    if (!result.ok && !openIncidentId) {
      const incident = await prisma.incident.create({
        data: {
          monitorId: monitor.id,
          openedAt: checkedAt,
          cause: result.error ?? `HTTP ${result.statusCode}`,
        },
      });
      openIncidentId = incident.id;
    }

    if (result.ok && openIncidentId) {
      await prisma.incident.update({
        where: { id: openIncidentId },
        data: { resolvedAt: checkedAt },
      });
      openIncidentId = null;
    }
  }
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
