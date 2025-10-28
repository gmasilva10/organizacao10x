/**
 * GATE 10.6.2 - Motor de Relacionamento V2
 * Job diário 03:00 para gerar/atualizar tarefas em lote usando estratégias
 * 
 * Funcionalidades:
 * - Arquitetura baseada em estratégias (Strategy Pattern)
 * - Processamento seletivo por tipo de âncora
 * - Rate limiting e deduplicação
 * - Telemetria e logs detalhados
 * - Cache e otimizações de performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  AnchorStrategyFactory, 
  StrategyUtils, 
  EventCode,
  SUPPORTED_ANCHORS 
} from '@/lib/relationship/anchors/factory'
import { renderMessageWithVariables } from '@/lib/relationship/variable-renderer'
import { getCache, setCache } from '@/lib/cache/simple'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Configurações
const MAX_TASKS_PER_STUDENT_PER_DAY = 3
const CACHE_TTL_SECONDS = 300 // 5 minutos
const MAX_PARALLEL_STRATEGIES = 5

interface JobConfig {
  org_id: string
  selected_anchors?: EventCode[] // Se não especificado, processa todas
  force_refresh?: boolean // Ignora cache
  dry_run?: boolean // Não cria tarefas, apenas simula
}

interface JobStats {
  start_time: string
  end_time: string
  duration_ms: number
  org_id: string
  total_strategies_executed: number
  total_strategies_failed: number
  total_templates_processed: number
  total_students_found: number
  total_tasks_created: number
  total_tasks_updated: number
  total_tasks_skipped: number
  total_errors: number
  by_strategy: Record<EventCode, any>
  cache_hits: number
  cache_misses: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let stats: JobStats = {
    start_time: new Date().toISOString(),
    end_time: '',
    duration_ms: 0,
    org_id: '',
    total_strategies_executed: 0,
    total_strategies_failed: 0,
    total_templates_processed: 0,
    total_students_found: 0,
    total_tasks_created: 0,
    total_tasks_updated: 0,
    total_tasks_skipped: 0,
    total_errors: 0,
    by_strategy: {} as Record<string, any>,
    cache_hits: 0,
    cache_misses: 0
  }

  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const expectedToken = process.env.CRON_SECRET
    
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Parse da configuração
    const config: JobConfig = await request.json()
    
    if (!config.org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 })
    }

    stats.org_id = config.org_id

    console.log('🚀 [relationship-job-v2] Iniciando processamento:', {
      org_id: config.org_id,
      selected_anchors: config.selected_anchors,
      force_refresh: config.force_refresh,
      dry_run: config.dry_run
    })

    // Buscar templates ativos (com cache)
    const templates = await fetchActiveTemplates(config.org_id, config.force_refresh)
    stats.total_templates_processed = templates.length

    if (templates.length === 0) {
      console.log('⚠️ [relationship-job-v2] Nenhum template ativo encontrado')
      return NextResponse.json({
        success: true,
        message: 'No active templates found',
        stats
      })
    }

    // Determinar quais âncoras processar
    const anchorsToProcess = config.selected_anchors || SUPPORTED_ANCHORS
    console.log(`📋 [relationship-job-v2] Processando âncoras: ${anchorsToProcess.join(', ')}`)

    // Agrupar templates por âncora
    const templatesByAnchor = StrategyUtils.groupTemplatesByAnchor(templates)
    
    // Processar estratégias em lotes para evitar sobrecarga
    const batchSize = Math.min(MAX_PARALLEL_STRATEGIES, anchorsToProcess.length)
    const batches = []
    
    for (let i = 0; i < anchorsToProcess.length; i += batchSize) {
      batches.push(anchorsToProcess.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const batchResults = await processBatch(batch, config, templatesByAnchor, stats)
      
      // Consolidar estatísticas do lote
      for (const result of batchResults) {
        if (result.success && 'stats' in result && result.stats) {
          stats.total_strategies_executed++
          stats.total_students_found += result.stats.students_found || 0
          stats.total_tasks_created += result.stats.tasks_created || 0
          stats.total_tasks_updated += result.stats.tasks_updated || 0
          stats.total_tasks_skipped += result.stats.tasks_skipped || 0
          stats.total_errors += result.stats.errors?.length || 0
          stats.by_strategy[result.eventCode] = result.stats
        } else {
          stats.total_strategies_failed++
          stats.total_errors++
          stats.by_strategy[result.eventCode] = {
            error: result.error?.message || 'Erro desconhecido',
            students_found: 0,
            tasks_created: 0,
            tasks_updated: 0,
            tasks_skipped: 0,
            errors: [result.error?.message || 'Erro desconhecido'],
            duration_ms: 0
          }
        }
      }
    }

    // Salvar estatísticas do job
    await saveJobStats(stats)

    console.log('✅ [relationship-job-v2] Processamento concluído:', {
      duration_ms: stats.duration_ms,
      strategies_executed: stats.total_strategies_executed,
      strategies_failed: stats.total_strategies_failed,
      tasks_created: stats.total_tasks_created,
      tasks_skipped: stats.total_tasks_skipped,
      errors: stats.total_errors
    })

    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
      stats
    })

  } catch (error) {
    console.error('❌ [relationship-job-v2] Erro geral:', error)
    
    stats.duration_ms = Date.now() - startTime
    stats.end_time = new Date().toISOString()
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as any)?.message || String(error),
      stats
    }, { status: 500 })
  }
}

/**
 * Processa um lote de estratégias em paralelo
 */
