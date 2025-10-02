import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { resolveRequestContext } from "@/server/context"
import { z } from "zod"

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const updateRuleSchema = z.object({
  priority_clinical: z.enum(['critica', 'alta', 'media', 'baixa']),
  condition: z.object({
    all: z.array(z.object({
      tag: z.string(),
      op: z.enum(['eq', 'in', 'gt', 'lt', 'gte', 'lte']),
      val: z.union([z.string(), z.number(), z.array(z.string())])
    }))
  }),
  outputs: z.object({
    aerobio: z.object({
      duracao_min: z.array(z.number()).length(2),
      intensidade: z.object({
        metodo: z.enum(['FCR', 'PSE', 'vVO2max', 'MFEL']),
        faixa: z.array(z.number()).length(2),
        texto: z.string().optional()
      }),
      frequencia_sem: z.array(z.number()).length(2),
      obs: z.array(z.string()).optional()
    }),
    pesos: z.object({
      exercicios: z.array(z.number()).length(2),
      series: z.array(z.number()).length(2),
      reps: z.array(z.number()).length(2),
      frequencia_sem: z.array(z.number()).length(2),
      intensidade_pct_1rm: z.array(z.number()).length(2),
      obs: z.array(z.string()).optional()
    }),
    flex_mob: z.object({
      foco: z.string().optional(),
      obs: z.array(z.string()).optional()
    }),
    contraindicacoes: z.array(z.string()),
    observacoes: z.array(z.string())
  })
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, ruleId: string }> }
) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 })
    }

    const { id: versionId, ruleId } = await params
    const body = await request.json()
    const validatedData = updateRuleSchema.parse(body)

    const supabase = await createClient()

    // Verificar se a versÃ£o pertence ao tenant e Ã© DRAFT
    const { data: version, error: versionError } = await supabase
      .from('guidelines_versions')
      .select('id, status')
      .eq('id', versionId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: "VersÃ£o nÃ£o encontrada" }, { status: 404 })
    }

    if (version.status !== 'DRAFT') {
      return NextResponse.json({ error: "Apenas versÃµes em rascunho podem ser editadas" }, { status: 400 })
    }

    // Verificar se a regra existe e pertence ao tenant
    const { data: existingRule, error: ruleError } = await supabase
      .from('guideline_rules')
      .select('id')
      .eq('id', ruleId)
      .eq('org_id', ctx.tenantId)
      .eq('guidelines_version_id', versionId)
      .single()

    if (ruleError || !existingRule) {
      return NextResponse.json({ error: "Regra nÃ£o encontrada" }, { status: 404 })
    }

    // Atualizar regra
    const { data: rule, error } = await supabase
      .from('guideline_rules')
      .update({
        priority_clinical: validatedData.priority_clinical,
        condition: validatedData.condition,
        outputs: validatedData.outputs,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)
      .eq('org_id', ctx.tenantId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar regra:', error)
      return NextResponse.json({ error: "Erro ao atualizar regra" }, { status: 500 })
    }

    return NextResponse.json({ 
      data: rule,
      success: true 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados invÃ¡lidos", details: error.issues }, { status: 400 })
    }
    console.error('Erro na API de regras:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, ruleId: string }> }
) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.userId || !ctx.tenantId) {
      return NextResponse.json({ error: "NÃ£o autorizado" }, { status: 401 })
    }

    const { id: versionId, ruleId } = await params
    const supabase = await createClient()

    // Verificar se a versÃ£o pertence ao tenant e Ã© DRAFT
    const { data: version, error: versionError } = await supabase
      .from('guidelines_versions')
      .select('id, status')
      .eq('id', versionId)
      .eq('org_id', ctx.tenantId)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: "VersÃ£o nÃ£o encontrada" }, { status: 404 })
    }

    if (version.status !== 'DRAFT') {
      return NextResponse.json({ error: "Apenas versÃµes em rascunho podem ser editadas" }, { status: 400 })
    }

    // Verificar se a regra existe e pertence ao tenant
    const { data: existingRule, error: ruleError } = await supabase
      .from('guideline_rules')
      .select('id')
      .eq('id', ruleId)
      .eq('org_id', ctx.tenantId)
      .eq('guidelines_version_id', versionId)
      .single()

    if (ruleError || !existingRule) {
      return NextResponse.json({ error: "Regra nÃ£o encontrada" }, { status: 404 })
    }

    // Deletar regra
    const { error } = await supabase
      .from('guideline_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', ctx.tenantId)

    if (error) {
      console.error('Erro ao deletar regra:', error)
      return NextResponse.json({ error: "Erro ao deletar regra" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "Regra excluÃ­da com sucesso"
    })

  } catch (error) {
    console.error('Erro na API de regras:', error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
