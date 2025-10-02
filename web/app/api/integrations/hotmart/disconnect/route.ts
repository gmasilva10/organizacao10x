/**
 * GATE 10.9 - Hotmart Integration - Disconnect
 * Remove integração Hotmart
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // TODO: Obter org_id do contexto de autenticação
    const org_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    
    // Desconectar (soft delete - manter histórico)
    const { error } = await supabase
      .from('hotmart_integrations')
      .update({
        status: 'disconnected',
        access_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('org_id', org_id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Hotmart desconectado com sucesso'
    })
    
  } catch (error: any) {
    console.error('[HOTMART DISCONNECT] Error:', error)
    return NextResponse.json({
      error: 'Erro ao desconectar',
      details: error.message
    }, { status: 500 })
  }
}

