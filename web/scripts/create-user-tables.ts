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

async function createUserTables() {
  try {
    console.log('🔄 Criando tabelas de usuários...')
    
    // Verificar se as tabelas já existem
    try {
      const { data: usersCheck } = await supabase.from('users').select('*').limit(1)
      if (usersCheck !== null) {
        console.log('✅ Tabela users já existe!')
        return
      }
    } catch (e) {
      console.log('📋 Tabela users não existe, criando...')
    }
    
    // Criar tabela users
    console.log('📋 Criando tabela users...')
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          email text NOT NULL UNIQUE,
          role text NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'seller', 'support')),
          org_id uuid NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS users_org_idx ON users (org_id);
        CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
        
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own data" ON users;
        CREATE POLICY "Users can view their own data" ON users
          FOR SELECT USING (id = auth.uid());
        
        DROP POLICY IF EXISTS "Users can view users from their organization" ON users;
        CREATE POLICY "Users can view users from their organization" ON users
          FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
      `
    })
    
    // Criar tabela memberships
    console.log('📋 Criando tabela memberships...')
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS memberships (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          org_id uuid NOT NULL,
          role text NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'seller', 'support')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          UNIQUE(user_id, org_id)
        );
        
        CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships (user_id);
        CREATE INDEX IF NOT EXISTS memberships_org_idx ON memberships (org_id);
        
        ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
        CREATE POLICY "Users can view their own memberships" ON memberships
          FOR SELECT USING (user_id = auth.uid());
        
        DROP POLICY IF EXISTS "Users can view memberships from their organization" ON memberships;
        CREATE POLICY "Users can view memberships from their organization" ON memberships
          FOR SELECT USING (tenant_id = (SELECT org_id FROM users WHERE id = auth.uid()));
      `
    })
    
    // Criar tabela tenants
    console.log('📋 Criando tabela tenants...')
    await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS tenants (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          display_name text,
          legal_name text,
          cnpj text,
          address jsonb,
          timezone text DEFAULT 'America/Sao_Paulo',
          currency char(3) DEFAULT 'BRL',
          plan_code text CHECK (plan_code IN ('basic','enterprise')) DEFAULT 'basic',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS tenants_plan_idx ON tenants (plan_code);
        
        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their organization" ON tenants;
        CREATE POLICY "Users can view their organization" ON tenants
          FOR SELECT USING (id = (SELECT org_id FROM users WHERE id = auth.uid()));
      `
    })
    
    console.log('✅ Tabelas de usuários criadas com sucesso!')
    
    // Testar se as tabelas foram criadas
    const { data: usersTest } = await supabase.from('users').select('*').limit(1)
    const { data: membershipsTest } = await supabase.from('memberships').select('*').limit(1)
    const { data: tenantsTest } = await supabase.from('tenants').select('*').limit(1)
    
    console.log('✅ Teste das tabelas:')
    console.log(`   - users: ${usersTest !== null ? 'OK' : 'ERRO'}`)
    console.log(`   - memberships: ${membershipsTest !== null ? 'OK' : 'ERRO'}`)
    console.log(`   - tenants: ${tenantsTest !== null ? 'OK' : 'ERRO'}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas de usuários:', error)
    process.exit(1)
  }
}

createUserTables()
