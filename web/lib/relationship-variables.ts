/**
 * GATE 10.6.7.3 - Variáveis de Relacionamento
 * 
 * Catálogo de variáveis disponíveis para templates de mensagens
 */

export const RELATIONSHIP_VARIABLES = {
  // Pessoais
  'Nome': {
    description: 'Nome completo do aluno',
    example: 'João Silva Santos',
    category: 'pessoal'
  },
  'PrimeiroNome': {
    description: 'Primeiro nome do aluno',
    example: 'João',
    category: 'pessoal'
  },
  'Sobrenome': {
    description: 'Sobrenome do aluno',
    example: 'Silva Santos',
    category: 'pessoal'
  },
  'Email': {
    description: 'E-mail do aluno',
    example: 'joao@email.com',
    category: 'pessoal'
  },
  'Telefone': {
    description: 'Telefone do aluno',
    example: '(11) 99999-9999',
    category: 'pessoal'
  },
  
  // Temporais
  'DataAtual': {
    description: 'Data atual',
    example: '29/01/2025',
    category: 'temporal'
  },
  'HoraAtual': {
    description: 'Hora atual',
    example: '14:30',
    category: 'temporal'
  },
  'DataVenda': {
    description: 'Data da venda',
    example: '28/01/2025',
    category: 'temporal'
  },
  'DataTreino': {
    description: 'Data do treino',
    example: '30/01/2025',
    category: 'temporal'
  },
  'DataUltimoTreino': {
    description: 'Data do último treino',
    example: '25/01/2025',
    category: 'temporal'
  },
  'SaudacaoTemporal': {
    description: 'Saudação baseada no horário',
    example: 'Bom dia',
    category: 'temporal'
  },
  
  // Treino
  'LinkAnamnese': {
    description: 'Link para anamnese',
    example: 'https://app.organizacao10x.com/anamnese/123',
    category: 'treino'
  },
  'PlanoAtual': {
    description: 'Plano atual do aluno',
    example: 'Plano Premium',
    category: 'treino'
  },
  'ValorPlano': {
    description: 'Valor do plano',
    example: 'R$ 199,90',
    category: 'treino'
  },
  
  // Profissional
  'NomePersonal': {
    description: 'Nome do personal trainer',
    example: 'Carlos Personal',
    category: 'profissional'
  },
  'TelefonePersonal': {
    description: 'Telefone do personal trainer',
    example: '(11) 88888-8888',
    category: 'profissional'
  },
  'EmailPersonal': {
    description: 'E-mail do personal trainer',
    example: 'carlos@academia.com',
    category: 'profissional'
  }
} as const

export const VARIABLE_CATEGORIES = {
  pessoal: {
    name: 'Pessoais',
    description: 'Informações pessoais do aluno',
    color: 'blue'
  },
  temporal: {
    name: 'Temporais',
    description: 'Datas e horários',
    color: 'green'
  },
  treino: {
    name: 'Treino',
    description: 'Informações de treino e planos',
    color: 'orange'
  },
  profissional: {
    name: 'Profissional',
    description: 'Informações do personal trainer',
    color: 'purple'
  }
} as const

export function getVariablesByCategory(category: string) {
  return Object.entries(RELATIONSHIP_VARIABLES)
    .filter(([_, variable]) => variable.category === category)
    .map(([key, variable]) => ({ key, ...variable }))
}

export function getAllVariables() {
  return Object.entries(RELATIONSHIP_VARIABLES)
    .map(([key, variable]) => ({ key, ...variable }))
}

export function getVariableDescription(key: string): string {
  return RELATIONSHIP_VARIABLES[key as keyof typeof RELATIONSHIP_VARIABLES]?.description || key
}

export function getVariableExample(key: string): string {
  return RELATIONSHIP_VARIABLES[key as keyof typeof RELATIONSHIP_VARIABLES]?.example || ''
}