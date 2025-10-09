import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { AuditLogger } from "@/lib/audit-logger"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.userId || !ctx.org_id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const versionId = params.id
    const supabase = await createClient()

    // Buscar a versão
    const { data: version, error: versionError } = await supabase
      .from('guidelines_versions')
      .select('*')
      .eq('id', versionId)
      .eq('org_id', ctx.org_id)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 })
    }

    if (version.status === 'PUBLISHED') {
      return NextResponse.json({ error: "Versão já está publicada" }, { status: 400 })
    }

    // Verificar se tem regras
    const { data: rules, error: rulesError } = await supabase
      .from('guideline_rules')
      .select('id')
      .eq('guidelines_version_id', version.id)

    if (rulesError) {
      console.error('Erro ao verificar regras:', rulesError)
      return NextResponse.json({ error: "Erro ao verificar regras" }, { status: 500 })
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({ error: "Não é possível publicar versão sem regras" }, { status: 400 })
    }

    // Publicar a versão
    const { data: publishedVersion, error: publishError } = await supabase
      .from('guidelines_versions')
      .update({
        status: 'PUBLISHED',
        published_by: ctx.userId,
        published_at: new Date().toISOString()
      })
      .eq('id', versionId)
      .select()
      .single()

    if (publishError) {
      console.error('Erro ao publicar versão:', publishError)
      return NextResponse.json({ error: "Erro ao publicar versão" }, { status: 500 })
    }

    // Log de auditoria
    const auditLogger = new AuditLogger(supabase)
    await auditLogger.log({
      organization_id: ctx.org_id,
      user_id: ctx.userId,
      action: 'publish',
      resource_type: 'guideline_version',
      resource_id: versionId,
      payload_after: {
        version: (version as any)?.version,
        rules_count: (rules as any)?.length
      }
    })

    return NextResponse.json({ 
      data: publishedVersion,
      success: true 
    })

  } catch (error) {
    console.error('Erro na API de publicação:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
