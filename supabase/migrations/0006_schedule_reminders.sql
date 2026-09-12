-- ── schedules.reminder_sent_at ────────────────────────────────────────────────
-- 하루 전 이메일 알림을 보냈는지 추적해 중복 발송을 방지.
alter table public.schedules
  add column reminder_sent_at timestamptz;
