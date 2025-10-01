import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { AuditLogger } from "@/lib/audit-logger"

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const setDefaultTemplateSchema = z.object({
  template_version_id: z.string().uuid("ID da versÃ£o do template deve ser um UUID vÃ¡lido")
})

// POST /api/anamnesis/active/template - Definir template padrÃ£o da organizaÃ§Ã£o
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx || !ctx.userId || !ctx.tenantId) {
    return NextResponse.json({ error: "UsuÃ¡rio nÃ£o autenticado" }, { status: 401 })
  }

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = setDefaultTemplateSchema.parse(body)

    // Verificar se a versÃ£o do template existe e estÃ¡ publicada
    const { data: templateVersion, error: versionError } = await supabase
      .from('anamnesis_template_versions')
      .select(`
        id,
        is_published,
        template:anamnesis_templates(
          id,
          organization_id
        )
      `)
      .eq('id', validatedData.template_version_id)
      .single()

    if (versionError || !templateVersion) {
      return NextResponse.json({ error: "VersÃ£o do template nÃ£o encontrada" }, { status: 404 })
    }

    const templateOrgId = Array.isArray((templateVersion as any).template)
      ? (templateVersion as any).template[0]?.organization_id
      : (templateVersion as any).template?.organization_id
    if (templateOrgId !== ctx.tenantId) {
      return NextResponse.json({ error: "Template nÃ£o pertence Ã  organizaÃ§Ã£o" }, { status: 403 })
    }

    if (!templateVersion.is_published) {
      return NextResponse.json({ 
        error: "Apenas versÃµes publicadas podem ser definidas como padrÃ£o" 
      }, { status: 400 })
    }

    // Buscar default anterior para auditoria
    const { data: previousDefault } = await supabase
      .from('organization_default_templates')
      .select('template_version_id')
      .eq('organization_id', ctx.tenantId)
      .single()

    // Remover default anterior se existir
    await supabase
      .from('organization_default_templates')
      .delete()
      .eq('organization_id', ctx.tenantId)

    // Definir novo default
    const { data: defaultTemplate, error: createError } = await supabase
      .from('organization_default_templates')
      .insert({
        organization_id: ctx.tenantId,
        template_version_id: validatedData.template_version_id,
        created_by: ctx.userId
      })
      .select(`
        *,
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
      .single()

    if (createError) {
      console.error('Erro ao definir template padrÃ£o:', createError)
      return NextResponse.json({ error: "Erro ao definir template padrÃ£o" }, { status: 500 })
    }

    // Registrar auditoria
    const auditLogger = AuditLogger.getInstance(supabase)
    await auditLogger.logSetDefault(
      ctx.tenantId,
      ctx.userId,
      'template',
      validatedData.template_version_id,
      previousDefault ? { template_version_id: previousDefault.template_version_id } : null,
      { template_version_id: validatedData.template_version_id }
    )

    return NextResponse.json({ 
      data: defaultTemplate,
      message: "Template padrÃ£o definido com sucesso"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
