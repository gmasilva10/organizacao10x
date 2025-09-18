/**
 * Seeds dos Templates de Relacionamento
 * Baseado na planilha: Jornada_Pontos_de_Contato_Personal_Trainer.xlsx
 */

import { EVENT_REGISTRY } from './event-registry'

export const RELATIONSHIP_TEMPLATE_SEEDS = [
  {
    code: 'MSG1',
    anchor: 'sale_close',
    touchpoint: 'Logo Após a Venda',
    suggested_offset: '+0d after sale_close',
    channel_default: 'whatsapp',
    message_v1: 'Olá [Nome do Cliente], estou muito feliz em começar essa jornada com você! Quero garantir que tudo esteja claro sobre o nosso plano de treino e metas. Se precisar de qualquer coisa, estarei à disposição. Vamos juntos nessa!',
    message_v2: 'Oi [Nome do Cliente], seja bem-vindo(a) à nossa jornada de transformação! Estou aqui para garantir que seu caminho seja o mais produtivo possível. Qualquer dúvida ou necessidade, conte comigo.',
    active: true,
    priority: 1,
    audience_filter: { status: ['active', 'onboarding'] },
    variables: ['Nome', 'PrimeiroNome', 'DataVenda']
  },
  {
    code: 'MSG2',
    anchor: 'first_workout',
    touchpoint: 'Dia Anterior ao Primeiro Treino + LINK da ANAMNESE 1',
    suggested_offset: '-1d before first_workout',
    channel_default: 'whatsapp',
    message_v1: 'Oi [Nome do Cliente], amanhã é o grande dia! Espero que esteja empolgado(a) para nosso primeiro treino. Vamos iniciar com tudo, e se tiver alguma dúvida ou algo específico que gostaria de discutir antes, é só me avisar.',
    message_v2: 'Ei [Nome do Cliente], já está preparado(a) para o nosso treino amanhã? Vamos dar o primeiro passo para alcançar todas as suas metas. Se precisar de algo, estarei aqui!',
    active: true,
    priority: 2,
    audience_filter: { status: ['active', 'onboarding'] },
    variables: ['Nome', 'PrimeiroNome', 'DataTreino', 'LinkAnamnese']
  },
  {
    code: 'MSG3',
    anchor: 'first_workout',
    touchpoint: 'Após o Primeiro Treino',
    suggested_offset: '+0d after first_workout',
    channel_default: 'whatsapp',
    message_v1: 'Parabéns pelo treino de hoje, [Nome do Cliente]! Foi um excelente começo, e estou aqui para te ajudar a se superar a cada dia. Como está se sentindo? Qualquer feedback ou ajuste que precise, estou à disposição.',
    message_v2: 'Oi [Nome do Cliente], você mandou muito bem hoje! Como está se sentindo após o treino? Lembre-se de que estou aqui para ajustar o que for preciso.',
    active: true,
    priority: 3,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataTreino']
  },
  {
    code: 'MSG4',
    anchor: 'weekly_followup',
    touchpoint: 'Final da Primeira Semana',
    suggested_offset: '+7d after first_workout',
    channel_default: 'whatsapp',
    message_v1: 'Oi [Nome do Cliente], terminamos nossa primeira semana de treinos! Estou muito orgulhoso(a) do seu progresso até aqui. Como você está se sentindo? Vamos continuar evoluindo juntos!',
    message_v2: 'Parabéns pela dedicação nesta primeira semana, [Nome do Cliente]! Adoro ver o quanto você está comprometido(a). Alguma observação sobre os treinos?',
    active: true,
    priority: 4,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataUltimoTreino']
  },
  {
    code: 'MSG5',
    anchor: 'weekly_followup',
    touchpoint: 'Acompanhamento Semanal (ou Quinzenal)',
    suggested_offset: '+7d after last_workout',
    channel_default: 'whatsapp',
    message_v1: 'Oi [Nome do Cliente], tudo bem? Gostaria de saber como está indo com os treinos e se tem algo que possamos ajustar ou melhorar no plano. Lembre-se de que estou sempre por aqui para te apoiar.',
    message_v2: 'Oi [Nome do Cliente], estou acompanhando seu progresso e quero saber se está tudo conforme o planejado ou se gostaria de algum ajuste nos treinos. Vamos evoluir juntos!',
    active: true,
    priority: 5,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataUltimoTreino']
  },
  {
    code: 'MSG6',
    anchor: 'monthly_review',
    touchpoint: 'Início do Mês Seguinte (Revisão de Progresso)',
    suggested_offset: '+30d after first_workout',
    channel_default: 'whatsapp',
    message_v1: 'Olá, [Nome do Cliente]! Já completamos um mês juntos, parabéns pelo comprometimento! Vamos revisar o que alcançamos até agora e traçar as metas para o próximo mês. Tem algo que gostaria de focar mais?',
    message_v2: 'Oi [Nome do Cliente], mais um mês completado! Que tal revisarmos os próximos passos? Quero garantir que suas metas estejam sempre alinhadas ao seu esforço.',
    active: true,
    priority: 6,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataInicio', 'MesesAtivo']
  },
  {
    code: 'MSG7',
    anchor: 'monthly_review',
    touchpoint: 'Acompanhamento Mensal (Motivacional)',
    suggested_offset: '+30d after last_review',
    channel_default: 'whatsapp',
    message_v1: 'Oi [Nome do Cliente], continue firme no seu processo! Sei que as vezes pode ser difícil, mas cada esforço conta para chegar ao seu objetivo. Conte comigo para o que precisar!',
    message_v2: 'Oi [Nome do Cliente], lembre-se de que cada treino nos aproxima ainda mais dos seus objetivos! Qualquer desafio que apareça, estou aqui para te ajudar a superar.',
    active: true,
    priority: 7,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataUltimoTreino']
  },
  {
    code: 'MSG8',
    anchor: 'birthday',
    touchpoint: 'Datas Especiais (Aniversário, Metas Alcançadas)',
    suggested_offset: '+0d on birthday',
    channel_default: 'whatsapp',
    message_v1: 'Parabéns pelo seu aniversário, [Nome do Cliente]! Que você continue forte e motivado em todas as suas metas, dentro e fora da academia. Conte comigo para te ajudar a realizar seus objetivos de saúde e bem-estar!',
    message_v2: 'Oi [Nome do Cliente], feliz aniversário! Que esse novo ano te traga ainda mais força e determinação para alcançar todos os seus objetivos. Vamos continuar juntos nessa jornada!',
    active: true,
    priority: 8,
    audience_filter: { status: ['active', 'onboarding'] },
    variables: ['Nome', 'PrimeiroNome', 'Idade', 'DataNascimento']
  },
  {
    code: 'MSG9',
    anchor: 'monthly_review',
    touchpoint: 'Acompanhamento Trimestral (Feedback Formal)',
    suggested_offset: '+90d after first_workout',
    channel_default: 'whatsapp',
    message_v1: 'Oi [Nome do Cliente], estamos completando mais um ciclo de treinos. Gostaria muito de ouvir o seu feedback sobre o programa e como podemos continuar a evoluir. Estou aqui para fazer os ajustes necessários e garantir que você alcance suas metas.',
    message_v2: 'Oi [Nome do Cliente], completamos mais um trimestre juntos! Estou curioso(a) para saber como você se sente e se tem algo que possamos melhorar no seu plano de treinos.',
    active: true,
    priority: 9,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataInicio', 'MesesAtivo']
  },
  {
    code: 'MSG10',
    anchor: 'weekly_followup',
    touchpoint: 'Oferecimento de Novos Serviços ou Ajustes',
    suggested_offset: '+14d after last_workout',
    channel_default: 'whatsapp',
    message_v1: 'Olá [Nome do Cliente], como parte do nosso acompanhamento, gostaria de te apresentar algumas novas opções que podem potencializar seus resultados, como [suplementação, alongamentos, ajustes no plano alimentar]. Se tiver interesse, ficarei feliz em conversar mais a respeito.',
    message_v2: 'Olá [Nome do Cliente], estou sempre buscando formas de melhorar nosso trabalho e pensei em algumas estratégias que podem ser interessantes para você. Vamos conversar?',
    active: true,
    priority: 10,
    audience_filter: { status: ['active'] },
    variables: ['Nome', 'PrimeiroNome', 'DataUltimoTreino']
  }
] as const

