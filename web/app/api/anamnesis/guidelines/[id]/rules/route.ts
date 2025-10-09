import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const createRuleSchema = z.object({
  rule_name: z.string().min(1, "Nome da regra Ã© obrigatÃ³rio"),
  decision_tag: z.string().min(1, "Tag de decisÃ£o Ã© obrigatÃ³ria"),
  condition_type: z.enum(['single', 'multiple', 'custom']),
  conditions: z.record(z.string(), z.any()),
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

// GET /api/anamnesis/guidelines/[id]/rules - Listar regras de uma versÃ£o
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
      // Buscar por versÃ£o especÃ­fica
      query = query.eq('guideline_version_id', versionId)
    } else {
      // Buscar pela versÃ£o mais recente das diretrizes
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
        'X-Query-Time': '0' // TODO: implementar mediÃ§Ã£o real
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

    // Verificar se as diretrizes pertencem Ã  organizaÃ§Ã£o
    const { data: guideline, error: guidelineError } = await supabase
      .from('training_guidelines')
      .select('id, organization_id')
      .eq('id', params.id)
      .eq('organization_id', ctx.org_id)
      .single()

    if (guidelineError || !guideline) {
      return NextResponse.json({ error: "Diretrizes nÃ£o encontradas" }, { status: 404 })
    }

    // Buscar a versÃ£o mais recente (nÃ£o publicada)
    const { data: latestVersion, error: versionError } = await supabase
      .from('training_guideline_versions')
      .select('id, is_published')
      .eq('guideline_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      return NextResponse.json({ error: "VersÃ£o das diretrizes nÃ£o encontrada" }, { status: 404 })
    }

    if (latestVersion.is_published) {
      return NextResponse.json({ 
        error: "NÃ£o Ã© possÃ­vel editar uma versÃ£o publicada. Crie uma nova versÃ£o." 
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
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
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
    return NextResponse.json({ error: "ID da regra Ã© obrigatÃ³rio" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = updateRuleSchema.parse(body)

    // Verificar se a regra pertence Ã s diretrizes e organizaÃ§Ã£o
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
      return NextResponse.json({ error: "Regra nÃ£o encontrada" }, { status: 404 })
    }

    const guideline = Array.isArray((rule as any).guideline_version?.guideline)
      ? (rule as any).guideline_version?.guideline?.[0]
      : (rule as any).guideline_version?.guideline
    if (!guideline || guideline.organization_id !== ctx.org_id) {
      return NextResponse.json({ error: "Regra nÃ£o encontrada" }, { status: 404 })
    }

    const isPublished = Array.isArray((rule as any).guideline_version)
      ? (rule as any).guideline_version[0]?.is_published
      : (rule as any).guideline_version?.is_published
    if (isPublished) {
      return NextResponse.json({ 
        error: "NÃ£o Ã© possÃ­vel editar uma regra de versÃ£o publicada" 
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
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
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
    return NextResponse.json({ error: "ID da regra Ã© obrigatÃ³rio" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    // Verificar se a regra pertence Ã s diretrizes e organizaÃ§Ã£o
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
      return NextResponse.json({ error: "Regra nÃ£o encontrada" }, { status: 404 })
    }

    const guideline = Array.isArray((rule as any).guideline_version?.guideline)
      ? (rule as any).guideline_version?.guideline?.[0]
      : (rule as any).guideline_version?.guideline
    if (!guideline || guideline.organization_id !== ctx.org_id) {
      return NextResponse.json({ error: "Regra nÃ£o encontrada" }, { status: 404 })
    }

    const isPublished2 = Array.isArray((rule as any).guideline_version)
      ? (rule as any).guideline_version[0]?.is_published
      : (rule as any).guideline_version?.is_published
    if (isPublished2) {
      return NextResponse.json({ 
        error: "NÃ£o Ã© possÃ­vel deletar uma regra de versÃ£o publicada" 
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
