-- HIS01 — audit_log base + RLS (idempotente)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid null,
  actor_id uuid not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  payload jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_org on public.audit_log(org_id);
create index if not exists idx_audit_entity on public.audit_log(entity_type, entity_id);

alter table public.audit_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'audit_log' and policyname = 'audit_select_own_org'
  ) then
    create policy audit_select_own_org on public.audit_log for select
      using (org_id is null or org_id = auth.jwt() ->> 'org_id')
      with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'audit_log' and policyname = 'audit_insert_same_org'
  ) then
    create policy audit_insert_same_org on public.audit_log for insert
      with check (org_id is null or org_id = auth.jwt() ->> 'org_id');
  end if;
end $$;
