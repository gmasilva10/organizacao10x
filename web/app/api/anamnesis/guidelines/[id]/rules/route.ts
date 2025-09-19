import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const createRuleSchema = z.object({
  rule_name: z.string().min(1, "Nome da regra é obrigatório"),
  decision_tag: z.string().min(1, "Tag de decisão é obrigatória"),
  condition_type: z.enum(['single', 'multiple', 'custom'], {
    errorMap: () => ({ message: "Tipo de condição deve ser 'single', 'multiple' ou 'custom'" })
  }),
  conditions: z.record(z.any(), "Condições são obrigatórias"),
  outputs: z.object({
    resistencia_aerobia: z.object({
      duracao: z.string().optional(),
      intensidade: z.string().optional(),
      observacoes: z.string().optional()
    }).optional(),
    treino_pesos: z.object({
      volume: z.string().optional(),
      series: z.string().optional(),
      reps: z.string().optional(),
      frequencia: z.string().optional(),
      intensidade: z.string().optional()
    }).optional(),
    contraindicacoes: z.array(z.string()).optional(),
    observacoes_gerais: z.string().optional()
  }),
  priority: z.number().int().min(0).optional().default(0)
})

const updateRuleSchema = createRuleSchema.partial().omit({ rule_name: true, decision_tag: true })

// GET /api/anamnesis/guidelines/[id]/rules - Listar regras de uma versão
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const url = new URL(request.url)
  const versionId = url.searchParams.get('version_id')

  try {
    let query = supabase
      .from('training_guideline_rules')
      .select(`
        *,
        guideline_version:training_guideline_versions(
          id,
          version_number,
          is_published,
          guideline:training_guidelines(
            id,
            name,
            organization_id
          )
        )
      `)
      .order('priority', { ascending: true })

    if (versionId) {
      // Buscar por versão específica
      query = query.eq('guideline_version_id', versionId)
    } else {
      // Buscar pela versão mais recente das diretrizes
      const { data: latestVersion } = await supabase
        .from('training_guideline_versions')
        .select('id')
        .eq('guideline_id', params.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (!latestVersion) {
        return NextResponse.json({ data: [], count: 0 })
      }

      query = query.eq('guideline_version_id', latestVersion.id)
    }

    const { data: rules, error } = await query

    if (error) {
      console.error('Erro ao buscar regras:', error)
      return NextResponse.json({ error: "Erro ao buscar regras" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: rules || [],
      count: rules?.length || 0
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'X-Query-Time': '0' // TODO: implementar medição real
      }
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST /api/anamnesis/guidelines/[id]/rules - Criar regra
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = createRuleSchema.parse(body)

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

    // Buscar a versão mais recente (não publicada)
    const { data: latestVersion, error: versionError } = await supabase
      .from('training_guideline_versions')
      .select('id, is_published')
      .eq('guideline_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      return NextResponse.json({ error: "Versão das diretrizes não encontrada" }, { status: 404 })
    }

    if (latestVersion.is_published) {
      return NextResponse.json({ 
        error: "Não é possível editar uma versão publicada. Crie uma nova versão." 
      }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from('training_guideline_rules')
      .insert({
        guideline_version_id: latestVersion.id,
        ...validatedData
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar regra:', error)
      return NextResponse.json({ error: "Erro ao criar regra" }, { status: 500 })
    }

    return NextResponse.json({ data: rule }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT /api/anamnesis/guidelines/[id]/rules/[ruleId] - Atualizar regra
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const ruleId = url.pathname.split('/').pop()
  
  if (!ruleId) {
    return NextResponse.json({ error: "ID da regra é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = updateRuleSchema.parse(body)

    // Verificar se a regra pertence às diretrizes e organização
    const { data: rule, error: ruleError } = await supabase
      .from('training_guideline_rules')
      .select(`
        id,
        guideline_version:training_guideline_versions(
          id,
          is_published,
          guideline:training_guidelines(
            id,
            organization_id
          )
        )
      `)
      .eq('id', ruleId)
      .single()

    if (ruleError || !rule) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 })
    }

    const guideline = rule.guideline_version?.guideline
    if (!guideline || guideline.organization_id !== ctx.tenantId) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 })
    }

    if (rule.guideline_version?.is_published) {
      return NextResponse.json({ 
        error: "Não é possível editar uma regra de versão publicada" 
      }, { status: 400 })
    }

    const { data: updatedRule, error } = await supabase
      .from('training_guideline_rules')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar regra:', error)
      return NextResponse.json({ error: "Erro ao atualizar regra" }, { status: 500 })
    }

    return NextResponse.json({ data: updatedRule })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE /api/anamnesis/guidelines/[id]/rules/[ruleId] - Deletar regra
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const ruleId = url.pathname.split('/').pop()
  
  if (!ruleId) {
    return NextResponse.json({ error: "ID da regra é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    // Verificar se a regra pertence às diretrizes e organização
    const { data: rule, error: ruleError } = await supabase
      .from('training_guideline_rules')
      .select(`
        id,
        guideline_version:training_guideline_versions(
          id,
          is_published,
          guideline:training_guidelines(
            id,
            organization_id
          )
        )
      `)
      .eq('id', ruleId)
      .single()

    if (ruleError || !rule) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 })
    }

    const guideline = rule.guideline_version?.guideline
    if (!guideline || guideline.organization_id !== ctx.tenantId) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 })
    }

    if (rule.guideline_version?.is_published) {
      return NextResponse.json({ 
        error: "Não é possível deletar uma regra de versão publicada" 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('training_guideline_rules')
      .delete()
      .eq('id', ruleId)

    if (error) {
      console.error('Erro ao deletar regra:', error)
      return NextResponse.json({ error: "Erro ao deletar regra" }, { status: 500 })
    }

    return NextResponse.json({ message: "Regra deletada com sucesso" })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
