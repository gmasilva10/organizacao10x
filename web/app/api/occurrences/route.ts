import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { QueryMonitor } from '@/lib/query-monitor'

// GET /api/occurrences
// Suporta filtros básicos para GATE 2 (escopo student)
export async function GET(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()

      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') // OPEN|DONE|all
      const groupId = searchParams.get('group_id')
      const typeId = searchParams.get('type_id')
      const from = searchParams.get('from')
      const to = searchParams.get('to')
      const hasReminder = searchParams.get('has_reminder') // yes|no|all
      const reminderFrom = searchParams.get('reminder_from')
      const reminderTo = searchParams.get('reminder_to')
      const reminderStatus = searchParams.get('reminder_status')
      const ownerId = searchParams.get('owner_id')
      const q = searchParams.get('q')?.trim() || ''
      const sortBy = searchParams.get('sort_by') || 'occurred_at'
      const sortOrder = searchParams.get('sort_order') || 'desc'
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
      const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') || '20', 10)))

      let query = supabase
        .from('student_occurrences')
        .select(`
          id,
          student_id,
          occurred_at,
          status,
          group_id,
          type_id,
          owner_user_id,
          notes,
          reminder_at,
          reminder_status,
          priority,
          is_sensitive
        `, { count: 'exact' })
        .eq('tenant_id', tenant_id)

      if (status && status !== 'all') query = query.eq('status', status)
      if (groupId) query = query.eq('group_id', groupId)
      if (typeId) query = query.eq('type_id', typeId)
      if (ownerId) query = query.eq('owner_user_id', ownerId)
      if (from) query = query.gte('occurred_at', from)
      if (to) query = query.lte('occurred_at', to)
      if (hasReminder === 'yes') query = query.not('reminder_at','is', null)
      if (hasReminder === 'no') query = query.is('reminder_at', null as any)
      if (reminderFrom) query = query.gte('reminder_at', reminderFrom)
      if (reminderTo) query = query.lte('reminder_at', reminderTo)
      if (reminderStatus && reminderStatus !== 'all') query = query.eq('reminder_status', reminderStatus)
      if (q) {
        // Busca simples por id ou notas (evitar joins profundos)
        const isNum = /^\d+$/.test(q)
        if (isNum) {
          query = query.or(`id.eq.${q},notes.ilike.%${q}%`)
        } else {
          query = query.ilike('notes', `%${q}%`)
        }
      }

      const fromIdx = (page - 1) * pageSize
      const toIdx = fromIdx + pageSize - 1
      console.log('🔍 Debug API /occurrences:', {
        status,
        tenant_id,
        page,
        pageSize,
        fromIdx,
        toIdx
      })

      const t0 = Date.now()
      const { data, error, count } = await QueryMonitor.monitorQuery(
        'list_occurrences',
        () => query
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range(fromIdx, toIdx),
        {
          userId: user.id,
          tenantId: tenant_id,
          operation: 'list_occurrences'
        }
      )

      console.log('🔍 Query result:', { data: data?.length, error, count })

      // Buscar nomes separadamente para evitar problemas com joins
      const studentIds = Array.from(new Set((data || []).map((r:any) => r.student_id).filter(Boolean)))
      const groupIds = Array.from(new Set((data || []).map((r:any) => r.group_id).filter(Boolean)))
      const typeIds = Array.from(new Set((data || []).map((r:any) => r.type_id).filter(Boolean)))
      const ownerIds = Array.from(new Set((data || []).map((r:any) => r.owner_user_id).filter(Boolean)))

      // Buscar estudantes
      const studentMap: Record<string,string> = {}
      if (studentIds.length) {
        const { data: students } = await supabase
          .from('students')
          .select('id, name')
          .in('id', studentIds)
          .eq('tenant_id', tenant_id)
        for (const s of students || []) studentMap[s.id] = s.name
      }

      // Buscar grupos
      const groupMap: Record<string,string> = {}
      if (groupIds.length) {
        const { data: groups } = await supabase
          .from('occurrence_groups')
          .select('id, name')
          .in('id', groupIds)
          .eq('tenant_id', tenant_id)
        for (const g of groups || []) groupMap[g.id] = g.name
      }

      // Buscar tipos
      const typeMap: Record<string,string> = {}
      if (typeIds.length) {
        const { data: types } = await supabase
          .from('occurrence_types')
          .select('id, name')
          .in('id', typeIds)
          .eq('tenant_id', tenant_id)
        for (const t of types || []) typeMap[t.id] = t.name
      }

      // Buscar responsáveis
      const ownerMap: Record<string,string> = {}
      if (ownerIds.length) {
        const { data: owners } = await supabase
          .from('professionals')
          .select('user_id, full_name')
          .in('user_id', ownerIds)
          .eq('tenant_id', tenant_id)
        for (const o of owners || []) ownerMap[o.user_id] = o.full_name
      }

      // Montar resposta com nomes
      const enrichedData = (data || []).map((row: any) => ({
        ...row,
        student_name: studentMap[row.student_id] || null,
        group_name: groupMap[row.group_id] || null,
        type_name: typeMap[row.type_id] || null,
        owner_name: ownerMap[row.owner_user_id] || null
      }))

      const ms = Date.now() - t0
      return NextResponse.json({
        data: enrichedData,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      }, { 
        headers: { 
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60', 
          'X-Query-Time': String(ms),
          'X-Row-Count': String(enrichedData.length),
          'X-Cache-Hit': 'false'
        } 
      })

    } catch (error) {
      console.error('Erro na API /occurrences:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}