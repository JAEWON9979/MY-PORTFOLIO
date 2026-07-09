-- ── 반복 목표 시스템 재설계 ─────────────────────────────────────────────────────
-- 기존 꼬인 반복 데이터(is_recurring=true 템플릿 + 그 인스턴스) 전부 삭제
delete from public.goals
  where is_recurring = true or recurring_template_id is not null;

-- goals 테이블의 자기참조 FK 제거 (goals → goals)
alter table public.goals
  drop constraint if exists goals_recurring_template_id_fkey;

-- ── recurring_templates 테이블 ───────────────────────────────────────────────
create table if not exists public.recurring_templates (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  title      text        not null,
  created_at timestamptz not null default now()
);
alter table public.recurring_templates enable row level security;

create policy "recurring_templates select own" on public.recurring_templates
  for select using (auth.uid() = user_id);
create policy "recurring_templates insert own" on public.recurring_templates
  for insert with check (auth.uid() = user_id);
create policy "recurring_templates delete own" on public.recurring_templates
  for delete using (auth.uid() = user_id);

-- goals.recurring_template_id → recurring_templates(id) 로 FK 재연결
alter table public.goals
  add constraint goals_recurring_template_id_fkey
  foreign key (recurring_template_id)
  references public.recurring_templates(id)
  on delete set null;
