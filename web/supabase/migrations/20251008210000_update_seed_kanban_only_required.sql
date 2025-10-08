-- Migração: Atualizar função seed_kanban_stages_canonical para criar apenas colunas obrigatórias
-- Data: 2025-10-08
-- Descrição: Modifica a função para criar APENAS as colunas #1 e #99

-- Recriar a função seed_kanban_stages_canonical
CREATE OR REPLACE FUNCTION public.seed_kanban_stages_canonical(p_org uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Criar APENAS as colunas obrigatórias #1 (Novo Aluno) e #99 (Entrega do Treino)
  -- Colunas intermediárias devem ser criadas manualmente pelos usuários
  PERFORM public._upsert_stage(p_org, 'novo_aluno',       'Novo Aluno',        1,  true);
  PERFORM public._upsert_stage(p_org, 'entrega_treino',   'Entrega do Treino', 99, true);
END;
$$;

-- Adicionar comentário para documentação
COMMENT ON FUNCTION public.seed_kanban_stages_canonical(uuid) IS 
'Cria as colunas obrigatórias do kanban (#1 e #99) para uma organização. Colunas intermediárias devem ser criadas manualmente.';
