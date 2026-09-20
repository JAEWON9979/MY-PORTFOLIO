-- ============================================================
-- 가입 트리거에서 admin@naver.com 자동 관리자 승격 제거
--
-- 문제: handle_new_user가 이메일이 'admin@naver.com'이면 role을 'admin'으로 만들었음.
--       Supabase Confirm email이 꺼져 있어(가입 즉시 활성화) 그 주소가 비어 있으면
--       누구든 그 주소로 가입해서 관리자가 될 수 있었음. 실제 관리자는 이미 다른 계정으로 존재해
--       이 규칙은 더 이상 필요 없음.
-- 해결: 가입 시 role은 항상 'user'. 관리자 지정은 /admin/users 화면(관리자)이나 SQL로만.
-- 참고: 새 프로젝트를 세팅할 때 첫 관리자는 가입 후 SQL로 직접 승격해야 함
--       (update public.profiles set role = 'admin' where email = '<내 이메일>';).
--       on_auth_user_created 트리거는 함수 이름으로 연결돼 있어 함수만 교체하면 됨.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    'user'
  );
  return new;
end;
$$;
