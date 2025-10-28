-- Migration: Create onboarding_history table
-- Data: 2025-10-15 12:30
-- Objetivo: Criar tabela para armazenar histórico completo de onboardings finalizados

CREATE TABLE IF NOT EXISTS public.onboarding_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  kanban_item_id UUID NOT NULL REFERENCES public.kanban_items(id) ON DELETE CASCADE,
  
  -- Dados de conclusão
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Rastreamento de caminho
  initial_stage_id UUID NOT NULL REFERENCES public.kanban_stages(id),
  final_stage_id UUID NOT NULL REFERENCES public.kanban_stages(id),
  
  -- Histórico detalhado (array de objetos com stage_id, stage_name, entered_at, exited_at, tasks_completed)
  path_taken JSONB NOT NULL DEFAULT '[]',
  
  -- Resumo de métricas
  total_days INTEGER, -- dias totais no onboarding
  total_tasks_completed INTEGER, -- total de tarefas concluídas
  
  -- Metadados adicionais
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_onboarding_history_org_id ON public.onboarding_history(org_id);
CREATE INDEX idx_onboarding_history_student_id ON public.onboarding_history(student_id);
CREATE INDEX idx_onboarding_history_completed_at ON public.onboarding_history(completed_at DESC);
CREATE INDEX idx_onboarding_history_kanban_item_id ON public.onboarding_history(kanban_item_id);

-- RLS (Row Level Security)
ALTER TABLE public.onboarding_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history from their organization" 
  ON public.onboarding_history FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage history" 
  ON public.onboarding_history FOR ALL
  USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_onboarding_history_updated_at
  BEFORE UPDATE ON public.onboarding_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.onboarding_history IS 'Histórico completo de onboardings finalizados com caminho percorrido e métricas';
COMMENT ON COLUMN public.onboarding_history.path_taken IS 'Array JSONB com histórico detalhado de cada estágio percorrido';
COMMENT ON COLUMN public.onboarding_history.total_days IS 'Duração total do onboarding em dias';
COMMENT ON COLUMN public.onboarding_history.total_tasks_completed IS 'Número total de tarefas concluídas durante o onboarding';
COMMENT ON COLUMN public.onboarding_history.metadata IS 'Metadados adicionais como título do card e notas de conclusão';
