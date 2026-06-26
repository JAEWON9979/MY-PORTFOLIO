-- ============================================================
-- Portfolio — complete schema (single-file setup)
-- Run once on a fresh Supabase project.
-- Admin: sign up at /auth/register with admin@naver.com
-- ============================================================

create extension if not exists pgcrypto;

-- ── drop existing objects ─────────────────────────────────────────────────────
drop table if exists public.schedules cascade;
drop table if exists public.goals     cascade;
drop table if exists public.comments  cascade;
drop table if exists public.posts     cascade;
drop table if exists public.works     cascade;
drop table if exists public.profiles  cascade;

-- ── helper: read own role without RLS recursion ───────────────────────────────
create or replace function public.get_current_user_role()
returns text language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid();
$$;
grant execute on function public.get_current_user_role() to anon, authenticated;

-- ── profiles ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  username   text,
  role       text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles select all"   on public.profiles for select using (true);
create policy "profiles insert self"  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update self"  on public.profiles for update using (auth.uid() = id);
create policy "profiles update admin" on public.profiles for update using (public.get_current_user_role() = 'admin');

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    case when new.email = 'admin@naver.com' then 'admin' else 'user' end
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── RPC: delete own account ───────────────────────────────────────────────────
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = _uid;
end;
$$;
grant execute on function public.delete_own_account() to authenticated;
revoke execute on function public.delete_own_account() from anon;

-- ── posts ─────────────────────────────────────────────────────────────────────
create table public.posts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete cascade,
  title       text        not null,
  content     text        not null,
  category    text        not null check (category in ('자유', '정보공유', '질문')),
  author_name text        not null,
  like_count  integer     not null default 0,
  view_count  integer     not null default 0,
  is_hidden   boolean     not null default false,
  file_url    text,
  file_name   text,
  file_size   bigint,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "posts select"      on public.posts for select using (is_hidden = false or public.get_current_user_role() = 'admin');
create policy "posts insert auth" on public.posts for insert with check (auth.uid() is not null and auth.uid() = user_id);
create policy "posts update own"  on public.posts for update using (auth.uid() = user_id or public.get_current_user_role() = 'admin');
create policy "posts delete own"  on public.posts for delete using (auth.uid() = user_id);

