import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Dados fixos para teste
    const instance = '3E7608F78BA2405A08E5EE5C772D9ACD'
    const token = '8F670F193615706A0616496E'
    const clientToken = 'F31db8854d41742a7a08625204dc7a618S'
    
    const zapiUrl = `https://api.z-api.io/instances/${instance}/token/${token}/contacts/add`
    
    const payload = [{
      firstName: 'Teste',
      lastName: 'Sistema',
      phone: '+5584996499247'
    }]

    console.log('=== TESTE DIRETO Z-API ===')
    console.log('URL:', zapiUrl)
    console.log('Instance:', instance)
    console.log('Token:', token)
    console.log('Client Token:', clientToken)
    console.log('Payload:', JSON.stringify(payload, null, 2))

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

    console.log('=== RESPOSTA Z-API ===')
    console.log('Status:', response.status)
    console.log('OK:', response.ok)
    console.log('Response Data:', JSON.stringify(responseData, null, 2))

    return NextResponse.json({
      success: true,
      test: {
        url: zapiUrl,
        instance,
        token,
        clientToken: clientToken.substring(0, 8) + '...',
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
