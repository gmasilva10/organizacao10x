import { NextResponse } from "next/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"
import { createClient } from "@/utils/supabase/server"
import { AuditLogger } from "@/lib/audit-logger"

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const setDefaultTemplateSchema = z.object({
  template_version_id: z.string().uuid("ID da versão do template deve ser um UUID válido")
})

// POST /api/anamnesis/active/template - Definir template padrão da organização
export async function POST(request: Request) {
  const ctx = await resolveRequestContext(request)
  if (!ctx || !ctx.userId || !ctx.org_id) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
  }

  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const validatedData = setDefaultTemplateSchema.parse(body)

    // Verificar se a versão do template existe e está publicada
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
      return NextResponse.json({ error: "Versão do template não encontrada" }, { status: 404 })
    }

    const templateOrgId = Array.isArray((templateVersion as any).template)
      ? (templateVersion as any).template[0]?.organization_id
      : (templateVersion as any).template?.organization_id
    if (templateOrgId !== ctx.org_id) {
      return NextResponse.json({ error: "Template não pertence à organização" }, { status: 403 })
    }

    if (!templateVersion.is_published) {
      return NextResponse.json({ 
        error: "Apenas versões publicadas podem ser definidas como padrão" 
      }, { status: 400 })
    }

    // Buscar default anterior para auditoria
    const { data: previousDefault } = await supabase
      .from('organization_default_templates')
      .select('template_version_id')
      .eq('organization_id', ctx.org_id)
      .single()

    // Remover default anterior se existir
    await supabase
      .from('organization_default_templates')
      .delete()
      .eq('organization_id', ctx.org_id)

    // Definir novo default
    const { data: defaultTemplate, error: createError } = await supabase
      .from('organization_default_templates')
      .insert({
        organization_id: ctx.org_id,
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
      console.error('Erro ao definir template padrão:', createError)
      return NextResponse.json({ error: "Erro ao definir template padrão" }, { status: 500 })
    }

    // Registrar auditoria
    const auditLogger = AuditLogger.getInstance(supabase)
    await auditLogger.logSetDefault(
      ctx.org_id,
      ctx.userId,
      'template',
      validatedData.template_version_id,
      previousDefault ? { template_version_id: previousDefault.template_version_id } : null,
      { template_version_id: validatedData.template_version_id }
    )

    return NextResponse.json({ 
      data: defaultTemplate,
      message: "Template padrão definido com sucesso"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 })
    }
    console.error('Erro interno:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

