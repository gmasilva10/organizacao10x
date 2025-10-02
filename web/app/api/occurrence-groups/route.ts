import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'

// Schema de validação para criação/atualização

// Forçar execução dinâmica para evitar problemas de renderização estática
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OccurrenceGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  is_active: z.boolean().default(true)
})

// Schema para atualização (todos os campos opcionais)
const UpdateOccurrenceGroupSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  is_active: z.boolean().optional()
})

// GET - Listar grupos de ocorrências (com filtros)
export async function GET(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()
      
      const { searchParams } = new URL(request.url)
      const statusFilter = searchParams.get('status') || 'active' // active|inactive|all
      const q = searchParams.get('query')?.trim() || ''

      // Buscar grupos do tenant com contagem de tipos
      let query = supabase
        .from('occurrence_groups')
        .select(`
          *,
          occurrence_types(count)
        `)
        .eq('org_id', tenant_id)

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }
      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      }

      const { data: groups, error } = await query.order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar grupos:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
      }

      // Processar dados para incluir contagem de tipos
      const processedGroups = groups?.map(group => ({
        ...group,
        types_count: group.occurrence_types?.[0]?.count || 0
      })) || []

      return NextResponse.json({ groups: processedGroups })
    } catch (error) {
      console.error('Erro na API de grupos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

// POST - Criar novo grupo
export async function POST(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.manage', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()

      // Validar dados
      const body = await request.json()
      const validatedData = OccurrenceGroupSchema.parse(body)

      // Verificar se nome já existe no tenant
      const { data: existingGroup } = await supabase
        .from('occurrence_groups')
        .select('id')
        .eq('name', validatedData.name)
        .eq('org_id', tenant_id)
        .single()

      if (existingGroup) {
        return NextResponse.json({ error: 'Já existe um grupo com este nome' }, { status: 409 })
      }

      // Criar grupo
      const { data: newGroup, error } = await supabase
        .from('occurrence_groups')
        .insert({
          ...validatedData,
          tenant_id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar grupo:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
      }

      return NextResponse.json(newGroup, { status: 201 })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Dados inválidos', 
          details: error.issues 
        }, { status: 400 })
      }
      
      console.error('Erro na API de grupos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

