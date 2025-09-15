/**
 * GATE A-10.2.5 - Constantes WhatsApp
 * 
 * Mensagens e templates padrão para processos WhatsApp
 * Futuramente parametrizáveis por organização
 */

export const ORG_DEFAULT_DDD = "11"

export const DEFAULT_CONTACT_GREETING = "Olá {PrimeiroNome}, tudo bem?"

export const DEFAULT_GROUP_NAME_TEMPLATE = "{OrgCurta} · {PrimeiroNome} {InicialSobrenome}"

export const DEFAULT_GROUP_WELCOME = "Olá, pessoal! Este é o grupo de acompanhamento do(a) {PrimeiroNome}. Bem-vindos! 👋"

export const WHATSAPP_ACTIONS = {
  CONTACT_VCARD_GENERATED: 'contact_vcard_generated',
  WHATSAPP_CHAT_OPENED: 'whatsapp_chat_opened',
  WHATSAPP_GROUP_ASSISTED_STARTED: 'whatsapp_group_assisted_started',
  WHATSAPP_GROUP_ASSISTED_COMPLETED: 'whatsapp_group_assisted_completed'
} as const

export const WHATSAPP_CHANNEL = 'whatsapp'

export const WHATSAPP_ORIGIN = 'students.processes'
