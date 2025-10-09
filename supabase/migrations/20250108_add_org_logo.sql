-- Adicionar campo logo_url na tabela tenants
-- Data: 2025-01-08
-- Objetivo: Permitir upload e armazenamento de logomarca das organizações

ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.tenants.logo_url IS 'URL da logomarca da organização armazenada no Supabase Storage';

-- Criar índice para performance em consultas por logo_url (quando não null)
CREATE INDEX IF NOT EXISTS idx_tenants_logo_url ON public.tenants(logo_url) 
WHERE logo_url IS NOT NULL;
