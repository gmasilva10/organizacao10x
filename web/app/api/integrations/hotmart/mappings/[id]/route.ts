/**
 * GATE 10.9 - Hotmart Product Mapping by ID
 * Update e Delete de mapeamentos
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

// PATCH - Atualizar mapeamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientAdmin()
    const body = await request.json()
    
    const updateData: any = {}
    
    if (body.internal_plan_id) updateData.internal_plan_id = body.internal_plan_id
    if (typeof body.auto_create_student === 'boolean') updateData.auto_create_student = body.auto_create_student
    if (typeof body.auto_activate === 'boolean') updateData.auto_activate = body.auto_activate
    if (typeof body.trigger_onboarding === 'boolean') updateData.trigger_onboarding = body.trigger_onboarding
    if (typeof body.send_welcome_email === 'boolean') updateData.send_welcome_email = body.send_welcome_email
    if (typeof body.send_welcome_whatsapp === 'boolean') updateData.send_welcome_whatsapp = body.send_welcome_whatsapp
    
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('hotmart_product_mappings')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      mapping: data
    })
    
  } catch (error: any) {
    console.error('[HOTMART MAPPING PATCH] Error:', error)
    return NextResponse.json({
      error: 'Erro ao atualizar mapeamento',
      details: error.message
    }, { status: 500 })
  }
}

// DELETE - Remover mapeamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientAdmin()
    
    const { error } = await supabase
      .from('hotmart_product_mappings')
      .delete()
      .eq('id', params.id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Mapeamento removido'
    })
    
  } catch (error: any) {
    console.error('[HOTMART MAPPING DELETE] Error:', error)
    return NextResponse.json({
      error: 'Erro ao remover mapeamento',
      details: error.message
    }, { status: 500 })
  }
}
