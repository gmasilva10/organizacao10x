-- =====================================================
-- GATE 10.7 - Padronização de Status do Relacionamento
-- =====================================================
-- Data: 2025-09-30
-- Objetivo: Padronizar status, adicionar soft delete e otimizar índices

-- 1. Adicionar coluna deleted_at para auditoria de soft delete
ALTER TABLE public.relationship_tasks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.relationship_tasks.deleted_at IS 'Timestamp de soft delete para auditoria e undo';

-- 2. Normalizar valores legados de status
-- Mapear qualquer valor não reconhecido para 'pending'
UPDATE public.relationship_tasks
SET status = 'pending'
WHERE status NOT IN ('pending', 'sent', 'postponed', 'skipped', 'deleted');

-- 3. Adicionar DEFAULT para novas inserções
ALTER TABLE public.relationship_tasks 
ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Adicionar CHECK constraint para valores permitidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'relationship_tasks_status_check'
  ) THEN
    ALTER TABLE public.relationship_tasks 
    ADD CONSTRAINT relationship_tasks_status_check 
    CHECK (status IN ('pending', 'sent', 'postponed', 'skipped', 'deleted'));
  END IF;
END $$;

-- 5. Criar índices otimizados para queries por status e data
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_status_scheduled 
ON public.relationship_tasks(status, scheduled_for)
WHERE status != 'deleted';

CREATE INDEX IF NOT EXISTS idx_relationship_tasks_scheduled_for 
ON public.relationship_tasks(scheduled_for)
WHERE status != 'deleted';

CREATE INDEX IF NOT EXISTS idx_relationship_tasks_deleted_at 
ON public.relationship_tasks(deleted_at)
WHERE deleted_at IS NOT NULL;

-- 6. Garantir que sent_at existe (para quando status = 'sent')
ALTER TABLE public.relationship_tasks 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.relationship_tasks.sent_at IS 'Timestamp de envio da mensagem (quando status = sent)';

-- 7. Criar índice para soft deletes recentes (suporte a undo dentro de 5s)
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_recent_deleted 
ON public.relationship_tasks(id, deleted_at)
WHERE deleted_at IS NOT NULL 
  AND deleted_at > (NOW() - INTERVAL '10 seconds');

-- 8. Comentários explicativos
COMMENT ON CONSTRAINT relationship_tasks_status_check ON public.relationship_tasks IS 
  'Status permitidos: pending (aguardando envio), sent (enviada), postponed (adiada), skipped (pulada), deleted (excluída)';

-- 9. Log de execução
DO $$
BEGIN
  RAISE NOTICE '✅ GATE 10.7 - Migration executada com sucesso';
  RAISE NOTICE '   - Campo deleted_at adicionado';
  RAISE NOTICE '   - Status legados normalizados para pending';
  RAISE NOTICE '   - CHECK constraint aplicado: pending|sent|postponed|skipped|deleted';
  RAISE NOTICE '   - DEFAULT status = pending';
  RAISE NOTICE '   - Índices otimizados criados';
END $$;

