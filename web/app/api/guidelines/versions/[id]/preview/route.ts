import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { calculateAnthropometry, calculateRIR } from "@/lib/anthro-protocols"

// FunÃ§Ã£o para processar mÃ©todos aerÃ³bios

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function processAerobicMethod(aerobio_metodo: string, fc: any, answers: any) {
  const result: any = {
    metodo: aerobio_metodo,
    orientacoes: []
  }

  switch (aerobio_metodo) {
    case 'FCR':
      result.texto = 'FrequÃªncia CardÃ­aca de Reserva'
      result.faixa = [40, 60]
      break
    case 'PSE':
      result.texto = 'Escala de PercepÃ§Ã£o Subjetiva de EsforÃ§o (Borg 11-13)'
      result.faixa = [11, 13]
      break
    case 'vVO2':
      result.texto = 'Velocidade no VO2 mÃ¡ximo'
      result.faixa = [70, 80]
      break
    case 'MFEL':
      result.texto = 'MFEL (Limiar)'
      result.faixa = [60, 70]
      break
  }

  // Adicionar orientaÃ§Ã£o PSE se betabloqueador
  if (answers.betabloqueador === 'sim' || answers.betabloqueador === true) {
    result.orientacoes.push('Priorizar PSE devido ao uso de betabloqueador')
  }

  return result
}

