-- Adicionar campo color na tabela kanban_stages para suporte a cores personalizadas
-- Formato: VARCHAR(7) para cores hex (#RRGGBB)
-- Nullable para colunas existentes sem cor definida

ALTER TABLE kanban_stages 
ADD COLUMN color VARCHAR(7) DEFAULT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN kanban_stages.color IS 'Cor do cabeçalho da coluna no formato hex (#RRGGBB)';
