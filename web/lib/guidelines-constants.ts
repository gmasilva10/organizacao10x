// Constantes baseadas na planilha de Diretrizes de Treino
// Anamnese - TOMADA DE DECISÃO.xlsx

export const GUIDELINE_TAGS = [
  { value: 'dac', label: 'DAC (Doença Arterial Coronariana)', category: 'cardiovascular' },
  { value: 'hipertensao', label: 'Hipertensão Arterial', category: 'cardiovascular' },
  { value: 'condromalacia', label: 'Condromalácia Patelar', category: 'musculoesqueletica' },
  { value: 'diabetes', label: 'Diabetes Mellitus', category: 'metabolica' },
  { value: 'obesidade', label: 'Obesidade', category: 'metabolica' },
  { value: 'hipertrofia', label: 'Hipertrofia Muscular', category: 'objetivo' },
  { value: 'emagrecimento', label: 'Emagrecimento', category: 'objetivo' },
  { value: 'condicionamento', label: 'Condicionamento Físico', category: 'objetivo' },
  { value: 'reabilitacao', label: 'Reabilitação', category: 'objetivo' },
  { value: 'forca', label: 'Força', category: 'capacidade' },
  { value: 'resistencia', label: 'Resistência', category: 'capacidade' },
  { value: 'flexibilidade', label: 'Flexibilidade', category: 'capacidade' },
  { value: 'coordinacao', label: 'Coordenação', category: 'capacidade' }
] as const

export const OPERATORS = [
  { value: 'eq', label: 'Igual a', description: 'Valor exato' },
  { value: 'ne', label: 'Diferente de', description: 'Valor diferente' },
  { value: 'gt', label: 'Maior que', description: 'Valor maior' },
  { value: 'gte', label: 'Maior ou igual a', description: 'Valor maior ou igual' },
  { value: 'lt', label: 'Menor que', description: 'Valor menor' },
  { value: 'lte', label: 'Menor ou igual a', description: 'Valor menor ou igual' },
  { value: 'in', label: 'Contém', description: 'Lista de valores' },
  { value: 'nin', label: 'Não contém', description: 'Não está na lista' }
] as const

