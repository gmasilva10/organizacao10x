-- KAN01 — foundations (stages/items) + seeds + RLS (idempotente)
create table if not exists public.kanban_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.kanban_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  student_id uuid not null,
  stage_id uuid not null references public.kanban_stages(id) on delete cascade,
  position integer not null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_kanban_stages_org_pos on public.kanban_stages(org_id, position);
create index if not exists idx_kanban_items_org_stage_pos on public.kanban_items(org_id, stage_id, position);

alter table public.kanban_stages enable row level security;
alter table public.kanban_items enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'kanban_stages' and policyname = 'kanban_stages_rw_same_org'
  ) then
    create policy kanban_stages_rw_same_org on public.kanban_stages for all
      using (org_id = auth.jwt() ->> 'org_id') with check (org_id = auth.jwt() ->> 'org_id');
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'kanban_items' and policyname = 'kanban_items_rw_same_org'
  ) then
    create policy kanban_items_rw_same_org on public.kanban_items for all
      using (org_id = auth.jwt() ->> 'org_id') with check (org_id = auth.jwt() ->> 'org_id');
  end if;
end $$;

-- seeds helper (ex: Novo, Avaliação, Plano, Execução, Acompanhamento)
create or replace function public.seed_kanban_stages(p_org uuid)
returns void language plpgsql as $$
begin
  if not exists (select 1 from public.kanban_stages where org_id = p_org) then
    insert into public.kanban_stages(org_id, name, position) values
      (p_org, 'Novo', 0),
      (p_org, 'Avaliação', 1),
      (p_org, 'Plano', 2),
      (p_org, 'Execução', 3),
      (p_org, 'Acompanhamento', 4);
  end if;
end $$;
