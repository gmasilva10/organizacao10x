import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { AuditLogger } from "@/lib/audit-logger"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const versionId = params.id
    const supabase = await createClient()

    // Buscar a versão
    const { data: version, error: versionError } = await supabase
      .from('guidelines_versions')
      .select('*')
      .eq('id', versionId)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 })
    }

    if (version.status !== 'PUBLISHED') {
      return NextResponse.json({ error: "Apenas versões publicadas podem ser despublicadas" }, { status: 400 })
    }

    // Despublicar a versão (voltar para DRAFT)
    const { data: unpublishedVersion, error: unpublishError } = await supabase
      .from('guidelines_versions')
      .update({
        status: 'DRAFT',
        published_by: null,
        published_at: null,
        is_default: false // Remover também o status de padrão
      })
      .eq('id', versionId)
      .select()
      .single()

    if (unpublishError) {
      console.error('Erro ao despublicar versão:', unpublishError)
      return NextResponse.json({ error: "Erro ao despublicar versão" }, { status: 500 })
    }

    // Log de auditoria
    const auditLogger = new AuditLogger(supabase)
    await auditLogger.log({
      action: 'guideline_version_unpublished',
      resource_type: 'guidelines_versions',
      resource_id: versionId,
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      details: {
        version: version.version,
        title: version.title,
        was_default: version.is_default
      }
    })

    return NextResponse.json({ 
      data: unpublishedVersion,
      success: true,
      message: `Versão "${version.title}" despublicada com sucesso`
    })

  } catch (error) {
    console.error('Erro na API de despublicação:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
