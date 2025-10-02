import { NextRequest, NextResponse } from 'next/server'

// Forcar execucao dinamica para evitar problemas de renderizacao estatica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  console.log('🔍 [WHATSAPP CONTACT] GET endpoint chamado!')
  
  // Testar POST via GET para debug
  const { searchParams } = new URL(request.url)
  const testPost = searchParams.get('test_post')
  
  if (testPost === 'true') {
    console.log('🧪 [WHATSAPP CONTACT] Testando POST via GET...')
    
    // Simular teste dos endpoints
    const endpoints = [
      `/send-contact`,
      `/send-message`,
      `/send-template`,
      `/get-status`,
      `/get-history`
    ]
    
    const results = []
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test: true,
            phone: '5511999999999',
            message: 'Teste de contato via GET'
          })
        })
        
        const data = await response.json()
        results.push({
          endpoint,
          status: response.status,
          success: response.ok,
          data: data
        })
      } catch (error) {
        results.push({
          endpoint,
          status: 500,
          success: false,
          error: (error as any)?.message || 'Erro desconhecido'
        })
      }
    }
    
    return NextResponse.json({
      message: 'Teste de endpoints WhatsApp via GET',
      results,
      timestamp: new Date().toISOString()
    })
  }
  
  return NextResponse.json({
    message: 'WhatsApp Contact API - GET endpoint',
    endpoints: [
      'POST /api/whatsapp/send-contact',
      'POST /api/whatsapp/send-message', 
      'POST /api/whatsapp/send-template',
      'GET /api/whatsapp/get-status',
      'GET /api/whatsapp/get-history'
    ],
    test_url: `${request.url}?test_post=true`,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('📱 [WHATSAPP CONTACT] POST endpoint chamado!')
  
  try {
    const body = await request.json()
    console.log('📋 [WHATSAPP CONTACT] Body recebido:', JSON.stringify(body, null, 2))
    
    const { 
      phone, 
      message, 
      template_name, 
      template_params = [],
      contact_name,
      contact_email,
      contact_notes,
      test = false
    } = body
    
    if (!phone) {
      return NextResponse.json({
        error: 'Phone number is required',
        code: 'MISSING_PHONE'
      }, { status: 400 })
    }
    
    if (test) {
      console.log('🧪 [WHATSAPP CONTACT] Modo teste ativado')
      return NextResponse.json({
        success: true,
        message: 'Teste de contato WhatsApp realizado com sucesso',
        data: {
          phone,
          message: message || 'Mensagem de teste',
          template_name: template_name || null,
          template_params,
          contact_name: contact_name || null,
          contact_email: contact_email || null,
          contact_notes: contact_notes || null,
          timestamp: new Date().toISOString()
        },
        test_mode: true
      })
    }
    
    // Aqui seria a integracao real com a API do WhatsApp
    // Por enquanto, simular sucesso
    console.log('✅ [WHATSAPP CONTACT] Simulando envio de contato...')
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json({
      success: true,
      message: 'Contato WhatsApp enviado com sucesso',
      data: {
        phone,
        message: message || 'Mensagem enviada',
        template_name: template_name || null,
        template_params,
        contact_name: contact_name || null,
        contact_email: contact_email || null,
        contact_notes: contact_notes || null,
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ [WHATSAPP CONTACT] Erro no POST:', error)
    
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      details: (error as any)?.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}