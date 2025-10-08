-- Migração: Corrigir políticas RLS para onboarding
-- Data: 2025-10-08
-- Descrição: Criar políticas RLS necessárias para service_onboarding_tasks e kanban_logs

-- Habilitar RLS na tabela service_onboarding_tasks
ALTER TABLE service_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Criar política de SELECT para service_onboarding_tasks
DROP POLICY IF EXISTS "select_tasks_org_policy" ON service_onboarding_tasks;
CREATE POLICY "select_tasks_org_policy" ON service_onboarding_tasks 
FOR SELECT USING (is_member_of_org(org_id));

-- Criar política de INSERT para service_onboarding_tasks
DROP POLICY IF EXISTS "insert_tasks_org_policy" ON service_onboarding_tasks;
CREATE POLICY "insert_tasks_org_policy" ON service_onboarding_tasks 
FOR INSERT WITH CHECK (is_member_of_org(org_id));

-- Criar política de UPDATE para service_onboarding_tasks
DROP POLICY IF EXISTS "update_tasks_org_policy" ON service_onboarding_tasks;
CREATE POLICY "update_tasks_org_policy" ON service_onboarding_tasks 
FOR UPDATE USING (is_member_of_org(org_id)) WITH CHECK (is_member_of_org(org_id));

-- Criar política de DELETE para service_onboarding_tasks
DROP POLICY IF EXISTS "delete_tasks_org_policy" ON service_onboarding_tasks;
CREATE POLICY "delete_tasks_org_policy" ON service_onboarding_tasks 
FOR DELETE USING (is_member_of_org(org_id));

-- Habilitar RLS na tabela kanban_logs
ALTER TABLE kanban_logs ENABLE ROW LEVEL SECURITY;

-- Criar política de INSERT para kanban_logs
DROP POLICY IF EXISTS "insert_kanban_logs_org_policy" ON kanban_logs;
CREATE POLICY "insert_kanban_logs_org_policy" ON kanban_logs 
FOR INSERT WITH CHECK (is_member_of_org(org_id));

-- Criar política de SELECT para kanban_logs
DROP POLICY IF EXISTS "select_kanban_logs_org_policy" ON kanban_logs;
CREATE POLICY "select_kanban_logs_org_policy" ON kanban_logs 
FOR SELECT USING (is_member_of_org(org_id));
