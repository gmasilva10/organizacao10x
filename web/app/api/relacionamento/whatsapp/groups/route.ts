import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({ error: 'studentId é obrigatório' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 1) Buscar vínculos do aluno (RLS garante isolamento por tenant)
    const { data: links, error: linkErr } = await supabase
      .from('student_whatsapp_groups')
      .select('group_id, is_primary')
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false })

    if (linkErr) {
      return NextResponse.json({ error: 'Erro ao buscar vínculos de grupos' }, { status: 500 })
    }

    const groupIds = (links || []).map((l: any) => l.group_id)
    if (groupIds.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    // 2) Buscar grupos por ids
    const { data: groupsData, error: gErr } = await supabase
      .from('whatsapp_groups')
      .select('id, name, external_id')
      .in('id', groupIds)

    if (gErr) {
      return NextResponse.json({ error: 'Erro ao buscar dados dos grupos' }, { status: 500 })
    }

    const groups = (groupsData || []).map((g) => ({
      id: g.id,
      name: g.name,
      external_id: (g as any).external_id,
      is_primary: !!(links || []).find((l: any) => l.group_id === g.id)?.is_primary,
    }))

    return NextResponse.json({ groups })
  } catch (e) {
    console.error('Erro ao listar grupos do aluno:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}


