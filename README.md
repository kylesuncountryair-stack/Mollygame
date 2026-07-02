# Bonfire

A game where players answer daily and weekly trivia questions to earn **Logs**, building the biggest **Bonfire** each month. Includes a leaderboard, work-email login, and a full admin portal for managing questions and players.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- Custom lightweight auth (scrypt password hashing + signed session cookie) — no external auth service required

## How the game works

- **Logs** are the point currency. Players earn logs by answering the live daily/weekly question correctly, or by admin-issued grants.
- **Bonfire** size = total logs earned in the current calendar month. It resets automatically every month (no cron job needed — it's just calculated from log timestamps) and moves a player through tiers: Spark → Kindling → Flame → Bonfire → Blaze → Wildfire.
- All-time logs are also tracked and shown on profiles/leaderboard for context.
- Admins create questions with a type (Daily or Weekly), multiple-choice options, the correct answer, the log reward, and which day/week it's active.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (any Postgres instance — see "Database" below) and generate a value for `AUTH_SECRET`:
   ```bash
   cp .env.example .env
   openssl rand -base64 48   # paste the output into AUTH_SECRET
   ```
3. Push the schema to your database:
   ```bash
   npx prisma db push
   ```
4. (Optional) Seed a bootstrap admin account and two sample questions:
   ```bash
   npm run seed
   ```
5. Run the app:
   ```bash
   npm run dev
   ```

## Database

You need a Postgres database reachable from wherever the app runs. Any of these free options work well and take a couple of minutes:

- [Neon](https://neon.tech) (recommended — serverless Postgres, generous free tier, works great with Vercel)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (managed directly in the Vercel dashboard)
- [Supabase](https://supabase.com)

Copy the connection string it gives you into `DATABASE_URL` (make sure `sslmode=require` is included).

## Deploying: GitHub + Vercel

1. Push this project to a GitHub repository.
2. In [Vercel](https://vercel.com), click **New Project** and import that repo.
3. Under **Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — a long random string (`openssl rand -base64 48`)
   - `ADMIN_EMAIL` — the work email that should automatically become an admin account (see below)
   - `ALLOWED_EMAIL_DOMAIN` — optional, e.g. `yourcompany.com`, to restrict who can sign up
4. Deploy. The build command (`prisma generate && prisma db push --accept-data-loss && next build`) automatically creates all the database tables on first deploy — you don't need to run migrations by hand.
5. Once deployed, go to the site and **sign up** using the email you set as `ADMIN_EMAIL`. That account is automatically granted admin rights and can access `/admin`. Everyone else who signs up gets a regular player account.

Every subsequent `git push` to your connected branch redeploys automatically.

## Creating an admin account

You don't need to touch the database directly. Set `ADMIN_EMAIL` in your environment variables *before* that person signs up — the signup flow checks the email against `ADMIN_EMAIL` and grants the `ADMIN` role automatically. You can promote additional admins later by editing the `role` column directly in your database provider's dashboard (Neon/Supabase both have a table editor), setting it to `ADMIN`.

## Project structure

```
prisma/schema.prisma        Database models (User, Question, Answer, LogTransaction)
prisma/seed.ts              Optional bootstrap script (admin user + sample questions)
src/lib/                    Auth, session, password hashing, bonfire tier logic
src/middleware.ts           Route protection (players vs admins)
src/app/(player pages)      Dashboard, leaderboard, profile
src/app/admin/              Admin portal (questions, players, overview)
src/app/api/                All backend routes
src/components/             Shared UI (Bonfire flame visual, question cards, tables, forms)
```

## Notes on the data model

- `Question` — one row per daily or weekly question, with the `activeDate` deciding which day/week it's shown on.
- `Answer` — one row per (player, question) pair, recording their choice and whether it was correct. This is what powers the "questions answered / right / wrong" breakdown in the admin portal.
- `LogTransaction` — the single ledger for every log gained or lost: correct answers, manual admin grants, and manual admin adjustments. A player's total is just the sum of their transactions; their current Bonfire size is the sum within the current month.
