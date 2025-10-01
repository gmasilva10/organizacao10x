import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

// Schema para atualizaÃ§Ã£o (todos os campos opcionais)

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UpdateOccurrenceTypeSchema = z.object({
  name: z.string().min(1, 'Nome Ã© obrigatÃ³rio').max(100, 'Nome deve ter no mÃ¡ximo 100 caracteres').optional(),
  description: z.string().max(500, 'DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres').optional(),
  group_id: z.number().int().positive('ID do grupo deve ser um nÃºmero positivo').optional(),
  applies_to: z.enum(['student', 'professional', 'both']).optional(),
  is_active: z.boolean().optional()
})

// GET - Buscar tipo especÃ­fico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: type, error } = await supabase
        .from('occurrence_types')
        .select(`
          *,
          occurrence_groups!inner(name)
        `)
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (error || !type) {
        return NextResponse.json({ error: 'Tipo nÃ£o encontrado' }, { status: 404 })
      }

      return NextResponse.json({ type })
    } catch (error) {
      console.error('Erro na API /occurrence-types/[id]:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

// PATCH - Atualizar tipo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.manage', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Buscar tipo atual para auditoria
      const { data: currentType } = await supabase
        .from('occurrence_types')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!currentType) {
        return NextResponse.json({ error: 'Tipo nÃ£o encontrado' }, { status: 404 })
      }

      // Validar dados
      const body = await request.json()
      const validatedData = UpdateOccurrenceTypeSchema.parse(body)

      // Verificar se nome Ã© Ãºnico (se estiver sendo alterado)
      if (validatedData.name && validatedData.name !== currentType.name) {
        const groupId = validatedData.group_id || currentType.group_id
        const { data: existingType } = await supabase
          .from('occurrence_types')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('group_id', groupId)
          .eq('name', validatedData.name)
          .neq('id', id)
          .single()

        if (existingType) {
          return NextResponse.json({ 
            error: 'Nome jÃ¡ existe', 
            details: 'JÃ¡ existe um tipo com este nome no grupo selecionado' 
          }, { status: 400 })
        }
      }

      // Verificar se grupo existe (se estiver sendo alterado)
      if (validatedData.group_id) {
        const { data: group } = await supabase
          .from('occurrence_groups')
          .select('id')
          .eq('id', validatedData.group_id)
          .eq('tenant_id', tenant_id)
          .single()

        if (!group) {
          return NextResponse.json({ 
            error: 'Grupo invÃ¡lido', 
            details: 'O grupo selecionado nÃ£o existe ou nÃ£o pertence Ã  sua organizaÃ§Ã£o' 
          }, { status: 400 })
        }
      }

      // Atualizar tipo
      const { data: updatedType, error } = await supabase
        .from('occurrence_types')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .select(`
          *,
          occurrence_groups!inner(name)
        `)
        .single()

      if (error) {
        console.error('Erro ao atualizar tipo:', error)
        return NextResponse.json({ error: 'Erro ao atualizar tipo' }, { status: 500 })
      }

      // Log de auditoria
      try {
        const changes: Record<string, any> = {}
        const previousValues: Record<string, any> = {}

        Object.keys(validatedData).forEach(key => {
          if (validatedData[key as keyof typeof validatedData] !== undefined) {
            const newValue = validatedData[key as keyof typeof validatedData]
            const oldValue = currentType[key as keyof typeof currentType]
            
            if (newValue !== oldValue) {
              changes[key] = newValue
              previousValues[key] = oldValue
            }
          }
        })

        if (Object.keys(changes).length > 0) {
          await auditLogger.log({
            action: 'update',
            entityType: 'occurrence_type',
            entityId: id,
            payload: {
              changes,
              previousValues
            },
            actorId: user.id,
            tenantId: tenant_id
          } as any, supabase)
        }
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      return NextResponse.json({ type: updatedType })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldMessages = error.issues.map(e => {
          const field = e.path.join('.')
          return `${field}: ${e.message}`
        }).join('; ')
        
        return NextResponse.json({ 
          error: 'Dados invÃ¡lidos',
          details: fieldMessages
        }, { status: 400 })
      }
      
      console.error('Erro na API /occurrence-types/[id]:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

// DELETE - Excluir tipo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.manage', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Verificar se tipo existe
      const { data: type } = await supabase
        .from('occurrence_types')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!type) {
        return NextResponse.json({ error: 'Tipo nÃ£o encontrado' }, { status: 404 })
      }

      // Verificar se hÃ¡ ocorrÃªncias vinculadas
      const { data: occurrences } = await supabase
        .from('student_occurrences')
        .select('id')
        .eq('type_id', id)
        .eq('tenant_id', tenant_id)
        .limit(1)

      if (occurrences && occurrences.length > 0) {
        return NextResponse.json({ 
          error: 'NÃ£o Ã© possÃ­vel excluir', 
          details: 'Este tipo possui ocorrÃªncias vinculadas. NÃ£o Ã© possÃ­vel excluÃ­-lo.' 
        }, { status: 400 })
      }

      // Excluir tipo
      const { error } = await supabase
        .from('occurrence_types')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant_id)

      if (error) {
        console.error('Erro ao excluir tipo:', error)
        return NextResponse.json({ error: 'Erro ao excluir tipo' }, { status: 500 })
      }

      // Log de auditoria
      try {
        await auditLogger.log({
          action: 'delete',
          entityType: 'occurrence_type',
          entityId: id,
          payload: {
            name: type.name,
            description: type.description,
            group_id: type.group_id
          },
          actorId: user.id,
          tenantId: tenant_id
        } as any, supabase)
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro na API /occurrence-types/[id]:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}
