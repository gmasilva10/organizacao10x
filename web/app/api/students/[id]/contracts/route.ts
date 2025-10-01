import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    const { data: contracts, error } = await supabase
      .from('student_plan_contracts')
      .select(`
        *,
        plans:plan_code (
          nome,
          descricao,
          valor,
          moeda,
          ciclo,
          duracao_em_ciclos
        )
      `)
      .eq('student_id', params.id)
      .eq('tenant_id', ctx.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar contratos:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ contracts })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(
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
    plan_code: string
    start_date: string
    end_date?: string
    unit_price?: number
    currency?: string
    cycle?: string
    duration_cycles?: number
    notes?: string
    generate_billing?: boolean
  }>

  // Validações
  const plan_code = String((b.plan_code ?? "").toString()).trim()
  if (plan_code.length < 2) {
    return NextResponse.json({ error: "invalid_plan_code" }, { status: 400 })
  }

  const start_date = b.start_date
  if (!start_date || !Date.parse(start_date)) {
    return NextResponse.json({ error: "invalid_start_date" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar se o plano existe e está ativo
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('plan_code', plan_code)
      .eq('tenant_id', ctx.tenantId)
      .eq('ativo', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "plan_not_found_or_inactive" }, { status: 404 })
    }

    // Verificar se já existe contrato ativo do mesmo plan_code
    const { data: existingContract, error: contractError } = await supabase
      .from('student_plan_contracts')
      .select('id')
      .eq('student_id', params.id)
      .eq('plan_code', plan_code)
      .eq('status', 'ativo')
      .single()

    if (contractError && contractError.code !== 'PGRST116') {
      console.error('Erro ao verificar contrato existente:', contractError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (existingContract) {
      return NextResponse.json({ error: "active_contract_exists" }, { status: 409 })
    }

    // Preparar dados do contrato
    const unit_price = b.unit_price || plan.valor
    const currency = b.currency || plan.moeda
    const cycle = b.cycle || plan.ciclo
    const duration_cycles = b.duration_cycles || plan.duracao_em_ciclos

    // Calcular end_date se não fornecido e há duração
    let end_date = b.end_date
    if (!end_date && duration_cycles && cycle) {
      const start = new Date(start_date)
      const monthsPerCycle = (({
        'mensal': 1,
        'trimestral': 3,
        'semestral': 6,
        'anual': 12
      } as Record<string, number>)[String(cycle)]) || 1
      
      const totalMonths = duration_cycles * monthsPerCycle
      const end = new Date(start)
      end.setMonth(end.getMonth() + totalMonths)
      end_date = end.toISOString().split('T')[0]
    }

    // Criar contrato
    const { data: contract, error: createError } = await supabase
      .from('student_plan_contracts')
      .insert({
        student_id: params.id,
        plan_code,
        unit_price,
        currency,
        cycle,
        duration_cycles,
        start_date,
        end_date,
        status: 'ativo',
        notes: b.notes || null,
        tenant_id: ctx.tenantId
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar contrato:', createError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    // Gerar cobrança se solicitado
    if (b.generate_billing !== false) {
      const competencia = new Date(start_date).toISOString().slice(0, 7).replace('-', '') // AAAAMM
      
      const { error: billingError } = await supabase
        .from('student_billing')
        .insert({
          student_id: params.id,
          contract_id: contract.id,
          plan_code,
          competencia,
          valor: unit_price,
          moeda: currency,
          status: 'pendente',
          created_by: ctx.userId,
          tenant_id: ctx.tenantId
        })

      if (billingError) {
        console.error('Erro ao criar cobrança:', billingError)
        // Não falha o contrato se a cobrança falhar
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contrato criado com sucesso',
      contract 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
