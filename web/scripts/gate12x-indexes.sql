-- GATE 12X: Análise e criação de índices para performance
-- Executar no Supabase SQL Editor

-- 1. ANÁLISE ATUAL - Executar EXPLAIN ANALYZE antes das otimizações

-- Students - consultas mais comuns
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name, status, created_at 
FROM students 
WHERE tenant_id = 'test-tenant-id' 
  AND deleted_at IS NULL 
  AND status = 'active'
ORDER BY created_at DESC 
LIMIT 20;

-- Occurrences - consultas mais comuns  
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, occurred_at, status, group_id, type_id
FROM student_occurrences 
WHERE tenant_id = 'test-tenant-id' 
  AND status = 'OPEN'
ORDER BY occurred_at DESC 
LIMIT 20;

-- Kanban items - consultas mais comuns
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, stage_id, position
FROM kanban_items 
WHERE org_id = 'test-tenant-id'
ORDER BY position ASC;

-- 2. CRIAÇÃO DE ÍNDICES OTIMIZADOS

-- Students - índices para filtros comuns
CREATE INDEX IF NOT EXISTS idx_students_tenant_status_created 
ON students (tenant_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_students_tenant_deleted 
ON students (tenant_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Student occurrences - índices para filtros e ordenação
CREATE INDEX IF NOT EXISTS idx_occurrences_tenant_status_occurred 
ON student_occurrences (tenant_id, status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_occurrences_tenant_group_type 
ON student_occurrences (tenant_id, group_id, type_id);

CREATE INDEX IF NOT EXISTS idx_occurrences_tenant_owner 
ON student_occurrences (tenant_id, owner_user_id) 
WHERE owner_user_id IS NOT NULL;

-- Kanban items - índices para ordenação e filtros
CREATE INDEX IF NOT EXISTS idx_kanban_org_position 
ON kanban_items (org_id, position ASC);

CREATE INDEX IF NOT EXISTS idx_kanban_org_stage 
ON kanban_items (org_id, stage_id);

-- Occurrence groups e types - índices para joins
CREATE INDEX IF NOT EXISTS idx_occurrence_groups_tenant_active 
ON occurrence_groups (tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_occurrence_types_tenant_group 
ON occurrence_types (tenant_id, group_id, is_active) 
WHERE is_active = true;

-- 3. ANÁLISE PÓS-OTIMIZAÇÃO - Executar novamente para comparar

-- Students - após índices
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name, status, created_at 
FROM students 
WHERE tenant_id = 'test-tenant-id' 
  AND deleted_at IS NULL 
  AND status = 'active'
ORDER BY created_at DESC 
LIMIT 20;

-- Occurrences - após índices
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, occurred_at, status, group_id, type_id
FROM student_occurrences 
WHERE tenant_id = 'test-tenant-id' 
  AND status = 'OPEN'
ORDER BY occurred_at DESC 
LIMIT 20;

-- Kanban items - após índices
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, stage_id, position
FROM kanban_items 
WHERE org_id = 'test-tenant-id'
ORDER BY position ASC;
