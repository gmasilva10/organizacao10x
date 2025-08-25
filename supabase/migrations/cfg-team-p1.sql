-- Team Admin — Colaboradores (CFG-TEAM-P1)
create table if not exists public.tenant_users (
  tenant_id uuid not null,
  user_id uuid not null,
  status text not null check (status in ('active','invited','paused')),
  invited_at timestamptz,
  activated_at timestamptz,
  paused_at timestamptz,
  last_login_at timestamptz,
  primary key (tenant_id, user_id)
);

create index if not exists idx_tenant_users_tenant on public.tenant_users(tenant_id);
create index if not exists idx_tenant_users_status on public.tenant_users(status);

-- memberships (se já não existir) — usada para papéis por usuário no tenant
create table if not exists public.memberships (
  tenant_id uuid not null,
  user_id uuid not null,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id, role)
);

create index if not exists idx_memberships_tenant_role on public.memberships(tenant_id, role);


