import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params
  
  try {
    console.log(`💰 API Financial Transaction ${id} - Iniciando requisição GET`)
    
    const ctx = await resolveRequestContext(request)
    if (!ctx?.org_id) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Contexto de organização não encontrado' },
        { status: 401 }
      )
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Configuração do Supabase ausente" },
        { status: 503 }
      )
    }

    // Buscar transação
    const transactionUrl = `${url}/rest/v1/financial_transactions?id=eq.${id}&org_id=eq.${ctx.org_id}&deleted_at=is.null&select=*,students(id,name,email)`
    
    const response = await fetch(transactionUrl, {
      headers: { 
        apikey: key!, 
        Authorization: `Bearer ${key}`!,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'database_error', message: 'Erro ao buscar transação' },
        { status: 500 }
      )
    }

    const transactions = await response.json()
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'not_found', message: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    const queryTime = Date.now() - startTime
    return NextResponse.json({
      transaction: transactions[0]
    }, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error(`❌ API Financial Transaction ${id} GET - Erro:`, error)
    
    return NextResponse.json(
      { error: 'internal_error', message: 'Erro interno ao buscar transação' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params
  
  try {
    console.log(`💰 API Financial Transaction ${id} - Iniciando requisição PATCH`)
    
    const ctx = await resolveRequestContext(request)
    if (!ctx?.org_id || !ctx?.userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Contexto de usuário/organização não encontrado' },
        { status: 401 }
      )
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Configuração do Supabase ausente" },
        { status: 503 }
      )
    }

    // Parse body
    const body = await request.json()
    const updateData: any = {}

    // Campos que podem ser atualizados
    if (body.category) updateData.category = body.category
    if (body.amount) updateData.amount = body.amount
    if (body.description !== undefined) updateData.description = body.description
    if (body.payment_method) updateData.payment_method = body.payment_method
    if (body.status) updateData.status = body.status
    if (body.paid_at !== undefined) updateData.paid_at = body.paid_at
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.metadata) updateData.metadata = body.metadata

    // Sempre atualizar updated_at
    updateData.updated_at = new Date().toISOString()

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // Atualizar transação
    const updateResponse = await fetch(
      `${url}/rest/v1/financial_transactions?id=eq.${id}&org_id=eq.${ctx.org_id}`,
      {
        method: 'PATCH',
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`!,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      console.error('❌ Erro ao atualizar transação:', error)
      return NextResponse.json(
        { error: 'database_error', message: 'Erro ao atualizar transação' },
        { status: 500 }
      )
    }

    const transaction = await updateResponse.json()

    const queryTime = Date.now() - startTime
    console.log(`✅ API Financial Transaction ${id} - Atualizado em ${queryTime}ms`)

    return NextResponse.json({
      success: true,
      transaction: transaction[0]
    }, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error(`❌ API Financial Transaction ${id} PATCH - Erro:`, error)
    
    return NextResponse.json(
      { error: 'internal_error', message: 'Erro interno ao atualizar transação' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params
  
  try {
    console.log(`💰 API Financial Transaction ${id} - Iniciando requisição DELETE`)
    
    const ctx = await resolveRequestContext(request)
    if (!ctx?.org_id || !ctx?.userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Contexto de usuário/organização não encontrado' },
        { status: 401 }
      )
    }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Configuração do Supabase ausente" },
        { status: 503 }
      )
    }

    // Soft delete - apenas marcar deleted_at
    const deleteResponse = await fetch(
      `${url}/rest/v1/financial_transactions?id=eq.${id}&org_id=eq.${ctx.org_id}`,
      {
        method: 'PATCH',
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`!,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          deleted_at: new Date().toISOString()
        })
      }
    )

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text()
      console.error('❌ Erro ao deletar transação:', error)
      return NextResponse.json(
        { error: 'database_error', message: 'Erro ao deletar transação' },
        { status: 500 }
      )
    }

    const transaction = await deleteResponse.json()

    const queryTime = Date.now() - startTime
    console.log(`✅ API Financial Transaction ${id} - Deletado em ${queryTime}ms`)

    return NextResponse.json({
      success: true,
      transaction: transaction[0]
    }, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error(`❌ API Financial Transaction ${id} DELETE - Erro:`, error)
    
    return NextResponse.json(
      { error: 'internal_error', message: 'Erro interno ao deletar transação' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}
