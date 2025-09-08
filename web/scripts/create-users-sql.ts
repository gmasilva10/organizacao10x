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

async function createUsersSQL() {
  try {
    console.log('🔄 Criando tabela users via SQL...')
    
    // Verificar se a tabela users existe
    const { data: usersCheck, error: usersCheckError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (usersCheckError && usersCheckError.code === '42P01') {
      console.log('❌ Tabela users não existe, criando...')
      
      // Criar tabela users usando SQL direto via rpc
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            email text NOT NULL UNIQUE,
            role text NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'seller', 'support')),
            org_id uuid NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
          );
          
          CREATE INDEX users_org_idx ON users (org_id);
          CREATE INDEX users_role_idx ON users (role);
          
          ALTER TABLE users ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY "Users can view their own data" ON users
            FOR SELECT USING (id = auth.uid());
          
          CREATE POLICY "Users can view users from their organization" ON users
            FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
        `
      })
      
      if (createError) {
        console.error('❌ Erro ao criar tabela users:', createError)
        console.log('⚠️  Tentando método alternativo...')
        
        // Método alternativo: criar via insert (vai falhar mas pode criar a tabela)
        try {
          await supabase.from('users').insert({
            id: '00000000-0000-0000-0000-000000000000',
            email: 'test@test.com',
            role: 'admin',
            org_id: '00000000-0000-0000-0000-000000000000'
          })
        } catch (insertError) {
          console.log('⚠️  Método alternativo também falhou, execute o SQL manualmente no Supabase Dashboard')
        }
      } else {
        console.log('✅ Tabela users criada com sucesso!')
      }
    } else if (usersCheckError) {
      console.error('❌ Erro ao verificar tabela users:', usersCheckError)
    } else {
      console.log('✅ Tabela users já existe!')
    }
    
    // Testar se a tabela foi criada
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro ao testar tabela users:', testError)
      console.log('⚠️  Execute o seguinte SQL no Supabase Dashboard:')
      console.log(`
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'trainer', 'seller', 'support')),
  org_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_org_idx ON users (org_id);
CREATE INDEX users_role_idx ON users (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view users from their organization" ON users
  FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
      `)
    } else {
      console.log('✅ Teste da tabela users: OK')
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela users:', error)
    process.exit(1)
  }
}

createUsersSQL()

