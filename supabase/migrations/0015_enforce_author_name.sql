-- ============================================================
-- posts/comments의 author_name(표시 이름)을 서버에서 강제
--
-- 문제: author_name은 클라이언트가 보내는 값을 그대로 저장해서, 로그인한 사용자가 다른 사람
--       (예: "운영자")의 이름으로 글·댓글을 올릴 수 있었음. 또 앱은 username이 없으면 이메일을
--       표시 이름으로 보내서 이메일이 공개될 수도 있었음.
-- 해결: BEFORE 트리거로, 클라이언트(anon/authenticated 롤)가 관리자가 아니면
--       - INSERT: 작성자 본인 profiles.username(없으면 '익명')으로 덮어씀
--       - UPDATE(posts): author_name 변경을 무시(기존 값 유지)
--       관리자·서비스 키·SQL Editor는 통과.
-- 참고: 이미 저장된 글·댓글의 author_name은 그대로 둠. username 자체가 가입 시 자유 입력이라
--       중복/예약어 방지(유일성)는 별도 과제.
-- ============================================================

create or replace function public.enforce_author_name()
returns trigger language plpgsql set search_path = public as $$
declare _name text;
begin
  -- 서비스 키(service_role), SQL Editor(postgres), security definer 함수는 통과
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if public.get_current_user_role() = 'admin' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.author_name := old.author_name;
    return new;
  end if;

  select coalesce(nullif(btrim(username), ''), '익명') into _name
  from public.profiles where id = auth.uid();
  new.author_name := coalesce(_name, '익명');
  return new;
end;
$$;

drop trigger if exists enforce_author_name on public.posts;
create trigger enforce_author_name
  before insert or update on public.posts
  for each row execute procedure public.enforce_author_name();

drop trigger if exists enforce_author_name on public.comments;
create trigger enforce_author_name
  before insert on public.comments
  for each row execute procedure public.enforce_author_name();
