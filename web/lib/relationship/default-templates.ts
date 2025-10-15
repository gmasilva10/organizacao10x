/**
 * Default Templates - Templates Padrão para Relacionamento
 * 
 * Conjunto de templates prontos para uso que podem ser populados
 * no sistema para acelerar a adoção.
 */

export interface DefaultTemplate {
  code: string
  title: string
  anchor: string
  touchpoint: string
  suggested_offset: string
  channel_default: string
  message_v1: string
  message_v2?: string
  active: boolean
  temporal_offset_days: number | null
  temporal_anchor_field: string | null
  audience_filter: Record<string, any>
  variables: string[]
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  // 1. Boas-vindas (imediato após venda)
  {
    code: 'WELCOME_01',
    title: 'Boas-vindas - Logo Após Venda',
    anchor: 'sale_close',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: '[SaudacaoTemporal], [PrimeiroNome]! 🎉\n\nSeja muito bem-vindo(a) à Personal Global! Estou muito feliz em tê-lo(a) conosco.\n\nVamos juntos nessa jornada de transformação! 💪',
    active: true,
    temporal_offset_days: 0,
    temporal_anchor_field: 'created_at',
    audience_filter: {},
    variables: ['[SaudacaoTemporal]', '[PrimeiroNome]']
  },

  // 2. Lembrete primeiro treino (1 dia antes)
  {
    code: 'FIRST_WORKOUT_REMINDER',
    title: 'Lembrete - Primeiro Treino Amanhã',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '-1d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 👋\n\nAmanhã é o seu primeiro treino! Estou ansioso para te conhecer melhor.\n\nLembre-se de trazer roupa confortável e uma garrafa de água. Nos vemos em breve! 🏋️',
    active: true,
    temporal_offset_days: -1,
    temporal_anchor_field: 'first_workout_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 3. Check-in primeira semana (8 dias após primeiro treino)
  {
    code: 'FIRST_WEEK_CHECKIN',
    title: 'Check-in - Primeira Semana',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '+8d',
    channel_default: 'whatsapp',
    message_v1: '[SaudacaoTemporal], [PrimeiroNome]! 😊\n\nComo foi sua primeira semana de treino? Espero que esteja gostando!\n\nSe tiver qualquer dúvida ou precisar de ajustes no treino, estou aqui para te ajudar. Vamos juntos! 💪',
    active: true,
    temporal_offset_days: 8,
    temporal_anchor_field: 'first_workout_date',
    audience_filter: {},
    variables: ['[SaudacaoTemporal]', '[PrimeiroNome]']
  },

  // 4. Acompanhamento semanal
  {
    code: 'WEEKLY_FOLLOWUP_01',
    title: 'Acompanhamento Semanal',
    anchor: 'weekly_followup',
    touchpoint: 'WhatsApp',
    suggested_offset: '+7d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 👋\n\nComo está sendo a semana? Vi que seu último treino foi em [DataUltimoTreino].\n\nVamos manter o ritmo? Estou aqui para te apoiar! 💪',
    active: true,
    temporal_offset_days: 7,
    temporal_anchor_field: 'last_workout_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[DataUltimoTreino]']
  },

  // 5. Revisão mensal
  {
    code: 'MONTHLY_REVIEW_01',
    title: 'Revisão Mensal de Progresso',
    anchor: 'monthly_review',
    touchpoint: 'WhatsApp',
    suggested_offset: '+30d',
    channel_default: 'whatsapp',
    message_v1: '[SaudacaoTemporal], [PrimeiroNome]! 🎯\n\nJá se passaram [MesesAtivo] meses desde que começamos! Que tal marcarmos uma conversa para avaliar seu progresso?\n\nVamos celebrar suas conquistas e ajustar o que for necessário! 📊',
    active: true,
    temporal_offset_days: 30,
    temporal_anchor_field: 'first_workout_date',
    audience_filter: {},
    variables: ['[SaudacaoTemporal]', '[PrimeiroNome]', '[MesesAtivo]']
  },

