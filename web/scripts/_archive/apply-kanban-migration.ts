/**
 * Script para aplicar migração de kanban_stages
 * Remove duplicatas e adiciona constraint de unicidade
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🚀 Iniciando aplicação da migração...\n')
  
  try {
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251008200000_kanban_stages_unique_constraint.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migração carregada:', migrationPath)
    console.log('📝 Executando SQL...\n')
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Erro ao executar migração:', error)
      process.exit(1)
    }
    
    console.log('✅ Migração aplicada com sucesso!')
    console.log('\n📊 Verificando colunas do kanban...\n')
    
    // Verificar o resultado
    const { data: stages, error: stagesError } = await supabase
      .from('kanban_stages')
      .select('org_id, position, name, is_fixed, stage_code')
      .order('org_id', { ascending: true })
      .order('position', { ascending: true })
    
    if (stagesError) {
      console.error('❌ Erro ao verificar colunas:', stagesError)
    } else {
      console.log(`✅ Total de colunas: ${stages?.length || 0}`)
      
      // Agrupar por organização
      const byOrg = stages?.reduce((acc: any, stage: any) => {
        if (!acc[stage.org_id]) acc[stage.org_id] = []
        acc[stage.org_id].push(stage)
        return acc
      }, {})
      
      console.log('\n📋 Colunas por organização:')
      Object.entries(byOrg || {}).forEach(([orgId, columns]: [string, any]) => {
        console.log(`\n  Org: ${orgId.substring(0, 8)}...`)
        columns.forEach((col: any) => {
          const fixed = col.is_fixed ? '🔒' : '  '
          console.log(`    ${fixed} #${col.position.toString().padStart(2, '0')} - ${col.name}`)
        })
      })
    }
    
    console.log('\n✅ Script concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyMigration()
