import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const deleteTemplateSchema = z.object({
  id: z.string().uuid("ID invÃ¡lido")
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar parÃ¢metros
    const { id } = deleteTemplateSchema.parse({ id: params.id })
    
    // Resolver contexto da requisiÃ§Ã£o
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.userId || !ctx.tenantId) {
      return NextResponse.json(
        { error: "UsuÃ¡rio nÃ£o autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase
    const supabase = await createClient()

    console.log('Tentando excluir template:', id)
    console.log('Tenant ID:', ctx.tenantId)

    // Primeiro, verificar se o template existe (mesmo se jÃ¡ foi excluÃ­do)
    const { data: allTemplates, error: allError } = await supabase
      .from('anamnesis_templates')
      .select('id, name, organization_id, deleted_at')
      .eq('id', id)
      .eq('organization_id', ctx.tenantId)
      .single()

    console.log('Template (incluindo excluÃ­dos):', allTemplates)
    console.log('Erro na busca geral:', allError)

    // Verificar se o template existe e pertence ao tenant
    const { data: template, error: fetchError } = await supabase
      .from('anamnesis_templates')
      .select('id, name, organization_id')
      .eq('id', id)
      .eq('organization_id', ctx.tenantId)
      .is('deleted_at', null)
      .single()

    console.log('Template encontrado (nÃ£o excluÃ­do):', template)
    console.log('Erro na busca (nÃ£o excluÃ­do):', fetchError)

    if (fetchError || !template) {
      return NextResponse.json(
        { error: "Template nÃ£o encontrado" },
        { status: 404 }
      )
    }

    // Verificar se Ã© o template padrÃ£o da organizaÃ§Ã£o
    const { data: defaultTemplate } = await supabase
      .from('organization_default_templates')
      .select('template_version_id')
      .eq('organization_id', ctx.tenantId)
      .single()

    if (defaultTemplate) {
      // Buscar a versÃ£o publicada do template atual
      const { data: publishedVersion } = await supabase
        .from('anamnesis_template_versions')
        .select('id')
        .eq('template_id', id)
        .eq('is_published', true)
        .single()

      // Se este template tem uma versÃ£o publicada que Ã© a padrÃ£o, nÃ£o pode ser excluÃ­do
      if (publishedVersion && defaultTemplate.template_version_id === publishedVersion.id) {
        return NextResponse.json(
          { error: "NÃ£o Ã© possÃ­vel excluir o template padrÃ£o da organizaÃ§Ã£o" },
          { status: 400 }
        )
      }
    }

    // Soft delete do template
    const { error: deleteError } = await supabase
      .from('anamnesis_templates')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', ctx.tenantId)

    if (deleteError) {
      console.error('Erro ao excluir template:', deleteError)
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Template excluÃ­do com sucesso" },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro na API de exclusÃ£o de template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados invÃ¡lidos", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
