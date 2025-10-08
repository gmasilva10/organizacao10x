-- Migração completa para limpeza de todas as referências tenant_id
-- Data: 2025-01-08
-- Objetivo: Remover TODAS as referências a tenant_id e garantir uso consistente de org_id

-- =====================================================
-- 1. CORRIGIR POLÍTICAS RLS QUE AINDA USAM TENANT_ID
-- =====================================================

-- Corrigir políticas de relationship_logs_table
DROP POLICY IF EXISTS "relationship_logs_select_policy" ON public.relationship_logs;
DROP POLICY IF EXISTS "relationship_logs_insert_policy" ON public.relationship_logs;
DROP POLICY IF EXISTS "relationship_logs_update_policy" ON public.relationship_logs;
DROP POLICY IF EXISTS "relationship_logs_delete_policy" ON public.relationship_logs;

CREATE POLICY "relationship_logs_select_policy" ON public.relationship_logs
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE org_id IN (
                SELECT org_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_logs_insert_policy" ON public.relationship_logs
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM public.students 
            WHERE org_id IN (
                SELECT org_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_logs_update_policy" ON public.relationship_logs
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE org_id IN (
                SELECT org_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_logs_delete_policy" ON public.relationship_logs
    FOR DELETE USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE org_id IN (
                SELECT org_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Corrigir políticas de professionals
DROP POLICY IF EXISTS "professionals_select_policy" ON public.professionals;
DROP POLICY IF EXISTS "professionals_insert_policy" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_policy" ON public.professionals;
DROP POLICY IF EXISTS "professionals_delete_policy" ON public.professionals;

CREATE POLICY "professionals_select_policy" ON public.professionals
    FOR SELECT USING (
        org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1)
        AND is_active = true
    );

CREATE POLICY "professionals_insert_policy" ON public.professionals
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY "professionals_update_policy" ON public.professionals
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY "professionals_delete_policy" ON public.professionals
    FOR DELETE USING (
        org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1)
    );

-- Corrigir políticas de anamnese_invites
DROP POLICY IF EXISTS "anamnese_invites_tenant_policy" ON anamnese_invites;
CREATE POLICY "anamnese_invites_org_policy" ON anamnese_invites
    USING (org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1));

-- Corrigir políticas de anamnese_responses
DROP POLICY IF EXISTS "anamnese_responses_tenant_policy" ON anamnese_responses;
CREATE POLICY "anamnese_responses_org_policy" ON anamnese_responses
    USING (org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() LIMIT 1));

-- =====================================================
-- 2. CORRIGIR POLÍTICAS RLS QUE USAM MEMBERSHIPS.TENANT_ID
-- =====================================================

