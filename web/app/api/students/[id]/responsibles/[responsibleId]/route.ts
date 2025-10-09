import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRequestContext } from '@/server/context'

// DELETE /api/students/[id]/responsibles/[responsibleId] - Remover responsável
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responsibleId: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const { id: studentId, responsibleId } = await params
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const supabase = createClient(url, key)

    // Verificar se o responsável pertence ao tenant e ao aluno
    const { data: responsible, error: responsibleError } = await supabase
      .from('student_responsibles')
      .select('id, student_id, role, professionals!inner(full_name)')
      .eq('id', responsibleId)
      .eq('student_id', studentId)
      .eq('org_id', ctx.org_id)
      .single()

    if (responsibleError || !responsible) {
      return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 })
    }

    // Deletar o responsável
    const { error: deleteError } = await supabase
      .from('student_responsibles')
      .delete()
      .eq('id', responsibleId)
      .eq('org_id', ctx.org_id)

    if (deleteError) {
      console.error('Erro ao deletar responsável:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar responsável' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Responsável removido com sucesso',
      removed: {
        id: responsibleId,
        role: responsible.role,
        professional_name: (Array.isArray((responsible as any).professionals) ? (responsible as any).professionals[0]?.full_name : (responsible as any).professionals?.full_name)
      }
    })

  } catch (error: any) {
    console.error('Erro na API DELETE /students/[id]/responsibles/[responsibleId]:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// PATCH /api/students/[id]/responsibles/[responsibleId] - Atualizar responsável
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responsibleId: string }> }
) {
  const ctx = await resolveRequestContext(request)
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  try {
    const { id: studentId, responsibleId } = await params
    const body = await request.json()
    const { role, note } = body

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    if (!url || !key) return NextResponse.json({ error: "service_unavailable" }, { status: 503 })

    const supabase = createClient(url, key)

    // Verificar se o responsável pertence ao tenant e ao aluno
    const { data: existing, error: existingError } = await supabase
      .from('student_responsibles')
      .select('id, student_id, role, professional_id')
      .eq('id', responsibleId)
      .eq('student_id', studentId)
      .eq('org_id', ctx.org_id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Responsável não encontrado' }, { status: 404 })
    }

    // Se mudando para principal, remover o principal atual
    if (role === 'principal' && existing.role !== 'principal') {
      await supabase
        .from('student_responsibles')
        .delete()
        .eq('student_id', studentId)
        .eq('org_id', ctx.org_id)
        .eq('role', 'principal')
        .neq('id', responsibleId)
    }

    // Atualizar o responsável
    const updateData: any = {}
    if (role) updateData.role = role
    if (note !== undefined) updateData.note = note

    const { data: updated, error: updateError } = await supabase
      .from('student_responsibles')
      .update(updateData)
      .eq('id', responsibleId)
      .eq('org_id', ctx.org_id)
      .select(`
        id,
        role,
        note,
        created_at,
        professional_id,
        professionals!inner(
          id,
          full_name,
          email,
          whatsapp_work,
          is_active
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar responsável:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar responsável' }, { status: 500 })
    }

    return NextResponse.json({
      responsible: updated,
      message: 'Responsável atualizado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro na API PATCH /students/[id]/responsibles/[responsibleId]:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}
