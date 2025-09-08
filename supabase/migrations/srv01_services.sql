-- SRV01 — services base + RLS (idempotente)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  description text null,
  duration_min integer null,
  price_cents integer not null default 0,
  plan_visibility text not null default 'all',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- índices
create index if not exists idx_services_org on public.services(org_id);
create index if not exists idx_services_active on public.services(is_active);

-- checks
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'services_plan_visibility_check') then
    alter table public.services add constraint services_plan_visibility_check check (plan_visibility in ('basic','enterprise','all'));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create or replace function public.set_updated_at()
    returns trigger language plpgsql as $$
    begin
      new.updated_at = now();
      return new;
    end $$;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_services_updated_at') then
    create trigger trg_services_updated_at before update on public.services
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.services enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'services' and policyname = 'services_select_own_org'
  ) then
    create policy services_select_own_org on public.services for select
      using (org_id = auth.jwt() ->> 'org_id')
    with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'services' and policyname = 'services_write_admin_manager'
  ) then
    create policy services_write_admin_manager on public.services for all
      using (
        org_id = auth.jwt() ->> 'org_id' and (auth.jwt() ->> 'role') in ('admin','manager')
      ) with check (
        org_id = auth.jwt() ->> 'org_id' and (auth.jwt() ->> 'role') in ('admin','manager')
      );
  end if;
end $$;
