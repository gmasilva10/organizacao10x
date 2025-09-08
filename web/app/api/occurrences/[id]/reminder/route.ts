import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

// Schema para atualização de lembrete
const UpdateReminderSchema = z.object({
  reminder_at: z.string().datetime().optional(),
  reminder_status: z.enum(['PENDING', 'DONE', 'CANCELLED']).optional()
})

// PATCH - Atualizar lembrete
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.write', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Buscar ocorrência atual para auditoria
      const { data: currentOccurrence } = await supabase
        .from('student_occurrences')
        .select('id, reminder_at, reminder_status, reminder_created_by')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!currentOccurrence) {
        return NextResponse.json({ error: 'Ocorrência não encontrada' }, { status: 404 })
      }

      // Validar dados
      const body = await request.json()
      const validatedData = UpdateReminderSchema.parse(body)

      // Atualizar lembrete
      const { data: updatedOccurrence, error } = await supabase
        .from('student_occurrences')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar lembrete:', error)
        return NextResponse.json({ error: 'Erro ao atualizar lembrete' }, { status: 500 })
      }

      // Log de auditoria
      try {
        const changes: Record<string, any> = {}
        const previousValues: Record<string, any> = {}

        Object.keys(validatedData).forEach(key => {
          if (validatedData[key as keyof typeof validatedData] !== undefined) {
            const newValue = validatedData[key as keyof typeof validatedData]
            const oldValue = currentOccurrence[key as keyof typeof currentOccurrence]
            
            if (newValue !== oldValue) {
              changes[key] = newValue
              previousValues[key] = oldValue
            }
          }
        })

        if (Object.keys(changes).length > 0) {
          await auditLogger.logReminderUpdated(
            id,
            user.id,
            tenant_id,
            {
              changes,
              previousValues
            }
          )
        }
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      return NextResponse.json({ success: true, occurrence: updatedOccurrence })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldMessages = error.errors.map(e => {
          const field = e.path.join('.')
          return `${field}: ${e.message}`
        }).join('; ')
        
        return NextResponse.json({ 
          error: 'Dados inválidos',
          details: fieldMessages
        }, { status: 400 })
      }
      
      console.error('Erro na API /occurrences/[id]/reminder:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}