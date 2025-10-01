-- Quick wins: índices críticos para relacionamento
-- Idempotente

-- relationship_tasks
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_status_scheduled
  ON relationship_tasks(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_student_scheduled
  ON relationship_tasks(student_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_anchor
  ON relationship_tasks(anchor);
CREATE INDEX IF NOT EXISTS idx_relationship_tasks_template_code
  ON relationship_tasks(template_code);

-- relationship_logs
CREATE INDEX IF NOT EXISTS idx_relationship_logs_task_created_at
  ON relationship_logs(task_id, at);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_action
  ON relationship_logs(action);

