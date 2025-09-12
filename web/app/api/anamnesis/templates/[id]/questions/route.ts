import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"

const updateQuestionsSchema = z.object({
  questions: z.array(z.object({
    id: z.string().uuid().optional(),
    label: z.string().min(1, "Label é obrigatório"),
    type: z.enum(['text', 'single', 'multi']),
    required: z.boolean(),
    priority: z.enum(['low', 'medium', 'high']),
    decision_enabled: z.boolean(),
    decision_tag: z.string().optional(),
    options: z.array(z.string()).optional(),
    help_text: z.string().optional(),
    order_index: z.number()
  }))
})

// PUT /api/anamnesis/templates/[id]/questions - Atualizar perguntas do template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
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

    // Verificar se o template existe e pertence ao tenant
    const { data: template, error: templateError } = await supabase
      .from('anamnesis_templates')
      .select('id, name, organization_id')
      .eq('id', id)
      .eq('organization_id', ctx.tenantId)
      .is('deleted_at', null)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    // Validar dados da requisição
    const body = await request.json()
    const validatedData = updateQuestionsSchema.parse(body)

    // Buscar versão mais recente do template
    const { data: latestVersion, error: versionError } = await supabase
      .from('anamnesis_template_versions')
      .select('id')
      .eq('template_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError || !latestVersion) {
      return NextResponse.json(
        { error: "Versão do template não encontrada" },
        { status: 404 }
      )
    }

    // Deletar perguntas existentes da versão
    await supabase
      .from('anamnesis_questions')
      .delete()
      .eq('template_version_id', latestVersion.id)

    // Inserir novas perguntas
    if (validatedData.questions.length > 0) {
      const questionsToInsert = validatedData.questions.map(q => ({
        template_version_id: latestVersion.id,
        question_id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: q.label,
        type: q.type,
        required: q.required,
        priority: q.priority,
        decision_enabled: q.decision_enabled,
        decision_tag: q.decision_tag || null,
        options: q.options || null,
        help_text: q.help_text || null,
        order_index: q.order_index
      }))

      const { error: insertError } = await supabase
        .from('anamnesis_questions')
        .insert(questionsToInsert)

      if (insertError) {
        console.error('Erro ao inserir perguntas:', insertError)
        return NextResponse.json(
          { error: "Erro ao salvar perguntas" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { message: "Perguntas atualizadas com sucesso" },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro na API de atualização de perguntas:', error)
    
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