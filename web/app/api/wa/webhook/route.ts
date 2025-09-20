import { NextRequest, NextResponse } from 'next/server'

// Forçar Node runtime para compatibilidade com bibliotecas
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Configurações de cache
export const revalidate = 0

// Função para log estruturado
function logAction(action: string, data: any, status?: number) {
  const timestamp = new Date().toISOString()
  
  console.log(`[${timestamp}] WA-WEBHOOK-${action}:`, {
    status,
    method: data.method,
    headers: data.headers ? Object.keys(data.headers) : undefined,
    body: data.body ? JSON.stringify(data.body).substring(0, 300) : undefined,
    query: data.query
  })
}

export async function POST(request: NextRequest) {
  const correlationId = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}-wa-webhook`
  
  try {
    const body = await request.json()
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret')
    
    // Validação por secret (sem JWT para webhook público)
    const expectedSecret = process.env.WA_WEBHOOK_SECRET
    if (expectedSecret && secret !== expectedSecret) {
      logAction('WEBHOOK_UNAUTHORIZED', { 
        method: 'POST',
        query: { secret: secret ? '***' : 'missing' },
        headers: Object.fromEntries(request.headers.entries())
      }, 401)
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    logAction('WEBHOOK_RECEIVED', {
      method: 'POST',
      body,
      query: { secret: secret ? '***' : 'missing' },
      headers: Object.fromEntries(request.headers.entries())
    })

    // Processar diferentes tipos de webhook
    if (body.type === 'message') {
      // Mensagem recebida
      logAction('MESSAGE_RECEIVED', {
        from: body.from,
        message: body.message?.text?.substring(0, 100),
        timestamp: body.timestamp
      })
    } else if (body.type === 'status') {
      // Status de entrega
      logAction('STATUS_UPDATE', {
        messageId: body.messageId,
        status: body.status,
        timestamp: body.timestamp
      })
    } else if (body.type === 'group') {
      // Eventos de grupo
      logAction('GROUP_EVENT', {
        groupId: body.groupId,
        event: body.event,
        participants: body.participants?.length || 0
      })
    }

    return NextResponse.json({ 
      success: true,
      correlationId,
      received: true
    })

  } catch (error) {
    logAction('WEBHOOK_EXCEPTION', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      method: 'POST'
    }, 500)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        correlationId 
      },
      { status: 500 }
    )
  }
}

// GET para verificação de webhook
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  
  logAction('WEBHOOK_VERIFICATION', {
    method: 'GET',
    query: { secret: secret ? '***' : 'missing' },
    headers: Object.fromEntries(request.headers.entries())
  })

  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Webhook WhatsApp ativo'
  })
}
