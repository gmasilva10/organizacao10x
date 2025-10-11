-- Script para adicionar campo color na tabela kanban_stages
-- Execute este comando diretamente no seu banco de dados PostgreSQL

-- Comando simples para adicionar o campo
ALTER TABLE kanban_stages ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT NULL;

-- Verificar se foi adicionado
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'kanban_stages' 
AND column_name = 'color';
