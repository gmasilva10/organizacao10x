-- STU status check fix — ensure allowed values include 'onboarding'
do $$ begin
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'students' and c.conname = 'students_status_check'
  ) then
    alter table public.students drop constraint students_status_check;
  end if;
end $$;

alter table if exists public.students
  add constraint students_status_check
  check (status in ('onboarding','active','paused'));

alter table if exists public.students
  alter column status set default 'onboarding';


