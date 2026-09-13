# Pulse

Uptime monitoring with public status pages. Pulse polls your endpoints on a
schedule, records the status code and response time of every check, and turns
that history into uptime percentages you can publish.

> **Status:** in progress. The landing page, scaffold, and data model are done;
> the monitoring engine is next. See the roadmap below for what is and is not built.

## Why I built it

I wanted a project that exercises the parts of web development that are easy to
skip in coursework: a background job that runs on a schedule, a data model that
has to answer aggregate questions quickly, and a public page that stays fast
while the write path is busy.

## Stack

- **Next.js 16** (App Router) and **React 19**
- **TypeScript** in strict mode
- **Tailwind CSS v4**
- **Postgres** via **Prisma** for monitors, checks, and incidents
- A scheduled checker (coming, see roadmap)

## Running locally

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). The landing
page still uses placeholder preview data; live numbers wait on the checker.

`npx prisma studio` opens a table browser for monitors, checks, and incidents.

## Roadmap

- [x] **Project scaffold** — Next.js, TypeScript, Tailwind, landing page
- [x] **Data model** — monitors, checks, and incidents in Postgres via Prisma
- [ ] **Check engine** — scheduled HTTP polling with timeouts and retries
- [ ] **Dashboard** — authenticated CRUD for monitors
- [ ] **Status pages** — public, read-only uptime pages per project
- [ ] **CI and deploy** — GitHub Actions test run, deployed to Vercel

## License

MIT
