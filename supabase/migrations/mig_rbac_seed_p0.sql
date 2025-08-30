-- RBAC Seed P0 — idempotente (ajustado ao schema existente)

-- Garantir roles básicas (inclui viewer)
do $$
begin
  if not exists (select 1 from public.roles where code = 'viewer') then
    insert into public.roles(code, name, description, system_default)
    values ('viewer','Viewer','Somente leitura', true);
  end if;
end $$;

-- Garantir permissões granulares (domain/action) — idempotente
do $$
begin
  if not exists (select 1 from public.permissions where domain='students' and action='read') then
    insert into public.permissions(domain,action) values
      ('students','read'),('students','write'),
      ('services','read'),('services','write'),
      ('kanban','read'),('kanban','write'),
      ('settings.users','read'),('settings.users','write'),
      ('settings.roles','read'),('settings.roles','write');
  end if;
end $$;

-- Construir matriz padrão (roles x permissions) — allowed conforme regra
do $$
declare
  r record;
  p record;
  allowed boolean;
  rid uuid;
  pid uuid;
begin
  for r in select id, code from public.roles loop
    for p in select id, domain, action from public.permissions loop
      select case
        when r.code = 'admin' then true
        when r.code = 'manager' then (p.domain,p.action) in (
          ('students','read'),('students','write'),('services','read'),('services','write'),
          ('kanban','read'),('kanban','write'),('settings.users','read'),('settings.roles','read')
        )
        when r.code = 'trainer' then (p.domain,p.action) in (
          ('students','read'),('services','read'),('kanban','read'),('kanban','write')
        )
        when r.code = 'viewer' then (p.domain,p.action) in (
          ('students','read'),('services','read'),('kanban','read'),('settings.users','read'),('settings.roles','read')
        )
        else false
      end into allowed;
      if allowed is not null then
        rid := r.id; pid := p.id;
        insert into public.role_permissions(role_id, permission_id, allowed)
        values (rid, pid, allowed)
        on conflict (role_id, permission_id) do update set allowed = excluded.allowed;
      end if;
    end loop;
  end loop;
end $$;


