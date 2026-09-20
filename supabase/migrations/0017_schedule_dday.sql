-- ── schedules.is_dday ────────────────────────────────────────────────────────
-- 일정 중 D-DAY로 표시할 것을 골라 홈 "최근 활동"에 남은 일수(D-n)로 보여주기 위함.
-- 새 테이블 없이 컬럼만 추가하며, RLS는 기존 "본인 일정만" 정책을 그대로 따른다.
-- 반복 일정은 D-DAY로 표시하지 않으므로(앱에서 제한) 기본값 false.
alter table public.schedules
  add column is_dday boolean not null default false;
