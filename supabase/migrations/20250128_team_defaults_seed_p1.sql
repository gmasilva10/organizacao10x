-- Migration: team_defaults_seed_p1
-- Description: Seed/backfill para tenants Basic existentes
-- Date: 2025-01-28

-- Função para criar defaults automaticamente para tenants Basic
CREATE OR REPLACE FUNCTION seed_team_defaults_for_basic_tenants()
RETURNS void AS $$
DECLARE
    tenant_record RECORD;
    professional_record RECORD;
    professional_count INTEGER;
BEGIN
    -- Iterar sobre todos os tenants
    FOR tenant_record IN 
        SELECT id FROM tenants
    LOOP
        -- Contar profissionais do tenant
        SELECT COUNT(*) INTO professional_count
        FROM professionals 
        WHERE tenant_id = tenant_record.id;
        
        -- Se tem exatamente 1 profissional, criar defaults
        IF professional_count = 1 THEN
            -- Buscar o único profissional
            SELECT id INTO professional_record
            FROM professionals 
            WHERE tenant_id = tenant_record.id
            LIMIT 1;
            
            -- Verificar se já não existe defaults para este tenant
            IF NOT EXISTS (
                SELECT 1 FROM team_defaults 
                WHERE tenant_id = tenant_record.id
            ) THEN
                -- Criar defaults com o único profissional
                INSERT INTO team_defaults (
                    tenant_id,
                    owner_professional_id,
                    trainer_primary_professional_id,
                    trainer_support_professional_id
                ) VALUES (
                    tenant_record.id,
                    professional_record.id,
                    professional_record.id,
                    NULL
                );
                
                RAISE NOTICE 'Defaults criados para tenant % com profissional %', 
                    tenant_record.id, professional_record.id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função
SELECT seed_team_defaults_for_basic_tenants();

-- Remover a função após uso
DROP FUNCTION seed_team_defaults_for_basic_tenants();
