import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

const closeSchema = z.object({
  resolved_at: z.string().datetime(),
  resolution_outcome: z.enum(['resolved','notified','no_response','rescheduled','cancelled','other']),
  resolution_notes: z.string().max(500).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withOccurrencesRBAC(request, 'occurrences.close', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()

      const body = await request.json()
      const data = closeSchema.parse(body)

      const { data: existing } = await supabase
        .from('student_occurrences')
        .select('id, student_id, owner_user_id')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()
      
      if (!existing) return NextResponse.json({ error: 'Ocorrência não encontrada' }, { status: 404 })

      // Verificar permissões específicas de encerramento
      const canClose = membership.role === 'admin' || 
                      membership.role === 'manager' || 
                      existing.owner_user_id === user.id

      if (!canClose) {
        return NextResponse.json({ 
          error: 'Acesso negado', 
          details: 'Apenas administradores, gerentes ou o responsável pela ocorrência podem encerrá-la' 
        }, { status: 403 })
      }

      const { error } = await supabase
        .from('student_occurrences')
        .update({
          status: 'DONE',
          resolved_at: data.resolved_at,
          resolved_by: user.id,
          resolution_outcome: data.resolution_outcome,
          resolution_notes: data.resolution_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id)

      if (error) {
        console.error('Erro ao encerrar ocorrência:', error)
        return NextResponse.json({ error: 'Erro ao encerrar ocorrência' }, { status: 500 })
      }

      // Log de auditoria
      try {
        await auditLogger.logOccurrenceClosed(
          id,
          user.id,
          tenant_id,
          {
            resolutionOutcome: data.resolution_outcome,
            resolutionNotes: data.resolution_notes || '',
            closedAt: data.resolved_at
          }
        )
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
        // Não falha a operação por erro de auditoria
      }

      return NextResponse.json({ ok: true })

    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Dados inválidos', 
          details: e.errors 
        }, { status: 400 })
      }
      
      console.error('Erro interno ao encerrar ocorrência:', e)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}