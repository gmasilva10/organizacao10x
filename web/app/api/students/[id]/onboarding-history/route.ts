import { NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache/redis'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    const { resolveRequestContext } = await import('@/utils/context/request-context')
    const ctx = await resolveRequestContext(request)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    if (!ctx?.org_id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { id: studentId } = await params
    if (!studentId) return NextResponse.json({ error: 'invalid_student_id' }, { status: 400 })

    // Verificar cache primeiro
    const cacheKey = `onboarding-history:${studentId}:${page}:${pageSize}`
    const cachedData = await getCache(cacheKey, {
      ttl: 60, // 1 minuto para histórico
      prefix: 'students'
    })

    if (cachedData) {
      console.log('✅ [onboarding-history] Cache HIT')
      return NextResponse.json(cachedData, {
        headers: { 
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
        }
      })
    }

    // Garantir que o aluno pertence à mesma org
    const { data: studentRow, error: studentErr } = await supabase
      .from('students')
      .select('id, org_id')
      .eq('id', studentId)
      .maybeSingle()

    if (studentErr || !studentRow) return NextResponse.json({ error: 'student_not_found' }, { status: 404 })
    if (studentRow.org_id !== ctx.org_id) return NextResponse.json({ error: 'history_forbidden' }, { status: 403 })

    // Buscar histórico paginado
    const baseSelect = supabase
      .from('onboarding_history')
      .select('id, completed_at, initial_stage_id, final_stage_id, total_days, total_tasks_completed, metadata')
      .eq('org_id', ctx.org_id)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })

    const [{ data: rows, error: rowsErr }, { count }] = await Promise.all([
      baseSelect.range(from, to),
      supabase
        .from('onboarding_history')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', ctx.org_id)
        .eq('student_id', studentId)
    ])

    if (rowsErr) return NextResponse.json({ error: 'history_internal' }, { status: 500 })

    // Enriquecimento leve: map de estágios
    const stageIds = Array.from(new Set((rows || []).flatMap(r => [r.initial_stage_id, r.final_stage_id]).filter(Boolean))) as string[]
    let stageMap: Record<string, { name: string }> = {}
    if (stageIds.length > 0) {
      const { data: stages } = await supabase
        .from('kanban_stages')
        .select('id, name')
        .in('id', stageIds)
      for (const st of stages || []) stageMap[st.id as string] = { name: st.name as string }
    }

    const items = (rows || []).map(r => ({
      id: r.id,
      completedAt: r.completed_at,
      initialStage: { id: r.initial_stage_id, name: stageMap[r.initial_stage_id as string]?.name || null },
      finalStage: { id: r.final_stage_id, name: stageMap[r.final_stage_id as string]?.name || null },
      totalDays: r.total_days ?? null,
      totalTasksCompleted: r.total_tasks_completed ?? null,
      title: (r.metadata as any)?.card_title || null,
      finalStageName: (r.metadata as any)?.final_stage_name || stageMap[r.final_stage_id as string]?.name || null
    }))

    const result = {
      page,
      pageSize,
      total: count ?? items.length,
      items
    }

    // Armazenar no cache
    await setCache(cacheKey, result, {
      ttl: 60, // 1 minuto
      prefix: 'students'
    })

    console.log('✅ [onboarding-history] Cache MISS - dados armazenados')
    return NextResponse.json(result, {
      headers: { 
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
      }
    })
  } catch (err) {
    console.error('❌ [HISTORY] unexpected_error', err)
    return NextResponse.json({ error: 'history_internal' }, { status: 500 })
  }
}


