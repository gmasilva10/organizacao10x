import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

const previewSchema = z.object({
  guideline_version_id: z.string().uuid("ID da versão deve ser um UUID válido"),
  mock_responses: z.record(z.any(), "Respostas mock são obrigatórias")
})

// POST /api/anamnesis/guidelines/[id]/preview - Preview das diretrizes
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = previewSchema.parse(body)

    // Verificar se as diretrizes pertencem à organização
    const { data: guideline, error: guidelineError } = await supabase
      .from('training_guidelines')
      .select('id, organization_id')
      .eq('id', params.id)
      .eq('organization_id', ctx.tenantId)
      .single()

    if (guidelineError || !guideline) {
      return NextResponse.json({ error: "Diretrizes não encontradas" }, { status: 404 })
    }

    // Buscar regras da versão especificada
    const { data: rules, error: rulesError } = await supabase
      .from('training_guideline_rules')
      .select('*')
      .eq('guideline_version_id', validatedData.guideline_version_id)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (rulesError) {
      console.error('Erro ao buscar regras:', rulesError)
      return NextResponse.json({ error: "Erro ao buscar regras" }, { status: 500 })
    }

    // Aplicar regras e gerar outputs
    const applicableRules = []
    const combinedOutputs = {
      resistencia_aerobia: {
        duracao: '',
        intensidade: '',
        observacoes: ''
      },
      treino_pesos: {
        volume: '',
        series: '',
        reps: '',
        frequencia: '',
        intensidade: ''
      },
      contraindicacoes: [] as string[],
      observacoes_gerais: ''
    }

    for (const rule of rules || []) {
      let isApplicable = false

      // Verificar condições da regra
      switch (rule.condition_type) {
        case 'single':
          // Condição simples: verificar se a resposta corresponde
          for (const [key, expectedValue] of Object.entries(rule.conditions)) {
            if (validatedData.mock_responses[key] === expectedValue) {
              isApplicable = true
              break
            }
          }
          break

        case 'multiple':
          // Condição múltipla: todas as condições devem ser atendidas
          isApplicable = Object.entries(rule.conditions).every(([key, expectedValue]) => 
            validatedData.mock_responses[key] === expectedValue
          )
          break

        case 'custom':
          // Condição customizada: implementar lógica específica
          // Por enquanto, verificar se pelo menos uma condição é atendida
          isApplicable = Object.entries(rule.conditions).some(([key, expectedValue]) => 
            validatedData.mock_responses[key] === expectedValue
          )
          break
      }

      if (isApplicable) {
        applicableRules.push(rule)

        // Aplicar outputs da regra
        if (rule.outputs.resistencia_aerobia) {
          if (rule.outputs.resistencia_aerobia.duracao) {
            combinedOutputs.resistencia_aerobia.duracao = rule.outputs.resistencia_aerobia.duracao
          }
          if (rule.outputs.resistencia_aerobia.intensidade) {
            combinedOutputs.resistencia_aerobia.intensidade = rule.outputs.resistencia_aerobia.intensidade
          }
          if (rule.outputs.resistencia_aerobia.observacoes) {
            combinedOutputs.resistencia_aerobia.observacoes = rule.outputs.resistencia_aerobia.observacoes
          }
        }

        if (rule.outputs.treino_pesos) {
          if (rule.outputs.treino_pesos.volume) {
            combinedOutputs.treino_pesos.volume = rule.outputs.treino_pesos.volume
          }
          if (rule.outputs.treino_pesos.series) {
            combinedOutputs.treino_pesos.series = rule.outputs.treino_pesos.series
          }
          if (rule.outputs.treino_pesos.reps) {
            combinedOutputs.treino_pesos.reps = rule.outputs.treino_pesos.reps
          }
          if (rule.outputs.treino_pesos.frequencia) {
            combinedOutputs.treino_pesos.frequencia = rule.outputs.treino_pesos.frequencia
          }
          if (rule.outputs.treino_pesos.intensidade) {
            combinedOutputs.treino_pesos.intensidade = rule.outputs.treino_pesos.intensidade
          }
        }

        if (rule.outputs.contraindicacoes) {
          combinedOutputs.contraindicacoes.push(...rule.outputs.contraindicacoes)
        }

        if (rule.outputs.observacoes_gerais) {
          if (combinedOutputs.observacoes_gerais) {
            combinedOutputs.observacoes_gerais += '\n' + rule.outputs.observacoes_gerais
          } else {
            combinedOutputs.observacoes_gerais = rule.outputs.observacoes_gerais
          }
        }
      }
    }

    // Remover duplicatas das contraindicações
    combinedOutputs.contraindicacoes = [...new Set(combinedOutputs.contraindicacoes)]

    return NextResponse.json({
      data: {
        applicable_rules: applicableRules,
        combined_outputs: combinedOutputs,
        preview_generated_at: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Query-Time': '0' // TODO: implementar medição real
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
