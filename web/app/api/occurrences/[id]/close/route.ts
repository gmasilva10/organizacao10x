import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const closeSchema = z.object({
  resolved_at: z.string().datetime(),
  resolution_outcome: z.enum(['resolved','notified','no_response','rescheduled','cancelled','other']),
  resolution_notes: z.string().max(500).optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withOccurrencesRBAC(request, 'occurrences.close', async (request, { user, membership, org_id }) => {
    try {
      const supabase = await createClient()

      const body = await request.json()
      const data = closeSchema.parse(body)

      const { data: existing } = await supabase
        .from('student_occurrences')
        .select('id, student_id, owner_user_id')
        .eq('id', id)
        .eq('org_id', org_id)
        .single()
      
      if (!existing) return NextResponse.json({ error: 'OcorrÃªncia nÃ£o encontrada' }, { status: 404 })

      // Verificar permissÃµes especÃ­ficas de encerramento
      const canClose = membership.role === 'admin' || 
                      membership.role === 'manager' || 
                      existing.owner_user_id === user.id

      if (!canClose) {
        return NextResponse.json({ 
          error: 'Acesso negado', 
          details: 'Apenas administradores, gerentes ou o responsÃ¡vel pela ocorrÃªncia podem encerrÃ¡-la' 
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
        .eq('org_id', org_id)

      if (error) {
        console.error('Erro ao encerrar ocorrÃªncia:', error)
        return NextResponse.json({ error: 'Erro ao encerrar ocorrÃªncia' }, { status: 500 })
      }

      // Log de auditoria
      try {
        await auditLogger.log({
          organization_id: org_id,
          user_id: user.id,
          action: 'update',
          resource_type: 'occurrence' as any,
          resource_id: id,
          payload_after: {
            status: 'DONE',
            resolutionOutcome: (data as any).resolution_outcome,
            resolutionNotes: (data as any).resolution_notes || '',
            closedAt: (data as any).resolved_at
          }
        } as any, supabase)
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
        // NÃ£o falha a operaÃ§Ã£o por erro de auditoria
      }

      return NextResponse.json({ ok: true })

    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Dados invÃ¡lidos', 
          details: e.issues 
        }, { status: 400 })
      }
      
      console.error('Erro interno ao encerrar ocorrÃªncia:', e)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}
