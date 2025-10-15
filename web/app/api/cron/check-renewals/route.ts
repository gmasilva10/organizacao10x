import { NextRequest, NextResponse } from "next/server"

// API para verificar contratos próximos ao vencimento
// Pode ser chamada por um cron job diário ou manualmente
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('📅 Cron Check Renewals - Iniciando verificação')

    // Verificar token de autorização (para cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Token de autorização inválido' },
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

    // Calcular data limite (próximos X dias)
    const now = new Date()
    const alertDays = parseInt(process.env.RENEWAL_ALERT_DAYS || '30')
    const alertDate = new Date(now.getTime() + (alertDays * 24 * 60 * 60 * 1000))
    const alertDateStr = alertDate.toISOString().split('T')[0]
    const todayStr = now.toISOString().split('T')[0]

    console.log(`📅 Verificando renovações até ${alertDateStr}`)

    // Buscar contratos que precisam de alerta
    const servicesResponse = await fetch(
      `${url}/rest/v1/student_services?status=eq.active&renewal_status=eq.ativo&next_renewal_date=gte.${todayStr}&next_renewal_date=lte.${alertDateStr}&select=id,student_id,name,price_cents,next_renewal_date,renewal_alert_days,students(id,name,email),org_id`,
      {
        headers: { 
          apikey: key!, 
          Authorization: `Bearer ${key}`!,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      }
    )

    if (!servicesResponse.ok) {
      console.error('❌ Erro ao buscar contratos:', await servicesResponse.text())
      return NextResponse.json(
        { error: 'database_error', message: 'Erro ao buscar contratos' },
        { status: 500 }
      )
    }

    const services = await servicesResponse.json()
    console.log(`📅 ${services.length} contratos encontrados para verificação`)

    const alerts = []
    const notifications = []

    // Processar cada contrato
    for (const service of services) {
      const renewalDate = new Date(service.next_renewal_date)
      const daysUntilRenewal = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const alertDaysForService = service.renewal_alert_days || 30

      // Verificar se está dentro do período de alerta
      if (daysUntilRenewal <= alertDaysForService) {
        const priority = daysUntilRenewal <= 7 ? 'high' : daysUntilRenewal <= 15 ? 'medium' : 'low'
        
        alerts.push({
          service_id: service.id,
          student_id: service.student_id,
          student_name: service.students?.name || 'Desconhecido',
          student_email: service.students?.email,
          plan_name: service.name,
          renewal_date: service.next_renewal_date,
          days_until_renewal: daysUntilRenewal,
          amount: service.price_cents / 100,
          priority,
          org_id: service.org_id
        })

        // Criar ocorrência de alerta (se não existir)
        const occurrenceCheck = await fetch(
          `${url}/rest/v1/student_occurrences?student_id=eq.${service.student_id}&type_id=eq.99999&status=eq.OPEN`,
          {
            headers: { apikey: key!, Authorization: `Bearer ${key}`! },
            cache: 'no-store'
          }
        )

        const existingOccurrences = occurrenceCheck.ok ? await occurrenceCheck.json() : []

        if (existingOccurrences.length === 0) {
          // Criar ocorrência de renovação
          notifications.push({
            student_id: service.student_id,
            org_id: service.org_id,
            plan_name: service.name,
            days_until_renewal: daysUntilRenewal,
            renewal_date: service.next_renewal_date,
            amount: service.price_cents / 100
          })

          console.log(`📅 Alerta criado: ${service.students?.name} - ${daysUntilRenewal} dias`)
        }
      }
    }

    const queryTime = Date.now() - startTime
    console.log(`✅ Cron Check Renewals - Concluído em ${queryTime}ms`, {
      total_services: services.length,
      alerts_generated: alerts.length,
      notifications_sent: notifications.length
    })

    return NextResponse.json({
      success: true,
      processed: services.length,
      alerts: alerts.length,
      notifications: notifications.length,
      data: alerts
    }, {
      headers: { 'X-Query-Time': queryTime.toString() }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ Cron Check Renewals - Erro:', error)
    
    return NextResponse.json(
      { error: 'internal_error', message: 'Erro ao verificar renovações' },
      { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
    )
  }
}

// GET para verificação manual
export async function GET(request: NextRequest) {
  // Redirecionar para POST
  return POST(request)
}
