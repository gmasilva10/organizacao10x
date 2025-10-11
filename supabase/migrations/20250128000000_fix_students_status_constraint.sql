-- Fix students status constraint to include 'inactive' for soft delete
-- Data: 2025-01-28
-- Descrição: Adiciona 'inactive' aos valores permitidos no constraint de status dos alunos

-- Remove constraint existente se existir
do $$ begin
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'students' and c.conname = 'students_status_check'
  ) then
    alter table public.students drop constraint students_status_check;
  end if;
end $$;

-- Adiciona novo constraint com 'inactive' incluído
alter table if exists public.students
  add constraint students_status_check
  check (status in ('onboarding','active','paused','inactive'));

-- Mantém o default como 'onboarding'
alter table if exists public.students
  alter column status set default 'onboarding';
