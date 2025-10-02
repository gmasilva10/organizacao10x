-- ========================================
-- ONDA 1: AutenticaÃ§Ã£o e Controle de Acesso
-- Data: 2025-10-02
-- Objetivo: Migrar memberships, profiles, tenant_users para org_id
-- ========================================

-- 1. Adicionar org_id Ã s tabelas
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

-- 4. Criar Ã­ndices
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

-- 6. Atualizar polÃ­ticas RLS
DROP POLICY IF EXISTS memberships_select ON memberships;
CREATE POLICY memberships_select ON memberships
  FOR SELECT
  USING (user_id = auth.uid() OR is_member_of_org(org_id));

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (id = auth.uid() OR is_member_of_org(org_id));

-- 7. Tornar tenant_id NULLABLE (preparaÃ§Ã£o para remoÃ§Ã£o futura)
ALTER TABLE memberships ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE tenant_users ALTER COLUMN tenant_id DROP NOT NULL;

-- ValidaÃ§Ã£o: Verificar que todas as linhas tÃªm org_id
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
    RAISE EXCEPTION 'ONDA 1 - ValidaÃ§Ã£o falhou: memberships=%, profiles=%, tenant_users=%', 
      null_count_memberships, null_count_profiles, null_count_tenant_users;
  END IF;
  
  RAISE NOTICE 'ONDA 1 - ValidaÃ§Ã£o OK: memberships, profiles, tenant_users migrados com sucesso';
END $$;

-- ========================================
-- ONDA 2: ConfiguraÃ§Ãµes e Settings
-- Data: 2025-10-02
-- Objetivo: Migrar tabelas de configuraÃ§Ã£o para org_id
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

-- Ãndices
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

-- ValidaÃ§Ã£o
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
    RAISE EXCEPTION 'ONDA 2 - ValidaÃ§Ã£o falhou: % registros com org_id NULL', null_count;
  END IF;
  
  RAISE NOTICE 'ONDA 2 - ValidaÃ§Ã£o OK: 6 tabelas migradas com sucesso';
END $$;

-- ========================================
-- ONDA 3: Profissionais e ServiÃ§os
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

-- Ãndices Ãºnicos importantes
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

-- ValidaÃ§Ã£o
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
    RAISE EXCEPTION 'ONDA 3 - ValidaÃ§Ã£o falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 3 - ValidaÃ§Ã£o OK: 5 tabelas migradas com sucesso';
END $$;

-- ========================================
-- ONDA 4: OcorrÃªncias e Workflow
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

-- Ãndices
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

-- ValidaÃ§Ã£o
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
    RAISE EXCEPTION 'ONDA 4 - ValidaÃ§Ã£o falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 4 - ValidaÃ§Ã£o OK: 7 tabelas migradas com sucesso';
END $$;

-- ========================================
-- ONDA 5: Relacionamento e ComunicaÃ§Ã£o
-- Data: 2025-10-02
-- Objetivo: Migrar relationship, whatsapp, messages para org_id
-- ========================================

-- Adicionar org_id (12 tabelas)
ALTER TABLE relationship_templates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE relationship_messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE relacionamento_messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE relationship_whatsapp_entities ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE relationship_whatsapp_history ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE student_whatsapp_groups ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill
UPDATE relationship_templates SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE relationship_messages SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE relacionamento_messages SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE relationship_whatsapp_entities SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE relationship_whatsapp_history SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE messages SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE client_messages SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE campaigns SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE events SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE whatsapp_groups SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE student_whatsapp_groups SET org_id = tenant_id WHERE org_id IS NULL;
UPDATE clients SET org_id = tenant_id WHERE org_id IS NULL;

-- NOT NULL
ALTER TABLE relationship_templates ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE relationship_messages ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE relacionamento_messages ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE relationship_whatsapp_entities ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE relationship_whatsapp_history ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE messages ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE client_messages ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE campaigns ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE whatsapp_groups ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE student_whatsapp_groups ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE clients ALTER COLUMN org_id SET NOT NULL;

-- Ãndices
CREATE INDEX IF NOT EXISTS idx_relationship_templates_org_id ON relationship_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_relationship_messages_org_id ON relationship_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_relationship_whatsapp_entities_org_id ON relationship_whatsapp_entities(org_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_org_id ON whatsapp_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_student_whatsapp_groups_org_id ON student_whatsapp_groups(org_id);

-- RLS (aplicar para todas as tabelas)
DROP POLICY IF EXISTS relationship_templates_select ON relationship_templates;
CREATE POLICY relationship_templates_select ON relationship_templates
  FOR SELECT
  USING (is_member_of_org(org_id));

-- Tornar tenant_id NULLABLE
ALTER TABLE relationship_templates ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE relationship_messages ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE relacionamento_messages ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE relationship_whatsapp_entities ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE relationship_whatsapp_history ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE messages ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE client_messages ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE campaigns ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE events ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE whatsapp_groups ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE student_whatsapp_groups ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN tenant_id DROP NOT NULL;

-- ValidaÃ§Ã£o
DO $$
DECLARE
  total_null INT := 0;
BEGIN
  SELECT 
    COALESCE(SUM(cnt), 0) INTO total_null
  FROM (
    SELECT COUNT(*) as cnt FROM relationship_templates WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM relationship_messages WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM relacionamento_messages WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM relationship_whatsapp_entities WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM relationship_whatsapp_history WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM messages WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM client_messages WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM campaigns WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM events WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM whatsapp_groups WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM student_whatsapp_groups WHERE org_id IS NULL
    UNION ALL
    SELECT COUNT(*) FROM clients WHERE org_id IS NULL
  ) counts;
  
  IF total_null > 0 THEN
    RAISE EXCEPTION 'ONDA 5 - ValidaÃ§Ã£o falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 5 - ValidaÃ§Ã£o OK: 12 tabelas migradas com sucesso';
END $$;

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

-- Ãndices
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

-- ValidaÃ§Ã£o
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
    RAISE EXCEPTION 'ONDA 6 - ValidaÃ§Ã£o falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 6 - ValidaÃ§Ã£o OK: 10 tabelas migradas com sucesso';
END $$;

