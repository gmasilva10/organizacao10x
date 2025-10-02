-- ========================================
-- ONDA 4: Ocorrências e Workflow
-- Data: 2025-10-02
-- Objetivo: Migrar occurrences, workflow para org_id
-- ========================================

-- Adicionar org_id
ALTER TABLE occurrence_types ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE occurrence_groups ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE student_occurrences ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE student_occurrence_attachments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE student_responsibles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE onboarding_cards ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE onboarding_columns ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill
UPDATE occurrence_types SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE occurrence_groups SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE student_occurrences SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE student_occurrence_attachments SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE student_responsibles SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE onboarding_cards SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE onboarding_columns SET org_id = tenant_id WHERE org_id IS NULL;

-- NOT NULL
ALTER TABLE occurrence_types ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE occurrence_groups ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE student_occurrences ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE student_occurrence_attachments ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE student_responsibles ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE onboarding_cards ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE onboarding_columns ALTER COLUMN org_id SET NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_occurrence_types_org_id ON occurrence_types(org_id);
CREATE INDEX IF NOT EXISTS idx_occurrence_groups_org_id ON occurrence_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_org_id ON student_occurrences(org_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrences_student_org ON student_occurrences(student_id, org_id);
CREATE INDEX IF NOT EXISTS idx_student_occurrence_attachments_org_id ON student_occurrence_attachments(org_id);
CREATE INDEX IF NOT EXISTS idx_student_responsibles_org_id ON student_responsibles(org_id);
CREATE INDEX IF NOT EXISTS idx_student_responsibles_student_org ON student_responsibles(student_id, org_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cards_org_id ON onboarding_cards(org_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_columns_org_id ON onboarding_columns(org_id);

-- RLS (exemplo para student_occurrences)
DROP POLICY IF EXISTS student_occurrences_select ON student_occurrences;
CREATE POLICY student_occurrences_select ON student_occurrences
  FOR SELECT
  USING (is_member_of_org(org_id));

-- Tornar tenant_id NULLABLE
ALTER TABLE occurrence_types ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE occurrence_groups ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE student_occurrences ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE student_occurrence_attachments ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE student_responsibles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE onboarding_cards ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE onboarding_columns ALTER COLUMN tenant_id DROP NOT NULL;

-- Validação
DO $$
DECLARE
  total_null INT := 0;
BEGIN
  SELECT 
    COALESCE(SUM(cnt), 0) INTO total_null
  FROM (
    SELECT COUNT(*) as cnt FROM occurrence_types WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM occurrence_groups WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM student_occurrences WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM student_occurrence_attachments WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM student_responsibles WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM onboarding_cards WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM onboarding_columns WHERE org_id IS NULL
  ) counts;
  
  IF total_null > 0 THEN
    RAISE EXCEPTION 'ONDA 4 - Validação falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 4 - Validação OK: 7 tabelas migradas com sucesso';
END $$;

