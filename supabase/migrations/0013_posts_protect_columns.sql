-- ============================================================
-- posts 보안 강화: 작성자가 관리자 전용 컬럼을 직접 바꾸지 못하게 함
--
-- 문제: "posts update own"은 컬럼 제한이 없어 작성자가 자기 글의 is_hidden(관리자 숨김),
--       view_count, like_count를 anon 키 + 본인 토큰으로 직접 UPDATE할 수 있었음.
--       INSERT 정책도 컬럼 제한이 없어 like_count/view_count를 임의 값으로 넣고 글을 만들 수 있었음.
--       (반대로 앱의 조회수 증가는 클라이언트가 직접 UPDATE하는 방식이라, RLS 때문에
--        작성자·관리자가 아닌 사람의 조회는 DB에 저장되지 않고 있었음.)
--
-- 해결:
--  1) BEFORE INSERT/UPDATE 트리거로, 클라이언트(anon/authenticated 롤)가 관리자가 아니면
--     is_hidden/view_count/like_count를 바꾸지 못하게 막음. 서비스 키·SQL Editor·security definer 함수는 통과.
--  2) 조회수는 security definer RPC로만 +1 하게 해서 누구의 조회든 저장되게 함.
--     (좋아요 증감은 0014의 toggle_post_like가 담당)
--
-- 참고: 운영 DB에는 이 파일의 초기 버전(increment_post_like 함수 포함)이 적용됐다가 0014에서
--       그 함수가 삭제됨. 여기서는 만들었다 지우는 군더더기를 뺐고, 최종 상태는 동일함.
-- ============================================================

create or replace function public.protect_post_columns()
returns trigger language plpgsql set search_path = public as $$
begin
  -- 서비스 키(service_role), SQL Editor(postgres), security definer RPC(함수 소유자)는 통과
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if public.get_current_user_role() = 'admin' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_hidden  := false;
    new.view_count := 0;
    new.like_count := 0;
  elsif new.is_hidden  is distinct from old.is_hidden
     or new.view_count is distinct from old.view_count
     or new.like_count is distinct from old.like_count then
    raise exception 'is_hidden, view_count and like_count can only be changed by an admin'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_post_columns on public.posts;
create trigger protect_post_columns
  before insert or update on public.posts
  for each row execute procedure public.protect_post_columns();

-- 조회수 +1: 공개된 글만, 로그인 여부 무관
create or replace function public.increment_post_view(_post_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set view_count = view_count + 1
  where id = _post_id and is_hidden = false;
$$;
revoke all on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;
