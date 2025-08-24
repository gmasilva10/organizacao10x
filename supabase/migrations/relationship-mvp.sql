-- Relationship MVP — templates & messages (idempotente)

create table if not exists public.relationship_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  title text not null,
  type text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_relationship_templates_tenant on public.relationship_templates(tenant_id);

do $$
begin
  if not exists(select 1 from pg_constraint where conname = 'relationship_templates_type_check') then
    alter table public.relationship_templates add constraint relationship_templates_type_check
    check (type in ('nota','ligacao','whatsapp','email'));
  end if;
end $$;

create or replace function public.set_rt_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
begin
  if not exists(select 1 from pg_trigger where tgname = 'trg_rt_updated_at') then
    create trigger trg_rt_updated_at before update on public.relationship_templates
    for each row execute function public.set_rt_updated_at();
  end if;
end $$;

create table if not exists public.relationship_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  type text not null,
  channel text null,
  body text not null,
  attachments jsonb null,
  links jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists idx_relationship_messages_tenant on public.relationship_messages(tenant_id);
create index if not exists idx_relationship_messages_student on public.relationship_messages(student_id);

do $$
begin
  if not exists(select 1 from pg_constraint where conname = 'relationship_messages_type_check') then
    alter table public.relationship_messages add constraint relationship_messages_type_check
    check (type in ('nota','ligacao','whatsapp','email'));
  end if;
end $$;


