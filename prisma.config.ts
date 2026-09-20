import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This file is loaded for every prisma command, and env() throws on a missing
// variable, so requiring DATABASE_URL here made `prisma generate` fail without
// one — which breaks hosts that generate the client during install. Generating
// a client needs no database, so only wire the datasource when the URL exists.
// Commands that do need it (migrate, db seed) still fail loudly without it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(process.env.DATABASE_URL
    ? { datasource: { url: env("DATABASE_URL") } }
    : {}),
});
