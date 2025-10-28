/**
 * Default Templates - Templates Padrão para Relacionamento (Corrigido)
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
    title: 'Boas-vindas após Fechamento',
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
    title: 'Lembrete - Primeiro Treino',
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
    title: 'Check-in Primeira Semana',
    anchor: 'first_workout',
    touchpoint: 'WhatsApp',
    suggested_offset: '+8d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 😊\n\nComo está sendo sua primeira semana de treinos? Estou aqui para te ajudar com qualquer dúvida ou ajuste que precisar.\n\nComo está se sentindo? 💪',
    active: true,
    temporal_offset_days: 8,
    temporal_anchor_field: 'first_workout_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 4. Aniversário
  {
    code: 'BIRTHDAY_WISH',
    title: 'Parabéns de Aniversário',
    anchor: 'birthday',
    touchpoint: 'WhatsApp',
    suggested_offset: '+0d',
    channel_default: 'whatsapp',
    message_v1: '🎉 Feliz Aniversário, [PrimeiroNome]! 🎂\n\nQue este novo ano de vida seja repleto de saúde, felicidade e muitas conquistas!\n\nParabéns! 🎊',
    active: true,
    temporal_offset_days: 0,
    temporal_anchor_field: 'birth_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 5. Follow-up de treino (1 dia após treino)
  {
    code: 'WORKOUT_FOLLOWUP',
    title: 'Follow-up de Treino',
    anchor: 'weekly_followup',
    touchpoint: 'WhatsApp',
    suggested_offset: '+1d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 👋\n\nComo está se sentindo após o treino de ontem? Alguma dor ou dúvida?\n\nLembre-se: hidratação e descanso são fundamentais! 💧😴',
    active: true,
    temporal_offset_days: 1,
    temporal_anchor_field: 'last_workout_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 6. Renovação (30 dias antes do vencimento)
  {
    code: 'RENEWAL_REMINDER',
    title: 'Lembrete de Renovação',
    anchor: 'renewal_window',
    touchpoint: 'WhatsApp',
    suggested_offset: '-30d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 😊\n\nSeu plano está próximo do vencimento. Que tal continuarmos juntos nessa jornada?\n\nVou preparar uma proposta especial para você! 💪',
    active: true,
    temporal_offset_days: -30,
    temporal_anchor_field: 'end_date',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  },

  // 7. Follow-up de ocorrência (2 dias após)
  {
    code: 'OCCURRENCE_FOLLOWUP',
    title: 'Follow-up de Ocorrência',
    anchor: 'occurrence_followup',
    touchpoint: 'WhatsApp',
    suggested_offset: '+2d',
    channel_default: 'whatsapp',
    message_v1: 'Oi [PrimeiroNome]! 👋\n\nComo está se sentindo após nossa conversa? Espero que esteja melhor.\n\nEstou aqui para o que precisar! 💙',
    active: true,
    temporal_offset_days: 2,
    temporal_anchor_field: 'created_at',
    audience_filter: {},
    variables: ['[PrimeiroNome]']
  }
]
