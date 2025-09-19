import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, name, instance, token } = body

    if (!phone || !name || !instance || !token) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: phone, name, instance, token' },
        { status: 400 }
      )
    }

    // Chamada para Z-API via backend (sem CORS)
    const response = await fetch(`https://api.z-api.io/instance/${instance}/token/${token}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        name: name
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Z-API:', errorText)
      return NextResponse.json(
        { error: 'Erro ao criar contato no WhatsApp', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Erro na API de contato WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
