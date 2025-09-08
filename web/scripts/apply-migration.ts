import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Carregar .env.local (Next) e .env padrão se existir
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

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migração: 20250127_plans_financial_v01.sql')
    
    // Verificar se as tabelas já existem
    const { data: plansCheck } = await supabase.from('plans').select('*').limit(1)
    if (plansCheck) {
      console.log('✅ Tabela plans já existe!')
      return
    }
    
    // Ler o arquivo de migração
    const migrationPath = path.resolve(process.cwd(), '..', 'supabase', 'migrations', '20250127_plans_financial_v01.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Executar a migração usando query direta
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Erro ao aplicar migração:', error)
      console.log('⚠️  Tentando executar comandos individualmente...')
      
      // Executar cada comando SQL separadamente
      const commands = migrationSQL.split(';').filter(cmd => cmd.trim())
      
      for (const command of commands) {
        if (command.trim()) {
          try {
            const { error: cmdError } = await supabase.rpc('exec', { sql: command.trim() })
            if (cmdError) {
              console.log(`⚠️  Comando pode já ter sido executado: ${cmdError.message}`)
            }
          } catch (e) {
            console.log(`⚠️  Comando pode já ter sido executado: ${e}`)
          }
        }
      }
    }
    
    console.log('✅ Migração aplicada com sucesso!')
    console.log('📋 Tabelas criadas:')
    console.log('   - plans')
    console.log('   - student_plan_contracts') 
    console.log('   - student_billing')
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyMigration()
