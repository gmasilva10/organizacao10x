-- =====================================================
-- KANBAN LOGS E TAREFAS - v0.2.0
-- =====================================================

-- Tabela de logs do Kanban
CREATE TABLE IF NOT EXISTS public.kanban_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.kanban_items(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.kanban_stages(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'card_created',      -- Criação de card
        'card_moved',        -- Movimentação de coluna
        'card_edited',       -- Edição de card
        'task_completed',    -- Conclusão de tarefa
        'task_started',      -- Início de tarefa
        'card_archived',     -- Arquivamento/Histórico
        'stage_completed'    -- Conclusão de etapa
    )),
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kanban_logs_org_id ON public.kanban_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_kanban_logs_card_id ON public.kanban_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_kanban_logs_stage_id ON public.kanban_logs(stage_id);
CREATE INDEX IF NOT EXISTS idx_kanban_logs_created_at ON public.kanban_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kanban_logs_action ON public.kanban_logs(action);

-- RLS para kanban_logs
ALTER TABLE public.kanban_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs from their organization" ON public.kanban_logs
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can insert logs" ON public.kanban_logs
    FOR INSERT WITH CHECK (true);

-- Tabela de catálogo de tarefas por coluna
CREATE TABLE IF NOT EXISTS public.service_onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    stage_code TEXT NOT NULL, -- 'novo_aluno', 'entrega_treino', etc.
    title TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, stage_code, title)
);

-- Índices para service_onboarding_tasks
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tasks_org_id ON public.service_onboarding_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_service_onboarding_tasks_stage_code ON public.service_onboarding_tasks(stage_code);

-- RLS para service_onboarding_tasks
ALTER TABLE public.service_onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks from their organization" ON public.service_onboarding_tasks
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage tasks" ON public.service_onboarding_tasks
    FOR ALL USING (true);

-- Tabela de instâncias de tarefas por card
CREATE TABLE IF NOT EXISTS public.card_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.kanban_items(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.service_onboarding_tasks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(card_id, task_id)
);

-- Índices para card_tasks
CREATE INDEX IF NOT EXISTS idx_card_tasks_org_id ON public.card_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_card_tasks_card_id ON public.card_tasks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tasks_task_id ON public.card_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_card_tasks_status ON public.card_tasks(status);

-- RLS para card_tasks
ALTER TABLE public.card_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view card tasks from their organization" ON public.card_tasks
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM public.memberships 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage card tasks" ON public.card_tasks
    FOR ALL USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_onboarding_tasks_updated_at 
    BEFORE UPDATE ON public.service_onboarding_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_tasks_updated_at 
    BEFORE UPDATE ON public.card_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed inicial de tarefas para coluna 1 (Novo Aluno)
INSERT INTO public.service_onboarding_tasks (org_id, stage_code, title, description, is_required, order_index) VALUES
    (NULL, 'novo_aluno', 'Avaliação Inicial', 'Realizar avaliação física e anamnese completa', true, 1),
    (NULL, 'novo_aluno', 'Fotos Antes', 'Tirar fotos frontais, laterais e posteriores', true, 2),
    (NULL, 'novo_aluno', 'Medidas Corporais', 'Registrar peso, altura, circunferências e % de gordura', true, 3),
    (NULL, 'novo_aluno', 'Grupo WhatsApp', 'Adicionar ao grupo de alunos da academia', true, 4),
    (NULL, 'novo_aluno', 'Contrato Assinado', 'Contrato de prestação de serviços assinado', true, 5)
ON CONFLICT DO NOTHING;

-- Seed inicial de tarefas para coluna 99 (Entrega do Treino)
INSERT INTO public.service_onboarding_tasks (org_id, stage_code, title, description, is_required, order_index) VALUES
    (NULL, 'entrega_treino', 'Treino Personalizado', 'Treino individualizado entregue ao aluno', true, 1),
    (NULL, 'entrega_treino', 'Orientações Nutricionais', 'Dicas básicas de alimentação fornecidas', true, 2),
    (NULL, 'entrega_treino', 'Agendamento Acompanhamento', 'Próxima sessão de acompanhamento agendada', true, 3),
    (NULL, 'entrega_treino', 'Checklist Final', 'Verificação de todas as etapas concluídas', true, 4)
ON CONFLICT DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE public.kanban_logs IS 'Log de todas as ações realizadas no Kanban para auditoria e métricas';
COMMENT ON TABLE public.service_onboarding_tasks IS 'Catálogo de tarefas obrigatórias por estágio do onboarding';
COMMENT ON TABLE public.card_tasks IS 'Instâncias de tarefas vinculadas a cada card do Kanban';

-- Função para instanciar tarefas automaticamente em um card
CREATE OR REPLACE FUNCTION instantiate_tasks_for_card(
    p_card_id UUID,
    p_stage_code TEXT,
    p_org_id UUID DEFAULT NULL
)
RETURNS TABLE(
    task_id UUID,
    task_title TEXT,
    is_required BOOLEAN,
    order_index INTEGER,
    action TEXT
) AS $$
DECLARE
    v_task RECORD;
    v_existing_task_id UUID;
    v_action TEXT;
