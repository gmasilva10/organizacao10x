import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const b = (body || {}) as Partial<{
    plan_code?: string
    nome?: string
    descricao?: string
    valor?: number
    moeda?: string
    ciclo?: string
    duracao_em_ciclos?: number
    ativo?: boolean
  }>

  // Validações condicionais (apenas campos fornecidos)
  if (b.plan_code !== undefined) {
    const plan_code = String(b.plan_code).trim()
    if (plan_code.length < 2 || plan_code.length > 20) {
      return NextResponse.json({ error: "invalid_plan_code" }, { status: 400 })
    }
  }

  if (b.nome !== undefined) {
    const nome = String(b.nome).trim()
    if (nome.length < 2 || nome.length > 100) {
      return NextResponse.json({ error: "invalid_nome" }, { status: 400 })
    }
  }

  if (b.valor !== undefined) {
    const valor = Number(b.valor)
    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json({ error: "invalid_valor" }, { status: 400 })
    }
  }

  if (b.moeda !== undefined) {
    if (!new Set(["BRL", "USD", "EUR"]).has(b.moeda)) {
      return NextResponse.json({ error: "invalid_moeda" }, { status: 400 })
    }
  }

  if (b.ciclo !== undefined && b.ciclo !== null) {
    if (!new Set(["mensal", "trimestral", "semestral", "anual"]).has(b.ciclo)) {
      return NextResponse.json({ error: "invalid_ciclo" }, { status: 400 })
    }
  }

  if (b.duracao_em_ciclos !== undefined && b.duracao_em_ciclos !== null) {
    if (!Number.isFinite(b.duracao_em_ciclos) || b.duracao_em_ciclos <= 0) {
      return NextResponse.json({ error: "invalid_duracao" }, { status: 400 })
    }
  }

  const supabase = createClient(url, key)

  try {
    // Se está alterando plan_code, verificar se já existe
    if (b.plan_code !== undefined) {
      const { data: existingPlan, error: checkError } = await supabase
        .from('plans')
        .select('id')
        .eq('tenant_id', ctx.tenantId)
        .eq('plan_code', b.plan_code)
        .neq('id', params.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar plan_code:', checkError)
        return NextResponse.json({ error: "database_error" }, { status: 500 })
      }

      if (existingPlan) {
        return NextResponse.json({ error: "plan_code_already_exists" }, { status: 409 })
      }
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (b.plan_code !== undefined) updateData.plan_code = b.plan_code
    if (b.nome !== undefined) updateData.nome = b.nome
    if (b.descricao !== undefined) updateData.descricao = b.descricao
    if (b.valor !== undefined) updateData.valor = b.valor
    if (b.moeda !== undefined) updateData.moeda = b.moeda
    if (b.ciclo !== undefined) updateData.ciclo = b.ciclo
    if (b.duracao_em_ciclos !== undefined) updateData.duracao_em_ciclos = b.duracao_em_ciclos
    if (b.ativo !== undefined) updateData.ativo = b.ativo

    // Atualizar plano
    const { data: plan, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', params.id)
      .eq('tenant_id', ctx.tenantId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar plano:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plano atualizado com sucesso',
      plan 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Verificar se o plano existe e pertence ao tenant
    const { data: plan, error: checkError } = await supabase
      .from('plans')
      .select('id, plan_code')
      .eq('id', params.id)
      .eq('tenant_id', ctx.tenantId)
      .single()

    if (checkError) {
      console.error('Erro ao verificar plano:', checkError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (!plan) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 })
    }

    // Verificar se há contratos ativos usando este plano
    const { data: activeContracts, error: contractsError } = await supabase
      .from('student_plan_contracts')
      .select('id')
      .eq('plan_code', plan.plan_code)
      .eq('status', 'ativo')
      .limit(1)

    if (contractsError) {
      console.error('Erro ao verificar contratos:', contractsError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (activeContracts && activeContracts.length > 0) {
      return NextResponse.json({ 
        error: "cannot_delete_plan_with_active_contracts" 
      }, { status: 409 })
    }

    // Deletar plano
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', ctx.tenantId)

    if (error) {
      console.error('Erro ao deletar plano:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plano deletado com sucesso' 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
