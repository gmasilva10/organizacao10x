import { z } from 'zod'

// Schemas de validação
export const AnamneseInputSchema = z.object({
  // Antropometria
  age: z.number().min(0).max(120),
  weight: z.number().min(20).max(300),
  height: z.number().min(100).max(250),
  gender: z.enum(['male', 'female']),
  
  // Aeróbio
  fcr: z.number().min(40).max(220).optional(), // Frequência Cardíaca de Repouso
  pse: z.number().min(1).max(10).optional(), // Percepção Subjetiva de Esforço
  vvo2: z.number().min(10).max(50).optional(), // Velocidade VO2
  mfel: z.number().min(1).max(10).optional(), // MFEL (Limiar)
  
  // RIR (Reps in Reserve)
  rir: z.number().min(0).max(10).optional(),
  
  // Histórico médico
  contraindications: z.array(z.string()).default([]),
  observations: z.array(z.string()).default([]),
  
  // Objetivos
  goals: z.array(z.string()).default([])
})

export type AnamneseInput = z.infer<typeof AnamneseInputSchema>

export const AnamneseResultSchema = z.object({
  // Antropometria calculada
  bmi: z.number(),
  bmiCategory: z.string(),
  idealWeight: z.object({
    min: z.number(),
    max: z.number(),
    current: z.number()
  }),
  
  // Protocolos de treino
  protocols: z.array(z.object({
    name: z.string(),
    description: z.string(),
    intensity: z.string(),
    contraindications: z.array(z.string()),
    observations: z.array(z.string())
  })),
  
  // Zonas de treino
  heartRateZones: z.object({
    zone1: z.object({ min: z.number(), max: z.number(), description: z.string() }),
    zone2: z.object({ min: z.number(), max: z.number(), description: z.string() }),
    zone3: z.object({ min: z.number(), max: z.number(), description: z.string() }),
    zone4: z.object({ min: z.number(), max: z.number(), description: z.string() }),
    zone5: z.object({ min: z.number(), max: z.number(), description: z.string() })
  }),
  
  // %1RM baseado no RIR
  oneRepMax: z.object({
    rir: z.number(),
    percentage: z.number(),
    description: z.string()
  }),
  
  // Recomendações finais
  recommendations: z.array(z.string()),
  warnings: z.array(z.string()),
  
  // Metadados
  calculatedAt: z.string(),
  version: z.string()
})

export type AnamneseResult = z.infer<typeof AnamneseResultSchema>

// Dados da planilha Excel (Base sheet)
const PROTOCOL_DATA = {
  // Antropometria - 8 protocolos
  anthropometry: [
    {
      name: "Protocolo 1 - Iniciante",
      description: "Treino básico para iniciantes",
      intensity: "Baixa",
      contraindications: ["Lesões articulares graves", "Problemas cardíacos"],
      observations: ["Supervisão constante", "Progressão lenta"]
    },
    {
      name: "Protocolo 2 - Intermediário",
      description: "Treino intermediário com progressão",
      intensity: "Média",
      contraindications: ["Lesões recentes", "Hipertensão não controlada"],
      observations: ["Monitoramento regular", "Ajustes conforme necessário"]
    },
    {
      name: "Protocolo 3 - Avançado",
      description: "Treino avançado de alta intensidade",
      intensity: "Alta",
      contraindications: ["Problemas cardiovasculares", "Lesões crônicas"],
      observations: ["Supervisão especializada", "Avaliação médica prévia"]
    },
    {
      name: "Protocolo 4 - Reabilitação",
      description: "Treino terapêutico e reabilitação",
      intensity: "Muito baixa",
      contraindications: ["Movimentos que agravem lesões"],
      observations: ["Acompanhamento fisioterapêutico", "Progressão individualizada"]
    },
    {
      name: "Protocolo 5 - Manutenção",
      description: "Treino de manutenção da condição física",
      intensity: "Média-baixa",
      contraindications: ["Fadiga excessiva"],
      observations: ["Frequência regular", "Variedade de exercícios"]
    },
    {
      name: "Protocolo 6 - Performance",
      description: "Treino focado em performance esportiva",
      intensity: "Muito alta",
      contraindications: ["Lesões ativas", "Sobrecarga"],
      observations: ["Periodização rigorosa", "Recuperação adequada"]
    },
    {
      name: "Protocolo 7 - Terceira Idade",
      description: "Treino adaptado para idosos",
      intensity: "Baixa",
      contraindications: ["Osteoporose severa", "Demência"],
      observations: ["Exercícios funcionais", "Segurança prioritária"]
    },
    {
      name: "Protocolo 8 - Gestantes",
      description: "Treino adaptado para gestantes",
      intensity: "Baixa-média",
      contraindications: ["Risco de aborto", "Hipertensão gestacional"],
      observations: ["Aprovação médica", "Modificações por trimestre"]
    }
  ],
  
  // RIR para %1RM (catálogo canônico)
  rirToPercentage: {
    0: 100, // 1RM
    1: 95,  // 2RM
    2: 90,  // 3RM
    3: 85,  // 4RM
    4: 80,  // 5RM
    5: 75,  // 6RM
    6: 70,  // 7RM
    7: 65,  // 8RM
    8: 60,  // 9RM
    9: 55,  // 10RM
    10: 50  // 11+RM
  }
}

export class AnamneseEngine {
  private input: AnamneseInput
  private result: Partial<AnamneseResult>

  constructor(input: AnamneseInput) {
    this.input = AnamneseInputSchema.parse(input)
    this.result = {}
  }

