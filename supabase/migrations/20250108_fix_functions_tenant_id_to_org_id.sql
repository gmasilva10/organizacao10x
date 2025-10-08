-- Corrigir funções que ainda usam tenant_id ao invés de org_id
-- Data: 2025-01-08
-- Objetivo: Remover todas as referências a tenant_id nas funções do banco

-- 1. Corrigir função has_role
CREATE OR REPLACE FUNCTION public.has_role(tenant uuid, roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  select exists(
    select 1
    from public.memberships m
    where m.org_id = tenant
      and m.user_id = auth.uid()
      and m.role = any(roles)
  );
$$;

-- 2. Corrigir função has_role_org
CREATE OR REPLACE FUNCTION public.has_role_org(org uuid, roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.memberships m
    WHERE m.org_id = org
      AND m.user_id = auth.uid()
      AND m.role = ANY(roles)
  );
$$;

-- 3. Corrigir função seed_occurrences_taxonomy
CREATE OR REPLACE FUNCTION public.seed_occurrences_taxonomy(target_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_var INTEGER;
BEGIN
    -- =====================================================
    -- 1. SAÚDE
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Saúde', 'Ocorrências relacionadas à saúde e bem-estar do aluno', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Lesão (muscular/articular)', 'Lesões musculares ou articulares que afetam o treino', true),
    (target_tenant_id, group_id_var, 'Indisposição', 'Mal-estar geral que impede a prática de exercícios', true),
    (target_tenant_id, group_id_var, 'Náusea/Vômito', 'Problemas digestivos que afetam o treino', true),
    (target_tenant_id, group_id_var, 'Resfriado/Gripe', 'Doenças respiratórias que impedem o treino', true),
    (target_tenant_id, group_id_var, 'Dor de cabeça', 'Cefaleia que interfere na prática de exercícios', true),
    (target_tenant_id, group_id_var, 'Pós-procedimento', 'Recuperação após procedimento médico/cirúrgico', true),
    (target_tenant_id, group_id_var, 'PET doente (impede presença)', 'Animal de estimação doente que impede a presença', true),
    (target_tenant_id, group_id_var, 'Atestado médico', 'Atestado médico que impede a prática de exercícios', true);

    -- =====================================================
    -- 2. LOGÍSTICA/AGENDA
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Logística/Agenda', 'Ocorrências relacionadas à agenda e logística', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Falta/No-show', 'Aluno não compareceu ao treino agendado', true),
    (target_tenant_id, group_id_var, 'Atraso', 'Aluno chegou atrasado para o treino', true),
    (target_tenant_id, group_id_var, 'Reposição solicitada', 'Aluno solicitou reposição de treino', true),
    (target_tenant_id, group_id_var, 'Viagem', 'Aluno viajou e não pode treinar', true),
    (target_tenant_id, group_id_var, 'Trânsito/Imprevisto', 'Problemas de trânsito ou imprevistos', true),
    (target_tenant_id, group_id_var, 'Mudança de horário', 'Solicitação de mudança de horário de treino', true),
    (target_tenant_id, group_id_var, 'Feriado/aniversário (observação)', 'Feriado ou aniversário que afeta o treino', true);

    -- =====================================================
    -- 3. FINANCEIRO
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Financeiro', 'Ocorrências relacionadas a questões financeiras', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Pagamento pendente', 'Pagamento em atraso ou pendente', true),
    (target_tenant_id, group_id_var, 'Cartão recusado', 'Cartão de crédito/débito recusado', true),
    (target_tenant_id, group_id_var, 'Reajuste combinado', 'Reajuste de valores acordado', true),
    (target_tenant_id, group_id_var, 'Suspensão temporária por inadimplência', 'Suspensão temporária por falta de pagamento', true),
    (target_tenant_id, group_id_var, 'Bônus/crédito aplicado', 'Bônus ou crédito aplicado na conta', true);

    -- =====================================================
    -- 4. ENGAJAMENTO/COMPORTAMENTO
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Engajamento/Comportamento', 'Ocorrências relacionadas ao engajamento e comportamento', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Desmotivação', 'Aluno demonstrou desmotivação', true),
    (target_tenant_id, group_id_var, 'Meta batida', 'Aluno atingiu meta estabelecida', true),
    (target_tenant_id, group_id_var, 'Meta não batida', 'Aluno não atingiu meta estabelecida', true),
    (target_tenant_id, group_id_var, 'Feedback positivo/negativo', 'Feedback dado ao aluno', true),
    (target_tenant_id, group_id_var, 'Recomendação de amigo', 'Aluno indicou um amigo', true);

    -- =====================================================
    -- 5. TREINO/TÉCNICO
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Treino/Técnico', 'Ocorrências relacionadas ao treino e aspectos técnicos', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Dificuldade técnica específica', 'Dificuldade com exercício específico', true),
    (target_tenant_id, group_id_var, 'Ajuste de carga', 'Ajuste de carga de treino', true),
    (target_tenant_id, group_id_var, 'Restrição prescrição (ex.: evitar agachamento)', 'Restrição médica para exercícios específicos', true),
    (target_tenant_id, group_id_var, 'Retorno à atividade pós-pausa', 'Retorno após pausa no treino', true);

    -- =====================================================
    -- 6. COMUNICAÇÃO
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Comunicação', 'Ocorrências relacionadas à comunicação', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Mensagem enviada/sem retorno', 'Mensagem enviada sem resposta do aluno', true),
    (target_tenant_id, group_id_var, 'Preferência de canal', 'Preferência de canal de comunicação', true),
    (target_tenant_id, group_id_var, 'Solicitação de material (vídeo/alongamento)', 'Solicitação de material de apoio', true);

    -- =====================================================
    -- 7. PLATAFORMA/APP
    -- =====================================================
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Plataforma/App', 'Ocorrências relacionadas à plataforma e aplicativo', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Problema de acesso', 'Problemas para acessar a plataforma', true),
    (target_tenant_id, group_id_var, 'Notificação não recebida', 'Notificação não foi recebida pelo aluno', true),
    (target_tenant_id, group_id_var, 'Bug relatado', 'Bug reportado pelo aluno', true);

