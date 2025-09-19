import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const setDefaultGuidelinesSchema = z.object({
  guideline_version_id: z.string().uuid("ID da versão das diretrizes deve ser um UUID válido")
})

// POST /api/anamnesis/active/guidelines - Definir diretrizes padrão da organização
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = setDefaultGuidelinesSchema.parse(body)

    // Verificar se a versão das diretrizes existe e está publicada
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
      return NextResponse.json({ error: "Versão das diretrizes não encontrada" }, { status: 404 })
    }

    if (guidelineVersion.guideline.organization_id !== ctx.tenantId) {
      return NextResponse.json({ error: "Diretrizes não pertencem à organização" }, { status: 403 })
    }

    if (!guidelineVersion.is_published) {
      return NextResponse.json({ 
        error: "Apenas versões publicadas podem ser definidas como padrão" 
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
      console.error('Erro ao definir diretrizes padrão:', createError)
      return NextResponse.json({ error: "Erro ao definir diretrizes padrão" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: defaultGuidelines,
      message: "Diretrizes padrão definidas com sucesso"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
