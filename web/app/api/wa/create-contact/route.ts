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
    const { phone, firstName, lastName } = body

    // Dados fixos para garantir funcionamento
    const instance = '3E7608F78BA2405A08E5EE5C772D9ACD'
    const token = '8F670F193615706A0616496E'
    const clientToken = 'F31db8854d41742a7a08625204dc7a618S'

    // Validação de parâmetros obrigatórios
    if (!phone) {
      logAction('CREATE_CONTACT_ERROR', { phone }, 400)
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: phone' },
        { status: 400 }
      )
    }

    // Normalização E.164 - usar exatamente como no teste que funcionou
    let normalizedPhone = phone
    
    // Se não começar com +55, adicionar
    if (!normalizedPhone.startsWith('+55')) {
      if (normalizedPhone.startsWith('55')) {
        normalizedPhone = `+${normalizedPhone}`
      } else {
        // Remover todos os caracteres não numéricos e adicionar +55
        const cleanPhone = normalizedPhone.replace(/\D/g, '')
        normalizedPhone = `+55${cleanPhone}`
      }
    }

    // URL da Z-API com HTTPS garantido - usando documentação oficial
    const zapiUrl = `https://api.z-api.io/instances/${instance}/token/${token}/contacts/add`

    const payload = [{
      firstName: firstName || 'Contato',
      lastName: lastName || 'Sistema',
      phone: normalizedPhone
    }]

    // Debug detalhado
    console.log('=== DEBUG Z-API ===')
    console.log('URL:', zapiUrl)
    console.log('Instance:', instance)
    console.log('Token:', token)
    console.log('Client Token:', clientToken)
    console.log('Original Phone:', phone)
    console.log('Normalized Phone:', normalizedPhone)
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'client-token': clientToken,
      'User-Agent': 'Organizacao10x/1.0'
    })

    logAction('CREATE_CONTACT_START', {
      url: zapiUrl,
      method: 'POST',
      body: payload,
      originalPhone: phone,
      normalizedPhone,
      clientToken: clientToken.substring(0, 8) + '...' // Mascarado para logs
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

    const responseData = await response.json()
    
    // Debug detalhado da resposta
    console.log('=== RESPOSTA Z-API ===')
    console.log('Status:', response.status)
    console.log('OK:', response.ok)
    console.log('Status Text:', response.statusText)
    console.log('Response Data:', JSON.stringify(responseData, null, 2))
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
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
