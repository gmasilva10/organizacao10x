import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

const WRITERS = new Set(['admin', 'manager'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
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
    unit_price?: number
    currency?: string
    cycle?: string
    duration_cycles?: number
    start_date?: string
    end_date?: string
    status?: string
    notes?: string
  }>

  // Validações condicionais
  if (b.unit_price !== undefined && (!Number.isFinite(b.unit_price) || b.unit_price <= 0)) {
    return NextResponse.json({ error: "invalid_unit_price" }, { status: 400 })
  }

  if (b.currency !== undefined && !new Set(["BRL", "USD", "EUR"]).has(b.currency)) {
    return NextResponse.json({ error: "invalid_currency" }, { status: 400 })
  }

  if (b.cycle !== undefined && b.cycle !== null && !new Set(["mensal", "trimestral", "semestral", "anual"]).has(b.cycle)) {
    return NextResponse.json({ error: "invalid_cycle" }, { status: 400 })
  }

  if (b.duration_cycles !== undefined && b.duration_cycles !== null && (!Number.isFinite(b.duration_cycles) || b.duration_cycles <= 0)) {
    return NextResponse.json({ error: "invalid_duration" }, { status: 400 })
  }

  if (b.status !== undefined && !new Set(["ativo", "encerrado", "cancelado"]).has(b.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 })
  }

  if (b.start_date !== undefined && !Date.parse(b.start_date)) {
    return NextResponse.json({ error: "invalid_start_date" }, { status: 400 })
  }

  if (b.end_date !== undefined && b.end_date !== null && !Date.parse(b.end_date)) {
    return NextResponse.json({ error: "invalid_end_date" }, { status: 400 })
  }

  const supabase = createClient(url, key)

  try {
    // Verificar se o contrato existe e pertence ao aluno/tenant
    const { data: contract, error: checkError } = await supabase
      .from('student_plan_contracts')
      .select('*')
      .eq('id', params.contractId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.tenantId)
      .single()

    if (checkError || !contract) {
      return NextResponse.json({ error: "contract_not_found" }, { status: 404 })
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (b.unit_price !== undefined) updateData.unit_price = b.unit_price
    if (b.currency !== undefined) updateData.currency = b.currency
    if (b.cycle !== undefined) updateData.cycle = b.cycle
    if (b.duration_cycles !== undefined) updateData.duration_cycles = b.duration_cycles
    if (b.start_date !== undefined) updateData.start_date = b.start_date
    if (b.end_date !== undefined) updateData.end_date = b.end_date
    if (b.status !== undefined) updateData.status = b.status
    if (b.notes !== undefined) updateData.notes = b.notes

    // Atualizar contrato
    const { data: updatedContract, error } = await supabase
      .from('student_plan_contracts')
      .update(updateData)
      .eq('id', params.contractId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.tenantId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar contrato:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contrato atualizado com sucesso',
      contract: updatedContract 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  if (!WRITERS.has(ctx.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

  const supabase = createClient(url, key)

  try {
    // Verificar se o contrato existe e pertence ao aluno/tenant
    const { data: contract, error: checkError } = await supabase
      .from('student_plan_contracts')
      .select('*')
      .eq('id', params.contractId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.tenantId)
      .single()

    if (checkError || !contract) {
      return NextResponse.json({ error: "contract_not_found" }, { status: 404 })
    }

    // Verificar se há cobranças pendentes
    const { data: pendingBilling, error: billingError } = await supabase
      .from('student_billing')
      .select('id')
      .eq('contract_id', params.contractId)
      .eq('status', 'pendente')
      .limit(1)

    if (billingError) {
      console.error('Erro ao verificar cobranças:', billingError)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    if (pendingBilling && pendingBilling.length > 0) {
      return NextResponse.json({ 
        error: "cannot_delete_contract_with_pending_billing" 
      }, { status: 409 })
    }

    // Deletar contrato (cobranças serão deletadas por CASCADE)
    const { error } = await supabase
      .from('student_plan_contracts')
      .delete()
      .eq('id', params.contractId)
      .eq('student_id', params.id)
      .eq('org_id', ctx.tenantId)

    if (error) {
      console.error('Erro ao deletar contrato:', error)
      return NextResponse.json({ error: "database_error" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Contrato deletado com sucesso' 
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
