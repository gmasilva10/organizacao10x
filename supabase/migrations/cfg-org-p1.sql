-- Team Admin — Organização (CFG-ORG-P1)
alter table if exists public.tenants
  add column if not exists display_name text,
  add column if not exists legal_name   text,
  add column if not exists cnpj         text,
  add column if not exists address      jsonb,
  add column if not exists timezone     text default 'America/Sao_Paulo',
  add column if not exists currency     char(3) default 'BRL',
  add column if not exists plan_code    text check (plan_code in ('basic','enterprise')) default 'basic',
  add column if not exists created_at   timestamptz not null default now(),
  add column if not exists updated_at   timestamptz not null default now();

-- trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'tenants_set_updated_at'
  ) then
    create trigger tenants_set_updated_at
      before update on public.tenants
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- Ensure memberships has timestamps for cache expectations
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='memberships' and column_name='created_at'
  ) then
    alter table public.memberships add column created_at timestamptz not null default now();
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='memberships' and column_name='updated_at'
  ) then
    alter table public.memberships add column updated_at timestamptz not null default now();
  end if;
end $$;


