import { NextRequest, NextResponse } from 'next/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, instance, token } = body

    console.log('📱 [WHATSAPP CONTACT] Dados recebidos:', { phone, name, instance: instance ? '***' : 'undefined', token: token ? '***' : 'undefined' })

    if (!phone || !name || !instance || !token) {
      console.error('❌ [WHATSAPP CONTACT] Parâmetros faltando:', { phone: !!phone, name: !!name, instance: !!instance, token: !!token })
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: phone, name, instance, token' },
        { status: 400 }
      )
    }

    // Chamada para Z-API via backend (sem CORS)
    const response = await fetch(`https://api.z-api.io/instance/${instance}/token/${token}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        name: name
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Z-API:', errorText)
      return NextResponse.json(
        { error: 'Erro ao criar contato no WhatsApp', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Resposta Z-API contato:', result)
    
    // Verificar se realmente foi criado
    if (result.error || result.message?.includes('error')) {
      return NextResponse.json(
        { error: 'Falha na criação do contato', details: result },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Erro na API de contato WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
