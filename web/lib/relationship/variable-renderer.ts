/**
 * Variable Renderer - Sistema de Renderização de Variáveis Dinâmicas
 * 
 * Substitui variáveis em templates de mensagens com dados reais do aluno,
 * planos, e contexto temporal.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

export interface StudentContext {
  id: string
  name: string
  email?: string
  phone?: string
  birth_date?: string | null
  created_at: string
  first_workout_date?: string | null
  last_workout_date?: string | null
  org_id: string
}

export interface ServiceContext {
  name?: string
  price_cents?: number
  end_date?: string | null
  next_renewal_date?: string | null
}

export interface RenderContext {
  student: StudentContext
  service?: ServiceContext
  occurrence?: {
    type?: string
    description?: string
    created_at?: string
  }
}

/**
 * Gera saudação temporal baseada na hora do dia
 */
function getTemporalGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia'
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde'
  } else {
    return 'Boa noite'
  }
}

/**
 * Calcula idade baseada na data de nascimento
 */
function calculateAge(birthDate: string | null | undefined): number {
  if (!birthDate) return 0
  
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Calcula dias restantes até uma data
 */
function calculateDaysRemaining(targetDate: string | null | undefined): number {
  if (!targetDate) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Formata data para formato brasileiro
 */
function formatDateBR(date: string | null | undefined): string {
  if (!date) return ''
  
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

/**
 * Formata valor monetário
 */
function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

/**
 * Gera link de anamnese para o aluno
 */
function generateAnamneseLink(studentId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/anamnese/public/${studentId}`
}

/**
 * Gera link de pagamento (placeholder - implementar integração futura)
 */
function generatePaymentLink(studentId: string, serviceId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/payment/${studentId}${serviceId ? `?service=${serviceId}` : ''}`
}

/**
 * Calcula meses de atividade
 */
function calculateMonthsActive(createdAt: string): number {
  const today = new Date()
  const created = new Date(createdAt)
  
  const yearDiff = today.getFullYear() - created.getFullYear()
  const monthDiff = today.getMonth() - created.getMonth()
  
  return yearDiff * 12 + monthDiff
}

/**
 * Renderiza mensagem substituindo todas as variáveis
 */
export async function renderMessage(
  template: string,
  context: RenderContext
): Promise<string> {
  let message = template
  const { student, service, occurrence } = context

  // Variáveis Pessoais
  message = message.replace(/\[Nome do Aluno\]/g, student.name)
  message = message.replace(/\[Nome do Cliente\]/g, student.name)
  message = message.replace(/\[Nome\]/g, student.name)
  message = message.replace(/\[PrimeiroNome\]/g, student.name.split(' ')[0])
  
  // Variáveis Temporais
  message = message.replace(/\[SaudacaoTemporal\]/g, getTemporalGreeting())
  message = message.replace(/\[DataVenda\]/g, formatDateBR(student.created_at))
  message = message.replace(/\[DataInicio\]/g, formatDateBR(student.created_at))
  message = message.replace(/\[DataNascimento\]/g, formatDateBR(student.birth_date))
  message = message.replace(/\[Idade\]/g, calculateAge(student.birth_date).toString())
  message = message.replace(/\[MesesAtivo\]/g, calculateMonthsActive(student.created_at).toString())
  
  // Variáveis de Treino
  message = message.replace(/\[DataTreino\]/g, formatDateBR(student.first_workout_date))
  message = message.replace(/\[DataUltimoTreino\]/g, formatDateBR(student.last_workout_date))
  
  // Variáveis de Plano/Serviço
  if (service) {
    message = message.replace(/\[NomePlano\]/g, service.name || '')
    message = message.replace(/\[ValorPlano\]/g, formatCurrency(service.price_cents))
    message = message.replace(/\[DataVencimento\]/g, formatDateBR(service.end_date || service.next_renewal_date))
    message = message.replace(/\[DiasRestantes\]/g, calculateDaysRemaining(service.end_date || service.next_renewal_date).toString())
  } else {
    // Buscar serviço ativo do aluno se não foi fornecido
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: services } = await supabase
        .from('student_services')
        .select('name, price_cents, end_date, next_renewal_date')
        .eq('student_id', student.id)
        .eq('org_id', student.org_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (services && services.length > 0) {
        const activeService = services[0]
        message = message.replace(/\[NomePlano\]/g, activeService.name || '')
        message = message.replace(/\[ValorPlano\]/g, formatCurrency(activeService.price_cents))
        message = message.replace(/\[DataVencimento\]/g, formatDateBR(activeService.end_date || activeService.next_renewal_date))
        message = message.replace(/\[DiasRestantes\]/g, calculateDaysRemaining(activeService.end_date || activeService.next_renewal_date).toString())
      } else {
        // Fallback para valores vazios
        message = message.replace(/\[NomePlano\]/g, '')
        message = message.replace(/\[ValorPlano\]/g, 'R$ 0,00')
        message = message.replace(/\[DataVencimento\]/g, '')
        message = message.replace(/\[DiasRestantes\]/g, '0')
      }
    } catch (error) {
      console.warn('Erro ao buscar serviço do aluno:', error)
      message = message.replace(/\[NomePlano\]/g, '')
      message = message.replace(/\[ValorPlano\]/g, 'R$ 0,00')
      message = message.replace(/\[DataVencimento\]/g, '')
      message = message.replace(/\[DiasRestantes\]/g, '0')
    }
  }
  
  // Variáveis de Links
  message = message.replace(/\[LinkAnamnese\]/g, generateAnamneseLink(student.id))
  message = message.replace(/\[LinkPagamento\]/g, generatePaymentLink(student.id))
  
  // Variáveis de Ocorrência
  if (occurrence) {
    message = message.replace(/\[TipoOcorrencia\]/g, occurrence.type || '')
    message = message.replace(/\[DescricaoOcorrencia\]/g, occurrence.description || '')
    message = message.replace(/\[DataOcorrencia\]/g, formatDateBR(occurrence.created_at))
  } else {
    message = message.replace(/\[TipoOcorrencia\]/g, '')
    message = message.replace(/\[DescricaoOcorrencia\]/g, '')
    message = message.replace(/\[DataOcorrencia\]/g, '')
  }
  
  // Variáveis de Progresso (placeholder - implementar quando métricas estiverem disponíveis)
  message = message.replace(/\[ProgressoSemanal\]/g, 'N/A')
  
  return message
}

/**
 * Renderiza mensagem de forma síncrona (sem buscar dados adicionais)
 */
export function renderMessageSync(
  template: string,
  context: RenderContext
): string {
  let message = template
  const { student, service, occurrence } = context

  // Variáveis Pessoais
  message = message.replace(/\[Nome do Aluno\]/g, student.name)
  message = message.replace(/\[Nome do Cliente\]/g, student.name)
  message = message.replace(/\[Nome\]/g, student.name)
  message = message.replace(/\[PrimeiroNome\]/g, student.name.split(' ')[0])
  
  // Variáveis Temporais
  message = message.replace(/\[SaudacaoTemporal\]/g, getTemporalGreeting())
  message = message.replace(/\[DataVenda\]/g, formatDateBR(student.created_at))
  message = message.replace(/\[DataInicio\]/g, formatDateBR(student.created_at))
  message = message.replace(/\[DataNascimento\]/g, formatDateBR(student.birth_date))
  message = message.replace(/\[Idade\]/g, calculateAge(student.birth_date).toString())
  message = message.replace(/\[MesesAtivo\]/g, calculateMonthsActive(student.created_at).toString())
  
  // Variáveis de Treino
  message = message.replace(/\[DataTreino\]/g, formatDateBR(student.first_workout_date))
  message = message.replace(/\[DataUltimoTreino\]/g, formatDateBR(student.last_workout_date))
  
  // Variáveis de Plano/Serviço
  if (service) {
    message = message.replace(/\[NomePlano\]/g, service.name || '')
    message = message.replace(/\[ValorPlano\]/g, formatCurrency(service.price_cents))
    message = message.replace(/\[DataVencimento\]/g, formatDateBR(service.end_date || service.next_renewal_date))
    message = message.replace(/\[DiasRestantes\]/g, calculateDaysRemaining(service.end_date || service.next_renewal_date).toString())
  } else {
    message = message.replace(/\[NomePlano\]/g, '')
    message = message.replace(/\[ValorPlano\]/g, 'R$ 0,00')
    message = message.replace(/\[DataVencimento\]/g, '')
    message = message.replace(/\[DiasRestantes\]/g, '0')
  }
  
  // Variáveis de Links
  message = message.replace(/\[LinkAnamnese\]/g, generateAnamneseLink(student.id))
  message = message.replace(/\[LinkPagamento\]/g, generatePaymentLink(student.id))
  
  // Variáveis de Ocorrência
  if (occurrence) {
    message = message.replace(/\[TipoOcorrencia\]/g, occurrence.type || '')
    message = message.replace(/\[DescricaoOcorrencia\]/g, occurrence.description || '')
    message = message.replace(/\[DataOcorrencia\]/g, formatDateBR(occurrence.created_at))
  } else {
    message = message.replace(/\[TipoOcorrencia\]/g, '')
    message = message.replace(/\[DescricaoOcorrencia\]/g, '')
    message = message.replace(/\[DataOcorrencia\]/g, '')
  }
  
  // Variáveis de Progresso
  message = message.replace(/\[ProgressoSemanal\]/g, 'N/A')
  
  return message
}

/**
 * Extrai variáveis usadas em um template
 */
export function extractVariables(template: string): string[] {
  const regex = /\[([^\]]+)\]/g
  const matches = template.matchAll(regex)
  const variables = new Set<string>()
  
  for (const match of matches) {
    variables.add(match[0]) // Adiciona a variável completa com colchetes
  }
  
  return Array.from(variables)
}

/**
 * Valida se todas as variáveis em um template são válidas
 */
export function validateTemplateVariables(template: string): {
  valid: boolean
  unknownVariables: string[]
} {
  const KNOWN_VARIABLES = [
    '[Nome do Aluno]',
    '[Nome do Cliente]',
    '[Nome]',
    '[PrimeiroNome]',
    '[SaudacaoTemporal]',
    '[DataVenda]',
    '[DataInicio]',
    '[DataNascimento]',
    '[Idade]',
    '[MesesAtivo]',
    '[DataTreino]',
    '[DataUltimoTreino]',
    '[NomePlano]',
    '[ValorPlano]',
    '[DataVencimento]',
    '[DiasRestantes]',
    '[LinkAnamnese]',
    '[LinkPagamento]',
    '[TipoOcorrencia]',
    '[DescricaoOcorrencia]',
    '[DataOcorrencia]',
    '[ProgressoSemanal]'
  ]
  
  const usedVariables = extractVariables(template)
  const unknownVariables = usedVariables.filter(v => !KNOWN_VARIABLES.includes(v))
  
  return {
    valid: unknownVariables.length === 0,
    unknownVariables
  }
}

/**
 * Busca contexto completo do aluno para renderização
 */
export async function fetchStudentContext(
  studentId: string,
  orgId: string
): Promise<RenderContext | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Buscar dados do aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, birth_date, created_at, first_workout_date, last_workout_date, org_id')
      .eq('id', studentId)
      .eq('org_id', orgId)
      .single()
    
    if (studentError || !student) {
      console.error('Erro ao buscar aluno:', studentError)
      return null
    }
    
    // Buscar serviço ativo do aluno
    const { data: services } = await supabase
      .from('student_services')
      .select('name, price_cents, end_date, next_renewal_date')
      .eq('student_id', studentId)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
    
    const service = services && services.length > 0 ? services[0] : undefined
    
    return {
      student,
      service
    }
  } catch (error) {
    console.error('Erro ao buscar contexto do aluno:', error)
    return null
  }
}

