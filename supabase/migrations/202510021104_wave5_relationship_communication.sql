-- ========================================
-- ONDA 5: Relacionamento e Comunicação
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

-- Índices
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

-- Validação
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
    RAISE EXCEPTION 'ONDA 5 - Validação falhou: % registros com org_id NULL', total_null;
  END IF;
  
  RAISE NOTICE 'ONDA 5 - Validação OK: 12 tabelas migradas com sucesso';
END $$;