  // 6. Aniversário
  {
    code: 'BIRTHDAY_01',
    title: 'Feliz Aniversário',
    anchor: 'birthday',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: '🎉🎂 FELIZ ANIVERSÁRIO, [PrimeiroNome]! 🎂🎉\n\nHoje é um dia especial! Desejo que você tenha um ano incrível, cheio de saúde, conquistas e muito treino! 💪\n\nParabéns pelos seus [Idade] anos! 🎈',
    active: true,
    temporal_offset_days: 0,
    temporal_anchor_field: 'birth_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[Idade]']
  },

  // 7. Renovação - 7 dias antes
  {
    code: 'RENEWAL_7D',
    title: 'Lembrete Renovação - 7 Dias',
    anchor: 'renewal_window',
    touchpoint: 'WhatsApp',
    suggested_offset: '-7d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 📅\n\nSeu plano [NomePlano] vence em [DiasRestantes] dias ([DataVencimento]).\n\nVamos garantir a continuidade do seu treino? Entre em contato para renovar! 💪',
    active: true,
    temporal_offset_days: -7,
    temporal_anchor_field: 'next_renewal_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[NomePlano]', '[DiasRestantes]', '[DataVencimento]']
  },

  // 8. Renovação - 3 dias antes
  {
    code: 'RENEWAL_3D',
    title: 'Lembrete Renovação - 3 Dias (Urgente)',
    anchor: 'renewal_window',
    touchpoint: 'WhatsApp',
    suggested_offset: '-3d',
    channel_default: 'whatsapp',
    message_v1: '⚠️ [PrimeiroNome], atenção!\n\nSeu plano [NomePlano] vence em apenas [DiasRestantes] dias!\n\nNão perca o ritmo! Renove agora para continuar sua evolução. 🚀\n\n[LinkPagamento]',
    active: true,
    temporal_offset_days: -3,
    temporal_anchor_field: 'next_renewal_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[NomePlano]', '[DiasRestantes]', '[LinkPagamento]']
  },

  // 9. Follow-up de ocorrência
  {
    code: 'OCCURRENCE_FOLLOWUP_01',
    title: 'Follow-up de Ocorrência',
    anchor: 'occurrence_followup',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 👋\n\nEstou entrando em contato sobre: [TipoOcorrencia]\n\nComo você está se sentindo? Precisamos fazer algum ajuste no treino?\n\nEstou aqui para te ajudar! 💙',
    active: true,
    temporal_offset_days: 0,
    temporal_anchor_field: 'created_at',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[TipoOcorrencia]']
  },

  // 10. Anamnese - solicitar preenchimento
  {
    code: 'ANAMNESE_REQUEST',
    title: 'Solicitação de Anamnese',
    anchor: 'sale_close',
    touchpoint: 'WhatsApp',
    suggested_offset: '+1d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 📋\n\nPara eu poder criar o melhor treino para você, preciso que preencha sua anamnese.\n\nÉ rápido e vai me ajudar muito a entender seu histórico e objetivos!\n\n[LinkAnamnese]\n\nQualquer dúvida, estou aqui! 😊',
    active: true,
    temporal_offset_days: 1,
    temporal_anchor_field: 'created_at',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[LinkAnamnese]']
  },

  // 11. Check-in 15 dias
  {
    code: 'CHECKIN_15D',
    title: 'Check-in - 15 Dias',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '+15d',
    channel_default: 'whatsapp',
    message_v1: '[SaudacaoTemporal], [PrimeiroNome]! 🎯\n\nJá completamos 15 dias de treino! Como está se sentindo?\n\nPercebeu alguma mudança? Vamos conversar sobre seu progresso! 📈',
    active: true,
    temporal_offset_days: 15,
    temporal_anchor_field: 'first_workout_date',
    audience_filter: {},
    variables: ['[SaudacaoTemporal]', '[PrimeiroNome]']
  },

  // 12. Check-in 30 dias
  {
    code: 'CHECKIN_30D',
    title: 'Check-in - 1 Mês',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '+30d',
    channel_default: 'whatsapp',
    message_v1: '🎉 [PrimeiroNome], parabéns!\n\nCompletamos 1 mês de treino juntos! Estou muito orgulhoso(a) da sua dedicação.\n\nVamos marcar uma avaliação para ver sua evolução? 📊💪',
    active: true,
    temporal_offset_days: 30,
    temporal_anchor_field: 'first_workout_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 13. Reengajamento - sem treino há 10 dias
  {
    code: 'REENGAGEMENT_10D',
    title: 'Reengajamento - 10 Dias Sem Treino',
    anchor: 'weekly_followup',
    touchpoint: 'WhatsApp',
    suggested_offset: '+10d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 😊\n\nNotei que faz um tempo que não nos vemos. Está tudo bem?\n\nSe precisar de ajuda para retomar, estou aqui! Vamos juntos? 💙',
    active: true,
    temporal_offset_days: 10,
    temporal_anchor_field: 'last_workout_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 14. Renovação - no dia do vencimento
  {
    code: 'RENEWAL_TODAY',
    title: 'Renovação - Vence Hoje',
    anchor: 'renewal_window',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: '⏰ [PrimeiroNome], seu plano [NomePlano] vence HOJE!\n\nNão deixe para depois! Renove agora para não perder o acesso.\n\n[LinkPagamento]\n\nEstou aqui se precisar de ajuda! 🙏',
    active: true,
    temporal_offset_days: 0,
    temporal_anchor_field: 'next_renewal_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]', '[NomePlano]', '[LinkPagamento]']
  },

  // 15. Agradecimento pós-renovação
  {
    code: 'RENEWAL_THANKS',
    title: 'Agradecimento - Pós Renovação',
    anchor: 'sale_close',
    touchpoint: 'WhatsApp',
    suggested_offset: '+1d',
    channel_default: 'whatsapp',
    message_v1: '[PrimeiroNome], muito obrigado(a) por renovar sua confiança! 🙏\n\nVamos continuar trabalhando forte para alcançar seus objetivos!\n\nSeu novo plano [NomePlano] já está ativo. Vamos com tudo! 💪🔥',
    active: true,
    temporal_offset_days: 1,
    temporal_anchor_field: 'created_at',
    audience_filter: { tags: ['Renovacao'] },
    variables: ['[PrimeiroNome]', '[NomePlano]']
  }
]

/**
 * Retorna templates filtrados por âncora
 */
export function getTemplatesByAnchor(anchor: string): DefaultTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.anchor === anchor)
}

/**
 * Retorna template por código
 */
export function getTemplateByCode(code: string): DefaultTemplate | undefined {
  return DEFAULT_TEMPLATES.find(t => t.code === code)
}

/**
 * Retorna todos os templates ativos
 */
export function getActiveTemplates(): DefaultTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.active)
}
