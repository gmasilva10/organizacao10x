/**
 * GATE 10.8 - Financial Categories API - Operações individuais
 * GET, PUT, DELETE para categorias específicas
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'

// Schema de validação para atualização de categorias
const CategoryUpdateSchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(50, 'Nome muito longo').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hex válido (#RRGGBB)').optional(),
  active: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientAdmin()
    const { id } = await params
    
    // Obter org_id do contexto
    const ctx = await resolveRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { data, error } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
      }
      throw error
    }
    
    return NextResponse.json({ category: data })
    
  } catch (error: any) {
    console.error('[CATEGORIES API GET] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar categoria',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientAdmin()
    const { id } = await params
    
    // Obter org_id do contexto
    const ctx = await resolveRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões (apenas admin/manager podem atualizar categorias)
    if (!['admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = CategoryUpdateSchema.parse(body)
    
    // Verificar se categoria existe e pertence à organização
    const { data: existingCategory } = await supabase
      .from('financial_categories')
      .select('id, name, is_system')
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }
    
    // Se estiver alterando o nome, verificar se não existe duplicata
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const { data: duplicateCategory } = await supabase
        .from('financial_categories')
        .select('id')
        .eq('org_id', ctx.org_id)
        .eq('name', validatedData.name)
        .neq('id', id)
        .single()
      
      if (duplicateCategory) {
        return NextResponse.json({
          error: 'Já existe uma categoria com este nome'
        }, { status: 400 })
      }
    }
    
    // Não permitir desativar categoria do sistema
    if (existingCategory.is_system && validatedData.active === false) {
      return NextResponse.json({
        error: 'Não é possível desativar categoria do sistema'
      }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('financial_categories')
      .update(validatedData)
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      category: data,
      message: 'Categoria atualizada com sucesso'
    })
    
  } catch (error: any) {
    console.error('[CATEGORIES API PUT] Error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Erro ao atualizar categoria',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClientAdmin()
    const { id } = await params
    
    // Obter org_id do contexto
    const ctx = await resolveRequestContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissões (apenas admin/manager podem deletar categorias)
    if (!['admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    // Verificar se categoria existe e pertence à organização
    const { data: existingCategory } = await supabase
      .from('financial_categories')
      .select('id, name, is_system')
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (!existingCategory) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 })
    }
    
    // Não permitir deletar categoria do sistema
    if (existingCategory.is_system) {
      return NextResponse.json({
        error: 'Não é possível deletar categoria do sistema'
      }, { status: 400 })
    }
    
    // Verificar se há planos vinculados à categoria
    const { data: linkedPlans } = await supabase
      .from('plans')
      .select('id, nome')
      .eq('category_id', id)
      .limit(1)
    
    if (linkedPlans && linkedPlans.length > 0) {
      return NextResponse.json({
        error: 'Não é possível deletar categoria com planos vinculados. Altere os planos ou desative a categoria.'
      }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('financial_categories')
      .delete()
      .eq('id', id)
      .eq('org_id', ctx.org_id)
    
    if (error) throw error
    
    return NextResponse.json({
      message: 'Categoria deletada com sucesso'
    })
    
  } catch (error: any) {
    console.error('[CATEGORIES API DELETE] Error:', error)
    return NextResponse.json({
      error: 'Erro ao deletar categoria',
      details: error.message
    }, { status: 500 })
  }
}
