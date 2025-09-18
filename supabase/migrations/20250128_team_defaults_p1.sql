-- Migration: team_defaults_p1
-- Description: Tabela para defaults de responsáveis por tenant
-- Date: 2025-01-28

-- Tabela: team_defaults
CREATE TABLE IF NOT EXISTS team_defaults (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
    trainer_primary_professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
    trainer_support_professional_id INTEGER REFERENCES professionals(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_tenant_defaults UNIQUE (tenant_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_defaults_tenant_id ON team_defaults(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_defaults_owner_professional_id ON team_defaults(owner_professional_id);
CREATE INDEX IF NOT EXISTS idx_team_defaults_trainer_primary_professional_id ON team_defaults(trainer_primary_professional_id);
CREATE INDEX IF NOT EXISTS idx_team_defaults_trainer_support_professional_id ON team_defaults(trainer_support_professional_id);

-- RLS (Row Level Security)
ALTER TABLE team_defaults ENABLE ROW LEVEL SECURITY;

-- Política: team_defaults_tenant_isolation
CREATE POLICY team_defaults_tenant_isolation ON team_defaults
    FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id 
            FROM memberships 
            WHERE user_id = auth.uid()
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_team_defaults_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_defaults_updated_at
    BEFORE UPDATE ON team_defaults
    FOR EACH ROW
    EXECUTE FUNCTION update_team_defaults_updated_at();

-- Comentários para documentação
COMMENT ON TABLE team_defaults IS 'Defaults de responsáveis por tenant para pré-preenchimento no cadastro de alunos';
COMMENT ON COLUMN team_defaults.tenant_id IS 'ID do tenant (único por tenant)';
COMMENT ON COLUMN team_defaults.owner_professional_id IS 'ID do profissional padrão para Proprietário';
COMMENT ON COLUMN team_defaults.trainer_primary_professional_id IS 'ID do profissional padrão para Treinador Principal';
COMMENT ON COLUMN team_defaults.trainer_support_professional_id IS 'ID do profissional padrão para Treinador de Apoio (opcional)';
