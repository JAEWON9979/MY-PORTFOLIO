-- Hard-delete support: cascade user's posts/comments on account deletion,
-- and a SECURITY DEFINER RPC so the client can delete its own auth.users row
-- without exposing the service_role key.

-- ── change posts.user_id FK: SET NULL → CASCADE ───────────────────────────────
alter table public.posts
  drop constraint if exists posts_user_id_fkey;
alter table public.posts
  add constraint posts_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ── change comments.user_id FK: SET NULL → CASCADE ───────────────────────────
alter table public.comments
  drop constraint if exists comments_user_id_fkey;
alter table public.comments
  add constraint comments_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- ── RPC: delete own account ───────────────────────────────────────────────────
-- SECURITY DEFINER runs as the function owner (postgres role), which has
-- permission to delete from auth.users. The WHERE clause ensures a user can
-- only ever delete their own row.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = _uid;
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
revoke execute on function public.delete_own_account() from anon;