-- ── comments ──────────────────────────────────────────────────────────────────
create table public.comments (
  id          uuid        primary key default gen_random_uuid(),
  post_id     uuid        not null references public.posts(id) on delete cascade,
  user_id     uuid        references auth.users(id) on delete cascade,
  content     text        not null,
  author_name text        not null,
  created_at  timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "comments select all"  on public.comments for select using (true);
create policy "comments insert auth" on public.comments for insert with check (auth.uid() is not null and auth.uid() = user_id);
create policy "comments delete own"  on public.comments for delete using (auth.uid() = user_id);

-- ── goals ─────────────────────────────────────────────────────────────────────
create table public.goals (
  id                    uuid        primary key default gen_random_uuid(),
  user_id               uuid        references auth.users(id) on delete cascade,
  title                 text        not null,
  description           text        not null default '',
  category              text        not null check (category in ('일목표', '주목표', '연목표')),
  is_completed          boolean     not null default false,
  deadline              date        not null,
  is_recurring          boolean     not null default false,
  recurring_template_id uuid        references public.goals(id) on delete set null,
  created_at            timestamptz not null default now()
);
alter table public.goals enable row level security;
create policy "goals select own" on public.goals for select using (auth.uid() = user_id);
create policy "goals insert own" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals update own" on public.goals for update using (auth.uid() = user_id);
create policy "goals delete own" on public.goals for delete using (auth.uid() = user_id);

-- ── works ─────────────────────────────────────────────────────────────────────
create table public.works (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  description    text        not null default '',
  category       text        not null check (category in ('수업과제', '개인실습', '팀프로젝트')),
  tech_tags      text[]      not null default '{}',
  file_type      text        not null check (file_type in ('PDF', 'PPTX', 'DOCX', '기타')),
  link_url       text        not null default '',
  file_name      text,
  file_size      bigint,
  is_public      boolean     not null default true,
  file_is_public boolean     not null default true,
  work_date      date        not null,
  created_at     timestamptz not null default now()
);
alter table public.works enable row level security;
create policy "works select"       on public.works for select using (is_public = true or public.get_current_user_role() = 'admin');
create policy "works insert admin" on public.works for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "works update admin" on public.works for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "works delete admin" on public.works for delete using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ── schedules ─────────────────────────────────────────────────────────────────
create table public.schedules (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  description text        not null default '',
  date        date        not null,
  created_at  timestamptz not null default now()
);
alter table public.schedules enable row level security;
create policy "schedules select own" on public.schedules for select using (auth.uid() = user_id);
create policy "schedules insert own" on public.schedules for insert with check (auth.uid() = user_id);
create policy "schedules update own" on public.schedules for update using (auth.uid() = user_id);
create policy "schedules delete own" on public.schedules for delete using (auth.uid() = user_id);

-- ── storage: works-files (admin-only writes, public reads) ────────────────────
drop policy if exists "works-files admin insert" on storage.objects;
drop policy if exists "works-files admin update" on storage.objects;
drop policy if exists "works-files admin delete" on storage.objects;
create policy "works-files admin insert" on storage.objects
  for insert with check (bucket_id = 'works-files' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "works-files admin update" on storage.objects
  for update using     (bucket_id = 'works-files' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "works-files admin delete" on storage.objects
  for delete using     (bucket_id = 'works-files' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ── storage: community-files (auth upload, owner/admin delete) ────────────────
-- Files are stored under {user_id}/{filename} to enforce per-user ownership.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-files', 'community-files', true, 10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
) on conflict (id) do nothing;

drop policy if exists "community-files auth insert" on storage.objects;
drop policy if exists "community-files auth delete" on storage.objects;
create policy "community-files auth insert" on storage.objects
  for insert with check (
    bucket_id = 'community-files'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "community-files auth delete" on storage.objects
  for delete using (
    bucket_id = 'community-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );

-- ── seed data ─────────────────────────────────────────────────────────────────
with seeded_posts as (
  insert into public.posts (title, content, category, author_name, like_count, view_count, created_at, updated_at)
  values
    ('커뮤니티 게시판을 열었습니다',       '자유롭게 의견을 나눠주세요. 잘 부탁드립니다.',                              '자유',    '운영자', 3, 42,  '2026-06-01T09:00:00Z', '2026-06-01T09:00:00Z'),
    ('행정직 자격증 준비 정보 공유합니다', '정보처리기사, 컴퓨터활용능력 준비할 때 참고했던 자료들 정리했어요.',         '정보공유', '준비생', 7, 120, '2026-06-05T10:30:00Z', '2026-06-05T10:30:00Z'),
    ('면접 준비 어떻게 하셨나요?',         '행정직 면접 후기나 준비 방법 공유해주실 분 계신가요?',                       '질문',    '익명',  1, 58,  '2026-06-10T15:15:00Z', '2026-06-10T15:15:00Z')
  returning id, title
)
insert into public.comments (post_id, content, author_name, created_at)
select p.id, c.comment_content, c.comment_author, c.comment_created_at
from seeded_posts p
join (
  values
    ('커뮤니티 게시판을 열었습니다',       '환영합니다! 자주 들르겠습니다.',  '방문자1', timestamptz '2026-06-01T11:00:00Z'),
    ('행정직 자격증 준비 정보 공유합니다', '좋은 정보 감사합니다.',           '준비생2', timestamptz '2026-06-05T12:00:00Z'),
    ('면접 준비 어떻게 하셨나요?',         '저도 궁금했던 내용이에요.',       '익명2',   timestamptz '2026-06-10T16:00:00Z')
) as c(post_title, comment_content, comment_author, comment_created_at)
  on c.post_title = p.title;

insert into public.works (title, description, category, tech_tags, file_type, link_url, work_date)
values
  ('엑셀 함수 활용 보고서',            'VLOOKUP, 피벗테이블을 활용해 분기별 매출 데이터를 정리한 수업 과제입니다.',    '수업과제',   array['Excel', 'PivotTable'], 'PDF',  'https://example.com/works/sample-1', '2026-03-15'),
  ('공문서 작성 실습',                 '행정 공문서 양식에 맞춰 작성해본 개인 실습 자료입니다.',                       '개인실습',   array['한글', '공문서'],      'PPTX', 'https://example.com/works/sample-2', '2026-04-02'),
  ('민원 응대 프로세스 개선 프로젝트', '팀원들과 함께 민원 응대 절차를 분석하고 개선안을 제안한 팀 프로젝트입니다.', '팀프로젝트', array['Python', 'Pandas'],    '기타', 'https://example.com/works/sample-3', '2026-05-20');