async function processBatch(
  anchors: EventCode[],
  config: JobConfig,
  templatesByAnchor: Record<EventCode, any[]>,
  stats: JobStats
) {
  const promises = anchors.map(async (anchor) => {
    try {
      const templates = templatesByAnchor[anchor] || []
      
      if (templates.length === 0) {
        console.log(`⚠️ [relationship-job-v2] Nenhum template ativo para âncora: ${anchor}`)
        return {
          eventCode: anchor,
          success: true,
          stats: {
            students_found: 0,
            tasks_created: 0,
            tasks_updated: 0,
            tasks_skipped: 0,
            errors: [],
            duration_ms: 0
          }
        }
      }

      // Validar templates
      const validTemplates = templates.filter(template => {
        const validation = StrategyUtils.validateTemplateForStrategy(template, anchor)
        if (!validation.valid) {
          console.warn(`⚠️ [relationship-job-v2] Template inválido ${template.code}:`, validation.errors)
        }
        return validation.valid
      })

      if (validTemplates.length === 0) {
        return {
          eventCode: anchor,
          success: true,
          stats: {
            students_found: 0,
            tasks_created: 0,
            tasks_updated: 0,
            tasks_skipped: 0,
            errors: [`Nenhum template válido para âncora ${anchor}`],
            duration_ms: 0
          }
        }
      }

      // Executar estratégia
      const strategy = AnchorStrategyFactory.createStrategy(anchor)
      
      const strategyConfig = {
        dry_run: config.dry_run,
        max_tasks_per_student: MAX_TASKS_PER_STUDENT_PER_DAY
      } as any

      const result = await strategy.processAnchor(config.org_id, validTemplates, strategyConfig)
      
      console.log(`✅ [relationship-job-v2] Estratégia ${anchor} concluída:`, {
        students_found: result.students_found,
        tasks_created: result.tasks_created,
        tasks_skipped: result.tasks_skipped,
        duration_ms: result.duration_ms
      })

      return {
        eventCode: anchor,
        success: true,
        stats: result
      }

    } catch (error) {
      console.error(`❌ [relationship-job-v2] Erro na estratégia ${anchor}:`, error)
      return {
        eventCode: anchor,
        success: false,
        error
      }
    }
  })

  return await Promise.allSettled(promises).then(results => 
    results.map(result => result.status === 'fulfilled' ? result.value : {
      eventCode: 'unknown' as EventCode,
      success: false,
      error: result.status === 'rejected' ? result.reason : new Error('Unknown error')
    })
  )
}

/**
 * Busca templates ativos com cache
 */
async function fetchActiveTemplates(orgId: string, forceRefresh: boolean = false): Promise<any[]> {
  const cacheKey = `relationship-templates:${orgId}`
  
  if (!forceRefresh) {
    try {
      const cached = await getCache(cacheKey)
      if (cached) {
        console.log('📦 [relationship-job-v2] Templates carregados do cache')
        return cached as any[]
      }
    } catch (error) {
      console.warn('⚠️ [relationship-job-v2] Erro ao buscar cache:', error)
    }
  }

  const { data: templates, error } = await supabase
    .from('relationship_templates_v2')
    .select('*')
    .eq('org_id', orgId)
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ [relationship-job-v2] Erro ao buscar templates:', error)
    throw error
  }

  const templatesArray = templates || []
  
  // Cache por 5 minutos
  try {
    await setCache(cacheKey, templatesArray, { ttl: CACHE_TTL_SECONDS })
    console.log(`💾 [relationship-job-v2] Templates cacheados (${templatesArray.length} templates)`)
  } catch (error) {
    console.warn('⚠️ [relationship-job-v2] Erro ao salvar cache:', error)
  }

  return templatesArray
}

/**
 * Salva estatísticas do job para monitoramento
 */
async function saveJobStats(stats: JobStats) {
  try {
    const { error } = await supabase
      .from('relationship_job_stats')
      .insert({
        org_id: stats.org_id,
        start_time: stats.start_time,
        end_time: stats.end_time,
        duration_ms: stats.duration_ms,
        strategies_executed: stats.total_strategies_executed,
        strategies_failed: stats.total_strategies_failed,
        templates_processed: stats.total_templates_processed,
        students_found: stats.total_students_found,
        tasks_created: stats.total_tasks_created,
        tasks_updated: stats.total_tasks_updated,
        tasks_skipped: stats.total_tasks_skipped,
        errors_count: stats.total_errors,
        by_strategy: stats.by_strategy,
        cache_hits: stats.cache_hits,
        cache_misses: stats.cache_misses
      })

    if (error) {
      console.warn('⚠️ [relationship-job-v2] Erro ao salvar estatísticas:', error)
    }
  } catch (error) {
    console.warn('⚠️ [relationship-job-v2] Erro ao salvar estatísticas:', error)
  }
}

/**
 * Endpoint para monitoramento e health check
 */
export async function GET() {
  try {
    const { data: lastJob, error } = await supabase
      .from('relationship_job_stats')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }

    const health = {
      status: 'healthy',
      last_job: lastJob || null,
      supported_anchors: SUPPORTED_ANCHORS,
      max_parallel_strategies: MAX_PARALLEL_STRATEGIES,
      max_tasks_per_student_per_day: MAX_TASKS_PER_STUDENT_PER_DAY
    }

    return NextResponse.json(health)
  } catch (error) {
    console.error('❌ [relationship-job-v2] Erro no health check:', error)
    return NextResponse.json({
      status: 'unhealthy',
      error: (error as any)?.message || String(error)
    }, { status: 500 })
  }
}
