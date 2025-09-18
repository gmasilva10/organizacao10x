-- =====================================================
-- MIGRAÇÃO: Módulo Equipe (P1)
-- Data: 2025-01-28
-- Descrição: Criação das tabelas professional_profiles e professionals
-- =====================================================

-- Tabela: professional_profiles
CREATE TABLE IF NOT EXISTS professional_profiles (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_profile_name_per_tenant UNIQUE (tenant_id, name)
);

-- Tabela: professionals
CREATE TABLE IF NOT EXISTS professionals (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) NOT NULL, -- Formato: XXX.XXX.XXX-XX
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('M', 'F', 'Outro')),
    birth_date DATE NOT NULL,
    whatsapp_personal VARCHAR(20), -- Formato: (XX) XXXXX-XXXX
    whatsapp_work VARCHAR(20) NOT NULL, -- Formato: (XX) XXXXX-XXXX
    email VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_cpf_per_tenant UNIQUE (tenant_id, cpf),
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_professional_profiles_tenant_id ON professional_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professionals_tenant_id ON professionals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professionals_profile_id ON professionals(profile_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_email ON professionals(email);

-- RLS (Row Level Security)
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para professional_profiles
CREATE POLICY "professional_profiles_tenant_isolation" ON professional_profiles
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));

-- Políticas RLS para professionals
CREATE POLICY "professionals_tenant_isolation" ON professionals
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM memberships WHERE user_id = auth.uid() AND status = 'active'));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_professional_profiles_updated_at 
    BEFORE UPDATE ON professional_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at 
    BEFORE UPDATE ON professionals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed inicial: Perfil Admin
INSERT INTO professional_profiles (tenant_id, name, description)
SELECT 
    t.id as tenant_id,
    'Admin' as name,
    'Perfil administrativo padrão do sistema' as description
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM professional_profiles pp 
    WHERE pp.tenant_id = t.id AND pp.name = 'Admin'
);

-- Comentários para documentação
COMMENT ON TABLE professional_profiles IS 'Perfis profissionais disponíveis para a organização';
COMMENT ON TABLE professionals IS 'Profissionais cadastrados na organização';
COMMENT ON COLUMN professionals.cpf IS 'CPF no formato XXX.XXX.XXX-XX';
COMMENT ON COLUMN professionals.whatsapp_personal IS 'WhatsApp pessoal no formato (XX) XXXXX-XXXX';
COMMENT ON COLUMN professionals.whatsapp_work IS 'WhatsApp profissional no formato (XX) XXXXX-XXXX';
COMMENT ON COLUMN professionals.sex IS 'Sexo: M (Masculino), F (Feminino), Outro';
