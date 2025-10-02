-- ========================================
-- ONDA 1: Autenticação e Controle de Acesso
-- Data: 2025-10-02
-- Objetivo: Migrar memberships, profiles, tenant_users para org_id
-- ========================================

-- 1. Adicionar org_id às tabelas
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE tenant_users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- 2. Backfill: org_id = tenant_id
UPDATE memberships SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE profiles SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE tenant_users SET org_id = tenant_id WHERE org_id IS NULL;

-- 3. Tornar org_id NOT NULL
ALTER TABLE memberships ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE tenant_users ALTER COLUMN org_id SET NOT NULL;

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_memberships_org_id ON memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON memberships(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_org_id ON tenant_users(org_id);

-- 5. Atualizar RLS Helpers para suportar org_id
-- Modificar is_member_of para aceitar org_id
CREATE OR REPLACE FUNCTION is_member_of_org(org uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND org_id = org
  );
END;
$$;

-- Manter compatibilidade com tenant_id (legacy)
CREATE OR REPLACE FUNCTION is_member_of(tenant uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND (org_id = tenant OR tenant_id = tenant)
  );
END;
$$;

-- 6. Atualizar políticas RLS
DROP POLICY IF EXISTS memberships_select ON memberships;
CREATE POLICY memberships_select ON memberships
  FOR SELECT
  USING (user_id = auth.uid() OR is_member_of_org(org_id));

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (id = auth.uid() OR is_member_of_org(org_id));

-- 7. Tornar tenant_id NULLABLE (preparação para remoção futura)
ALTER TABLE memberships ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE tenant_users ALTER COLUMN tenant_id DROP NOT NULL;

-- Validação: Verificar que todas as linhas têm org_id
DO $$
DECLARE
  null_count_memberships INT;
  null_count_profiles INT;
  null_count_tenant_users INT;
BEGIN
  SELECT COUNT(*) INTO null_count_memberships FROM memberships WHERE org_id IS NULL;
  SELECT COUNT(*) INTO null_count_profiles FROM profiles WHERE org_id IS NULL;
  SELECT COUNT(*) INTO null_count_tenant_users FROM tenant_users WHERE org_id IS NULL;
  
  IF null_count_memberships > 0 OR null_count_profiles > 0 OR null_count_tenant_users > 0 THEN
    RAISE EXCEPTION 'ONDA 1 - Validação falhou: memberships=%, profiles=%, tenant_users=%', 
      null_count_memberships, null_count_profiles, null_count_tenant_users;
  END IF;
  
  RAISE NOTICE 'ONDA 1 - Validação OK: memberships, profiles, tenant_users migrados com sucesso';
END $$;

