-- HIS01 P0 — ajustes audit_log conforme especificação
-- Tornar org_id NOT NULL e payload com default '{}'
alter table if exists public.audit_log alter column org_id set not null;
alter table if exists public.audit_log alter column payload set default '{}'::jsonb;

-- Índices exigidos (org_id, created_at desc) e (entity_type, entity_id, created_at desc)
create index if not exists idx_audit_org_created_desc on public.audit_log(org_id, created_at desc);
create index if not exists idx_audit_entity_created_desc on public.audit_log(entity_type, entity_id, created_at desc);

-- Recriar políticas estritas (somente mesma org)
-- Remover políticas frouxas se existirem
do $$ begin
  if exists (select 1 from pg_policies where tablename='audit_log' and policyname='audit_select_own_org') then
    drop policy audit_select_own_org on public.audit_log;
  end if;
  if exists (select 1 from pg_policies where tablename='audit_log' and policyname='audit_insert_same_org') then
    drop policy audit_insert_same_org on public.audit_log;
  end if;
end $$;

create policy if not exists audit_select_same_org on public.audit_log for select
  using (org_id = auth.jwt() ->> 'org_id');

create policy if not exists audit_insert_same_org on public.audit_log for insert
  with check (org_id = auth.jwt() ->> 'org_id');
