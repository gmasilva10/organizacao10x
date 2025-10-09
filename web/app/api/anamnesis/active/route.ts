import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { createClient } from "@/utils/supabase/server"

// GET /api/anamnesis/active - Buscar versões ativas do tenant

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    // Buscar template padrão da organização
    const { data: defaultTemplate, error: templateError } = await supabase
      .from('organization_default_templates')
      .select(`
        template_version:anamnesis_template_versions(
          id,
          version_number,
          is_published,
          published_at,
          template:anamnesis_templates(
            id,
            name,
            description
          )
        )
      `)
      .eq('organization_id', ctx.org_id)
      .single()

    // Buscar diretrizes padrão da organização
    const { data: defaultGuidelines, error: guidelinesError } = await supabase
      .from('organization_default_guidelines')
      .select(`
        guideline_version:training_guideline_versions(
          id,
          version_number,
          is_published,
          published_at,
          guideline:training_guidelines(
            id,
            name,
            description
          )
        )
      `)
      .eq('organization_id', ctx.org_id)
      .single()

    return NextResponse.json({
      data: {
        template_version: defaultTemplate?.template_version || null,
        guidelines_version: defaultGuidelines?.guideline_version || null,
        organization_id: ctx.org_id,
        updated_at: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'X-Query-Time': '0' // TODO: implementar medição real
      }
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

