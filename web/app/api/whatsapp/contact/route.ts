import { NextRequest, NextResponse } from 'next/server'

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  console.log('ðŸš€ [WHATSAPP CONTACT] GET endpoint chamado!')
  
  // Testar POST via GET para debug
  const { searchParams } = new URL(request.url)
  const testPost = searchParams.get('test_post')
  
  if (testPost === 'true') {
    console.log('ðŸ§ª [WHATSAPP CONTACT] Testando POST via GET...')
    
    // Simular teste dos endpoints
    const endpoints = [
      `/send-contact`,
      `/contact`, 
      `/add-contact`,
      `/create-contact`,
      `/save-contact`
    ]
    
    const testLogs = []
    
    for (const endpoint of endpoints) {
      const instance = '3E7608F78BA2405A08E5EE5C772D9ACD'
      const token = '8F670F193615706A0616496E'
      const zapiUrl = `https://api.z-api.io/instance/${instance}/token/${token}${endpoint}`
      
      try {
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: '5584996499247',
            name: 'RadamÃ©s'
          })
        })
        
        testLogs.push({
          endpoint,
          url: zapiUrl,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          success: response.ok
        })
        
        if (response.ok) {
          const result = await response.json()
          ;(testLogs[testLogs.length - 1] as any).result = result
          break
        } else {
          const errorText = await response.text()
          testLogs[testLogs.length - 1].error = errorText
        }
      } catch (error) {
        testLogs.push({
          endpoint,
          url: zapiUrl,
          error: (error as any)?.message || String(error),
          success: false
        })
      }
    }
    
    return NextResponse.json({ 
      message: 'WhatsApp Contact API funcionando!',
      testLogs: testLogs
    })
  }
  
  return NextResponse.json({ message: 'WhatsApp Contact API funcionando!' })
}

export async function POST(request: NextRequest) {
  console.log('ðŸš€ [WHATSAPP CONTACT] POST endpoint chamado!')
  try {
    const body = await request.json()
    const { phone, name, instance, token } = body

    console.log('ðŸ“± [WHATSAPP CONTACT] Dados recebidos:', { phone, name, instance: instance ? '***' : 'undefined', token: token ? '***' : 'undefined' })
    console.log('ðŸ“± [WHATSAPP CONTACT] Ambiente:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    })

    if (!phone || !name || !instance || !token) {
      console.error('âŒ [WHATSAPP CONTACT] ParÃ¢metros faltando:', { phone: !!phone, name: !!name, instance: !!instance, token: !!token })
      return NextResponse.json(
        { error: 'ParÃ¢metros obrigatÃ³rios: phone, name, instance, token' },
        { status: 400 }
      )
    }

        // TESTE: Endpoints corretos baseados na documentaÃ§Ã£o oficial da Z-API
        const endpoints = [
          `/send-contact`  // Endpoint oficial para enviar contatos
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
      
      console.log(`ðŸ”„ [WHATSAPP CONTACT] Testando endpoint: ${endpoint}`)
      console.log('ðŸ”„ [WHATSAPP CONTACT] URL:', zapiUrl)
      
      try {
        const response = await fetch(zapiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Token': 'F31db8854d41742a7a08625204dc7a618S'  // Client-Token correto da conta
          },
          body: JSON.stringify({
            phone: phone,
            contactName: name,
            contactPhone: phone
          })
        })
        
        const responseData = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        }
        
        console.log(`ðŸ”„ [WHATSAPP CONTACT] Resposta ${endpoint}:`, responseData)
        
        if (response.ok) {
          const result = await response.json()
          console.log(`âœ… [WHATSAPP CONTACT] Resposta ${endpoint}:`, result)
          
          // Verificar se realmente foi criado (sem erro interno da Z-API)
          if (!result.error && !result.message?.includes('error')) {
            successfulResponse = { endpoint, result, response }
            testLogs.push({ ...logEntry, success: true, result })
            break // SÃ³ parar se realmente funcionou
          } else {
            // HTTP 200 mas com erro interno da Z-API
            testLogs.push({ ...logEntry, success: false, result, status: response.status, statusText: response.statusText, ok: response.ok })
          }
        } else {
          const errorText = await response.text()
          console.log(`âŒ [WHATSAPP CONTACT] Erro com ${endpoint}:`, errorText)
          lastError = { endpoint, error: errorText, status: response.status }
          testLogs.push({ ...logEntry, success: false, error: errorText, status: response.status })
        }
      } catch (error) {
        console.log(`âŒ [WHATSAPP CONTACT] ExceÃ§Ã£o com ${endpoint}:`, error)
        lastError = { endpoint, error: (error as any)?.message || String(error) }
        testLogs.push({ ...logEntry, success: false, error: (error as any)?.message || String(error) })
      }
    }
    
    if (!successfulResponse) {
      console.error('âŒ [WHATSAPP CONTACT] Todos os endpoints falharam. Ãšltimo erro:', lastError)
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
    
    console.log(`âœ… [WHATSAPP CONTACT] Endpoint funcionando: ${successfulEndpoint}`)
    console.log('Resposta Z-API contato:', result)
    
    // Verificar se realmente foi criado
    if (result.error || result.message?.includes('error')) {
      console.error('âŒ [WHATSAPP CONTACT] Z-API retornou erro:', result)
      
      // Mapear erros especÃ­ficos do Z-API
      let errorMessage = 'Falha na criaÃ§Ã£o do contato'
      if (result.message?.includes('already exists') || result.message?.includes('jÃ¡ existe')) {
        errorMessage = 'Este contato jÃ¡ existe no WhatsApp'
      } else if (result.message?.includes('invalid phone') || result.message?.includes('telefone invÃ¡lido')) {
        errorMessage = 'NÃºmero de telefone invÃ¡lido'
      } else if (result.message?.includes('unauthorized') || result.message?.includes('nÃ£o autorizado')) {
        errorMessage = 'Erro de autorizaÃ§Ã£o com a API do WhatsApp'
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
