-- Daymark schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '',
  schedule_days integer[] not null default array[0,1,2,3,4,5,6],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_schedule_days_valid check (
    schedule_days <@ array[0,1,2,3,4,5,6]::integer[]
  )
);

create table if not exists public.task_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  entry_date date not null,
  status text not null default 'pending' check (status in ('pending','done','skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id, entry_date)
);

create table if not exists public.custom_trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  kind text not null check (kind in ('number','boolean')),
  unit text not null default '',
  target numeric,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.tracker_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracker_id uuid not null references public.custom_trackers(id) on delete cascade,
  entry_date date not null,
  numeric_value numeric,
  boolean_value boolean,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tracker_id, entry_date)
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  water_ml integer not null default 0 check (water_ml >= 0 and water_ml <= 20000),
  sleep_hours numeric not null default 0 check (sleep_hours >= 0 and sleep_hours <= 24),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists tasks_user_active_idx on public.tasks(user_id, active);
create index if not exists task_entries_user_date_idx on public.task_entries(user_id, entry_date desc);
create index if not exists tracker_entries_user_date_idx on public.tracker_entries(user_id, entry_date desc);
create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, entry_date desc);

alter table public.tasks enable row level security;
alter table public.task_entries enable row level security;
alter table public.custom_trackers enable row level security;
alter table public.tracker_entries enable row level security;
alter table public.daily_logs enable row level security;

drop policy if exists "users manage own tasks" on public.tasks;
create policy "users manage own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own task entries" on public.task_entries;
create policy "users manage own task entries" on public.task_entries
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id and exists (
      select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "users manage own trackers" on public.custom_trackers;
create policy "users manage own trackers" on public.custom_trackers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own tracker entries" on public.tracker_entries;
create policy "users manage own tracker entries" on public.tracker_entries
  for all using (auth.uid() = user_id) with check (
    auth.uid() = user_id and exists (
      select 1 from public.custom_trackers t where t.id = tracker_id and t.user_id = auth.uid()
    )
  );

drop policy if exists "users manage own daily logs" on public.daily_logs;
create policy "users manage own daily logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ensure new rows cannot reference another user's task even if a client is buggy.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
drop trigger if exists task_entries_updated_at on public.task_entries;
create trigger task_entries_updated_at before update on public.task_entries
for each row execute function public.set_updated_at();
drop trigger if exists tracker_entries_updated_at on public.tracker_entries;
create trigger tracker_entries_updated_at before update on public.tracker_entries
for each row execute function public.set_updated_at();
drop trigger if exists daily_logs_updated_at on public.daily_logs;
create trigger daily_logs_updated_at before update on public.daily_logs
for each row execute function public.set_updated_at();
