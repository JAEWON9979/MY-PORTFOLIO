-- ── recurring_templates update 정책 ──────────────────────────────────────────
-- 반복 목표 템플릿(제목/요일)을 생성 후에도 직접 수정할 수 있도록.
create policy "recurring_templates update own" on public.recurring_templates
  for update using (auth.uid() = user_id);
