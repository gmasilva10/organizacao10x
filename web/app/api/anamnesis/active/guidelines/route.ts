import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const setDefaultGuidelinesSchema = z.object({
  guideline_version_id: z.string().uuid("ID da versÃ£o das diretrizes deve ser um UUID vÃ¡lido")
})

// POST /api/anamnesis/active/guidelines - Definir diretrizes padrÃ£o da organizaÃ§Ã£o
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = setDefaultGuidelinesSchema.parse(body)

    // Verificar se a versÃ£o das diretrizes existe e estÃ¡ publicada
    const { data: guidelineVersion, error: versionError } = await supabase
      .from('training_guideline_versions')
      .select(`
        id,
        is_published,
        guideline:training_guidelines(
          id,
          organization_id
        )
      `)
      .eq('id', validatedData.guideline_version_id)
      .single()

    if (versionError || !guidelineVersion) {
      return NextResponse.json({ error: "VersÃ£o das diretrizes nÃ£o encontrada" }, { status: 404 })
    }

    const guidelineOrgId = Array.isArray((guidelineVersion as any).guideline)
      ? (guidelineVersion as any).guideline[0]?.organization_id
      : (guidelineVersion as any).guideline?.organization_id
    if (guidelineOrgId !== ctx.tenantId) {
      return NextResponse.json({ error: "Diretrizes nÃ£o pertencem Ã  organizaÃ§Ã£o" }, { status: 403 })
    }

    if (!guidelineVersion.is_published) {
      return NextResponse.json({ 
        error: "Apenas versÃµes publicadas podem ser definidas como padrÃ£o" 
      }, { status: 400 })
    }

    // Remover default anterior se existir
    await supabase
      .from('organization_default_guidelines')
      .delete()
      .eq('organization_id', ctx.tenantId)

    // Definir novo default
    const { data: defaultGuidelines, error: createError } = await supabase
      .from('organization_default_guidelines')
      .insert({
        organization_id: ctx.tenantId,
        guideline_version_id: validatedData.guideline_version_id,
        created_by: ctx.userId
      })
      .select(`
        *,
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
      .single()

    if (createError) {
      console.error('Erro ao definir diretrizes padrÃ£o:', createError)
      return NextResponse.json({ error: "Erro ao definir diretrizes padrÃ£o" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: defaultGuidelines,
      message: "Diretrizes padrÃ£o definidas com sucesso"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
