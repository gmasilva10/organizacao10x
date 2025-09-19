import { NextRequest, NextResponse } from 'next/server'

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  console.log('🚀 [WHATSAPP CONTACT] GET endpoint chamado!')
  return NextResponse.json({ message: 'WhatsApp Contact API funcionando!' })
}

export async function POST(request: NextRequest) {
  console.log('🚀 [WHATSAPP CONTACT] POST endpoint chamado!')
  try {
    const body = await request.json()
    const { phone, name, instance, token } = body

    console.log('📱 [WHATSAPP CONTACT] Dados recebidos:', { phone, name, instance: instance ? '***' : 'undefined', token: token ? '***' : 'undefined' })
    console.log('📱 [WHATSAPP CONTACT] Ambiente:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })

    if (!phone || !name || !instance || !token) {
      console.error('❌ [WHATSAPP CONTACT] Parâmetros faltando:', { phone: !!phone, name: !!name, instance: !!instance, token: !!token })
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: phone, name, instance, token' },
        { status: 400 }
      )
    }

    // TESTE: Tentar múltiplos endpoints da Z-API
    const endpoints = [
      `/send-contact`,
      `/contact`, 
      `/add-contact`,
      `/create-contact`,
      `/save-contact`
    ]
    
    let lastError = null
    let successfulResponse = null
    const testLogs = []
    
    for (const endpoint of endpoints) {
      const zapiUrl = `https://api.z-api.io/instance/${instance}/token/${token}${endpoint}`
      const logEntry = {
        endpoint,
        url: zapiUrl,
        timestamp: new Date().toISOString()
      }
      
      console.log(`🔄 [WHATSAPP CONTACT] Testando endpoint: ${endpoint}`)
      console.log('🔄 [WHATSAPP CONTACT] URL:', zapiUrl)
      
      try {
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone,
            name: name
          })
        })
        
        const responseData = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        }
        
        console.log(`🔄 [WHATSAPP CONTACT] Resposta ${endpoint}:`, responseData)
        
        if (response.ok) {
          const result = await response.json()
          console.log(`✅ [WHATSAPP CONTACT] Sucesso com ${endpoint}:`, result)
          successfulResponse = { endpoint, result, response }
          testLogs.push({ ...logEntry, success: true, result })
          break
        } else {
          const errorText = await response.text()
          console.log(`❌ [WHATSAPP CONTACT] Erro com ${endpoint}:`, errorText)
          lastError = { endpoint, error: errorText, status: response.status }
          testLogs.push({ ...logEntry, success: false, error: errorText, status: response.status })
        }
      } catch (error) {
        console.log(`❌ [WHATSAPP CONTACT] Exceção com ${endpoint}:`, error)
        lastError = { endpoint, error: error.message }
        testLogs.push({ ...logEntry, success: false, error: error.message })
      }
    }
    
    if (!successfulResponse) {
      console.error('❌ [WHATSAPP CONTACT] Todos os endpoints falharam. Último erro:', lastError)
      return NextResponse.json(
        { 
          error: 'Todos os endpoints da Z-API falharam', 
          details: lastError,
          testedEndpoints: endpoints,
          testLogs: testLogs
        },
        { status: 400 }
      )
    }
    
    const { endpoint: successfulEndpoint, result, response } = successfulResponse
    
    console.log(`✅ [WHATSAPP CONTACT] Endpoint funcionando: ${successfulEndpoint}`)
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
