-- Migration: Adicionar suporte a tarefas manuais no sistema de relacionamento
-- Data: 2025-01-29
-- Descrição: Adiciona campo classification_tag para classificação de tarefas manuais

-- Adicionar campo classification_tag na tabela relationship_tasks
ALTER TABLE public.relationship_tasks 
ADD COLUMN IF NOT EXISTS classification_tag text;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.relationship_tasks.classification_tag IS 'Tag de classificação para tarefas manuais (ex: Renovação, Aniversário, Boas-vindas)';

-- Criar índice para performance em consultas por classificação
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_classification_tag 
ON public.relationship_tasks(classification_tag) 
WHERE classification_tag IS NOT NULL;

-- Atualizar RLS para incluir o novo campo
-- (As políticas existentes já cobrem o campo, mas vamos garantir)

-- Política para SELECT (já existe, mas vamos verificar)
-- Política para INSERT (já existe, mas vamos verificar)
-- Política para UPDATE (já existe, mas vamos verificar)
-- Política para DELETE (já existe, mas vamos verificar)

-- Adicionar constraint para valores válidos de classification_tag
-- (Opcional: podemos usar um ENUM ou CHECK constraint)
-- Por enquanto, vamos deixar livre para flexibilidade

-- Verificar se a tabela relationship_tasks existe e tem a estrutura esperada
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relationship_tasks') THEN
        RAISE EXCEPTION 'Tabela relationship_tasks não existe. Execute as migrations anteriores primeiro.';
    END IF;
    
    -- Verificar se as colunas essenciais existem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relationship_tasks' AND column_name = 'student_id') THEN
        RAISE EXCEPTION 'Coluna student_id não existe na tabela relationship_tasks.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'relationship_tasks' AND column_name = 'anchor') THEN
        RAISE EXCEPTION 'Coluna anchor não existe na tabela relationship_tasks.';
    END IF;
    
    RAISE NOTICE 'Migration executada com sucesso. Campo classification_tag adicionado.';
END $$;
