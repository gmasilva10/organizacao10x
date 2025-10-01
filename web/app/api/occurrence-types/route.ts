import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withOccurrencesRBAC } from '@/server/withOccurrencesRBAC'
import { z } from 'zod'

// Schema de validaÃ§Ã£o para criaÃ§Ã£o/atualizaÃ§Ã£o

// ForÃ§ar execuÃ§Ã£o dinÃ¢mica para evitar problemas de renderizaÃ§Ã£o estÃ¡tica
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OccurrenceTypeSchema = z.object({
  name: z.string().min(1, 'Nome Ã© obrigatÃ³rio').max(100, 'Nome deve ter no mÃ¡ximo 100 caracteres'),
  description: z.string().max(500, 'DescriÃ§Ã£o deve ter no mÃ¡ximo 500 caracteres').optional(),
  group_id: z.number().int().positive('ID do grupo deve ser um nÃºmero positivo'),
  applies_to: z.enum(['student','professional','both']).default('student'),
  is_active: z.boolean().default(true)
})

// GET - Listar tipos de ocorrÃªncias (com filtros)
export async function GET(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()
      
      const { searchParams } = new URL(request.url)
      const appliesFilter = searchParams.get('applies_to') || 'all' // student|professional|both|all
      const contextFor = searchParams.get('for') // student|professional (atalho para IN (...,'both'))
      const statusFilter = searchParams.get('status') || 'active' // active|inactive|all
      const q = searchParams.get('query')?.trim() || ''
      const groupIdParam = searchParams.get('group_id')

      // Buscar tipos do tenant com informaÃ§Ãµes do grupo
      let query = supabase
        .from('occurrence_types')
        .select(`
          *,
          occurrence_groups!inner (
            id,
            name,
            description,
            is_active
          )
        `)
        .eq('tenant_id', tenant_id)

      if (contextFor === 'student') {
        query = query.in('applies_to', ['student','both'])
      } else if (contextFor === 'professional') {
        query = query.in('applies_to', ['professional','both'])
      } else if (appliesFilter !== 'all') {
        query = query.eq('applies_to', appliesFilter)
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }
      if (groupIdParam) {
        const gid = Number(groupIdParam)
        if (!Number.isNaN(gid)) query = query.eq('group_id', gid)
      }
      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      }

      const { data: types, error } = await query.order('name', { ascending: true })

      if (error) {
        console.error('Erro ao buscar tipos:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
      }

      // Processar dados para incluir nome do grupo
      const processedTypes = types?.map(type => ({
        ...type,
        group_name: type.occurrence_groups?.name || 'Grupo nÃ£o encontrado'
      })) || []

      return NextResponse.json({ types: processedTypes })
    } catch (error) {
      console.error('Erro na API de tipos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}

// POST - Criar novo tipo
export async function POST(request: NextRequest) {
  return withOccurrencesRBAC(request, 'occurrences.manage', async (request, { user, membership, tenant_id }) => {
    try {
      const supabase = await createClient()

      // Validar dados
      const body = await request.json()
      const validatedData = OccurrenceTypeSchema.parse(body)

      // Verificar se grupo existe e pertence ao tenant
      const { data: group } = await supabase
        .from('occurrence_groups')
        .select('id')
        .eq('id', validatedData.group_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (!group) {
        return NextResponse.json({ error: 'Grupo nÃ£o encontrado' }, { status: 404 })
      }

      // Verificar se nome jÃ¡ existe no grupo
      const { data: existingType } = await supabase
        .from('occurrence_types')
        .select('id')
        .eq('group_id', validatedData.group_id)
        .eq('name', validatedData.name)
        .eq('tenant_id', tenant_id)
        .single()

      if (existingType) {
        return NextResponse.json({ error: 'JÃ¡ existe um tipo com este nome neste grupo' }, { status: 409 })
      }

      // Criar tipo
      const { data: newType, error } = await supabase
        .from('occurrence_types')
        .insert({
          ...validatedData,
          tenant_id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar tipo:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
      }

      return NextResponse.json(newType, { status: 201 })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Dados invÃ¡lidos', 
          details: error.issues 
        }, { status: 400 })
      }
      
      console.error('Erro na API de tipos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  })
}
