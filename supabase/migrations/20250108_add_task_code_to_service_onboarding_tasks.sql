-- =====================================================
-- Adicionar coluna task_code à tabela service_onboarding_tasks
-- Data: 2025-01-08
-- =====================================================

-- Adicionar coluna task_code
ALTER TABLE public.service_onboarding_tasks 
ADD COLUMN IF NOT EXISTS task_code TEXT;

-- Criar índice para task_code
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tasks_task_code 
ON public.service_onboarding_tasks(task_code);

-- Atualizar registros existentes para gerar task_code
UPDATE public.service_onboarding_tasks
SET task_code = stage_code || '_' || LPAD(order_index::TEXT, 3, '0')
WHERE task_code IS NULL;

-- Comentário
COMMENT ON COLUMN public.service_onboarding_tasks.task_code IS 'Código único da tarefa no formato stage_code_order_index (ex: novo_aluno_001)';