  /**
   * Calcula o IMC e categoria
   */
  private calculateBMI() {
    const bmi = this.input.weight / Math.pow(this.input.height / 100, 2)
    let category = ''
    
    if (bmi < 18.5) category = 'Abaixo do peso'
    else if (bmi < 25) category = 'Peso normal'
    else if (bmi < 30) category = 'Sobrepeso'
    else if (bmi < 35) category = 'Obesidade grau I'
    else if (bmi < 40) category = 'Obesidade grau II'
    else category = 'Obesidade grau III'
    
    this.result.bmi = bmi
    this.result.bmiCategory = category
  }

  /**
   * Calcula peso ideal baseado na altura e gênero
   */
  private calculateIdealWeight() {
    const heightInMeters = this.input.height / 100
    
    // Fórmula de Devine (1974)
    let idealWeight = 0
    if (this.input.gender === 'male') {
      idealWeight = 50 + (2.3 * (heightInMeters * 100 - 152.4))
    } else {
      idealWeight = 45.5 + (2.3 * (heightInMeters * 100 - 152.4))
    }
    
    this.result.idealWeight = {
      min: idealWeight * 0.9,
      max: idealWeight * 1.1,
      current: this.input.weight
    }
  }

  /**
   * Calcula zonas de frequência cardíaca baseadas na FCR
   */
  private calculateHeartRateZones() {
    if (!this.input.fcr) return
    
    const fcr = this.input.fcr
    const maxHR = 220 - this.input.age
    const reserve = maxHR - fcr
    
    this.result.heartRateZones = {
      zone1: {
        min: fcr + (reserve * 0.5),
        max: fcr + (reserve * 0.6),
        description: 'Recuperação ativa'
      },
      zone2: {
        min: fcr + (reserve * 0.6),
        max: fcr + (reserve * 0.7),
        description: 'Base aeróbica'
      },
      zone3: {
        min: fcr + (reserve * 0.7),
        max: fcr + (reserve * 0.8),
        description: 'Tempo limite'
      },
      zone4: {
        min: fcr + (reserve * 0.8),
        max: fcr + (reserve * 0.9),
        description: 'Limiar de lactato'
      },
      zone5: {
        min: fcr + (reserve * 0.9),
        max: maxHR,
        description: 'VO2 máximo'
      }
    }
  }

  /**
   * Calcula %1RM baseado no RIR
   */
  private calculateOneRepMax() {
    if (this.input.rir === undefined) return
    
    const percentage = PROTOCOL_DATA.rirToPercentage[this.input.rir as keyof typeof PROTOCOL_DATA.rirToPercentage] || 50
    const description = this.input.rir === 0 ? '1RM máximo' : 
                       this.input.rir <= 2 ? 'Intensidade muito alta' :
                       this.input.rir <= 4 ? 'Intensidade alta' :
                       this.input.rir <= 6 ? 'Intensidade moderada' :
                       this.input.rir <= 8 ? 'Intensidade baixa' : 'Intensidade muito baixa'
    
    this.result.oneRepMax = {
      rir: this.input.rir,
      percentage,
      description
    }
  }

  /**
   * Seleciona protocolos baseado no perfil do usuário
   */
  private selectProtocols() {
    const protocols = []
    const contraindications = this.input.contraindications
    const observations = this.input.observations
    
    // Aplicar regra "mais restritivo vence"
    const allContraindications = [...contraindications, ...observations]
    
    for (const protocol of PROTOCOL_DATA.anthropometry) {
      // Verificar se há contraindicações que impedem o protocolo
      const hasBlockingContraindication = protocol.contraindications.some(contra =>
        allContraindications.some(inputContra => 
          inputContra.toLowerCase().includes(contra.toLowerCase()) ||
          contra.toLowerCase().includes(inputContra.toLowerCase())
        )
      )
      
      if (!hasBlockingContraindication) {
        protocols.push({
          ...protocol,
          contraindications: [...protocol.contraindications, ...allContraindications],
          observations: [...protocol.observations, ...observations]
        })
      }
    }
    
    this.result.protocols = protocols
  }

  /**
   * Gera recomendações e avisos
   */
  private generateRecommendations() {
    const recommendations = []
    const warnings = []
    
    // Recomendações baseadas no IMC
    if (this.result.bmi! < 18.5) {
      recommendations.push('Considere aumentar a ingestão calórica e massa muscular')
    } else if (this.result.bmi! > 30) {
      recommendations.push('Foque em exercícios de baixo impacto e controle de peso')
    }
    
    // Recomendações baseadas na idade
    if (this.input.age > 65) {
      recommendations.push('Priorize exercícios de força e equilíbrio')
      recommendations.push('Consulte um médico antes de iniciar atividades intensas')
    }
    
    // Avisos baseados em contraindicações
    if (this.input.contraindications.length > 0) {
      warnings.push('Consulte um médico antes de iniciar qualquer programa de exercícios')
    }
    
    // Avisos baseados na intensidade
    if (this.input.rir !== undefined && this.input.rir <= 2) {
      warnings.push('Intensidade muito alta - requer supervisão especializada')
    }
    
    this.result.recommendations = recommendations
    this.result.warnings = warnings
  }

  /**
   * Processa todos os cálculos
   */
  public process(): AnamneseResult {
    this.calculateBMI()
    this.calculateIdealWeight()
    this.calculateHeartRateZones()
    this.calculateOneRepMax()
    this.selectProtocols()
    this.generateRecommendations()
    
    // Metadados
    this.result.calculatedAt = new Date().toISOString()
    this.result.version = '1.0.0'
    
    return AnamneseResultSchema.parse(this.result)
  }
}

/**
 * Função utilitária para processar anamnese
 */
export function processAnamnese(input: AnamneseInput): AnamneseResult {
  const engine = new AnamneseEngine(input)
  return engine.process()
}
