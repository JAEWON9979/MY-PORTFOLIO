-- ── courses (admin-only grade management) ────────────────────────────────────
create table if not exists public.courses (
  id         uuid           primary key default gen_random_uuid(),
  name       text           not null,
  credit     numeric(4,1)   not null check (credit >= 0),
  grade      text           not null check (grade in ('A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F', 'P')),
  category   text           not null check (category in ('계공', '교필', '교선', '전공')),
  year       integer        not null check (year between 1 and 4),
  semester   text           not null check (semester in ('1학기', '2학기')),
  created_at timestamptz    not null default now()
);
alter table public.courses enable row level security;

drop policy if exists "courses select admin" on public.courses;
drop policy if exists "courses insert admin" on public.courses;
drop policy if exists "courses update admin" on public.courses;
drop policy if exists "courses delete admin" on public.courses;

-- works 테이블과 동일한 패턴: exists (select 1 from profiles ...)
create policy "courses select admin" on public.courses
  for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "courses insert admin" on public.courses
  for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "courses update admin" on public.courses
  for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "courses delete admin" on public.courses
  for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ── seed data (없을 때만 삽입) ────────────────────────────────────────────────
do $$
begin
  if (select count(*) from public.courses) = 0 then
    insert into public.courses (name, credit, grade, category, year, semester) values
      ('국제학입문',           3,   'A+', '계공', 1, '1학기'),
      ('정치학입문',           3,   'A0', '계공', 1, '1학기'),
      ('행정학입문',           3,   'A+', '계공', 1, '1학기'),
      ('채플',                 0.5, 'P',  '교필', 1, '1학기'),
      ('대학생활길잡이',       1,   'P',  '교필', 1, '1학기'),
      ('기독교와인문학',       2,   'B+', '교필', 1, '1학기'),
      ('명화의사회사',         3,   'A+', '교선', 1, '1학기'),
      ('컴퓨팅사고와SW코딩',   3,   'A+', '교필', 1, '1학기'),
      ('행정과법',             3,   'A+', '계공', 1, '2학기'),
      ('공공빅데이터분석입문', 3,   'A+', '계공', 1, '2학기'),
      ('채플',                 0.5, 'P',  '교필', 1, '2학기'),
      ('성서의세계',           2,   'A+', '교필', 1, '2학기'),
      ('진로와상담',           0,   'P',  '교필', 1, '2학기'),
      ('민주시민교육',         3,   'B+', '교선', 1, '2학기'),
      ('인간관계와예절',       2,   'A+', '교선', 1, '2학기'),
      ('글쓰기의기초',         3,   'A+', '교필', 1, '2학기'),
      ('북한미술의어제와오늘', 3,   'P',  '교선', 1, '2학기');
  end if;
end $$;
