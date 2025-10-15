import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

// API para matricular aluno (criar student_service + financial_transaction)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📝 [MATRICULAR API] Iniciando matrícula')

    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Configuração do Supabase ausente" },
        { status: 503 }
      )
    }

    // Parse body
    const body = await request.json()
    const {
      student_id,
      plan_name,
      price_cents,
      billing_cycle,
      start_date,
      end_date,
      observations,
      payment_method
    } = body

    // Validações
    if (!student_id || !plan_name || !price_cents || !billing_cycle || !start_date) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Campos obrigatórios: student_id, plan_name, price_cents, billing_cycle, start_date' },
        { status: 400 }
      )
    }

    // Buscar org_id do aluno
    const filters: string[] = [`id=eq.${student_id}`]
    if (ctx?.org_id) filters.push(`org_id=eq.${ctx.org_id}`)

    const studentResponse = await fetch(
      `${url}/rest/v1/students?${filters.join('&')}&select=org_id`,
      {
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    )

    if (!studentResponse.ok) {
      console.error('❌ Erro ao buscar aluno:', await studentResponse.text())
      return NextResponse.json(
        { error: 'student_not_found', message: 'Aluno não encontrado' },
        { status: 404 }
      )
    }

    const students = await studentResponse.json()
    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'student_not_found', message: 'Aluno não encontrado' },
        { status: 404 }
      )
    }

    const orgId = students[0].org_id
    if (!orgId) {
      return NextResponse.json(
        { error: 'student_org_missing', message: 'Aluno sem organização' },
        { status: 400 }
      )
    }
    console.log(`📝 [MATRICULAR API] Org ID: ${orgId}`)

    // Calcular next_renewal_date baseado no billing_cycle
    const startDateObj = new Date(start_date)
    let nextRenewalDate: Date | null = null
    
    switch (billing_cycle) {
      case 'monthly':
        nextRenewalDate = new Date(startDateObj.setMonth(startDateObj.getMonth() + 1))
        break
      case 'quarterly':
        nextRenewalDate = new Date(startDateObj.setMonth(startDateObj.getMonth() + 3))
        break
      case 'semiannual':
        nextRenewalDate = new Date(startDateObj.setMonth(startDateObj.getMonth() + 6))
        break
      case 'annual':
        nextRenewalDate = new Date(startDateObj.setFullYear(startDateObj.getFullYear() + 1))
        break
      case 'one_off':
        nextRenewalDate = null
        break
    }

    const nextRenewalDateStr = nextRenewalDate ? nextRenewalDate.toISOString().split('T')[0] : null
    console.log(`📝 [MATRICULAR API] Next renewal date: ${nextRenewalDateStr}`)

    // 1. Criar student_service (contrato)
    const servicePayload = {
      student_id,
      org_id: orgId,
      name: plan_name,
      type: 'plan',
      price_cents,
      currency: 'BRL',
      purchase_status: 'paid',
      payment_method: payment_method && ['pix','card','boleto','transfer','other'].includes(payment_method) ? payment_method : 'other',
      installments: null,
      billing_cycle,
      status: 'active',
      start_date,
      end_date,
      next_renewal_date: nextRenewalDateStr,
      renewal_status: billing_cycle === 'one_off' ? null : 'ativo',
      renewal_alert_days: 30,
      auto_renewal: false,
      is_active: true
    }

    console.log('📝 [MATRICULAR API] Creating student_service:', servicePayload)

    const serviceResponse = await fetch(
      `${url}/rest/v1/student_services`,
      {
        method: 'POST',
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(servicePayload)
      }
    )

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text()
      console.error('❌ Erro ao criar student_service:', serviceResponse.status, errorText)
      return NextResponse.json(
        { error: 'service_creation_failed', message: 'Erro ao criar contrato', details: errorText, status: serviceResponse.status },
        { status: 500 }
      )
    }

    const newService = (await serviceResponse.json())[0]
    console.log('✅ [MATRICULAR API] Student service created:', newService.id)

    // 2. Criar financial_transaction (receita)
    const transactionPayload = {
      org_id: orgId,
      student_id,
      service_id: newService.id,
      type: 'receita',
      category: 'plano',
      amount: price_cents / 100, // Converter centavos para reais
      description: `Matrícula - ${plan_name}`,
      payment_method: payment_method || 'manual',
      status: 'pago',
      paid_at: new Date().toISOString(),
      metadata: {
        plan_name,
        billing_cycle,
        start_date,
        end_date,
        observations,
        source: 'matricula_manual'
      }
    }

    console.log('📝 [MATRICULAR API] Creating financial_transaction:', transactionPayload)

    const transactionResponse = await fetch(
      `${url}/rest/v1/financial_transactions`,
      {
        method: 'POST',
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(transactionPayload)
      }
    )

    if (!transactionResponse.ok) {
      const errorText = await transactionResponse.text()
      console.error('❌ Erro ao criar financial_transaction:', errorText)
      // Não retornar erro aqui, pois o contrato já foi criado
      // Apenas logar o erro
    } else {
      const newTransaction = (await transactionResponse.json())[0]
      console.log('✅ [MATRICULAR API] Financial transaction created:', newTransaction.id)
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [MATRICULAR API] Matrícula concluída em ${queryTime}ms`)

    return NextResponse.json({
      success: true,
      service_id: newService.id,
      message: 'Matrícula realizada com sucesso'
    }, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ [MATRICULAR API] Erro:', error)
    
    return NextResponse.json(
      { error: 'internal_error', message: 'Erro ao processar matrícula' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}

