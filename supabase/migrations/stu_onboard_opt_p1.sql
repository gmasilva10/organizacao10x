-- STU — Onboarding option for students and kanban idempotency

do $$ begin
  if not exists (select 1 from pg_type where typname = 'onboard_opt') then
    create type onboard_opt as enum ('nao_enviar','enviar','enviado');
  end if;
end $$;

alter table if exists public.students
  add column if not exists onboard_opt onboard_opt not null default 'nao_enviar';

-- Backfill: mark as 'enviado' when student already has a kanban card
update public.students s
  set onboard_opt = 'enviado'
where onboard_opt <> 'enviado'
  and exists (
    select 1 from public.kanban_items ki
    where ki.org_id = s.tenant_id and ki.student_id = s.id
  );

-- Idempotency: unique org+student in kanban_items
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uq_kanban_items_org_student'
  ) then
    alter table if exists public.kanban_items
      add constraint uq_kanban_items_org_student unique (org_id, student_id);
  end if;
end $$;


