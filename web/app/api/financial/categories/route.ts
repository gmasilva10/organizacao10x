/**
 * GATE 10.8 - Financial Categories API
 * CRUD completo de categorias financeiras
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'

// Schema de validação para criação/atualização de categorias
const CategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(50, 'Nome muito longo'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hex válido (#RRGGBB)'),
  active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // Obter org_id do contexto
    const ctx = await resolveRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { data, error } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('org_id', ctx.org_id)
      .order('is_system', { ascending: false }) // Categorias do sistema primeiro
      .order('name')
    
    if (error) throw error
    
    return NextResponse.json({
      categories: data || []
    })
    
  } catch (error: any) {
    console.error('[CATEGORIES API GET] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar categorias',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // Obter org_id do contexto
    const ctx = await resolveRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões (apenas admin/manager podem criar categorias)
    if (!['admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = CategorySchema.parse(body)
    
    // Verificar se já existe categoria com o mesmo nome na organização
    const { data: existingCategory } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('org_id', ctx.org_id)
      .eq('name', validatedData.name)
      .single()
    
    if (existingCategory) {
      return NextResponse.json({
        error: 'Já existe uma categoria com este nome'
      }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('financial_categories')
      .insert({
        ...validatedData,
        org_id: ctx.org_id,
        is_system: false // Categorias criadas pelo usuário não são do sistema
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      category: data,
      message: 'Categoria criada com sucesso'
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('[CATEGORIES API POST] Error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Erro ao criar categoria',
      details: error.message
    }, { status: 500 })
  }
}
