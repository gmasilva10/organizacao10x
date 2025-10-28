-- =====================================================
-- ADICIONAR CAMPOS DE CONCLUSÃO AO KANBAN_ITEMS
-- =====================================================

-- Adicionar campos para rastrear conclusão de cards
ALTER TABLE public.kanban_items 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

-- Criar índice para consultas por status
CREATE INDEX IF NOT EXISTS idx_kanban_items_status ON public.kanban_items(status);
CREATE INDEX IF NOT EXISTS idx_kanban_items_completed_at ON public.kanban_items(completed_at);

-- Comentários para documentação
COMMENT ON COLUMN public.kanban_items.completed_at IS 'Data e hora da conclusão do card';
COMMENT ON COLUMN public.kanban_items.status IS 'Status do card: active, completed, archived';
