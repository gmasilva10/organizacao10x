-- GATE D2.5: Adicionar campo title em guidelines_versions
-- Data: 2025-01-09
-- Objetivo: Permitir títulos amigáveis para versões de diretrizes

-- Adicionar coluna title
ALTER TABLE guidelines_versions 
ADD COLUMN title text NOT NULL DEFAULT '';

-- Atualizar registros existentes com título padrão
UPDATE guidelines_versions 
SET title = 'Diretrizes Denis Foschini' 
WHERE title = '';

-- Comentário da coluna
COMMENT ON COLUMN guidelines_versions.title IS 'Título amigável da versão (editável apenas em DRAFT)';

-- Índice para busca por título (opcional, mas útil)
CREATE INDEX idx_guidelines_versions_title ON guidelines_versions USING gin (to_tsvector('portuguese', title));
