import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('💰 API Financial Transactions - Iniciando requisição GET')
    
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // receita ou despesa
    const status = searchParams.get('status') // pendente, pago, cancelado
    const studentId = searchParams.get('student_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '50')

    // Construir filtros
    const filters = [`org_id=eq.${ctx.org_id}`, `deleted_at=is.null`]
    
    if (type) filters.push(`type=eq.${type}`)
    if (status) filters.push(`status=eq.${status}`)
    if (studentId) filters.push(`student_id=eq.${studentId}`)
    if (startDate) filters.push(`paid_at=gte.${startDate}`)
    if (endDate) filters.push(`paid_at=lte.${endDate}`)

    // Calcular offset para paginação
    const offset = (page - 1) * pageSize

    // Buscar transações
    const transactionsUrl = `${url}/rest/v1/financial_transactions?${filters.join('&')}&select=*,students(id,name,email)&order=created_at.desc&limit=${pageSize}&offset=${offset}`
    
    const response = await fetch(transactionsUrl, {
      headers: { 
        apikey: key!, 
        Authorization: `Bearer ${key}`!,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Erro ao buscar transações:', error)
      return NextResponse.json(
        { error: 'database_error', message: 'Erro ao buscar transações' },
        { status: 500 }
      )
    }

    const transactions = await response.json()
    const totalCount = response.headers.get('content-range')?.split('/')[1] || '0'

    const queryTime = Date.now() - startTime
    console.log(`✅ API Financial Transactions - ${transactions.length} transações encontradas em ${queryTime}ms`)

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        pageSize,
        total: parseInt(totalCount),
        totalPages: Math.ceil(parseInt(totalCount) / pageSize)
      }
    }, {
      headers: { 
        'X-Query-Time': queryTime.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ API Financial Transactions - Erro:', error)
    
    return NextResponse.json(
      { 
        error: 'internal_error', 
        message: 'Erro interno ao buscar transações',
        queryTime 
      },
      { 
        status: 500,
        headers: { 'X-Query-Time': queryTime.toString() }
      }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('💰 API Financial Transactions - Iniciando requisição POST')
    
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
    const {
      type,
      category,
      amount,
      description,
      payment_method,
      status,
      paid_at,
      due_date,
      student_id,
      service_id,
      external_transaction_id,
      external_source,
      metadata
    } = body

    // Validações
    if (!type || !['receita', 'despesa'].includes(type)) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Tipo de transação inválido' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Categoria é obrigatória' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Valor deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Se é receita, student_id é obrigatório
    if (type === 'receita' && !student_id) {
      return NextResponse.json(
        { error: 'invalid_request', message: 'Student ID é obrigatório para receitas' },
        { status: 400 }
      )
    }

    // Criar transação
    const transactionData = {
      org_id: ctx.org_id,
      student_id: student_id || null,
      service_id: service_id || null,
      type,
      category,
      amount,
      description: description || null,
      payment_method: payment_method || 'manual',
      status: status || 'pendente',
      paid_at: paid_at || null,
      due_date: due_date || null,
      external_transaction_id: external_transaction_id || null,
      external_source: external_source || 'manual',
      metadata: metadata || {},
      created_by: ctx.userId
    }

    const createResponse = await fetch(`${url}/rest/v1/financial_transactions`, {
      method: 'POST',
      headers: { 
        apikey: key!, 
        Authorization: `Bearer ${key}`!,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(transactionData)
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      console.error('❌ Erro ao criar transação:', error)
      return NextResponse.json(
        { error: 'database_error', message: 'Erro ao criar transação' },
        { status: 500 }
      )
    }

    const transaction = await createResponse.json()

    const queryTime = Date.now() - startTime
    console.log(`✅ API Financial Transactions - Transação criada em ${queryTime}ms`)

    return NextResponse.json({
      success: true,
      transaction: transaction[0]
    }, {
      status: 201,
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ API Financial Transactions POST - Erro:', error)
    
    return NextResponse.json(
      { 
        error: 'internal_error', 
        message: 'Erro interno ao criar transação',
        queryTime 
      },
      { 
        status: 500,
        headers: { 'X-Query-Time': queryTime.toString() }
      }
    )
  }
}
