/**
 * GATE 10.9 - Plans API - Operações individuais
 * GET, PUT, DELETE para planos específicos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'

// Schema de validação para atualização de planos
const PlanUpdateSchema = z.object({
  plan_code: z.string().min(1, 'Código do plano é obrigatório').optional(),
  nome: z.string().min(1, 'Nome do plano é obrigatório').optional(),
  descricao: z.string().optional(),
  valor: z.number().positive('Valor deve ser positivo').optional(),
  moeda: z.string().optional(),
  ciclo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).optional(),
  duracao_em_ciclos: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
  category_id: z.string().uuid('ID da categoria inválido').optional(),
  tipo: z.enum(['receita', 'despesa']).optional()
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
      .from('plans')
      .select('*')
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
      }
      throw error
    }
    
    return NextResponse.json({ plan: data })
    
  } catch (error: any) {
    console.error('[PLANS API GET] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar plano',
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

    // Verificar permissões (apenas admin/manager podem editar planos)
    if (!['admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = PlanUpdateSchema.parse(body)
    
    // Verificar se o plano existe e pertence à organização
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id, plan_code')
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }
    
    // Se está alterando o código, verificar se não conflita com outro plano
    if (validatedData.plan_code && validatedData.plan_code !== existingPlan.plan_code) {
      const { data: conflictingPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('org_id', ctx.org_id)
        .eq('plan_code', validatedData.plan_code)
        .neq('id', id)
        .single()
      
      if (conflictingPlan) {
        return NextResponse.json({
          error: 'Código do plano já existe',
          details: 'Já existe outro plano com este código'
        }, { status: 409 })
      }
    }
    
    const { data, error } = await supabase
      .from('plans')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      plan: data,
      message: 'Plano atualizado com sucesso'
    })
    
  } catch (error: any) {
    console.error('[PLANS API PUT] Error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Erro ao atualizar plano',
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

    // Verificar permissões (apenas admin/manager podem deletar planos)
    if (!['admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    // Verificar se o plano existe e pertence à organização
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('id', id)
      .eq('org_id', ctx.org_id)
      .single()
    
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }
    
    // Verificar se o plano está sendo usado em contratos ativos
    const { data: activeContracts } = await supabase
      .from('student_plan_contracts')
      .select('id')
      .eq('plan_id', id)
      .eq('ativo', true)
      .limit(1)
    
    if (activeContracts && activeContracts.length > 0) {
      return NextResponse.json({
        error: 'Não é possível excluir plano',
        details: 'Este plano está sendo usado em contratos ativos'
      }, { status: 409 })
    }
    
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id)
      .eq('org_id', ctx.org_id)
    
    if (error) throw error
    
    return NextResponse.json({
      message: 'Plano excluído com sucesso'
    })
    
  } catch (error: any) {
    console.error('[PLANS API DELETE] Error:', error)
    return NextResponse.json({
      error: 'Erro ao excluir plano',
      details: error.message
    }, { status: 500 })
  }
}
