import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

const createGuidelineSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional()
})

const updateGuidelineSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional()
})

// GET /api/anamnesis/guidelines - Listar diretrizes
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const url = new URL(request.url)
  const includeVersions = url.searchParams.get('include_versions') === 'true'

  try {
    const selectQuery = includeVersions ? `
      *,
      versions:training_guideline_versions(
        id,
        version_number,
        is_published,
        published_at,
        created_at,
        rules:training_guideline_rules(
          id,
          decision_tag,
          condition_type,
          condition_value,
          outputs,
          order_index
        )
      )
    ` : `
      *,
      versions:training_guideline_versions(
        id,
        version_number,
        is_published,
        published_at,
        created_at
      )
    `

    const { data: guidelines, error } = await supabase
      .from('training_guidelines')
      .select(selectQuery)
      .eq('organization_id', ctx.tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar diretrizes:', error)
      return NextResponse.json({ error: "Erro ao buscar diretrizes" }, { status: 500 })
    }

    // Processar diretrizes para incluir latest_version e published_version
    const processedGuidelines = guidelines?.map(guideline => {
      const versions = guideline.versions || []
      const latestVersion = versions.reduce((latest, version) => 
        version.version_number > latest.version_number ? version : latest, versions[0])
      const publishedVersion = versions.find(v => v.is_published)

      return {
        ...guideline,
        latest_version: latestVersion,
        published_version: publishedVersion
      }
    }) || []

    return NextResponse.json({ 
      data: processedGuidelines,
      count: processedGuidelines.length 
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

// POST /api/anamnesis/guidelines - Criar diretrizes
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = createGuidelineSchema.parse(body)

    const { data: guideline, error } = await supabase
      .from('training_guidelines')
      .insert({
        organization_id: ctx.tenantId,
        name: validatedData.name,
        description: validatedData.description,
        created_by: ctx.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar diretrizes:', error)
      return NextResponse.json({ error: "Erro ao criar diretrizes" }, { status: 500 })
    }

    // Criar versão inicial
    const { error: versionError } = await supabase
      .from('training_guideline_versions')
      .insert({
        guideline_id: guideline.id,
        version_number: 1,
        is_published: false
      })

    if (versionError) {
      console.error('Erro ao criar versão inicial:', versionError)
      return NextResponse.json({ error: "Erro ao criar versão inicial" }, { status: 500 })
    }

    return NextResponse.json({ data: guideline }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT /api/anamnesis/guidelines/[id] - Atualizar diretrizes
export async function PUT(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const guidelineId = url.pathname.split('/').pop()
  
  if (!guidelineId) {
    return NextResponse.json({ error: "ID das diretrizes é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = updateGuidelineSchema.parse(body)

    const { data: guideline, error } = await supabase
      .from('training_guidelines')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', guidelineId)
      .eq('organization_id', ctx.tenantId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar diretrizes:', error)
      return NextResponse.json({ error: "Erro ao atualizar diretrizes" }, { status: 500 })
    }

    if (!guideline) {
      return NextResponse.json({ error: "Diretrizes não encontradas" }, { status: 404 })
    }

    return NextResponse.json({ data: guideline })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE /api/anamnesis/guidelines/[id] - Deletar diretrizes (soft delete)
export async function DELETE(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const guidelineId = url.pathname.split('/').pop()
  
  if (!guidelineId) {
    return NextResponse.json({ error: "ID das diretrizes é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('training_guidelines')
      .update({ 
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', guidelineId)
      .eq('organization_id', ctx.tenantId)

    if (error) {
      console.error('Erro ao deletar diretrizes:', error)
      return NextResponse.json({ error: "Erro ao deletar diretrizes" }, { status: 500 })
    }

    return NextResponse.json({ message: "Diretrizes deletadas com sucesso" })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
