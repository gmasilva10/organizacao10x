/**
 * GATE 10.6.7.3 - Tags de Classificação para Relacionamento
 * 
 * Catálogo de tags de classificação para tarefas manuais
 */

export const CLASSIFICATION_TAGS = [
  {
    value: 'Renovação',
    label: 'Renovação',
    description: 'Mensagens relacionadas à renovação de planos',
    color: 'blue'
  },
  {
    value: 'Aniversário',
    label: 'Aniversário',
    description: 'Mensagens de parabéns pelo aniversário',
    color: 'pink'
  },
  {
    value: 'Boas-vindas',
    label: 'Boas-vindas',
    description: 'Mensagens de boas-vindas para novos alunos',
    color: 'green'
  },
  {
    value: 'Follow-up',
    label: 'Follow-up',
    description: 'Mensagens de acompanhamento',
    color: 'orange'
  },
  {
    value: 'Lembrete',
    label: 'Lembrete',
    description: 'Lembretes de treinos ou pagamentos',
    color: 'yellow'
  },
  {
    value: 'Promoção',
    label: 'Promoção',
    description: 'Mensagens promocionais',
    color: 'purple'
  },
  {
    value: 'Acompanhamento',
    label: 'Acompanhamento',
    description: 'Mensagens de acompanhamento geral',
    color: 'cyan'
  },
  {
    value: 'Outros',
    label: 'Outros',
    description: 'Outras categorias de mensagens',
    color: 'gray'
  }
] as const

export function getClassificationTag(value: string) {
  return CLASSIFICATION_TAGS.find(tag => tag.value === value)
}

export function getClassificationTagColor(value: string): string {
  const tag = getClassificationTag(value)
  return tag?.color || 'gray'
}

export function getClassificationTagDescription(value: string): string {
  const tag = getClassificationTag(value)
  return tag?.description || 'Tag de classificação'
}