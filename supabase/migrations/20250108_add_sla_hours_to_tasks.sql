-- =====================================================
-- Adicionar coluna sla_hours à tabela service_onboarding_tasks
-- Data: 2025-01-08
-- =====================================================

-- Adicionar coluna sla_hours
ALTER TABLE public.service_onboarding_tasks 
ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT NULL;

-- Criar índice para sla_hours
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tasks_sla_hours 
ON public.service_onboarding_tasks(sla_hours);

-- Comentário
COMMENT ON COLUMN public.service_onboarding_tasks.sla_hours 
IS 'Prazo em horas para conclusão da tarefa (SLA - Service Level Agreement)';
