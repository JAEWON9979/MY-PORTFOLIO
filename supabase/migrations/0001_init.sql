-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- before using /community, /goals, /works against Supabase.
--
-- The existing posts/comments/goals/works tables in this project were
-- confirmed unused, so this migration drops and recreates them with the
-- schema these hooks expect.

create extension if not exists pgcrypto;

drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.goals cascade;
drop table if exists public.works cascade;

-- posts -----------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null check (category in ('자유', '정보공유', '질문')),
  author_name text not null,
  like_count integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts are publicly readable" on public.posts
  for select using (true);
create policy "posts are publicly writable" on public.posts
  for insert with check (true);
create policy "posts are publicly updatable" on public.posts
  for update using (true);
create policy "posts are publicly deletable" on public.posts
  for delete using (true);

-- comments ----------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  author_name text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments are publicly readable" on public.comments
  for select using (true);
create policy "comments are publicly writable" on public.comments
  for insert with check (true);
create policy "comments are publicly deletable" on public.comments
  for delete using (true);

-- goals ---------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('단기', '장기', '학업')),
  progress integer not null default 0 check (progress between 0 and 100),
  deadline date not null,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals are publicly readable" on public.goals
  for select using (true);
create policy "goals are publicly writable" on public.goals
  for insert with check (true);
create policy "goals are publicly updatable" on public.goals
  for update using (true);
create policy "goals are publicly deletable" on public.goals
  for delete using (true);

-- works -----------------------------------------------------------------
create table public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('수업과제', '개인실습', '팀프로젝트')),
  tech_tags text[] not null default '{}',
  file_type text not null check (file_type in ('PDF', 'PPTX', '기타')),
  link_url text not null default '',
  work_date date not null,
  created_at timestamptz not null default now()
);

alter table public.works enable row level security;

create policy "works are publicly readable" on public.works
  for select using (true);
create policy "works are publicly writable" on public.works
  for insert with check (true);
create policy "works are publicly updatable" on public.works
  for update using (true);
create policy "works are publicly deletable" on public.works
  for delete using (true);

-- seed data (matches the previous localStorage sample data) ---------------
with seeded_posts as (
  insert into public.posts (title, content, category, author_name, like_count, view_count, created_at, updated_at)
  values
    ('커뮤니티 게시판을 열었습니다', '자유롭게 의견을 나눠주세요. 잘 부탁드립니다.', '자유', '운영자', 3, 42, '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z'),
    ('행정직 자격증 준비 정보 공유합니다', '정보처리기사, 컴퓨터활용능력 준비할 때 참고했던 자료들 정리했어요.', '정보공유', '준비생', 7, 120, '2026-06-05T10:30:00Z', '2026-06-05T10:30:00Z'),
    ('면접 준비 어떻게 하셨나요?', '행정직 면접 후기나 준비 방법 공유해주실 분 계신가요?', '질문', '익명', 1, 58, '2026-06-10T15:15:00Z', '2026-06-10T15:15:00Z')
  returning id, title
)
insert into public.comments (post_id, content, author_name, created_at)
select id, comment_content, comment_author, comment_created_at
from seeded_posts
join (
  values
    ('커뮤니티 게시판을 열었습니다', '환영합니다! 자주 들르겠습니다.', '방문자1', timestamptz '2026-06-01T11:00:00Z'),
    ('행정직 자격증 준비 정보 공유합니다', '좋은 정보 감사합니다.', '준비생2', timestamptz '2026-06-05T12:00:00Z'),
    ('면접 준비 어떻게 하셨나요?', '저도 궁금했던 내용이에요.', '익명2', timestamptz '2026-06-10T16:00:00Z')
) as c(post_title, comment_content, comment_author, comment_created_at)
  on c.post_title = seeded_posts.title;

insert into public.goals (title, description, category, progress, deadline)
values
  ('정보처리기사 자격증 취득', '필기/실기 일정에 맞춰 매일 1시간씩 학습하기.', '학업', 40, '2026-09-30'),
  ('행정 직무 포트폴리오 완성', '경력, 역량을 정리해 지원 가능한 포트폴리오 페이지 만들기.', '단기', 70, '2026-07-15'),
  ('공공기관 행정 직무 취업', '관련 공고를 꾸준히 지원하고 면접 준비하기.', '장기', 15, '2027-03-01');

insert into public.works (title, description, category, tech_tags, file_type, link_url, work_date)
values
  ('엑셀 함수 활용 보고서', 'VLOOKUP, 피벗테이블을 활용해 분기별 매출 데이터를 정리한 수업 과제입니다.', '수업과제', array['Excel', 'PivotTable'], 'PDF', 'https://example.com/works/sample-1', '2026-03-15'),
  ('공문서 작성 실습', '행정 공문서 양식에 맞춰 작성해본 개인 실습 자료입니다.', '개인실습', array['한글', '공문서'], 'PPTX', 'https://example.com/works/sample-2', '2026-04-02'),
  ('민원 응대 프로세스 개선 프로젝트', '팀원들과 함께 민원 응대 절차를 분석하고 개선안을 제안한 팀 프로젝트입니다.', '팀프로젝트', array['Python', 'Pandas'], '기타', 'https://example.com/works/sample-3', '2026-05-20');
