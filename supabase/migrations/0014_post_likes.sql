-- ============================================================
-- 좋아요를 계정당 글 하나에 한 번만, 다시 누르면 취소되는 토글로 변경
--
-- 문제: 0013 초기 버전의 increment_post_like는 누를 때마다 무조건 +1 이라 로그인한 사용자가
--       같은 글에 무한히 좋아요를 누를 수 있었음.
-- 해결: post_likes(post_id, user_id) 복합 기본키로 중복을 막고, toggle_post_like RPC가
--       행 추가/삭제와 posts.like_count 증감을 한 트랜잭션에서 처리.
-- 참고: 이미 쌓여 있던 like_count는 누가 눌렀는지 기록이 없어 그대로 두고 이후부터 새 방식으로 셈.
-- ============================================================

create table if not exists public.post_likes (
  post_id    uuid        not null references public.posts(id)  on delete cascade,
  user_id    uuid        not null references auth.users(id)   on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;

-- 본인 좋아요만 조회 가능(버튼에 "눌렀음" 표시용). insert/update/delete 정책은 없음 → RPC로만 변경.
drop policy if exists "post_likes select own" on public.post_likes;
create policy "post_likes select own" on public.post_likes
  for select using (auth.uid() = user_id);

-- 좋아요 토글: 눌러져 있으면 취소(false 반환), 아니면 추가(true 반환). 로그인 필수, 공개된 글만.
create or replace function public.toggle_post_like(_post_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if not exists (select 1 from public.posts where id = _post_id and is_hidden = false) then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;

  delete from public.post_likes where post_id = _post_id and user_id = _uid;
  if found then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = _post_id;
    return false;
  end if;

  -- 동시에 두 번 눌려도 실제로 행이 들어간 경우에만 +1
  insert into public.post_likes (post_id, user_id) values (_post_id, _uid)
    on conflict do nothing;
  if found then
    update public.posts set like_count = like_count + 1 where id = _post_id;
  end if;
  return true;
end;
$$;
revoke all on function public.toggle_post_like(uuid) from public;
grant execute on function public.toggle_post_like(uuid) to authenticated;

-- 0013 초기 버전이 만들었던, 무조건 +1 하던 함수 제거 (이미 적용된 운영 DB용. 새 환경에선 없으므로 no-op)
drop function if exists public.increment_post_like(uuid);
