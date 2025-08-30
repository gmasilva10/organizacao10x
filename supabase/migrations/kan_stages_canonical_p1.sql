-- KANBAN — canonical stages with fixed ends and stable codes

-- Columns on kanban_stages
alter table if exists public.kanban_stages
  add column if not exists stage_code text;

alter table if exists public.kanban_stages
  add column if not exists is_fixed boolean not null default false;

alter table if exists public.kanban_stages
  add column if not exists position integer not null default 0;

-- Unique code per org (partial uniqueness with org)
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='idx_kanban_stages_org_pos'
  ) then
    create index idx_kanban_stages_org_pos on public.kanban_stages(org_id, position);
  end if;
end $$;

-- Helper upsert
create or replace function public._upsert_stage(p_org uuid, p_code text, p_name text, p_pos integer, p_fixed boolean)
returns void language plpgsql as $$
begin
  if exists (select 1 from public.kanban_stages where org_id=p_org and stage_code=p_code) then
    update public.kanban_stages set name=p_name, position=p_pos, is_fixed=p_fixed
      where org_id=p_org and stage_code=p_code;
  elsif exists (select 1 from public.kanban_stages where org_id=p_org and name=p_name) then
    update public.kanban_stages set stage_code=p_code, position=p_pos, is_fixed=p_fixed
      where org_id=p_org and name=p_name;
  else
    insert into public.kanban_stages(org_id, name, stage_code, position, is_fixed)
      values (p_org, p_name, p_code, p_pos, p_fixed);
  end if;
end $$;

-- Canonical seed: positions 1..99
create or replace function public.seed_kanban_stages_canonical(p_org uuid)
returns void language plpgsql as $$
begin
  perform public._upsert_stage(p_org, 'novo_aluno',       'Novo Aluno',        1,  true);
  perform public._upsert_stage(p_org, 'avaliacao_inicial','Avaliação Inicial', 2,  false);
  perform public._upsert_stage(p_org, 'plano',            'Plano',              3,  false);
  perform public._upsert_stage(p_org, 'execucao',         'Execução',           4,  false);
  perform public._upsert_stage(p_org, 'entrega_treino',   'Entrega do Treino', 99, true);
end $$;