// FunÃ§Ã£o para combinar regras (mais restritivo vence)
function combineRules(rules: any[]) {
  let combined = {
    aerobio: null as any,
    pesos: null as any,
    flex_mob: null as any,
    contraindicacoes: [] as string[],
    observacoes: [] as string[]
  }

  for (const rule of rules) {
    const outputs = rule.outputs

    // AerÃ³bio - mais restritivo vence
    if (outputs.aerobio) {
      if (!combined.aerobio) {
        combined.aerobio = outputs.aerobio
      } else {
        // DuraÃ§Ã£o - interseÃ§Ã£o
        if (outputs.aerobio.duracao_min && combined.aerobio.duracao_min) {
          const newMin = Math.max(outputs.aerobio.duracao_min[0], combined.aerobio.duracao_min[0])
          const newMax = Math.min(outputs.aerobio.duracao_min[1], combined.aerobio.duracao_min[1])
          combined.aerobio.duracao_min = [newMin, newMax]
        }
        
        // Intensidade - mais restritivo
        if (outputs.aerobio.intensidade && combined.aerobio.intensidade) {
          if (outputs.aerobio.intensidade.faixa && combined.aerobio.intensidade.faixa) {
            const newMin = Math.max(outputs.aerobio.intensidade.faixa[0], combined.aerobio.intensidade.faixa[0])
            const newMax = Math.min(outputs.aerobio.intensidade.faixa[1], combined.aerobio.intensidade.faixa[1])
            combined.aerobio.intensidade.faixa = [newMin, newMax]
          }
        }
        
        // FrequÃªncia - interseÃ§Ã£o
        if (outputs.aerobio.frequencia_sem && combined.aerobio.frequencia_sem) {
          const newMin = Math.max(outputs.aerobio.frequencia_sem[0], combined.aerobio.frequencia_sem[0])
          const newMax = Math.min(outputs.aerobio.frequencia_sem[1], combined.aerobio.frequencia_sem[1])
          combined.aerobio.frequencia_sem = [newMin, newMax]
        }
        
        // ObservaÃ§Ãµes - uniÃ£o
        if (outputs.aerobio.obs) {
          combined.aerobio.obs = [...new Set([...(combined.aerobio.obs || []), ...outputs.aerobio.obs])]
        }
      }
    }

    // Pesos - mais restritivo vence
    if (outputs.pesos) {
      if (!combined.pesos) {
        combined.pesos = outputs.pesos
      } else {
        // ExercÃ­cios - interseÃ§Ã£o
        if (outputs.pesos.exercicios && combined.pesos.exercicios) {
          const newMin = Math.max(outputs.pesos.exercicios[0], combined.pesos.exercicios[0])
          const newMax = Math.min(outputs.pesos.exercicios[1], combined.pesos.exercicios[1])
          combined.pesos.exercicios = [newMin, newMax]
        }
        
        // SÃ©ries - interseÃ§Ã£o
        if (outputs.pesos.series && combined.pesos.series) {
          const newMin = Math.max(outputs.pesos.series[0], combined.pesos.series[0])
          const newMax = Math.min(outputs.pesos.series[1], combined.pesos.series[1])
          combined.pesos.series = [newMin, newMax]
        }
        
        // Reps - interseÃ§Ã£o
        if (outputs.pesos.reps && combined.pesos.reps) {
          const newMin = Math.max(outputs.pesos.reps[0], combined.pesos.reps[0])
          const newMax = Math.min(outputs.pesos.reps[1], combined.pesos.reps[1])
          combined.pesos.reps = [newMin, newMax]
        }
        
        // Intensidade %1RM - interseÃ§Ã£o
        if (outputs.pesos.intensidade_pct_1rm && combined.pesos.intensidade_pct_1rm) {
          const newMin = Math.max(outputs.pesos.intensidade_pct_1rm[0], combined.pesos.intensidade_pct_1rm[0])
          const newMax = Math.min(outputs.pesos.intensidade_pct_1rm[1], combined.pesos.intensidade_pct_1rm[1])
          combined.pesos.intensidade_pct_1rm = [newMin, newMax]
        }
        
        // ObservaÃ§Ãµes - uniÃ£o
        if (outputs.pesos.obs) {
          combined.pesos.obs = [...new Set([...(combined.pesos.obs || []), ...outputs.pesos.obs])]
        }
      }
    }

    // Flex/Mob - mais restritivo vence
    if (outputs.flex_mob) {
      if (!combined.flex_mob) {
        combined.flex_mob = outputs.flex_mob
      } else {
        // Foco - mais restritivo (obrigatÃ³rio > opcional)
        if (outputs.flex_mob.foco === 'obrigatorio' || combined.flex_mob.foco === 'obrigatorio') {
          combined.flex_mob.foco = 'obrigatorio'
        }
        
        // ObservaÃ§Ãµes - uniÃ£o
        if (outputs.flex_mob.obs) {
          combined.flex_mob.obs = [...new Set([...(combined.flex_mob.obs || []), ...outputs.flex_mob.obs])]
        }
      }
    }

    // ContraindicaÃ§Ãµes - uniÃ£o
    if (outputs.contraindicacoes) {
      combined.contraindicacoes = [...new Set([...(combined.contraindicacoes || []), ...outputs.contraindicacoes])]
    }

    // ObservaÃ§Ãµes - uniÃ£o
    if (outputs.observacoes) {
      combined.observacoes = [...new Set([...(combined.observacoes || []), ...outputs.observacoes])]
    }
  }

  return combined
}

