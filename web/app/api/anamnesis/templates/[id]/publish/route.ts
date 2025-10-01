import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { createClient } from "@/utils/supabase/server"
import { AuditLogger } from "@/lib/audit-logger"

// POST /api/anamnesis/templates/[id]/publish - Publicar template

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    // Verificar se o template pertence à organização
    const { data: template, error: templateError } = await supabase
      .from('anamnesis_templates')
      .select('id, organization_id, name')
      .eq('id', params.id)
      .eq('organization_id', ctx.tenantId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    // Buscar a versão mais recente (não publicada)
    const { data: latestVersion, error: versionError } = await supabase
      .from('anamnesis_template_versions')
      .select('id, version_number, is_published, published_at, published_by')
      .eq('template_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      return NextResponse.json({ error: "Versão do template não encontrada" }, { status: 404 })
    }

    if (latestVersion.is_published) {
      return NextResponse.json({ 
        error: "Esta versão já foi publicada" 
      }, { status: 400 })
    }

    // Verificar se há perguntas na versão
    const { data: questions, error: questionsError } = await supabase
      .from('anamnesis_questions')
      .select('id')
      .eq('template_version_id', latestVersion.id)

    if (questionsError) {
      console.error('Erro ao verificar perguntas:', questionsError)
      return NextResponse.json({ error: "Erro ao verificar perguntas" }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ 
        error: "Não é possível publicar um template sem perguntas" 
      }, { status: 400 })
    }

    // Registrar estado antes da publicação
    const beforeState = {
      is_published: latestVersion.is_published,
      published_at: latestVersion.published_at,
      published_by: latestVersion.published_by
    }

    // Publicar a versão
    const { data: publishedVersion, error: publishError } = await supabase
      .from('anamnesis_template_versions')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        published_by: ctx.userId
      })
      .eq('id', latestVersion.id)
      .select()
      .single()

    if (publishError) {
      console.error('Erro ao publicar template:', publishError)
      return NextResponse.json({ error: "Erro ao publicar template" }, { status: 500 })
    }

    // Registrar auditoria
    const auditLogger = AuditLogger.getInstance(supabase)
    await auditLogger.logTemplatePublish(
      ctx.tenantId,
      ctx.userId,
      template.id,
      publishedVersion.id,
      beforeState,
      {
        is_published: publishedVersion.is_published,
        published_at: publishedVersion.published_at,
        published_by: publishedVersion.published_by
      }
    )

    // Buscar todas as perguntas da versão publicada
    const { data: publishedQuestions, error: questionsError2 } = await supabase
      .from('anamnesis_questions')
      .select('*')
      .eq('template_version_id', publishedVersion.id)
      .order('order_index', { ascending: true })

    if (questionsError2) {
      console.error('Erro ao buscar perguntas publicadas:', questionsError2)
      return NextResponse.json({ error: "Erro ao buscar perguntas publicadas" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: {
        ...publishedVersion,
        questions: publishedQuestions || []
      },
      message: "Template publicado com sucesso"
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST /api/anamnesis/templates/[id]/create-version - Criar nova versão
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    // Verificar se o template pertence à organização
    const { data: template, error: templateError } = await supabase
      .from('anamnesis_templates')
      .select('id, organization_id, name')
      .eq('id', params.id)
      .eq('organization_id', ctx.tenantId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    // Buscar a versão mais recente
    const { data: latestVersion, error: versionError } = await supabase
      .from('anamnesis_template_versions')
      .select('id, version_number')
      .eq('template_id', params.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      return NextResponse.json({ error: "Versão do template não encontrada" }, { status: 404 })
    }

    // Criar nova versão
    const newVersionNumber = latestVersion.version_number + 1
    const { data: newVersion, error: createError } = await supabase
      .from('anamnesis_template_versions')
      .insert({
        template_id: params.id,
        version_number: newVersionNumber,
        is_published: false
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar nova versão:', createError)
      return NextResponse.json({ error: "Erro ao criar nova versão" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: newVersion,
      message: `Nova versão ${newVersionNumber} criada com sucesso`
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
