# Pulse

[![CI](https://github.com/Izaher18/pulse/actions/workflows/ci.yml/badge.svg)](https://github.com/Izaher18/pulse/actions/workflows/ci.yml)

Uptime monitoring with public status pages. Pulse polls your endpoints on a
schedule, records the status code and response time of every check, and turns
that history into uptime percentages you can publish.

> **Status:** in progress. The data model, check engine, dashboard, public
> status pages, and CI are done; deployment is next. See the roadmap below.

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
- A scheduled HTTP checker with per-request timeouts and retries
- A password-protected dashboard built on Server Actions
- Cached public status pages served straight from the check history

## Running locally

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). The seed
publishes one demo monitor, so `/status/api-example-com` has a month of history
to render.

## Dashboard

`/dashboard` lists every monitor with its 24h uptime, last response time, and
any open incident, and it refreshes every 10 seconds. From there you can add a
monitor, pause or resume it, force a check, publish its status page, or open a
monitor to see its recent check history and incidents.

It sits behind a single password. Set `DASHBOARD_PASSWORD` and a random
`SESSION_SECRET` in `.env`, then sign in at `/login`:

```bash
openssl rand -hex 32   # value for SESSION_SECRET
```

The session is an HMAC-signed, httpOnly cookie that expires after 12 hours.

## Running checks

Run one round of due checks, or keep a worker watching:

```bash
npm run check
npm run check:watch
```

Each monitor is pinged on its own interval. Timeouts abort a slow request;
5xx and network failures retry twice before the check is recorded. A failed
check opens an incident; the next success closes it.

`GET /api/cron/checks` does the same tick for a host cron or Vercel. Send
`Authorization: Bearer $CRON_SECRET` or the route returns 401.

`npx prisma studio` opens a table browser for monitors, checks, and incidents.

## Deploying

The app is a standard Next.js deploy; the interesting part is the scheduler.

Set these environment variables on the host, pointing `DATABASE_URL` at hosted
Postgres, then apply migrations with `npx prisma migrate deploy`:

```
DATABASE_URL
CRON_SECRET
DASHBOARD_PASSWORD
SESSION_SECRET
```

Scheduling is awkward on Vercel's free plan, which rejects any cron that runs
more than once a day — `* * * * *` fails at deploy time. `vercel.json` therefore
keeps a once-daily run as a backstop, and the real schedule lives in
`.github/workflows/check.yml`, which calls `/api/cron/checks` on the deployed
app every five minutes. Actions minutes are free on public repositories.

That workflow needs two settings on the repository: a `PULSE_URL` variable
holding the deployed origin, and a `CRON_SECRET` secret matching the deployed
one. Until `PULSE_URL` is set the workflow does nothing. Two caveats: scheduled
runs can be delayed when GitHub is busy, and GitHub disables scheduled
workflows after 60 days without repository activity. On a Vercel plan that
allows minutely crons, change `vercel.json` to `* * * * *` and delete the
workflow.

Whatever the scheduler's cadence is becomes the real resolution of every
monitor: a monitor set to 60 seconds is still only polled when a tick happens.

## CI

`.github/workflows/ci.yml` runs on every push and pull request against a
Postgres service container: migrations, lint, typecheck, tests, and a
production build. It also diffs the migrated database against
`schema.prisma`, which fails the build if the schema was edited without a
matching migration.

## Status pages

Every monitor is private until you press **Publish** in the dashboard, which
opens `/status/<slug>` to anyone with the link. `/status` lists whatever is
currently published.

A status page shows the current state, uptime over 24 hours, 7 days, and 30
days, a bar per day for the last month, and the outage windows behind those
numbers. It deliberately leaves out the URL being polled, status codes, and
error text, since those describe internal infrastructure rather than whether
the service was reachable.

Published pages are prerendered and served from a 60-second cache, so a burst
of readers costs one set of queries rather than one per visitor. Publishing,
pausing, or forcing a check clears that cache immediately. A `revalidate`
export alone is not enough for a route with a dynamic segment — the published
slugs are also listed in `generateStaticParams`, without which every request
re-renders from the database. A monitor published after the last build renders
on demand until the next one.

Daily bars and the three uptime windows are aggregated in Postgres — a
`date_trunc` group-by for the bars and one filtered-count query for all three
windows — rather than by loading a month of checks into the app.

## Roadmap

- [x] **Project scaffold** — Next.js, TypeScript, Tailwind, landing page
- [x] **Data model** — monitors, checks, and incidents in Postgres via Prisma
- [x] **Check engine** — scheduled HTTP polling with timeouts and retries
- [x] **Dashboard** — authenticated CRUD for monitors
- [x] **Status pages** — public, read-only uptime pages per monitor
- [ ] **CI and deploy** — GitHub Actions test run, deployed to Vercel

## License

MIT
