-- =====================================================
-- GATE 10.6.5 - Tabela de Logs de Relacionamento
-- =====================================================

-- Tabela de logs de relacionamento
CREATE TABLE IF NOT EXISTS public.relationship_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.relationship_tasks(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- created, sent, snoozed, skipped, failed, recalculated
    channel VARCHAR(50) NOT NULL, -- whatsapp, email, manual, system
    template_code VARCHAR(100), -- MSG1, MSG2, etc.
    meta JSONB DEFAULT '{}', -- Dados adicionais do log
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Timestamp do evento
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_relationship_logs_student_id ON public.relationship_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_task_id ON public.relationship_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_action ON public.relationship_logs(action);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_channel ON public.relationship_logs(channel);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_at ON public.relationship_logs(at);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_student_action ON public.relationship_logs(student_id, action);
CREATE INDEX IF NOT EXISTS idx_relationship_logs_student_at ON public.relationship_logs(student_id, at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.relationship_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver logs dos alunos do seu tenant
CREATE POLICY "relationship_logs_select_policy" ON public.relationship_logs
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Política: usuários podem inserir logs para alunos do seu tenant
CREATE POLICY "relationship_logs_insert_policy" ON public.relationship_logs
    FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM public.students 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Política: usuários podem atualizar logs dos alunos do seu tenant
CREATE POLICY "relationship_logs_update_policy" ON public.relationship_logs
    FOR UPDATE
    USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Política: usuários podem deletar logs dos alunos do seu tenant
CREATE POLICY "relationship_logs_delete_policy" ON public.relationship_logs
    FOR DELETE
    USING (
        student_id IN (
            SELECT id FROM public.students 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.memberships 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_relationship_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_relationship_logs_updated_at
    BEFORE UPDATE ON public.relationship_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_relationship_logs_updated_at();

-- Comentários
COMMENT ON TABLE public.relationship_logs IS 'Logs de atividades de relacionamento com alunos';
COMMENT ON COLUMN public.relationship_logs.student_id IS 'ID do aluno relacionado';
COMMENT ON COLUMN public.relationship_logs.task_id IS 'ID da tarefa relacionada (opcional)';
COMMENT ON COLUMN public.relationship_logs.action IS 'Ação realizada: created, sent, snoozed, skipped, failed, recalculated';
COMMENT ON COLUMN public.relationship_logs.channel IS 'Canal utilizado: whatsapp, email, manual, system';
COMMENT ON COLUMN public.relationship_logs.template_code IS 'Código do template utilizado (opcional)';
COMMENT ON COLUMN public.relationship_logs.meta IS 'Dados adicionais do log em formato JSON';
COMMENT ON COLUMN public.relationship_logs.at IS 'Timestamp do evento';