BEGIN
    -- Se org_id não foi fornecido, buscar do card
    IF p_org_id IS NULL THEN
        SELECT org_id INTO p_org_id 
        FROM public.kanban_items 
        WHERE id = p_card_id;
    END IF;

    -- Buscar todas as tarefas do catálogo para esta coluna
    FOR v_task IN 
        SELECT id, title, is_required, order_index
        FROM public.service_onboarding_tasks 
        WHERE stage_code = p_stage_code 
        AND (org_id = p_org_id OR org_id IS NULL) -- Tarefas globais ou da org
        ORDER BY order_index
    LOOP
        -- Verificar se a tarefa já existe no card
        SELECT id INTO v_existing_task_id
        FROM public.card_tasks 
        WHERE card_id = p_card_id AND task_id = v_task.id;

        IF v_existing_task_id IS NULL THEN
            -- Criar nova instância da tarefa
            INSERT INTO public.card_tasks (
                org_id, 
                card_id, 
                task_id, 
                status, 
                created_at, 
                updated_at
            ) VALUES (
                p_org_id, 
                p_card_id, 
                v_task.id, 
                'pending', 
                NOW(), 
                NOW()
            );

            -- Log da instanciação
            INSERT INTO public.kanban_logs (
                org_id,
                card_id,
                action,
                payload,
                created_by
            ) VALUES (
                p_org_id,
                p_card_id,
                'card_task_instantiated',
                jsonb_build_object(
                    'task_id', v_task.id,
                    'task_title', v_task.title,
                    'stage_code', p_stage_code,
                    'is_required', v_task.is_required,
                    'order_index', v_task.order_index
                ),
                auth.uid()
            );

            v_action := 'instantiated';
        ELSE
            -- Tarefa já existe, marcar como restaurada
            v_action := 'restored';
        END IF;

        -- Retornar resultado
        RETURN QUERY SELECT 
            v_task.id,
            v_task.title,
            v_task.is_required,
            v_task.order_index,
            v_action::TEXT;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION instantiate_tasks_for_card IS 'Instancia automaticamente tarefas do catálogo em um card quando ele entra em uma coluna';

-- Função para aplicar catálogo atualizado a cards existentes
CREATE OR REPLACE FUNCTION apply_catalog_to_existing_cards(
    p_stage_code TEXT,
    p_org_id UUID,
    p_apply_to_existing BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
    v_card RECORD;
    v_affected_cards INTEGER := 0;
BEGIN
    -- Se não aplicar aos existentes, retornar 0
    IF NOT p_apply_to_existing THEN
        RETURN 0;
    END IF;

    -- Buscar todos os cards na coluna especificada
    FOR v_card IN 
        SELECT ki.id, ki.org_id
        FROM public.kanban_items ki
        JOIN public.kanban_stages ks ON ki.stage_id = ks.id
        WHERE ks.stage_code = p_stage_code 
        AND ki.org_id = p_org_id
        AND ki.completed_at IS NULL -- Apenas cards ativos
    LOOP
        -- Instanciar tarefas para este card
        PERFORM instantiate_tasks_for_card(v_card.id, p_stage_code, v_card.org_id);
        v_affected_cards := v_affected_cards + 1;
    END LOOP;

    -- Log da aplicação em massa
    IF v_affected_cards > 0 THEN
        INSERT INTO public.kanban_logs (
            org_id,
            action,
            payload,
            created_by
        ) VALUES (
            p_org_id,
            'catalog_applied_to_existing_cards',
            jsonb_build_object(
                'stage_code', p_stage_code,
                'affected_cards', v_affected_cards,
                'applied_at', NOW()
            ),
            auth.uid()
        );
    END IF;

    RETURN v_affected_cards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION apply_catalog_to_existing_cards IS 'Aplica catálogo atualizado a cards existentes em uma coluna';

-- Trigger para instanciar tarefas automaticamente quando um card é criado
CREATE OR REPLACE FUNCTION trigger_instantiate_tasks_on_card_create()
RETURNS TRIGGER AS $$
DECLARE
    v_stage_code TEXT;
BEGIN
    -- Buscar o stage_code da coluna
    SELECT stage_code INTO v_stage_code
    FROM public.kanban_stages 
    WHERE id = NEW.stage_id;

    -- Instanciar tarefas automaticamente
    PERFORM instantiate_tasks_for_card(NEW.id, v_stage_code, NEW.org_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION trigger_instantiate_tasks_on_card_create IS 'Trigger para instanciar tarefas automaticamente quando um card é criado';

-- Criar trigger
CREATE TRIGGER trigger_instantiate_tasks_on_card_create
    AFTER INSERT ON public.kanban_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_instantiate_tasks_on_card_create();

-- Trigger para instanciar tarefas quando um card é movido para outra coluna
CREATE OR REPLACE FUNCTION trigger_instantiate_tasks_on_card_move()
RETURNS TRIGGER AS $$
DECLARE
    v_old_stage_code TEXT;
    v_new_stage_code TEXT;
BEGIN
    -- Se o stage_id mudou
    IF OLD.stage_id != NEW.stage_id THEN
        -- Buscar stage_code da nova coluna
        SELECT stage_code INTO v_new_stage_code
        FROM public.kanban_stages 
        WHERE id = NEW.stage_id;

        -- Instanciar tarefas da nova coluna
        PERFORM instantiate_tasks_for_card(NEW.id, v_new_stage_code, NEW.org_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION trigger_instantiate_tasks_on_card_move IS 'Trigger para instanciar tarefas quando um card é movido para outra coluna';

-- Criar trigger
CREATE TRIGGER trigger_instantiate_tasks_on_card_move
    AFTER UPDATE ON public.kanban_items
    FOR EACH ROW
    WHEN (OLD.stage_id IS DISTINCT FROM NEW.stage_id)
    EXECUTE FUNCTION trigger_instantiate_tasks_on_card_move();
