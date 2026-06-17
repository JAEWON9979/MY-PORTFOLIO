-- Add file_name / file_size columns, expand file_type check to DOCX,
-- and lock down Supabase Storage works-files bucket to admin-only writes.

-- ── new columns ───────────────────────────────────────────────────────────────
alter table public.works
  add column if not exists file_name text,
  add column if not exists file_size bigint;

-- ── expand file_type constraint to include DOCX ───────────────────────────────
-- find the generated constraint name and drop it before re-creating
do $$
declare
  _con text;
begin
  select conname into _con
  from pg_constraint
  where conrelid = 'public.works'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%file_type%';
  if _con is not null then
    execute format('alter table public.works drop constraint %I', _con);
  end if;
end;
$$;

alter table public.works
  add constraint works_file_type_check
    check (file_type in ('PDF', 'PPTX', 'DOCX', '기타'));

-- ── Storage RLS for works-files bucket ───────────────────────────────────────
-- Public bucket → GET /storage/v1/object/public/works-files/... needs no policy.
-- INSERT / UPDATE / DELETE restricted to admin role.

drop policy if exists "works-files admin insert" on storage.objects;
drop policy if exists "works-files admin update" on storage.objects;
drop policy if exists "works-files admin delete" on storage.objects;

create policy "works-files admin insert" on storage.objects
  for insert with check (
    bucket_id = 'works-files'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "works-files admin update" on storage.objects
  for update using (
    bucket_id = 'works-files'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "works-files admin delete" on storage.objects
  for delete using (
    bucket_id = 'works-files'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
