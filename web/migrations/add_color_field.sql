-- Script para adicionar campo color na tabela kanban_stages
-- Execute este script diretamente no seu banco de dados se a migration não foi aplicada

-- Verificar se o campo já existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'kanban_stages' 
        AND column_name = 'color'
    ) THEN
        -- Adicionar campo color se não existir
        ALTER TABLE kanban_stages 
        ADD COLUMN color VARCHAR(7) DEFAULT NULL;
        
        -- Adicionar comentário para documentação
        COMMENT ON COLUMN kanban_stages.color IS 'Cor do cabeçalho da coluna no formato hex (#RRGGBB)';
        
        RAISE NOTICE 'Campo color adicionado com sucesso na tabela kanban_stages';
    ELSE
        RAISE NOTICE 'Campo color já existe na tabela kanban_stages';
    END IF;
END $$;
