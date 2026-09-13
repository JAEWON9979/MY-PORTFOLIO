-- ── recurring_templates.weekdays ─────────────────────────────────────────────
-- 반복 목표를 생성할 요일(0=일..6=토)을 선택할 수 있도록.
-- 기본값은 전체 요일(기존 "매일 반복" 동작과 동일하게 유지).
alter table public.recurring_templates
  add column weekdays smallint[] not null default '{0,1,2,3,4,5,6}';
