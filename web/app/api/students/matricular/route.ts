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
      plan_id,
      plan_name,
      enrollment_type,
      price_cents,
      billing_cycle,
      start_date,
      end_date,
      observations,
      payment_method
    } = body

    // Validações básicas
    if (!student_id || !start_date) {
      return NextResponse.json(
        { error: 'validation_error', message: 'Campos obrigatórios: student_id, start_date' },
        { status: 400 }
      )
    }

    // Validar enrollment_type
    if (!enrollment_type || !['nova', 'renovacao'].includes(enrollment_type)) {
      return NextResponse.json(
        { error: 'validation_error', message: 'enrollment_type deve ser "nova" ou "renovacao"' },
        { status: 400 }
      )
    }

    // Validar plan_id (obrigatório agora)
    if (!plan_id) {
      return NextResponse.json(
        { error: 'validation_error', message: 'plan_id é obrigatório' },
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

    // Buscar dados do plano do banco
    const planResponse = await fetch(
      `${url}/rest/v1/plans?id=eq.${plan_id}&org_id=eq.${orgId}&select=*`,
      {
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    )

    if (!planResponse.ok) {
      console.error('❌ Erro ao buscar plano:', await planResponse.text())
      return NextResponse.json(
        { error: 'plan_fetch_error', message: 'Erro ao buscar plano' },
        { status: 500 }
      )
    }

    const plans = await planResponse.json()
    if (!plans || plans.length === 0) {
      return NextResponse.json(
        { error: 'plan_not_found', message: 'Plano não encontrado ou não pertence à organização' },
        { status: 404 }
      )
    }

    const plan = plans[0]
    
    // Validar que plano está ativo
    if (plan.ativo === false) {
      return NextResponse.json(
        { error: 'plan_inactive', message: 'Plano está inativo' },
        { status: 400 }
      )
    }

    // Usar dados do plano se não fornecidos no payload
    const finalPlanName = plan_name || plan.nome
    const finalPriceCents = price_cents || Math.round(plan.valor * 100)
    
    // Mapear ciclo do plano para billing_cycle se não fornecido
    let finalBillingCycle = billing_cycle
    if (!finalBillingCycle && plan.ciclo) {
      const cicloMap: Record<string, string> = {
        'mensal': 'monthly',
        'trimestral': 'quarterly',
        'semestral': 'semiannual',
        'anual': 'annual'
      }
      finalBillingCycle = cicloMap[plan.ciclo.toLowerCase()] || 'monthly'
    }
    
    if (!finalBillingCycle) {
      return NextResponse.json(
        { error: 'validation_error', message: 'billing_cycle é obrigatório quando plano não tem ciclo definido' },
        { status: 400 }
      )
    }

    console.log(`📝 [MATRICULAR API] Plano selecionado: ${finalPlanName} (${plan_id})`)
    console.log(`📝 [MATRICULAR API] Tipo de matrícula: ${enrollment_type}`)

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
      name: finalPlanName,
      type: 'plan',
      price_cents: finalPriceCents,
      currency: 'BRL',
      purchase_status: 'paid',
      payment_method: payment_method && ['pix','card','boleto','transfer','other'].includes(payment_method) ? payment_method : 'other',
      installments: null,
      billing_cycle: finalBillingCycle,
      status: 'active',
      start_date,
      end_date,
      next_renewal_date: nextRenewalDateStr,
      renewal_status: finalBillingCycle === 'one_off' ? null : 'ativo',
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
      amount: finalPriceCents / 100, // Converter centavos para reais
      description: `Matrícula - ${finalPlanName}`,
      payment_method: payment_method || 'manual',
      status: 'pago',
      paid_at: new Date().toISOString(),
      metadata: {
        plan_id,
        plan_name: finalPlanName,
        enrollment_type,
        billing_cycle: finalBillingCycle,
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

    // 3. Disparar trigger sale-close apenas para novas matrículas
    let saleCloseTriggerAttempted = false
    let saleCloseTriggerSuccess = false
    let saleCloseTriggerError = null

    if (enrollment_type === 'nova') {
      saleCloseTriggerAttempted = true
      try {
        // Construir URL do trigger - usar URL absoluta baseada no host da requisição
        let baseUrl: string
        if (request.headers.get('host')) {
          const protocol = request.headers.get('x-forwarded-proto') || 'http'
          baseUrl = `${protocol}://${request.headers.get('host')}`
        } else {
          // Fallback para desenvolvimento local
          baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }
        
        const triggerUrl = `${baseUrl}/api/relationship/triggers/sale-close`
        
        console.log('[MATRICULAR API] Disparando trigger de sale_close:', { 
          student_id: student_id, 
          org_id: orgId,
          matriculated_at: new Date().toISOString(),
          triggerUrl 
        })
        
        const triggerResponse = await fetch(triggerUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Passar headers de autenticação se necessário
            ...(ctx?.session && { 'Authorization': `Bearer ${ctx.session}` })
          },
          body: JSON.stringify({
            student_id: student_id,
            org_id: orgId,
            matriculated_at: new Date().toISOString()
          })
        })
        
        if (!triggerResponse.ok) {
          const errorText = await triggerResponse.text()
          saleCloseTriggerError = { 
            status: triggerResponse.status, 
            statusText: triggerResponse.statusText,
            error: errorText 
          }
          console.warn('⚠️ [MATRICULAR API] Trigger sale_close falhou:', saleCloseTriggerError)
        } else {
          const triggerResult = await triggerResponse.json()
          saleCloseTriggerSuccess = true
          console.log('✅ [MATRICULAR API] Trigger sale_close executado:', triggerResult)
          
          // Log detalhado se não criou tarefas
          if (triggerResult.tasks_created === 0) {
            console.warn('⚠️ [MATRICULAR API] Trigger executado mas nenhuma tarefa criada:', triggerResult)
          }
        }
      } catch (e: any) {
        saleCloseTriggerError = { 
          message: e?.message || 'Erro desconhecido',
          stack: e?.stack 
        }
        console.error('❌ [MATRICULAR API] Erro ao executar trigger sale_close:', saleCloseTriggerError)
        // Não falhar a matrícula se o trigger falhar
      }
    } else {
      console.log('📝 [MATRICULAR API] Renovação detectada - trigger sale_close não será executado')
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ [MATRICULAR API] Matrícula concluída em ${queryTime}ms`)

    return NextResponse.json({
      success: true,
      service_id: newService.id,
      message: 'Matrícula realizada com sucesso',
      debug: {
        enrollment_type,
        saleCloseTriggerAttempted,
        saleCloseTriggerSuccess,
        saleCloseTriggerError
      }
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

