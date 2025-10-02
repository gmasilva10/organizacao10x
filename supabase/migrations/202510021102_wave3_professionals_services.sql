-- ========================================
-- ONDA 3: Profissionais e Serviços
-- Data: 2025-10-02
-- Objetivo: Migrar professionals, service_catalog, etc para org_id
-- ========================================

-- Adicionar org_id
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE professional_profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE service_catalog ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE plan_policies ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE sales_scripts ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill
UPDATE professionals SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE professional_profiles SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE service_catalog SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE plan_policies SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE sales_scripts SET org_id = tenant_id WHERE org_id IS NULL;

-- NOT NULL
ALTER TABLE professionals ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE professional_profiles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE service_catalog ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE plan_policies ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE sales_scripts ALTER COLUMN org_id SET NOT NULL;

-- Índices únicos importantes
CREATE UNIQUE INDEX IF NOT EXISTS professionals_org_user_unique 
  ON professionals(org_id, user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_professionals_org_id ON professionals(org_id);
CREATE INDEX IF NOT EXISTS idx_professional_profiles_org_id ON professional_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_org_id ON service_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_plan_policies_org_id ON plan_policies(org_id);
CREATE INDEX IF NOT EXISTS idx_sales_scripts_org_id ON sales_scripts(org_id);

-- RLS
DROP POLICY IF EXISTS professionals_select ON professionals;
CREATE POLICY professionals_select ON professionals
  FOR SELECT
  USING (is_member_of_org(org_id));

-- Tornar tenant_id NULLABLE
ALTER TABLE professionals ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE professional_profiles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE service_catalog ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE plan_policies ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE sales_scripts ALTER COLUMN tenant_id DROP NOT NULL;

-- Validação
DO $$
DECLARE
  total_null INT := 0;
BEGIN
  SELECT 
    COALESCE(SUM(cnt), 0) INTO total_null
  FROM (
    SELECT COUNT(*) as cnt FROM professionals WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM professional_profiles WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM service_catalog WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM plan_policies WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM sales_scripts WHERE org_id IS NULL
  ) counts;
  
  IF total_null > 0 THEN
    RAISE EXCEPTION 'ONDA 3 - Validação falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 3 - Validação OK: 5 tabelas migradas com sucesso';
END $$;

