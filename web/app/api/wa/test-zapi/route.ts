import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  // Guard: somente disponível em dev ou quando explicitamente habilitado
  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.ENABLE_DEBUG_ROUTES !== '1'
  ) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }
  try {
    // Lê configurações do ambiente (não hardcode tokens)
    const instance = process.env.ZAPI_INSTANCE_ID
    const token = process.env.ZAPI_INSTANCE_TOKEN
    const clientToken = process.env.ZAPI_CLIENT_TOKEN

    if (!instance || !token || !clientToken) {
      return NextResponse.json({
        error: 'missing_env',
        message: 'Z-API env vars missing (ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN, ZAPI_CLIENT_TOKEN)'
      }, { status: 500 })
    }
    
    const base = process.env.ZAPI_BASE_URL || 'https://api.z-api.io'
    const zapiUrl = `${base}/instances/${instance}/token/${token}/contacts/add`
    
    const payload = [{
      firstName: 'Teste',
      lastName: 'Sistema',
      phone: '+5584996499247'
    }]

    if (process.env.DEBUG_LOGS === '1') {
      console.log('=== TESTE DIRETO Z-API ===')
      console.log('URL:', zapiUrl)
      console.log('Instance:', instance)
      console.log('Token length:', token.length)
      console.log('Client Token prefix:', clientToken.substring(0, 6) + '…')
      console.log('Payload:', JSON.stringify(payload, null, 2))
    }

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
        'User-Agent': 'Organizacao10x/1.0'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()

    if (process.env.DEBUG_LOGS === '1') {
      console.log('=== RESPOSTA Z-API ===')
      console.log('Status:', response.status)
      console.log('OK:', response.ok)
      console.log('Response Data:', JSON.stringify(responseData, null, 2))
    }

    return NextResponse.json({
      success: true,
      test: {
        url: zapiUrl,
        instance,
        token: token.substring(0, 4) + '…',
        clientToken: clientToken.substring(0, 8) + '…',
        payload
      },
      response: {
        status: response.status,
        ok: response.ok,
        data: responseData
      }
    })

  } catch (error) {
    console.error('Erro no teste Z-API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

