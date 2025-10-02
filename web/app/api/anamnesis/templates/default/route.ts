import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const supabase = await createClient()

    // Buscar template default do tenant
    const { data: template, error: templateError } = await supabase
      .from('anamnesis_templates')
      .select('*')
      .eq('org_id', ctx.tenantId)
      .eq('is_default', true)
      .eq('status', 'PUBLISHED')
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      id: template.id,
      title: template.title,
      description: template.description,
      sections: template.template_json?.sections || []
    })

  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

