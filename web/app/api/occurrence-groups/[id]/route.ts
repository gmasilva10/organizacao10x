import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'
import { auditLogger } from '@/lib/audit-logger'

// Schema para atualização (todos os campos opcionais)

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UpdateOccurrenceGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  is_active: z.boolean().optional()
})

// GET - Buscar grupo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      const { data: group, error } = await supabase
        .from('occurrence_groups')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (error || !group) {
        return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
      }

      return NextResponse.json({ group })
    } catch (error) {
      console.error('Erro na API /occurrence-groups/[id]:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

// PATCH - Atualizar grupo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.manage', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Buscar grupo atual para auditoria
      const { data: currentGroup } = await supabase
        .from('occurrence_groups')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!currentGroup) {
        return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
      }

      // Validar dados
      const body = await request.json()
      const validatedData = UpdateOccurrenceGroupSchema.parse(body)

      // Verificar se nome é único (se estiver sendo alterado)
      if (validatedData.name && validatedData.name !== currentGroup.name) {
        const { data: existingGroup } = await supabase
          .from('occurrence_groups')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('name', validatedData.name)
          .neq('id', id)
          .single()

        if (existingGroup) {
          return NextResponse.json({ 
            error: 'Nome já existe', 
            details: 'Já existe um grupo com este nome na sua organização' 
          }, { status: 400 })
        }
      }

      // Atualizar grupo
      const { data: updatedGroup, error } = await supabase
        .from('occurrence_groups')
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
        console.error('Erro ao atualizar grupo:', error)
        return NextResponse.json({ error: 'Erro ao atualizar grupo' }, { status: 500 })
      }

      // Log de auditoria
      try {
        const changes: Record<string, any> = {}
        const previousValues: Record<string, any> = {}

        Object.keys(validatedData).forEach(key => {
          if (validatedData[key as keyof typeof validatedData] !== undefined) {
            const newValue = validatedData[key as keyof typeof validatedData]
            const oldValue = currentGroup[key as keyof typeof currentGroup]
            
            if (newValue !== oldValue) {
              changes[key] = newValue
              previousValues[key] = oldValue
            }
          }
        })

        if (Object.keys(changes).length > 0) {
          await auditLogger.log({
            action: 'occurrence_group_updated',
            entityType: 'occurrence_group',
            entityId: id,
            payload: {
              changes,
              previousValues
            },
            actorId: user.id,
            tenantId: tenant_id
          })
        }
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      return NextResponse.json({ group: updatedGroup })
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
      
      console.error('Erro na API /occurrence-groups/[id]:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

// DELETE - Excluir grupo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withOccurrencesRBAC(request, 'occurrences.manage', async (request, { user, membership, tenant_id }) => {
    try {
      const { id } = await params
      const supabase = await createClient()

      // Verificar se grupo existe
      const { data: group } = await supabase
        .from('occurrence_groups')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!group) {
        return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
      }

      // Verificar se há tipos vinculados
      const { data: types } = await supabase
        .from('occurrence_types')
        .select('id')
        .eq('group_id', id)
        .eq('tenant_id', tenant_id)
        .limit(1)

      if (types && types.length > 0) {
        return NextResponse.json({ 
          error: 'Não é possível excluir', 
          details: 'Este grupo possui tipos de ocorrências vinculados. Exclua os tipos primeiro.' 
        }, { status: 400 })
      }

      // Excluir grupo
      const { error } = await supabase
        .from('occurrence_groups')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant_id)

      if (error) {
        console.error('Erro ao excluir grupo:', error)
        return NextResponse.json({ error: 'Erro ao excluir grupo' }, { status: 500 })
      }

      // Log de auditoria
      try {
        await auditLogger.log({
          action: 'occurrence_group_deleted',
          entityType: 'occurrence_group',
          entityId: id,
          payload: {
            name: group.name,
            description: group.description
          },
          actorId: user.id,
          tenantId: tenant_id
        })
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro na API /occurrence-groups/[id]:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}