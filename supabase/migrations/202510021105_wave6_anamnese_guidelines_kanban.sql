-- ========================================
-- ONDA 6: Anamnese, Guidelines e Kanban
-- Data: 2025-10-02
-- Objetivo: Migrar anamnese, guidelines, kanban para org_id
-- ========================================

-- Adicionar org_id
ALTER TABLE anamnese_versions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE anamnese_questions_snapshot ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE anamnese_invites ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE anamnese_responses ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE anamnese_answers ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE guidelines_versions ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE guideline_rules ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE anthro_protocols ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE kanban_columns ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill
UPDATE anamnese_versions SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE anamnese_questions_snapshot SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE anamnese_invites SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE anamnese_responses SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE anamnese_answers SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE guidelines_versions SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE guideline_rules SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE anthro_protocols SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE kanban_cards SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE kanban_columns SET org_id = tenant_id WHERE org_id IS NULL;

-- NOT NULL
ALTER TABLE anamnese_versions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE anamnese_questions_snapshot ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE anamnese_invites ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE anamnese_responses ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE anamnese_answers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE guidelines_versions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE guideline_rules ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE anthro_protocols ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE kanban_cards ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE kanban_columns ALTER COLUMN org_id SET NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_anamnese_versions_org_id ON anamnese_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_guidelines_versions_org_id ON guidelines_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_guideline_rules_org_id ON guideline_rules(org_id);

-- RLS
DROP POLICY IF EXISTS guidelines_versions_select ON guidelines_versions;
CREATE POLICY guidelines_versions_select ON guidelines_versions
  FOR SELECT
  USING (is_member_of_org(org_id));

-- Tornar tenant_id NULLABLE
ALTER TABLE anamnese_versions ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE anamnese_questions_snapshot ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE anamnese_invites ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE anamnese_responses ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE anamnese_answers ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE guidelines_versions ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE guideline_rules ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE anthro_protocols ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE kanban_cards ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE kanban_columns ALTER COLUMN tenant_id DROP NOT NULL;

-- Validação
DO $$
DECLARE
  total_null INT := 0;
BEGIN
  SELECT 
    COALESCE(SUM(cnt), 0) INTO total_null
  FROM (
    SELECT COUNT(*) as cnt FROM anamnese_versions WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM anamnese_questions_snapshot WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM anamnese_invites WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM anamnese_responses WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM anamnese_answers WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM guidelines_versions WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM guideline_rules WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM anthro_protocols WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM kanban_cards WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM kanban_columns WHERE org_id IS NULL
  ) counts;
  
  IF total_null > 0 THEN
    RAISE EXCEPTION 'ONDA 6 - Validação falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 6 - Validação OK: 10 tabelas migradas com sucesso';
END $$;

