create table public.schedules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text not null default '',
  date        date not null,
  created_at  timestamptz not null default now()
);

alter table public.schedules enable row level security;

create policy "schedules select own" on public.schedules for select using (auth.uid() = user_id);
create policy "schedules insert own" on public.schedules for insert with check (auth.uid() = user_id);
create policy "schedules update own" on public.schedules for update using (auth.uid() = user_id);
create policy "schedules delete own" on public.schedules for delete using (auth.uid() = user_id);
