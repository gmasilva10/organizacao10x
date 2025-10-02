import { NextRequest, NextResponse } from 'next/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, participants, instance, token } = body

    console.log('👥 [WHATSAPP GROUP] Dados recebidos:', { name, participants, instance: instance ? '***' : 'undefined', token: token ? '***' : 'undefined' })

    if (!name || !participants || !instance || !token) {
      console.error('❌ [WHATSAPP GROUP] Parâmetros faltando:', { name: !!name, participants: !!participants, instance: !!instance, token: !!token })
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: name, participants, instance, token' },
        { status: 400 }
      )
    }

    // Chamada para Z-API via backend (sem CORS)
    // Usando o endpoint correto da Z-API
    const zapiUrl = `https://api.z-api.io/instance/${instance}/token/${token}/create-group`
    console.log('🔄 [WHATSAPP GROUP] Chamando Z-API:', {
      url: zapiUrl,
      name: name,
      participants: participants
    })
    
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        participants: participants
      })
    })
    
    console.log('🔄 [WHATSAPP GROUP] Resposta Z-API:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Z-API:', errorText)
      return NextResponse.json(
        { error: 'Erro ao criar grupo no WhatsApp', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('Resposta Z-API grupo:', result)
    
    // Verificar se realmente foi criado
    if (result.error || result.message?.includes('error')) {
      console.error('❌ [WHATSAPP GROUP] Z-API retornou erro:', result)
      
      // Mapear erros específicos do Z-API
      let errorMessage = 'Falha na criação do grupo'
      if (result.message?.includes('already exists') || result.message?.includes('já existe')) {
        errorMessage = 'Este grupo já existe no WhatsApp'
      } else if (result.message?.includes('invalid participants') || result.message?.includes('participantes inválidos')) {
        errorMessage = 'Participantes inválidos para o grupo'
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
    console.error('Erro na API de grupo WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

