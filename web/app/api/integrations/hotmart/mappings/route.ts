/**
 * GATE 10.9 - Hotmart Product Mappings
 * CRUD de mapeamentos: Produto Hotmart → Plano Interno
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

// GET - Listar todos os mapeamentos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // TODO: Obter org_id do contexto
    const org_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    
    const { data, error } = await supabase
      .from('hotmart_product_mappings')
      .select(`
        *,
        plan:internal_plan_id (
          id,
          plan_code,
          nome,
          valor,
          ciclo
        )
      `)
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json({
      mappings: data || []
    })
    
  } catch (error: any) {
    console.error('[HOTMART MAPPINGS GET] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar mapeamentos',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Criar novo mapeamento
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    const body = await request.json()
    
    const {
      hotmart_product_id,
      hotmart_product_name,
      hotmart_product_ucode,
      internal_plan_id,
      auto_create_student = true,
      auto_activate = true,
      trigger_onboarding = true,
      send_welcome_email = true,
      send_welcome_whatsapp = true
    } = body
    
    // Validar campos obrigatórios
    if (!hotmart_product_id || !internal_plan_id) {
      return NextResponse.json({
        error: 'Campos obrigatórios: hotmart_product_id, internal_plan_id'
      }, { status: 400 })
    }
    
    // TODO: Obter org_id do contexto
    const org_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    
    // Criar mapeamento
    const { data, error } = await supabase
      .from('hotmart_product_mappings')
      .insert({
        org_id,
        hotmart_product_id,
        hotmart_product_name,
        hotmart_product_ucode,
        internal_plan_id,
        auto_create_student,
        auto_activate,
        trigger_onboarding,
        send_welcome_email,
        send_welcome_whatsapp
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({
          error: 'Este produto já está mapeado'
        }, { status: 409 })
      }
      throw error
    }
    
    return NextResponse.json({
      success: true,
      mapping: data
    })
    
  } catch (error: any) {
    console.error('[HOTMART MAPPINGS POST] Error:', error)
    return NextResponse.json({
      error: 'Erro ao criar mapeamento',
      details: error.message
    }, { status: 500 })
  }
}

