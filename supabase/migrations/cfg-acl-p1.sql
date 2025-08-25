-- Team Admin — RBAC (CFG-ACL-P1)
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  system_default boolean default true
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  action text not null
);

create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  allowed boolean not null default false,
  primary key (role_id, permission_id)
);

create table if not exists public.user_roles (
  user_id uuid not null,
  role_id uuid references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

create table if not exists public.settings_audit (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  actor_user_id uuid not null,
  area text not null,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Seeds idempotentes básicos
do $$
begin
  if not exists (select 1 from public.roles where code='admin') then
    insert into public.roles(code,name,description,system_default) values
    ('admin','Admin','Acesso total',true),
    ('manager','Manager','Gestão',true),
    ('trainer','Trainer','Treinador',true),
    ('seller','Seller','Comercial',true),
    ('support','Support','Suporte',true),
    ('viewer','Viewer','Somente leitura',true);
  end if;

  if not exists (select 1 from public.permissions limit 1) then
    insert into public.permissions(domain,action) values
      -- students
      ('students','read'),('students','create'),('students','update'),('students','delete'),('students','services_crud'),
      -- relationship
      ('relationship','templates_crud'),('relationship','messages_log'),
      -- settings
      ('settings','users_crud'),('settings','roles_read'),('settings','roles_update'),
      -- reports
      ('reports','read');
  end if;
end $$;


