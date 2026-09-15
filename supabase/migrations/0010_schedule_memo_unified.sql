-- ── schedule_memo (통합 메모) ─────────────────────────────────────────────────
-- 날짜별로 나뉘어 있던 schedule_day_memos를 사용자당 메모 1개로 통합.
create table public.schedule_memo (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  memo       text        not null default '',
  updated_at timestamptz not null default now()
);

alter table public.schedule_memo enable row level security;

create policy "schedule_memo select own" on public.schedule_memo
  for select using (auth.uid() = user_id);
create policy "schedule_memo insert own" on public.schedule_memo
  for insert with check (auth.uid() = user_id);
create policy "schedule_memo update own" on public.schedule_memo
  for update using (auth.uid() = user_id);
create policy "schedule_memo delete own" on public.schedule_memo
  for delete using (auth.uid() = user_id);

-- 기존 날짜별 메모 중 사용자당 가장 최근 날짜의 내용을 통합 메모의 초기값으로 이관.
insert into public.schedule_memo (user_id, memo)
select distinct on (user_id) user_id, memo
from public.schedule_day_memos
order by user_id, date desc;

drop table public.schedule_day_memos;
