-- Índices para performance do módulo de Relacionamento (org_id)
-- Data: 2025-10-03

-- relationship_tasks
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_org_scheduled
  ON public.relationship_tasks (org_id, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_relationship_tasks_org_status
  ON public.relationship_tasks (org_id, status);

CREATE INDEX IF NOT EXISTS idx_relationship_tasks_org_created
  ON public.relationship_tasks (org_id, created_at);

-- students (para o join mínimo)
CREATE INDEX IF NOT EXISTS idx_students_org_id_id
  ON public.students (org_id, id);


