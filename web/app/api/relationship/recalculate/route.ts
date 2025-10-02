/**
 * GATE 10.6.2 - Endpoint de Recalculo Manual
 * 
 * Funcionalidades:
 * - Lock para evitar execucoes simultaneas
 * - Dry-run mode para preview
 * - Recalculo completo ou por ancora especifica
 * - Telemetria detalhada
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Lock para evitar execucoes simultaneas
const LOCK_KEY = 'relationship_recalculate_lock'
const LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos

type EventCode =
  | 'sale_close'
  | 'first_workout'
  | 'weekly_followup'
  | 'monthly_review'
  | 'birthday'
  | 'renewal_window'
  | 'occurrence_followup'

interface RecalculateRequest {
  org_id: string
  anchor?: EventCode
  dry_run?: boolean
  force?: boolean
}

interface RecalculateStats {
  templates_processed: number
  students_found: number
  tasks_created: number
  tasks_updated: number
  tasks_deleted: number
  tasks_skipped: number
  errors: string[]
  duration_ms: number
  dry_run: boolean
}

/**
 * Verificar se existe lock ativo
 */
async function checkLock(): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('system_locks')
      .select('id, created_at')
      .eq('key', LOCK_KEY)
      .single()

    if (!data) return false

    const lockAge = Date.now() - new Date(data.created_at).getTime()
    return lockAge < LOCK_TIMEOUT_MS
  } catch {
    return false
  }
}

/**
 * Criar lock
 */
async function createLock(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('system_locks')
      .insert({
        key: LOCK_KEY,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + LOCK_TIMEOUT_MS).toISOString()
      })

    return !error
  } catch {
    return false
  }
}

/**
 * Remover lock
 */
async function removeLock(): Promise<void> {
  try {
    await supabase
      .from('system_locks')
      .delete()
      .eq('key', LOCK_KEY)
  } catch {
    // Ignorar erros ao remover lock
  }
}

/**
 * Buscar templates ativos
 */
async function fetchActiveTemplates(tenantId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('relationship_templates')
    .select('id, org_id, content')
    .eq('org_id', tenantId)

  if (error || !data) return []

  const templates: any[] = []
  for (const row of data) {
    try {
      const parsed = JSON.parse((row as any).content || '{}')
      if (parsed && parsed.active === true) {
        templates.push({
          id: (row as any).id,
          ...parsed
        })
      }
    } catch {
      // Ignorar templates invalidos
    }
  }
  return templates
}

/**
 * Buscar alunos para uma ancora especifica
 */
async function fetchStudentsForAnchor(anchor: EventCode, tenantId: string): Promise<any[]> {
  try {
    if (anchor === 'sale_close') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, created_at, org_id')
        .eq('org_id', tenantId)
        .eq('status', 'active')
      if (error) return []
      return data || []
    }

    if (anchor === 'birthday') {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone, birth_date, org_id')
        .eq('org_id', tenantId)
        .not('birth_date', 'is', null)
      if (error) return []
      return data || []
    }

    // Outras ancoras podem ser implementadas aqui
    return []
  } catch {
    return []
  }
}

/**
 * Deletar tarefas existentes para uma ancora
 */
