import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Carregar .env.local
function loadEnvs() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env.local'),
    path.resolve(process.cwd(), '..', '.env'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p })
    }
  }
}

loadEnvs()
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !service) {
  console.error('Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Admin client (service role)
const supabase = createClient(url, service)

async function createPlansTables() {
  try {
    console.log('🔄 Criando tabelas para módulo de Planos...')
    
    // Verificar se as tabelas já existem
    try {
      const { data: plansCheck } = await supabase.from('plans').select('*').limit(1)
      if (plansCheck !== null) {
        console.log('✅ Tabela plans já existe!')
        return
      }
    } catch (e) {
      console.log('📋 Tabela plans não existe, criando...')
    }
    
    // Criar tabela plans
    console.log('📋 Criando tabela plans...')
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS plans (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_code text NOT NULL,
          nome text NOT NULL,
          descricao text,
          valor numeric(12,2) NOT NULL CHECK (valor > 0),
          moeda char(3) NOT NULL DEFAULT 'BRL',
          ciclo text CHECK (ciclo IN ('mensal','trimestral','semestral','anual')),
          duracao_em_ciclos int CHECK (duracao_em_ciclos > 0),
          ativo boolean NOT NULL DEFAULT true,
          org_id uuid NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        
CREATE UNIQUE INDEX IF NOT EXISTS plans_org_plan_code_idx ON plans (org_id, plan_code);
CREATE INDEX IF NOT EXISTS plans_org_active_idx ON plans (org_id, ativo);
        
        ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view plans from their organization" ON plans;
        CREATE POLICY "Users can view plans from their organization" ON plans
          FOR SELECT USING (is_member_of_org(org_id));
        
        DROP POLICY IF EXISTS "Admin/Manager can insert plans" ON plans;
        CREATE POLICY "Admin/Manager can insert plans" ON plans
          FOR INSERT WITH CHECK (
            is_member_of_org(org_id) AND
            (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
          );
        
        DROP POLICY IF EXISTS "Admin/Manager can update plans" ON plans;
        CREATE POLICY "Admin/Manager can update plans" ON plans
          FOR UPDATE USING (
            is_member_of_org(org_id) AND
            (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
          );
        
        DROP POLICY IF EXISTS "Admin/Manager can delete plans" ON plans;
        CREATE POLICY "Admin/Manager can delete plans" ON plans
          FOR DELETE USING (
            is_member_of_org(org_id) AND
            (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager')
          );
      `
    })
    
    console.log('✅ Tabela plans criada com sucesso!')
    
    // Testar se a tabela foi criada
    const { data: test } = await supabase.from('plans').select('*').limit(1)
    console.log('✅ Teste da tabela plans: OK')
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error)
    process.exit(1)
  }
}

createPlansTables()
