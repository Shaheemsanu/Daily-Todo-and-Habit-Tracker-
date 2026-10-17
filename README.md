# Daymark — Daily Todo & Habit Tracker

A responsive React + TypeScript + Vite app for recurring tasks, daily habit tracking, water and sleep logs, notes, history, analytics, CSV exports, and JSON backup/restore. Supabase provides authentication and user-isolated PostgreSQL storage.

## Features

- Email/password sign-up and sign-in through Supabase Auth.
- Recurring tasks with weekday schedules and **independent status for every date**.
- Daily completion, pending and skipped states.
- Custom numeric or yes/no trackers, plus built-in water and sleep logs.
- Daily notes saved per user and date.
- Weekly and monthly analytics, completion trend, task status breakdown and tracker summaries.
- Search and date filters in history.
- CSV export and JSON backup/restore.
- Row Level Security (RLS) policies for every user-owned table.
- Vitest unit tests and GitHub Pages workflow.

## 1. Requirements

- Node.js 20+ and npm
- A Supabase project (free tier is sufficient for development)

## 2. Install and configure

```bash
npm install
cp .env.example .env.local
```

In Supabase Dashboard → Project Settings → API, copy the Project URL and anon/public key into `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_BASE_PATH=/
```

The anon key is designed for browser use when RLS is correctly configured. **Never put a `service_role` key in this app or commit `.env.local`.**

## 3. Create the database

Open Supabase → SQL Editor, paste the complete contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. It creates task templates, daily task entries, custom trackers, tracker entries and daily notes, with RLS enabled.

In Supabase → Authentication → URL Configuration, add your local URL (`http://localhost:5173`) to the allowed redirect URLs. For production, add your GitHub Pages URL too. For a public app, review your email confirmation settings before testing sign-up.

## 4. Run locally

```bash
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

## 5. Test and build

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

## 6. Deploy to GitHub Pages

1. Create a GitHub repository, for example `daily-todo-habit-tracker`.
2. Push this project to the repository's default branch (`main`).
3. In GitHub → Settings → Pages, select **GitHub Actions** as the build/deployment source.
4. In Settings → Secrets and variables → Actions → Variables, add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
5. The included `.github/workflows/deploy.yml` builds and deploys on every push to `main`.
6. Add your GitHub Pages URL to Supabase Auth → URL Configuration → Redirect URLs.

The workflow derives the correct Vite base path from the repository name, so project pages are served from `/<repo-name>/`. For a user/organization repository named `<username>.github.io`, the base path is `/`.

> GitHub Pages hosts the static frontend only. Supabase remains the cloud authentication and database service.

## Data model and daily independence

`tasks` stores the recurring task definition (title, active state and weekday schedule). `task_entries` stores one row per task and calendar date. The unique constraint `(user_id, task_id, entry_date)` prevents duplicate daily records. Marking a task complete on Monday does not mark it complete on Tuesday.

## Security notes

- RLS is enabled on all user data tables.
- Policies require `auth.uid() = user_id`.
- The app uses only the public anon key in the browser.
- Do not disable RLS or expose the service role key.
- For production, consider adding rate limits, monitoring, account deletion/export workflows, and a privacy policy.

## Project structure

```text
src/
  app/                  App shell and page navigation
  components/           Reusable UI primitives
  features/
    auth/                Authentication UI and session handling
    dashboard/           Daily dashboard
    tasks/                Recurring task CRUD and daily statuses
    trackers/             Water, sleep and custom trackers
    notes/                Date-specific notes
    history/              Date-filtered history and CSV
    reports/              Weekly/monthly charts and summaries
  lib/                   Supabase client, date helpers, exports
  test/                  Test setup and unit tests
supabase/schema.sql      Tables, indexes and RLS policies
.github/workflows/       GitHub Pages deployment
```

## Current scope

This is a complete starter app with real Supabase persistence and a useful end-to-end core. It intentionally keeps the UI dependency-light. It is not a medical device, and habit statistics are informational only.
