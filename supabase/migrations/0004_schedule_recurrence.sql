-- ── schedule_recurrences ─────────────────────────────────────────────────────
create table public.schedule_recurrences (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  frequency   text        not null check (frequency in ('daily','weekly')),
  interval    integer     not null default 1 check (interval >= 1),
  weekdays    smallint[]  null, -- 0=일..6=토, frequency='weekly'일 때만 사용
  start_date  date        not null,
  end_date    date        not null,
  created_at  timestamptz not null default now()
);
alter table public.schedule_recurrences enable row level security;
create policy "schedule_recurrences select own" on public.schedule_recurrences for select using (auth.uid() = user_id);
create policy "schedule_recurrences insert own" on public.schedule_recurrences for insert with check (auth.uid() = user_id);
create policy "schedule_recurrences delete own" on public.schedule_recurrences for delete using (auth.uid() = user_id);

-- ── schedules.recurrence_id ──────────────────────────────────────────────────
alter table public.schedules
  add column recurrence_id uuid references public.schedule_recurrences(id) on delete cascade;
create index schedules_recurrence_id_idx on public.schedules(recurrence_id);