// Schema de validaÃ§Ã£o para entrada do preview D3
const previewSchema = z.object({
  answers: z.record(z.string(), z.any()).optional().default({}),
  aluno: z.object({
    idade: z.number().min(0).max(120),
    sexo: z.enum(['M', 'F'])
  }).optional(),
  anthro: z.object({
    protocolo_code: z.string(),
    skinfolds_mm: z.record(z.string(), z.number()),
    massa_kg: z.number().positive(),
    estatura_m: z.number().positive().optional(),
    estatura_cm: z.number().positive().optional()
  }).optional(),
  aerobio_metodo: z.enum(['FCR', 'PSE', 'vVO2', 'MFEL']).optional(),
  fc: z.object({
    modo: z.enum(['predicao', 'medicao']),
    parametros: z.record(z.string(), z.any())
  }).optional(),
  rir: z.object({
    reps: z.number().min(1).max(20),
    rir: z.number().min(5).max(10)
  }).optional(),
  readiness: z.object({
    exercicio: z.number().min(1).max(5)
  }).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  
  try {
    console.log('=== D3 PREVIEW ENGINE START ===')
    
    const ctx = await resolveRequestContext(request)
    console.log('Context:', { userId: ctx?.userId, org_id: ctx?.org_id })
    
    if (!ctx || !ctx.userId || !ctx.org_id) {
      console.log('Erro: Contexto invÃ¡lido')
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 })
    }

    const { id: versionId } = await params
    console.log('Version ID:', versionId)
    
    const body = await request.json()
    console.log('Body recebido:', JSON.stringify(body, null, 2))
    
    const validatedData = previewSchema.parse(body)
    console.log('Dados validados:', JSON.stringify(validatedData, null, 2))

    const supabase = await createClient()

    // Buscar versÃ£o (ou usar default se id for 'default')
    let version
    if (versionId === 'default') {
      const { data: defaultVersion } = await supabase
        .from('guidelines_versions')
        .select('id, status, version')
        .eq('org_id', ctx.org_id)
        .eq('is_default', true)
        .single()
      version = defaultVersion
    } else {
      const { data: versionData, error: versionError } = await supabase
        .from('guidelines_versions')
        .select('id, status, version')
        .eq('id', versionId)
        .eq('org_id', ctx.org_id)
        .single()
      
      if (versionError || !versionData) {
        return NextResponse.json({ error: "VersÃ£o nÃ£o encontrada" }, { status: 404 })
      }
      version = versionData
    }

    if (!version) {
      return NextResponse.json({ error: "Nenhuma versÃ£o padrÃ£o encontrada" }, { status: 404 })
    }

    // Buscar regras da versÃ£o
    const { data: rules, error: rulesError } = await supabase
      .from('guideline_rules')
      .select('*')
      .eq('guidelines_version_id', version.id)
      .eq('org_id', ctx.org_id)
      .order('priority_clinical', { ascending: false })
      .order('created_at', { ascending: true })

    if (rulesError) {
      console.error('Erro ao buscar regras:', rulesError)
      return NextResponse.json({ error: "Erro ao buscar regras" }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        guidelines: {
          aerobio: null,
          pesos: null,
          flex_mob: null,
          contraindicacoes: [],
          observacoes: []
        },
        debug: {
          rules_fired: [],
          merges: {},
          anthro_snapshot: null,
          rir_refs: null,
          warnings: ["Nenhuma regra encontrada"]
        },
        preview_generated_at: new Date().toISOString()
      })
    }

    // Processar dados de entrada
    console.log('Processando dados de entrada...')
    const answers = validatedData.answers || {}
    const anthro = validatedData.anthro
    const rir = validatedData.rir
    const aerobio_metodo = validatedData.aerobio_metodo || 'FCR'
    
    console.log('Answers:', answers)
    console.log('Anthro:', anthro)
    console.log('RIR:', rir)

    // Calcular antropometria
    let anthroSnapshot = null
    try {
      if (anthro) {
        console.log('Calculando antropometria...')
        anthroSnapshot = calculateAnthropometry(anthro)
        console.log('Antropometria calculada:', anthroSnapshot)
      }
    } catch (error) {
      console.warn('Erro no cÃ¡lculo antropomÃ©trico:', error)
    }

    // Calcular RIR
    let rirRefs = null
    try {
      if (rir) {
        console.log('Calculando RIR...')
        rirRefs = calculateRIR(rir)
        console.log('RIR calculado:', rirRefs)
      }
    } catch (error) {
      console.warn('Erro no cÃ¡lculo RIR:', error)
    }

    // Processar mÃ©todo aerÃ³bio
    console.log('Processando mÃ©todo aerÃ³bio...')
    const aerobicMethod = processAerobicMethod(aerobio_metodo, validatedData.fc, answers)
    console.log('MÃ©todo aerÃ³bio:', aerobicMethod)

    // Aplicar regras
    const applicableRules = []
    for (const rule of rules) {
      let isApplicable = true
      const condition = rule.condition

      if (condition.all && Array.isArray(condition.all)) {
        for (const cond of condition.all) {
          const testValue = answers[cond.tag]
          
          if (testValue === undefined) {
            isApplicable = false
            break
          }

          switch (cond.op) {
            case 'eq':
              if (testValue !== cond.val) {
                isApplicable = false
                break
              }
              break
            case 'in':
              if (Array.isArray(cond.val)) {
                if (!cond.val.includes(testValue)) {
                  isApplicable = false
                  break
                }
              } else {
                if (testValue !== cond.val) {
                  isApplicable = false
                  break
                }
              }
              break
            case 'gt':
              if (typeof testValue !== 'number' || typeof cond.val !== 'number' || testValue <= cond.val) {
                isApplicable = false
                break
              }
              break
            case 'lt':
              if (typeof testValue !== 'number' || typeof cond.val !== 'number' || testValue >= cond.val) {
                isApplicable = false
                break
              }
              break
            case 'gte':
              if (typeof testValue !== 'number' || typeof cond.val !== 'number' || testValue < cond.val) {
                isApplicable = false
                break
              }
              break
            case 'lte':
              if (typeof testValue !== 'number' || typeof cond.val !== 'number' || testValue > cond.val) {
                isApplicable = false
                break
              }
              break
            default:
              isApplicable = false
              break
          }
          
          if (!isApplicable) break
        }
      }

      if (isApplicable) {
        applicableRules.push(rule)
      }
    }

    // Combinar regras aplicÃ¡veis
    const combinedGuidelines = combineRules(applicableRules)

    // Aplicar mÃ©todo aerÃ³bio se nÃ£o houver regra especÃ­fica
    if (combinedGuidelines.aerobio && !combinedGuidelines.aerobio.intensidade) {
      combinedGuidelines.aerobio.intensidade = {
        metodo: aerobicMethod.metodo,
        faixa: aerobicMethod.faixa,
        texto: aerobicMethod.texto
      }
    }

    // Adicionar orientaÃ§Ãµes PSE se betabloqueador
    if (aerobicMethod.orientacoes.length > 0) {
      if (!combinedGuidelines.observacoes) {
        combinedGuidelines.observacoes = []
      }
      combinedGuidelines.observacoes = [...new Set([...combinedGuidelines.observacoes, ...aerobicMethod.orientacoes])]
    }

    // Gerar debug info
    const debug = {
      rules_fired: applicableRules.map(rule => ({
        id: rule.id,
        priority: rule.priority_clinical,
        tags: rule.condition.all?.map((c: any) => c.tag) || []
      })),
      merges: {
        intensidade: combinedGuidelines.aerobio?.intensidade ? {
          antes: applicableRules.map(r => r.outputs.aerobio?.intensidade?.faixa).filter(Boolean),
          depois: combinedGuidelines.aerobio.intensidade.faixa,
          criterio: "interseÃ§Ã£o"
        } : null
      },
      anthro_snapshot: anthroSnapshot,
      rir_refs: rirRefs ? [rirRefs] : null,
      warnings: [] as string[]
    }

    // Adicionar warnings se necessÃ¡rio
    if (!anthroSnapshot && anthro) {
      debug.warnings.push("Erro no cÃ¡lculo antropomÃ©trico - verifique os dados")
    }
    if (!rirRefs && rir) {
      debug.warnings.push("Erro no cÃ¡lculo RIR - verifique os dados")
    }

    const processingTime = Date.now() - startTime
    console.log(`=== D3 PREVIEW ENGINE END - ${processingTime}ms ===`)

    const response = NextResponse.json({
      guidelines: combinedGuidelines,
      debug,
      preview_generated_at: new Date().toISOString()
    })

    // Adicionar X-Query-Time header
    response.headers.set('X-Query-Time', `${processingTime}ms`)

    return response

  } catch (error) {
    console.error('Erro na API de preview:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
