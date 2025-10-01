/**
 * GATE 10.9 - Hotmart Integration - Status
 * Retorna status da integração Hotmart
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientAdmin } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientAdmin()
    
    // TODO: Obter org_id do contexto de autenticação
    const org_id = 'fb381d42-9cf8-41d9-b0ab-fdb706a85ae7'
    
    // Buscar integração
    const { data: integration, error } = await supabase
      .from('hotmart_integrations')
      .select('*')
      .eq('org_id', org_id)
      .single()
    
    if (error || !integration) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        message: 'Hotmart não configurado'
      })
    }
    
    // Verificar se token OAuth ainda é válido
    const tokenExpired = integration.token_expires_at 
      ? new Date(integration.token_expires_at) < new Date()
      : true
    
    return NextResponse.json({
      connected: integration.status === 'connected',
      status: integration.status,
      last_sync: integration.last_sync,
      token_valid: !tokenExpired,
      token_expires_at: integration.token_expires_at,
      error_message: integration.error_message
    })
    
  } catch (error: any) {
    console.error('[HOTMART STATUS] Error:', error)
    return NextResponse.json({
      error: 'Erro ao buscar status',
      details: error.message
    }, { status: 500 })
  }
}
