/**
 * Script para verificar dados de relacionamento no banco
 * Verifica templates, tarefas e logs
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRelationshipData() {
  try {
    console.log('🔍 Verificando dados de relacionamento no banco...\n')
    
    // 1. Verificar templates
    console.log('📋 TEMPLATES:')
    const { data: templates, error: templatesError } = await supabase
      .from('relationship_templates_v2')
      .select('id, code, anchor, active, priority')
      .order('priority')
    
    if (templatesError) {
      console.error('❌ Erro ao buscar templates:', templatesError.message)
    } else {
      console.log(`✅ ${templates?.length || 0} templates encontrados`)
      templates?.forEach(template => {
        console.log(`   - ${template.code}: ${template.anchor} (${template.active ? 'Ativo' : 'Inativo'}) - Prioridade ${template.priority}`)
      })
    }
    
    // 2. Verificar tarefas
    console.log('\n📝 TAREFAS:')
    const { data: tasks, error: tasksError } = await supabase
      .from('relationship_tasks')
      .select('id, template_code, anchor, status, scheduled_for, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (tasksError) {
      console.error('❌ Erro ao buscar tarefas:', tasksError.message)
    } else {
      console.log(`✅ ${tasks?.length || 0} tarefas encontradas`)
      tasks?.forEach(task => {
        console.log(`   - ${task.template_code}: ${task.anchor} (${task.status}) - ${task.scheduled_for}`)
      })
    }
    
    // 3. Verificar logs
    console.log('\n📊 LOGS:')
    const { data: logs, error: logsError } = await supabase
      .from('relationship_logs')
      .select('id, action, channel, template_code, at')
      .order('at', { ascending: false })
      .limit(10)
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError.message)
    } else {
      console.log(`✅ ${logs?.length || 0} logs encontrados`)
      logs?.forEach(log => {
        console.log(`   - ${log.action}: ${log.channel} (${log.template_code || 'N/A'}) - ${log.at}`)
      })
    }
    
    // 4. Verificar alunos
    console.log('\n👥 ALUNOS:')
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, status, tenant_id')
      .limit(5)
    
    if (studentsError) {
      console.error('❌ Erro ao buscar alunos:', studentsError.message)
    } else {
      console.log(`✅ ${students?.length || 0} alunos encontrados`)
      students?.forEach(student => {
        console.log(`   - ${student.name}: ${student.status} (${student.tenant_id})`)
      })
    }
    
    // 5. Resumo
    console.log('\n📊 RESUMO:')
    console.log(`   Templates: ${templates?.length || 0}`)
    console.log(`   Tarefas: ${tasks?.length || 0}`)
    console.log(`   Logs: ${logs?.length || 0}`)
    console.log(`   Alunos: ${students?.length || 0}`)
    
    // 6. Verificar se há dados para testar
    if ((templates?.length || 0) > 0 && (students?.length || 0) > 0) {
      console.log('\n✅ Dados suficientes para testar o motor!')
      console.log('💡 Execute o recalculate para gerar tarefas')
    } else {
      console.log('\n⚠️  Dados insuficientes para testar o motor')
      if ((templates?.length || 0) === 0) {
        console.log('   - Execute: node scripts/seed-relationship-templates.js')
      }
      if ((students?.length || 0) === 0) {
        console.log('   - Cadastre alguns alunos no sistema')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkRelationshipData()
}

module.exports = { checkRelationshipData }
