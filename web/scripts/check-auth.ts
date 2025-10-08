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

async function checkAuth() {
  try {
    console.log('🔍 Verificando autenticação e permissões...')
    
    // Verificar se há usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, org_id')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError)
      return
    }
    
    console.log('👥 Usuários encontrados:')
    users?.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Org: ${user.org_id}`)
    })
    
    // Verificar se há memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('user_id, org_id, role')
      .limit(5)
    
    if (membershipsError) {
      console.error('❌ Erro ao buscar memberships:', membershipsError)
      return
    }
    
    console.log('🔗 Memberships encontrados:')
    memberships?.forEach(membership => {
      console.log(`   - User: ${membership.user_id} - Org: ${membership.org_id} - Role: ${membership.role}`)
    })
    
    // Verificar se há planos
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(5)
    
    if (plansError) {
      console.error('❌ Erro ao buscar planos:', plansError)
      return
    }
    
    console.log('📋 Planos encontrados:')
    plans?.forEach(plan => {
      console.log(`   - ${plan.nome} (${plan.plan_code}) - Org: ${plan.org_id}`)
    })
    
    console.log('✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error)
  }
}

checkAuth()
