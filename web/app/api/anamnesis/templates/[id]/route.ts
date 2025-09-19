import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const deleteTemplateSchema = z.object({
  id: z.string().uuid("ID inválido")
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar parâmetros
    const { id } = deleteTemplateSchema.parse({ id: params.id })
    
    // Resolver contexto da requisição
    const ctx = await resolveRequestContext(request)
    if (!ctx.userId || !ctx.tenantId) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      )
    }

    // Criar cliente Supabase
    const supabase = await createClient()

    console.log('Tentando excluir template:', id)
    console.log('Tenant ID:', ctx.tenantId)

    // Primeiro, verificar se o template existe (mesmo se já foi excluído)
    const { data: allTemplates, error: allError } = await supabase
      .from('anamnesis_templates')
      .select('id, name, organization_id, deleted_at')
      .eq('id', id)
      .eq('organization_id', ctx.tenantId)
      .single()

    console.log('Template (incluindo excluídos):', allTemplates)
    console.log('Erro na busca geral:', allError)

    // Verificar se o template existe e pertence ao tenant
    const { data: template, error: fetchError } = await supabase
      .from('anamnesis_templates')
      .select('id, name, organization_id')
      .eq('id', id)
      .eq('organization_id', ctx.tenantId)
      .is('deleted_at', null)
      .single()

    console.log('Template encontrado (não excluído):', template)
    console.log('Erro na busca (não excluído):', fetchError)

    if (fetchError || !template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se é o template padrão da organização
    const { data: defaultTemplate } = await supabase
      .from('organization_default_templates')
      .select('template_version_id')
      .eq('organization_id', ctx.tenantId)
      .single()

    if (defaultTemplate) {
      // Buscar a versão publicada do template atual
      const { data: publishedVersion } = await supabase
        .from('anamnesis_template_versions')
        .select('id')
        .eq('template_id', id)
        .eq('is_published', true)
        .single()

      // Se este template tem uma versão publicada que é a padrão, não pode ser excluído
      if (publishedVersion && defaultTemplate.template_version_id === publishedVersion.id) {
        return NextResponse.json(
          { error: "Não é possível excluir o template padrão da organização" },
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
      { message: "Template excluído com sucesso" },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro na API de exclusão de template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