-- Corrigir políticas de collaborators
DROP POLICY IF EXISTS "collaborators_org_isolation" ON public.collaborators;
CREATE POLICY "collaborators_org_isolation" ON public.collaborators
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM public.memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Corrigir políticas de professional_profiles
DROP POLICY IF EXISTS "professional_profiles_tenant_isolation" ON professional_profiles;
CREATE POLICY "professional_profiles_org_isolation" ON professional_profiles
    FOR ALL USING (org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active' LIMIT 1));

-- Corrigir políticas de professionals
DROP POLICY IF EXISTS "professionals_tenant_isolation" ON professionals;
CREATE POLICY "professionals_org_isolation" ON professionals
    FOR ALL USING (org_id = (SELECT org_id FROM memberships WHERE user_id = auth.uid() AND status = 'active' LIMIT 1));

-- =====================================================
-- 3. CORRIGIR POLÍTICAS RLS DE OCORRÊNCIAS
-- =====================================================

-- Corrigir políticas de occurrence_groups
DROP POLICY IF EXISTS "Users can view occurrence groups from their tenant" ON occurrence_groups;
DROP POLICY IF EXISTS "Users can insert occurrence groups in their tenant" ON occurrence_groups;
DROP POLICY IF EXISTS "Users can update occurrence groups in their tenant" ON occurrence_groups;
DROP POLICY IF EXISTS "Users can delete occurrence groups in their tenant" ON occurrence_groups;

CREATE POLICY "Users can view occurrence groups from their organization" ON occurrence_groups
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert occurrence groups in their organization" ON occurrence_groups
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update occurrence groups in their organization" ON occurrence_groups
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete occurrence groups in their organization" ON occurrence_groups
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Corrigir políticas de occurrence_types
DROP POLICY IF EXISTS "Users can view occurrence types from their tenant" ON occurrence_types;
DROP POLICY IF EXISTS "Users can insert occurrence types in their tenant" ON occurrence_types;
DROP POLICY IF EXISTS "Users can update occurrence types in their tenant" ON occurrence_types;
DROP POLICY IF EXISTS "Users can delete occurrence types in their tenant" ON occurrence_types;

CREATE POLICY "Users can view occurrence types from their organization" ON occurrence_types
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert occurrence types in their organization" ON occurrence_types
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update occurrence types in their organization" ON occurrence_types
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete occurrence types in their organization" ON occurrence_types
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Corrigir políticas de student_occurrences
DROP POLICY IF EXISTS "Users can view student occurrences from their tenant" ON student_occurrences;
DROP POLICY IF EXISTS "Users can insert student occurrences in their tenant" ON student_occurrences;
DROP POLICY IF EXISTS "Users can update student occurrences in their tenant" ON student_occurrences;
DROP POLICY IF EXISTS "Users can delete student occurrences in their tenant" ON student_occurrences;

CREATE POLICY "Users can view student occurrences from their organization" ON student_occurrences
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert student occurrences in their organization" ON student_occurrences
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update student occurrences in their organization" ON student_occurrences
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete student occurrences in their organization" ON student_occurrences
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 4. CORRIGIR POLÍTICAS RLS DE ANEXOS DE OCORRÊNCIAS
-- =====================================================

-- Corrigir políticas de student_occurrence_attachments
DROP POLICY IF EXISTS "Users can view attachments from their tenant" ON student_occurrence_attachments;
DROP POLICY IF EXISTS "Users can insert attachments in their tenant" ON student_occurrence_attachments;
DROP POLICY IF EXISTS "Users can update attachments in their tenant" ON student_occurrence_attachments;
DROP POLICY IF EXISTS "Users can delete attachments in their tenant" ON student_occurrence_attachments;

CREATE POLICY "Users can view attachments from their organization" ON student_occurrence_attachments
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments in their organization" ON student_occurrence_attachments
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update attachments in their organization" ON student_occurrence_attachments
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments in their organization" ON student_occurrence_attachments
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- 5. CORRIGIR POLÍTICAS RLS DE RELATIONSHIP_TEMPLATES_V2
-- =====================================================

-- Corrigir políticas de relationship_templates_v2
DROP POLICY IF EXISTS "rt_v2_select_policy" ON public.relationship_templates_v2;
DROP POLICY IF EXISTS "rt_v2_insert_policy" ON public.relationship_templates_v2;
DROP POLICY IF EXISTS "rt_v2_update_policy" ON public.relationship_templates_v2;
DROP POLICY IF EXISTS "rt_v2_delete_policy" ON public.relationship_templates_v2;

CREATE POLICY "rt_v2_select_policy" ON public.relationship_templates_v2
    FOR SELECT USING (
        org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
    );

CREATE POLICY "rt_v2_insert_policy" ON public.relationship_templates_v2
    FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
    );

CREATE POLICY "rt_v2_update_policy" ON public.relationship_templates_v2
    FOR UPDATE USING (
        org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
    );

CREATE POLICY "rt_v2_delete_policy" ON public.relationship_templates_v2
    FOR DELETE USING (
        org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())
    );

-- =====================================================
-- 6. CORRIGIR POLÍTICAS RLS DE ANAMNESE
-- =====================================================

-- Corrigir políticas de student_anamnesis_versions
DROP POLICY IF EXISTS "student_anamnesis_versions_select_policy" ON student_anamnesis_versions;
DROP POLICY IF EXISTS "student_anamnesis_versions_insert_policy" ON student_anamnesis_versions;

CREATE POLICY "student_anamnesis_versions_select_policy" ON student_anamnesis_versions
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

CREATE POLICY "student_anamnesis_versions_insert_policy" ON student_anamnesis_versions
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

-- Corrigir políticas de student_anamnesis_latest
DROP POLICY IF EXISTS "student_anamnesis_latest_select_policy" ON student_anamnesis_latest;
DROP POLICY IF EXISTS "student_anamnesis_latest_all_policy" ON student_anamnesis_latest;

CREATE POLICY "student_anamnesis_latest_select_policy" ON student_anamnesis_latest
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

CREATE POLICY "student_anamnesis_latest_all_policy" ON student_anamnesis_latest
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

-- =====================================================
-- 7. CORRIGIR POLÍTICAS RLS DE STUDENTS
-- =====================================================

-- Corrigir políticas de students
DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

CREATE POLICY "students_select_policy" ON students
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

CREATE POLICY "students_insert_policy" ON students
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

