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

async function createTenants() {
  try {
    console.log('🔄 Criando tenants de teste...')
    
    const TENANT_A = 'f203156c-ed09-42d1-9593-86f4b2ee0c81' // Basic
    const TENANT_B = '0f3ec75c-6eb9-4443-8c48-49eca6e6d00f' // Enterprise
    
    // Criar Tenant A (Basic)
    console.log('📋 Criando Tenant A (Basic)...')
    const { data: tenantA, error: errorA } = await supabase
      .from('tenants')
      .upsert({
        id: TENANT_A,
        name: 'Basic Tenant',
        display_name: 'Basic Tenant',
        legal_name: 'Basic Tenant LTDA',
        plan_code: 'basic'
      }, { onConflict: 'id' })
    
    if (errorA) {
      console.error('❌ Erro ao criar Tenant A:', errorA)
    } else {
      console.log('✅ Tenant A criado com sucesso!')
    }
    
    // Criar Tenant B (Enterprise)
    console.log('📋 Criando Tenant B (Enterprise)...')
    const { data: tenantB, error: errorB } = await supabase
      .from('tenants')
      .upsert({
        id: TENANT_B,
        name: 'Enterprise Tenant',
        display_name: 'Enterprise Tenant',
        legal_name: 'Enterprise Tenant LTDA',
        plan_code: 'enterprise'
      }, { onConflict: 'id' })
    
    if (errorB) {
      console.error('❌ Erro ao criar Tenant B:', errorB)
    } else {
      console.log('✅ Tenant B criado com sucesso!')
    }
    
    // Verificar se os tenants foram criados
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
    
    if (tenantsError) {
      console.error('❌ Erro ao verificar tenants:', tenantsError)
    } else {
      console.log('✅ Tenants criados:')
      tenants?.forEach(tenant => {
        console.log(`   - ${tenant.name} (${tenant.plan_code}) - ID: ${tenant.id}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar tenants:', error)
    process.exit(1)
  }
}

createTenants()
