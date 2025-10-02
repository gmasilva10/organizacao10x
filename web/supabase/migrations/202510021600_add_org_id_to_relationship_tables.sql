-- ============================================================================
-- MIGRAÇÃO: Adicionar org_id às tabelas de relacionamento restantes
-- ============================================================================
-- Data: 2025-10-02
-- Descrição: Adiciona coluna org_id às tabelas relationship_tasks e relationship_logs
--            que foram perdidas durante a migração anterior

-- Adicionar org_id à tabela relationship_tasks
ALTER TABLE relationship_tasks 
ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Adicionar org_id à tabela relationship_logs  
ALTER TABLE relationship_logs 
ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Backfill: Copiar org_id dos alunos para as tarefas
UPDATE relationship_tasks 
SET org_id = s.org_id
FROM students s 
WHERE relationship_tasks.student_id = s.id;

-- Backfill: Copiar org_id dos alunos para os logs
UPDATE relationship_logs 
SET org_id = s.org_id
FROM students s 
WHERE relationship_logs.student_id = s.id;

-- Tornar org_id NOT NULL
ALTER TABLE relationship_tasks 
ALTER COLUMN org_id SET NOT NULL;

ALTER TABLE relationship_logs 
ALTER COLUMN org_id SET NOT NULL;

-- Criar índices para performance
CREATE INDEX idx_relationship_tasks_org_id ON relationship_tasks(org_id);
CREATE INDEX idx_relationship_tasks_org_id_status ON relationship_tasks(org_id, status);
CREATE INDEX idx_relationship_tasks_org_id_scheduled ON relationship_tasks(org_id, scheduled_for);

CREATE INDEX idx_relationship_logs_org_id ON relationship_logs(org_id);
CREATE INDEX idx_relationship_logs_org_id_created ON relationship_logs(org_id, created_at);

-- Atualizar RLS policies para usar org_id
DROP POLICY IF EXISTS "relationship_tasks_select_policy" ON relationship_tasks;
DROP POLICY IF EXISTS "relationship_tasks_insert_policy" ON relationship_tasks;
DROP POLICY IF EXISTS "relationship_tasks_update_policy" ON relationship_tasks;
DROP POLICY IF EXISTS "relationship_tasks_delete_policy" ON relationship_tasks;

DROP POLICY IF EXISTS "relationship_logs_select_policy" ON relationship_logs;
DROP POLICY IF EXISTS "relationship_logs_insert_policy" ON relationship_logs;
DROP POLICY IF EXISTS "relationship_logs_update_policy" ON relationship_logs;
DROP POLICY IF EXISTS "relationship_logs_delete_policy" ON relationship_logs;

-- RLS Policies para relationship_tasks
CREATE POLICY "relationship_tasks_select_policy" ON relationship_tasks
  FOR SELECT USING (is_member_of_org(org_id));

CREATE POLICY "relationship_tasks_insert_policy" ON relationship_tasks
  FOR INSERT WITH CHECK (is_member_of_org(org_id));

CREATE POLICY "relationship_tasks_update_policy" ON relationship_tasks
  FOR UPDATE USING (is_member_of_org(org_id));

CREATE POLICY "relationship_tasks_delete_policy" ON relationship_tasks
  FOR DELETE USING (is_member_of_org(org_id));

-- RLS Policies para relationship_logs
CREATE POLICY "relationship_logs_select_policy" ON relationship_logs
  FOR SELECT USING (is_member_of_org(org_id));

CREATE POLICY "relationship_logs_insert_policy" ON relationship_logs
  FOR INSERT WITH CHECK (is_member_of_org(org_id));

CREATE POLICY "relationship_logs_update_policy" ON relationship_logs
  FOR UPDATE USING (is_member_of_org(org_id));

CREATE POLICY "relationship_logs_delete_policy" ON relationship_logs
  FOR DELETE USING (is_member_of_org(org_id));
