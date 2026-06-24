-- ── goals: recurring support ─────────────────────────────────────────────────
alter table public.goals
  add column if not exists is_recurring          boolean not null default false,
  add column if not exists recurring_template_id uuid    references public.goals(id) on delete set null;

-- ── works: per-file download access ──────────────────────────────────────────
alter table public.works
  add column if not exists file_is_public boolean not null default true;
