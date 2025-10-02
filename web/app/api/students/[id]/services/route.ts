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
    const { data: services, error } = await supabase
      .from('student_services')
      .select(`
        *,
        plans:name (
          nome,
          descricao,
          valor,
          moeda,
          ciclo,
          duracao_em_ciclos
        )
      `)
      .eq('student_id', params.id)
      .eq('org_id', ctx.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar serviços do aluno:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ services })
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
    name: string
    type: string
    status: string
    price_cents: number
    currency: string
    discount_amount_cents?: number
    discount_pct?: number
    purchase_status: string
    payment_method?: string
    installments?: number
    billing_cycle?: string
    start_date: string
    end_date?: string
    notes?: string
    is_active: boolean
  }>

  // Validações
  const name = String((b.name ?? "").toString()).trim()
  if (name.length < 2) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 })
  }

  const start_date = b.start_date
  if (!start_date || !Date.parse(start_date)) {
    return NextResponse.json({ error: "invalid_start_date" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar se o aluno existe
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('id', params.id)
      .eq('org_id', ctx.tenantId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: "student_not_found" }, { status: 404 })
    }

    // Criar serviço
    const { data: service, error: createError } = await supabase
      .from('student_services')
      .insert({
        org_id: ctx.tenantId,
        student_id: params.id,
        name,
        type: b.type || 'plan',
        status: b.status || 'active',
        price_cents: b.price_cents || 0,
        currency: b.currency || 'BRL',
        discount_amount_cents: b.discount_amount_cents || null,
        discount_pct: b.discount_pct || null,
        purchase_status: b.purchase_status || 'paid',
        payment_method: b.payment_method || null,
        installments: b.installments || null,
        billing_cycle: b.billing_cycle || 'one_off',
        start_date,
        end_date: b.end_date || null,
        notes: b.notes || null,
        is_active: b.is_active !== false
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar serviço:', createError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Serviço criado com sucesso',
      service 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}