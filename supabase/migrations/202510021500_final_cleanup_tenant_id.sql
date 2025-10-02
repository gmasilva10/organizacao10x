-- =====================================================
-- MIGRAÇÃO FINAL: Cleanup completo de tenant_id
-- Data: 2025-10-02 15:00
-- Objetivo: Remover tenant_id de todas as tabelas em desenvolvimento
-- =====================================================

-- 1. Recriar PKs sem tenant_id (desenvolvimento)
-- Primeiro, remover as PKs atuais
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_pkey;
ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_pkey;

-- 2. Criar novas PKs apenas com user_id
ALTER TABLE memberships ADD CONSTRAINT memberships_pkey PRIMARY KEY (user_id);
ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_pkey PRIMARY KEY (user_id);

-- 3. Remover coluna tenant_id das tabelas
ALTER TABLE memberships DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE tenant_users DROP COLUMN IF EXISTS tenant_id;

-- 4. Remover função legacy is_member_of(uuid)
DROP FUNCTION IF EXISTS is_member_of(uuid);

-- 5. Verificar se há outras referências a tenant_id
-- (Esta migração assume que todas as referências já foram removidas)

-- 6. Comentário final
COMMENT ON TABLE memberships IS 'Tabela de membros - PK simplificada para user_id apenas';
COMMENT ON TABLE tenant_users IS 'Tabela de usuários por tenant - PK simplificada para user_id apenas';
