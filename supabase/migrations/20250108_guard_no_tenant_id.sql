-- Guard: impedir reintrodução de tenant_id e padronizar índices org_id

-- 1) Verificação: falhar se existir qualquer coluna tenant_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE column_name = 'tenant_id'
      AND table_schema NOT IN ('pg_catalog','information_schema')
  ) THEN
    RAISE EXCEPTION 'Guard check failed: ainda existem colunas tenant_id no schema';
  END IF;
END$$;

-- 2) Criar índices org_id padrão quando faltar (tabelas conhecidas)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_org_id ON public.%I(org_id)', r.tbl, r.tbl);
    EXCEPTION WHEN undefined_column THEN 
      -- tabela sem coluna org_id: ignorar
      NULL;
    END;
  END LOOP;
END$$;

-- 3) Comentário padrão para tabelas multitenant (quando tiver org_id)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT table_name FROM information_schema.columns 
    WHERE table_schema='public' AND column_name='org_id'
  LOOP
    EXECUTE format('COMMENT ON COLUMN public.%I.org_id IS ''Organização proprietária (substitui tenant_id)''', r.table_name);
  END LOOP;
END$$;


