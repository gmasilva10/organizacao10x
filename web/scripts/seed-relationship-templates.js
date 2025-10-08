/**
 * Script para aplicar seeds de templates de relacionamento
 * Executa via Node.js diretamente no banco
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

// Templates de relacionamento
const RELATIONSHIP_TEMPLATE_SEEDS = [
  {
    code: 'MSG1',
    title: 'Logo Após a Venda',
    anchor: 'sale_close',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: 'Olá {{Nome}}! 🎉 Parabéns por dar o primeiro passo para uma vida mais saudável! Estou muito feliz em fazer parte da sua jornada. Vamos começar essa transformação juntos! 💪',
    message_v2: 'Oi {{PrimeiroNome}}! Que alegria ter você conosco! 🚀 Sua jornada de transformação começa agora. Estou aqui para te apoiar em cada passo. Vamos juntos! 💪',
    active: true,
    priority: 1,
    audience_filter: { status: ['ativo', 'onboarding'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG2',
    title: 'Dia Anterior ao Primeiro Treino',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '-1d',
    channel_default: 'whatsapp',
    message_v1: 'Olá {{Nome}}! Amanhã é o seu primeiro treino! 🏋️‍♀️ Estou ansioso para te conhecer pessoalmente. Lembre-se de trazer uma garrafa de água e roupas confortáveis. Até amanhã! 💪',
    message_v2: 'Oi {{PrimeiroNome}}! Que emoção! 😊 Amanhã finalmente vamos treinar juntos! Não esqueça da garrafa de água e venha com roupas confortáveis. Te espero! 🏋️‍♀️',
    active: true,
    priority: 2,
    audience_filter: { status: ['onboarding'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG3',
    title: 'Após o Primeiro Treino',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: 'Parabéns {{Nome}}! 🎉 Você foi incrível no seu primeiro treino! Como se sentiu? Lembre-se de beber bastante água e descansar bem. Estou aqui para qualquer dúvida! 💪',
    message_v2: '{{PrimeiroNome}}, que orgulho! 🌟 Você arrasou no primeiro treino! Como está se sentindo? Hidrate-se bem e descanse. Estou aqui para te apoiar! 💪',
    active: true,
    priority: 3,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG4',
    title: 'Final da Primeira Semana',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '+7d',
    channel_default: 'whatsapp',
    message_v1: '{{Nome}}, completamos uma semana juntos! 🎊 Como está se sentindo? Já notou alguma diferença? Vamos continuar essa jornada incrível! 💪',
    message_v2: '{{PrimeiroNome}}, uma semana de conquistas! 🌟 Como você está se sentindo? Já percebeu mudanças? Vamos manter esse ritmo! 💪',
    active: true,
    priority: 4,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG5',
    title: 'Acompanhamento Semanal',
    anchor: 'weekly_followup',
    touchpoint: 'WhatsApp',
    suggested_offset: '+7d',
    channel_default: 'whatsapp',
    message_v1: 'Oi {{Nome}}! Como foi sua semana? 🏋️‍♀️ Lembre-se de manter a consistência nos treinos. Estou aqui para te apoiar! 💪',
    message_v2: '{{PrimeiroNome}}, como está indo? 😊 Mantenha o foco nos treinos e na alimentação. Estou torcendo por você! 💪',
    active: true,
    priority: 5,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG6',
    title: 'Início do Mês Seguinte',
    anchor: 'monthly_review',
    touchpoint: 'WhatsApp',
    suggested_offset: '+30d',
    channel_default: 'whatsapp',
    message_v1: '{{Nome}}, um mês de dedicação! 🎉 Vamos avaliar seus progressos e ajustar o plano. Como está se sentindo? 💪',
    message_v2: '{{PrimeiroNome}}, um mês de conquistas! 🌟 Hora de revisar os resultados e planejar os próximos passos. Vamos nessa! 💪',
    active: true,
    priority: 6,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG7',
    title: 'Acompanhamento Mensal',
    anchor: 'monthly_review',
    touchpoint: 'WhatsApp',
    suggested_offset: '+30d',
    channel_default: 'whatsapp',
    message_v1: '{{Nome}}, como está sua evolução? 📈 Vamos conversar sobre seus objetivos e ajustar o que for necessário. Estou aqui! 💪',
    message_v2: '{{PrimeiroNome}}, vamos revisar sua jornada? 🎯 Como estão seus objetivos? Vamos ajustar e continuar evoluindo! 💪',
    active: true,
    priority: 7,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG8',
    title: 'Datas Especiais',
    anchor: 'birthday',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: 'Parabéns {{Nome}}! 🎂 Que seu aniversário seja repleto de saúde e felicidade! Vamos comemorar com um treino especial? 💪',
    message_v2: '{{PrimeiroNome}}, feliz aniversário! 🎉 Que este novo ano seja cheio de conquistas! Vamos celebrar com saúde! 💪',
    active: true,
    priority: 8,
    audience_filter: { status: ['ativo', 'onboarding'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG9',
    title: 'Acompanhamento Trimestral',
    anchor: 'monthly_review',
    touchpoint: 'WhatsApp',
    suggested_offset: '+90d',
    channel_default: 'whatsapp',
    message_v1: '{{Nome}}, três meses de dedicação! 🏆 Vamos avaliar sua evolução e planejar os próximos desafios. Como está se sentindo? 💪',
    message_v2: '{{PrimeiroNome}}, que jornada incrível! 🌟 Três meses de foco e determinação. Vamos revisar os resultados e traçar novos objetivos! 💪',
    active: true,
    priority: 9,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  },
  {
    code: 'MSG10',
    title: 'Oferecimento de Novos Serviços',
    anchor: 'renewal_window',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: '{{Nome}}, que tal expandir seus resultados? 🚀 Temos novos serviços que podem potencializar sua evolução. Vamos conversar? 💪',
    message_v2: '{{PrimeiroNome}}, vamos para o próximo nível? 🌟 Novos serviços disponíveis para acelerar seus resultados. Que tal conhecê-los? 💪',
    active: true,
    priority: 10,
    audience_filter: { status: ['ativo'] },
    variables: ['Nome', 'PrimeiroNome']
  }
]

async function seedTemplates() {
  try {
    console.log('🌱 Iniciando aplicação de seeds de templates...')
    
    // Verificar se já existem templates
    const { data: existingTemplates, error: checkError } = await supabase
      .from('relationship_templates_v2')
      .select('id, code')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Erro ao verificar templates existentes:', checkError)
      return
    }
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log('ℹ️ Templates já existem no banco')
      return
    }
    
    // Aplicar seeds
    const templatesToInsert = RELATIONSHIP_TEMPLATE_SEEDS.map(template => ({
      ...template,
      org_id: 'test-tenant-id', // Tenant de teste (org_id)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const { data: insertedTemplates, error: insertError } = await supabase
      .from('relationship_templates_v2')
      .insert(templatesToInsert)
      .select('id, code, title')
    
    if (insertError) {
      console.error('❌ Erro ao inserir templates:', insertError)
      return
    }
    
    console.log('✅ Templates aplicados com sucesso!')
    console.log(`📊 Total: ${insertedTemplates?.length || 0} templates`)
    console.log('📋 Templates criados:')
    insertedTemplates?.forEach(template => {
      console.log(`   - ${template.code}: ${template.title}`)
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedTemplates()
}

module.exports = { seedTemplates }
