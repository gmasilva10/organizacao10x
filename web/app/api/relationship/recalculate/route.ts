/**
 * GATE 10.6.2 - Endpoint de Rec ¡lculo Manual
 * 
 * Funcionalidades:
 * - Lock para evitar execu   µes simult ¢neas
 * - Dry-run mode para preview
 * - Rec ¡lculo completo ou por  ¢ncora espec ­fica
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

// Lock para evitar execu   µes simult ¢neas
const recalculationLocks = new Map<string, boolean>()

interface RecalculateRequest {
  tenant_id: string
  dry_run?: boolean
  anchor?: string
  force?: boolean
}

interface RecalculateResponse {
  success: boolean
  dry_run: boolean
  stats: {
    templates_processed: number
    students_found: number
    tasks_created: number
    tasks_updated: number
    tasks_skipped: number
    errors: string[]
    duration_ms: number
  }
  message: string
}

/**
 * Verificar se h ¡ lock ativo
 */
function isLocked(tenantId: string): boolean {
  return recalculationLocks.get(tenantId) || false
}

/**
 * Definir lock
 */
function setLock(tenantId: string, locked: boolean): void {
  if (locked) {
    recalculationLocks.set(tenantId, true)
  } else {
    recalculationLocks.delete(tenantId)
  }
}

/**
 * Executar rec ¡lculo usando a fun   £o do banco
 */
async function executeRecalculation(
  tenantId: string, 
  dryRun: boolean = true
): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('recalculate_relationship_tasks', {
        p_dry_run: dryRun
      })

    if (error) {
      return { success: false, result: null, error: (error as any)?.message || String(error) }
    }

    return { success: true, result: data, error: undefined }
  } catch (error) {
    return { 
      success: false, 
      result: null, 
      error: (error as any)?.message || String(error) 
    }
  }
}

/**
 * Executar rec ¡lculo manual completo
 */
async function executeManualRecalculation(
  tenantId: string,
  dryRun: boolean = true
): Promise<RecalculateResponse> {
  const startTime = Date.now()
  
  try {
    // Buscar templates ativos (MVP via JSON em content)
    const { data: tmplRows, error: tmplErr } = await supabase
      .from('relationship_templates')
      .select('id, tenant_id, content')
      .eq('org_id', tenantId)

    if (tmplErr) {
      throw new Error(`Failed to fetch templates: ${tmplErr.message}`)
    }

    const templates = (tmplRows || []).map((row: any) => {
      try { return JSON.parse(row.content || '{}') } catch { return null }
    }).filter((t: any) => t && t.active)

    if (!templates || templates.length === 0) {
      return {
        success: true,
        dry_run: dryRun,
        stats: {
          templates_processed: 0,
          students_found: 0,
          tasks_created: 0,
          tasks_updated: 0,
          tasks_skipped: 0,
          errors: [],
          duration_ms: Date.now() - startTime
        },
        message: 'No active templates found'
      }
    }

    // Em modo dry-run, apenas simular
    if (dryRun) {
      // Contar alunos que seriam afetados
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', tenantId)
        .eq('status', 'active')

      return {
        success: true,
        dry_run: true,
        stats: {
          templates_processed: templates.length,
          students_found: studentsCount || 0,
          tasks_created: 0,
          tasks_updated: 0,
          tasks_skipped: 0,
          errors: [],
          duration_ms: Date.now() - startTime
        },
        message: 'Dry-run completed - no tasks were created/updated'
      }
    }

    // Modo real - chamar o job
    const jobResponse = await fetch(`http://localhost:3000/api/relationship/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`
      },
      body: JSON.stringify({ tenant_id: tenantId })
    })

    if (!jobResponse.ok) {
      const errorData = await jobResponse.json()
      throw new Error(`Job execution failed: ${errorData.error || 'Unknown error'}`)
    }

    const jobResult = await jobResponse.json()
    
    return {
      success: true,
      dry_run: false,
      stats: jobResult.stats || {
        templates_processed: 0,
        students_found: 0,
        tasks_created: 0,
        tasks_updated: 0,
        tasks_skipped: 0,
        errors: [],
        duration_ms: Date.now() - startTime
      },
      message: 'Recalculation completed successfully'
    }

  } catch (error) {
    return {
      success: false,
      dry_run: dryRun,
      stats: {
        templates_processed: 0,
        students_found: 0,
        tasks_created: 0,
        tasks_updated: 0,
        tasks_skipped: 0,
        errors: [(error as any)?.message || String(error)],
        duration_ms: Date.now() - startTime
      },
      message: `Recalculation failed: ${(error as any)?.message || String(error)}`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RecalculateRequest = await request.json()
    const { tenant_id, dry_run = true, anchor, force = false } = body

    if (!tenant_id) {
      return NextResponse.json({ 
        error: 'tenant_id is required' 
      }, { status: 400 })
    }

    // Verificar lock (exceto se for  ado)
    if (!force && isLocked(tenant_id)) {
      return NextResponse.json({
        success: false,
        error: 'Recalculation already in progress for this tenant',
        message: 'Please wait for the current recalculation to complete'
      }, { status: 409 })
    }

    // Definir lock
    setLock(tenant_id, true)

    try {
      let result: RecalculateResponse

      if (anchor) {
        // Rec ¡lculo por  ¢ncora espec ­fica (implementar se necess ¡rio)
        result = await executeManualRecalculation(tenant_id, dry_run)
        // Evitar log global com student_id nulo (constraint NOT NULL)
        return NextResponse.json(result)
      
      // Evitar log global com student_id nulo (constraint NOT NULL)
      return NextResponse.json(result)
      } else {
        // Rec ¡lculo completo
        result = await executeManualRecalculation(tenant_id, dry_run)
      }

      // Removido log global (student_id nulo)     retorna resultado diretamente
      return NextResponse.json(result)

    } finally {
      // Liberar lock
      setLock(tenant_id, false)
    }

  } catch (error) {
    console.error('Recalculation error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: (error as any)?.message || String(error),
      dry_run: true,
      stats: {
        templates_processed: 0,
        students_found: 0,
        tasks_created: 0,
        tasks_updated: 0,
        tasks_skipped: 0,
        errors: [(error as any)?.message || String(error)],
        duration_ms: 0
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenant_id')
  const dryRun = searchParams.get('dry_run') === 'true'

  if (!tenantId) {
    return NextResponse.json({ 
      error: 'tenant_id is required' 
    }, { status: 400 })
  }

  // Verificar status do lock
  const isLockedNow = isLocked(tenantId)
  
  if (isLockedNow) {
    return NextResponse.json({
      success: false,
      message: 'Recalculation in progress',
      locked: true
    }, { status: 409 })
  }

  // Executar dry-run
  const result = await executeManualRecalculation(tenantId, true)
  
  return NextResponse.json(result)
}

