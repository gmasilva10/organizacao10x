-- Script para limpar duplicatas e adicionar constraint
-- Execute este SQL no Supabase SQL Editor ou via psql

-- 1. Verificar duplicatas antes de remover
SELECT org_id, position, COUNT(*) as count
FROM kanban_stages
GROUP BY org_id, position
HAVING COUNT(*) > 1
ORDER BY org_id, position;

-- 2. Remover duplicatas (manter apenas a primeira ocorrência)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY org_id, position ORDER BY created_at, id) as rn
    FROM kanban_stages
)
DELETE FROM kanban_stages
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Adicionar constraint de unicidade
ALTER TABLE kanban_stages
DROP CONSTRAINT IF EXISTS kanban_stages_org_position_unique;

ALTER TABLE kanban_stages
ADD CONSTRAINT kanban_stages_org_position_unique 
UNIQUE (org_id, position);

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_kanban_stages_org_position 
ON kanban_stages(org_id, position);

-- 5. Verificar resultado
SELECT org_id, position, name, is_fixed, stage_code
FROM kanban_stages
ORDER BY org_id, position;
