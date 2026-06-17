-- Redesign goals table:
--   - add is_completed boolean (replaces progress slider)
--   - change category values: 단기→일목표, 장기→주목표, 학업→연목표
--   - drop progress column

-- ── add is_completed ──────────────────────────────────────────────────────────
alter table public.goals
  add column if not exists is_completed boolean not null default false;

-- ── swap category check constraint ───────────────────────────────────────────
do $$
declare
  _con text;
begin
  select conname into _con
  from pg_constraint
  where conrelid = 'public.goals'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%category%';
  if _con is not null then
    execute format('alter table public.goals drop constraint %I', _con);
  end if;
end;
$$;

-- migrate existing rows before re-adding constraint
update public.goals set category = '일목표' where category = '단기';
update public.goals set category = '주목표' where category = '장기';
update public.goals set category = '연목표' where category = '학업';

alter table public.goals
  add constraint goals_category_check
    check (category in ('일목표', '주목표', '연목표'));

-- ── drop progress column ──────────────────────────────────────────────────────
alter table public.goals drop column if exists progress;
