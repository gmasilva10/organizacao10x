import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
import { resolveRequestContext } from "@/utils/context/request-context"
import { withCache, CacheConfigs } from "@/lib/cache/middleware"
import { getCache, setCache } from "@/lib/cache/simple"

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📊 API Dashboard KPIs - Iniciando requisição')
    
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

    // Buscar dados em paralelo
    const [studentsRes, contractsRes, occurrencesRes] = await Promise.all([
      // Total de alunos
      fetch(`${url}/rest/v1/students?org_id=eq.${ctx.org_id}&select=id,created_at,status&deleted_at=is.null`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Contratos para receita
      fetch(`${url}/rest/v1/student_contracts?org_id=eq.${ctx.org_id}&select=value,created_at,status&deleted_at=is.null`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      }),
      // Ocorrências para satisfação
      fetch(`${url}/rest/v1/student_occurrences?org_id=eq.${ctx.org_id}&select=rating,created_at&deleted_at=is.null`, {
        headers: { apikey: key!, Authorization: `Bearer ${key}`! },
        cache: 'no-store'
      })
    ])

    const students = studentsRes.ok ? await studentsRes.json().catch(() => []) : []
    const contracts = contractsRes.ok ? await contractsRes.json().catch(() => []) : []
    const occurrences = occurrencesRes.ok ? await occurrencesRes.json().catch(() => []) : []

    // Calcular KPIs
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Alunos
    const totalStudents = students.length
    const activeStudents = students.filter((s: any) => s.status === 'active' || s.status === 'enviado').length
    const newStudentsThisMonth = students.filter((s: any) => 
      new Date(s.created_at) >= currentMonth
    ).length

    // Retenção (alunos ativos / total)
    const studentRetentionRate = totalStudents > 0 ? 
      Math.round((activeStudents / totalStudents) * 100 * 10) / 10 : 0

    // Receita
    const totalRevenue = contracts
      .filter((c: any) => c.status === 'active')
      .reduce((sum: number, c: any) => sum + (parseFloat(c.value) || 0), 0)

    const monthlyRevenue = contracts
      .filter((c: any) => 
        c.status === 'active' && 
        new Date(c.created_at) >= currentMonth
      )
      .reduce((sum: number, c: any) => sum + (parseFloat(c.value) || 0), 0)

    // Taxa de conversão (mockada baseada em dados reais)
    const conversionRate = totalStudents > 0 ? 
      Math.round((newStudentsThisMonth / Math.max(totalStudents * 0.1, 1)) * 100 * 10) / 10 : 0

    // Satisfação (baseada em ratings de ocorrências)
    const ratings = occurrences
      .filter((o: any) => o.rating && o.rating > 0)
      .map((o: any) => o.rating)
    
    const satisfactionScore = ratings.length > 0 ? 
      Math.round((ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length) * 10) / 10 : 4.5

    const kpis = {
      totalStudents,
      activeStudents,
      newStudentsThisMonth,
      studentRetentionRate,
      averageResponseTime: Math.round(Math.random() * 100 + 200), // Mockado
      systemUptime: 99.9, // Mockado
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      conversionRate,
      satisfactionScore
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ API Dashboard KPIs - Concluído em ${queryTime}ms`, { 
      totalStudents, 
      activeStudents, 
      monthlyRevenue: Math.round(monthlyRevenue),
      requestId: Math.random().toString(36).slice(2, 8)
    })

    return NextResponse.json(kpis, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ API Dashboard KPIs - Erro:', error)
    
    return NextResponse.json(
      { 
        error: 'internal_error', 
        message: 'Erro interno ao buscar KPIs',
        queryTime 
      },
      { 
        status: 500,
        headers: { 'X-Query-Time': queryTime.toString() }
      }
    )
  }
}
