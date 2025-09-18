-- Adicionar campo is_active na tabela professionals
-- Migration: 20250130_add_professionals_status

-- Adicionar coluna is_active se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'professionals' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.professionals 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Criar índice para performance em consultas por status
CREATE INDEX IF NOT EXISTS idx_professionals_is_active 
ON public.professionals(is_active);

-- Atualizar RLS para incluir filtro por is_active
-- (mantendo as políticas existentes, apenas adicionando o filtro)

-- Política para SELECT - profissionais ativos
DROP POLICY IF EXISTS "professionals_select_policy" ON public.professionals;
CREATE POLICY "professionals_select_policy" ON public.professionals
    FOR SELECT USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
        AND is_active = true
    );

-- Política para INSERT - permitir criar profissionais
DROP POLICY IF EXISTS "professionals_insert_policy" ON public.professionals;
CREATE POLICY "professionals_insert_policy" ON public.professionals
    FOR INSERT WITH CHECK (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Política para UPDATE - permitir atualizar profissionais
DROP POLICY IF EXISTS "professionals_update_policy" ON public.professionals;
CREATE POLICY "professionals_update_policy" ON public.professionals
    FOR UPDATE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Política para DELETE - permitir deletar profissionais
DROP POLICY IF EXISTS "professionals_delete_policy" ON public.professionals;
CREATE POLICY "professionals_delete_policy" ON public.professionals
    FOR DELETE USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

-- Comentário na coluna
COMMENT ON COLUMN public.professionals.is_active IS 'Indica se o profissional está ativo no sistema (true) ou inativo (false)';
