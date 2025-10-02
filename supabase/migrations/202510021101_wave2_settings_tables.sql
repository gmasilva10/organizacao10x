-- ========================================
-- ONDA 2: Configurações e Settings
-- Data: 2025-10-02
-- Objetivo: Migrar tabelas de configuração para org_id
-- ========================================

-- Adicionar org_id
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE settings_audit ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE student_defaults ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE team_defaults ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE readiness_types ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill
UPDATE organization_settings SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE settings_audit SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE student_defaults SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE team_defaults SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE audit_log SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE readiness_types SET org_id = tenant_id WHERE org_id IS NULL;

-- NOT NULL
ALTER TABLE organization_settings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE settings_audit ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE student_defaults ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE team_defaults ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE audit_log ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE readiness_types ALTER COLUMN org_id SET NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_settings_audit_org_id ON settings_audit(org_id);
CREATE INDEX IF NOT EXISTS idx_student_defaults_org_id ON student_defaults(org_id);
CREATE INDEX IF NOT EXISTS idx_team_defaults_org_id ON team_defaults(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_readiness_types_org_id ON readiness_types(org_id);

-- RLS (exemplo para organization_settings)
DROP POLICY IF EXISTS organization_settings_select ON organization_settings;
CREATE POLICY organization_settings_select ON organization_settings
  FOR SELECT
  USING (is_member_of_org(org_id));

-- Tornar tenant_id NULLABLE
ALTER TABLE organization_settings ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE settings_audit ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE student_defaults ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE team_defaults ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE audit_log ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE readiness_types ALTER COLUMN tenant_id DROP NOT NULL;

-- Validação
DO $$
DECLARE
  null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count 
  FROM organization_settings WHERE org_id IS NULL
  UNION ALL
  SELECT COUNT(*) FROM settings_audit WHERE org_id IS NULL
  UNION ALL
  SELECT COUNT(*) FROM student_defaults WHERE org_id IS NULL
  UNION ALL
  SELECT COUNT(*) FROM team_defaults WHERE org_id IS NULL
  UNION ALL
  SELECT COUNT(*) FROM audit_log WHERE org_id IS NULL
  UNION ALL
  SELECT COUNT(*) FROM readiness_types WHERE org_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'ONDA 2 - Validação falhou: % registros com org_id NULL', null_count;
  END IF;
  
  RAISE NOTICE 'ONDA 2 - Validação OK: 6 tabelas migradas com sucesso';
END $$;

