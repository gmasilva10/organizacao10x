// Protocolos antropométricos (8 protocolos conforme planilha)
export const ANTHRO_PROTOCOLS = {
  'JP7_H_M': {
    name: 'Jackson & Pollock 7 dobras - Homem',
    version_tag: 'JP7_2025_09',
    required_skinfolds: ['tricipital', 'peitoral', 'subescapular', 'suprailíaca', 'axilar_media', 'abdominal', 'coxa'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.tricipital + skinfolds.peitoral + skinfolds.subescapular + 
                  skinfolds.suprailíaca + skinfolds.axilar_media + skinfolds.abdominal + skinfolds.coxa
      const densidade = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * 40) // idade fixa 40
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'JP7_M_F': {
    name: 'Jackson & Pollock 7 dobras - Mulher',
    version_tag: 'JP7_2025_09',
    required_skinfolds: ['tricipital', 'peitoral', 'subescapular', 'suprailíaca', 'axilar_media', 'abdominal', 'coxa'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.tricipital + skinfolds.peitoral + skinfolds.subescapular + 
                  skinfolds.suprailíaca + skinfolds.axilar_media + skinfolds.abdominal + skinfolds.coxa
      const densidade = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * 40) // idade fixa 40
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'JP3_H_M': {
    name: 'Jackson & Pollock 3 dobras - Homem',
    version_tag: 'JP3_2025_09',
    required_skinfolds: ['peitoral', 'abdominal', 'coxa'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.peitoral + skinfolds.abdominal + skinfolds.coxa
      const densidade = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * 40)
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'JP3_M_F': {
    name: 'Jackson & Pollock 3 dobras - Mulher',
    version_tag: 'JP3_2025_09',
    required_skinfolds: ['peitoral', 'abdominal', 'coxa'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.peitoral + skinfolds.abdominal + skinfolds.coxa
      const densidade = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * 40)
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'JP4_H_M': {
    name: 'Jackson & Pollock 4 dobras - Homem',
    version_tag: 'JP4_2025_09',
    required_skinfolds: ['peitoral', 'abdominal', 'coxa', 'tricipital'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.peitoral + skinfolds.abdominal + skinfolds.coxa + skinfolds.tricipital
      const densidade = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * 40)
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'JP4_M_F': {
    name: 'Jackson & Pollock 4 dobras - Mulher',
    version_tag: 'JP4_2025_09',
    required_skinfolds: ['peitoral', 'abdominal', 'coxa', 'tricipital'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.peitoral + skinfolds.abdominal + skinfolds.coxa + skinfolds.tricipital
      const densidade = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * 40)
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'DURNI_H_M': {
    name: 'Durnin & Womersley - Homem',
    version_tag: 'DURNI_2025_09',
    required_skinfolds: ['tricipital', 'bicipital', 'subescapular', 'suprailíaca'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.tricipital + skinfolds.bicipital + skinfolds.subescapular + skinfolds.suprailíaca
      const densidade = 1.1610 - (0.0632 * Math.log10(sum))
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  },
  'DURNI_M_F': {
    name: 'Durnin & Womersley - Mulher',
    version_tag: 'DURNI_2025_09',
    required_skinfolds: ['tricipital', 'bicipital', 'subescapular', 'suprailíaca'],
    formula: (skinfolds: Record<string, number>, massa: number, estatura: number) => {
      const sum = skinfolds.tricipital + skinfolds.bicipital + skinfolds.subescapular + skinfolds.suprailíaca
      const densidade = 1.1599 - (0.0717 * Math.log10(sum))
      const pct_gordura = ((4.95 / densidade) - 4.50) * 100
      const mg_kg = (pct_gordura / 100) * massa
      const mm_kg = massa - mg_kg
      return { densidade, pct_gordura, mg_kg, mm_kg }
    }
  }
}

// Matriz RIR → %1RM (conforme planilha)
export const RIR_TO_PERCENT_1RM = {
  5: { 1: 100, 2: 95, 3: 93, 4: 90, 5: 87, 6: 85, 7: 83, 8: 80, 9: 77, 10: 75, 11: 70, 12: 67, 13: 65, 14: 62, 15: 60, 16: 57, 17: 55, 18: 52, 19: 50, 20: 47 },
  6: { 1: 95, 2: 93, 3: 90, 4: 87, 5: 85, 6: 83, 7: 80, 8: 77, 9: 75, 10: 72, 11: 70, 12: 67, 13: 65, 14: 62, 15: 60, 16: 57, 17: 55, 18: 52, 19: 50, 20: 47 },
  7: { 1: 93, 2: 90, 3: 87, 4: 85, 5: 83, 6: 80, 7: 77, 8: 75, 9: 72, 10: 70, 11: 67, 12: 65, 13: 62, 14: 60, 15: 57, 16: 55, 17: 52, 18: 50, 19: 47, 20: 45 },
  8: { 1: 90, 2: 87, 3: 85, 4: 83, 5: 80, 6: 77, 7: 75, 8: 72, 9: 70, 10: 67, 11: 65, 12: 62, 13: 60, 14: 57, 15: 55, 16: 52, 17: 50, 18: 47, 19: 45, 20: 42 },
  9: { 1: 87, 2: 85, 3: 83, 4: 80, 5: 77, 6: 75, 7: 72, 8: 70, 9: 67, 10: 65, 11: 62, 12: 60, 13: 57, 14: 55, 15: 52, 16: 50, 17: 47, 18: 45, 19: 42, 20: 40 },
  10: { 1: 85, 2: 83, 3: 80, 4: 77, 5: 75, 6: 72, 7: 70, 8: 67, 9: 65, 10: 62, 11: 60, 12: 57, 13: 55, 14: 52, 15: 50, 16: 47, 17: 45, 18: 42, 19: 40, 20: 37 }
}

// Função para calcular antropometria
export function calculateAnthropometry(anthro: any) {
  if (!anthro) return null

  const { protocolo_code, skinfolds_mm, massa_kg, estatura_m, estatura_cm } = anthro
  
  // Converter estatura para metros se necessário
  const estatura = estatura_m || (estatura_cm ? estatura_cm / 100 : 1.75)
  
  // Verificar se o protocolo existe
  const protocol = ANTHRO_PROTOCOLS[protocolo_code as keyof typeof ANTHRO_PROTOCOLS]
  if (!protocol) {
    throw new Error(`Protocolo ${protocolo_code} não encontrado`)
  }

  // Verificar se todas as dobras necessárias estão presentes
  const missingFolds = protocol.required_skinfolds.filter(fold => !(fold in skinfolds_mm))
  if (missingFolds.length > 0) {
    throw new Error(`Dobras faltando: ${missingFolds.join(', ')}`)
  }

  // Calcular usando a fórmula do protocolo
  const result = protocol.formula(skinfolds_mm, massa_kg, estatura)
  
  return {
    protocolo: protocolo_code,
    version_tag: protocol.version,
    inputs: {
      massa_kg: massa_kg,
      estatura_m: estatura,
      skinfolds_mm: skinfolds_mm
    },
    outputs: {
      densidade: Math.round(result.densidade * 1000) / 1000, // 3 casas decimais
      pct_gordura: Math.round(result.pct_gordura * 100) / 100, // 2 casas decimais
      mg_kg: Math.round(result.mg_kg * 10) / 10, // 1 casa decimal
      mm_kg: Math.round(result.mm_kg * 10) / 10 // 1 casa decimal
    }
  }
}

// Função para calcular RIR → %1RM
export function calculateRIR(rir: any) {
  if (!rir) return null
  
  const { reps, rir: rirValue } = rir
  
  if (rirValue < 5 || rirValue > 10) {
    throw new Error('RIR deve estar entre 5 e 10')
  }
  
  if (reps < 1 || reps > 20) {
    throw new Error('Reps deve estar entre 1 e 20')
  }
  
  const percent1RM = RIR_TO_PERCENT_1RM[rirValue as keyof typeof RIR_TO_PERCENT_1RM]?.[reps as keyof typeof RIR_TO_PERCENT_1RM[5]]
  
  if (percent1RM === undefined) {
    throw new Error(`Combinação RIR ${rirValue} com ${reps} reps não encontrada`)
  }
  
  return {
    rir: rirValue,
    reps: reps,
    pct_1rm: percent1RM
  }
}
