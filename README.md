# Pulse

Uptime monitoring with public status pages. Pulse polls your endpoints on a
schedule, records the status code and response time of every check, and turns
that history into uptime percentages you can publish.

> **Status:** in progress. The landing page and project scaffold are done; the
> monitoring engine is next. See the roadmap below for what is and is not built.

## Why I built it

I wanted a project that exercises the parts of web development that are easy to
skip in coursework: a background job that runs on a schedule, a data model that
has to answer aggregate questions quickly, and a public page that stays fast
while the write path is busy.

## Stack

- **Next.js 16** (App Router) and **React 19**
- **TypeScript** in strict mode
- **Tailwind CSS v4**
- Postgres via Prisma, and a scheduled checker (both coming, see roadmap)

## Running locally

```bash
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Roadmap

- [x] **Project scaffold** — Next.js, TypeScript, Tailwind, landing page
- [ ] **Data model** — monitors, checks, and incidents in Postgres via Prisma
- [ ] **Check engine** — scheduled HTTP polling with timeouts and retries
- [ ] **Dashboard** — authenticated CRUD for monitors
- [ ] **Status pages** — public, read-only uptime pages per project
- [ ] **CI and deploy** — GitHub Actions test run, deployed to Vercel

## License

MIT
