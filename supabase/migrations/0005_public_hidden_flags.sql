-- works: is_public (default true, false = admin-only visibility)
alter table public.works
  add column if not exists is_public boolean not null default true;

-- posts: is_hidden (default false, true = admin-only visibility)
alter table public.posts
  add column if not exists is_hidden boolean not null default false;

-- ── works select policy ────────────────────────────────────────────────────────
-- Replace the old "all public" policy with one that gates private works to admin.
drop policy if exists "works select all" on public.works;
create policy "works select" on public.works
  for select using (
    is_public = true
    or public.get_current_user_role() = 'admin'
  );

-- ── posts select policy ────────────────────────────────────────────────────────
-- Replace the old "all public" policy with one that gates hidden posts to admin.
drop policy if exists "posts select all" on public.posts;
create policy "posts select" on public.posts
  for select using (
    is_hidden = false
    or public.get_current_user_role() = 'admin'
  );

-- ── posts update policy ────────────────────────────────────────────────────────
-- Admin needs update permission to toggle is_hidden on any post.
drop policy if exists "posts update own" on public.posts;
create policy "posts update own" on public.posts
  for update using (
    auth.uid() = user_id
    or public.get_current_user_role() = 'admin'
  );
