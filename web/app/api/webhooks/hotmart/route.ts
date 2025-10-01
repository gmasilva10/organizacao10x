/**
 * GATE 10.9 - Hotmart Webhook Receiver
 * Recebe e processa eventos da Hotmart (compras, reembolsos, cancelamentos)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // 1. VALIDAR AUTENTICAÇÃO (X-Hotmart-Hottok header)
    const hottok = request.headers.get('X-Hotmart-Hottok') || request.headers.get('x-hotmart-hottok')
    
    if (!hottok || !hottok.startsWith('Basic ')) {
      console.warn('[HOTMART WEBHOOK] Missing or invalid Hottok header')
      return NextResponse.json({ 
        error: 'Unauthorized: Missing X-Hotmart-Hottok header' 
      }, { status: 401 })
    }
    
    const credentials = Buffer.from(hottok.split(' ')[1], 'base64').toString()
    const [email, basicToken] = credentials.split(':')
    
    console.log(`[HOTMART WEBHOOK] Received webhook from: ${email}`)
    
    // 2. PARSEAR PAYLOAD
    const payload = await request.json()
    const { event, data, id: eventId } = payload
    
    console.log(`[HOTMART WEBHOOK] Event: ${event}, ID: ${eventId}`)
    
    // 3. IDENTIFICAR ORGANIZAÇÃO (pelo basic_token)
    const { data: integration, error: intError } = await supabase
      .from('hotmart_integrations')
      .select('org_id, status')
      .eq('basic_token', basicToken)
      .single()
    
    if (intError || !integration) {
      console.error('[HOTMART WEBHOOK] Integration not found for basic_token')
      // IMPORTANTE: Retornar 200 mesmo assim para Hotmart não reenviar
      return NextResponse.json({ 
        success: false,
        error: 'Integration not configured' 
      }, { status: 200 })
    }
    
    const orgId = integration.org_id
    
    if (integration.status !== 'connected') {
      console.warn(`[HOTMART WEBHOOK] Integration is ${integration.status}`)
    }
    
    // 4. VERIFICAR IDEMPOTÊNCIA (evitar processar 2x)
    const { data: existing } = await supabase
      .from('hotmart_transactions')
      .select('id, processed')
      .eq('hotmart_transaction_id', data.purchase?.transaction || eventId)
      .single()
    
    if (existing) {
      console.log(`[HOTMART WEBHOOK] Transaction already exists: ${existing.id}`)
      return NextResponse.json({ 
        success: true, 
        message: 'Already processed',
        transaction_id: existing.id
      })
    }
    
    // 5. REGISTRAR TRANSAÇÃO (AUDITORIA)
    const { data: transaction, error: txError } = await supabase
      .from('hotmart_transactions')
      .insert({
        org_id: orgId,
        hotmart_transaction_id: data.purchase?.transaction || eventId,
        hotmart_order_ref: data.purchase?.order_ref,
        hotmart_subscriber_code: data.purchase?.subscription?.subscriber?.code,
        event_type: event,
        event_date: data.purchase?.approved_date 
          ? new Date(data.purchase.approved_date).toISOString()
          : new Date().toISOString(),
        product_id: data.product?.id,
        product_name: data.product?.name,
        product_ucode: data.product?.ucode,
        buyer_name: data.buyer?.name,
        buyer_email: data.buyer?.email,
        buyer_phone: data.buyer?.checkout_phone,
        buyer_document: data.buyer?.document,
        currency: data.purchase?.price?.currency_code || 'BRL',
        gross_value: data.purchase?.price?.value,
        payment_type: data.purchase?.payment?.type,
        installments: data.purchase?.payment?.installments_number,
        subscription_status: data.purchase?.subscription?.status,
        subscription_plan: data.purchase?.subscription?.plan?.name,
        raw_payload: payload,
        processed: false
      })
      .select()
      .single()
    
    if (txError) throw txError
    
    console.log(`[HOTMART WEBHOOK] Transaction registered: ${transaction.id}`)
    
    // 6. PROCESSAR EVENTO
    try {
      if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
        await processPurchaseApproved(supabase, orgId, transaction.id, data)
      } else if (event === 'PURCHASE_REFUNDED') {
        await processPurchaseRefunded(supabase, orgId, transaction.id, data)
      } else if (event === 'SUBSCRIPTION_CANCELLATION') {
        await processSubscriptionCancellation(supabase, orgId, transaction.id, data)
      } else {
        console.log(`[HOTMART WEBHOOK] Event ${event} não processado (apenas registrado)`)
      }
      
      // Marcar como processado
      await supabase
        .from('hotmart_transactions')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', transaction.id)
      
    } catch (processError: any) {
      console.error('[HOTMART WEBHOOK] Processing error:', processError)
      
      // Marcar erro mas NÃO falhar (para Hotmart não reenviar)
      await supabase
        .from('hotmart_transactions')
        .update({ 
          error_message: processError.message,
          retry_count: (transaction.retry_count || 0) + 1
        })
        .eq('id', transaction.id)
    }
    
    // 7. SEMPRE RETORNAR 200 OK (obrigatório para Hotmart)
    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed',
      event_id: eventId,
      transaction_id: transaction.id
    })
    
  } catch (error: any) {
    console.error('[HOTMART WEBHOOK] Fatal error:', error)
    // IMPORTANTE: Retornar 200 mesmo com erro fatal
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 200 })
  }
}

// ============================================================================
// FUNÇÃO: Processar Compra Aprovada
// ============================================================================
async function processPurchaseApproved(
  supabase: any, 
  orgId: string, 
  transactionId: string, 
  data: any
) {
  console.log(`[PURCHASE_APPROVED] Processing for org ${orgId}`)
  
  // 1. BUSCAR MAPEAMENTO DO PRODUTO
  const { data: mapping } = await supabase
    .from('hotmart_product_mappings')
    .select('*, plan:internal_plan_id(*)')
    .eq('org_id', orgId)
    .eq('hotmart_product_id', data.product.id)
    .single()
  
  if (!mapping) {
    console.warn(`[PURCHASE_APPROVED] Produto ${data.product.id} não mapeado`)
    throw new Error(`Produto Hotmart ID ${data.product.id} não está mapeado. Configure em Integrações > Hotmart > Mapeamentos.`)
  }
  
  console.log(`[PURCHASE_APPROVED] Found mapping: Product ${data.product.id} → Plan ${mapping.internal_plan_id}`)
  
  // 2. BUSCAR OU CRIAR ALUNO
  const buyerEmail = data.buyer.email
  const buyerCpf = data.buyer.document
  
  // Verificar se já existe (por email OU CPF)
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id, status, name, email, phone')
    .or(`tenant_id.eq.${orgId},org_id.eq.${orgId}`)
    .or(`email.eq.${buyerEmail},cpf.eq.${buyerCpf}`)
    .single()
  
  let studentId: string
  
  if (existingStudent) {
    // ALUNO JÁ EXISTE - Atualizar dados
    console.log(`[PURCHASE_APPROVED] Student exists: ${existingStudent.id}`)
    studentId = existingStudent.id
    
    await supabase
      .from('students')
      .update({
        name: data.buyer.name,
        phone: data.buyer.checkout_phone,
        status: mapping.auto_activate ? 'active' : existingStudent.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
    
  } else {
    // CRIAR NOVO ALUNO
    if (!mapping.auto_create_student) {
      console.warn('[PURCHASE_APPROVED] auto_create_student is FALSE, skipping student creation')
      return
    }
    
    console.log('[PURCHASE_APPROVED] Creating new student')
    
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        org_id: orgId,
        name: data.buyer.name,
        email: buyerEmail,
        phone: data.buyer.checkout_phone,
        cpf: buyerCpf,
        status: mapping.auto_activate ? 'active' : 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (studentError) throw studentError
    studentId = newStudent.id
    
    console.log(`[PURCHASE_APPROVED] Student created: ${studentId}`)
  }
  
  // 3. VINCULAR ALUNO À TRANSAÇÃO
  await supabase
    .from('hotmart_transactions')
    .update({ student_id: studentId })
    .eq('id', transactionId)
  
  // 4. CRIAR VÍNCULO ALUNO-PLANO (student_services)
  console.log(`[PURCHASE_APPROVED] Creating student_service link: Student ${studentId} → Plan ${mapping.internal_plan_id}`)
  
  // Criar vínculo na tabela student_services
  await supabase
    .from('student_services')
    .insert({
      tenant_id: orgId,
      student_id: studentId,
      name: mapping.plan.nome,
      type: 'plan',
      status: 'active',
      price_cents: Math.round((data.purchase.price.value || 0) * 100),
      currency: data.purchase.price.currency_code || 'BRL',
      purchase_status: 'paid',
      payment_method: data.purchase.payment.type?.toLowerCase(),
      installments: data.purchase.payment.installments_number,
      billing_cycle: mapping.plan.ciclo || 'one_off',
      start_date: new Date(data.purchase.approved_date).toISOString().split('T')[0],
      is_active: mapping.auto_activate
    })
  
  // 5. DISPARAR ONBOARDING (se configurado)
  if (mapping.trigger_onboarding) {
    console.log(`[PURCHASE_APPROVED] Would trigger onboarding for ${studentId}`)
    // TODO: Criar cards no Kanban de onboarding
  }
  
  // 6. ENVIAR NOTIFICAÇÕES
  if (mapping.send_welcome_email) {
    console.log(`[PURCHASE_APPROVED] Would send welcome email to ${buyerEmail}`)
    // TODO: Enviar email de boas-vindas
  }
  
  if (mapping.send_welcome_whatsapp) {
    console.log(`[PURCHASE_APPROVED] Would send WhatsApp to ${data.buyer.checkout_phone}`)
    // TODO: Enviar WhatsApp de boas-vindas
  }
  
  console.log(`[PURCHASE_APPROVED] Processing completed successfully`)
}

// ============================================================================
// FUNÇÃO: Processar Reembolso
// ============================================================================
async function processPurchaseRefunded(
  supabase: any, 
  orgId: string, 
  transactionId: string, 
  data: any
) {
  console.log(`[PURCHASE_REFUNDED] Processing for org ${orgId}`)
  
  // Buscar aluno pelo email ou CPF
  const { data: student } = await supabase
    .from('students')
    .select('id, status')
    .or(`tenant_id.eq.${orgId},org_id.eq.${orgId}`)
    .eq('email', data.buyer.email)
    .single()
  
  if (student) {
    // Desativar aluno (ou marcar plano como cancelado)
    await supabase
      .from('students')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString() 
      })
      .eq('id', student.id)
    
    console.log(`[PURCHASE_REFUNDED] Student ${student.id} marked as inactive`)
    
    // Atualizar transação
    await supabase
      .from('hotmart_transactions')
      .update({ student_id: student.id })
      .eq('id', transactionId)
  }
  
  // TODO: Notificar admin sobre o reembolso
  console.log('[PURCHASE_REFUNDED] Would notify admin')
}

// ============================================================================
// FUNÇÃO: Processar Cancelamento de Assinatura
// ============================================================================
async function processSubscriptionCancellation(
  supabase: any, 
  orgId: string, 
  transactionId: string, 
  data: any
) {
  console.log(`[SUBSCRIPTION_CANCELLATION] Processing for org ${orgId}`)
  
  // Buscar aluno
  const { data: student } = await supabase
    .from('students')
    .select('id, name, email')
    .or(`tenant_id.eq.${orgId},org_id.eq.${orgId}`)
    .eq('email', data.buyer.email)
    .single()
  
  if (student) {
    // TODO: Cancelar plano/assinatura
    console.log(`[SUBSCRIPTION_CANCELLATION] Would cancel subscription for ${student.id}`)
    
    // TODO: Disparar flow de retenção
    console.log('[SUBSCRIPTION_CANCELLATION] Would trigger retention flow')
    
    // Atualizar transação
    await supabase
      .from('hotmart_transactions')
      .update({ student_id: student.id })
      .eq('id', transactionId)
  }
}
