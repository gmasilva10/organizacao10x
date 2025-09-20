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
  if (masked.phone) masked.phone = masked.phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')
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
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-wa-contact`
  
  try {
    const body = await request.json()
    const { phone, firstName, lastName, instance, token } = body

    // Validação de parâmetros obrigatórios
    if (!phone || !instance || !token) {
      logAction('CREATE_CONTACT_ERROR', { phone, instance: !!instance, token: !!token }, 400)
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: phone, instance, token' },
        { status: 400 }
      )
    }

    // Normalização E.164 com DDD 11 fallback
    const normalizedPhone = phone.startsWith('+55') ? phone : 
                           phone.startsWith('55') ? `+${phone}` :
                           phone.startsWith('11') ? `+55${phone}` :
                           `+5511${phone.replace(/\D/g, '')}`

    // URL da Z-API com HTTPS garantido - usando documentação oficial
    const zapiUrl = `https://api.z-api.io/instances/${instance}/token/${token}/contacts/add`
    
    const payload = [{
      firstName: firstName || 'Contato',
      lastName: lastName || 'Sistema',
      phone: normalizedPhone
    }]

    logAction('CREATE_CONTACT_START', {
      url: zapiUrl,
      method: 'POST',
      body: payload,
      originalPhone: phone,
      normalizedPhone
    })

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': token,
        'User-Agent': 'Organizacao10x/1.0'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()
    
    logAction('CREATE_CONTACT_RESPONSE', {
      status: response.status,
      response: responseData,
      url: zapiUrl
    }, response.status)

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Erro ao criar contato no WhatsApp', 
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
      normalizedPhone
    })

  } catch (error) {
    logAction('CREATE_CONTACT_EXCEPTION', { error: error instanceof Error ? error.message : 'Unknown error' }, 500)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        correlationId 
      },
      { status: 500 }
    )
  }
}