END;
$$;

-- 3. Corrigir função check_single_default_guideline
CREATE OR REPLACE FUNCTION public.check_single_default_guideline()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se está sendo definido como default, verificar se já existe outro
    IF NEW.is_default = TRUE THEN
        -- Zerar outros defaults do mesmo tenant
        UPDATE guidelines_versions 
        SET is_default = FALSE 
        WHERE org_id = NEW.org_id 
        AND id != NEW.id 
        AND is_default = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Corrigir função seed_occurrences_taxonomy (todas as 7 categorias)
CREATE OR REPLACE FUNCTION public.seed_occurrences_taxonomy(target_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    group_id_var INTEGER;
BEGIN
    -- 1. SAÚDE
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Saúde', 'Ocorrências relacionadas à saúde e bem-estar do aluno', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Lesão (muscular/articular)', 'Lesões musculares ou articulares que afetam o treino', true),
    (target_tenant_id, group_id_var, 'Indisposição', 'Mal-estar geral que impede a prática de exercícios', true),
    (target_tenant_id, group_id_var, 'Náusea/Vômito', 'Problemas digestivos que afetam o treino', true),
    (target_tenant_id, group_id_var, 'Resfriado/Gripe', 'Doenças respiratórias que impedem o treino', true),
    (target_tenant_id, group_id_var, 'Dor de cabeça', 'Cefaleia que interfere na prática de exercícios', true),
    (target_tenant_id, group_id_var, 'Pós-procedimento', 'Recuperação após procedimento médico/cirúrgico', true),
    (target_tenant_id, group_id_var, 'PET doente (impede presença)', 'Animal de estimação doente que impede a presença', true),
    (target_tenant_id, group_id_var, 'Atestado médico', 'Atestado médico que impede a prática de exercícios', true);

    -- 2. LOGÍSTICA/AGENDA
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Logística/Agenda', 'Ocorrências relacionadas à agenda e logística', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Falta/No-show', 'Aluno não compareceu ao treino agendado', true),
    (target_tenant_id, group_id_var, 'Atraso', 'Aluno chegou atrasado para o treino', true),
    (target_tenant_id, group_id_var, 'Reposição solicitada', 'Aluno solicitou reposição de treino', true),
    (target_tenant_id, group_id_var, 'Viagem', 'Aluno viajou e não pode treinar', true),
    (target_tenant_id, group_id_var, 'Trânsito/Imprevisto', 'Problemas de trânsito ou imprevistos', true),
    (target_tenant_id, group_id_var, 'Mudança de horário', 'Solicitação de mudança de horário de treino', true),
    (target_tenant_id, group_id_var, 'Feriado/aniversário (observação)', 'Feriado ou aniversário que afeta o treino', true);

    -- 3. FINANCEIRO
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Financeiro', 'Ocorrências relacionadas a questões financeiras', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Pagamento pendente', 'Pagamento em atraso ou pendente', true),
    (target_tenant_id, group_id_var, 'Cartão recusado', 'Cartão de crédito/débito recusado', true),
    (target_tenant_id, group_id_var, 'Reajuste combinado', 'Reajuste de valores acordado', true),
    (target_tenant_id, group_id_var, 'Suspensão temporária por inadimplência', 'Suspensão temporária por falta de pagamento', true),
    (target_tenant_id, group_id_var, 'Bônus/crédito aplicado', 'Bônus ou crédito aplicado na conta', true);

    -- 4. ENGAJAMENTO/COMPORTAMENTO
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Engajamento/Comportamento', 'Ocorrências relacionadas ao engajamento e comportamento', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Desmotivação', 'Aluno demonstrou desmotivação', true),
    (target_tenant_id, group_id_var, 'Meta batida', 'Aluno atingiu meta estabelecida', true),
    (target_tenant_id, group_id_var, 'Meta não batida', 'Aluno não atingiu meta estabelecida', true),
    (target_tenant_id, group_id_var, 'Feedback positivo/negativo', 'Feedback dado ao aluno', true),
    (target_tenant_id, group_id_var, 'Recomendação de amigo', 'Aluno indicou um amigo', true);

    -- 5. TREINO/TÉCNICO
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Treino/Técnico', 'Ocorrências relacionadas ao treino e aspectos técnicos', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Dificuldade técnica específica', 'Dificuldade com exercício específico', true),
    (target_tenant_id, group_id_var, 'Ajuste de carga', 'Ajuste de carga de treino', true),
    (target_tenant_id, group_id_var, 'Restrição prescrição (ex.: evitar agachamento)', 'Restrição médica para exercícios específicos', true),
    (target_tenant_id, group_id_var, 'Retorno à atividade pós-pausa', 'Retorno após pausa no treino', true);

    -- 6. COMUNICAÇÃO
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Comunicação', 'Ocorrências relacionadas à comunicação', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Mensagem enviada/sem retorno', 'Mensagem enviada sem resposta do aluno', true),
    (target_tenant_id, group_id_var, 'Preferência de canal', 'Preferência de canal de comunicação', true),
    (target_tenant_id, group_id_var, 'Solicitação de material (vídeo/alongamento)', 'Solicitação de material de apoio', true);

    -- 7. PLATAFORMA/APP
    INSERT INTO occurrence_groups (org_id, name, description, is_active)
    VALUES (target_tenant_id, 'Plataforma/App', 'Ocorrências relacionadas à plataforma e aplicativo', true)
    RETURNING id INTO group_id_var;
    
    INSERT INTO occurrence_types (org_id, group_id, name, description, is_active) VALUES
    (target_tenant_id, group_id_var, 'Problema de acesso', 'Problemas para acessar a plataforma', true),
    (target_tenant_id, group_id_var, 'Notificação não recebida', 'Notificação não foi recebida pelo aluno', true),
    (target_tenant_id, group_id_var, 'Bug relatado', 'Bug reportado pelo aluno', true);

END;
$$;

-- 5. Verificar se há outras funções com tenant_id (para documentação)
-- Esta query não executa nada, apenas documenta o que foi corrigido
COMMENT ON FUNCTION public.has_role IS 'Verifica se usuário tem role específica na organização - CORRIGIDO para usar org_id';
COMMENT ON FUNCTION public.has_role_org IS 'Verifica se usuário tem role específica na organização - CORRIGIDO para usar org_id';
COMMENT ON FUNCTION public.check_single_default_guideline IS 'Garante apenas um guideline default por organização - CORRIGIDO para usar org_id';
COMMENT ON FUNCTION public.seed_occurrences_taxonomy IS 'Popula taxonomia de ocorrências para uma organização - CORRIGIDO para usar org_id';