async function deleteExistingTasks(anchor: EventCode, tenantId: string, dryRun: boolean): Promise<number> {
  if (dryRun) {
    const { count } = await supabase
      .from('relationship_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('anchor', anchor)
    return count || 0
  }

  // Primeiro contar as tarefas que serão deletadas
  const { count: countBefore } = await supabase
    .from('relationship_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('anchor', anchor)

  // Deletar as tarefas
  await supabase
    .from('relationship_tasks')
    .delete()
    .eq('anchor', anchor)

  return countBefore || 0
}

/**
 * Processar recalculo para uma ancora
 */
async function processRecalculate(
  anchor: EventCode,
  templates: any[],
  tenantId: string,
  dryRun: boolean
): Promise<{ created: number; updated: number; deleted: number; skipped: number; errors: string[] }> {
  const anchorTemplates = templates.filter(t => t.anchor === anchor)
  if (anchorTemplates.length === 0) {
    return { created: 0, updated: 0, deleted: 0, skipped: 0, errors: [] }
  }

  let created = 0
  let updated = 0
  let deleted = 0
  let skipped = 0
  const errors: string[] = []

  try {
    // Deletar tarefas existentes
    deleted = await deleteExistingTasks(anchor, tenantId, dryRun)

    if (dryRun) {
      // Em dry-run, apenas simular criacao
      const students = await fetchStudentsForAnchor(anchor, tenantId)
      created = students.length * anchorTemplates.length
      return { created, updated, deleted, skipped, errors }
    }

    // Buscar alunos para esta ancora
    const students = await fetchStudentsForAnchor(anchor, tenantId)
    if (!students || students.length === 0) {
      return { created, updated, deleted, skipped, errors }
    }

    // Processar cada template
    for (const template of anchorTemplates) {
      for (const student of students) {
        try {
          // Calcular data agendada
          const baseDate = new Date(student.created_at || student.birth_date || new Date())
          const offset = template.suggested_offset || '+0d'
          const match = offset.match(/^([+-]?)(\d+)d/)
          if (!match) continue

          const sign = match[1] === '-' ? -1 : 1
          const days = parseInt(match[2]) * sign
          const scheduledDate = new Date(baseDate)
          scheduledDate.setDate(scheduledDate.getDate() + days)

          // Renderizar mensagem
          let message = template.message_v1 || ''
          message = message.replace(/\[Nome do Cliente\]/g, student.name)
          message = message.replace(/\[Nome\]/g, student.name)
          message = message.replace(/\[PrimeiroNome\]/g, student.name.split(' ')[0])

          // Criar tarefa
          const { error: insertError } = await supabase
            .from('relationship_tasks')
            .insert({
              student_id: student.id,
              template_code: template.code,
              anchor: anchor,
              scheduled_for: scheduledDate.toISOString(),
              channel: template.channel_default || 'whatsapp',
              status: 'pending',
              payload: {
                message: message,
                student_name: student.name,
                student_email: student.email,
                student_phone: student.phone
              },
              variables_used: template.variables || [],
              created_by: 'manual_recalculate'
            })

          if (insertError) {
            errors.push(`Erro ao criar tarefa para ${student.name}: ${insertError.message}`)
          } else {
            created++
          }
        } catch (error) {
          errors.push(`Erro ao processar aluno ${student.name}: ${(error as any)?.message || String(error)}`)
        }
      }
    }
  } catch (error) {
    errors.push(`Erro geral ao processar ancora ${anchor}: ${(error as any)?.message || String(error)}`)
  }

  return { created, updated, deleted, skipped, errors }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verificar autorizacao
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RecalculateRequest = await request.json()
    const { org_id, anchor, dry_run = false, force = false } = body

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 })
    }

    // Verificar lock (exceto se force=true)
    if (!force && await checkLock()) {
      return NextResponse.json({ 
        error: 'Recalculo ja em andamento',
        message: 'Use force=true para forcar execucao'
      }, { status: 409 })
    }

    // Criar lock
    if (!force && !await createLock()) {
      return NextResponse.json({ 
        error: 'Nao foi possivel criar lock para execucao'
      }, { status: 500 })
    }

    try {
      // Buscar templates ativos
      const templates = await fetchActiveTemplates(org_id)
      if (!templates || templates.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No active templates found',
          stats: {
            templates_processed: 0,
            students_found: 0,
            tasks_created: 0,
            tasks_updated: 0,
            tasks_deleted: 0,
            tasks_skipped: 0,
            errors: [],
            duration_ms: Date.now() - startTime,
            dry_run: dry_run
          }
        })
      }

      // Processar recalculo
      const stats: RecalculateStats = {
        templates_processed: templates.length,
        students_found: 0,
        tasks_created: 0,
        tasks_updated: 0,
        tasks_deleted: 0,
        tasks_skipped: 0,
        errors: [],
        duration_ms: 0,
        dry_run: dry_run
      }

      if (anchor) {
        // Processar ancora especifica
        const result = await processRecalculate(anchor, templates, org_id, dry_run)
        stats.tasks_created += result.created
        stats.tasks_updated += result.updated
        stats.tasks_deleted += result.deleted
        stats.tasks_skipped += result.skipped
        stats.errors.push(...result.errors)
      } else {
        // Processar todas as ancoras
        const anchors = [...new Set(templates.map(t => t.anchor))] as EventCode[]
        for (const anc of anchors) {
          const result = await processRecalculate(anc, templates, org_id, dry_run)
          stats.tasks_created += result.created
          stats.tasks_updated += result.updated
          stats.tasks_deleted += result.deleted
          stats.tasks_skipped += result.skipped
          stats.errors.push(...result.errors)
        }
      }

      stats.duration_ms = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: dry_run ? 'Dry run completed' : 'Recalculo completed',
        stats
      })

    } finally {
      // Remover lock
      if (!force) {
        await removeLock()
      }
    }

  } catch (error) {
    console.error('Recalculate error:', error)
    
    // Remover lock em caso de erro
    await removeLock()
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as any)?.message || String(error),
      duration_ms: Date.now() - startTime
    }, { status: 500 })
  }
}