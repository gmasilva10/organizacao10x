import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    const { data: service, error } = await supabase
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
      .eq('id', params.serviceId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.org_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "service_not_found" }, { status: 404 })
      }
      console.error('Erro ao buscar serviço:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
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
    name?: string
    type?: string
    status?: string
    price_cents?: number
    currency?: string
    discount_amount_cents?: number
    discount_pct?: number
    purchase_status?: string
    payment_method?: string
    installments?: number
    billing_cycle?: string
    start_date?: string
    end_date?: string
    notes?: string
    is_active?: boolean
  }>

  const supabase = createClient(url, key)

  try {
    // Verificar se o serviço existe
    const { data: existingService, error: serviceError } = await supabase
      .from('student_services')
      .select('id')
      .eq('id', params.serviceId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.org_id)
      .single()

    if (serviceError || !existingService) {
      return NextResponse.json({ error: "service_not_found" }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (b.name !== undefined) updateData.name = String(b.name).trim()
    if (b.type !== undefined) updateData.type = b.type
    if (b.status !== undefined) updateData.status = b.status
    if (b.price_cents !== undefined) updateData.price_cents = b.price_cents
    if (b.currency !== undefined) updateData.currency = b.currency
    if (b.discount_amount_cents !== undefined) updateData.discount_amount_cents = b.discount_amount_cents
    if (b.discount_pct !== undefined) updateData.discount_pct = b.discount_pct
    if (b.purchase_status !== undefined) updateData.purchase_status = b.purchase_status
    if (b.payment_method !== undefined) updateData.payment_method = b.payment_method
    if (b.installments !== undefined) updateData.installments = b.installments
    if (b.billing_cycle !== undefined) updateData.billing_cycle = b.billing_cycle
    if (b.start_date !== undefined) updateData.start_date = b.start_date
    if (b.end_date !== undefined) updateData.end_date = b.end_date
    if (b.notes !== undefined) updateData.notes = b.notes
    if (b.is_active !== undefined) updateData.is_active = b.is_active

    // Atualizar serviço
    const { data: service, error: updateError } = await supabase
      .from('student_services')
      .update(updateData)
      .eq('id', params.serviceId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar serviço:', updateError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Serviço atualizado com sucesso',
      service 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Verificar se o serviço existe
    const { data: existingService, error: serviceError } = await supabase
      .from('student_services')
      .select('id')
      .eq('id', params.serviceId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.org_id)
      .single()

    if (serviceError || !existingService) {
      return NextResponse.json({ error: "service_not_found" }, { status: 404 })
    }

    // Deletar serviço
    const { error: deleteError } = await supabase
      .from('student_services')
      .delete()
      .eq('id', params.serviceId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.org_id)

    if (deleteError) {
      console.error('Erro ao deletar serviço:', deleteError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Serviço deletado com sucesso'
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}