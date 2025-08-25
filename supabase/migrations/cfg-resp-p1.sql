-- CFG-RESP-P1 — Responsáveis do Aluno (idempotente)
create table if not exists public.student_responsibles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','trainer_primary','trainer_support')),
  created_at timestamptz not null default now()
);

create index if not exists idx_student_responsibles_student on public.student_responsibles(student_id);
create index if not exists idx_student_responsibles_tenant on public.student_responsibles(tenant_id);

-- Unicidade condicional: 1 owner e 1 trainer_primary por aluno
create unique index if not exists uq_student_owner_per_student
  on public.student_responsibles(student_id)
  where role = 'owner';

create unique index if not exists uq_student_primary_per_student
  on public.student_responsibles(student_id)
  where role = 'trainer_primary';


