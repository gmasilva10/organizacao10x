import { NextRequest, NextResponse } from 'next/server'

// Forçar Node runtime para compatibilidade com bibliotecas
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configurações de cache
export const revalidate = 0

// Função para mascarar logs sensíveis
function maskSensitiveData(data: any) {
  const masked = { ...data }
  if (masked.token) masked.token = '***'
  if (masked.instance) masked.instance = '***'
  if (masked.participants) {
    masked.participants = masked.participants.map((p: string) => 
      p.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')
    )
  }
  return masked
}

// Função para log estruturado
function logAction(action: string, data: any, status?: number) {
  const timestamp = new Date().toISOString()
  const maskedData = maskSensitiveData(data)
  
  console.log(`[${timestamp}] WA-${action}:`, {
    status,
    url: maskedData.url,
    method: maskedData.method,
    headers: maskedData.headers ? Object.keys(maskedData.headers) : undefined,
    body: maskedData.body ? JSON.stringify(maskedData.body).substring(0, 300) : undefined,
    response: maskedData.response ? JSON.stringify(maskedData.response).substring(0, 300) : undefined
  })
}

export async function POST(request: NextRequest) {
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-wa-group`
  
  try {
    const body = await request.json()
    const { name, participants, instance, token } = body

    // Validação de parâmetros obrigatórios
    if (!name || !participants || !instance || !token) {
      logAction('CREATE_GROUP_ERROR', { name, participants, instance: !!instance, token: !!token }, 400)
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: name, participants, instance, token' },
        { status: 400 }
      )
    }

    // Normalização E.164 com DDD 11 fallback
    const normalizedParticipants = participants.map((phone: string) => 
      phone.startsWith('+55') ? phone : 
      phone.startsWith('55') ? `+${phone}` :
      phone.startsWith('11') ? `+55${phone}` :
      `+5511${phone.replace(/\D/g, '')}`
    )

    // URL da Z-API com HTTPS garantido
    const zapiUrl = `https://api.z-api.io/instances/${instance}/token/${token}/create-group`
    
    const payload = {
      name,
      participants: normalizedParticipants
    }

    logAction('CREATE_GROUP_START', {
      url: zapiUrl,
      method: 'POST',
      body: payload,
      originalParticipants: participants,
      normalizedParticipants
    })

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Organizacao10x/1.0'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()
    
    logAction('CREATE_GROUP_RESPONSE', {
      status: response.status,
      response: responseData,
      url: zapiUrl
    }, response.status)

    if (!response.ok) {
      // Mapear erros específicos do Z-API
      let errorMessage = 'Falha na criação do grupo'
      if (responseData.message?.includes('already exists') || responseData.message?.includes('já existe')) {
        errorMessage = 'Este grupo já existe no WhatsApp'
      } else if (responseData.message?.includes('invalid participants') || responseData.message?.includes('participantes inválidos')) {
        errorMessage = 'Participantes inválidos para o grupo'
      } else if (responseData.message?.includes('unauthorized') || responseData.message?.includes('não autorizado')) {
        errorMessage = 'Erro de autorização com a API do WhatsApp'
      } else if (responseData.message) {
        errorMessage = `Erro: ${responseData.message}`
      }

      return NextResponse.json(
        { 
          error: errorMessage, 
          details: responseData,
          correlationId 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: responseData,
      correlationId,
      normalizedParticipants
    })

  } catch (error) {
    logAction('CREATE_GROUP_EXCEPTION', { error: error instanceof Error ? error.message : 'Unknown error' }, 500)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        correlationId 
      },
      { status: 500 }
    )
  }
}