/**
 * Validação dos seeds
 */
export function validateTemplateSeeds() {
  const errors: string[] = []
  
  RELATIONSHIP_TEMPLATE_SEEDS.forEach((template, index) => {
    // Validar âncora
    if (!EVENT_REGISTRY[template.anchor as keyof typeof EVENT_REGISTRY]) {
      errors.push(`Template ${template.code} (index ${index}): âncora '${template.anchor}' inválida`)
    }
    
    // Validar variáveis
    const { invalid } = validateTemplateVariables(template.variables)
    if (invalid.length > 0) {
      errors.push(`Template ${template.code} (index ${index}): variáveis inválidas: ${invalid.join(', ')}`)
    }
    
    // Validar formato do código
    if (!/^MSG\d+$/.test(template.code)) {
      errors.push(`Template ${template.code} (index ${index}): código deve seguir formato MSG1, MSG2, etc.`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Função para validar variáveis (reutilizada do event-registry)
 */
function validateTemplateVariables(variables: string[]): { valid: string[], invalid: string[] } {
  const TEMPLATE_VARIABLES = [
    'Nome', 'PrimeiroNome', 'DataTreino', 'DataUltimoTreino', 'DataVenda',
    'DataInicio', 'DataNascimento', 'DataVencimento', 'Idade', 'MesesAtivo',
    'DiasRestantes', 'LinkAnamnese', 'TipoOcorrencia', 'DescricaoOcorrencia', 'DataOcorrencia'
  ] as const
  
  const valid: string[] = []
  const invalid: string[] = []
  
  variables.forEach(variable => {
    if (TEMPLATE_VARIABLES.includes(variable as any)) {
      valid.push(variable)
    } else {
      invalid.push(variable)
    }
  })
  
  return { valid, invalid }
}
