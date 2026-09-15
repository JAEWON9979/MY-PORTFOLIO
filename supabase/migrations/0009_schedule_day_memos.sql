-- ── schedule_day_memos ───────────────────────────────────────────────────────
-- 날짜별로 자유롭게 썼다 지웠다 할 수 있는 간단 메모(특정 일정에 종속되지 않음).
create table public.schedule_day_memos (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  date       date        not null,
  memo       text        not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.schedule_day_memos enable row level security;

create policy "schedule_day_memos select own" on public.schedule_day_memos
  for select using (auth.uid() = user_id);
create policy "schedule_day_memos insert own" on public.schedule_day_memos
  for insert with check (auth.uid() = user_id);
create policy "schedule_day_memos update own" on public.schedule_day_memos
  for update using (auth.uid() = user_id);
create policy "schedule_day_memos delete own" on public.schedule_day_memos
  for delete using (auth.uid() = user_id);