export const PRIORITY_LEVELS = [
  { value: 'critica', label: 'Crítica', color: 'bg-red-100 text-red-800', description: 'Risco alto, atenção imediata' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800', description: 'Risco moderado, monitoramento' },
  { value: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-800', description: 'Risco baixo, acompanhamento' },
  { value: 'baixa', label: 'Baixa', color: 'bg-green-100 text-green-800', description: 'Risco mínimo, manutenção' }
] as const

// Validações baseadas na planilha
export const VALIDATION_RULES = {
  resistencia_aerobia: {
    duracao: {
      required: true,
      pattern: /^\d+-\d+min$|^\d+min$/,
      message: 'Formato: 30-60min ou 45min'
    },
    intensidade: {
      required: true,
      pattern: /^\d+-\d+% FCR$|^\d+% FCR$|^\d+-\d+ PSE$|^\d+ PSE$/,
      message: 'Formato: 40-60% FCR ou 50% FCR ou 11-13 PSE'
    },
    frequencia: {
      required: true,
      pattern: /^\d+-\d+x\/sem$|^\d+x\/sem$/,
      message: 'Formato: 3-5x/sem ou 4x/sem'
    }
  },
  treino_pesos: {
    volume: {
      required: true,
      pattern: /^\d+-\d+ exercícios$|^\d+ exercícios$/,
      message: 'Formato: 8-10 exercícios ou 12 exercícios'
    },
    series: {
      required: true,
      pattern: /^\d+-\d+ séries$|^\d+ séries$/,
      message: 'Formato: 1-3 séries ou 2 séries'
    },
    reps: {
      required: true,
      pattern: /^\d+-\d+ reps$|^\d+ reps$/,
      message: 'Formato: 8-12 reps ou 10 reps'
    },
    frequencia: {
      required: true,
      pattern: /^\d+-\d+x\/sem$|^\d+x\/sem$/,
      message: 'Formato: 2-3x/sem ou 3x/sem'
    },
    intensidade: {
      required: true,
      pattern: /^\d+-\d+% 1RM$|^\d+% 1RM$|^Moderada$|^Alta$|^Baixa$/,
      message: 'Formato: 60-80% 1RM ou Moderada'
    }
  },
  flexibilidade: {
    maxLength: 500,
    message: 'Máximo 500 caracteres'
  },
  contraindicacoes: {
    maxItems: 10,
    maxLength: 200,
    message: 'Máximo 10 contraindicações, 200 caracteres cada'
  },
  observacoes_gerais: {
    maxItems: 15,
    maxLength: 300,
    message: 'Máximo 15 observações, 300 caracteres cada'
  }
} as const

// Textos de exemplo baseados na planilha
export const EXAMPLE_TEXTS = {
  resistencia_aerobia: {
    duracao: '30-60min',
    intensidade: '40-60% FCR (Borg 11-13)',
    observacoes: 'Monitorar FC e PSE constantemente'
  },
  treino_pesos: {
    volume: '8-10 exercícios',
    series: '1-3 séries',
    reps: '8-12 reps',
    frequencia: '2-3x/sem',
    intensidade: '60-80% 1RM'
  },
  flexibilidade: 'Alongamentos estáticos 15-30s, 2-3x por exercício',
  contraindicacoes: [
    'Evitar manobra de Valsalva',
    'Atenção aos limites de PAS/PAD',
    'Monitorar PSE com betabloqueadores'
  ],
  observacoes_gerais: [
    'Iniciar com cargas leves',
    'Progressão gradual',
    'Acompanhamento médico regular'
  ]
} as const

// Regras específicas da planilha
export const PLANILHA_RULES = {
  hipertensao: {
    resistencia_aerobia: {
      duracao: '30-60min',
      intensidade: '40-60% FCR (Borg 11-13)',
      observacoes: 'Monitorar PA antes, durante e após'
    },
    treino_pesos: {
      volume: '8-10 exercícios',
      series: '1-3 séries',
      reps: '8-12 reps',
      frequencia: '2-3x/sem',
      intensidade: '60-80% 1RM'
    },
    contraindicacoes: [
      'Evitar manobra de Valsalva',
      'Atenção aos limites de PAS/PAD',
      'Monitorar PSE com betabloqueadores'
    ],
    observacoes_gerais: [
      'Iniciar com cargas leves',
      'Progressão gradual',
      'Acompanhamento médico regular'
    ]
  },
  condromalacia: {
    resistencia_aerobia: {
      duracao: '20-40min',
      intensidade: '50-70% FCR (Borg 12-14)',
      observacoes: 'Evitar impacto, preferir bicicleta/elíptico'
    },
    treino_pesos: {
      volume: '6-8 exercícios',
      series: '2-3 séries',
      reps: '12-15 reps',
      frequencia: '2-3x/sem',
      intensidade: '50-70% 1RM'
    },
    contraindicacoes: [
      'Evitar agachamentos profundos',
      'Não realizar leg press com ângulo fechado',
      'Evitar saltos e impactos'
    ],
    observacoes_gerais: [
      'Foco em fortalecimento do quadríceps',
      'Alongamentos específicos para joelho',
      'Acompanhamento fisioterapêutico'
    ]
  }
} as const

// Função para validar uma regra
export function validateRule(rule: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar condições
  if (!rule.condition?.all || rule.condition.all.length === 0) {
    errors.push('Pelo menos uma condição é obrigatória')
  }

  rule.condition?.all?.forEach((cond: any, index: number) => {
    if (!cond.tag) {
      errors.push(`Condição ${index + 1}: Tag é obrigatória`)
    }
    if (!cond.val) {
      errors.push(`Condição ${index + 1}: Valor é obrigatório`)
    }
  })

  // Validar outputs
  const outputs = rule.outputs
  if (!outputs) {
    errors.push('Outputs são obrigatórios')
    return { isValid: false, errors }
  }

  // Validar aeróbio
  if (outputs.aerobio) {
    if (!outputs.aerobio.duracao_min || !Array.isArray(outputs.aerobio.duracao_min) || outputs.aerobio.duracao_min.length !== 2) {
      errors.push('Duração aeróbia deve ser um array de 2 números [min, max]')
    }
    if (!outputs.aerobio.frequencia_sem || !Array.isArray(outputs.aerobio.frequencia_sem) || outputs.aerobio.frequencia_sem.length !== 2) {
      errors.push('Frequência aeróbia deve ser um array de 2 números [min, max]')
    }
    if (!outputs.aerobio.intensidade?.metodo) {
      errors.push('Método de intensidade aeróbia é obrigatório')
    }
    if (!outputs.aerobio.intensidade?.faixa || !Array.isArray(outputs.aerobio.intensidade.faixa) || outputs.aerobio.intensidade.faixa.length !== 2) {
      errors.push('Faixa de intensidade aeróbia deve ser um array de 2 números [min, max]')
    }
  }

  // Validar pesos
  if (outputs.pesos) {
    if (!outputs.pesos.exercicios || !Array.isArray(outputs.pesos.exercicios) || outputs.pesos.exercicios.length !== 2) {
      errors.push('Exercícios devem ser um array de 2 números [min, max]')
    }
    if (!outputs.pesos.series || !Array.isArray(outputs.pesos.series) || outputs.pesos.series.length !== 2) {
      errors.push('Séries devem ser um array de 2 números [min, max]')
    }
    if (!outputs.pesos.reps || !Array.isArray(outputs.pesos.reps) || outputs.pesos.reps.length !== 2) {
      errors.push('Repetições devem ser um array de 2 números [min, max]')
    }
    if (!outputs.pesos.frequencia_sem || !Array.isArray(outputs.pesos.frequencia_sem) || outputs.pesos.frequencia_sem.length !== 2) {
      errors.push('Frequência de pesos deve ser um array de 2 números [min, max]')
    }
    if (!outputs.pesos.intensidade_pct_1rm || !Array.isArray(outputs.pesos.intensidade_pct_1rm) || outputs.pesos.intensidade_pct_1rm.length !== 2) {
      errors.push('Intensidade % 1RM deve ser um array de 2 números [min, max]')
    }
  }

  // Validar contraindicações
  if (outputs.contraindicacoes && outputs.contraindicacoes.length > VALIDATION_RULES.contraindicacoes.maxItems) {
    errors.push(`Máximo ${VALIDATION_RULES.contraindicacoes.maxItems} contraindicações`)
  }

  // Validar observações gerais
  if (outputs.observacoes && outputs.observacoes.length > VALIDATION_RULES.observacoes_gerais.maxItems) {
    errors.push(`Máximo ${VALIDATION_RULES.observacoes_gerais.maxItems} observações gerais`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Função para obter sugestões baseadas na tag
export function getSuggestionsForTag(tag: string): any {
  const rule = PLANILHA_RULES[tag as keyof typeof PLANILHA_RULES]
  if (rule) {
    return rule
  }

  // Retornar sugestões genéricas
  return EXAMPLE_TEXTS
}

// Validação de tags canônicas
export function isValidCanonicalTag(tag: string): boolean {
  return GUIDELINE_TAGS.some(t => t.value === tag)
}

export function getCanonicalTagInfo(tag: string) {
  return GUIDELINE_TAGS.find(t => t.value === tag)
}

export function validateCanonicalTags(tags: string[]): { isValid: boolean; invalidTags: string[]; validTags: string[] } {
  const invalidTags: string[] = []
  const validTags: string[] = []

  tags.forEach(tag => {
    if (isValidCanonicalTag(tag)) {
      validTags.push(tag)
    } else {
      invalidTags.push(tag)
    }
  })

  return {
    isValid: invalidTags.length === 0,
    invalidTags,
    validTags
  }
}

// Função para obter tags por categoria
export function getTagsByCategory(category: string) {
  return GUIDELINE_TAGS.filter(tag => tag.category === category)
}

// Função para obter todas as categorias
export function getAllCategories() {
  return Array.from(new Set(GUIDELINE_TAGS.map(tag => tag.category)))
}

// Função para buscar tags por termo
export function searchTags(searchTerm: string) {
  const term = searchTerm.toLowerCase()
  return GUIDELINE_TAGS.filter(tag => 
    tag.label.toLowerCase().includes(term) ||
    tag.value.toLowerCase().includes(term) ||
    tag.category.toLowerCase().includes(term)
  )
}