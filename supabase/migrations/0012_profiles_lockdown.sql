-- ============================================================
-- profiles 보안 강화
--  1) "profiles update self" 삭제: 컬럼 제한이 없어 로그인한 사용자가 본인 role을 'admin'으로,
--     email을 임의 값으로 직접 UPDATE할 수 있었음. 앱에는 사용자가 자기 프로필을 수정하는 코드가 없고
--     관리자의 role 변경은 "profiles update admin" 정책으로 계속 가능.
--  2) "profiles select all" → 본인 또는 관리자만 조회: 전체 회원 이메일이 anon 키만으로 공개 조회되던 문제.
--     크론(schedule-reminders)은 서비스 키를 써서 RLS를 우회하므로 영향 없음.
-- get_current_user_role()은 security definer라 정책 안에서 호출해도 RLS 재귀가 없음.
-- ============================================================

drop policy if exists "profiles update self" on public.profiles;

drop policy if exists "profiles select all" on public.profiles;
create policy "profiles select own or admin" on public.profiles
  for select using (auth.uid() = id or public.get_current_user_role() = 'admin');
