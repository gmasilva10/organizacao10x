import { NextRequest, NextResponse } from "next/server"
import { resolveRequestContext } from "@/utils/context/request-context"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('💰 API Financial Summary - Iniciando requisição')
    
    const ctx = await resolveRequestContext(request)
    const isDev = process.env.NODE_ENV !== 'production'
    
    if (!ctx?.org_id && !isDev) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Contexto de organização não encontrado' },
        { status: 401 }
      )
    }

    // Em desenvolvimento, usar org_id padrão se não estiver disponível
    const orgId = ctx?.org_id || 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) {
      return NextResponse.json(
        { error: "service_unavailable", message: "Configuração do Supabase ausente" },
        { status: 503 }
      )
    }

    // Calcular datas para filtros
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
    const in30Days = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]

    // Buscar dados em paralelo
    const [
      receitasResponse,
      despesasResponse,
      receitasMesResponse,
      despesasMesResponse,
      contratosResponse,
      proximosVencimentosResponse
    ] = await Promise.all([
      // Total de receitas (ano)
      fetch(`${url}/rest/v1/financial_transactions?org_id=eq.${orgId}&type=eq.receita&status=eq.pago&paid_at=gte.${firstDayOfYear}&deleted_at=is.null&select=amount`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Total de despesas (ano)
      fetch(`${url}/rest/v1/financial_transactions?org_id=eq.${orgId}&type=eq.despesa&status=eq.pago&paid_at=gte.${firstDayOfYear}&deleted_at=is.null&select=amount`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Receitas do mês
      fetch(`${url}/rest/v1/financial_transactions?org_id=eq.${orgId}&type=eq.receita&status=eq.pago&paid_at=gte.${firstDayOfMonth}&paid_at=lte.${lastDayOfMonth}&deleted_at=is.null&select=amount`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Despesas do mês
      fetch(`${url}/rest/v1/financial_transactions?org_id=eq.${orgId}&type=eq.despesa&status=eq.pago&paid_at=gte.${firstDayOfMonth}&paid_at=lte.${lastDayOfMonth}&deleted_at=is.null&select=amount`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Contratos ativos
      fetch(`${url}/rest/v1/student_services?org_id=eq.${orgId}&status=eq.active&select=id`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Próximos vencimentos (próximos 30 dias)
      fetch(`${url}/rest/v1/student_services?org_id=eq.${orgId}&status=eq.active&renewal_status=eq.ativo&next_renewal_date=lte.${in30Days}&select=id,student_id,name,price_cents,next_renewal_date,students(id,name)&order=next_renewal_date.asc&limit=10`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      })
    ])

    // Processar receitas
    const receitas = receitasResponse.ok ? await receitasResponse.json() : []
    const totalReceitas = receitas.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

    // Processar despesas
    const despesas = despesasResponse.ok ? await despesasResponse.json() : []
    const totalDespesas = despesas.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

    // Processar receitas do mês
    const receitasMes = receitasMesResponse.ok ? await receitasMesResponse.json() : []
    const totalReceitasMes = receitasMes.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

    // Processar despesas do mês
    const despesasMes = despesasMesResponse.ok ? await despesasMesResponse.json() : []
    const totalDespesasMes = despesasMes.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)

    // Processar contratos ativos
    const contratos = contratosResponse.ok ? await contratosResponse.json() : []

    // Processar próximos vencimentos
    const vencimentos = proximosVencimentosResponse.ok ? await proximosVencimentosResponse.json() : []
    const proximosVencimentos = vencimentos.map((v: any) => {
      const diasRestantes = Math.ceil((new Date(v.next_renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        student_id: v.student_id,
        student_name: v.students?.name || 'Desconhecido',
        plan_name: v.name,
        dias_restantes: diasRestantes,
        valor: v.price_cents ? v.price_cents / 100 : 0,
        next_renewal_date: v.next_renewal_date
      }
    })

    const summary = {
      totalReceitas: Math.round(totalReceitas * 100) / 100,
      totalDespesas: Math.round(totalDespesas * 100) / 100,
      saldoAtual: Math.round((totalReceitas - totalDespesas) * 100) / 100,
      receitasMes: Math.round(totalReceitasMes * 100) / 100,
      despesasMes: Math.round(totalDespesasMes * 100) / 100,
      saldoMes: Math.round((totalReceitasMes - totalDespesasMes) * 100) / 100,
      contratosAtivos: contratos.length,
      proximosVencimentos
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ API Financial Summary - Concluído em ${queryTime}ms`, {
      receitas: summary.totalReceitas,
      despesas: summary.totalDespesas,
      saldo: summary.saldoAtual
    })

    return NextResponse.json(summary, {
      headers: { 
        'X-Query-Time': queryTime.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ API Financial Summary - Erro:', error)
    
    return NextResponse.json(
      { error: 'internal_error', message: 'Erro interno ao buscar resumo financeiro' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}
