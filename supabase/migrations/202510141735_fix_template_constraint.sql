-- Migration: Fix Template Constraint - Remove Global Code Constraint
-- Data: 2025-10-14 17:35
-- Problema: Constraint global relationship_templates_v2_code_key impede multi-tenancy
-- Solução: Remover constraint global e manter apenas constraint por organização

-- Remover constraint global incorreta que impede multi-tenancy
ALTER TABLE relationship_templates_v2 
DROP CONSTRAINT IF EXISTS relationship_templates_v2_code_key;

-- Garantir que constraint por organização existe (já existe: uq_relationship_templates_v2_org_code)
-- Esta constraint permite que diferentes organizações usem o mesmo código
-- Ex: Org A pode ter código "0001" e Org B também pode ter código "0001"

-- Adicionar comentário explicativo para prevenir reintrodução da constraint global
COMMENT ON CONSTRAINT uq_relationship_templates_v2_org_code 
ON relationship_templates_v2 IS 
'Garante código único por organização (multi-tenancy). 
NUNCA adicionar constraint global no código - isso viola multi-tenancy.';

-- Log da migration
INSERT INTO migration_logs (migration_name, applied_at, description) 
VALUES (
  '202510141735_fix_template_constraint', 
  NOW(), 
  'Removida constraint global relationship_templates_v2_code_key para permitir multi-tenancy adequado'
) ON CONFLICT DO NOTHING;
