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
    // Z-API usa /send-contact para enviar contatos, não criar
    const zapiUrl = `https://api.z-api.io/instance/${instance}/token/${token}/send-contact`
    console.log('🔄 [WHATSAPP CONTACT] Chamando Z-API:', {
      url: zapiUrl,
      phone: phone,
      name: name
    })
    
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone, // Número do destinatário (quem vai receber o contato)
        contactName: name, // Nome do contato a ser compartilhado
        contactPhone: phone // Número do contato a ser compartilhado
      })
    })
    
    console.log('🔄 [WHATSAPP CONTACT] Resposta Z-API:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
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
      console.error('❌ [WHATSAPP CONTACT] Z-API retornou erro:', result)
      
      // Mapear erros específicos do Z-API
      let errorMessage = 'Falha na criação do contato'
      if (result.message?.includes('already exists') || result.message?.includes('já existe')) {
        errorMessage = 'Este contato já existe no WhatsApp'
      } else if (result.message?.includes('invalid phone') || result.message?.includes('telefone inválido')) {
        errorMessage = 'Número de telefone inválido'
      } else if (result.message?.includes('unauthorized') || result.message?.includes('não autorizado')) {
        errorMessage = 'Erro de autorização com a API do WhatsApp'
      } else if (result.message) {
        errorMessage = `Erro: ${result.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage, details: result },
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