/**
 * Renderiza preview de mensagem para o frontend (com dados de exemplo)
 */
export function renderPreview(template: string): string {
  const exampleContext: RenderContext = {
    student: {
      id: 'example-id',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '(11) 99999-9999',
      birth_date: '1990-05-15',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
      first_workout_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 dias atrás
      last_workout_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
      org_id: 'example-org'
    },
    service: {
      name: 'Plano Premium',
      price_cents: 29900, // R$ 299,00
      end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 dias no futuro
      next_renewal_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    occurrence: {
      type: 'Dor nas costas',
      description: 'Aluno relatou desconforto durante agachamento',
      created_at: new Date().toISOString()
    }
  }
  
  return renderMessageSync(template, exampleContext)
}

/**
 * Lista todas as variáveis disponíveis com descrições
 */
export const AVAILABLE_VARIABLES = [
  // Pessoais
  { key: '[Nome]', description: 'Nome completo do aluno', category: 'pessoal' },
  { key: '[PrimeiroNome]', description: 'Primeiro nome do aluno', category: 'pessoal' },
  { key: '[Idade]', description: 'Idade do aluno', category: 'pessoal' },
  { key: '[DataNascimento]', description: 'Data de nascimento', category: 'pessoal' },
  
  // Temporais
  { key: '[SaudacaoTemporal]', description: 'Bom dia/Boa tarde/Boa noite', category: 'temporal' },
  { key: '[DataVenda]', description: 'Data de fechamento da venda', category: 'temporal' },
  { key: '[DataInicio]', description: 'Data de início no sistema', category: 'temporal' },
  { key: '[MesesAtivo]', description: 'Meses desde o cadastro', category: 'temporal' },
  
  // Treino
  { key: '[DataTreino]', description: 'Data do primeiro treino', category: 'treino' },
  { key: '[DataUltimoTreino]', description: 'Data do último treino', category: 'treino' },
  { key: '[ProgressoSemanal]', description: 'Progresso semanal (quando disponível)', category: 'treino' },
  
  // Plano
  { key: '[NomePlano]', description: 'Nome do plano ativo', category: 'plano' },
  { key: '[ValorPlano]', description: 'Valor do plano', category: 'plano' },
  { key: '[DataVencimento]', description: 'Data de vencimento do plano', category: 'plano' },
  { key: '[DiasRestantes]', description: 'Dias até o vencimento', category: 'plano' },
  
  // Links
  { key: '[LinkAnamnese]', description: 'Link para anamnese do aluno', category: 'links' },
  { key: '[LinkPagamento]', description: 'Link de pagamento', category: 'links' },
  
  // Ocorrência
  { key: '[TipoOcorrencia]', description: 'Tipo da ocorrência', category: 'ocorrencia' },
  { key: '[DescricaoOcorrencia]', description: 'Descrição da ocorrência', category: 'ocorrencia' },
  { key: '[DataOcorrencia]', description: 'Data da ocorrência', category: 'ocorrencia' }
] as const

/**
 * Agrupa variáveis por categoria
 */
export function getVariablesByCategory(category: string) {
  return AVAILABLE_VARIABLES.filter(v => v.category === category)
}

export const VARIABLE_CATEGORIES = {
  pessoal: { name: 'Pessoal', icon: 'User' },
  temporal: { name: 'Temporal', icon: 'Calendar' },
  treino: { name: 'Treino', icon: 'Dumbbell' },
  plano: { name: 'Plano', icon: 'CreditCard' },
  links: { name: 'Links', icon: 'Link' },
  ocorrencia: { name: 'Ocorrência', icon: 'AlertCircle' }
} as const
