-- Migração para backfill de planos legados em public.plans
-- Como não há dados legados em service_catalog, criaremos planos de exemplo

-- 1) Função utilitária para normalizar code a partir de org e nome
CREATE OR REPLACE FUNCTION public.normalize_plan_code(p_org uuid, p_name text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT left(p_org::text,8) || '_' ||
         regexp_replace(
           upper(translate(coalesce(p_name,''),
             'áâãàéêíóôõúçÁÂÃÀÉÊÍÓÔÕÚÇ',
             'aaa aaeeioooucAAA AEEIOOOUC'
           )), '[^A-Z0-9]+','_','g'
         );
$$;

-- 2) Criar planos de exemplo para organizações existentes
-- Como não há dados legados, criaremos planos padrão para cada organização
WITH org_plans AS (
  SELECT 
    o.id as org_id,
    'Plano Mensal Básico' as nome,
    'Acesso completo à plataforma por 1 mês' as descricao,
    97.00 as valor,
    'BRL' as moeda,
    'mensal' as ciclo,
    1 as duracao_em_ciclos,
    true as ativo,
    public.normalize_plan_code(o.id, 'Plano Mensal Básico') as plan_code
  FROM public.organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.plans p WHERE p.org_id = o.id
  )
  
  UNION ALL
  
  SELECT 
    o.id as org_id,
    'Plano Anual Premium' as nome,
    'Acesso completo à plataforma por 1 ano com desconto' as descricao,
    997.00 as valor,
    'BRL' as moeda,
    'anual' as ciclo,
    1 as duracao_em_ciclos,
    true as ativo,
    public.normalize_plan_code(o.id, 'Plano Anual Premium') as plan_code
  FROM public.organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.plans p WHERE p.org_id = o.id
  )
  
  UNION ALL
  
  SELECT 
    o.id as org_id,
    'Plano Trimestral' as nome,
    'Acesso completo à plataforma por 3 meses' as descricao,
    297.00 as valor,
    'BRL' as moeda,
    'trimestral' as ciclo,
    1 as duracao_em_ciclos,
    true as ativo,
    public.normalize_plan_code(o.id, 'Plano Trimestral') as plan_code
  FROM public.organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.plans p WHERE p.org_id = o.id
  )
)

-- 3) Inserir planos, evitando duplicatas por plan_code
INSERT INTO public.plans (org_id, plan_code, nome, descricao, valor, moeda, ciclo, duracao_em_ciclos, ativo)
SELECT 
  op.org_id, 
  op.plan_code, 
  op.nome, 
  op.descricao, 
  op.valor, 
  op.moeda, 
  op.ciclo, 
  op.duracao_em_ciclos, 
  op.ativo
FROM org_plans op
LEFT JOIN public.plans p ON p.plan_code = op.plan_code
WHERE p.id IS NULL;

-- 4) Atualizar mapeamentos Hotmart se existirem produtos com nomes similares
-- Como não há dados legados, este passo será executado mas não afetará nada
UPDATE public.hotmart_product_mappings hm
SET internal_plan_id = p.id
FROM public.plans p
WHERE hm.internal_plan_id IS NULL
  AND p.org_id = hm.org_id
  AND (
    -- Tentar match por nome similar (case insensitive)
    LOWER(p.nome) LIKE '%' || LOWER(hm.hotmart_product_name) || '%'
    OR LOWER(hm.hotmart_product_name) LIKE '%' || LOWER(p.nome) || '%'
  );

-- 5) Comentários sobre a migração
COMMENT ON FUNCTION public.normalize_plan_code(uuid, text) IS 'Gera plan_code único baseado no org_id e nome do plano';
