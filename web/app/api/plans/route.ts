import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function GET(request: NextRequest) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('tenant_id', ctx.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar planos:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    plan_code: string
    nome: string
    descricao?: string
    valor: number
    moeda?: string
    ciclo?: string
    duracao_em_ciclos?: number
    ativo?: boolean
  }>

  // Validações
  const plan_code = String((b.plan_code ?? "").toString()).trim()
  if (plan_code.length < 2 || plan_code.length > 20) {
    return NextResponse.json({ error: "invalid_plan_code" }, { status: 400 })
  }

  const nome = String((b.nome ?? "").toString()).trim()
  if (nome.length < 2 || nome.length > 100) {
    return NextResponse.json({ error: "invalid_nome" }, { status: 400 })
  }

  const valor = Number(b.valor ?? 0)
  if (!Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: "invalid_valor" }, { status: 400 })
  }

  const moeda = (b.moeda ?? "BRL") as string
  if (!new Set(["BRL", "USD", "EUR"]).has(moeda)) {
    return NextResponse.json({ error: "invalid_moeda" }, { status: 400 })
  }

  const ciclo = b.ciclo as string | undefined
  if (ciclo && !new Set(["mensal", "trimestral", "semestral", "anual"]).has(ciclo)) {
    return NextResponse.json({ error: "invalid_ciclo" }, { status: 400 })
  }

  const duracao_em_ciclos = b.duracao_em_ciclos
  if (duracao_em_ciclos !== undefined && (!Number.isFinite(duracao_em_ciclos) || duracao_em_ciclos <= 0)) {
    return NextResponse.json({ error: "invalid_duracao" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar se plan_code já existe
    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
      .select('id')
      .eq('tenant_id', ctx.tenantId)
      .eq('plan_code', plan_code)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao verificar plan_code:', checkError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (existingPlan) {
      return NextResponse.json({ error: "plan_code_already_exists" }, { status: 409 })
    }

    // Criar plano
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        plan_code,
        nome,
        descricao: b.descricao || null,
        valor,
        moeda,
        ciclo: ciclo || null,
        duracao_em_ciclos: duracao_em_ciclos || null,
        ativo: b.ativo ?? true,
        tenant_id: ctx.tenantId
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar plano:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Plano criado com sucesso',
      plan 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
