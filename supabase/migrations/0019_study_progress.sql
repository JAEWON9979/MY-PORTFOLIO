-- ── 이번 학기 학습 진도 (admin 전용) ──────────────────────────────────────────
-- 성적 페이지의 "이번 학기" 탭: 수강 중인 과목별로 주차마다 스스로 학습 상태를 기록한다.
-- courses(끝난 과목 성적)와는 별도 테이블 — 아직 성적이 없는 과목이라 grade not null 제약과 맞지 않음.
-- RLS는 courses와 동일하게 profiles.role = 'admin'만 허용.

create table if not exists public.study_terms (
  id           uuid        primary key default gen_random_uuid(),
  label        text        not null,                 -- 예: "2026-2학기"
  start_date   date        not null,                 -- 1주차 시작일
  midterm_week integer     not null default 8  check (midterm_week between 2 and 20),
  final_week   integer     not null default 15 check (final_week between 3 and 24),
  created_at   timestamptz not null default now(),
  check (final_week > midterm_week + 1)
);

create table if not exists public.study_courses (
  id         uuid        primary key default gen_random_uuid(),
  term_id    uuid        not null references public.study_terms(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now()
);
create index if not exists study_courses_term_id_idx on public.study_courses(term_id);

-- status: 1 = 수업만 들음, 2 = 복습 완료 (0/안 함은 행이 없는 것으로 표현)
create table if not exists public.study_progress (
  course_id  uuid        not null references public.study_courses(id) on delete cascade,
  week       integer     not null check (week between 1 and 24),
  status     smallint    not null check (status in (1, 2)),
  updated_at timestamptz not null default now(),
  primary key (course_id, week)
);

alter table public.study_terms    enable row level security;
alter table public.study_courses  enable row level security;
alter table public.study_progress enable row level security;

create policy "study_terms admin" on public.study_terms
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "study_courses admin" on public.study_courses
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "study_progress admin" on public.study_progress
  for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
