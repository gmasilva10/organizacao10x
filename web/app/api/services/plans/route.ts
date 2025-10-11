/**
 * GATE 10.9 - Plans API
 * CRUD completo de planos de venda para mapeamento com integrações
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'
import { resolveRequestContext } from '@/server/context'
import { z } from 'zod'

// Schema de validação para criação/atualização de planos
const PlanSchema = z.object({
  nome: z.string().min(1, 'Nome do plano é obrigatório'),
  descricao: z.string().optional(),
  custom_value: z.boolean().default(false),  // ADICIONAR
  valor: z.number().positive('Valor deve ser positivo').nullable(),  // MODIFICAR: permitir null
  moeda: z.string().default('BRL'),
  ciclo: z.enum(['mensal', 'trimestral', 'semestral', 'anual']).nullable().optional(),  // MODIFICAR: nullable
  ativo: z.boolean().default(true),
  category_id: z.string().uuid('ID da categoria inválido'),
  tipo: z.enum(['receita', 'despesa']).default('receita')
}).refine((data) => {
  // ADICIONAR: Validação customizada
  // Se custom_value = false, valor deve ser positivo
  if (!data.custom_value && (!data.valor || data.valor <= 0)) {
    return false
  }
  // Se custom_value = true, valor deve ser null
  if (data.custom_value && data.valor !== null) {
    return false
  }
  return true
}, {
  message: 'Valor inválido: para valor customizado use null, para valor fixo use valor positivo',
  path: ['valor']
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
      .from('plans')
      .select('*')
      .eq('org_id', ctx.org_id)
      .order('nome')
    
    if (error) throw error
    
    return NextResponse.json({
      plans: data || []
    })
    
  } catch (error: any) {
    console.error('[PLANS API GET] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar planos',
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

    // Verificar permissões (apenas admin/manager podem criar planos)
    if (!['admin', 'manager'].includes(ctx.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const body = await request.json()
    const validatedData = PlanSchema.parse(body)
    
    // Gerar código do plano automaticamente (sequencial de 3 dígitos)
    // Buscar todos os códigos existentes para esta organização
    const { data: existingPlans } = await supabase
      .from('plans')
      .select('plan_code')
      .eq('org_id', ctx.org_id)
    
    console.log('🔍 [DEBUG] Planos existentes:', existingPlans)
    
    // Encontrar o próximo código disponível
    let nextCode = '001'
    if (existingPlans && existingPlans.length > 0) {
      const existingCodes = existingPlans.map(p => parseInt(p.plan_code)).sort((a, b) => b - a)
      const lastCode = existingCodes[0]
      nextCode = String(lastCode + 1).padStart(3, '0')
    }
    
    console.log('🔍 [DEBUG] Próximo código gerado:', nextCode)
    
    const { data, error } = await supabase
      .from('plans')
      .insert({
        ...validatedData,
        plan_code: nextCode,
        org_id: ctx.org_id,
        created_by: ctx.userId
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      plan: data,
      message: 'Plano criado com sucesso'
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('[PLANS API POST] Error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Erro ao criar plano',
      details: error.message
    }, { status: 500 })
  }
}

