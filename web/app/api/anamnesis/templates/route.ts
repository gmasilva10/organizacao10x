import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const createTemplateSchema = z.object({
  name: z.string().min(1, "Nome Ã© obrigatÃ³rio"),
  description: z.string().optional(),
  is_default: z.boolean().optional().default(false)
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional()
})

// GET /api/anamnesis/templates - Listar templates
export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  const url = new URL(request.url)
  const includeVersions = url.searchParams.get('include_versions') === 'true'

  try {
    const selectQuery = includeVersions ? `
      *,
      versions:anamnesis_template_versions(
        id,
        version_number,
        is_published,
        published_at,
        created_at,
        questions:anamnesis_questions(
          id,
          question_id,
          label,
          type,
          required,
          priority,
          decision_enabled,
          decision_tag,
          options,
          help_text,
          order_index
        )
      )
    ` : `
      *,
      versions:anamnesis_template_versions(
        id,
        version_number,
        is_published,
        published_at,
        created_at
      )
    `

    const { data: templates, error } = await supabase
      .from('anamnesis_templates')
      .select(selectQuery)
      .eq('organization_id', ctx.tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar templates:', error)
      return NextResponse.json({ error: "Erro ao buscar templates" }, { status: 500 })
    }


    // Buscar template padrÃ£o da organizaÃ§Ã£o
    const { data: defaultTemplate, error: defaultError } = await supabase
      .from('organization_default_templates')
      .select('template_version_id')
      .eq('organization_id', ctx.tenantId)
      .single()
    
    console.log('Default template encontrado:', defaultTemplate)
    if (defaultError) {
      console.log('Erro ao buscar default template (pode nÃ£o existir):', defaultError.message)
    }

    // Processar templates para incluir latest_version, published_version e is_default
    const processedTemplates = templates?.map(template => {
      const versions = template.versions || []
      const latestVersion = versions.reduce((latest: any, version: any) => 
        version.version_number > latest.version_number ? version : latest, versions[0])
      const publishedVersion = versions.find((v: any) => v.is_published)
      
      // Verificar se este template Ã© o padrÃ£o
      const isDefault = defaultTemplate && publishedVersion && 
        defaultTemplate.template_version_id === publishedVersion.id

      return {
        ...template,
        latest_version: latestVersion,
        published_version: publishedVersion,
        is_default: !!isDefault
      }
    }) || []


    return NextResponse.json({ 
      data: processedTemplates,
      count: processedTemplates.length 
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

// POST /api/anamnesis/templates - Criar template
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    // Se for template padrÃ£o, desativar outros padrÃµes
    if (validatedData.is_default) {
      await supabase
        .from('anamnesis_templates')
        .update({ is_default: false })
        .eq('organization_id', ctx.tenantId)
    }

    const { data: template, error } = await supabase
      .from('anamnesis_templates')
      .insert({
        organization_id: ctx.tenantId,
        name: validatedData.name,
        description: validatedData.description,
        is_default: validatedData.is_default,
        created_by: ctx.userId
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar template:', error)
      return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 })
    }

    // Criar versÃ£o inicial
    const { error: versionError } = await supabase
      .from('anamnesis_template_versions')
      .insert({
        template_id: template.id,
        version_number: 1,
        is_published: false
      })

    if (versionError) {
      console.error('Erro ao criar versÃ£o inicial:', versionError)
      return NextResponse.json({ error: "Erro ao criar versÃ£o inicial" }, { status: 500 })
    }

    return NextResponse.json({ data: template }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PUT /api/anamnesis/templates/[id] - Atualizar template
export async function PUT(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const templateId = url.pathname.split('/').pop()
  
  if (!templateId) {
    return NextResponse.json({ error: "ID do template Ã© obrigatÃ³rio" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)

    // Se for template padrÃ£o, desativar outros padrÃµes
    if (validatedData.is_default) {
      await supabase
        .from('anamnesis_templates')
        .update({ is_default: false })
        .eq('organization_id', ctx.tenantId)
        .neq('id', templateId)
    }

    const { data: template, error } = await supabase
      .from('anamnesis_templates')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('organization_id', ctx.tenantId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar template:', error)
      return NextResponse.json({ error: "Erro ao atualizar template" }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ error: "Template nÃ£o encontrado" }, { status: 404 })
    }

    return NextResponse.json({ data: template })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE /api/anamnesis/templates/[id] - Deletar template (soft delete)
export async function DELETE(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const templateId = url.pathname.split('/').pop()
  
  if (!templateId) {
    return NextResponse.json({ error: "ID do template Ã© obrigatÃ³rio" }, { status: 400 })
  }

  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('anamnesis_templates')
      .update({ 
        deleted_at: new Date().toISOString(),
        is_active: false
      })
      .eq('id', templateId)
      .eq('organization_id', ctx.tenantId)

    if (error) {
      console.error('Erro ao deletar template:', error)
      return NextResponse.json({ error: "Erro ao deletar template" }, { status: 500 })
    }

    return NextResponse.json({ message: "Template deletado com sucesso" })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