CREATE POLICY "students_update_policy" ON students
    FOR UPDATE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

CREATE POLICY "students_delete_policy" ON students
    FOR DELETE USING (
        org_id IN (
            SELECT org_id FROM memberships 
            WHERE user_id = auth.uid() AND role IN ('admin', 'trainer', 'nutritionist')
        )
    );

-- =====================================================
-- 8. CORRIGIR POLÍTICAS RLS DE RELATIONSHIP_TABLES_P1
-- =====================================================

-- Corrigir políticas de relationship_tasks
DROP POLICY IF EXISTS "relationship_tasks_select_policy" ON relationship_tasks;
DROP POLICY IF EXISTS "relationship_tasks_insert_policy" ON relationship_tasks;
DROP POLICY IF EXISTS "relationship_tasks_update_policy" ON relationship_tasks;
DROP POLICY IF EXISTS "relationship_tasks_delete_policy" ON relationship_tasks;

CREATE POLICY "relationship_tasks_select_policy" ON relationship_tasks
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_tasks_insert_policy" ON relationship_tasks
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_tasks_update_policy" ON relationship_tasks
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_tasks_delete_policy" ON relationship_tasks
    FOR DELETE USING (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Corrigir políticas de relationship_messages
DROP POLICY IF EXISTS "relationship_messages_select_policy" ON relationship_messages;
DROP POLICY IF EXISTS "relationship_messages_insert_policy" ON relationship_messages;
DROP POLICY IF EXISTS "relationship_messages_update_policy" ON relationship_messages;
DROP POLICY IF EXISTS "relationship_messages_delete_policy" ON relationship_messages;

CREATE POLICY "relationship_messages_select_policy" ON relationship_messages
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_messages_insert_policy" ON relationship_messages
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_messages_update_policy" ON relationship_messages
    FOR UPDATE USING (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "relationship_messages_delete_policy" ON relationship_messages
    FOR DELETE USING (
        student_id IN (
            SELECT id FROM students WHERE org_id = (
                SELECT org_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- 9. CORRIGIR POLÍTICAS RLS DE PLANS
-- =====================================================

-- Corrigir políticas de plans
DROP POLICY IF EXISTS "Users can view plans from their organization" ON plans;
DROP POLICY IF EXISTS "Admin/Manager can insert plans" ON plans;
DROP POLICY IF EXISTS "Admin/Manager can update plans" ON plans;
DROP POLICY IF EXISTS "Admin/Manager can delete plans" ON plans;

CREATE POLICY "Users can view plans from their organization" ON plans
    FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert plans" ON plans
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "Admin/Manager can update plans" ON plans
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "Admin/Manager can delete plans" ON plans
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

-- Corrigir políticas de student_plan_contracts
DROP POLICY IF EXISTS "Users can view contracts from their organization" ON student_plan_contracts;
DROP POLICY IF EXISTS "Admin/Manager can insert contracts" ON student_plan_contracts;
DROP POLICY IF EXISTS "Admin/Manager can update contracts" ON student_plan_contracts;
DROP POLICY IF EXISTS "Admin/Manager can delete contracts" ON student_plan_contracts;

CREATE POLICY "Users can view contracts from their organization" ON student_plan_contracts
    FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin/Manager can insert contracts" ON student_plan_contracts
    FOR INSERT WITH CHECK (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "Admin/Manager can update contracts" ON student_plan_contracts
    FOR UPDATE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

CREATE POLICY "Admin/Manager can delete contracts" ON student_plan_contracts
    FOR DELETE USING (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
    );

-- =====================================================
-- 10. CORRIGIR POLÍTICAS RLS DE MEMBERSHIPS
-- =====================================================

-- Corrigir políticas de memberships
DROP POLICY IF EXISTS "Users can view memberships from their organization" ON memberships;
CREATE POLICY "Users can view memberships from their organization" ON memberships
    FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- 11. CORRIGIR POLÍTICAS RLS DE STORAGE
-- =====================================================

-- Corrigir políticas de storage para anexos de ocorrências
DROP POLICY IF EXISTS "Users can view occurrence attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload occurrence attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update occurrence attachments" ON storage.objects;

CREATE POLICY "Users can view occurrence attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'occurrence-attachments' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM student_occurrences 
            WHERE org_id IN (
                SELECT org_id FROM memberships WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can upload occurrence attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'occurrence-attachments' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM student_occurrences 
            WHERE org_id IN (
                SELECT org_id FROM memberships WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update occurrence attachments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'occurrence-attachments' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM student_occurrences 
            WHERE org_id IN (
                SELECT org_id FROM memberships WHERE user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- 12. ATUALIZAR TABELAS QUE AINDA USAM TENANT_ID
-- =====================================================

-- Atualizar relationship_templates_v2 para usar org_id
ALTER TABLE public.relationship_templates_v2 
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill org_id = tenant_id
UPDATE public.relationship_templates_v2 
SET org_id = tenant_id 
WHERE org_id IS NULL;

-- Tornar org_id NOT NULL
ALTER TABLE public.relationship_templates_v2 
    ALTER COLUMN org_id SET NOT NULL;

-- Remover coluna tenant_id
ALTER TABLE public.relationship_templates_v2 
    DROP COLUMN IF EXISTS tenant_id;

-- Atualizar relationship_templates para usar org_id
ALTER TABLE public.relationship_templates 
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill org_id = tenant_id
UPDATE public.relationship_templates 
SET org_id = tenant_id 
WHERE org_id IS NULL;

-- Tornar org_id NOT NULL
ALTER TABLE public.relationship_templates 
    ALTER COLUMN org_id SET NOT NULL;

-- Remover coluna tenant_id
ALTER TABLE public.relationship_templates 
    DROP COLUMN IF EXISTS tenant_id;

-- Atualizar relationship_messages para usar org_id
ALTER TABLE public.relationship_messages 
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill org_id = tenant_id
UPDATE public.relationship_messages 
SET org_id = tenant_id 
WHERE org_id IS NULL;

-- Tornar org_id NOT NULL
ALTER TABLE public.relationship_messages 
    ALTER COLUMN org_id SET NOT NULL;

-- Remover coluna tenant_id
ALTER TABLE public.relationship_messages 
    DROP COLUMN IF EXISTS tenant_id;

-- Atualizar student_services para usar org_id
ALTER TABLE public.student_services 
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES tenants(id);

-- Backfill org_id = tenant_id
UPDATE public.student_services 
SET org_id = tenant_id 
WHERE org_id IS NULL;

-- Tornar org_id NOT NULL
ALTER TABLE public.student_services 
    ALTER COLUMN org_id SET NOT NULL;

-- Remover coluna tenant_id
ALTER TABLE public.student_services 
    DROP COLUMN IF EXISTS tenant_id;

-- =====================================================
-- 13. ATUALIZAR ÍNDICES
-- =====================================================

-- Remover índices antigos baseados em tenant_id
DROP INDEX IF EXISTS idx_relationship_templates_tenant;
DROP INDEX IF EXISTS idx_relationship_messages_tenant;
DROP INDEX IF EXISTS idx_student_services_tenant;

-- Criar novos índices baseados em org_id
CREATE INDEX IF NOT EXISTS idx_relationship_templates_org ON public.relationship_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_relationship_messages_org ON public.relationship_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_student_services_org ON public.student_services(org_id);

-- =====================================================
-- 14. VALIDAÇÃO FINAL
-- =====================================================

-- Verificar se ainda existem referências a tenant_id em políticas RLS
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE policyname LIKE '%tenant%' 
    AND schemaname = 'public';
    
    IF policy_count > 0 THEN
        RAISE WARNING 'Ainda existem % políticas com referências a tenant_id', policy_count;
    ELSE
        RAISE NOTICE 'Todas as políticas foram migradas para org_id com sucesso';
    END IF;
END $$;

-- Verificar se ainda existem colunas tenant_id em tabelas públicas
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name = 'tenant_id';
    
    IF column_count > 0 THEN
        RAISE WARNING 'Ainda existem % colunas tenant_id em tabelas públicas', column_count;
    ELSE
        RAISE NOTICE 'Todas as colunas tenant_id foram removidas com sucesso';
    END IF;
END $$;

-- =====================================================
-- 15. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.relationship_templates IS 'Templates de relacionamento - MIGRADO para org_id';
COMMENT ON TABLE public.relationship_templates_v2 IS 'Templates de relacionamento v2 - MIGRADO para org_id';
COMMENT ON TABLE public.relationship_messages IS 'Mensagens de relacionamento - MIGRADO para org_id';
COMMENT ON TABLE public.student_services IS 'Serviços do aluno - MIGRADO para org_id';

-- =====================================================
-- 16. LOG DE MIGRAÇÃO
-- =====================================================

INSERT INTO audit_log (action, table_name, details, created_by)
VALUES (
    'MIGRATION',
    'ALL_TABLES',
    'Migração completa de tenant_id para org_id - Todas as políticas RLS e tabelas atualizadas',
    (SELECT id FROM auth.users LIMIT 1)
);