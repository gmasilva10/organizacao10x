-- STU-B Migration — idempotent
-- students: cpf, birth_date, customer_stage, address
alter table if exists public.students add column if not exists cpf text null;
alter table if exists public.students add column if not exists birth_date date null;
alter table if exists public.students add column if not exists customer_stage text null;
alter table if exists public.students add column if not exists address jsonb null;

-- enforce enum values for customer_stage via check (only if not exists)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'students' and c.conname = 'students_customer_stage_check'
  ) then
    alter table public.students
      add constraint students_customer_stage_check
      check (customer_stage is null or customer_stage in ('new','renewal','canceled'));
  end if;
end $$;

-- set default for customer_stage
alter table if exists public.students alter column customer_stage set default 'new';

-- student_services table
create table if not exists public.student_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  type text not null,
  status text not null,
  price_cents integer not null,
  currency char(3) not null default 'BRL',
  discount_amount_cents integer null,
  discount_pct numeric(5,2) null,
  purchase_status text not null,
  payment_method text null,
  installments integer null,
  billing_cycle text null,
  start_date date null,
  delivery_date date null,
  end_date date null,
  last_payment_at timestamptz null,
  next_payment_at timestamptz null,
  notes text null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- basic indexes
create index if not exists idx_student_services_student on public.student_services(student_id);
create index if not exists idx_student_services_tenant on public.student_services(tenant_id);

-- enum checks (idempotent: add if not exists)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'student_services_type_check'
  ) then
    alter table public.student_services
      add constraint student_services_type_check
      check (type in ('single','plan','package'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'student_services_status_check'
  ) then
    alter table public.student_services
      add constraint student_services_status_check
      check (status in ('active','paused','ended'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'student_services_purchase_status_check'
  ) then
    alter table public.student_services
      add constraint student_services_purchase_status_check
      check (purchase_status in ('pending','paid','overdue','canceled'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'student_services_payment_method_check'
  ) then
    alter table public.student_services
      add constraint student_services_payment_method_check
      check (payment_method is null or payment_method in ('pix','card','boleto','transfer','other'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'student_services_billing_cycle_check'
  ) then
    alter table public.student_services
      add constraint student_services_billing_cycle_check
      check (billing_cycle is null or billing_cycle in ('monthly','quarterly','semiannual','annual','one_off'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'student_services_discount_xor_check'
  ) then
    alter table public.student_services
      add constraint student_services_discount_xor_check
      check (discount_amount_cents is null or discount_pct is null);
  end if;
end $$;

-- unique active per student (partial unique index)
create unique index if not exists uq_student_services_active_per_student
  on public.student_services(student_id)
  where is_active = true;

-- trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_student_services_updated_at'
  ) then
    create trigger trg_student_services_updated_at
      before update on public.student_services
      for each row execute function public.set_updated_at();
  end if;
end $$;


