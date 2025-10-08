-- Migração: Garantir unicidade de posições por organização e limpar duplicatas
-- Data: 2025-10-08
-- Descrição: Adiciona constraint para evitar colunas duplicadas no kanban

-- 1. Remover duplicatas existentes (manter apenas a primeira ocorrência de cada posição por org)
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    -- Para cada combinação de org_id + position que tem duplicatas
    FOR duplicate_record IN
        SELECT org_id, position, MIN(id) as keep_id
        FROM kanban_stages
        GROUP BY org_id, position
        HAVING COUNT(*) > 1
    LOOP
        -- Deletar todas as duplicatas exceto a primeira (keep_id)
        DELETE FROM kanban_stages
        WHERE org_id = duplicate_record.org_id
          AND position = duplicate_record.position
          AND id != duplicate_record.keep_id;
        
        RAISE NOTICE 'Removidas duplicatas para org_id=%, position=%', 
                     duplicate_record.org_id, duplicate_record.position;
    END LOOP;
END $$;

-- 2. Adicionar constraint de unicidade (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'kanban_stages_org_position_unique'
    ) THEN
        ALTER TABLE kanban_stages
        ADD CONSTRAINT kanban_stages_org_position_unique 
        UNIQUE (org_id, position);
        
        RAISE NOTICE 'Constraint kanban_stages_org_position_unique criada com sucesso';
    ELSE
        RAISE NOTICE 'Constraint kanban_stages_org_position_unique já existe';
    END IF;
END $$;

-- 3. Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_kanban_stages_org_position 
ON kanban_stages(org_id, position);

-- 4. Garantir que colunas obrigatórias (#1 e #99) existam para todas as organizações
DO $$
DECLARE
    org_record RECORD;
BEGIN
    -- Para cada organização que tem kanban_stages
    FOR org_record IN
        SELECT DISTINCT org_id FROM kanban_stages
    LOOP
        -- Verificar e criar coluna #1 se não existir
        IF NOT EXISTS (
            SELECT 1 FROM kanban_stages 
            WHERE org_id = org_record.org_id AND position = 1
        ) THEN
            INSERT INTO kanban_stages (org_id, name, position, is_fixed, stage_code)
            VALUES (
                org_record.org_id, 
                'Novo Aluno', 
                1, 
                true, 
                'novo_aluno'
            );
            RAISE NOTICE 'Coluna #1 criada para org_id=%', org_record.org_id;
        END IF;
        
        -- Verificar e criar coluna #99 se não existir
        IF NOT EXISTS (
            SELECT 1 FROM kanban_stages 
            WHERE org_id = org_record.org_id AND position = 99
        ) THEN
            INSERT INTO kanban_stages (org_id, name, position, is_fixed, stage_code)
            VALUES (
                org_record.org_id, 
                'Entrega do Treino', 
                99, 
                true, 
                'entrega_treino'
            );
            RAISE NOTICE 'Coluna #99 criada para org_id=%', org_record.org_id;
        END IF;
    END LOOP;
END $$;

-- 5. Adicionar comentários para documentação
COMMENT ON CONSTRAINT kanban_stages_org_position_unique ON kanban_stages IS 
'Garante que cada organização tenha apenas uma coluna por posição no kanban';

COMMENT ON COLUMN kanban_stages.position IS 
'Posição da coluna no kanban. Posições 1 e 99 são reservadas e obrigatórias para todas as organizações';

COMMENT ON COLUMN kanban_stages.is_fixed IS 
'Indica se a coluna é fixa (posições 1 e 99). Colunas fixas não podem ser deletadas';
