const { createClient } = require('@supabase/supabase-js')

async function checkTemplates() {
  console.log('🔍 Verificando tabela relationship_templates...')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Verificar se a tabela existe
    const { data, error } = await supabase
      .from('relationship_templates')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar relationship_templates:', error.message)
      
      // Tentar verificar se a tabela existe
      const { data: tables, error: tableError } = await supabase
        .rpc('get_table_names')
        .catch(() => ({ data: null, error: { message: 'RPC não disponível' } }))
      
      if (tableError) {
        console.log('📋 Tentando listar tabelas com relationship...')
        const { data: allTables, error: allError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .like('table_name', '%relationship%')
          .catch(() => ({ data: null, error: { message: 'Query não permitida' } }))
        
        if (allError) {
          console.log('❌ Não foi possível verificar tabelas')
        } else {
          console.log('📋 Tabelas encontradas:', allTables)
        }
      }
    } else {
      console.log('✅ Tabela relationship_templates existe!')
      console.log('📊 Dados encontrados:', data.length)
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message)
  }
}

checkTemplates()
