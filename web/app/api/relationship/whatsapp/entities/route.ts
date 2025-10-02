import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  const type = searchParams.get('type') // optional: CONTACT | GROUP
  if (!studentId) return NextResponse.json({ error: 'studentId é obrigatório' }, { status: 400 })
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    let query = supabase
      .from('relationship_whatsapp_entities')
      .select('id, type, wa_id, name, phone_e164, is_default')
      .eq('student_id', studentId)
      .order('is_default', { ascending: false })

    if (type) query = query.eq('type', type)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Falha ao listar entidades' }, { status: 500 })

    return NextResponse.json({ entities: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}



