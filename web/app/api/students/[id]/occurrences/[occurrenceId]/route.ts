import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const updateOccurrenceSchema = z.object({
  group_id: z.number().int().positive().optional(),
  type_id: z.number().int().positive().optional(),
  occurred_at: z.string().refine((date) => {
    const occurrenceDate = new Date(date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return occurrenceDate <= today
  }, {
    message: "Data da ocorrÃªncia nÃ£o pode ser futura"
  }).optional(),
  notes: z.string().min(5).max(500).optional(),
  // Aceitar string numÃ©rica do front
  owner_user_id: z.coerce.number().int().positive().optional(),
  priority: z.enum(['low','medium','high']).optional(),
  is_sensitive: z.boolean().optional(),
  reminder_at: z.string().datetime().nullable().optional(),
  status: z.enum(['OPEN', 'DONE']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, occurrenceId: string }> }
) {
  try {
    const { id: studentId, occurrenceId } = await params
    const supabase = await createClient()
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membro nÃ£o encontrado' }, { status: 404 })
    }

    // Buscar ocorrÃªncia
    const { data: occurrence, error } = await supabase
      .from('student_occurrences')
      .select(`
        *,
        group_id,
        type_id,
        owner_user_id
      `)
      .eq('id', occurrenceId)
      .eq('org_id', membership.tenant_id)
      .eq('student_id', studentId)
      .single()

    if (error) {
      console.error('Erro ao buscar ocorrÃªncia:', error)
      return NextResponse.json({ error: 'OcorrÃªncia nÃ£o encontrada' }, { status: 404 })
    }

    return NextResponse.json({ occurrence })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, occurrenceId: string }> }
) {
  try {
    const { id: studentId, occurrenceId } = await params
    const supabase = await createClient()
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membro nÃ£o encontrado' }, { status: 404 })
    }

    // Verificar se a ocorrÃªncia existe
    const { data: existingOccurrence } = await supabase
      .from('student_occurrences')
      .select('id, status')
      .eq('id', occurrenceId)
      .eq('org_id', membership.tenant_id)
      .eq('student_id', studentId)
      .single()

    if (!existingOccurrence) {
      return NextResponse.json({ error: 'OcorrÃªncia nÃ£o encontrada' }, { status: 404 })
    }

    // Validar dados
    const body = await request.json()
    const validatedData = updateOccurrenceSchema.parse(body)

    // Verificar se o responsÃ¡vel Ã© vÃ¡lido (se fornecido)
    let ownerUserId = undefined
    if (validatedData.owner_user_id) {
      const { data: professional } = await supabase
        .from('professionals')
        .select('id, user_id')
        .eq('id', validatedData.owner_user_id)
        .eq('org_id', membership.tenant_id)
        .single()

      if (!professional) {
        return NextResponse.json({ error: 'ResponsÃ¡vel nÃ£o encontrado' }, { status: 400 })
      }
      ownerUserId = professional.user_id
    }

    // Atualizar ocorrÃªncia
    const { data: updatedOccurrence, error } = await supabase
      .from('student_occurrences')
      .update({
        ...validatedData,
        owner_user_id: ownerUserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', occurrenceId)
      .eq('org_id', membership.tenant_id)
      .eq('student_id', studentId)
      .select(`
        *,
        group_id,
        type_id,
        owner_user_id
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar ocorrÃªncia:', error)
      return NextResponse.json({ error: 'Erro ao atualizar ocorrÃªncia' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'OcorrÃªncia atualizada com sucesso',
      occurrence: updatedOccurrence
    })
  } catch (error) {
    console.error('Erro na API:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados invÃ¡lidos',
        details: error.issues
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, occurrenceId: string }> }
) {
  try {
    const { id: studentId, occurrenceId } = await params
    const supabase = await createClient()
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
    }

    // Verificar membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Membro nÃ£o encontrado' }, { status: 404 })
    }

    // Verificar se a ocorrÃªncia existe
    const { data: existingOccurrence } = await supabase
      .from('student_occurrences')
      .select('id')
      .eq('id', occurrenceId)
      .eq('org_id', membership.tenant_id)
      .eq('student_id', studentId)
      .single()

    if (!existingOccurrence) {
      return NextResponse.json({ error: 'OcorrÃªncia nÃ£o encontrada' }, { status: 404 })
    }

    // Deletar ocorrÃªncia
    const { error } = await supabase
      .from('student_occurrences')
      .delete()
      .eq('id', occurrenceId)
      .eq('org_id', membership.tenant_id)
      .eq('student_id', studentId)

    if (error) {
      console.error('Erro ao deletar ocorrÃªncia:', error)
      return NextResponse.json({ error: 'Erro ao deletar ocorrÃªncia' }, { status: 500 })
    }

    return NextResponse.json({ message: 'OcorrÃªncia deletada com sucesso' })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
