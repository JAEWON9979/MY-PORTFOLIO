-- ── schedules.reminder_enabled ───────────────────────────────────────────────
-- 일정마다 하루 전 이메일 알림 수신 여부를 선택할 수 있도록.
alter table public.schedules
  add column reminder_enabled boolean not null default true;
