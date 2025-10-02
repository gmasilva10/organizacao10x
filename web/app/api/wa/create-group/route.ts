import { NextRequest, NextResponse } from 'next/server'

// Forçar Node runtime para compatibilidade com bibliotecas
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configurações de cache
export const revalidate = 0


type MaskableData = Record<string, unknown> & {
  token?: string
  instance?: string
  participants?: unknown
  originalParticipants?: unknown
  normalizedParticipants?: unknown
  response?: unknown
  headers?: Record<string, unknown>
  body?: unknown
}

type CreateGroupRequest = {
  name?: string
  participants?: string[]
}


// Função para mascarar logs sensíveis
function maskSensitiveData(data: MaskableData): MaskableData {
  const masked: MaskableData = { ...data }

  if (typeof masked.token === 'string') masked.token = '***'
  if (typeof masked.instance === 'string') masked.instance = '***'

  if (Array.isArray(masked.participants)) {
    masked.participants = masked.participants.map((participant) =>
      typeof participant === 'string'
        ? participant.replace(/(\d{2})(\d{4})(\d{4})/, '****')
        : participant
    )
  }

  if (Array.isArray(masked.originalParticipants)) {
    masked.originalParticipants = masked.originalParticipants.map((participant) =>
      typeof participant === 'string'
        ? participant.replace(/(\d{2})(\d{4})(\d{4})/, '****')
        : participant
    )
  }

  if (Array.isArray(masked.normalizedParticipants)) {
    masked.normalizedParticipants = masked.normalizedParticipants.map((participant) =>
      typeof participant === 'string'
        ? participant.replace(/(\d{2})(\d{4})(\d{4})/, '****')
        : participant
    )
  }

  return masked
}

// Função para log estruturado
function logAction(action: string, data: MaskableData, status?: number) {
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
    const body = (await request.json()) as CreateGroupRequest
    const { name, participants } = body
    const participantList = Array.isArray(participants) ? participants : undefined

    // Debug detalhado do payload recebido
    console.log('=== PAYLOAD RECEBIDO ===')
    console.log('Body completo:', JSON.stringify(body, null, 2))
    console.log('Name extraído:', name)
    console.log('Name type:', typeof name)
    console.log('Name length:', name ? name.length : 'undefined')
    console.log('Name trim:', name ? name.trim() : 'undefined')
    console.log('Participants:', participantList)

    // Dados da Z-API via variáveis de ambiente
    const instance = process.env.ZAPI_INSTANCE_ID
    const token = process.env.ZAPI_TOKEN
    const clientToken = process.env.ZAPI_CLIENT_TOKEN

    if (!instance || !token || !clientToken) {
      console.error('❌ Z-API credentials não configuradas')
      return NextResponse.json(
        { error: 'Configuração da API WhatsApp não disponível' },
        { status: 503 }
      )
    }

    // Validação de parâmetros obrigatórios
    if (!name || !participantList?.length) {
      console.log('❌ VALIDAÇÃO FALHOU:', { name, participants: participantList })
      logAction('CREATE_GROUP_ERROR', { name, participants: participantList }, 400)
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: name, participants' },
        { status: 400 }
      )
    }

    // Normalização E.164 com DDD 11 fallback
    const normalizedParticipants = (participantList ?? []).map((phone) => 
      phone.startsWith('+55') ? phone : 
      phone.startsWith('55') ? `+${phone}` :
      phone.startsWith('11') ? `+55${phone}` :
      `+5511${phone.replace(/\D/g, '')}`
    )

    // URL da Z-API com HTTPS garantido - usando documentação oficial
    const zapiUrl = `https://api.z-api.io/instances/${instance}/token/${token}/create-group`
    
    const payload = {
      groupName: name,
      phones: normalizedParticipants,
      autoInvite: true
    }

    // Debug seguro (não expor secrets)
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== DEBUG Z-API GROUP ===')
      console.log('URL:', zapiUrl)
      console.log('Group Name:', name)
      console.log('Original Participants:', participantList)
      console.log('Normalized Participants:', normalizedParticipants)
      console.log('Payload:', JSON.stringify(payload, null, 2))
    }

    logAction('CREATE_GROUP_START', {
      url: zapiUrl,
      method: 'POST',
      body: payload,
      originalParticipants: participantList ?? [],
      normalizedParticipants
    })

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-token': clientToken,
        'User-Agent': 'Organizacao10x/1.0'
      },
      body: JSON.stringify(payload)
    })

    const responseData = (await response.json()) as Record<string, unknown>
    
    // Debug detalhado da resposta
    console.log('=== RESPOSTA Z-API GROUP ===')
    console.log('Status:', response.status)
    console.log('OK:', response.ok)
    console.log('Status Text:', response.statusText)
    console.log('Response Data:', JSON.stringify(responseData, null, 2))
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    logAction('CREATE_GROUP_RESPONSE', {
      status: response.status,
      response: responseData,
      url: zapiUrl
    }, response.status)

    if (!response.ok) {
      const message = String(((responseData as any)?.message) || response.statusText || '')
      // Mapear erros específicos do Z-API
      let errorMessage = 'Falha na criação do grupo'
      if (message?.includes('already exists') || message?.includes('já existe')) {
        errorMessage = 'Este grupo já existe no WhatsApp'
      } else if (message?.includes('invalid participants') || message?.includes('participantes inválidos')) {
        errorMessage = 'Participantes inválidos para o grupo'
      } else if (message?.includes('unauthorized') || message?.includes('não autorizado')) {
        errorMessage = 'Erro de autorização com a API do WhatsApp'
      } else if (message) {
        errorMessage = `Erro: ${message}`
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






