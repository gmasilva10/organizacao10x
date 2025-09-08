-- Migration: cfg-team-p1.sql 
-- Descrição: Tabela collaborators para gestão de colaboradores por organização
-- Data: 2025-08-27
-- Módulo: feat/team-collaborators-crud

-- Criar tabela collaborators
CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) >= 2),
  email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
  role TEXT NOT NULL DEFAULT 'trainer' CHECK (role IN ('admin', 'manager', 'trainer', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_collaborators_org_id ON public.collaborators(org_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON public.collaborators(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON public.collaborators(role);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON public.collaborators(user_id) WHERE user_id IS NOT NULL;

-- Índice único: 1 user_id por org (para vínculo 1:1)
CREATE UNIQUE INDEX IF NOT EXISTS idx_collaborators_user_org_unique 
ON public.collaborators(user_id, org_id) 
WHERE user_id IS NOT NULL;

-- RLS: habilitar segurança por linha
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: usuários só veem colaboradores da própria organização
CREATE POLICY "collaborators_org_isolation" ON public.collaborators
  FOR ALL USING (
    org_id IN (
      SELECT tenant_id FROM public.memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: insert/update/delete apenas para admin/manager
CREATE POLICY "collaborators_write_rbac" ON public.collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = collaborators.org_id
        AND m.role IN ('admin', 'manager')
    )
  );

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_collaborators_updated_at
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.collaborators IS 'Colaboradores da organização com limites por plano';
COMMENT ON COLUMN public.collaborators.org_id IS 'Organização do colaborador (tenant_id)';
COMMENT ON COLUMN public.collaborators.full_name IS 'Nome completo (mínimo 2 caracteres)';
COMMENT ON COLUMN public.collaborators.email IS 'Email opcional do colaborador';
COMMENT ON COLUMN public.collaborators.phone IS 'Telefone opcional (formato E.164)';
COMMENT ON COLUMN public.collaborators.role IS 'Papel: admin, manager, trainer, viewer';
COMMENT ON COLUMN public.collaborators.status IS 'Status: active, inactive';
COMMENT ON COLUMN public.collaborators.user_id IS 'Vínculo opcional com usuário (1:1 por org)';

-- Seed inicial: colaborador admin para cada tenant existente
INSERT INTO public.collaborators (org_id, full_name, email, role, status)
SELECT 
  t.id as org_id,
  'Administrador' as full_name,
  'admin@' || LOWER(REPLACE(t.name, ' ', '')) || '.local' as email,
  'admin' as role,
  'active' as status
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.collaborators c 
  WHERE c.org_id = t.id AND c.role = 'admin'
)
ON CONFLICT DO NOTHING;