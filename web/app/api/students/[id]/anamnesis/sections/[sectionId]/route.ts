import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  const startTime = Date.now()
  
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id: studentId, sectionId } = await params
    const body = await request.json()
    const { answers, active_tags } = body

    const supabase = await createClient()

    // Verificar se o usuário tem permissão para acessar este aluno
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, tenant_id')
      .eq('id', studentId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
    }

    // Buscar última versão para incrementar o número
    const { data: lastVersion, error: lastVersionError } = await supabase
      .from('student_anamnesis_versions')
      .select('version_n')
      .eq('student_id', studentId)
      .eq('org_id', ctx.tenantId)
      .order('version_n', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = lastVersion ? lastVersion.version_n + 1 : 1

    // Buscar template default para referência
    const { data: template, error: templateError } = await supabase
      .from('anamnesis_templates')
      .select('id')
      .eq('org_id', ctx.tenantId)
      .eq('is_default', true)
      .eq('status', 'PUBLISHED')
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    // Criar nova versão
    const { data: newVersion, error: createError } = await supabase
      .from('student_anamnesis_versions')
      .insert({
        student_id: studentId,
        version_n: nextVersion,
        answers_json: answers,
        template_version_id: template.id,
        tenant_id: ctx.tenantId,
        created_by: ctx.userId
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar versão:', createError)
      return NextResponse.json({ error: "Erro ao salvar anamnese" }, { status: 500 })
    }

    // Atualizar view materializada (se existir)
    await supabase
      .from('student_anamnesis_latest')
      .upsert({
        student_id: studentId,
        version_id: newVersion.id,
        answers_json: answers,
        active_tags: active_tags || [],
        tenant_id: ctx.tenantId,
        updated_at: new Date().toISOString()
      })

    const duration = Date.now() - startTime
    const response = NextResponse.json({
      version: newVersion,
      message: 'Seção salva com sucesso'
    })

    response.headers.set('X-Query-Time', `${duration}ms`)
    return response

  } catch (error) {
    console.error('Erro ao salvar seção:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
