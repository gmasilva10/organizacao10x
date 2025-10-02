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
    if (!ctx || !ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const versionId = params.id
    const supabase = await createClient()

    // Buscar a versão
    const { data: version, error: versionError } = await supabase
      .from('guidelines_versions')
      .select('*')
      .eq('id', versionId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 })
    }

    if (version.status !== 'PUBLISHED') {
      return NextResponse.json({ error: "Apenas versões publicadas podem ser definidas como padrão" }, { status: 400 })
    }

    // Zerar outros defaults do tenant
    const { error: clearError } = await supabase
      .from('guidelines_versions')
      .update({ is_default: false })
      .eq('org_id', ctx.tenantId)
      .neq('id', versionId)

    if (clearError) {
      console.error('Erro ao limpar defaults:', clearError)
      return NextResponse.json({ error: "Erro ao definir como padrão" }, { status: 500 })
    }

    // Definir como padrão
    const { data: defaultVersion, error: setDefaultError } = await supabase
      .from('guidelines_versions')
      .update({ is_default: true })
      .eq('id', versionId)
      .select()
      .single()

    if (setDefaultError) {
      console.error('Erro ao definir como padrão:', setDefaultError)
      return NextResponse.json({ error: "Erro ao definir como padrão" }, { status: 500 })
    }

    // Log de auditoria
    const auditLogger = new AuditLogger(supabase)
    await auditLogger.log({
      organization_id: ctx.tenantId,
      user_id: ctx.userId,
      action: 'set_default',
      resource_type: 'guideline_version',
      resource_id: versionId,
      payload_after: {
        version: (version as any)?.version,
        set_default: true
      }
    })

    return NextResponse.json({ 
      data: defaultVersion,
      success: true 
    })

  } catch (error) {
    console.error('Erro na API de set default:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
