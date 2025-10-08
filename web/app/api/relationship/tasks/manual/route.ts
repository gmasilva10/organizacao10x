
// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GATE 10.6.7.2 - API Manual para Tarefas de Relacionamento
 * 
 * Funcionalidades:
 * - Criação de tarefas manuais com âncora 'manual'
 * - Suporte a templates (v1/v2) e texto livre
 * - Validação de variáveis obrigatórias
 * - Rate-limit (50 criações/hora por usuário)
 * - Logs completos em relationship_logs
 * - Enviar agora ou criar tarefa agendada
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/utils/context/request-context'
import { isValidEventCode, getEventAnchor } from '@/lib/relationship/event-registry'

// Rate limiting: máximo 50 criações manuais por usuário por hora
const MAX_MANUAL_TASKS_PER_HOUR = 50

// Cache para rate limiting (em produção, usar Redis)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>()

interface ManualTaskRequest {
  studentId: string
  channel: 'whatsapp' | 'email' | 'manual'
  mode: 'template' | 'free'
  templateCode?: string
  templateVersion?: 'v1' | 'v2'
  message: string
  variablesUsed?: Record<string, string>
  classificationTag?: string
  scheduledFor?: string // ISO string, opcional quando sendNow=true
  sendNow: boolean
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // API Manual Tasks - Iniciando requisição
    
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.tenantId || !ctx.userId) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'unauthorized', message: 'Usuário não autenticado' },
        { status: 401, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }
    const { tenantId, userId } = ctx
    // Usar service role para contornar RLS em desenvolvimento
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: "service_unavailable", message: "Variáveis de ambiente do Supabase ausentes." },
        { status: 503, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Para desenvolvimento, usar cliente admin que bypassa RLS
    const supabase = await createClientAdmin()

    // Rate limiting
    const rateLimitKey = `manual_tasks:${userId}`
    const now = Date.now()
    const oneHour = 60 * 60 * 1000
    
    const rateLimit = rateLimitCache.get(rateLimitKey)
    if (rateLimit && now < rateLimit.resetTime) {
      if (rateLimit.count >= MAX_MANUAL_TASKS_PER_HOUR) {
        const queryTime = Date.now() - startTime
        return NextResponse.json(
          { 
            error: 'rate_limit_exceeded', 
            message: `Máximo de ${MAX_MANUAL_TASKS_PER_HOUR} tarefas manuais por hora`,
            retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
          },
          { status: 429, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }
      rateLimit.count++
    } else {
      rateLimitCache.set(rateLimitKey, { count: 1, resetTime: now + oneHour })
    }

    // Validar e parsear body
    let body: ManualTaskRequest
    try {
      body = await request.json()
    } catch (e) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'invalid_json', message: 'Body JSON inválido' },
        { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Validações obrigatórias
    const { studentId, channel, mode, message, sendNow } = body
    if (!studentId || !channel || !mode || !message || sendNow === undefined) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'missing_required_fields', message: 'Campos obrigatórios: studentId, channel, mode, message, sendNow' },
        { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Validar canal
    if (!['whatsapp', 'email', 'manual'].includes(channel)) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'invalid_channel', message: 'Canal deve ser: whatsapp, email ou manual' },
        { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Validar modo
    if (!['template', 'free'].includes(mode)) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'invalid_mode', message: 'Modo deve ser: template ou free' },
        { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Validações específicas para template (adiadas até carregar aluno/tenant)

    // Validar scheduledFor se sendNow=false
    if (!sendNow) {
      const { scheduledFor } = body
      if (!scheduledFor) {
        const queryTime = Date.now() - startTime
        return NextResponse.json(
          { error: 'missing_scheduled_for', message: 'scheduledFor é obrigatório quando sendNow=false' },
          { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }

      const scheduledDate = new Date(scheduledFor)
      const now = new Date()
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000) // 1 minuto atrás
      
      if (isNaN(scheduledDate.getTime()) || scheduledDate <= oneMinuteAgo) {
        const queryTime = Date.now() - startTime
        return NextResponse.json(
          { error: 'invalid_scheduled_for', message: 'scheduledFor deve ser uma data futura válida (pelo menos 1 minuto à frente)' },
          { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }
    }

    // Verificar se o aluno existe (sem filtro de tenant para desenvolvimento)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, status, org_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { 
          error: 'student_not_found', 
          message: 'Aluno não encontrado',
          debug: { studentId, org_id: tenantId, error: studentError?.message }
        },
        { status: 404, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Se modo template: validar template no modelo MVP (content JSON)
    if (mode === 'template') {
      const { templateCode, templateVersion } = body
      if (!templateCode || !templateVersion) {
        const queryTime = Date.now() - startTime
        return NextResponse.json(
          { error: 'missing_template_fields', message: 'templateCode e templateVersion são obrigatórios no modo template' },
          { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }

      const { data: tmplRows } = await supabase
        .from('relationship_templates')
        .select('id, content')
        .eq('org_id', student.org_id)

      let foundTemplate: any = null
      for (const row of (tmplRows || [])) {
        try {
          const parsed = JSON.parse((row as any).content || '{}')
          if (parsed?.code === templateCode && parsed?.active === true) {
            foundTemplate = parsed
            break
          }
        } catch {}
      }

      if (!foundTemplate) {
        const queryTime = Date.now() - startTime
        return NextResponse.json(
          { error: 'template_not_found', message: 'Template não encontrado ou inativo' },
          { status: 404, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }

      const requiredVariables: string[] = Array.isArray(foundTemplate.variables) ? foundTemplate.variables : []
      const providedVariables = body.variablesUsed || {}
      const missingVariables = requiredVariables.filter((v: string) => !providedVariables[v])

      if (missingVariables.length > 0) {
        const queryTime = Date.now() - startTime
        return NextResponse.json(
          {
            error: 'missing_variables',
            message: `Variáveis obrigatórias não fornecidas: ${missingVariables.join(', ')}`,
            missingVariables
          },
          { status: 400, headers: { 'X-Query-Time': queryTime.toString() } }
        )
      }
    }

    // Determinar status baseado na data
    let taskStatus = 'pending'
    if (sendNow) {
      taskStatus = 'sent'
    } else if (body.scheduledFor) {
      const scheduledDate = new Date(body.scheduledFor)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const scheduledDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate())
      
      // Se for hoje, status 'due_today', senão 'pending'
      if (scheduledDay.getTime() === today.getTime()) {
        taskStatus = 'due_today'
      } else {
        taskStatus = 'pending'
      }
    }

    // Preparar dados da tarefa
    const taskData = {
      student_id: studentId,
      org_id: student.org_id, // Adicionar org_id obrigatório
      template_code: mode === 'template' ? body.templateCode : null,
      anchor: 'manual', // Sempre manual para tarefas criadas manualmente
      scheduled_for: sendNow ? new Date().toISOString() : body.scheduledFor,
      channel,
      status: taskStatus,
      payload: {
        message,
        mode,
        template_version: mode === 'template' ? body.templateVersion : null,
        classification_tag: body.classificationTag || null
      },
      variables_used: body.variablesUsed || {},
      created_by: userId,
      sent_at: sendNow ? new Date().toISOString() : null,
      notes: `Tarefa manual criada via API - ${mode === 'template' ? `Template ${body.templateCode} v${body.templateVersion}` : 'Texto livre'}`,
      classification_tag: body.classificationTag || null
    }

    // Criar tarefa
    const { data: task, error: taskError } = await supabase
      .from('relationship_tasks')
      .insert(taskData)
      .select()
      .single()

    if (taskError) {
      console.error('❌ Erro ao criar tarefa manual:', taskError)
      const queryTime = Date.now() - startTime
      return NextResponse.json(
        { error: 'task_creation_failed', message: 'Falha ao criar tarefa', details: taskError.message },
        { status: 500, headers: { 'X-Query-Time': queryTime.toString() } }
      )
    }

    // Registrar log
    const logData = {
      student_id: studentId,
      org_id: student.org_id, // Adicionar org_id obrigatório
      task_id: task.id,
      action: 'created',
      channel,
      template_code: mode === 'template' ? body.templateCode : null,
      meta: {
        mode,
        template_version: mode === 'template' ? body.templateVersion : null,
        classification_tag: body.classificationTag,
        send_now: sendNow,
        scheduled_for: body.scheduledFor
      }
    }

    const { error: logError } = await supabase
      .from('relationship_logs')
      .insert(logData)

    if (logError) {
      console.warn('⚠️ Falha ao registrar log:', logError)
      // Não falhar a operação por causa do log
    }

    // Se sendNow=true, registrar também o log de 'sent'
    if (sendNow) {
      const sentLogData = {
        student_id: studentId,
        org_id: student.org_id, // Adicionar org_id obrigatório
        task_id: task.id,
        action: 'sent',
        channel,
        template_code: mode === 'template' ? body.templateCode : null,
        meta: {
          mode,
          template_version: mode === 'template' ? body.templateVersion : null,
          classification_tag: body.classificationTag,
          sent_at: new Date().toISOString()
        }
      }

      const { error: sentLogError } = await supabase
        .from('relationship_logs')
        .insert(sentLogData)

      if (sentLogError) {
        console.warn('⚠️ Falha ao registrar log de envio:', sentLogError)
      }
    }

    const queryTime = Date.now() - startTime
    // Tarefa criada com sucesso

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        student_id: task.student_id,
        status: task.status,
        scheduled_for: task.scheduled_for,
        channel: task.channel,
        anchor: task.anchor,
        classification_tag: task.classification_tag,
        created_at: task.created_at,
        sent_at: task.sent_at
      },
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone
      },
      queryTime
    }, {
      headers: { 
        'X-Query-Time': queryTime.toString(),
        'X-Rate-Limit-Remaining': String(MAX_MANUAL_TASKS_PER_HOUR - (rateLimit?.count || 0)),
        'X-Rate-Limit-Reset': String(rateLimit?.resetTime || now + oneHour)
      }
    })

  } catch (error) {
    const queryTime = Date.now() - startTime
    console.error('❌ Erro na API Manual Tasks:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'internal_server_error',
        message: 'Erro interno do servidor',
        queryTime 
      },
      { 
        status: 500,
        headers: { 'X-Query-Time': queryTime.toString() }
      }
    )
  }
}

/**
 * GET /relationship/tasks/manual - Listar opções de classificação
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveRequestContext(request)
    if (!ctx || !ctx.tenantId) {
      return NextResponse.json(
        { error: 'unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Opções de classificação predefinidas
    const classificationOptions = [
      'Renovação',
      'Aniversário', 
      'Boas-vindas',
      'Follow-up',
      'Lembrete',
      'Promoção',
      'Acompanhamento',
      'Outros'
    ]

    return NextResponse.json({
      success: true,
      classificationOptions,
      channels: ['whatsapp', 'email', 'manual'],
      modes: ['template', 'free']
    })

  } catch (error) {
    console.error('❌ Erro ao buscar opções de classificação:', error)
    return NextResponse.json(
      { error: 'internal_server_error', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

