-- ── goals.category: 월목표 추가 ─────────────────────────────────────────────────
alter table public.goals
  drop constraint goals_category_check;
alter table public.goals
  add constraint goals_category_check
  check (category in ('일목표', '주목표', '월목표', '연목표'));
